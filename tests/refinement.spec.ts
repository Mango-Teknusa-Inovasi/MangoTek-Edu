import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function goToProgress(page: Page, p: number) {
  await expect(page.locator('.campus-stage')).toHaveAttribute('data-scene', '3d');
  await page.evaluate(p => {
    const root = document.querySelector('.digital-story')!;
    const header = document.querySelector('.site-header')!.clientHeight;
    const top = root.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top - header + p * (root.clientHeight - innerHeight + header), behavior: 'instant' });
  }, p);
}

for (const width of [375, 768, 1440, 1920]) {
  test(`hero follows the header safe area at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 }); await page.goto('/');
    await expect(page.locator('.story-topline')).toBeVisible();
    const bounds = await page.evaluate(() => {
      const rect = (selector: string) => { const box = document.querySelector(selector)!.getBoundingClientRect(); return { left: box.left, right: box.right }; };
      return { header: rect('.header-inner'), top: rect('.story-topline'), copy: rect('.story-copy'), bottom: rect('.story-bottom'), visual: rect('.story-visual') };
    });
    for (const item of [bounds.top, bounds.copy, bounds.bottom, bounds.visual]) {
      expect(item.left).toBeGreaterThanOrEqual(bounds.header.left - 1);
      expect(item.right).toBeLessThanOrEqual(bounds.header.right + 1);
    }
    expect(bounds.top.left).toBeCloseTo(bounds.header.left, 0);
    expect(bounds.copy.left).toBeCloseTo(bounds.header.left, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('scroll motion interpolates and reverses without overshoot', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('.campus-stage')).toHaveAttribute('data-scene', '3d');
  await goToProgress(page, .8);
  const samples = await page.evaluate(async () => {
    const values: number[] = [];
    for (let i = 0; i < 16; i++) { await new Promise(requestAnimationFrame); values.push(Number((document.querySelector('.story-stage') as HTMLElement).dataset.progress)); }
    return values;
  });
  expect(samples.some(p => p > .01 && p < .75)).toBe(true);
  expect(samples.every(p => p >= 0 && p <= .801)).toBe(true);
  await expect.poll(async () => Number(await page.locator('.story-stage').getAttribute('data-progress'))).toBeCloseTo(.8, 2);
  await goToProgress(page, .1);
  await expect.poll(async () => Number(await page.locator('.story-stage').getAttribute('data-progress'))).toBeCloseTo(.1, 2);
  await expect(page.locator('.story-stage')).toHaveAttribute('data-chapter', 'school');
});

test('interactive media extends from introduction through consultation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto('/');
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  for (const kind of ['ecosystem', 'learning', 'implementation', 'support', 'contact']) {
    const figure = page.locator(`[data-media="${kind}"]`).first();
    await figure.scrollIntoViewIfNeeded();
    await expect(figure.locator('.media-viewport')).toHaveAttribute('data-ready', 'true');
    const canvas = figure.locator('canvas');
    await page.waitForTimeout(400);
    const previous = Number(await canvas.getAttribute('data-rotation'));
    await figure.locator('.media-viewport').focus(); await page.keyboard.press('ArrowRight');
    await expect.poll(async () => Number(await canvas.getAttribute('data-rotation')) - previous).toBeGreaterThan(.6);
    const toggle = figure.locator('.media-viewport');
    const before = await toggle.getAttribute('aria-pressed'); await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', before === 'true' ? 'false' : 'true');
    await expect.poll(async () => Number(await canvas.getAttribute('data-expansion'))).toBeCloseTo(before === 'true' ? 0 : 1, 1);
    await figure.locator('.media-viewport').focus(); await page.keyboard.press('Home');
    await expect(toggle).toHaveAttribute('aria-pressed', kind === 'learning' ? 'true' : 'false');
    expect(await page.locator('canvas').count()).toBeLessThanOrEqual(4);
  }
  await expect(page.locator('[data-media="ecosystem"] canvas')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('every service model responds and passes accessibility checks', async ({ page }) => {
  await page.goto('/');
  for (const kind of ['learning', 'administration', 'network', 'devices', 'support']) {
    await page.locator('#tab-' + kind).click();
    const figure = page.locator(`#panel-${kind} .interactive-media`);
    await figure.scrollIntoViewIfNeeded(); await expect(figure.locator('.media-viewport')).toHaveAttribute('data-ready', 'true');
    await figure.locator('.media-viewport').click();
    const result = await new AxeBuilder({ page }).include(`#panel-${kind}`).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations).toEqual([]);
  }
});

test('media context loss and reduced motion retain content', async ({ page }) => {
  await page.goto('/'); const media = page.locator('[data-media="ecosystem"]');
  await media.scrollIntoViewIfNeeded(); await expect(media.locator('.media-viewport')).toHaveAttribute('data-ready', 'true');
  await media.locator('canvas').evaluate(el => el.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  await expect(media.locator('canvas')).toHaveCount(0);
  await expect(media.locator('.media-viewport img')).toBeVisible();
  await expect(media.locator('.media-controls')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const kind of ['learning', 'implementation', 'support', 'contact']) {
    const figure = page.locator(`[data-media="${kind}"]`).first();
    await figure.scrollIntoViewIfNeeded(); await expect(figure.locator('canvas')).toHaveCount(0);
    await expect(figure.locator('.media-viewport img')).toBeVisible();
    await expect.poll(() => figure.locator('img').evaluate(el => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0)).toBe(true);
  }
});


test('guides are removed and transition has no white text panels', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.school-controls, .media-controls, .media-detail')).toHaveCount(0);
  await expect(page.getByText('Seret untuk melihat sekolah', { exact: true })).toHaveCount(0);
  for (const p of [.2, .25, .3, .34, .35, .4, .44]) {
    await goToProgress(page, p); await page.waitForTimeout(750);
    const surfaces = await page.locator('.story-topline, .story-bottom, .story-copy > div:not([hidden])').evaluateAll(nodes => nodes.map(el => ({ background: getComputedStyle(el).backgroundColor, shadow: getComputedStyle(el).boxShadow })));
    expect(surfaces.every(s => s.background === 'rgba(0, 0, 0, 0)' && s.shadow === 'none')).toBe(true);
    const results = await new AxeBuilder({ page }).include('.digital-story').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
  }
});
