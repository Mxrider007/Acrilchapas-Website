import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { areaM2, products as sampleProducts, quotePayload, readCart, validItem } from './lib/domain';
import type { CartItem, Customer, Family, Locale, Product } from './lib/domain';
import { localeTags, translations } from './lib/i18n';
import { catalogProducts, CommerceError, prepareSubmission, saveQuotation } from './lib/commerce';
import type { QuoteReceipt, Submission } from './lib/commerce';

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

function Icon({ name = 'arrow', size = 20 }: { name?: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    arrow: <><path d="M4 12h15M13 5l7 7-7 7" /></>, diagonal: <><path d="M5 19 19 5M5 5h14v14" /></>,
    bag: <><path d="M5 7h14l1 14H4L5 7Z" /><path d="M8 8V6a4 4 0 0 1 8 0v2" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />, menu: <path d="M3 6h18M3 12h18M3 18h18" />,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    layers: <><path d="m12 3 10 5-10 5L2 8l10-5ZM2 12l10 5 10-5M2 16l10 5 10-5" /></>,
    ruler: <><path d="m3 16 13-13 5 5L8 21l-5-5Z" /><path d="m7 12 2 2m2-6 2 2m2-6 2 2" /></>,
    factory: <><path d="M3 21V10l6-4v6l6-4v13M15 21V3h4l2 18H3" /><path d="M6 16h1m4 0h1m-6 3h1m4 0h1" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></>,
    plus: <path d="M12 5v14M5 12h14" />, check: <path d="m5 12 4 4L19 6" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>,
    trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></>,
    pix: <><path d="m12 2 10 10-10 10L2 12 10 4M6 8l6 6 6-6M6 16l6-6 6 6" /></>,
    barcode: <path d="M3 5v14M6 5v14M10 5v14M12 5v14M16 5v14M20 5v14" />,
    card: <><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M2 9h20M6 15h4" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.arrow}</svg>;
}

function Brand({ light = false }: { light?: boolean }) {
  return <span className={`brand ${light ? 'brand-light' : ''}`}><svg width="34" height="34" viewBox="0 0 42 40" aria-hidden="true"><path d="M2 34 19 5h10L12 34Z" fill="currentColor" /><path d="m21 34 10-17 10 17Z" fill="currentColor" /></svg><span>acrilchapas<span className="brand-dot">.</span></span></span>;
}

function AcrylicArt({ hero = false, color = '#bad4cb', family = 'crystal' }: { hero?: boolean; color?: string; family?: Family }) {
  const uid = useId().replace(/:/g, '');
  if (hero) return <svg className="hero-sculpture" viewBox="0 0 650 580" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={`${uid}green`} x1="180" y1="20" x2="570" y2="440" gradientUnits="userSpaceOnUse"><stop stopColor="#365957" /><stop offset=".45" stopColor="#17625c" /><stop offset="1" stopColor="#073b38" /></linearGradient>
      <linearGradient id={`${uid}clear`} x1="250" y1="30" x2="420" y2="500" gradientUnits="userSpaceOnUse"><stop stopColor="#b6e7e2" stopOpacity=".8" /><stop offset=".4" stopColor="#d7efec" stopOpacity=".15" /><stop offset=".7" stopColor="#83c7bf" stopOpacity=".65" /><stop offset="1" stopColor="#b1d5cb" stopOpacity=".35" /></linearGradient>
      <linearGradient id={`${uid}lime`} x1="280" y1="90" x2="130" y2="480" gradientUnits="userSpaceOnUse"><stop stopColor="#e8f6af" stopOpacity=".9" /><stop offset="1" stopColor="#bbd790" stopOpacity=".75" /></linearGradient>
      <linearGradient id={`${uid}amber`} x1="440" y1="210" x2="150" y2="550" gradientUnits="userSpaceOnUse"><stop stopColor="#eed9ae" stopOpacity=".8" /><stop offset="1" stopColor="#bb784a" stopOpacity=".65" /></linearGradient>
      <linearGradient id={`${uid}shine`} x1="70" y1="0" x2="520" y2="580"><stop stopColor="white" stopOpacity=".9" /><stop offset=".43" stopColor="white" stopOpacity="0" /><stop offset=".48" stopColor="white" stopOpacity=".5" /><stop offset=".52" stopColor="white" stopOpacity="0" /><stop offset="1" stopColor="white" stopOpacity=".3" /></linearGradient>
      <filter id={`${uid}shadow`} x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="18" /></filter>
    </defs>
    <ellipse cx="340" cy="492" rx="225" ry="35" fill="#294a42" opacity=".19" filter={`url(#${uid}shadow)`} />
    <path d="m235 65 265 54 31 332-269-46Z" fill="#092f2e" /><path d="m235 58 266 54 30 332-269-46Z" fill={`url(#${uid}green)`} stroke="#91b8ad" strokeWidth="1.2" /><path d="m235 58 27 340 269 46" stroke="#477d6f" strokeWidth="3" />
    <path d="m186 120 256-49-13 341-257 47Z" fill="#c3dacf" fillOpacity=".22" stroke="#73b8ac" strokeWidth="3" /><path d="m181 115 256-49-13 341-257 47Z" fill={`url(#${uid}clear)`} stroke="#e5f7ef" strokeWidth="2" />
    <path d="m145 210 225-85-70 346L75 533Z" fill="#accb80" fillOpacity=".5" stroke="#a7bc7b" strokeWidth="2" /><path d="m141 203 225-85-70 346L71 526Z" fill={`url(#${uid}lime)`} stroke="#f0f9c9" strokeWidth="2" />
    <path d="m279 286 259-91-108 334-267 10Z" fill="#ad845a" fillOpacity=".35" stroke="#b5956b" strokeWidth="2" /><path d="m277 280 260-92-108 334-267 10Z" fill={`url(#${uid}amber)`} stroke="#f0ddb8" strokeWidth="2" />
    <path d="m393 246 121 2-62 250-120 9Z" fill={`url(#${uid}shine)`} opacity=".4" />
    <path d="m181 115 256-49M71 526l225-62M537 188 429 522" stroke="white" strokeOpacity=".8" strokeWidth="2" />
  </svg>;
  return <svg className={`material-art material-art-${family}`} viewBox="0 0 360 265" aria-hidden="true">
    <defs>
      <linearGradient id={`${uid}face`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={family === 'mirror' ? '#f5f8f7' : color} stopOpacity={family === 'opaque' ? 1 : .4} /><stop offset=".4" stopColor={color} stopOpacity={family === 'opaque' ? 1 : .8} /><stop offset=".5" stopColor={family === 'mirror' ? '#eef3f0' : color} /><stop offset="1" stopColor={color} stopOpacity={family === 'opaque' ? 1 : .5} /></linearGradient>
      <linearGradient id={`${uid}edge`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff" stopOpacity=".8" /><stop offset="1" stopColor={color} /></linearGradient>
      <filter id={`${uid}blur`}><feGaussianBlur stdDeviation="8" /></filter>
    </defs>
    <ellipse cx="183" cy="219" rx="112" ry="14" fill="#254b40" opacity=".12" filter={`url(#${uid}blur)`} />
    <path d="m65 145 158-64 81 89-158 63Z" fill={color} opacity=".2" stroke={color} />
    <path d="m66 125 158-65 81 89v7l-157 66-82-90Z" fill={color} opacity=".75" />
    <path d="m66 125 158-65 81 89-157 66Z" fill={`url(#${uid}face)`} stroke={`url(#${uid}edge)`} strokeWidth="1.3" />
    <path d="m66 125 82 90 157-66M148 215v7" fill="none" stroke={color} strokeWidth="1.6" />
    <path d="m132 98 80 89 36-15-80-89Z" fill="white" opacity={family === 'opaque' ? .04 : .24} />
  </svg>;
}

function Dialog({ children, title, onClose, wide = false }: { children: ReactNode; title: string; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => { const node = ref.current; const previous = document.activeElement as HTMLElement | null; node?.showModal(); const saved = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { node?.close(); document.body.style.overflow = saved; previous?.focus(); }; }, []);
  return <dialog ref={ref} className={`dialog ${wide ? 'dialog-wide' : ''}`} aria-labelledby={titleId} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div className="dialog-inner"><h2 id={titleId} className="sr-only">{title}</h2>{children}<button type="button" className="icon-button dialog-close" aria-label={title.split('|')[1] || 'Close'} onClick={onClose}><Icon name="close" /></button></div></dialog>;
}

export default function App() {
  const [route, setRoute] = useState(getRoute);
  const { locale, page } = route;
  const t = translations[locale];
  const [mobileMenu, setMobileMenu] = useState(false);
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
    document.title = `Acrilchapas — ${page === 'catalog' ? t.shop : `${t.heroTitleA} ${t.heroTitleB}`}`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.heroText);
    try { localStorage.setItem(LOCALE_KEY, locale); } catch { /* Language still works for this session. */ }
    if (location.pathname === '/') history.replaceState(null, '', `/${locale}`);
  }, [locale, page, t]);
  useEffect(() => { const onPop = () => { setRoute(getRoute()); setMobileMenu(false); setModal(null); }; window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop); }, []);
  useEffect(() => { if (!toast) return; const timeout = window.setTimeout(() => setToast(''), 6000); return () => clearTimeout(timeout); }, [toast]);

  function navigate(nextPage: Page, section?: string, nextLocale = locale) {
    const path = `/${nextLocale}${nextPage === 'catalog' ? '/catalog' : ''}${section ? `#${section}` : ''}`;
    history.pushState(null, '', path);
    setRoute({ locale: nextLocale, page: nextPage }); setMobileMenu(false);
    if (nextLocale !== locale) { setFormError(''); setFormSuccess(''); setToast(''); }
    setTimeout(() => { if (section) document.getElementById(section)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); else window.scrollTo(0, 0); }, 30);
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

  function ProductCard({ product, store = false }: { product: Product; store?: boolean }) {
    return <article className={`product-card ${store ? 'store-card' : ''}`}><button className="product-visual" onClick={() => configure(product)} aria-label={`${store ? t.configure : t.viewMaterial}: ${product.names[locale]}`}><span className="product-category">CAST</span>{store && <span className="sample-label">{t.sample}</span>}<AcrylicArt color={product.color} family={product.family} /><span className="product-open"><Icon name="diagonal" size={19} /></span></button><div className="product-info"><div className="product-name-row"><h3>{product.names[locale]}</h3><span className="color-dot" style={{ background: product.color }} /></div><p>{product.descriptions[locale]}</p>{store && <><div className="product-price">{t.priceNote}</div><button className="button button-outline card-button" onClick={() => configure(product)}>{t.configure}<Icon name="plus" size={17} /></button></>}</div></article>;
  }

  return <>
    <a className="skip-link" href="#main">{t.skip}</a>
    <div className="announcement"><div className="container"><span>{t.topLine}</span><span className="top-location"><span className="tiny-dot" />{t.topLocation}</span></div></div>
    <header className="site-header"><div className="container header-row"><a href={`/${locale}`} className="brand-link" aria-label={`Acrilchapas — ${t.home}`} onClick={e => { e.preventDefault(); navigate('home'); }}><Brand /></a><nav className="desktop-nav" aria-label={t.menu}><a href={`/${locale}#materials`} onClick={e => { e.preventDefault(); navigate('home', 'materials'); }}>{t.materials}</a><a href={`/${locale}#solutions`} onClick={e => { e.preventDefault(); navigate('home', 'solutions'); }}>{t.solutions}</a><a href={`/${locale}#exports`} onClick={e => { e.preventDefault(); navigate('home', 'exports'); }}>{t.exports}<Icon name="diagonal" size={12} /></a><a href={`/${locale}/catalog`} className={page === 'catalog' ? 'active' : ''} onClick={e => { e.preventDefault(); navigate('catalog'); }}>{t.shop}</a></nav><div className="header-actions"><label className="language"><Icon name="globe" size={16} /><span className="sr-only">Language / Idioma</span><select value={locale} onChange={e => navigate(page, undefined, e.target.value as Locale)} aria-label="Language / Idioma"><option value="pt">PT</option><option value="en">EN</option><option value="es">ES</option></select></label><button className="cart-button" onClick={openCart} aria-label={`${t.cart} (${count})`}><Icon name="bag" size={20} />{count > 0 && <span className="cart-count">{count > 99 ? '99+' : count}</span>}</button><button className="button button-dark header-quote" onClick={openCart}>{t.requestQuote}<Icon name="diagonal" size={15} /></button><button className="icon-button mobile-toggle" aria-label={mobileMenu ? t.close : t.menu} aria-expanded={mobileMenu} aria-controls="mobile-nav" onClick={() => setMobileMenu(!mobileMenu)}><Icon name={mobileMenu ? 'close' : 'menu'} /></button></div></div>{mobileMenu && <nav id="mobile-nav" className="mobile-nav" aria-label={t.menu}>{(['materials', 'solutions', 'exports'] as const).map(section => <a key={section} href={`/${locale}#${section}`} onClick={e => { e.preventDefault(); navigate('home', section); }}>{t[section]}<Icon name="arrow" /></a>)}<a href={`/${locale}/catalog`} onClick={e => { e.preventDefault(); navigate('catalog'); }}>{t.shop}<Icon name="arrow" /></a><button className="button button-dark" onClick={() => { setMobileMenu(false); openCart(); }}>{t.requestQuote}</button></nav>}</header>
    <main id="main">
      {page === 'home' ? <>
        <section className="hero container"><div className="hero-copy"><div className="eyebrow"><span className="tiny-dot" />{t.heroEyebrow}</div><h1>{t.heroTitleA}<br /><span>{t.heroTitleB}</span></h1><p>{t.heroText}</p><div className="hero-buttons"><button className="button button-dark" onClick={() => navigate('catalog')}>{t.explore}<Icon name="arrow" /></button><a className="text-link" href={mailLink(t.contactSubject, t.contactEmail)}>{t.talk}<Icon name="diagonal" size={15} /></a></div><div className="hero-footer"><span className="orbit-mark">✳</span><span>{t.heroNote}<br /><strong>ACRILCHAPAS</strong></span><span className="hero-rule" /><span className="hero-small">CAST<br />ACRYLIC</span></div></div><div className="hero-art"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-cross cross-one">+</div><div className="art-cross cross-two">+</div><AcrylicArt hero /><div className="art-caption"><span className="caption-line" /><span><strong>{t.heroCaption}</strong><br />{t.heroCaptionSub}</span></div><div className="art-index">01 — 05</div></div></section>
        <section className="benefit-strip container" aria-label="Acrilchapas">{[1, 2, 3].map((_, i) => <div className="benefit" key={i}><span className="benefit-icon"><Icon name={['layers', 'ruler', 'factory'][i]} size={25} /></span><div><h2>{[t.benefit1, t.benefit2, t.benefit3][i]}</h2><p>{[t.benefit1Sub, t.benefit2Sub, t.benefit3Sub][i]}</p></div><span className="benefit-index">0{i + 1}</span></div>)}</section>
        <section id="materials" className="materials-section section-space container"><div className="section-heading"><div><div className="eyebrow">{t.materialEyebrow}</div><h2>{t.materialTitle}</h2><p>{t.materialText}</p></div><button className="text-link" onClick={() => navigate('catalog')}>{t.seeAll}<Icon name="arrow" size={18} /></button></div><div className="product-grid">{products.slice(0, 3).map(product => <ProductCard product={product} key={product.id} />)}</div><div className="material-pagination"><span className="page-active" /><span /><span /><div>01 / 03</div></div></section>
        <section id="solutions" className="solutions-section"><div className="container solutions-grid"><div className="solutions-copy"><div className="eyebrow">{t.solutionsEyebrow}</div><h2>{t.solutionsTitle}</h2><p>{t.solutionsText}</p><a className="button button-light" href={mailLink(t.contactSubject, t.contactEmail)}>{t.talk}<Icon name="diagonal" size={18} /></a><div className="line-art" aria-hidden="true"><span /><span /><span /><span /></div></div><div className="solution-list">{[1, 2, 3].map((_, index) => <a href={mailLink(t.contactSubject, `${t.contactEmail}\n${[t.solution1, t.solution2, t.solution3][index]}`)} className="solution-item" key={index}><span className="solution-number">0{index + 1}</span><div><h3>{[t.solution1, t.solution2, t.solution3][index]}</h3><p>{[t.solution1Text, t.solution2Text, t.solution3Text][index]}</p></div><Icon name="diagonal" /></a>)}<div className="cutting-card"><span className="cutting-icon"><Icon name="ruler" size={25} /></span><div><h3>{t.customTitle}</h3><p>{t.customText}</p><button className="text-link" onClick={() => configure()}>{t.calculate}<Icon name="arrow" size={16} /></button></div></div></div></div></section>
        <section id="exports" className="export-section container section-space"><div className="export-graphic" aria-hidden="true"><svg viewBox="0 0 500 420"><defs><radialGradient id="globe-gradient"><stop stopColor="#d5e8d4" /><stop offset="1" stopColor="#edf1e8" /></radialGradient><clipPath id="globe-clip"><circle cx="248" cy="205" r="159" /></clipPath></defs><circle cx="248" cy="205" r="159" fill="url(#globe-gradient)" /><g stroke="#b4c9b7" fill="none" clipPath="url(#globe-clip)"><ellipse cx="248" cy="205" rx="110" ry="159" /><ellipse cx="248" cy="205" rx="53" ry="159" /><ellipse cx="248" cy="205" rx="159" ry="53" /><ellipse cx="248" cy="205" rx="159" ry="111" /><path d="M89 205h318M248 46v318" /></g><path d="m123 184 42 12 20 26 37 1 21 33-25 30-12 39-17-25-15-56-25-29-17-1Z" fill="#426f58" opacity=".75" /><path d="M198 252 Q316 88 438 149M198 252 Q272 158 345 74M198 252 Q125 70 65 111" fill="none" stroke="#4b7863" strokeWidth="1.5" strokeDasharray="4 5" /><circle cx="198" cy="252" r="13" fill="#c8e895" fillOpacity=".8" /><circle cx="198" cy="252" r="5" fill="#12413d" /><g fill="#12413d"><circle cx="438" cy="149" r="4" /><circle cx="345" cy="74" r="4" /><circle cx="65" cy="111" r="4" /></g><circle cx="248" cy="205" r="186" stroke="#dfe6dc" fill="none" /><circle cx="248" cy="205" r="210" stroke="#e7ebe3" strokeDasharray="2 8" fill="none" /></svg><span className="map-label"><span className="tiny-dot" />ATIBAIA, BRASIL</span><span className="map-coordinate">23°07′ S &nbsp; 46°33′ W</span></div><div className="export-copy"><div className="eyebrow">{t.exportEyebrow}</div><h2>{t.exportTitle}</h2><p>{t.exportText}</p><div className="export-steps">{[t.exportStep1, t.exportStep2, t.exportStep3].map((step, i) => <div key={step}><span>0{i + 1}</span>{step}</div>)}</div><a className="button button-dark" href={mailLink(t.exportSubject, t.exportEmail)}>{t.exportCta}<Icon name="diagonal" size={18} /></a><small>{t.exportNote}</small></div></section>
        <section className="contact-section container"><div><div className="eyebrow">{t.contactEyebrow}</div><h2>{t.contactTitle}</h2><p>{t.contactText}</p></div><button className="button button-dark" onClick={openCart}>{t.contactCta}<Icon name="arrow" /></button><span className="contact-star" aria-hidden="true">✳</span></section>
      </> : <>
        <section className="catalog-header container"><div><div className="breadcrumb"><a href={`/${locale}`} onClick={e => { e.preventDefault(); navigate('home'); }}>{t.home}</a><span>/</span>{t.shop}</div><div className="eyebrow">{t.catalogEyebrow}</div><h1>{t.catalogTitle}</h1><p>{t.catalogText}</p></div><div className="catalog-decoration" aria-hidden="true"><AcrylicArt color="#d2dea4" /></div></section>
        <section className="catalog-body container"><div className="demo-notice"><Icon name="info" size={21} /><p><strong>{t.demoTitle}.</strong> {t.demoText}</p></div><p className="catalog-status field-note" role="status">{catalogNotice}</p><div className="catalog-tools"><div className="filter-tabs" aria-label={t.materials}>{(['all', 'crystal', 'translucent', 'opaque', 'colored', 'mirror'] as const).map(value => <button key={value} aria-pressed={family === value} className={family === value ? 'selected' : ''} onClick={() => setFamily(value)}>{t[value]}</button>)}</div><label className="search-field"><Icon name="search" size={19} /><span className="sr-only">{t.search}</span><input type="search" placeholder={t.search} value={search} onChange={e => setSearch(e.target.value)} /></label></div><div className="result-count" aria-live="polite">{filtered.length} {t.results}</div>{filtered.length ? <div className="product-grid catalog-grid">{filtered.map(product => <ProductCard product={product} key={product.id} store />)}</div> : <div className="empty-results"><Icon name="search" size={32} /><h2>{t.noResults}</h2><button className="button button-outline" onClick={() => { setFamily('all'); setSearch(''); }}>{t.clearFilters}</button></div>}<div className="store-services"><div><Icon name="card" size={28} /><div><h3>{t.paymentTitle}</h3><p>{t.paymentText}</p><div className="payment-badges"><span><Icon name="pix" size={15} />{t.pix}</span><span><Icon name="barcode" size={15} />{t.boleto}</span><span><Icon name="card" size={15} />{t.card}</span></div></div></div><div><Icon name="bag" size={28} /><div><h3>{t.marketplaceTitle}</h3><p>{t.marketplaceText}</p><span className="planned-label">{t.paymentPending}</span></div></div></div></section>
      </>}
    </main>
    <footer className="site-footer"><div className="container"><div className="footer-main"><div className="footer-brand"><a href={`/${locale}`} onClick={e => { e.preventDefault(); navigate('home'); }}><Brand light /></a><p>{t.footerText}</p><span>{t.footerLocation}</span></div><div className="footer-column"><h3>{t.footerExplore}</h3><a href={`/${locale}#materials`} onClick={e => { e.preventDefault(); navigate('home', 'materials'); }}>{t.materials}</a><a href={`/${locale}#solutions`} onClick={e => { e.preventDefault(); navigate('home', 'solutions'); }}>{t.solutions}</a><a href={`/${locale}#exports`} onClick={e => { e.preventDefault(); navigate('home', 'exports'); }}>{t.exports}</a></div><div className="footer-column"><h3>{t.footerContact}</h3><a href={mailLink(t.contactSubject, t.contactEmail)}>{emailAddress}<Icon name="diagonal" size={14} /></a><a href="tel:+551142600089">+55 (11) 4260-0089</a><button onClick={openCart}>{t.requestQuote}<Icon name="diagonal" size={14} /></button></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Acrilchapas. {t.footerLegal}</span><button onClick={() => setModal('privacy')}>{t.footerPrivacy}<Icon name="diagonal" size={12} /></button><span className="footer-languages">PT · EN · ES</span></div></div></footer>
    <div className="toast-region" role="status" aria-live="polite">{toast && <div className="toast"><Icon name="check" />{toast}<button className="icon-button" aria-label={t.close} onClick={() => setToast('')}><Icon name="close" size={16} /></button></div>}</div>
    {modal === 'configure' && <Dialog title={`${t.configureTitle}|${t.close}`} onClose={() => setModal(null)}><div className="configure-layout"><div className="configure-preview"><div className="eyebrow">{t.sampleLong}</div><AcrylicArt color={selected.color} family={selected.family} /><h3>{selected.names[locale]}</h3><p>{selected.descriptions[locale]}</p><span className="planned-label">{t.consultation}</span></div><form className="configure-form" onSubmit={addItem}><div className="eyebrow">{t.requestedDimensions}</div><h2>{t.configureTitle}</h2><p>{t.configureText}</p><label>{t.material}<select value={selectedId} onChange={e => setSelectedId(e.target.value)}>{products.map(product => <option value={product.id} key={product.id}>{product.names[locale]}</option>)}</select></label><div className="form-grid"><label>{t.width} <span>mm</span><input required type="number" min="0.1" max="100000" step="0.1" inputMode="decimal" value={width} onChange={e => setWidth(e.target.value)} placeholder="1000" /></label><label>{t.height} <span>mm</span><input required type="number" min="0.1" max="100000" step="0.1" inputMode="decimal" value={height} onChange={e => setHeight(e.target.value)} placeholder="500" /></label><label>{t.thickness} <span>mm</span><input required type="number" min="0.1" max="1000" step="0.1" inputMode="decimal" value={thickness} onChange={e => setThickness(e.target.value)} placeholder="3" /></label><label>{t.quantity}<input required type="number" min="1" max="10000" step="1" inputMode="numeric" value={quantity} onChange={e => setQuantity(e.target.value)} /></label></div><div className="area-summary" aria-live="polite"><span>{t.area}</span><strong>{number(areaM2(Number(width), Number(height), Number(quantity)), 4)} <small>m²</small></strong></div><small className="field-note">{t.areaNote}</small>{formError && <p className="form-error" role="alert">{formError}</p>}<button className="button button-dark full-width" type="submit">{t.addToQuote}<Icon name="plus" size={17} /></button></form></div></Dialog>}
    {modal === 'cart' && <Dialog title={`${t.cart}|${t.close}`} onClose={() => setModal(null)} wide><div className="quote-modal"><div className="eyebrow">{t.cart} <span className="quote-item-count">{count} {t.items}</span></div><h2>{t.quoteTitle}</h2><p className="quote-subtitle">{t.quoteSubtitle}</p>{storageFailed && <p className="form-error" role="alert">{t.storageWarning}</p>}{!cart.length ? <div className="empty-cart"><span><Icon name="bag" size={36} /></span><h3>{t.emptyTitle}</h3><p>{t.emptyText}</p><button className="button button-dark" onClick={() => { setModal(null); navigate('catalog'); }}>{t.browse}<Icon name="arrow" /></button></div> : <div className="quote-layout"><div>{customerForm ? <><button className="text-link back-link" onClick={() => { setCustomerForm(false); setFormError(''); setFormSuccess(''); }}>← {t.back}</button><h3 className="customer-heading">{t.customerTitle}</h3><form ref={formRef} onSubmit={e => { e.preventDefault(); downloadQuote(); }} className="customer-form"><div className="form-grid">{(['name', 'email', 'company', 'phone', 'country', 'postalCode'] as const).map(field => <label key={field}>{field === 'postalCode' ? t.postal : t[field]}{['name', 'email', 'country'].includes(field) && ' *'}<input disabled={saving} required={['name', 'email', 'country'].includes(field)} type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'} maxLength={field === 'email' ? 254 : field === 'phone' ? 80 : field === 'postalCode' ? 40 : 160} autoComplete={{ name: 'name', email: 'email', company: 'organization', phone: 'tel', country: 'country-name', postalCode: 'postal-code' }[field]} value={customer[field]} onChange={e => setCustomer({ ...customer, [field]: e.target.value })} /></label>)}</div><label>{t.notes}<textarea disabled={saving} rows={3} maxLength={3000} value={customer.notes} onChange={e => setCustomer({ ...customer, notes: e.target.value })} /></label><p className="field-note">{t.formNote}</p><p className="field-note">{catalogNotice}</p>{formError && <p className="form-error" role="alert">{formError}</p>}{formSuccess && <p className="form-success" role="status">{formSuccess}</p>}{receipt && <div className="local-receipt" role="status" data-testid="local-quote-receipt"><strong>{t.localSaved}</strong><p>{t.localReference}: <code>{receipt.reference}</code></p><small>{t.localSavedNote}</small>{receipt.accessToken && <p><a className="text-link" href={`/${locale}/quote#${receipt.accessToken}`} referrerPolicy="no-referrer">{locale === "en" ? "Follow your quote and order →" : locale === "es" ? "Seguir propuesta y pedido →" : "Acompanhar proposta e pedido →"}</a></p>}</div>}<div className="customer-actions"><button className="button button-dark" type="button" data-testid="save-local-quote" disabled={saving} onClick={saveLocalQuote}>{saving ? t.savingLocal : t.saveLocal}<Icon name="check" size={17} /></button><button className="button button-outline" type="submit" disabled={saving}>{t.download}<Icon name="download" size={17} /></button><button className="button button-outline" type="button" disabled={saving} onClick={composeQuote}>{t.compose}<Icon name="mail" size={17} /></button></div></form></> : <><div className="cart-items">{cart.map(item => { const product = (products.find(p => p.id === item.productId) || sampleProducts.find(p => p.id === item.productId))!; return <article className="cart-item" key={item.id}><div className="cart-item-art"><AcrylicArt color={product.color} family={product.family} /></div><div className="cart-item-detail"><span className="small-label">{t.sample}</span><h3>{product.names[locale]}</h3><p>{number(item.widthMm)} × {number(item.heightMm)} × {number(item.thicknessMm)} mm</p><span>{number(item.quantity)} {t.unit} <span className="dot-divider">·</span> {number(areaM2(item.widthMm, item.heightMm, item.quantity), 4)} m²</span></div><button className="icon-button remove-item" aria-label={`${t.remove} ${product.names[locale]}`} onClick={() => setCart(previous => previous.filter(row => row.id !== item.id))}><Icon name="trash" size={18} /></button></article>; })}</div><div className="cart-list-actions"><button className="text-link" onClick={() => { setCart([]); setFormSuccess(''); }}>{t.clearCart}</button><button className="text-link" onClick={() => { setModal(null); navigate('catalog'); }}>{t.continue}<Icon name="arrow" size={16} /></button></div></>}</div><aside className="quote-summary"><div className="summary-title"><Icon name="layers" /><h3>{t.requestQuote}</h3></div><div className="summary-row"><span>{t.quantity}</span><strong>{number(count)} {t.unit}</strong></div><div className="summary-row"><span>{t.totalArea}</span><strong>{number(totalArea, 4)} m²</strong></div><div className="quote-price">{t.consultation}</div><p>{t.quoteNote}</p>{!customerForm && <button className="button button-dark full-width" onClick={() => { setCustomerForm(true); setFormError(''); setFormSuccess(''); }}>{t.next}<Icon name="arrow" size={17} /></button>}<div className="summary-payments"><div className="payment-badges"><span><Icon name="pix" size={14} />{t.pix}</span><span><Icon name="barcode" size={14} />{t.boleto}</span><span><Icon name="card" size={14} />{t.card}</span></div><small>{t.paymentPending}</small></div></aside></div>}</div></Dialog>}
    {modal === 'privacy' && <Dialog title={`${t.privacyTitle}|${t.close}`} onClose={() => setModal(null)}><div className="privacy-content"><div className="eyebrow">ACRILCHAPAS</div><h2>{t.privacyTitle}</h2><p>{t.privacyText}</p><button className="button button-dark" onClick={() => setModal(null)}>{t.close}</button></div></Dialog>}
  </>;
}
