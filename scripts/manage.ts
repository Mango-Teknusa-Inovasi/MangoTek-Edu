import "dotenv/config";
import { input, password, select } from "@inquirer/prompts";
import { randomUUID } from "node:crypto";
import { writeFile, readFile, mkdir, cp } from "node:fs/promises";
import { resolve, dirname } from "node:path";
const command = process.argv[2];
async function main() {
  if (command === "setup") {
    const driver = await select({
      message: "Database untuk instalasi ini",
      choices: [
        { name: "SQLite — satu berkas lokal", value: "sqlite" },
        { name: "PostgreSQL", value: "postgres" },
        { name: "MariaDB", value: "mariadb" },
      ],
    });
    const origin = await input({
      message: "Alamat portal",
      default: "http://127.0.0.1:3000",
      validate: (v) => {
        try {
          return ["http:", "https:"].includes(new URL(v).protocol);
        } catch {
          return false;
        }
      },
    });
    const name =
      driver === "sqlite"
        ? ""
        : await input({
            message: "Nama database",
            default: "mangotek",
            validate: (v) => /^[a-zA-Z0-9_]+$/.test(v),
          });
    const pass =
      driver === "sqlite"
        ? ""
        : await password({
            message: "Kata sandi database (minimal 16 karakter)",
            mask: "*",
            validate: (v) => v.length >= 16 && !/[\n\r'"$#\\]/.test(v),
          });
    const env = `DB_DRIVER=${driver}\nAPP_ORIGIN=${new URL(origin).origin}\nPORT=3000\nHOST=127.0.0.1\nSQLITE_PATH=data/portal.sqlite\nUPLOAD_DIR=data/uploads\nDB_HOST=127.0.0.1\nDB_NAME=${name || "mangotek"}\nDB_USER=mangotek\nDB_PASSWORD=${pass}\nCOMPOSE_PROFILES=${driver === "sqlite" ? "" : driver}\n`;
    await writeFile(".env", env, { flag: "wx", mode: 0o600 });
    console.log(
      "Konfigurasi tersimpan. Jalankan npm run db:migrate lalu npm run admin:create. Docker: docker compose up -d --build, lalu jalankan migrasi dan admin:create melalui docker compose exec app.",
    );
    return;
  }
  const { db, driver } = await import("../server/db");
  const { migrationSource } = await import("../server/migrations");
  try {
    if (command === "migrate") {
      for (let attempt = 0; ; attempt++) {
        try {
          await db.raw("select 1");
          break;
        } catch (e) {
          if (attempt >= 29) throw e;
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
      await db.migrate.latest({ migrationSource });
      console.log(`Migrasi ${driver} selesai.`);
    } else if (command === "admin" || command === "reset") {
      const email = (
        await input({
          message: "Email admin",
          validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        })
      ).toLowerCase();
      const existing = await db("users").where({ email }).first();
      if (
        command === "admin" &&
        (await db("users").where({ role: "admin" }).first())
      )
        throw Error(
          "Admin awal sudah dibuat. Tambahkan pengguna melalui /office.",
        );
      if (command === "reset" && !existing)
        throw Error("Pengguna tidak ditemukan.");
      const name =
        command === "admin"
          ? await input({
              message: "Nama",
              validate: (v) => v.trim().length > 0,
            })
          : existing.name;
      const secret = await password({
        message: "Kata sandi (minimal 12 karakter)",
        mask: "*",
        validate: (v) => v.length >= 12 && v.length <= 200,
      });
      const repeat = await password({
        message: "Ulangi kata sandi",
        mask: "*",
      });
      if (secret !== repeat) throw Error("Kata sandi tidak sama.");
      const { hashPassword } = await import("../server/auth");
      const hash = await hashPassword(secret);
      if (command === "admin")
        await db("users").insert({
          id: randomUUID(),
          email,
          name,
          role: "admin",
          password: hash,
          active: true,
          revision: 1,
        });
      else
        await db.transaction(async (trx) => {
          await trx("users")
            .where({ id: existing.id })
            .update({
              password: hash,
              active: true,
              revision: existing.revision + 1,
            });
          await trx("sessions").where({ user_id: existing.id }).delete();
        });
      console.log("Akun siap digunakan.");
    } else if (command === "backup") {
      if (driver !== "sqlite")
        throw Error(
          "Gunakan pg_dump atau mariadb-dump sesuai README untuk engine ini.",
        );
      const target = resolve(
        process.argv[3] ||
          `backups/${new Date().toISOString().replaceAll(":", "-")}`,
      );
      await mkdir(target, { recursive: true });
      const connection = await db.client.acquireConnection();
      try {
        await connection.backup(resolve(target, "portal.sqlite"));
      } finally {
        await db.client.releaseConnection(connection);
      }
      await cp(
        resolve(process.env.UPLOAD_DIR || "data/uploads"),
        resolve(target, "uploads"),
        { recursive: true },
      ).catch((e: any) => {
        if (e.code !== "ENOENT") throw e;
      });
      console.log(`Cadangan tersimpan di ${target}`);
    } else throw Error("Perintah: setup, migrate, admin, reset, backup");
  } finally {
    await db.destroy();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
