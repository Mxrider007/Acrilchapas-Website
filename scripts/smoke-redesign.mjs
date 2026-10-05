/**
 * Public redesign smoke test. Run against the deployed preview; starts no server.
 * WEBSITE_URL=https://your-preview node scripts/smoke-redesign.mjs
 * Optional SCREENSHOT_DIR overrides the private screenshot destination.
 * Existing quotation, commerce and factory smoke suites remain separate.
 */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';

if (!process.env.WEBSITE_URL) throw new Error('Set WEBSITE_URL to the deployed preview; this script does not start a server.');
const target = new URL(process.env.WEBSITE_URL);
assert.ok(['https:', 'http:'].includes(target.protocol), 'WEBSITE_URL must use HTTP(S)');
assert.ok(!target.username && !target.password && !target.search && !target.hash,
  'WEBSITE_URL must not contain credentials, query parameters or fragments');
assert.ok(target.pathname === '/', 'WEBSITE_URL must be the preview origin');
const base = target.origin;
const artifacts = process.env.SCREENSHOT_DIR
  ? path.resolve(process.env.SCREENSHOT_DIR)
  : fileURLToPath(new URL('../.local/screenshots/redesign/', import.meta.url));
await mkdir(artifacts, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const page = await context.newPage();
page.setDefaultTimeout(15_000);
page.setDefaultNavigationTimeout(45_000);
const errors = [];
const brokenAssets = [];
const imageEvidence = new Map();
const widthsChecked = [];
const localeEvidence = {};
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => {
  const url = new URL(response.url());
  if (url.origin === base && /^\/(?:brand|images)\//.test(url.pathname) && response.status() >= 400) {
    brokenAssets.push({ path: url.pathname, status: response.status() });
  }
});

async function home(locale = 'pt') {
  const response = await page.goto(`${base}/${locale}`, { waitUntil: 'domcontentloaded' });
  assert.equal(response?.status(), 200, `${locale} home should load successfully`);
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('main .product-card')).toHaveCount(5);
  await page.evaluate(() => document.fonts.ready);
}

async function loadedImage(locator, label, expectedPath) {
  await expect(locator, label).toHaveCount(1);
  await locator.scrollIntoViewIfNeeded();
  await expect(locator, label).toBeVisible();
  await expect.poll(() => locator.evaluate(image => image instanceof HTMLImageElement
    && image.complete && image.naturalWidth > 0 && image.naturalHeight > 0), {
    message: `${label} must decode a real image`, timeout: 20_000,
  }).toBe(true);
  const details = await locator.evaluate(image => ({
    src: image.currentSrc || image.src, width: image.naturalWidth, height: image.naturalHeight,
    alt: image.getAttribute('alt'),
  }));
  const source = new URL(details.src);
  assert.equal(source.origin, base, `${label} must use the approved local image asset`);
  if (expectedPath) assert.match(source.pathname, expectedPath, `${label} asset path`);
  imageEvidence.set(source.pathname, { ...details, src: source.pathname });
  return details;
}

