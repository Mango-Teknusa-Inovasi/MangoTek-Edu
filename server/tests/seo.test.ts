import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

const temp = await mkdtemp(join(tmpdir(), "mangotek-seo-test-"));
process.env.DB_DRIVER = "sqlite";
process.env.SQLITE_PATH = join(temp, "test.sqlite");
process.env.UPLOAD_DIR = join(temp, "uploads");
process.env.APP_ORIGIN = "https://ppti.me";
delete process.env.DATABASE_URL;
const { db } = await import("../db");
const { app } = await import("../app");
const { migrationSource } = await import("../migrations");
const { defaultPortal, productSchema, portalSchema } = await import(
  "../../src/cms/schema"
);
const { hashPassword } = await import("../auth");
const product = {
  title: "Fixture product",
  slug: "fixture-product",
  summary: "A product used only in isolated tests.",
  category: "Education",
  cover: "/school-poster.png",
  coverAlt: "Test school",
  blocks: [{ type: "paragraph", text: "Published product explanation." }],
  screenshots: [
    {
      image: "/school-poster.png",
      alt: "Screenshot example",
      caption: "Example caption",
    },
  ],
  videoUrl: "https://example.com/demo.mp4",
  videoTranscript: "Video describes a school workflow.",
  websiteUrl: "https://example.com",
  seoTitle: "",
  seoDescription: "",
};
const article = {
  title: "Fixture news",
  slug: "fixture-news",
  summary: "Public news summary.",
  cover: "",
  coverAlt: "",
  category: "News",
  blocks: [{ type: "paragraph", text: "Public news body." }],
  seoTitle: "",
  seoDescription: "",
};
let cookie = "",
  csrf = "",
  editorCookie = "",
  editorCsrf = "";
async function request(
  path: string,
  method = "GET",
  data?: unknown,
  editor = false,
) {
  return app.request(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Origin: "https://ppti.me",
      Cookie: editor ? editorCookie : cookie,
      "X-CSRF-Token": editor ? editorCsrf : csrf,
    },
    ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
  });
}
before(async () => {
  await db.migrate.latest({ migrationSource });
  for (const role of ["admin", "editor"]) {
    const email = `${role}@test.invalid`,
      password = randomUUID();
    await db("users").insert({
      id: randomUUID(),
      email,
      name: role,
      role,
      password: await hashPassword(password),
      active: true,
    });
    const r = await request("/api/login", "POST", { email, password });
    assert.equal(r.status, 200);
    const payload = await r.json();
    if (role === "admin") {
      cookie = r.headers.get("set-cookie")!.split(";")[0];
      csrf = payload.csrf;
    } else {
      editorCookie = r.headers.get("set-cookie")!.split(";")[0];
      editorCsrf = payload.csrf;
    }
  }
});
after(async () => {
  await db.destroy();
  await rm(temp, { recursive: true, force: true });
});

