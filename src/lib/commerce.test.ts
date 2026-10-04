import test from 'node:test';
import assert from 'node:assert/strict';
import { products } from './domain.ts';
import { catalogProducts, CommerceError, prepareSubmission, quoteReceipt, saveQuotation } from './commerce.ts';

const item = { id: 'test', productId: 'sample-crystal', quantity: 2, widthMm: 1000, heightMm: 500, thicknessMm: 3 };
const customer = { name: 'Test', email: 'test@example.test', company: '', phone: '', country: 'Chile', postalCode: '', notes: '' };
const catalog = { mode: 'local-demo', currency: 'BRL', pricing: 'quote_required', products: products.map(product => ({ id: product.id, family: product.family, name: product.names, description: product.descriptions, demo: true })) };

test('uses service catalog membership and localized copy while rejecting mismatched or non-demo data', () => {
  const row = { ...catalog.products[0], name: { ...catalog.products[0].name, pt: 'Texto local aprovado para teste' } };
  assert.deepEqual(catalogProducts({ ...catalog, products: [row] }), [{ ...products[0], names: row.name }]);
  assert.deepEqual(catalogProducts({ ...catalog, products: [] }), []);
  for (const invalid of [{ ...catalog, mode: 'live' }, { ...catalog, products: [{ ...row, demo: false }] }, { ...catalog, products: [row, row] }, { ...catalog, products: [{ ...row, name: { pt: 'Falta tradução' } }] }]) {
    assert.throws(() => catalogProducts(invalid), CommerceError);
  }
});

test('retries identical business input with the same payload and idempotency key; changed input gets a new key', () => {
  const first = prepareSubmission('es', customer, [item]);
  assert.equal(prepareSubmission('es', customer, [{ ...item, id: 'browser-row-replaced' }], first), first);
  const changed = prepareSubmission('es', { ...customer, notes: 'Changed requirement' }, [item], first);
  assert.notEqual(changed.key, first.key);
  assert.notEqual(prepareSubmission('en', customer, [item], first).key, first.key);
});

test('accepts only an explicit local receipt and never treats arbitrary API JSON as a saved inquiry', () => {
  const receipt = { reference: 'ACQ-12345678', status: 'received-local', createdAt: new Date().toISOString(), demo: true };
  assert.deepEqual(quoteReceipt({ ...receipt, customer: customer }), receipt);
  for (const invalid of [{ ...receipt, status: 'paid' }, { ...receipt, demo: false }, { ...receipt, reference: 'invalid' }, { ...receipt, createdAt: 'invalid' }]) {
    assert.throws(() => quoteReceipt(invalid), CommerceError);
  }
});

test('maps validation failures and unknown save outcomes without exposing server messages', async t => {
  const submission = prepareSubmission('pt', customer, [item]);
  for (const [status, kind] of [[400, 'invalid'], [409, 'conflict'], [413, 'tooLarge'], [503, 'unavailable']] as const) {
    t.mock.method(globalThis, 'fetch', async () => new Response('{"error":{"message":"private detail"}}', { status }));
    await assert.rejects(saveQuotation(submission), error => error instanceof CommerceError && error.kind === kind && !error.message.includes('private'));
    t.mock.restoreAll();
  }
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('connection lost after request'); });
  await assert.rejects(saveQuotation(submission), error => error instanceof CommerceError && error.kind === 'unavailable');
});
