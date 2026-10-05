import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const base = process.env.WEBSITE_URL || (process.argv.includes('--built') ? 'http://127.0.0.1:8080' : 'http://127.0.0.1:5173');
const factoryBase = (process.env.FACTORY_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
const artifact = new URL('../.local/screenshots/', import.meta.url);
await mkdir(artifact, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  if (!process.argv.includes('--factory-only')) {
  await page.goto(`${base}/pt`);
  await page.locator('h1').waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'), 'pt-BR');
  await page.screenshot({ path: fileURLToPath(new URL('homepage-desktop.png', artifact)), fullPage: true });
  await page.getByLabel('Language / Idioma').selectOption('en');
  assert.match(await page.locator('h1').innerText(), /ideas/i);
  await page.getByLabel('Language / Idioma').selectOption('es');
  assert.equal(await page.locator('html').getAttribute('lang'), 'es');
  await page.goto(`${base}/pt/catalog`);
  assert.equal(await page.locator('.product-card').count(), 5);
  await page.locator('.filter-tabs button').filter({ hasText: /^Cristal$/ }).click();
  assert.equal(await page.locator('.product-card').count(), 1);
  await page.locator('.card-button').first().click();
  const form = page.locator('.configure-form');
  const numbers = form.locator('input[type=number]');
  for (const [index, value] of ['1000', '500', '3', '2'].entries()) await numbers.nth(index).fill(value);
  await form.locator('button[type=submit]').click();
  await page.locator('.cart-button').click();
  assert.equal(await page.locator('.cart-item').count(), 1);
  await page.locator('.quote-summary > button').click();
  await page.locator('.customer-form input[autocomplete=name]').fill('Cliente de teste');
  await page.locator('.customer-form input[type=email]').fill('teste@example.test');
  await page.locator('.customer-form input[autocomplete=country-name]').fill('Brasil');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('.customer-form button[type=submit]').click();
  const download = await downloadPromise;
  const content = JSON.parse(await readFile(await download.path(), 'utf8'));
  assert.equal(content.status, 'local-draft');
  assert.equal(content.items[0].quantity, 2);
  await page.keyboard.press('Escape');
  await page.reload();
  await page.locator('.cart-button').click();
  assert.equal(await page.locator('.cart-item').count(), 1);
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/pt`);
  await page.screenshot({ path: fileURLToPath(new URL('homepage-mobile.png', artifact)), fullPage: true });
  const overflow = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).map(el => ({ tag: el.tagName, class: el.className.baseVal ?? el.className, right: el.getBoundingClientRect().right })).slice(0, 12));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, JSON.stringify(overflow));
  await page.locator('.mobile-toggle').click();
  assert.equal(await page.locator('#mobile-nav').isVisible(), true);
  await page.goto(`${base}/es/catalog`);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: fileURLToPath(new URL('catalog-mobile.png', artifact)), fullPage: true });
  assert.deepEqual(errors, []);
  console.log('Browser smoke passed: PT/EN/ES, catalog filtering, quote dimensions, draft download, persistence, mobile navigation and overflow.');
  if (process.argv.includes('--commerce')) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const catalogResponse = await page.request.get(`${base}/api/catalog`);
    assert.equal(catalogResponse.status(), 200, 'Local commerce service must be running for --commerce');
    const catalog = await catalogResponse.json();
    assert.equal(catalog.mode, 'local-demo');
    assert.equal(catalog.products.length, 5);

    async function customerForm(locale) {
      await page.goto(`${base}/${locale}/catalog`);
      await expect(page.locator('.catalog-status')).toContainText({ pt: 'carregado do serviço de teste', en: 'loaded from the demonstration service', es: 'cargado desde el servicio de prueba' }[locale]);
      await page.locator('.cart-button').click();
      await page.locator('.quote-summary > button').click();
      await page.locator('.customer-form input[autocomplete=name]').fill('Cliente de teste local');
      await page.locator('.customer-form input[type=email]').fill('commerce-smoke@example.test');
      await page.locator('.customer-form input[autocomplete=country-name]').fill(locale === 'es' ? 'Chile' : 'Brasil');
    }

    async function save(expectedStatus) {
      const responsePromise = page.waitForResponse(response => response.url().endsWith('/api/quotations') && response.request().method() === 'POST');
      await page.getByTestId('save-local-quote').click();
      const response = await responsePromise;
      assert.equal(response.status(), expectedStatus);
      const receipt = await response.json();
      assert.equal(receipt.status, 'received-local');
      assert.equal(receipt.demo, true);
      assert.match(receipt.reference, /^ACQ-[A-F0-9]{32}$/);
      await expect(page.getByTestId('local-quote-receipt')).toContainText(receipt.reference);
      return { receipt, key: response.request().headers()['idempotency-key'] };
    }

    await customerForm('pt');
    const initial = await save(201);
    const replay = await save(200);
    assert.equal(replay.receipt.reference, initial.receipt.reference);
    assert.equal(replay.key, initial.key);
    await page.locator('.customer-form textarea').fill('Dimensões a confirmar em uma nova consulta local.');
    await expect(page.getByTestId('local-quote-receipt')).toHaveCount(0);
    const changed = await save(201);
    assert.notEqual(changed.receipt.reference, initial.receipt.reference);
    assert.notEqual(changed.key, initial.key);

    // Simulate a lost response after the real service has committed the record.
    // Retrying must recover that exact reference instead of inserting twice.
    await page.locator('.customer-form textarea').fill('Tentativa com resposta interrompida.');
    let lostReceipt;
    let lostKey;
    await page.route('**/api/quotations', async route => {
      lostKey = route.request().headers()['idempotency-key'];
      const response = await route.fetch();
      assert.equal(response.status(), 201);
      lostReceipt = await response.json();
      await route.abort('failed');
    }, { times: 1 });
    await page.getByTestId('save-local-quote').click();
    await expect(page.locator('.customer-form [role=alert]')).toContainText('Não foi possível confirmar');
    const recovered = await save(200);
    assert.equal(recovered.receipt.reference, lostReceipt.reference);
    assert.equal(recovered.key, lostKey);
    const storedBrowserData = await page.evaluate(() => JSON.stringify(localStorage));
    assert.equal(storedBrowserData.includes('commerce-smoke@example.test'), false);
    assert.equal(storedBrowserData.includes('Cliente de teste local'), false);

    await customerForm('en');
    await save(201);
    await expect(page.getByTestId('local-quote-receipt')).toContainText('Inquiry saved in the demonstration environment.');
    await customerForm('es');
    await save(201);
    await expect(page.getByTestId('local-quote-receipt')).toContainText('Solicitud guardada en el entorno de demostración.');
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.locator('dialog').evaluate(element => element.scrollWidth <= element.clientWidth), true, 'Receipt must fit mobile dialog');
    await page.getByTestId('local-quote-receipt').scrollIntoViewIfNeeded();
    await page.screenshot({ path: fileURLToPath(new URL('quotation-local-mobile.png', artifact)) });

    await page.route('**/api/catalog', route => route.abort('failed'));
    await page.goto(`${base}/pt/catalog`);
    await expect(page.locator('.catalog-status')).toContainText('Exibindo exemplos incluídos no protótipo');
    assert.equal(await page.locator('.product-card').count(), 5);
    await page.unroute('**/api/catalog');
    await page.reload();
    await expect(page.locator('.catalog-status')).toContainText('carregado do serviço de teste');
    assert.deepEqual(errors, []);
    console.log('Commerce browser smoke passed: real catalog, PT/EN/ES demonstration receipts, idempotent retries including a lost response, changed input, private browser storage, mobile receipt and offline catalog fallback.');
  }
  }
  if (process.argv.includes('--factory') || process.argv.includes('--factory-only')) {
    const credentials = JSON.parse(await readFile(process.env.FACTORY_CREDENTIALS_FILE || new URL('../../.local/admin-credentials.json', import.meta.url), 'utf8'));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${factoryBase}/web/login`);
    await page.getByLabel('login-username').fill(credentials.username);
    await page.getByLabel('login-password').fill(credentials.password);
    const loginResponse = page.waitForResponse(response => response.url().includes('/api/auth/v1/auth/login') && response.request().method() === 'POST');
    await page.locator('button[type=submit]').click();
    const result = await loginResponse;
    if (result.status() !== 200) {
      const text = await result.text();
      const headings = [...text.matchAll(/<(?:title|h1|h2|p)[^>]*>([^<]{1,250})/g)].slice(0, 4).map(match => match[1]);
      throw new Error(`Login returned ${result.status()}: ${headings.join(' | ')}`);
    }
    assert.equal((await result.json()).meta?.is_authenticated, true, 'Native login must authenticate the session');
    // InvenTree still loads the authenticated profile and application state
    // after the login response. Navigating immediately can cancel that flow.
    await expect(page.getByLabel('login-username')).toHaveCount(0, { timeout: 60000 });
    if (factoryBase.startsWith('https://')) {
      const cookies = await page.context().cookies(factoryBase);
      const sessionCookie = cookies.find(cookie => cookie.name === 'sessionid');
      assert.ok(sessionCookie?.secure && sessionCookie.httpOnly, 'Factory session must be Secure and HttpOnly on HTTPS');
    }
    if (process.env.FACTORY_MEDIA_TEST_PATH) {
      const mediaUrl = `${factoryBase}/media/${process.env.FACTORY_MEDIA_TEST_PATH}`;
      assert.equal((await page.request.get(mediaUrl)).status(), 200, 'Authenticated media must be readable');
      const anonymous = await browser.newContext();
      try { assert.equal((await anonymous.request.get(mediaUrl)).status(), 401, 'Media must reject anonymous access'); }
      finally { await anonymous.close(); }
    }
    await page.goto(`${factoryBase}/plugin/acrilchapas/`);
    await page.locator('h1').waitFor();
    await page.screenshot({ path: fileURLToPath(new URL('factory-desktop.png', artifact)), fullPage: true });
    await page.getByRole('link', { name: 'DEMO-CAST-001', exact: true }).click();
    await page.locator('textarea[name=note]').first().fill('Local smoke test; demo must not start.');
    await page.locator('button[type=submit]').first().click();
    assert.match(await page.locator('[role=status]').innerText(), /demonstrativos/);
    console.log('Factory browser smoke passed: login, production dashboard, batch page, demo start blocked.');
    await page.goto(`${factoryBase}/web/`);
    await page.waitForLoadState('networkidle');
    assert.equal(await page.getByLabel('login-username').count(), 0, 'Native interface must keep the authenticated session');
    const factoryLink = page.getByRole('link', { name: 'Abrir fábrica Acrilchapas →' });
    await factoryLink.waitFor();
    await page.reload();
    await factoryLink.waitFor();
    await expect.poll(() => factoryLink.evaluate(link => {
      const card = link.closest('.react-grid-item');
      if (!card) return false;
      const parent = card.getBoundingClientRect();
      const child = link.getBoundingClientRect();
      return parent.width >= 300 && child.right <= parent.right && child.bottom <= parent.bottom;
    })).toBe(true);
    const profile = await page.request.get(`${factoryBase}/api/user/me/`);
    assert.ok((await profile.json()).profile.widgets.widgets.includes('p-acrilchapas-factory'), 'Factory widget persists in the native user profile');
    await page.screenshot({ path: fileURLToPath(new URL('inventree-desktop.png', artifact)), fullPage: true });
    await factoryLink.click();
    await page.waitForURL('**/plugin/acrilchapas/');
    await page.getByRole('link', { name: 'DEMO-CAST-001', exact: true }).waitFor();
    await page.goto(`${factoryBase}/web/`);
    await factoryLink.waitFor();
    await page.getByLabel('open-spotlight', { exact: true }).click();
    await page.getByPlaceholder('Buscar...').fill('Fábrica Acrilchapas');
    await page.getByText('Abrir lotes de fabricação e qualidade', { exact: true }).click();
    await page.waitForURL('**/plugin/acrilchapas/');
    assert.deepEqual(errors, []);
    console.log('Native Portuguese InvenTree interface, persistent factory widget and spotlight action passed with no JavaScript page errors.');
  }
} catch (error) {
  // Do not retain screenshots containing login credentials on an auth failure.
  if (!page.url().includes('login')) await page.screenshot({ path: fileURLToPath(new URL('failure.png', artifact)), fullPage: true });
  throw error;
} finally { await browser.close(); }
