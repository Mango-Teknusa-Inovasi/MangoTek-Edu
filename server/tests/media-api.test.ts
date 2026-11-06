import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
const directory = await mkdtemp(join(tmpdir(), "mangotek-media-api-test-"));
process.env.DB_DRIVER = "sqlite";
process.env.SQLITE_PATH = join(directory, "test.sqlite");
process.env.UPLOAD_DIR = join(directory, "uploads");
process.env.STORAGE_DRIVER = "local";
delete process.env.DATABASE_URL;
const { db } = await import("../db");
const { migrationSource } = await import("../migrations");
const { imageStorage } = await import("../storage");
const { app } = await import("../app");
const { hashPassword } = await import("../auth");
let cookie = "",
  csrf = "",
  png: Buffer;
async function upload(name: string) {
  const form = new FormData();
  form.set(
    "file",
    new File([new Uint8Array(png)], name, { type: "image/png" }),
  );
  return app.request("/api/office/media", {
    method: "POST",
    headers: { Cookie: cookie, "X-CSRF-Token": csrf },
    body: form,
  });
}
before(async () => {
  // Build a real pre-upgrade row before applying the additive migration.
  await (await migrationSource.getMigration("001_cms")).up(db);
  const old = randomUUID();
  await imageStorage.put(old + ".webp", Buffer.from("legacy-image"));
  await db("media").insert({
    id: old,
    url: `/uploads/${old}.webp`,
    name: "legacy.png",
    size: 12,
    created_at: new Date().toISOString(),
  });
  await (await migrationSource.getMigration("002_media_storage")).up(db);
  await (await migrationSource.getMigration("002_media_storage")).up(db);
  const row = await db("media").where({ id: old }).first();
  assert.equal(row.storage_driver, "local");
  assert.equal(row.storage_key, null);
  const read = await app.request(row.url);
  assert.equal(read.status, 200);
  assert.equal(await read.text(), "legacy-image");
  await db("media").where({ id: old }).delete();
  await imageStorage.remove(old + ".webp", row);
  const password = randomUUID();
  await db("users").insert({
    id: randomUUID(),
    email: "media@test.invalid",
    name: "Media Test",
    role: "admin",
    password: await hashPassword(password),
    active: true,
  });
  const login = await app.request("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "media@test.invalid", password }),
  });
  cookie = login.headers.get("set-cookie")!.split(";")[0];
  csrf = (await login.json()).csrf;
  png = await sharp({
    create: {
      width: 2500,
      height: 100,
      channels: 4,
      background: { r: 1, g: 90, b: 40, alpha: 0.5 },
    },
  })
    .png()
    .toBuffer();
});
after(async () => {
  await db.destroy();
  await rm(directory, { recursive: true, force: true });
});
test("failed database registration cleans up the newly stored image", async () => {
  await db.raw(
    `CREATE TRIGGER reject_test_media BEFORE INSERT ON media WHEN NEW.name = 'fail-db.png' BEGIN SELECT RAISE(ABORT, 'test failure'); END`,
  );
  try {
    assert.equal((await upload("fail-db.png")).status, 500);
    assert.equal((await db("media")).length, 0);
    assert.deepEqual(await readdir(join(directory, "uploads")), []);
  } finally {
    await db.raw("DROP TRIGGER reject_test_media");
  }
});
test("image optimization preserves alpha and delete failure leaves media available for retry", async () => {
  const response = await upload("transparent.png");
  assert.equal(response.status, 201);
  const asset = await response.json();
  assert.equal(asset.width, 2000);
  assert.equal(asset.height, 80);
  const delivered = await app.request(asset.url);
  const metadata = await sharp(
    Buffer.from(await delivered.arrayBuffer()),
  ).metadata();
  assert.equal(metadata.hasAlpha, true);
  const original = imageStorage.remove;
  imageStorage.remove = async () => {
    throw Object.assign(new Error("Storage unavailable"), { status: 503 });
  };
  try {
    assert.equal(
      (
        await app.request("/api/office/media/" + asset.id, {
          method: "DELETE",
          headers: { Cookie: cookie, "X-CSRF-Token": csrf },
        })
      ).status,
      503,
    );
    assert(await db("media").where({ id: asset.id }).first());
  } finally {
    imageStorage.remove = original;
  }
  assert.equal(
    (
      await app.request("/api/office/media/" + asset.id, {
        method: "DELETE",
        headers: { Cookie: cookie, "X-CSRF-Token": csrf },
      })
    ).status,
    200,
  );
  assert.equal((await app.request(asset.url)).status, 404);
});
