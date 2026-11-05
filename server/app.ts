import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { bodyLimit } from "hono/body-limit";
import { secureHeaders } from "hono/secure-headers";
import { serveStatic } from "@hono/node-server/serve-static";
import { getConnInfo } from "@hono/node-server/conninfo";
import { randomUUID } from "node:crypto";
import { readFile, mkdir, writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import { z } from "zod";
import { db, now } from "./db";
import {
  documentRecord as doc,
  documents,
  lockContent,
  verifyMedia,
} from "./repository";
import { token, digest, hashPassword, checkPassword } from "./auth";
import {
  portalSchema,
  articleSchema,
  inquirySchema,
  serviceIds,
  type Article,
} from "../src/cms/schema";

type User = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor";
  active: boolean;
};
export const app = new Hono<{ Variables: { user: User; csrf: string } }>();
const uploadDir = resolve(process.env.UPLOAD_DIR || "data/uploads");
const origin = process.env.APP_ORIGIN || "http://127.0.0.1:3000";
const sessionCookie = "mangotek_session";

const audit = async (
  actor: string,
  action: string,
  target: string,
  trx: any = db,
) => {
  await trx("audit").insert({
    id: randomUUID(),
    actor_id: actor,
    action,
    target_id: target,
    created_at: now(),
  });
};
const fail = (message: string, status = 400) =>
  Object.assign(new Error(message), { status });
const isUnique = (e: any) =>
  ["23505", "ER_DUP_ENTRY", "SQLITE_CONSTRAINT_UNIQUE"].includes(e.code);