test("home is readable without JavaScript and includes canonical, social metadata, geography and safe JSON-LD", async () => {
  const response = await request("/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /rel="canonical" href="https:\/\/ppti.me\/"/);
  assert.match(html, /billing@ppti.me/);
  assert.match(html, /ID-JI/);
  for (const service of defaultPortal.services)
    assert.ok(html.includes(service.description));
  const graph = JSON.parse(
    html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)![1],
  );
  assert.equal(
    graph["@graph"].find((v: any) => v["@type"] === "FAQPage").mainEntity
      .length,
    defaultPortal.faqs.length,
  );
  assert.match(html, /og:image:width" content="1200"/);
  assert.match(html, /twitter:card" content="summary_large_image"/);
  assert.doesNotMatch(
    html.replace(/<script id="portal-bootstrap"[\s\S]*?<\/script>/, ""),
    /Telah dipercaya oleh/,
  );
});

test("robots allows public assets and sitemap excludes private routes", async () => {
  const robots = await (await request("/robots.txt")).text();
  assert.match(robots, /Sitemap: https:\/\/ppti.me\/sitemap.xml/);
  assert.match(robots, /Disallow: \/office/);
  assert.doesNotMatch(robots, /Disallow: \/assets/);
  const sitemap = await (await request("/sitemap.xml")).text();
  assert.match(sitemap, /https:\/\/ppti.me\/produk/);
  assert.doesNotMatch(sitemap, /office|api\/|health|llms/);
  assert.equal(
    (await request("/office")).headers.get("x-robots-tag"),
    "noindex, nofollow",
  );
  assert.equal(
    (await request("/api/portal")).headers.get("x-robots-tag"),
    "noindex, nofollow",
  );
});

test("product draft, review, publication, revision isolation, sitemap, article separation and withdrawal", async () => {
  const r = await request("/api/office/documents", "POST", {
    ...product,
    kind: "product",
  });
  assert.equal(r.status, 201);
  const { id } = await r.json();
  assert.equal((await request("/produk/fixture-product")).status, 404);
  assert.equal((await request("/api/products/fixture-product")).status, 404);
  for (const path of ["/sitemap.xml", "/llms.txt", "/llms-full.txt"])
    assert.doesNotMatch(await (await request(path)).text(), /Fixture product/);
  assert.equal(
    (
      await request(
        `/api/office/documents/${id}/publish`,
        "POST",
        { revision: 1 },
        true,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await request(
        `/api/office/documents/${id}/review`,
        "POST",
        { revision: 1 },
        true,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await request(`/api/office/documents/${id}/publish`, "POST", {
        revision: 2,
      })
    ).status,
    200,
  );
  const published = await (await request("/produk/fixture-product")).text();
  assert.match(published, /Screenshot example/);
  assert.match(published, /Video describes a school workflow/);
  assert.match(published, /CreativeWork/);
  assert.equal((await request("/api/news/fixture-product")).status, 404);
  assert.equal((await request("/berita/fixture-product")).status, 404);
  assert.match(
    await (await request("/sitemap.xml")).text(),
    /produk\/fixture-product/,
  );
  assert.match(
    await (await request("/llms-full.txt")).text(),
    /Fixture product/,
  );
  assert.match(
    await (await request("/produk/fixture-product.md")).text(),
    /Screenshot example/,
  );
  assert.equal(
    (
      await request(`/api/office/documents/${id}`, "PUT", {
        revision: 3,
        content: { ...product, title: "SECRET DRAFT REVISION" },
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request(`/api/office/documents/${id}`, "PUT", {
        revision: 3,
        content: product,
      })
    ).status,
    409,
  );
  for (const path of ["/produk/fixture-product", "/llms-full.txt", "/llms.txt"])
    assert.doesNotMatch(
      await (await request(path)).text(),
      /SECRET DRAFT REVISION/,
    );
  assert.equal(
    (
      await request(`/api/office/documents/${id}/unpublish`, "POST", {
        revision: 4,
      })
    ).status,
    200,
  );
  assert.equal((await request("/produk/fixture-product")).status, 404);
  assert.doesNotMatch(
    await (await request("/sitemap.xml")).text(),
    /fixture-product/,
  );
});

test("article metadata, pagination and publication dates do not expose draft timestamps", async () => {
  for (let i = 0; i < 10; i++) {
    const id = randomUUID(),
      a = { ...article, slug: "fixture-news-" + i };
    await db("documents").insert({
      id,
      kind: "article",
      revision: 2,
      status: "draft",
      draft: JSON.stringify({ ...a, title: "PRIVATE DRAFT" }),
      published: JSON.stringify(a),
      slug: a.slug,
      published_slug: a.slug,
      published_at: "2026-01-02T00:00:00.000Z",
      updated_at: "2026-10-01T00:00:00.000Z",
    });
    await db("versions").insert({
      id: randomUUID(),
      document_id: id,
      revision: 1,
      content: JSON.stringify(a),
      actor_id: "test",
      created_at: "2026-02-01T00:00:00.000Z",
    });
  }
  const html = await (await request("/berita/fixture-news-0")).text();
  assert.match(html, /article:modified_time" content="2026-02-01/);
  assert.doesNotMatch(html, /2026-10-01|PRIVATE DRAFT/);
  const page = await (await request("/berita?page=2")).text();
  assert.match(
    page,
    /rel="canonical" href="https:\/\/ppti.me\/berita\?page=2"/,
  );
  assert.equal((await request("/berita?page=999")).status, 404);
  assert.match(
    await (await request("/berita?q=test")).text(),
    /noindex, follow/,
  );
  assert.match(await (await request("/sitemap.xml")).text(), /berita\?page=2/);
});

test("old portal records receive defaults and unpublished hidden sections do not enter public machine content", async () => {
  const { seo, showcase, ...old } = defaultPortal;
  assert.equal(portalSchema.parse(old).seo.contactEmail, "billing@ppti.me");
  const p = {
    ...defaultPortal,
    about: { ...defaultPortal.about, title: "Hidden test title" },
    sections: defaultPortal.sections.map((s) => ({
      ...s,
      visible: s.id !== "tentang" && s.id !== "faq",
    })),
  };
  await db("documents")
    .where({ id: "portal" })
    .update({ published: JSON.stringify(p) });
  const html = await (await request("/")).text();
  assert.doesNotMatch(
    html.replace(/<script id="portal-bootstrap"[\s\S]*?<\/script>/, ""),
    /Hidden test title|FAQPage/,
  );
  await db("documents")
    .where({ id: "portal" })
    .update({ published: JSON.stringify(defaultPortal) });
});

test("validation rejects unsafe URLs and missing transcript; social image is a real 1200x630 PNG", async () => {
  assert.equal(
    productSchema.safeParse({
      ...product,
      videoUrl: "",
      websiteUrl: "",
      videoTranscript: "",
    }).success,
    true,
  );
  assert.equal(
    productSchema.safeParse({ ...product, videoUrl: "not-a-url" }).success,
    false,
  );
  assert.equal(
    productSchema.safeParse({ ...product, videoUrl: "javascript:alert(1)" })
      .success,
    false,
  );
  assert.equal(
    productSchema.safeParse({ ...product, videoTranscript: "" }).success,
    false,
  );
  assert.equal(
    productSchema.safeParse({
      ...product,
      websiteUrl: "https://user:password@example.com",
    }).success,
    false,
  );
  const metadata = await sharp("public/social-card.png").metadata();
  assert.equal(metadata.width, 1200);
  assert.equal(metadata.height, 630);
  assert.equal(metadata.format, "png");
});

test("published text cannot break out of metadata or JSON-LD", async () => {
  const attack = '</script><script>alert("test")</script>';
  const p = {
    ...defaultPortal,
    identity: { ...defaultPortal.identity, name: attack },
    seo: { ...defaultPortal.seo, title: attack },
  };
  await db("documents")
    .where({ id: "portal" })
    .update({ published: JSON.stringify(p) });
  try {
    const html = await (await request("/")).text();
    assert.doesNotMatch(html, /<script>alert/);
    assert.match(html, /&lt;script&gt;/);
    const graph = JSON.parse(
      html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)![1],
    );
    assert.equal(graph["@graph"][0].name, attack);
  } finally {
    await db("documents")
      .where({ id: "portal" })
      .update({ published: JSON.stringify(defaultPortal) });
  }
});

test("public bootstrap matches published APIs without drafts or office data", async () => {
  for (const path of [
    "/",
    "/berita?page=2",
    "/berita?q=Fixture&category=News",
    "/berita/fixture-news-0",
    "/produk",
  ]) {
    const response = await request(path),
      html = await response.text();
    const match = html.match(
      /<script id="portal-bootstrap" type="application\/json">(.*?)<\/script>/s,
    );
    assert(match);
    const boot = JSON.parse(match[1]);
    assert.equal(boot.version, 1);
    assert.equal(boot.path, path);
    assert.equal(boot.portal.identity.name, defaultPortal.identity.name);
    assert.doesNotMatch(
      match[1],
      /PRIVATE DRAFT|SECRET DRAFT REVISION|password|csrf|sessions/,
    );
    assert.equal(response.headers.get("cache-control"), "no-cache");
    if (boot.page.kind === "home") {
      assert(boot.page.news.length <= 3);
      assert(boot.page.products.length <= 3);
    }
    if (boot.page.kind === "news-list")
      assert.deepEqual(
        boot.page.result,
        await (
          await request("/api/news" + new URL("https://ppti.me" + path).search)
        ).json(),
      );
  }
  const office = await (await request("/office")).text();
  assert.doesNotMatch(office, /id="portal-bootstrap"/);
  assert.match(office, /mango-loading is-full/);
  assert.equal(
    (await request("/office")).headers.get("cache-control"),
    "no-store",
  );
  const absent = await request("/produk/not-published");
  assert.equal(absent.status, 404);
  assert.match(await absent.text(), /"kind":"not-found"/);
});
test("hashed assets negotiate Brotli/gzip with safe cache variation", async () => {
  const { readFile } = await import("node:fs/promises");
  const { brotliDecompressSync, gunzipSync } = await import("node:zlib");
  const html = await readFile("dist/index.html", "utf8"),
    path = html.match(/src="(\/assets\/[^" ]+\.js)"/)![1];
  const plain = await app.request(path);
  const data = Buffer.from(await plain.arrayBuffer());
  assert.match(plain.headers.get("cache-control") || "", /immutable/);
  assert.match(plain.headers.get("vary") || "", /Accept-Encoding/i);
  assert.doesNotMatch(data.toString(), /ZodError|WebGLRenderer/);
  for (const encoding of ["br", "gzip"]) {
    const response = await app.request(path, {
      headers: { "Accept-Encoding": encoding },
    });
    assert.equal(response.headers.get("content-encoding"), encoding);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert(bytes.length < data.length);
    assert.deepEqual(
      encoding === "br" ? brotliDecompressSync(bytes) : gunzipSync(bytes),
      data,
    );
  }
  const zero = await app.request(path, {
    headers: { "Accept-Encoding": "br;q=0, gzip;q=0" },
  });
  assert.equal(zero.headers.get("content-encoding"), null);
  const missing = await app.request("/assets/missing-abcdef.js");
  assert.equal(missing.status, 404);
  assert.doesNotMatch(missing.headers.get("cache-control") || "", /immutable/);
});
