import type { ReactNode } from 'react';
import type { Family } from '../lib/domain';

export function Icon({ name = 'arrow', size = 20 }: { name?: string; size?: number }) {
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

export function Brand({ light = false }: { light?: boolean }) {
  return <span className="brand"><img src={light ? '/brand/logo-white.png' : '/brand/logo.png'} width={light ? 287 : 339} height={light ? 61 : 77} alt="Acrilchapas — chapas acrílicas" /></span>;
}

export function AcrylicArt({ family = 'crystal' }: { color?: string; family?: Family }) {
  return <img className={`material-art material-art-${family}`} src={`/images/${family}.png`} width="374" height="467" loading="lazy" decoding="async" alt="" />;
}
