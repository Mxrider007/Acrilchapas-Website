import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { areaM2, products as sampleProducts, quotePayload, readCart, validItem } from './lib/domain';
import type { CartItem, Customer, Family, Locale, Product } from './lib/domain';
import { localeTags, translations } from './lib/i18n';
import { catalogProducts, CommerceError, prepareSubmission, saveQuotation } from './lib/commerce';
import type { QuoteReceipt, Submission } from './lib/commerce';
import { AcrylicArt, Brand, Icon } from './components/BrandAssets';
import HomePage from './components/HomePage';
import { experience } from './lib/experience';
import './public.css';

type Page = 'home' | 'catalog';
type Modal = 'configure' | 'cart' | 'privacy' | null;
const CART_KEY = 'acrilchapas.quote.v1';
const LOCALE_KEY = 'acrilchapas.locale';
const emailAddress = 'contato@acrilchapas.com.br';
const safeRead = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const mailLink = (subject: string, body: string) => `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

function getRoute(): { locale: Locale; page: Page } {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const stored = safeRead(LOCALE_KEY);
  const locale = ['pt', 'en', 'es'].includes(segments[0]) ? segments[0] : stored && ['pt', 'en', 'es'].includes(stored) ? stored : 'pt';
  return { locale: locale as Locale, page: segments[1] === 'catalog' ? 'catalog' : 'home' };
}

function Dialog({ children, title, onClose, wide = false }: { children: ReactNode; title: string; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => { const node = ref.current; const previous = document.activeElement as HTMLElement | null; node?.showModal(); const saved = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { node?.close(); document.body.style.overflow = saved; previous?.focus(); }; }, []);
  return <dialog ref={ref} className={`dialog ${wide ? 'dialog-wide' : ''}`} aria-labelledby={titleId} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div className="dialog-inner"><h2 id={titleId} className="sr-only">{title.split('|')[0]}</h2>{children}<button type="button" className="icon-button dialog-close" aria-label={title.split('|')[1] || 'Close'} onClick={onClose}><Icon name="close" /></button></div></dialog>;
}

function ProductCard({ product, locale, onConfigure, store = false }: { product: Product; locale: Locale; onConfigure: (product: Product) => void; store?: boolean }) {
  const t = translations[locale];
  const copy = experience[locale];
  return <article className={`product-card ${store ? 'store-card' : ''}`}><button className="product-visual" onClick={() => onConfigure(product)} aria-label={`${store ? t.configure : t.viewMaterial}: ${product.names[locale]}`}><span className="product-category">CAST</span>{store && <span className="sample-label">{t.sample}</span>}<AcrylicArt color={product.color} family={product.family} /><span className="product-open"><Icon name="diagonal" size={19} /></span></button><div className="product-info"><div className="product-name-row"><h3>{product.names[locale]}</h3><Icon name="diagonal" size={18} /></div><p>{product.descriptions[locale]}</p>{store && <><div className="material-use">{copy.uses[product.family]}</div><div className="product-price">{t.priceNote}</div><button className="button button-outline card-button" onClick={() => onConfigure(product)}>{t.configure}<Icon name="plus" size={17} /></button></>}</div></article>;
}

export default function App() {
  const [route, setRoute] = useState(getRoute);
  const { locale, page } = route;
  const t = translations[locale];
  const copy = experience[locale];
  const [mobileMenu, setMobileMenu] = useState(false);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [products, setProducts] = useState(sampleProducts);
  const [catalogState, setCatalogState] = useState<'loading' | 'connected' | 'offline'>('loading');
  const [selectedId, setSelectedId] = useState(sampleProducts[0].id);
  const [family, setFamily] = useState<Family | 'all'>('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>(() => readCart(safeRead(CART_KEY)));
  const [customerForm, setCustomerForm] = useState(false);
  const [toast, setToast] = useState('');
  const [storageFailed, setStorageFailed] = useState(false);
  const [customer, setCustomer] = useState<Customer>({ name: '', email: '', company: '', phone: '', country: '', postalCode: '', notes: '' });
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [thickness, setThickness] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState<QuoteReceipt | null>(null);
  const submissionRef = useRef<Submission | undefined>(undefined);
  const savePendingRef = useRef(false);
  const formRevisionRef = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const selected = products.find(p => p.id === selectedId) || sampleProducts.find(p => p.id === selectedId) || sampleProducts[0];
  const catalogNotice = catalogState === 'connected' ? t.catalogConnected : catalogState === 'offline' ? t.catalogOffline : t.catalogLoading;
  const number = (value: number, digits = 2) => new Intl.NumberFormat(localeTags[locale], { maximumFractionDigits: digits }).format(value);
  const totalArea = cart.reduce((sum, item) => sum + areaM2(item.widthMm, item.heightMm, item.quantity), 0);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    let mounted = true;
    fetch('/api/catalog', { credentials: 'omit', signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Catalog unavailable'); return response.json(); })
      .then(catalogProducts)
      .then(catalog => { if (mounted) { setProducts(catalog); setCatalogState('connected'); } })
      .catch(() => { if (mounted) setCatalogState('offline'); })
      .finally(() => window.clearTimeout(timeout));
    return () => { mounted = false; controller.abort(); window.clearTimeout(timeout); };
  }, []);
  useEffect(() => { formRevisionRef.current += 1; setReceipt(null); setFormError(''); setFormSuccess(''); }, [customer, cart, locale]);
  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); setStorageFailed(false); } catch { setStorageFailed(true); }
  }, [cart]);
  useEffect(() => {
    document.documentElement.lang = localeTags[locale];
    document.title = `Acrilchapas — ${page === 'catalog' ? copy.catalog : `${copy.heroTitle} ${copy.heroAccent}`}`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', copy.heroText);
    try { localStorage.setItem(LOCALE_KEY, locale); } catch { /* Language still works for this session. */ }
    if (location.pathname === '/') history.replaceState(null, '', `/${locale}`);
  }, [locale, page, t, copy]);
  useEffect(() => { const onPop = () => { setRoute(getRoute()); setMobileMenu(false); setModal(null); }; window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop); }, []);
  useEffect(() => {
    if (!mobileMenu) return;
    const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMobileMenu(false); mobileToggleRef.current?.focus(); } };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [mobileMenu]);
  useEffect(() => { if (!toast) return; const timeout = window.setTimeout(() => setToast(''), 6000); return () => clearTimeout(timeout); }, [toast]);

  function navigate(nextPage: Page, section?: string, nextLocale = locale) {
    const path = `/${nextLocale}${nextPage === 'catalog' ? '/catalog' : ''}${section ? `#${section}` : ''}`;
    history.pushState(null, '', path);
    setRoute({ locale: nextLocale, page: nextPage }); setMobileMenu(false);
    if (nextLocale !== locale) { setFormError(''); setFormSuccess(''); setToast(''); }
    setTimeout(() => { if (!section && nextPage !== page) document.getElementById('main')?.focus({ preventScroll: true }); if (section) document.getElementById(section)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); else window.scrollTo(0, 0); }, 30);
  }
  function configure(product = products[0]) { if (!product) { setToast(t.noResults); return; } setSelectedId(product.id); setWidth(''); setHeight(''); setThickness(''); setQuantity('1'); setFormError(''); setModal('configure'); }
  function openCart() { setModal('cart'); setCustomerForm(false); setFormError(''); setFormSuccess(''); }
  function addItem(event: FormEvent) {
    event.preventDefault();
    const item = { id: crypto.randomUUID(), productId: selectedId, widthMm: Number(width), heightMm: Number(height), thicknessMm: Number(thickness), quantity: Number(quantity) };
    if (!validItem(item) || !products.some(product => product.id === item.productId)) { setFormError(t.invalidDimensions); return; }
    if (cart.length >= 100) { setFormError(t.itemLimit); return; }
    setCart(previous => [...previous, item]); setModal(null); setToast(t.added);
  }
  function validateCustomer(): boolean {
    setFormError(''); setFormSuccess('');
    if (!cart.length) { setFormError(t.noItems); return false; }
    if (!formRef.current?.reportValidity() || !customer.name.trim() || !customer.country.trim()) { setFormError(t.required); return false; }
    return true;
  }
  function downloadQuote() {
    if (!validateCustomer()) return;
    const blob = new Blob([JSON.stringify(quotePayload(locale, customer, cart), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `acrilchapas-${locale}-${new Date().toISOString().slice(0, 10)}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setFormSuccess(t.saved);
  }
  async function saveLocalQuote() {
    if (savePendingRef.current || !validateCustomer()) return;
    const submission = prepareSubmission(locale, customer, cart, submissionRef.current);
    submissionRef.current = submission;
    const revision = formRevisionRef.current;
    savePendingRef.current = true;
    setSaving(true); setReceipt(null);
    try {
      const saved = await saveQuotation(submission);
      if (formRevisionRef.current === revision) setReceipt(saved);
    }
    catch (error) {
      const kind = error instanceof CommerceError ? error.kind : 'unavailable';
      if (formRevisionRef.current === revision) setFormError(kind === 'conflict' ? t.saveConflict : kind === 'tooLarge' ? t.saveTooLarge : kind === 'invalid' ? t.saveInvalid : t.saveUnavailable);
    } finally { savePendingRef.current = false; setSaving(false); }
  }
  function composeQuote() {
    if (!validateCustomer()) return;
    const lines = [t.quoteEmailIntro, '', t.draftLabel, '', ...cart.map(item => `${(products.find(p => p.id === item.productId) || sampleProducts.find(p => p.id === item.productId))!.names[locale]}: ${item.quantity} ${t.unit} · ${item.widthMm} × ${item.heightMm} × ${item.thicknessMm} mm`), '', `${t.name}: ${customer.name}`, `${t.email}: ${customer.email}`, `${t.company}: ${customer.company}`, `${t.phone}: ${customer.phone}`, `${t.country}: ${customer.country}`, `${t.postal}: ${customer.postalCode}`, '', customer.notes, '', t.demoText, t.quoteNote];
    const href = mailLink(t.quoteSubject, lines.join('\n'));
    if (href.length > 1900) { setFormError(t.mailTooLong); return; }
    window.location.href = href; setFormSuccess(t.mailReady);
  }
  const filtered = products.filter(p => (family === 'all' || p.family === family) && `${p.names[locale]} ${p.descriptions[locale]}`.toLocaleLowerCase(locale).normalize('NFD').replace(/\p{Diacritic}/gu, '').includes(search.toLocaleLowerCase(locale).normalize('NFD').replace(/\p{Diacritic}/gu, '').trim()));


  return <div className="public-site">
    <a className="skip-link" href="#main">{t.skip}</a>
    <div className="announcement"><div className="container"><span>{t.topLine}</span><span className="top-location"><span className="tiny-dot" />{t.topLocation}</span></div></div>
    <header className="site-header"><div className="container header-row"><a href={`/${locale}`} className="brand-link" aria-label={`Acrilchapas — ${t.home}`} onClick={e => { e.preventDefault(); navigate('home'); }}><Brand /></a><nav className="desktop-nav" aria-label={t.menu}><a href={`/${locale}#materials`} onClick={e => { e.preventDefault(); navigate('home', 'materials'); }}>{t.materials}</a><a href={`/${locale}#solutions`} onClick={e => { e.preventDefault(); navigate('home', 'solutions'); }}>{t.solutions}</a><a href={`/${locale}#exports`} onClick={e => { e.preventDefault(); navigate('home', 'exports'); }}>{t.exports}<Icon name="diagonal" size={12} /></a><a href={`/${locale}/catalog`} className={page === 'catalog' ? 'active' : ''} onClick={e => { e.preventDefault(); navigate('catalog'); }}>{copy.catalog}</a></nav><div className="header-actions"><label className="language"><Icon name="globe" size={16} /><span className="sr-only">Language / Idioma</span><select value={locale} onChange={e => navigate(page, undefined, e.target.value as Locale)} aria-label="Language / Idioma"><option value="pt">PT</option><option value="en">EN</option><option value="es">ES</option></select></label><button className="cart-button" onClick={openCart} aria-label={`${t.cart} (${count})`}><Icon name="bag" size={20} />{count > 0 && <span className="cart-count">{count > 99 ? '99+' : count}</span>}</button><button className="button button-dark header-quote" onClick={openCart}>{t.requestQuote}<Icon name="diagonal" size={15} /></button><button ref={mobileToggleRef} className="icon-button mobile-toggle" aria-label={mobileMenu ? t.close : t.menu} aria-expanded={mobileMenu} aria-controls="mobile-nav" onClick={() => setMobileMenu(!mobileMenu)}><Icon name={mobileMenu ? 'close' : 'menu'} /></button></div></div>{mobileMenu && <nav id="mobile-nav" className="mobile-nav" aria-label={t.menu}>{(['materials', 'solutions', 'exports'] as const).map(section => <a key={section} href={`/${locale}#${section}`} onClick={e => { e.preventDefault(); navigate('home', section); }}>{t[section]}<Icon name="arrow" /></a>)}<a href={`/${locale}/catalog`} onClick={e => { e.preventDefault(); navigate('catalog'); }}>{t.shop}<Icon name="arrow" /></a><button className="button button-dark" onClick={() => { setMobileMenu(false); openCart(); }}>{t.requestQuote}</button></nav>}</header>
    <main id="main" tabIndex={-1}>
      {page === 'home' ? <HomePage locale={locale} products={products}
        renderProduct={product => <ProductCard product={product} locale={locale} onConfigure={configure} key={product.id} />}
        onCatalog={(value = 'all') => { setFamily(value); setSearch(''); navigate('catalog'); }}
        onConfigure={(value) => configure(products.find(product => product.family === value))}
        onQuote={openCart} /> : <>
        <section className="catalog-header container"><div><div className="breadcrumb"><a href={`/${locale}`} onClick={e => { e.preventDefault(); navigate('home'); }}>{t.home}</a><span>/</span>{copy.catalog}</div><div className="eyebrow">{t.catalogEyebrow}</div><h1>{t.catalogTitle}</h1><p>{t.catalogText}</p></div><div className="catalog-decoration" aria-hidden="true"><img src="/images/colored.png" width="374" height="467" alt="" /></div></section>
        <section className="catalog-body container"><div className="demo-notice"><Icon name="info" size={21} /><p><strong>{t.demoTitle}.</strong> {t.demoText}</p></div><p className="catalog-status field-note" role="status">{catalogNotice}</p><div className="catalog-tools"><div className="filter-tabs" aria-label={t.materials}>{(['all', 'crystal', 'translucent', 'opaque', 'colored', 'mirror'] as const).map(value => <button key={value} aria-pressed={family === value} className={family === value ? 'selected' : ''} onClick={() => setFamily(value)}>{t[value]}</button>)}</div><label className="search-field"><Icon name="search" size={19} /><span className="sr-only">{t.search}</span><input type="search" placeholder={t.search} value={search} onChange={e => setSearch(e.target.value)} /></label></div><div className="result-count" aria-live="polite">{filtered.length} {filtered.length === 1 ? t.material.toLocaleLowerCase(locale) : t.results}</div>{filtered.length ? <div className="product-grid catalog-grid">{filtered.map(product => <ProductCard product={product} locale={locale} onConfigure={configure} key={product.id} store />)}</div> : <div className="empty-results"><Icon name="search" size={32} /><h2>{t.noResults}</h2><button className="button button-outline" onClick={() => { setFamily('all'); setSearch(''); }}>{t.clearFilters}</button></div>}<div className="store-services"><div><Icon name="card" size={28} /><div><h3>{t.paymentTitle}</h3><p>{t.paymentText}</p><div className="payment-badges"><span><Icon name="pix" size={15} />{t.pix}</span><span><Icon name="barcode" size={15} />{t.boleto}</span><span><Icon name="card" size={15} />{t.card}</span></div></div></div><div><Icon name="bag" size={28} /><div><h3>{t.marketplaceTitle}</h3><p>{t.marketplaceText}</p><span className="planned-label">{t.paymentPending}</span></div></div></div></section>
      </>}
    </main>
    <footer className="site-footer"><div className="container"><div className="footer-main"><div className="footer-brand"><a href={`/${locale}`} onClick={e => { e.preventDefault(); navigate('home'); }}><Brand light /></a><p>{t.footerText}</p><span>{t.footerLocation}</span><address>Av. Prof. Odair da Silva Pinto, 2530<br />Guaxinduva · Atibaia, SP</address></div><div className="footer-column"><h3>{t.footerExplore}</h3><a href={`/${locale}#materials`} onClick={e => { e.preventDefault(); navigate('home', 'materials'); }}>{t.materials}</a><a href={`/${locale}#solutions`} onClick={e => { e.preventDefault(); navigate('home', 'solutions'); }}>{t.solutions}</a><a href={`/${locale}#exports`} onClick={e => { e.preventDefault(); navigate('home', 'exports'); }}>{t.exports}</a></div><div className="footer-column"><h3>{t.footerContact}</h3><a href={mailLink(t.contactSubject, t.contactEmail)}>{emailAddress}<Icon name="diagonal" size={14} /></a><a href="tel:+551142600089">+55 (11) 4260-0089</a><button onClick={openCart}>{t.requestQuote}<Icon name="diagonal" size={14} /></button></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Acrilchapas. {t.footerLegal}</span><button onClick={() => setModal('privacy')}>{t.footerPrivacy}<Icon name="diagonal" size={12} /></button><span className="footer-languages">PT · EN · ES</span></div></div></footer>
    <div className="toast-region" role="status" aria-live="polite">{toast && <div className="toast"><Icon name="check" />{toast}<button className="icon-button" aria-label={t.close} onClick={() => setToast('')}><Icon name="close" size={16} /></button></div>}</div>
    {modal === 'configure' && <Dialog title={`${t.configureTitle}|${t.close}`} onClose={() => setModal(null)}><div className="configure-layout"><div className="configure-preview"><div className="eyebrow">{t.sampleLong}</div><AcrylicArt color={selected.color} family={selected.family} /><h3>{selected.names[locale]}</h3><p>{selected.descriptions[locale]}</p><span className="planned-label">{t.consultation}</span></div><form className="configure-form" onSubmit={addItem}><div className="eyebrow">{t.requestedDimensions}</div><h2>{t.configureTitle}</h2><p>{t.configureText}</p><label>{t.material}<select value={selectedId} onChange={e => setSelectedId(e.target.value)}>{products.map(product => <option value={product.id} key={product.id}>{product.names[locale]}</option>)}</select></label><div className="form-grid"><label>{t.width} <span>mm</span><input required type="number" min="0.1" max="100000" step="0.1" inputMode="decimal" value={width} onChange={e => setWidth(e.target.value)} placeholder="1000" /></label><label>{t.height} <span>mm</span><input required type="number" min="0.1" max="100000" step="0.1" inputMode="decimal" value={height} onChange={e => setHeight(e.target.value)} placeholder="500" /></label><label>{t.thickness} <span>mm</span><input required type="number" min="0.1" max="1000" step="0.1" inputMode="decimal" value={thickness} onChange={e => setThickness(e.target.value)} placeholder="3" /></label><label>{t.quantity}<input required type="number" min="1" max="10000" step="1" inputMode="numeric" value={quantity} onChange={e => setQuantity(e.target.value)} /></label></div><div className="area-summary" aria-live="polite"><span>{t.area}</span><strong>{number(areaM2(Number(width), Number(height), Number(quantity)), 4)} <small>m²</small></strong></div><small className="field-note">{t.areaNote}</small>{formError && <p className="form-error" role="alert">{formError}</p>}<button className="button button-dark full-width" type="submit">{t.addToQuote}<Icon name="plus" size={17} /></button></form></div></Dialog>}
    {modal === 'cart' && <Dialog title={`${t.cart}|${t.close}`} onClose={() => setModal(null)} wide><div className="quote-modal"><div className="eyebrow">{t.cart} <span className="quote-item-count">{count} {t.items}</span></div><h2>{t.quoteTitle}</h2><p className="quote-subtitle">{t.quoteSubtitle}</p>{storageFailed && <p className="form-error" role="alert">{t.storageWarning}</p>}{!cart.length ? <div className="empty-cart"><span><Icon name="bag" size={36} /></span><h3>{t.emptyTitle}</h3><p>{t.emptyText}</p><button className="button button-dark" onClick={() => { setModal(null); navigate('catalog'); }}>{t.browse}<Icon name="arrow" /></button></div> : <div className="quote-layout"><div>{customerForm ? <><button className="text-link back-link" onClick={() => { setCustomerForm(false); setFormError(''); setFormSuccess(''); }}>← {t.back}</button><h3 className="customer-heading">{t.customerTitle}</h3><form ref={formRef} onSubmit={e => { e.preventDefault(); downloadQuote(); }} className="customer-form"><div className="form-grid">{(['name', 'email', 'company', 'phone', 'country', 'postalCode'] as const).map(field => <label key={field}>{field === 'postalCode' ? t.postal : t[field]}{['name', 'email', 'country'].includes(field) && ' *'}<input disabled={saving} required={['name', 'email', 'country'].includes(field)} type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'} maxLength={field === 'email' ? 254 : field === 'phone' ? 80 : field === 'postalCode' ? 40 : 160} autoComplete={{ name: 'name', email: 'email', company: 'organization', phone: 'tel', country: 'country-name', postalCode: 'postal-code' }[field]} value={customer[field]} onChange={e => setCustomer({ ...customer, [field]: e.target.value })} /></label>)}</div><label>{t.notes}<textarea disabled={saving} rows={3} maxLength={3000} value={customer.notes} onChange={e => setCustomer({ ...customer, notes: e.target.value })} /></label><p className="field-note">{t.formNote}</p><p className="field-note">{catalogNotice}</p>{formError && <p className="form-error" role="alert">{formError}</p>}{formSuccess && <p className="form-success" role="status">{formSuccess}</p>}{receipt && <div className="local-receipt" role="status" data-testid="local-quote-receipt"><strong>{t.localSaved}</strong><p>{t.localReference}: <code>{receipt.reference}</code></p><small>{t.localSavedNote}</small>{receipt.accessToken && <p><a className="text-link" href={`/${locale}/quote#${receipt.accessToken}`} referrerPolicy="no-referrer">{locale === "en" ? "Follow your quote and order →" : locale === "es" ? "Seguir propuesta y pedido →" : "Acompanhar proposta e pedido →"}</a></p>}</div>}<div className="customer-actions"><button className="button button-dark" type="button" data-testid="save-local-quote" disabled={saving} onClick={saveLocalQuote}>{saving ? t.savingLocal : t.saveLocal}<Icon name="check" size={17} /></button><button className="button button-outline" type="submit" disabled={saving}>{t.download}<Icon name="download" size={17} /></button><button className="button button-outline" type="button" disabled={saving} onClick={composeQuote}>{t.compose}<Icon name="mail" size={17} /></button></div></form></> : <><div className="cart-items">{cart.map(item => { const product = (products.find(p => p.id === item.productId) || sampleProducts.find(p => p.id === item.productId))!; return <article className="cart-item" key={item.id}><div className="cart-item-art"><AcrylicArt color={product.color} family={product.family} /></div><div className="cart-item-detail"><span className="small-label">{t.sample}</span><h3>{product.names[locale]}</h3><p>{number(item.widthMm)} × {number(item.heightMm)} × {number(item.thicknessMm)} mm</p><span>{number(item.quantity)} {t.unit} <span className="dot-divider">·</span> {number(areaM2(item.widthMm, item.heightMm, item.quantity), 4)} m²</span></div><button className="icon-button remove-item" aria-label={`${t.remove} ${product.names[locale]}`} onClick={() => setCart(previous => previous.filter(row => row.id !== item.id))}><Icon name="trash" size={18} /></button></article>; })}</div><div className="cart-list-actions"><button className="text-link" onClick={() => { setCart([]); setFormSuccess(''); }}>{t.clearCart}</button><button className="text-link" onClick={() => { setModal(null); navigate('catalog'); }}>{t.continue}<Icon name="arrow" size={16} /></button></div></>}</div><aside className="quote-summary"><div className="summary-title"><Icon name="layers" /><h3>{t.requestQuote}</h3></div><div className="summary-row"><span>{t.quantity}</span><strong>{number(count)} {t.unit}</strong></div><div className="summary-row"><span>{t.totalArea}</span><strong>{number(totalArea, 4)} m²</strong></div><div className="quote-price">{t.consultation}</div><p>{t.quoteNote}</p>{!customerForm && <button className="button button-dark full-width" onClick={() => { setCustomerForm(true); setFormError(''); setFormSuccess(''); }}>{t.next}<Icon name="arrow" size={17} /></button>}<div className="summary-payments"><div className="payment-badges"><span><Icon name="pix" size={14} />{t.pix}</span><span><Icon name="barcode" size={14} />{t.boleto}</span><span><Icon name="card" size={14} />{t.card}</span></div><small>{t.paymentPending}</small></div></aside></div>}</div></Dialog>}
    {modal === 'privacy' && <Dialog title={`${t.privacyTitle}|${t.close}`} onClose={() => setModal(null)}><div className="privacy-content"><div className="eyebrow">ACRILCHAPAS</div><h2>{t.privacyTitle}</h2><p>{t.privacyText}</p><button className="button button-dark" onClick={() => setModal(null)}>{t.close}</button></div></Dialog>}
  </div>;
}
