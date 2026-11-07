import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomUUID } from "node:crypto";
import knex from "knex";
import { db as sharedDb } from "../server/db";
import { digest, hashPassword } from "../server/auth";
const db = knex(sharedDb.client.config),
  userId = randomUUID(),
  token = randomUUID(),
  csrf = randomUUID();
test.beforeAll(async () => {
  await db("users").insert({
    id: userId,
    email: `loading-${userId}@test.invalid`,
    name: "Loading Test",
    role: "admin",
    active: true,
    password: await hashPassword(randomUUID()),
  });
  await db("sessions").insert({
    id: digest(token),
    user_id: userId,
    csrf,
    expires_at: new Date(Date.now() + 3600000).toISOString(),
  });
});
test.afterAll(async () => {
  await db("users").where({ id: userId }).delete();
  await db.destroy();
});
async function authenticate(
  context: import("@playwright/test").BrowserContext,
) {
  await context.addCookies([
    {
      name: "mangotek_session",
      value: token,
      url: "http://127.0.0.1:3000",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}
for (const width of [375, 768, 1440])
  test(`centered loader and reduced motion at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/api/office/session", async (route) => {
      await gate;
      await route.continue();
    });
    try {
      await page.goto("/office");
      const loader = page.locator(".mango-loading.is-full");
      await expect(loader).toBeVisible();
      const box = await loader.locator(".mango-loading-inner").boundingBox();
      expect(Math.abs(box!.x + box!.width / 2 - width / 2)).toBeLessThan(3);
      expect(Math.abs(box!.y + box!.height / 2 - 450)).toBeLessThan(3);
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect
        .poll(() =>
          loader
            .locator(".mango-loading-mark")
            .evaluate((el) => getComputedStyle(el).animationName),
        )
        .toBe("none");
      await page.screenshot({ path: `artifacts/loading/loader-${width}.png` });
    } finally {
      release();
    }
    await expect(
      page.getByRole("heading", { name: "Masuk ke office" }),
    ).toBeVisible();
  });
test("office skeletons retain navigation; a failed media library does not block editing", async ({
  page,
  context,
}) => {
  await authenticate(context);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/api/office/documents", async (route) => {
    await gate;
    await route.continue();
  });
  await page.route("**/api/office/media", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Media sementara tidak tersedia." }),
    }),
  );
  try {
    await page.goto("/office");
    await expect(
      page.getByRole("navigation", { name: "Menu office" }),
    ).toBeVisible();
    await expect(page.locator(".skeleton-overview")).toBeVisible();
    await page
      .getByRole("navigation", { name: "Menu office" })
      .getByRole("button", { name: "Konten Portal", exact: true })
      .click();
    await expect(page.locator(".skeleton-editor")).toBeVisible();
    await page.screenshot({ path: "artifacts/loading/editor-skeleton.png" });
  } finally {
    release();
  }
  await expect(page.getByLabel("Judul", { exact: true }).first()).toBeVisible();
  await page
    .getByLabel("Judul", { exact: true })
    .first()
    .fill("Draf tetap utuh");
  await expect(
    page.getByRole("button", { name: "Coba lagi pustaka", exact: true }),
  ).toBeVisible();
  await page.unroute("**/api/office/media");
  await page
    .getByRole("button", { name: "Coba lagi pustaka", exact: true })
    .click();
  await expect(page.getByLabel("Judul", { exact: true }).first()).toHaveValue(
    "Draf tetap utuh",
  );
});
test("session failures show retry instead of an incorrect login form", async ({
  page,
}) => {
  await page.route("**/api/office/session", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Sesi belum dapat diperiksa." }),
    }),
  );
  await page.goto("/office");
  await expect(page.getByRole("alert")).toHaveText(
    "Sesi belum dapat diperiksa.",
  );
  await expect(
    page.getByRole("heading", { name: "Masuk ke office" }),
  ).toHaveCount(0);
  await page.unroute("**/api/office/session");
  await page.getByRole("button", { name: "Coba lagi", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Masuk ke office" }),
  ).toBeVisible();
});
test("public server content remains while its module loads and bootstrap avoids duplicate API reads", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  const calls: string[] = [];
  await page.addInitScript(() => {
    (window as any).__emptyRoot = false;
    let armed = false;
    new MutationObserver(() => {
      const root = document.getElementById("root");
      if (root?.querySelector(".server-content")) armed = true;
      if (armed && root && !root.hasChildNodes())
        (window as any).__emptyRoot = true;
    }).observe(document, { childList: true, subtree: true });
  });
  page.on("request", (r) => {
    if (new URL(r.url()).pathname.startsWith("/api/")) calls.push(r.url());
  });
  await page.route("**/assets/App-*.js", async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto("/");
    await expect(page.locator(".server-content h1")).toBeVisible();
    await expect(page.locator(".mango-loading.is-full")).toHaveCount(0);
  } finally {
    release();
  }
  await expect(page.locator(".site-header .brand")).toBeVisible();
  expect(calls).toEqual([]);
  expect(await page.evaluate(() => (window as any).__emptyRoot)).toBe(false);
  for (const path of ["/berita", "/produk"]) {
    await page.goto(path);
    await expect(page.locator(".site-header")).toBeVisible();
  }
  expect(calls).toEqual([]);
});
test("failed public module preserves readable HTML with a retry control", async ({
  page,
}) => {
  await page.route("**/assets/App-*.js", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator(".server-content h1")).toBeVisible();
  await expect(
    page
      .locator(".boot-error")
      .getByRole("button", { name: "Coba lagi", exact: true }),
  ).toBeVisible();
});
test("slow inquiry refresh retains rows and older responses cannot replace the latest filter", async ({
  page,
  context,
}) => {
  await authenticate(context);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/api/office/inquiries?*", async (route) => {
    const status = new URL(route.request().url()).searchParams.get("status");
    if (status === "processing") {
      await gate;
      await route
        .fulfill({
          json: [
            {
              id: "old",
              organization: "Hasil lama",
              name: "Test",
              created_at: new Date().toISOString(),
              status: "processing",
              services: [],
            },
          ],
        })
        .catch(() => {});
    } else
      await route.fulfill({
        json: [
          {
            id: status || "initial",
            organization:
              status === "done" ? "Hasil terbaru" : "Permintaan awal",
            name: "Test",
            created_at: new Date().toISOString(),
            status: status || "new",
            services: [],
          },
        ],
      });
  });
  await page.goto("/office");
  await page
    .getByRole("navigation", { name: "Menu office" })
    .getByRole("button", { name: "Konsultasi", exact: true })
    .click();
  await expect(
    page.getByText("Permintaan awal", { exact: true }),
  ).toBeVisible();
  try {
    await page.getByLabel("Status", { exact: true }).selectOption("processing");
    await expect(
      page.getByText("Permintaan awal", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Memperbarui hasil…")).toBeVisible();
    await page.getByLabel("Status", { exact: true }).selectOption("done");
    await expect(
      page.getByText("Hasil terbaru", { exact: true }),
    ).toBeVisible();
  } finally {
    release();
  }
  await expect(page.getByText("Hasil lama", { exact: true })).toHaveCount(0);
});

test("long reads provide feedback and terminate with a retryable timeout", async ({
  page,
}) => {
  await page.clock.install();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/api/office/session", async (route) => {
    await gate;
    await route
      .fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Silakan masuk kembali." }),
      })
      .catch(() => {});
  });
  try {
    await page.goto("/office");
    await expect(
      page.getByText("Memeriksa sesi…", { exact: true }),
    ).toBeVisible();
    await page.clock.fastForward(11000);
    await expect(
      page.getByText(/Memuat lebih lama dari biasanya/),
    ).toBeVisible();
    await page.clock.fastForward(10001);
    await expect(page.getByRole("alert")).toContainText(
      "Server belum merespons",
    );
    await expect(
      page.getByRole("button", { name: "Coba lagi", exact: true }),
    ).toBeVisible();
  } finally {
    release();
  }
});
