import { chromium } from "@playwright/test";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
const label = process.argv[2] || "measurement",
  base = process.env.PERF_ORIGIN || "http://127.0.0.1:3000";
const browser = await chromium.launch({
  channel: process.env.CI ? undefined : "chrome",
  headless: true,
});
const samples = [];
try {
  for (const profile of ["desktop", "mobile"])
    for (let run = 1; run <= 3; run++) {
      const context = await browser.newContext({
        viewport: { width: profile === "mobile" ? 375 : 1440, height: 900 },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage(),
        cdp = await context.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
      if (profile === "mobile") {
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
        await cdp.send("Network.emulateNetworkConditions", {
          offline: false,
          latency: 150,
          downloadThroughput: 200000,
          uploadThroughput: 93750,
        });
      }
      await page.addInitScript(() => {
        window.__perf = { lcp: 0, cls: 0 };
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries())
            window.__perf.lcp = entry.startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries())
            if (!entry.hadRecentInput) window.__perf.cls += entry.value;
        }).observe({ type: "layout-shift", buffered: true });
      });
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(profile === "mobile" ? 20000 : 10000);
      const result = await page.evaluate(() => ({
        fcp:
          performance.getEntriesByName("first-contentful-paint")[0]
            ?.startTime || 0,
        ...window.__perf,
        requests: performance.getEntriesByType("resource").length,
        apiRequests: performance
          .getEntriesByType("resource")
          .filter((r) => new URL(r.name).pathname.startsWith("/api/")).length,
        transferBytes: performance
          .getEntriesByType("resource")
          .reduce((s, r) => s + r.transferSize, 0),
      }));
      samples.push({ profile, run, ...result });
      console.log(JSON.stringify(samples.at(-1)));
      await context.close();
    }
  const median = (values) =>
    [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
  const medians = Object.fromEntries(
    ["desktop", "mobile"].map((profile) => [
      profile,
      Object.fromEntries(
        ["fcp", "lcp", "cls", "requests", "apiRequests", "transferBytes"].map(
          (key) => [
            key,
            median(
              samples.filter((s) => s.profile === profile).map((s) => s[key]),
            ),
          ],
        ),
      ),
    ]),
  );
  const html = await readFile("dist/index.html", "utf8"),
    path = html.match(/src="(\/assets\/[^" ]+\.js)"/)[1];
  const entry = await readFile("dist" + path);
  const report = {
    label,
    base,
    observation:
      "10s desktop / 20s mobile after DOMContentLoaded; cold cache; mobile CPU 4x, 150ms latency, 1.6Mbps down, 750Kbps up",
    entry: { raw: entry.length, gzip: gzipSync(entry).length },
    samples,
    medians,
  };
  await mkdir("artifacts/performance", { recursive: true });
  await writeFile(
    `artifacts/performance/${label}.json`,
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify({ entry: report.entry, medians }));
} finally {
  await browser.close();
}