async function limit(key: string, max: number, ms: number) {
  const id = digest(key),
    time = Date.now();
  await db("rate_limits").where("reset_at", "<", time).delete();
  await db("rate_limits")
    .insert({ id, count: 0, reset_at: time + ms })
    .onConflict("id")
    .ignore();
  const changed = await db("rate_limits")
    .where({ id })
    .where("count", "<", max)
    .increment("count", 1);
  if (!changed) throw fail("Terlalu banyak permintaan. Coba lagi nanti.", 429);
}
function ip(c: any) {
  try {
    const remote = getConnInfo(c).remote.address || "unknown";
    const hops = Math.max(0, Number(process.env.TRUST_PROXY_HOPS) || 0);
    if (!hops) return remote;
    const chain = [
      ...(c.req.header("x-forwarded-for") || "")
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean),
      remote,
    ];
    return chain.at(-1 - hops) || remote;
  } catch {
    return "local-test";
  }
}
app.use(
  "*",
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  }),
);
app.use(
  "/api/*",
  bodyLimit({
    maxSize: 6 * 1024 * 1024,
    onError: (c) =>
      c.json({ error: "Berkas atau permintaan terlalu besar." }, 413),
  }),
);
app.use("/api/*", async (c, next) => {
  c.header("Cache-Control", "no-store");
  if (!["GET", "HEAD"].includes(c.req.method)) {
    const requestOrigin = c.req.header("origin");
    if (requestOrigin && requestOrigin !== origin)
      throw fail("Asal permintaan tidak diizinkan.", 403);
    if (c.req.header("sec-fetch-site") === "cross-site")
      throw fail("Permintaan lintas situs ditolak.", 403);
  }
  await next();
});
app.onError((e: any, c) => {
  if (e instanceof SyntaxError)
    return c.json({ error: "Format permintaan tidak valid." }, 400);
  if (e instanceof z.ZodError)
    return c.json(
      {
        error: e.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      },
      400,
    );
  if (isUnique(e))
    return c.json(
      { error: "Slug, email, atau data unik sudah digunakan." },
      409,
    );
  if (e.status) return c.json({ error: e.message }, e.status);
  console.error(`[server] ${e.name || "Error"} (${e.code || "internal"})`);
  return c.json(
    { error: "Permintaan belum dapat diproses. Silakan coba lagi." },
    500,
  );
});
app.post("/api/login", async (c) => {
  await limit(`login:${ip(c)}`, 20, 15 * 60e3);
  const v = z
    .object({ email: z.email(), password: z.string().max(200) })
    .parse(await c.req.json());
  await limit(`account:${v.email.toLowerCase()}`, 10, 15 * 60e3);
  const user = await db("users")
    .where({ email: v.email.toLowerCase(), active: true })
    .first();
  const dummy = "0".repeat(64) + ":" + "0".repeat(128);
  if (!(await checkPassword(v.password, user?.password || dummy)) || !user)
    throw fail("Email atau kata sandi tidak cocok.", 401);
  const session = token(),
    csrf = token();
  await db("sessions").where("expires_at", "<", now()).delete();
  await db("sessions").insert({
    id: digest(session),
    user_id: user.id,
    csrf,
    expires_at: new Date(Date.now() + 8 * 3600e3).toISOString(),
  });
  setCookie(c, sessionCookie, session, {
    httpOnly: true,
    secure: origin.startsWith("https:"),
    sameSite: "Lax",
    path: "/",
    maxAge: 8 * 3600,
  });
  return c.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    csrf,
  });
});
app.use("/api/office/*", async (c, next) => {
  const session = await db("sessions")
    .where({ id: digest(getCookie(c, sessionCookie) || "") })
    .where("expires_at", ">", now())
    .first();
  const user =
    session &&
    (await db("users").where({ id: session.user_id, active: true }).first());
  if (!user) throw fail("Silakan masuk kembali.", 401);
  if (
    !["GET", "HEAD"].includes(c.req.method) &&
    c.req.header("x-csrf-token") !== session.csrf
  )
    throw fail("Sesi formulir tidak valid. Muat ulang halaman.", 403);
  c.set("user", user);
  c.set("csrf", session.csrf);
  await next();
});
const admin = (c: any) => {
  if (c.get("user").role !== "admin")
    throw fail("Hanya admin yang dapat mengakses fitur ini.", 403);
};
app.get("/api/office/session", (c) => {
  const { id, name, email, role } = c.get("user");
  return c.json({ user: { id, name, email, role }, csrf: c.get("csrf") });
});
app.post("/api/office/logout", async (c) => {
  await db("sessions")
    .where({ id: digest(getCookie(c, sessionCookie) || "") })
    .delete();
  deleteCookie(c, sessionCookie, { path: "/" });
  return c.json({ ok: true });
});
app.get("/api/portal", async (c) => {
  const row = await db("documents").where({ id: "portal" }).first();
  return c.json(JSON.parse(row.published));
});
async function news(query: Record<string, string>) {
  const page = Math.max(1, Math.min(10000, Number(query.page) || 1));
  const rows = await db("documents")
    .where({ kind: "article" })
    .whereNotNull("published")
    .orderBy("published_at", "desc");
  const all = rows.map((r) => ({
    id: r.id,
    ...JSON.parse(r.published),
    publishedAt: r.published_at,
  }));
  const q = (query.q || "").slice(0, 200).toLocaleLowerCase("id");
  const filtered = all.filter(
    (a) =>
      (!query.category || a.category === query.category) &&
      (!q || `${a.title} ${a.summary}`.toLocaleLowerCase("id").includes(q)),
  );
  return {
    items: filtered.slice((page - 1) * 9, page * 9),
    total: filtered.length,
    page,
    categories: [...new Set(all.map((a) => a.category))],
  };
}
app.get("/api/news", async (c) => c.json(await news(c.req.query())));
app.get("/api/news/:slug", async (c) => {
  const row = await db("documents")
    .where({ published_slug: c.req.param("slug") })
    .whereNotNull("published")
    .first();
  if (!row) throw fail("Berita tidak ditemukan.", 404);
  return c.json({
    id: row.id,
    ...JSON.parse(row.published),
    publishedAt: row.published_at,
  });
});
app.get("/api/office/documents", async (c) =>
  c.json((await documents().orderBy("updated_at", "desc")).map(doc)),
);
app.post("/api/office/documents", async (c) => {
  const value = articleSchema.parse(await c.req.json());
  const id = randomUUID();
  await db.transaction(async (trx) => {
    await lockContent(trx);
    await verifyMedia(value, trx);
    await documents(trx).insert({
      id,
      kind: "article",
      revision: 1,
      status: "draft",
      draft: JSON.stringify(value),
      slug: value.slug,
      updated_at: now(),
    });
  });
  return c.json({ id }, 201);
});
app.put("/api/office/documents/:id", async (c) => {
  const id = c.req.param("id"),
    body = z
      .object({ revision: z.number().int(), content: z.unknown() })
      .parse(await c.req.json());
  return db.transaction(async (trx) => {
    await lockContent(trx);
    const row = await documents(trx).where({ id }).first();
    if (!row) throw fail("Konten tidak ditemukan.", 404);
    const value =
      row.kind === "portal"
        ? portalSchema.parse(body.content)
        : articleSchema.parse(body.content);
    if (row.kind === "portal" && c.get("user").role !== "admin") {
      const old = JSON.parse(row.draft);
      for (const field of ["identity", "theme", "navigation"])
        if (
          JSON.stringify(old[field]) !== JSON.stringify((value as any)[field])
        )
          throw fail("Pengaturan identitas hanya dapat diubah admin.", 403);
    }
    await verifyMedia(value, trx);
    const changed = await documents(trx)
      .where({ id, revision: body.revision })
      .update({
        draft: JSON.stringify(value),
        revision: body.revision + 1,
        status: "draft",
        updated_at: now(),
        ...(row.kind === "article" ? { slug: (value as Article).slug } : {}),
      });
    if (!changed)
      throw fail(
        "Konten telah diubah pengguna lain. Muat versi terbaru sebelum menyimpan.",
        409,
      );
    return c.json(doc((await documents(trx).where({ id }).first())!));
  });
});
app.post("/api/office/documents/:id/:action", async (c) => {
  const id = c.req.param("id"),
    action = c.req.param("action");
  if (!["review", "publish", "unpublish"].includes(action))
    throw fail("Tindakan tidak dikenal.", 404);
  if (action !== "review") admin(c);
  const { revision } = z
    .object({ revision: z.number().int() })
    .parse(await c.req.json());
  return db.transaction(async (trx) => {
    await lockContent(trx);
    const row = await trx("documents").where({ id }).first();
    if (!row) throw fail("Konten tidak ditemukan.", 404);
    if (action === "unpublish" && id === "portal")
      throw fail("Portal harus memiliki versi terbit.");
    const updates: any = {
      revision: revision + 1,
      updated_at: now(),
      status:
        action === "review"
          ? "review"
          : action === "publish"
            ? "published"
            : "draft",
    };
    if (action === "publish") {
      await verifyMedia(JSON.parse(row.draft), trx);
      updates.published = row.draft;
      updates.published_slug = row.slug;
      updates.published_at = row.published_at || now();
    }
    if (action === "unpublish") {
      updates.published = null;
      updates.published_slug = null;
      updates.published_at = null;
    }
    if (!(await trx("documents").where({ id, revision }).update(updates)))
      throw fail("Versi telah berubah. Muat ulang konten.", 409);
    if (action === "publish")
      await trx("versions").insert({
        id: randomUUID(),
        document_id: id,
        revision: revision + 1,
        content: row.draft,
        actor_id: c.get("user").id,
        created_at: now(),
      });
    await audit(c.get("user").id, action, id, trx);
    return c.json(doc(await trx("documents").where({ id }).first()));
  });
});
app.get("/api/office/media", async (c) =>
  c.json(await db("media").orderBy("created_at", "desc")),
);
app.post("/api/office/media", async (c) => {
  const body = await c.req.parseBody();
  const file = body.file;
  if (!(file instanceof File) || file.size > 5 * 1024 * 1024)
    throw fail("Unggah gambar maksimal 5 MB.");
  const input = Buffer.from(await file.arrayBuffer());
  let result: Buffer;
  try {
    const image = sharp(input, { limitInputPixels: 24e6 });
    const meta = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(meta.format || "")) throw Error();
    result = await image
      .rotate()
      .resize({
        width: 2000,
        height: 2000,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    throw fail("Format gambar harus JPEG, PNG, atau WebP yang valid.");
  }
  const id = randomUUID(),
    url = `/uploads/${id}.webp`;
  await mkdir(uploadDir, { recursive: true });
  await writeFile(resolve(uploadDir, `${id}.webp`), result);
  try {
    await db("media").insert({
      id,
      url,
      name: file.name.slice(0, 180),
      size: result.length,
      created_at: now(),
    });
  } catch (e) {
    await unlink(resolve(uploadDir, `${id}.webp`));
    throw e;
  }
  return c.json({ id, url }, 201);
});
app.delete("/api/office/media/:id", async (c) => {
  admin(c);
  const id = c.req.param("id");
  await db.transaction(async (trx) => {
    await lockContent(trx);
    const row = await trx("media").where({ id }).first();
    if (!row) throw fail("Media tidak ditemukan.", 404);
    const docs = await documents(trx).select("draft", "published");
    const versions = await trx("versions").select("content");
    if (
      [
        ...docs.map((d) => `${d.draft} ${d.published}`),
        ...versions.map((v) => v.content),
      ].some((s) => s.includes(row.url))
    )
      throw fail(
        "Media masih digunakan oleh konten atau versi publikasi.",
        409,
      );
    await trx("media").where({ id }).delete();
  });
  await unlink(resolve(uploadDir, `${id}.webp`)).catch(() => {});
  return c.json({ ok: true });
});

app.post("/api/inquiries", async (c) => {
  const v = inquirySchema.parse(await c.req.json());
  if (v.website) throw fail("Permintaan tidak dapat diterima.");
  const previous = await db("inquiries")
    .where({ request_id: v.requestId })
    .first();
  if (previous) return c.json({ ok: true });
  await limit(`inquiry:${ip(c)}`, 5, 60 * 60e3);
  try {
    await db("inquiries").insert({
      id: randomUUID(),
      request_id: v.requestId,
      name: v.name,
      organization: v.organization,
      email: v.email,
      phone: v.phone,
      services: JSON.stringify([...new Set(v.services)]),
      message: v.message,
      status: "new",
      notes: "",
      revision: 1,
      created_at: now(),
    });
  } catch (e) {
    if (!isUnique(e)) throw e;
  }
  return c.json({ ok: true }, 201);
});
function inquiryQuery(q: Record<string, string>) {
  let query = db("inquiries").orderBy("created_at", "desc");
  if (q.from) {
    z.iso.date().parse(q.from);
    query = query.where(
      "created_at",
      ">=",
      new Date(`${q.from}T00:00:00+07:00`).toISOString(),
    );
  }
  if (q.to) {
    z.iso.date().parse(q.to);
    query = query.where(
      "created_at",
      "<=",
      new Date(`${q.to}T23:59:59.999+07:00`).toISOString(),
    );
  }
  if (q.status)
    query = query.where(
      "status",
      z.enum(["new", "processing", "done"]).parse(q.status),
    );
  if (q.service)
    query = query.where(
      "services",
      "like",
      `%"${z.enum(serviceIds).parse(q.service)}"%`,
    );
  return query;
}
app.get("/api/office/inquiries", async (c) => {
  admin(c);
  return c.json(
    (await inquiryQuery(c.req.query())).map((r) => ({
      ...r,
      services: JSON.parse(r.services),
    })),
  );
});
app.put("/api/office/inquiries/:id", async (c) => {
  admin(c);
  const v = z
    .object({
      status: z.enum(["new", "processing", "done"]),
      notes: z.string().max(10000),
      revision: z.number().int(),
    })
    .parse(await c.req.json());
  const n = await db("inquiries")
    .where({ id: c.req.param("id"), revision: v.revision })
    .update({ ...v, revision: v.revision + 1 });
  if (!n) throw fail("Permintaan telah berubah. Muat ulang.", 409);
  await audit(c.get("user").id, "inquiry.update", c.req.param("id"));
  return c.json({ ok: true });
});
app.delete("/api/office/inquiries/:id", async (c) => {
  admin(c);
  await db("inquiries")
    .where({ id: c.req.param("id") })
    .delete();
  await audit(c.get("user").id, "inquiry.delete", c.req.param("id"));
  return c.json({ ok: true });
});
app.get("/api/office/reports.csv", async (c) => {
  admin(c);
  const rows = await inquiryQuery(c.req.query());
  const cell = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[\s]*[=+@\-\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  const lines = [
    [
      "Tanggal (Asia/Jakarta)",
      "Nama",
      "Organisasi",
      "Email",
      "WhatsApp",
      "Layanan",
      "Kebutuhan",
      "Status",
      "Catatan",
    ],
    ...rows.map((r) => [
      new Date(r.created_at).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
      }),
      r.name,
      r.organization,
      r.email,
      r.phone,
      JSON.parse(r.services).join(", "),
      r.message,
      r.status,
      r.notes,
    ]),
  ];
  c.header("Content-Type", "text/csv; charset=utf-8");
  c.header("Content-Disposition", 'attachment; filename="konsultasi.csv"');
  return c.body(
    "\uFEFF" + lines.map((r) => r.map(cell).join(",")).join("\r\n"),
  );
});
app.get("/api/office/users", async (c) => {
  admin(c);
  return c.json(
    await db("users").select(
      "id",
      "email",
      "name",
      "role",
      "active",
      "revision",
    ),
  );
});
const userSchema = z.object({
  name: z.string().min(1).max(180),
  email: z.email().max(180),
  role: z.enum(["admin", "editor"]),
  password: z.string().min(12).max(200),
});
app.post("/api/office/users", async (c) => {
  admin(c);
  const v = userSchema.parse(await c.req.json());
  const id = randomUUID();
  await db("users").insert({
    ...v,
    id,
    email: v.email.toLowerCase(),
    password: await hashPassword(v.password),
    active: true,
    revision: 1,
  });
  await audit(c.get("user").id, "user.create", id);
  return c.json({ id }, 201);
});
app.put("/api/office/users/:id", async (c) => {
  admin(c);
  const id = c.req.param("id");
  const v = z
    .object({
      password: z.string().min(12).max(200).optional(),
      active: z.boolean(),
      revision: z.number().int(),
    })
    .parse(await c.req.json());
  if (id === c.get("user").id && !v.active)
    throw fail("Akun sendiri tidak dapat dinonaktifkan.");
  await db.transaction(async (trx) => {
    if (
      !(await trx("users")
        .where({ id, revision: v.revision })
        .update({
          active: v.active,
          revision: v.revision + 1,
          ...(v.password ? { password: await hashPassword(v.password) } : {}),
        }))
    )
      throw fail("Pengguna telah berubah.", 409);
    await trx("sessions").where({ user_id: id }).delete();
    await audit(c.get("user").id, "user.update", id, trx);
  });
  return c.json({ ok: true });
});
app.get("/health", async (c) => {
  await db("documents").where({ id: "portal" }).first();
  return c.json({ ok: true });
});
app.get("/uploads/:file", async (c) => {
  const file = c.req.param("file");
  if (!/^[a-f0-9-]{36}\.webp$/.test(file)) return c.notFound();
  try {
    const data = await readFile(resolve(uploadDir, file));
    c.header("Content-Type", "image/webp");
    c.header("Cache-Control", "public, max-age=31536000, immutable");
    return c.body(data);
  } catch {
    return c.notFound();
  }
});
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (x) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        x
      ]!,
  );
