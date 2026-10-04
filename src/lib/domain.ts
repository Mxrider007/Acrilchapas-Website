export type Locale = 'pt' | 'en' | 'es';
export type Family = 'crystal' | 'translucent' | 'opaque' | 'colored' | 'mirror';
export type Product = { id: string; family: Family; color: string; names: Record<Locale, string>; descriptions: Record<Locale, string> };
export type CartItem = { id: string; productId: string; quantity: number; widthMm: number; heightMm: number; thicknessMm: number };
export type Customer = { name: string; email: string; company: string; phone: string; country: string; postalCode: string; notes: string };

export const products: Product[] = [
  { id: 'sample-crystal', family: 'crystal', color: '#c4e7df', names: { pt: 'Cristal', en: 'Crystal clear', es: 'Cristal' }, descriptions: { pt: 'Transparência que deixa a sua ideia aparecer.', en: 'Transparency that lets your idea take shape.', es: 'Transparencia que deja ver tu idea.' } },
  { id: 'sample-translucent', family: 'translucent', color: '#edb781', names: { pt: 'Translúcido', en: 'Translucent', es: 'Translúcido' }, descriptions: { pt: 'Luz, cor e novas possibilidades de criação.', en: 'Light, color, and new creative possibilities.', es: 'Luz, color y nuevas posibilidades de creación.' } },
  { id: 'sample-opaque', family: 'opaque', color: '#256965', names: { pt: 'Opaco colorido', en: 'Opaque colors', es: 'Opaco de color' }, descriptions: { pt: 'Presença e personalidade em cada projeto.', en: 'Character and presence in every project.', es: 'Presencia y personalidad en cada proyecto.' } },
  { id: 'sample-colored', family: 'colored', color: '#99a8d8', names: { pt: 'Colorido', en: 'Colored', es: 'De color' }, descriptions: { pt: 'Uma nova perspectiva para as suas ideias.', en: 'A fresh perspective for your ideas.', es: 'Una nueva perspectiva para tus ideas.' } },
  { id: 'sample-mirror', family: 'mirror', color: '#b7baba', names: { pt: 'Espelhado', en: 'Mirrored', es: 'Espejado' }, descriptions: { pt: 'Reflexos que transformam os ambientes.', en: 'Reflections that transform spaces.', es: 'Reflejos que transforman los espacios.' } },
];

export function areaM2(widthMm: number, heightMm: number, quantity = 1): number {
  if (![widthMm, heightMm, quantity].every(n => Number.isFinite(n) && n > 0)) return 0;
  return widthMm * heightMm * quantity / 1_000_000;
}

export function validItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as CartItem;
  return typeof item.id === 'string' && item.id.length < 100 && products.some(p => p.id === item.productId)
    && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 10000
    && [item.widthMm, item.heightMm].every(n => Number.isFinite(n) && n > 0 && n <= 100000)
    && Number.isFinite(item.thicknessMm) && item.thicknessMm > 0 && item.thicknessMm <= 1000;
}

export function readCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try { const parsed: unknown = JSON.parse(raw); return Array.isArray(parsed) ? parsed.filter(validItem).slice(0, 100) : []; }
  catch { return []; }
}

export function quotePayload(locale: Locale, customer: Customer, items: CartItem[]) {
  return {
    schemaVersion: 1,
    status: 'local-draft',
    createdAt: new Date().toISOString(),
    locale,
    notice: 'Demonstration catalog. Availability, specifications, pricing, freight and payment terms require supplier confirmation. This is not an order or payment.',
    customer: { name: customer.name, email: customer.email, company: customer.company, phone: customer.phone },
    delivery: { country: customer.country, postalCode: customer.postalCode },
    items: items.map(({ productId, quantity, widthMm, heightMm, thicknessMm }) => ({ productId, quantity, widthMm, heightMm, thicknessMm })),
    notes: customer.notes,
  };
}
