import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function loadPage(page: Page) {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

async function revealSections(page: Page) {
  for (const id of ['tentang', 'layanan', 'pendekatan', 'faq']) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(850);
  }
  await page.locator('.contact-panel').scrollIntoViewIfNeeded();
  await page.waitForTimeout(850);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(300);
}

for (const width of [1440, 768, 375]) {
  test(`layout and screenshot at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await loadPage(page);
    await expect(page.locator('.campus-stage')).toHaveAttribute('data-scene', '3d', { timeout: 20000 });
    await revealSections(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/mangotek-${width}.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
}

test('services support pointer, keyboard and campus shortcuts', async ({ page }) => {
  await loadPage(page);
  const tabs = page.getByRole('tab');
  await page.getByRole('button', { name: 'Sekolah terkoneksi' }).click();
  await expect(page.getByRole('tab', { name: 'Jaringan & infrastruktur' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: 'Jaringan & infrastruktur' })).toBeVisible();
  await tabs.nth(2).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(3)).toBeFocused();
  await expect(tabs.nth(3)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(tabs.nth(4)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(tabs.nth(0)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(tabs.nth(4)).toBeFocused();
  for (const tab of await tabs.all()) {
    await tab.click();
    await expect(page.getByRole('tabpanel')).toHaveCount(1);
    await expect(page.getByRole('tabpanel')).toBeVisible();
  }
  await page.getByRole('button', { name: 'Ruang untuk tumbuh Pembelajaran digital' }).click();
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
});

test('consultation retains fields on server failure and restores focus', async ({ page }) => {
  await loadPage(page);
  const trigger=page.locator('.header-cta');await trigger.click();const dialog=page.getByRole('dialog');
  await dialog.getByLabel('Nama',{exact:true}).fill('Sekolah Test');await dialog.getByLabel('Sekolah / organisasi').fill('Organisasi Test');
  await dialog.getByLabel('Email',{exact:true}).fill('test@example.org');await dialog.getByRole('checkbox',{name:'Pembelajaran digital',exact:true}).check();
  await dialog.getByLabel('Ceritakan kebutuhan Anda').fill('Membutuhkan jaringan untuk sekolah.');await dialog.getByRole('checkbox',{name:/Saya menyetujui/}).check();
  await page.route('**/api/inquiries',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Server sementara tidak tersedia.'})}));
  await dialog.getByRole('button',{name:'Kirim kebutuhan'}).click();await expect(dialog.getByRole('alert')).toHaveText('Server sementara tidak tersedia.');await expect(dialog.getByLabel('Nama',{exact:true})).toHaveValue('Sekolah Test');
  await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(trigger).toBeFocused();
});

test('mobile navigation, anchors and FAQ work with keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await loadPage(page);
  const toggle = page.getByRole('button', { name: 'Buka menu', exact: true });
  await toggle.click();
  await expect(page.getByRole('navigation', { name: 'Navigasi ponsel' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.getByRole('navigation', { name: 'Navigasi ponsel' }).getByRole('link', { name: 'FAQ' }).click();
  await expect(page.getByRole('navigation', { name: 'Navigasi ponsel' })).not.toBeVisible();
  await expect(page).toHaveURL(/#faq$/);
  const question = page.locator('summary').nth(1);
  await question.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('details').nth(1)).toHaveAttribute('open', '');
  await page.keyboard.press('Enter');
  await expect(page.locator('details').nth(1)).not.toHaveAttribute('open', '');
  for (const link of await page.locator('a[href^="#"]').all()) {
    const target = await link.getAttribute('href');
    expect(await page.locator(target!).count()).toBe(1);
  }
});

test('reduced motion shows the complete static journey without a scroll runway', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await loadPage(page);
  await expect(page.locator('.digital-story')).toHaveClass(/story-static/);
  await expect(page.locator('.campus-stage canvas')).toHaveCount(0);
  await expect(page.locator('.static-journey article')).toHaveCount(4);
  expect(await page.locator('.story-stage').evaluate(el => getComputedStyle(el).position)).toBe('relative');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  await revealSections(page);
  await page.screenshot({ path: 'artifacts/mangotek-reduced-motion.png', fullPage: true });
});

test('public page and consultation satisfy WCAG AA automated checks', async ({ page }) => {
  await loadPage(page);
  await revealSections(page);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
  await page.locator('.header-cta').click();
  const dialogResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(dialogResults.violations).toEqual([]);
});

test('WebGL failure retains static illustration and navigation', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type.startsWith('webgl') || type === 'experimental-webgl') return null;
      return original.apply(this, [type, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
  await loadPage(page);
  await expect(page.locator('.campus-stage')).toHaveAttribute('data-scene', 'static');
  await expect(page.locator('.campus-fallback')).not.toHaveClass(/is-hidden/);
  await expect(page.locator('.campus-stage canvas')).toHaveCount(0);
  await page.getByRole('button', { name: 'Sekolah terkoneksi' }).click();
  await expect(page.getByRole('tab', { name: 'Jaringan & infrastruktur' })).toHaveAttribute('aria-selected', 'true');
});

test('Hono serves assets and returns a real 404', async ({ request }) => {
  expect((await request.get('/')).status()).toBe(200);
  expect((await request.get('/mango-wordmark.png')).headers()['content-type']).toContain('image/png');
  expect((await request.get('/does-not-exist')).status()).toBe(404);
});
