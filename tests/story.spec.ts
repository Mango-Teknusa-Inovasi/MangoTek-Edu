import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function scrollProgress(page: Page, progress: number) {
  await page.evaluate(p => {
    const root = document.querySelector('.digital-story')!;
    const header = document.querySelector('.site-header')!.getBoundingClientRect().height;
    const start = root.getBoundingClientRect().top + scrollY - header;
    const end = root.getBoundingClientRect().top + scrollY + root.clientHeight - innerHeight;
    window.scrollTo({ top: start + p * (end - start), behavior: 'instant' });
  }, progress);
  await expect.poll(async () => Number(await page.locator('.story-stage').getAttribute('data-progress')), { timeout: 15000 }).toBeCloseTo(progress, 2);
}
async function load(page: Page) {
  await page.goto('/');
  await expect(page.locator('.campus-stage')).toHaveAttribute('data-scene', '3d');
  await page.evaluate(() => document.fonts.ready);
}

test('school drag, angle limits, keyboard rotation, reset and pause', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await load(page);
  const canvas = page.locator('.story-visual canvas');
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 750, box.y + box.height / 2 + 300, { steps: 20 });
  await page.mouse.up(); await page.waitForTimeout(600);
  await expect.poll(async () => Number(await canvas.getAttribute('data-yaw')), { timeout: 15000 }).toBeGreaterThan(5.5);
  expect(Number(await canvas.getAttribute('data-tilt'))).toBeLessThanOrEqual(.161);
  await page.locator('.story-visual').focus(); await page.keyboard.press('Home'); await page.waitForTimeout(900);
  await expect.poll(async () => Number(await canvas.getAttribute('data-yaw')), { timeout: 15000 }).toBeCloseTo(-.48, 1);
  await page.locator('.story-visual').focus(); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(600);
  await expect.poll(async () => Number(await canvas.getAttribute('data-yaw')), { timeout: 15000 }).toBeGreaterThan(.2);
  await page.locator('.story-visual').focus(); await page.keyboard.press(' ');
  await page.mouse.move(box.x + 100, box.y + 150); await page.waitForTimeout(1500);
  let previous = await canvas.screenshot();
  await expect.poll(async () => { const current = await canvas.screenshot(); const settled = current.equals(previous); previous = current; return settled; }, { timeout: 15000 }).toBe(true);
  const before = await canvas.screenshot(); await page.waitForTimeout(250);
  expect((await canvas.screenshot()).equals(before)).toBe(true);
  await page.mouse.wheel(0, 500); await page.waitForTimeout(500);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(300);
});

for (const width of [1440, 768, 375]) {
  test(`story checkpoints, reverse and resize at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 1000 }); await load(page);
    for (const p of [0, .2, .4, .65, .85, 1]) {
      await scrollProgress(page, p);
      const actual = Number(await page.locator('.story-stage').getAttribute('data-progress'));
      expect(actual).toBeCloseTo(p, 2);
      await page.screenshot({ path: `artifacts/story/${width}-${Math.round(p * 100)}.png` });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    for (const p of [.9, .7, .5, .25, .1]) {
      await scrollProgress(page, p);
      const chapter = p > .85 ? 'ecosystem' : p > .65 ? 'devices' : p > .4 ? 'laptop' : p > .2 ? 'transition' : 'school';
      await expect(page.locator('.story-stage')).toHaveAttribute('data-chapter', chapter);
    }
    await scrollProgress(page, .7);
    await page.setViewportSize({ width: 812, height: 650 });
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await scrollProgress(page, 0);
    await expect(page.locator('.story-visual')).toHaveAttribute('tabindex', '0');
  });
}

test('context loss switches to static journey and keeps services accessible', async ({ page }) => {
  await load(page); await scrollProgress(page, .7);
  await page.locator('canvas').evaluate(el => el.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  await expect(page.locator('.digital-story')).toHaveClass(/story-static/);
  await expect(page.locator('.static-journey article')).toHaveCount(4);
  await expect(page.locator('.story-visual canvas')).toHaveCount(0);
  await page.getByRole('link', { name: 'Lewati ke layanan' }).click();
  await expect(page.getByRole('tablist')).toBeInViewport();
});

test('failed lazy scene module has a complete fallback', async ({ page }) => {
  await page.route('**/assets/StoryScene-*.js', route => route.abort());
  await page.goto('/');
  await expect(page.locator('.digital-story')).toHaveClass(/story-static/);
  await expect(page.locator('.static-journey article')).toHaveCount(4);
});

test('all story chapters pass automated contrast and accessibility checks', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await load(page);
  for (const p of [.1, .3, .55, .75, .94]) {
    await scrollProgress(page, p);
    const results = await new AxeBuilder({ page }).include('.digital-story').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
  }
});

test('mobile scene preserves native touch scrolling and rotation controls', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true });
  const page = await context.newPage(); await load(page);
  const canvas = page.locator('.story-visual canvas');
  expect(await canvas.evaluate(el => getComputedStyle(el).touchAction)).toBe('pan-y');
  const bounds = (await canvas.boundingBox())!;
  const cdp = await context.newCDPSession(page);
  const y = bounds.y + bounds.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 100, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(600);
  await expect.poll(async () => Number(await canvas.getAttribute('data-yaw')), { timeout: 15000 }).toBeGreaterThan(.2);
  await page.screenshot({ path: 'artifacts/story/mobile-short.png' });
  await context.close();
});
