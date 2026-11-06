import "dotenv/config";
import { mkdir, writeFile, unlink, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { resolve } from "node:path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

export type StorageDriver = "local" | "s3";
export interface MediaLocation {
  storage_driver: StorageDriver;
  storage_key: string | null;
  storage_bucket: string | null;
}
export interface StoredImage {
  body: ReadableStream<Uint8Array>;
  size?: number;
}
export interface ImageStorage {
  driver: StorageDriver;
  put(file: string, data: Buffer): Promise<MediaLocation>;
  get(file: string, location: MediaLocation): Promise<StoredImage>;
  remove(file: string, location: MediaLocation): Promise<void>;
}
const storageError = () =>
  Object.assign(
    new Error("Penyimpanan gambar belum dapat dijangkau. Silakan coba lagi."),
    { status: 503 },
  );
export function createImageStorage(
  env: NodeJS.ProcessEnv = process.env,
): ImageStorage {
  const driver = env.STORAGE_DRIVER || "local";
  if (driver !== "local" && driver !== "s3")
    throw Error("STORAGE_DRIVER must be local or s3.");
  const directory = resolve(env.UPLOAD_DIR || "data/uploads");
  const prefix = env.S3_PREFIX ?? "uploads";
  if (prefix.startsWith("/") || prefix.includes("..") || /[\\?#]/.test(prefix))
    throw Error(
      "S3_PREFIX must be a relative object prefix without traversal.",
    );
  let client: S3Client | undefined;
  const s3 = () => {
    if (client) return client;
    for (const name of [
      "S3_BUCKET",
      "S3_REGION",
      "S3_ACCESS_KEY_ID",
      "S3_SECRET_ACCESS_KEY",
    ]) {
      if (!env[name]?.trim())
        throw Error(`${name} is required for S3 storage.`);
    }
    if (env.S3_ENDPOINT) {
      const endpoint = new URL(env.S3_ENDPOINT);
      if (
        !["http:", "https:"].includes(endpoint.protocol) ||
        endpoint.username ||
        endpoint.password ||
        endpoint.search ||
        endpoint.hash
      )
        throw Error(
          "S3_ENDPOINT must be an HTTP(S) endpoint without credentials or query parameters.",
        );
    }
    if (
      env.S3_FORCE_PATH_STYLE &&
      !["true", "false"].includes(env.S3_FORCE_PATH_STYLE)
    )
      throw Error("S3_FORCE_PATH_STYLE must be true or false.");
    client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT || undefined,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID!,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: env.S3_FORCE_PATH_STYLE === "true",
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
      maxAttempts: 2,
      requestHandler: { connectionTimeout: 5000, requestTimeout: 20000 },
    });
    return client;
  };
  if (driver === "s3") s3();
  const filename = (file: string) => {
    if (!/^[a-f0-9-]{36}\.webp$/.test(file))
      throw Error("Invalid media filename.");
    return resolve(directory, file);
  };
  const remote = async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      return await operation();
    } catch (error: any) {
      if (
        error.$metadata?.httpStatusCode === 404 ||
        ["NoSuchKey", "NotFound"].includes(error.name)
      )
        throw Object.assign(new Error("Gambar tidak ditemukan."), {
          status: 404,
        });
      throw storageError();
    }
  };
  return {
    driver,
    async put(file, data) {
      filename(file);
      if (driver === "local") {
        await mkdir(directory, { recursive: true });
        await writeFile(filename(file), data, { flag: "wx" });
        return {
          storage_driver: "local",
          storage_key: file,
          storage_bucket: null,
        };
      }
      const key = [prefix.replace(/\/$/, ""), file].filter(Boolean).join("/");
      await remote(() =>
        s3().send(
          new PutObjectCommand({
            Bucket: env.S3_BUCKET,
            Key: key,
            Body: data,
            ContentType: "image/webp",
            CacheControl: "public, max-age=31536000, immutable",
          }),
        ),
      );
      return {
        storage_driver: "s3",
        storage_key: key,
        storage_bucket: env.S3_BUCKET!,
      };
    },
    async get(file, location) {
      filename(file);
      if (location.storage_driver === "s3") {
        const object = await remote(() =>
          s3().send(
            new GetObjectCommand({
              Bucket: location.storage_bucket!,
              Key: location.storage_key!,
            }),
          ),
        );
        if (!object.Body)
          throw Object.assign(new Error("Gambar tidak ditemukan."), {
            status: 404,
          });
        return {
          body: object.Body.transformToWebStream(),
          size: object.ContentLength,
        };
      }
      const info = await stat(filename(file));
      return {
        body: Readable.toWeb(
          createReadStream(filename(file)),
        ) as ReadableStream<Uint8Array>,
        size: info.size,
      };
    },
    async remove(file, location) {
      filename(file);
      if (location.storage_driver === "s3") {
        await remote(() =>
          s3().send(
            new DeleteObjectCommand({
              Bucket: location.storage_bucket!,
              Key: location.storage_key!,
            }),
          ),
        );
      } else {
        await unlink(filename(file)).catch((error) => {
          if (error.code !== "ENOENT") throw error;
        });
      }
    },
  };
}
export const imageStorage = createImageStorage();