async function officialImages() {
  const logo = await loadedImage(page.locator('.site-header .brand img'), 'Official header logo', /^\/brand\/logo\.png$/);
  assert.match(logo.alt || '', /acrilchapas/i, 'Logo needs an accessible brand name');
  await loadedImage(page.locator('img.hero-photograph, .hero-photograph img').first(), 'Official hero photo', /^\/images\//);
  const images = page.locator('main .product-card img.material-art');
  await expect(images).toHaveCount(5);
  const families = new Set();
  for (let index = 0; index < 5; index++) {
    const image = await loadedImage(images.nth(index), `Material photo ${index + 1}`,
      /^\/images\/(?:crystal|translucent|opaque|colored|mirror)\.png$/);
    families.add(new URL(image.src).pathname);
    await expect(page.locator('main .product-card').nth(index).locator('h3')).not.toHaveText('');
  }
  assert.equal(families.size, 5, 'All five families need their own official product image');
}

async function noHorizontalOverflow(label) {
  const result = await page.evaluate(() => ({
    viewport: innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    offenders: [...document.querySelectorAll('body *')]
      .filter(element => {
        const bounds = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return bounds.width && style.visibility !== 'hidden' && style.display !== 'none'
          && (bounds.right > innerWidth + 1 || bounds.left < -1);
      })
      .slice(0, 10)
      .map(element => ({ tag: element.tagName, class: element.getAttribute('class'),
        left: Math.round(element.getBoundingClientRect().left), right: Math.round(element.getBoundingClientRect().right) })),
  }));
  assert.ok(result.documentWidth <= result.viewport + 1 && result.bodyWidth <= result.viewport + 1,
    `${label} has horizontal overflow: ${JSON.stringify(result)}`);
}

async function applicationInteractions() {
  const tabs = page.locator('.application-tabs button');
  const panel = page.locator('.application-panel');
  const count = await tabs.count();
  assert.ok(count >= 2, 'Applications need at least two interactive choices');
  await expect(page.locator('.application-tabs button[aria-pressed="true"]')).toHaveCount(1);
  await expect(panel).toBeVisible();
  let previous = (await panel.innerText()).trim();
  assert.ok(previous.length > 20, 'Application panel needs useful content');
  // Every non-current button must change both the accessible state and content.
  for (let index = 0; index < count; index++) {
    if (await tabs.nth(index).getAttribute('aria-pressed') === 'true') continue;
    await tabs.nth(index).focus();
    await tabs.nth(index).press('Enter');
    await expect(tabs.nth(index)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.application-tabs button[aria-pressed="true"]')).toHaveCount(1);
    await expect.poll(async () => (await panel.innerText()).trim(), {
      message: 'Selecting an application must change its panel content',
    }).not.toBe(previous);
    previous = (await panel.innerText()).trim();
  }
}

async function faqInteractions() {
  const items = page.locator('.faq-list details');
  assert.ok(await items.count() >= 2, 'FAQ needs multiple useful questions');
  const item = items.first();
  const summary = item.locator('summary');
  await summary.scrollIntoViewIfNeeded();
  if (await item.evaluate(element => element.open)) await summary.click();
  await summary.focus();
  await summary.press('Enter');
  await expect.poll(() => item.evaluate(element => element.open)).toBe(true);
  const answer = await item.evaluate(element => {
    const copy = element.cloneNode(true);
    copy.querySelector('summary')?.remove();
    return copy.textContent.trim();
  });
  assert.ok(answer.length > 10, 'An expanded FAQ must contain an answer');
  await summary.press('Enter');
  await expect.poll(() => item.evaluate(element => element.open)).toBe(false);
}

async function finderInteraction(locale) {
  const finder = page.locator('.material-finder details').first();
  await expect(finder).toBeVisible();
  if (!await finder.evaluate(element => element.open)) await finder.locator('summary').click();
  await expect.poll(() => finder.evaluate(element => element.open)).toBe(true);
  const option = finder.locator('button').first();
  await expect(option).toBeVisible();
  const expectedFamily = await option.getAttribute('data-family');
  await option.click();
  await expect.poll(() => new URL(page.url()).pathname).toBe(`/${locale}/catalog`);
  await expect(page.locator('.catalog-grid .product-card')).toHaveCount(1);
  const selected = page.locator('.filter-tabs button[aria-pressed="true"]');
  await expect(selected).toHaveCount(1);
  const selectedIndex = await selected.evaluate(button => [...button.parentElement.querySelectorAll('button')].indexOf(button));
  assert.ok(selectedIndex > 0, 'Finder must select a material family, not the All filter');
  const filteredImage = page.locator('.catalog-grid .product-card img.material-art');
  const actualPath = new URL(await filteredImage.getAttribute('src'), base).pathname;
  const knownFamily = ['all', 'crystal', 'translucent', 'opaque', 'colored', 'mirror'][selectedIndex];
  assert.equal(actualPath, `/images/${knownFamily}.png`, 'Catalog card must match its selected family');
  if (expectedFamily) assert.equal(knownFamily, expectedFamily, 'Finder choice must select the intended family');
  await loadedImage(filteredImage, 'Filtered catalog image', /^\/images\//);
  await noHorizontalOverflow(`${locale} filtered catalog`);
}

async function prepareScreenshot() {
  // Image checks deliberately scroll lazy assets into view. Reset scroll/focus
  // so full-page captures do not freeze a sticky header mid-page or a skip link.
  await page.evaluate(async () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function keyboardDialog() {
  const trigger = page.locator('main .product-card .product-visual').first();
  await trigger.scrollIntoViewIfNeeded();
  await trigger.focus();
  await trigger.press('Enter');
  const dialog = page.locator('dialog[open]');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.configure-form')).toBeVisible();
  await expect(dialog.locator('input[type="number"]')).toHaveCount(4);
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(trigger, 'Closing the dialog must return keyboard focus to its material button').toBeFocused();
  assert.notEqual(await page.evaluate(() => getComputedStyle(document.body).overflow), 'hidden',
    'Escape must release the page scroll lock');
}

try {
  await home('pt');
  await officialImages();
  await applicationInteractions();
  await faqInteractions();
  await keyboardDialog();

  for (const [locale, language] of [['pt', 'pt-BR'], ['en', 'en'], ['es', 'es']]) {
    await page.getByLabel('Language / Idioma', { exact: true }).selectOption(locale);
    await expect.poll(() => new URL(page.url()).pathname).toBe(`/${locale}`);
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await expect(page.locator('main .product-card')).toHaveCount(5);
    const evidence = {
      heading: (await page.locator('main h1').innerText()).trim(),
      applications: (await page.locator('.application-tabs').innerText()).trim(),
      faq: (await page.locator('.faq-list summary').first().innerText()).trim(),
    };
    assert.ok(Object.values(evidence).every(value => value.length > 3), `${locale} sections require localized text`);
    assert.doesNotMatch(Object.values(evidence).join(' '), /undefined|\[object Object\]/);
    localeEvidence[locale] = evidence;
    await applicationInteractions();
    await finderInteraction(locale);
    await page.goBack();
    await expect(page.locator('main .product-card')).toHaveCount(5);
  }
  for (const key of ['heading', 'applications', 'faq']) {
    assert.equal(new Set(Object.values(localeEvidence).map(item => item[key])).size, 3,
      `${key} content must change between Portuguese, English and Spanish`);
  }

  for (const width of [320, 360, 390, 768, 880, 1440]) {
    const height = width >= 1000 ? 1000 : 900;
    await page.setViewportSize({ width, height });
    await home('pt');
    await officialImages();
    await page.evaluate(() => scrollTo(0, 0));
    await noHorizontalOverflow(`Portuguese home at ${width}px`);
    const menu = page.locator('.mobile-toggle');
    if (await menu.isVisible()) {
      await menu.click();
      await expect(page.locator('#mobile-nav')).toBeVisible();
      await expect(menu).toHaveAttribute('aria-expanded', 'true');
      await noHorizontalOverflow(`Open mobile menu at ${width}px`);
      await menu.click();
      await expect(page.locator('#mobile-nav')).toHaveCount(0);
      await expect(menu).toHaveAttribute('aria-expanded', 'false');
      await menu.focus();
      await menu.press('Enter');
      await expect(page.locator('#mobile-nav')).toBeVisible();
      await page.locator('#mobile-nav a').first().focus();
      await page.keyboard.press('Escape');
      await expect(page.locator('#mobile-nav')).toHaveCount(0);
      await expect(menu).toHaveAttribute('aria-expanded', 'false');
      await expect(menu, 'Escape must return keyboard focus to the mobile menu toggle').toBeFocused();
    }
    await keyboardDialog();
    await page.evaluate(() => scrollTo(0, 0));
    if (width === 390 || width === 1440) {
      await prepareScreenshot();
      await page.screenshot({ path: path.join(artifacts, `redesign-home-${width === 390 ? 'mobile' : 'desktop'}.png`),
        fullPage: true, animations: 'disabled' });
    }
    await finderInteraction('pt');
    await noHorizontalOverflow(`Filtered catalog at ${width}px`);
    if (width === 390) {
      await prepareScreenshot();
      await page.screenshot({ path: path.join(artifacts, 'redesign-catalog-mobile.png'), fullPage: true, animations: 'disabled' });
    }
    widthsChecked.push(width);
  }
  assert.deepEqual(brokenAssets, [], 'Official assets must not return HTTP errors');
  assert.deepEqual(errors, [], 'Redesign must not produce JavaScript page errors');
  await writeFile(path.join(artifacts, 'redesign-verification.json'), JSON.stringify({
    verifiedAt: new Date().toISOString(), base, widthsChecked, locales: localeEvidence,
    officialImages: [...imageEvidence.values()], errors, brokenAssets,
    checks: ['official logo and photos', 'five home families', 'PT/EN/ES content', 'keyboard application choices',
      'material finder and catalog filter', 'FAQ keyboard disclosure', 'dialog Escape and focus restoration',
      'mobile navigation Escape and focus restoration', 'responsive overflow', 'screenshots at scroll origin without focus artifacts'],
  }, null, 2) + '\n');
  console.log('Redesign smoke passed: official images, PT/EN/ES, five materials, applications, finder, FAQs, Escape and widths 320/360/390/768/880/1440.');
  console.log(`Screenshots and verification: ${artifacts}`);
} catch (error) {
  await page.screenshot({ path: path.join(artifacts, 'redesign-failure.png'), fullPage: true, animations: 'disabled' }).catch(() => {});
  throw error;
} finally {
  await context.close();
  await browser.close();
}
