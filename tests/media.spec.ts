import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import knex from "knex";
import { db as sharedDb } from "../server/db";
import { hashPassword } from "../server/auth";
const db = knex(sharedDb.client.config),
  id = randomUUID(),
  email = `media-${id}@test.invalid`,
  password = randomUUID();
const uploaded: { id: string; url: string }[] = [];
let png: Buffer;
test.beforeAll(async () => {
  png = await sharp({
    create: {
      width: 180,
      height: 100,
      channels: 4,
      background: { r: 42, g: 92, b: 55, alpha: 0.6 },
    },
  })
    .png()
    .toBuffer();
  await db("users").insert({
    id,
    email,
    name: "Media Test",
    role: "admin",
    password: await hashPassword(password),
    active: true,
  });
});
test.afterAll(async () => {
  for (const asset of uploaded) {
    await db("media").where({ id: asset.id }).delete();
    await rm(
      resolve(process.env.UPLOAD_DIR || "data/uploads", asset.id + ".webp"),
      { force: true },
    );
  }
  await db("users").where({ id }).delete();
  await db.destroy();
});
async function login(page: Page) {
  await page.goto("/office");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
}
async function partners(page: Page) {
  await page
    .getByRole("navigation", { name: "Menu office" })
    .getByRole("button", { name: "Konten Portal", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Bagian editor" })
    .getByRole("button", {
      name: "Portofolio dan organisasi yang mempercayai kami",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "Tambah organisasi (isi hanya dengan izin publikasi)",
      exact: true,
    })
    .click();
  return page
    .getByRole("group", { name: "Logo organisasi", exact: true })
    .last();
}
async function upload(
  page: Page,
  input: ReturnType<Page["getByLabel"]>,
  name: string,
) {
  const response = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/office/media") && r.request().method() === "POST",
  );
  await input.setInputFiles({ name, mimeType: "image/png", buffer: png });
  const result = await response;
  expect(result.status()).toBe(201);
  const asset = await result.json();
  uploaded.push(asset);
  return asset;
}
for (const width of [375, 768, 1440])
  test(`inline organization logo and thumbnail library at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await login(page);
    const field = await partners(page);
    const name = `logo-${width}-${id}.png`;
    const asset = await upload(
      page,
      field.getByLabel("Unggah logo organisasi"),
      name,
    );
    await expect(field.getByRole("img")).toHaveAttribute("src", asset.url);
    const delivered = await page.request.get(asset.url);
    expect(delivered.status()).toBe(200);
    const metadata = await sharp(await delivered.body()).metadata();
    expect(metadata.hasAlpha).toBe(true);
    await expect(page.getByText("Modifikasi belum disimpan")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await field.getByRole("button", { name: "Pilih dari pustaka" }).click();
    const dialog = page.getByRole("dialog", {
      name: "Pilih gambar",
      exact: true,
    });
    await expect(dialog.getByLabel("Cari gambar")).toBeFocused();
    await dialog.getByLabel("Cari gambar").fill(name);
    await expect(
      dialog.getByRole("button", { name: `Pilih ${name}`, exact: true }),
    ).toBeVisible();
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await dialog.getByLabel("Cari gambar").focus();
    await page.screenshot({ path: `artifacts/media/picker-${width}.png` });
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(
      field.getByRole("button", { name: "Pilih dari pustaka" }),
    ).toBeFocused();
  });
test("upload completion preserves edits and published organization logo appears publicly", async ({
  page,
}) => {
  const original = await db("documents").where({ id: "portal" }).first();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  try {
    await login(page);
    const field = await partners(page);
    const organization = page.getByRole("group", {
      name: "Organisasi (isi hanya dengan izin publikasi)",
      exact: true,
    });
    await organization
      .getByLabel("Nama", { exact: true })
      .last()
      .fill("Nama awal");
    await page.route("**/api/office/media", async (route) => {
      if (route.request().method() === "POST") {
        await gate;
        await route.continue();
      } else await route.continue();
    });
    const response = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/office/media") &&
        r.request().method() === "POST",
    );
    await field
      .getByLabel("Unggah logo organisasi")
      .setInputFiles({
        name: `published-${id}.png`,
        mimeType: "image/png",
        buffer: png,
      });
    await expect(
      field.getByRole("button", { name: "Batalkan unggah" }),
    ).toBeVisible();
    await organization
      .getByLabel("Nama", { exact: true })
      .last()
      .fill("Organisasi Uji Unggah");
    release();
    const asset = await (await response).json();
    uploaded.push(asset);
    await expect(field.getByRole("img")).toHaveAttribute("src", asset.url);
    await expect(
      organization.getByLabel("Nama", { exact: true }).last(),
    ).toHaveValue("Organisasi Uji Unggah");
    await page
      .getByRole("button", { name: "Simpan draf", exact: true })
      .click();
    await expect(
      page.getByText("Draf tersimpan.", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Terbitkan", exact: true }).click();
    await expect(
      page.getByText("Konten telah diterbitkan.", { exact: true }),
    ).toBeVisible();
    const published = await (await page.request.get("/api/portal")).json();
    expect(
      published.showcase.partners.some(
        (p: any) => p.name === "Organisasi Uji Unggah" && p.logo === asset.url,
      ),
    ).toBe(true);
    await page.goto("/");
    await expect(
      page.getByRole("img", { name: "Organisasi Uji Unggah", exact: true }),
    ).toHaveAttribute("src", asset.url);
  } finally {
    release();
    await db("versions").where({ actor_id: id }).delete();
    await db("documents").where({ id: "portal" }).update(original);
  }
});
test("image upload failures and cancellation preserve selected image and retry works", async ({
  page,
}) => {
  await login(page);
  await page
    .getByRole("navigation", { name: "Menu office" })
    .getByRole("button", { name: "Pengaturan", exact: true })
    .click();
  const field = page.getByRole("group", { name: "Logo Edu", exact: true }),
    previous = await field.getByRole("img").getAttribute("src");
  await field
    .getByLabel("Unggah logo edu")
    .setInputFiles({
      name: "bad.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from("<svg/>"),
    });
  await expect(field.getByRole("alert")).toContainText("PNG, JPEG, atau WebP");
  await page.route("**/api/office/media", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: "Penyimpanan tidak tersedia." }),
        })
      : route.continue(),
  );
  await field
    .getByLabel("Unggah logo edu")
    .setInputFiles({ name: "retry.png", mimeType: "image/png", buffer: png });
  await expect(field.getByRole("alert")).toContainText(
    "Penyimpanan tidak tersedia",
  );
  await expect(field.getByRole("img")).toHaveAttribute("src", previous!);
  await page.unroute("**/api/office/media");
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/api/office/media", async (route) => {
    if (route.request().method() === "POST") {
      await gate;
      await route.abort().catch(() => {});
    } else await route.continue();
  });
  try {
    await field
      .getByLabel("Unggah logo edu")
      .setInputFiles({
        name: "cancel.png",
        mimeType: "image/png",
        buffer: png,
      });
    await field.getByRole("button", { name: "Batalkan unggah" }).click();
    await expect(field.getByText(/Unggahan dibatalkan/)).toBeVisible();
    await expect(field.getByRole("img")).toHaveAttribute("src", previous!);
  } finally {
    release();
    await page.unroute("**/api/office/media");
  }
  await upload(page, field.getByLabel("Unggah logo edu"), `retry-${id}.png`);
  await expect(field.getByRole("img")).not.toHaveAttribute("src", previous!);
});

test("direct uploads cover brand, social image, news, product, screenshots, and repeated files", async ({
  page,
}) => {
  await login(page);
  const menu = page.getByRole("navigation", { name: "Menu office" });
  await menu.getByRole("button", { name: "Pengaturan", exact: true }).click();
  const parent = page.getByRole("group", { name: "Logo induk", exact: true });
  const response = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/office/media") && r.request().method() === "POST",
  );
  const transfer = await page.evaluateHandle(
    ({ bytes, name }) => {
      const data = new DataTransfer();
      data.items.add(
        new File([new Uint8Array(bytes)], name, { type: "image/png" }),
      );
      return data;
    },
    { bytes: [...png], name: `parent-${id}.png` },
  );
  await parent
    .locator(".media-dropzone")
    .dispatchEvent("drop", { dataTransfer: transfer });
  const parentAsset = await (await response).json();
  uploaded.push(parentAsset);
  await expect(parent.getByRole("img")).toHaveAttribute("src", parentAsset.url);
  await transfer.dispose();
  await page
    .getByRole("navigation", { name: "Bagian editor" })
    .getByRole("button", { name: "SEO, kontak, dan wilayah", exact: true })
    .click();
  await upload(
    page,
    page.getByLabel("Unggah gambar berbagi sosial"),
    `social-${id}.png`,
  );
  page.once("dialog", (dialog) => dialog.accept());
  await menu.getByRole("button", { name: "Berita", exact: true }).click();
  await page.getByRole("button", { name: "Tulis berita" }).click();
  const cover = page.getByRole("group", { name: "Gambar sampul", exact: true });
  const first = await upload(
    page,
    cover.getByLabel("Unggah gambar sampul"),
    `repeat-${id}.png`,
  );
  await expect(cover.getByRole("img")).toHaveAttribute("src", first.url);
  const second = await upload(
    page,
    cover.getByLabel("Unggah gambar sampul"),
    `repeat-${id}.png`,
  );
  expect(second.id).not.toBe(first.id);
  await expect(cover.getByRole("img")).toHaveAttribute("src", second.url);
  page.once("dialog", (dialog) => dialog.accept());
  await menu.getByRole("button", { name: "Produk", exact: true }).click();
  await page.getByRole("button", { name: "Tambah produk" }).click();
  await upload(
    page,
    page.getByLabel("Unggah gambar sampul"),
    `product-${id}.png`,
  );
  await page
    .getByRole("button", { name: "Tambah galeri tangkapan layar" })
    .click();
  const screenshot = await upload(
    page,
    page.getByLabel("Unggah gambar", { exact: true }),
    `screenshot-${id}.png`,
  );
  await expect(
    page.getByRole("group", { name: "Gambar", exact: true }).getByRole("img"),
  ).toHaveAttribute("src", screenshot.url);
});
