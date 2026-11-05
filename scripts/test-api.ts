import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db, driver } from "../server/db";
import { migrationSource } from "../server/migrations";
import { hashPassword } from "../server/auth";
import { app } from "../server/app";
import { defaultPortal } from "../src/cms/schema";
import sharp from "sharp";
const email = `admin-${randomUUID()}@test.invalid`,
  editorEmail = `editor-${randomUUID()}@test.invalid`,
  password = "Test-only-" + randomUUID();
const userId = randomUUID(),
  editorId = randomUUID();
let cookie = "",
  csrf = "";
async function request(path: string, method = "GET", body?: any, auth = true) {
  return app.request(path, {
    method,
    headers: {
      ...(body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(auth ? { Cookie: cookie, "X-CSRF-Token": csrf } : {}),
    },
    ...(body === undefined
      ? {}
      : { body: body instanceof FormData ? body : JSON.stringify(body) }),
  });
}
if (driver !== "sqlite" && !/test|restore/i.test(process.env.DB_NAME || ""))
  throw Error("Gunakan DB_NAME khusus test/restore.");
if (driver === "sqlite" && !/test|restore/i.test(process.env.SQLITE_PATH || ""))
  throw Error("Gunakan SQLITE_PATH khusus test/restore.");
try {
  await db.migrate.latest({ migrationSource });
  await db.migrate.latest({ migrationSource });
  await db("rate_limits").delete();
  await db("users").insert([
    {
      id: userId,
      email,
      name: "Admin Test",
      role: "admin",
      password: await hashPassword(password),
      active: true,
    },
    {
      id: editorId,
      email: editorEmail,
      name: "Editor Test",
      role: "editor",
      password: await hashPassword(password),
      active: true,
    },
  ]);
  assert.equal(
    (await request("/api/office/documents", "GET", undefined, false)).status,
    401,
  );
  let response = await request(
    "/api/login",
    "POST",
    { email, password },
    false,
  );
  assert.equal(response.status, 200);
  cookie = response.headers.get("set-cookie")!.split(";")[0];
  csrf = (await response.json()).csrf;
  const adminCookie = cookie,
    adminCsrf = csrf;
  const a = {
    title: "Berita pengujian",
    slug: "uji-" + randomUUID(),
    summary: "Ringkasan kegiatan sekolah.",
    cover: "",
    coverAlt: "",
    category: "Kegiatan",
    blocks: [
      { type: "paragraph", text: "Isi berita aman <script>alert(1)</script>" },
    ],
    seoTitle: "Judul SEO pengujian",
    seoDescription: "Deskripsi SEO berita.",
  };
  response = await request("/api/office/documents", "POST", a);
  assert.equal(response.status, 201);
  const { id } = await response.json();
  assert.equal((await request(`/api/news/${a.slug}`)).status, 404);
  assert.equal(
    (
      await app.request("/api/office/documents/" + id, {
        method: "PUT",
        headers: { Cookie: cookie, "Content-Type": "application/json" },
        body: JSON.stringify({ revision: 1, content: a }),
      })
    ).status,
    403,
  );
  response = await request(`/api/office/documents/${id}`, "PUT", {
    revision: 1,
    content: { ...a, title: "Perubahan" },
  });
  assert.equal(response.status, 200);
  assert.equal(
    (
      await request(`/api/office/documents/${id}`, "PUT", {
        revision: 1,
        content: a,
      })
    ).status,
    409,
  );
  response = await request(
    "/api/login",
    "POST",
    { email: editorEmail, password },
    false,
  );
  cookie = response.headers.get("set-cookie")!.split(";")[0];
  csrf = (await response.json()).csrf;
  assert.equal((await request("/api/office/inquiries")).status, 403);
  assert.equal((await request("/api/office/users")).status, 403);
  assert.equal(
    (
      await request(`/api/office/documents/${id}/publish`, "POST", {
        revision: 2,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request(`/api/office/documents/${id}/review`, "POST", {
        revision: 2,
      })
    ).status,
    200,
  );
  const portal = (await (await request("/api/office/documents")).json()).find(
    (d: any) => d.id === "portal",
  );
  assert.equal(
    (
      await request("/api/office/documents/portal", "PUT", {
        revision: portal.revision,
        content: {
          ...portal.draft,
          identity: { ...defaultPortal.identity, name: "Illegal" },
        },
      })
    ).status,
    403,
  );
  cookie = adminCookie;
  csrf = adminCsrf;
  const portalContent = {
    ...portal.draft,
    about: { ...portal.draft.about, title: "Judul dari office" },
  };
  assert.equal(
    (
      await request("/api/office/documents/portal", "PUT", {
        revision: portal.revision,
        content: portalContent,
      })
    ).status,
    200,
  );
  assert.notEqual(
    (await (await request("/api/portal")).json()).about.title,
    "Judul dari office",
  );
  assert.equal(
    (
      await request("/api/office/documents/portal/publish", "POST", {
        revision: portal.revision + 1,
      })
    ).status,
    200,
  );
  assert.equal(
    (await (await request("/api/portal")).json()).about.title,
    "Judul dari office",
  );
  assert.equal(
    (
      await request("/api/office/documents/portal", "PUT", {
        revision: portal.revision + 2,
        content: portal.draft,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request("/api/office/documents/portal/publish", "POST", {
        revision: portal.revision + 3,
      })
    ).status,
    200,
  );

  assert.equal(
    (
      await request(`/api/office/documents/${id}/publish`, "POST", {
        revision: 3,
      })
    ).status,
    200,
  );
  assert.equal((await request(`/api/news/${a.slug}`)).status, 200);
  response = await request(`/berita/${a.slug}`);
  const html = await response.text();
  assert(html.includes("Judul SEO pengujian"));
  assert(html.includes("&lt;script&gt;"));
  assert(!html.includes("<script>alert"));
  assert.equal(
    (
      await request(`/api/office/documents/${id}`, "PUT", {
        revision: 4,
        content: { ...a, title: "Draf rahasia" },
      })
    ).status,
    200,
  );
  assert.equal(
    (await (await request(`/api/news/${a.slug}`)).json()).title,
    "Perubahan",
  );
  assert.equal(
    (await request("/office/preview/" + id, "GET", undefined, false)).status,
    302,
  );
  const png = await sharp({
    create: { width: 20, height: 20, channels: 3, background: "#ffbb44" },
  })
    .png()
    .toBuffer();
  const form = new FormData();
  form.set(
    "file",
    new File([new Uint8Array(png)], "uji.png", { type: "image/png" }),
  );
  response = await request("/api/office/media", "POST", form);
  assert.equal(response.status, 201);
  const media = await response.json();
  const bad = new FormData();
  bad.set("file", new File(["<svg/>"], "bad.png", { type: "image/png" }));
  assert.equal((await request("/api/office/media", "POST", bad)).status, 400);
  assert.equal(
    (
      await request(`/api/office/documents/${id}`, "PUT", {
        revision: 5,
        content: { ...a, cover: media.url, coverAlt: "Gambar uji" },
      })
    ).status,
    200,
  );
  assert.equal(
    (await request("/api/office/media/" + media.id, "DELETE")).status,
    409,
  );
  const inquiry = {
    name: '=HYPERLINK("bad")',
    organization: "Sekolah Uji",
    email: "sekolah@test.invalid",
    phone: "",
    services: ["learning", "network"],
    message: "Kami membutuhkan jaringan sekolah.",
    consent: true,
    website: "",
    requestId: randomUUID(),
  };
  assert.equal(
    (
      await request(
        "/api/inquiries",
        "POST",
        { ...inquiry, email: "", phone: "" },
        false,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        "/api/inquiries",
        "POST",
        { ...inquiry, website: "spam" },
        false,
      )
    ).status,
    400,
  );
  assert.equal(
    (await request("/api/inquiries", "POST", inquiry, false)).status,
    201,
  );
  assert.equal(
    (await request("/api/inquiries", "POST", inquiry, false)).status,
    200,
  );
  const rows = await (
    await request("/api/office/inquiries?service=network")
  ).json();
  const row = rows.find((r: any) => r.request_id === inquiry.requestId);
  assert(row);
  assert.equal(
    rows.filter((r: any) => r.request_id === inquiry.requestId).length,
    1,
  );
  assert.equal(
    (
      await request(`/api/office/inquiries/${row.id}`, "PUT", {
        status: "processing",
        notes: "Akan dihubungi.",
        revision: 1,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request(`/api/office/inquiries/${row.id}`, "PUT", {
        status: "done",
        notes: "",
        revision: 1,
      })
    ).status,
    409,
  );
  const csv = await (
    await request("/api/office/reports.csv?status=processing")
  ).text();
  assert(csv.includes("'=HYPERLINK"));
  assert(csv.includes("Akan dihubungi."));
  assert.equal(
    (
      await request(`/api/office/documents/${id}/unpublish`, "POST", {
        revision: 6,
      })
    ).status,
    200,
  );
  assert.equal((await request(`/berita/${a.slug}`)).status, 404);
  await request(`/api/office/inquiries/${row.id}`, "DELETE");
  await db("documents").where({ id }).delete();
  await request("/api/office/media/" + media.id, "DELETE");
  await request("/api/office/logout", "POST");
  assert.equal((await request("/api/office/session")).status, 401);
  console.log(
    `PASS ${driver}: migrations, auth/roles/CSRF, drafts/review/publish, concurrency, SSR/SEO, media, inquiries/idempotency, filters, CSV, logout`,
  );
} finally {
  await db("users").whereIn("id", [userId, editorId]).delete();
  await db.destroy();
}
