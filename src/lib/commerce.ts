import { products, quotePayload } from './domain';
import type { CartItem, Customer, Locale, Product } from './domain';

export type QuoteReceipt = { reference: string; status: 'received-local'; createdAt: string; demo: true; accessToken?:string };
export type Submission = { fingerprint: string; key: string; payload: ReturnType<typeof quotePayload> };
export type SaveError = 'unavailable' | 'invalid' | 'conflict' | 'tooLarge';

export class CommerceError extends Error {
  constructor(public readonly kind: SaveError) { super(kind); }
}

function localizedCopy(value: unknown): value is Record<Locale, string> {
  if (!value || typeof value !== 'object') return false;
  return (['pt', 'en', 'es'] as const).every(locale => {
    const copy = (value as Record<string, unknown>)[locale];
    return typeof copy === 'string' && copy.trim().length > 0 && copy.length <= 3000;
  });
}

// This adapter deliberately supports only the demonstrative families. Real SKUs
// require an approved catalog contract before replacing these local examples.
export function catalogProducts(value: unknown): Product[] {
  if (!value || typeof value !== 'object') throw new CommerceError('unavailable');
  const catalog = value as Record<string, unknown>;
  if (catalog.mode !== 'local-demo' || catalog.currency !== 'BRL' || catalog.pricing !== 'quote_required'
    || !Array.isArray(catalog.products) || catalog.products.length > products.length) throw new CommerceError('unavailable');
  const ids = new Set<string>();
  return catalog.products.map((value: unknown) => {
    if (!value || typeof value !== 'object') throw new CommerceError('unavailable');
    const row = value as Record<string, unknown>;
    const fixture = products.find(product => product.id === row.id);
    if (!fixture || ids.has(fixture.id) || row.family !== fixture.family || row.demo !== true
      || !localizedCopy(row.name) || !localizedCopy(row.description)) throw new CommerceError('unavailable');
    ids.add(fixture.id);
    return { ...fixture, names: row.name, descriptions: row.description };
  });
}

export function prepareSubmission(locale: Locale, customer: Customer, items: CartItem[], previous?: Submission): Submission {
  const payload = quotePayload(locale, customer, items);
  const { createdAt: _createdAt, status: _status, notice: _notice, ...businessData } = payload;
  const fingerprint = JSON.stringify(businessData);
  return previous?.fingerprint === fingerprint ? previous : { fingerprint, key: crypto.randomUUID(), payload };
}

export function quoteReceipt(value: unknown): QuoteReceipt {
  if (!value || typeof value !== 'object') throw new CommerceError('unavailable');
  const receipt = value as QuoteReceipt;
  if (typeof receipt.reference !== 'string' || !/^ACQ-[A-Za-z0-9-]{8,80}$/.test(receipt.reference)
    || receipt.status !== 'received-local' || receipt.demo !== true
    || typeof receipt.createdAt !== 'string' || !Number.isFinite(Date.parse(receipt.createdAt))) throw new CommerceError('unavailable');
  return { reference: receipt.reference, status: receipt.status, createdAt: receipt.createdAt, demo: true,
    ...(typeof receipt.accessToken==='string'&&/^[A-Za-z0-9_-]{43}$/.test(receipt.accessToken)?{accessToken:receipt.accessToken}:{}) };
}

export async function saveQuotation(submission: Submission): Promise<QuoteReceipt> {
  try {
    const response = await fetch('/api/quotations', {
      method: 'POST', credentials: 'omit', signal: AbortSignal.timeout(10000),
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': submission.key },
      body: JSON.stringify(submission.payload),
    });
    if (response.status !== 200 && response.status !== 201) {
      throw new CommerceError(response.status === 409 ? 'conflict' : response.status === 413 ? 'tooLarge' : [400, 415].includes(response.status) ? 'invalid' : 'unavailable');
    }
    return quoteReceipt(await response.json());
  } catch (error) {
    if (error instanceof CommerceError) throw error;
    throw new CommerceError('unavailable');
  }
}
