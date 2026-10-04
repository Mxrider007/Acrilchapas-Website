import test from 'node:test';
import assert from 'node:assert/strict';
import { areaM2, readCart, validItem, quotePayload } from './domain.ts';

const item = { id: 'test', productId: 'sample-crystal', quantity: 3, widthMm: 1000, heightMm: 500, thicknessMm: 3 };
test('converts millimetres into total square metres, without claiming sheet yield', () => {
  assert.equal(areaM2(1000, 500, 3), 1.5);
  assert.equal(areaM2(500, 500), 0.25);
  assert.equal(areaM2(-1, 500), 0);
  assert.equal(areaM2(Infinity, 500), 0);
});
test('rejects corrupted and unsafe browser storage', () => {
  assert.deepEqual(readCart('not json'), []);
  assert.deepEqual(readCart('{"quantity": 1}'), []);
  assert.deepEqual(readCart(JSON.stringify([item, { ...item, quantity: -1 }, { ...item, productId: 'unknown' }, { ...item, quantity: 1.5 }, null])), [item]);
  assert.equal(validItem({ ...item, widthMm: '1000' }), false);
  assert.equal(validItem({ ...item, thicknessMm: 0 }), false);
});
test('draft explicitly remains unsubmitted and does not contain prices or payment details', () => {
  const draft = quotePayload('es', { name: 'Test', email: 'test@example.com', company: '', phone: '', country: 'Chile', postalCode: '', notes: 'Sample' }, [item]);
  assert.equal(draft.status, 'local-draft');
  assert.equal(draft.delivery.country, 'Chile');
  assert.equal(draft.items[0].thicknessMm, 3);
  assert.equal('id' in draft.items[0], false);
  assert.equal('price' in draft.items[0], false);
});
