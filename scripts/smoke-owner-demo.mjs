/** Uses existing VPS services and protected generated credentials. No local server. */
import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const base = process.env.WEBSITE_URL;
const factory = process.env.FACTORY_URL;
if (!base || !factory) throw Error('WEBSITE_URL and FACTORY_URL are required');
const credentials = JSON.parse(await readFile(process.env.DEMO_CREDENTIALS_FILE || new URL('../../.local/demo-accounts.json', import.meta.url), 'utf8')).accounts;
const folder = new URL('../.local/screenshots/owner-demo/', import.meta.url);
await mkdir(folder, { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox'], headless: true });
const owner = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const production = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
const httpFailures = [];
for (const page of [owner, production]) page.on('response', response => { if(response.status() >= 429) httpFailures.push({ status: response.status(), path: new URL(response.url()).pathname }); });
for (const page of [owner, production]) { page.setDefaultTimeout(20000); page.on('pageerror', e => errors.push(e.message)); }
async function staffLogin(page, role) {
  await page.goto(base + '/staff');
  await page.getByLabel('Usuário', { exact: true }).fill(credentials[role].username);
  await page.getByLabel('Senha', { exact: true }).fill(credentials[role].password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Visão geral', exact: true })).toBeVisible();
  const result = await page.request.get(base + '/api/staff/overview');
  assert.equal(result.status(), 200);
  return result.json();
}
async function factoryLogin(page, role) {
  // Native InvenTree intentionally blocks phone widths; the owner overview supports phones.
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(factory + '/web/login');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('login-username').fill(credentials[role].username);
  await page.getByLabel('login-password').fill(credentials[role].password);
  const loginResponse = page.waitForResponse(r => r.url().includes('/api/auth/v1/auth/login') && r.request().method() === 'POST');
  await page.locator('button[type=submit]').click();
  const response = await loginResponse;
  assert.equal(response.status(), 200, 'Factory login must authenticate role ' + role);
  console.log('Native factory login verified:', role);
  await expect(page.getByLabel('login-username')).toHaveCount(0, { timeout: 60000 });
  await page.goto(factory + '/plugin/acrilchapas/demo/');
  await expect(page.locator('h1')).toContainText('Produção, estoque');
}
try {
  const initial = await staffLogin(owner, 'owner');
  assert.equal(initial.factory.available, true, 'Factory snapshot must be available to the owner');
  assert.ok(initial.factory.runs.length >= 4);
  assert.ok(initial.stock.variants.filter(v => v.sku.startsWith('DEMO-OWNER-')).length === 5);
  await factoryLogin(production, 'production');
  const snapshot = await (await production.request.get(factory + '/plugin/acrilchapas/demo/status/')).json();
  const material = snapshot.stocks.find(s => s.sku === 'DEMO-OWNER-MMA');
  const before = Number(material.quantity);
  const ownerRow = owner.locator('[data-factory-stock="DEMO-OWNER-MMA"] [data-quantity]');
  await expect(ownerRow).toHaveText(before.toLocaleString('pt-BR'));
  async function adjust(delta, note) {
    const row = production.locator(`[data-stock="${material.id}"]`);
    await row.locator('summary').click();
    await row.locator('input[name=delta]').fill(String(delta));
    await row.locator('input[name=note]').fill(note);
    await Promise.all([production.waitForNavigation(), row.getByRole('button', { name: 'Registrar ajuste de teste' }).click()]);
    await expect(production.getByRole('status').first()).toContainText('Demonstração atualizada');
  }
  await adjust(3, 'Verificação de recebimento: proprietário acompanha em outra tela.');
  await expect(ownerRow).toHaveText((before + 3).toLocaleString('pt-BR'), { timeout: 20000 });
  await adjust(-3, 'Devolução das três unidades usadas no ensaio de atualização automática.');
  await expect(ownerRow).toHaveText(before.toLocaleString('pt-BR'), { timeout: 20000 });
  console.log('Two-session proof: production adjusted native stock; owner updated automatically in both directions without reload.');

  await production.locator('details').filter({ has: production.locator('#new-demo-run') }).locator('summary').click();
  const create = production.locator('#new-demo-run');
  const key = await create.locator('[name=key]').inputValue();
  await create.locator('[name=quantity]').fill('2');
  await create.locator('[name=note]').fill('Verificação de demonstração com duas chapas; sem fabricação física.');
  await Promise.all([production.waitForNavigation(), create.getByRole('button', { name: 'Criar ordem de teste' }).click()]);
  const code = 'DEMO-OWNER-OP-' + key.replaceAll('-', '');
  const current = await (await production.request.get(factory + '/plugin/acrilchapas/demo/status/')).json();
  const run = current.runs.find(r => r.code === code);
  assert.ok(run, 'New demonstration order must be persisted');
  const mmaBefore = Number(current.stocks.find(s => s.sku === 'DEMO-OWNER-MMA').quantity);
  const filmBefore = Number(current.stocks.find(s => s.sku === 'DEMO-OWNER-FILM').quantity);
  assert.equal(run.recipe.simulationOnly, true);
  for (const [target, label] of [['running', 'Iniciar simulação e consumir materiais'], ['autoclave', 'Registrar entrada na autoclave'], ['quality', 'Registrar saída e enviar para qualidade'], ['released', 'Aprovar e registrar chapas']]) {
    const card = production.locator(`[data-run="${run.id}"]`);
    if (target === 'autoclave') await card.locator('[name=autoclave]').selectOption('3');
    await card.locator('textarea[name=note]').fill('Etapa verificada no navegador pela chefia de produção.');
    await Promise.all([production.waitForNavigation(), card.getByRole('button', { name: label, exact: true }).click()]);
    const state = await (await production.request.get(factory + '/plugin/acrilchapas/demo/status/')).json();
    assert.equal(state.runs.find(r => r.id === run.id).state, target);
  }
  const final = await (await production.request.get(factory + '/plugin/acrilchapas/demo/status/')).json();
  assert.ok(Math.abs(Number(final.stocks.find(s => s.sku === 'DEMO-OWNER-MMA').quantity) - (mmaBefore - 3.54)) < 0.00001);
  assert.equal(Number(final.stocks.find(s => s.sku === 'DEMO-OWNER-FILM').quantity), filmBefore - 4);
  const output = final.stocks.filter(s => s.lot === code);
  assert.equal(output.length, 1); assert.equal(Number(output[0].quantity), 2);
  await expect(owner.locator('.ops-run-grid article').filter({ hasText: code })).toContainText('Liberado', { timeout: 20000 });
  await owner.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
  await owner.screenshot({ path: fileURLToPath(new URL('owner-overview-desktop.png', folder)), fullPage: true });
  await production.screenshot({ path: fileURLToPath(new URL('production-demo-desktop.png', folder)), fullPage: true });
  await owner.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => owner.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await owner.screenshot({ path: fileURLToPath(new URL('owner-overview-mobile.png', folder)), fullPage: true });

  // Role checks use the actual HTTP endpoints and the role's own CSRF token.
  const sales = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await staffLogin(sales, 'sales');
  const session = await (await sales.request.get(base + '/api/staff/session')).json();
  assert.equal(session.user.role, 'sales');
  const forbidden = await sales.request.post(base + '/api/staff/inventory/DEMO-OWNER-CRYSTAL', { headers: { 'X-CSRF-Token': session.csrfToken }, data: { delta: 1, reason: 'Must be denied for sales' } });
  assert.equal(forbidden.status(), 403);
  await sales.getByRole('button', { name: 'Orçamentos', exact: true }).click();
  await expect(sales.getByRole('row').filter({ hasText: 'Comunicação Visual Horizonte' })).toBeVisible();
  await sales.screenshot({ path: fileURLToPath(new URL('sales-demo.png', folder)), fullPage: true });
  await sales.close();
  // Allow the existing public per-IP burst bucket to recover before another native SPA login.
  await new Promise(resolve => setTimeout(resolve, 25000));
  await factoryLogin(owner, 'owner');
  await expect(owner.locator('#new-demo-run')).toHaveCount(1);
  assert.equal((await owner.request.get(factory + '/admin/auth/user/')).status(), 200);
  assert.deepEqual(errors, []);
  await writeFile(new URL('verification.json', folder), JSON.stringify({ passed: true, verifiedAt: new Date().toISOString(), automaticOwnerStockRefresh: true, mmaConsumptionKg: 3.54, protectionFilmsConsumed: 4, outputQuantity: 2, code, roleBoundary: 'sales inventory mutation denied', viewport: 390 }, null, 2));
  console.log('Owner demo passed: role logins, restricted sales, native stock, traced consumption/output, automatic owner refresh, mobile and owner administration.');
} catch (error) {
  console.error('Browser failure context:', { ownerPath: new URL(owner.url()).pathname, productionPath: new URL(production.url()).pathname, httpFailures });
  await owner.screenshot({ path: fileURLToPath(new URL('failure-owner.png', folder)) }).catch(() => {});
  await production.screenshot({ path: fileURLToPath(new URL('failure-production.png', folder)) }).catch(() => {});
  throw error;
} finally { await browser.close(); }
