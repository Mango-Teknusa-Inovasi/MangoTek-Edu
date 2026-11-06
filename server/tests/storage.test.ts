import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  S3Client,
  CreateBucketCommand,
  DeleteBucketCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { createImageStorage } from "../storage";

test("local media roundtrip, legacy locations, and path validation", async () => {
  const directory = await mkdtemp(join(tmpdir(), "mangotek-storage-"));
  try {
    const storage = createImageStorage({
      STORAGE_DRIVER: "local",
      UPLOAD_DIR: directory,
    });
    const name = randomUUID() + ".webp",
      data = Buffer.from("test image bytes");
    const location = await storage.put(name, data);
    assert.equal(location.storage_driver, "local");
    const object = await storage.get(name, { ...location, storage_key: null });
    assert.equal(object.size, data.length);
    assert.deepEqual(
      Buffer.from(await new Response(object.body).arrayBuffer()),
      data,
    );
    await assert.rejects(storage.put("../unsafe.webp", data), /Invalid/);
    await storage.remove(name, location);
    await assert.rejects(storage.get(name, location), { code: "ENOENT" });
    await storage.remove(name, location);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
test("storage configuration rejects incomplete cloud settings without local fallback", () => {
  assert.throws(
    () => createImageStorage({ STORAGE_DRIVER: "wrong" }),
    /STORAGE_DRIVER/,
  );
  assert.throws(
    () => createImageStorage({ STORAGE_DRIVER: "s3" }),
    /S3_BUCKET/,
  );
  assert.throws(() => createImageStorage({ S3_PREFIX: "../bad" }), /S3_PREFIX/);
  const config = {
    STORAGE_DRIVER: "s3",
    S3_BUCKET: "test",
    S3_REGION: "auto",
    S3_ACCESS_KEY_ID: "test",
    S3_SECRET_ACCESS_KEY: "test",
  };
  assert.throws(
    () =>
      createImageStorage({
        ...config,
        S3_ENDPOINT: "https://user:password@example.com",
      }),
    /S3_ENDPOINT/,
  );
  assert.throws(
    () => createImageStorage({ ...config, S3_FORCE_PATH_STYLE: "invalid" }),
    /S3_FORCE_PATH_STYLE/,
  );
});
test(
  "S3-compatible bucket roundtrip, mixed storage, missing objects, and storage outages",
  { skip: !process.env.TEST_S3_ENDPOINT },
  async () => {
    const endpoint = process.env.TEST_S3_ENDPOINT!;
    const bucket = "mangotek-test-" + randomUUID();
    const directory = await mkdtemp(join(tmpdir(), "mangotek-s3-"));
    const config = {
      STORAGE_DRIVER: "s3",
      UPLOAD_DIR: directory,
      S3_BUCKET: bucket,
      S3_ENDPOINT: endpoint,
      S3_REGION: "us-east-1",
      S3_ACCESS_KEY_ID: "test",
      S3_SECRET_ACCESS_KEY: "test",
      S3_FORCE_PATH_STYLE: "true",
      S3_PREFIX: "portal/images",
    };
    const client = new S3Client({
      endpoint,
      region: config.S3_REGION,
      credentials: { accessKeyId: "test", secretAccessKey: "test" },
      forcePathStyle: true,
      requestChecksumCalculation: "WHEN_REQUIRED",
    });
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
    const storage = createImageStorage(config),
      name = randomUUID() + ".webp",
      data = Buffer.from("cloud image bytes");
    try {
      const location = await storage.put(name, data);
      assert.equal(location.storage_bucket, bucket);
      assert.equal(location.storage_key, "portal/images/" + name);
      const object = await storage.get(name, location);
      assert.deepEqual(
        Buffer.from(await new Response(object.body).arrayBuffer()),
        data,
      );
      const local = createImageStorage({ ...config, STORAGE_DRIVER: "local" }),
        localName = randomUUID() + ".webp";
      const localLocation = await local.put(localName, data);
      assert.deepEqual(
        Buffer.from(
          await new Response(
            (await storage.get(localName, localLocation)).body,
          ).arrayBuffer(),
        ),
        data,
      );
      assert.deepEqual(
        Buffer.from(
          await new Response(
            (await local.get(name, location)).body,
          ).arrayBuffer(),
        ),
        data,
      );
      await local.remove(localName, localLocation);
      await storage.remove(name, location);
      await assert.rejects(storage.get(name, location), { status: 404 });
      const unavailable = createImageStorage({
        ...config,
        S3_ENDPOINT: "http://127.0.0.1:1",
      });
      await assert.rejects(unavailable.put(randomUUID() + ".webp", data), {
        status: 503,
      });
      assert.equal(
        (await client.send(new ListObjectsV2Command({ Bucket: bucket })))
          .KeyCount,
        0,
      );
    } finally {
      await client.send(new DeleteBucketCommand({ Bucket: bucket }));
      client.destroy();
      await rm(directory, { recursive: true, force: true });
    }
  },
);
