import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const asset = async (path, mime) => `data:${mime};base64,${(await readFile(path)).toString('base64')}`;
const [logo, school, font] = await Promise.all([
  asset('public/brand/mangotek-edu.svg', 'image/svg+xml'),
  asset('public/school-poster.png', 'image/png'),
  asset('node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2', 'font/woff2'),
]);
const browser = await chromium.launch({ channel: process.env.CI ? undefined : 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html lang="id"><meta charset="utf-8"><style>
  @font-face{font-family:Jakarta;src:url('${font}')}*{box-sizing:border-box}body{margin:0;background:#f8f9f2;color:#1e4233;font-family:Jakarta,sans-serif;width:1200px;height:630px;padding:46px 54px;position:relative;overflow:hidden}
  .logo{width:268px;height:70px;object-fit:contain;object-position:left}.eyebrow{margin:52px 0 18px;font-size:15px;font-weight:650}h1{margin:0;font-size:48px;line-height:1.17;letter-spacing:-2.1px;font-weight:650;width:590px}h1 span{color:#608045}p{font-size:17px;line-height:1.65;width:440px;margin-top:24px}.school{position:absolute;width:550px;right:22px;top:115px}.bottom{position:absolute;bottom:40px;left:54px;right:54px;border-top:1px solid #c9d3be;padding-top:20px;display:flex;justify-content:space-between;align-items:center;font-size:13px}.domain{font-size:18px;font-weight:700}.accent{position:absolute;top:0;left:54px;width:65px;height:7px;background:#f6b74e}
  </style><div class="accent"></div><img class="logo" src="${logo}" alt="MangoTek Edu"><div class="eyebrow">DIGITALISASI PENDIDIKAN K–12</div><h1>Sekolah terhubung.<br><span>Pendidikan bertumbuh.</span></h1><p>Pembelajaran, administrasi, infrastruktur,<br>dan pendampingan sekolah.</p><img class="school" src="${school}" alt="Ilustrasi sekolah digital"><div class="bottom"><span>Part of Mango Teknusa Inovasi</span><span>Jawa Timur, Indonesia</span><span class="domain">ppti.me</span></div></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.school').evaluate(el => el.decode());
  await page.screenshot({ path: 'public/social-card.png' });
  console.log('Created public/social-card.png (1200 × 630).');
} finally { await browser.close(); }