async function shell(
  title = "MangoTek Edu",
  description = "Digitalisasi pendidikan dan infrastruktur sekolah.",
  content = "",
  image = "",
) {
  let html = await readFile("dist/index.html", "utf8");
  html = html
    .replace(/<title>.*?<\/title>/s, `<title>${escape(title)}</title>`)
    .replace(/<meta name="description"[^>]*>/g, "");
  return html
    .replace(
      "</head>",
      `<meta name="description" content="${escape(description)}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}">${image ? `<meta property="og:image" content="${escape(origin + image)}">` : ""}</head>`,
    )
    .replace('<div id="root"></div>', `<div id="root">${content}</div>`);
}
app.get("/berita/:slug", async (c) => {
  const r = await db("documents")
    .where({ published_slug: c.req.param("slug") })
    .whereNotNull("published")
    .first();
  if (!r)
    return c.html(
      await shell(
        "Berita tidak ditemukan",
        "",
        '<main><h1>Berita tidak ditemukan</h1><a href="/berita">Kembali ke berita</a></main>',
      ),
      404,
    );
  const a = JSON.parse(r.published) as Article;
  return c.html(
    await shell(
      a.seoTitle || a.title,
      a.seoDescription || a.summary,
      `<main><article><h1>${escape(a.title)}</h1><p>${escape(a.summary)}</p>${a.blocks.map((b) => `<${b.type === "heading" ? "h2" : b.type === "quote" ? "blockquote" : "p"}>${escape(b.text)}</${b.type === "heading" ? "h2" : b.type === "quote" ? "blockquote" : "p"}>`).join("")}</article></main>`,
      a.cover,
    ),
  );
});
app.get("/berita", async (c) => {
  const r = await news(c.req.query());
  return c.html(
    await shell(
      "Berita | MangoTek Edu",
      "Kabar dan kegiatan MangoTek Edu.",
      `<main><h1>Berita</h1>${r.items.map((a) => `<article><h2><a href="/berita/${a.slug}">${escape(a.title)}</a></h2><p>${escape(a.summary)}</p></article>`).join("")}</main>`,
    ),
  );
});
app.get("/", async (c) => c.html(await shell()));
app.get("/office", async (c) => {
  c.header("Cache-Control", "no-store");
  c.header("X-Robots-Tag", "noindex, nofollow");
  return c.html(await shell("Office | MangoTek Edu"));
});
app.get("/office/preview/:id", async (c) => {
  c.header("Cache-Control", "no-store");
  c.header("X-Robots-Tag", "noindex, nofollow");
  const s = await db("sessions")
    .where({ id: digest(getCookie(c, sessionCookie) || "") })
    .where("expires_at", ">", now())
    .first();
  if (!s || !(await db("users").where({ id: s.user_id, active: true }).first()))
    return c.redirect("/office");
  return c.html(await shell("Pratinjau konten | MangoTek Edu"));
});
app.use("*", serveStatic({ root: "./dist" }));
app.notFound((c) => c.text("Halaman tidak ditemukan", 404));
