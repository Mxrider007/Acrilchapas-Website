import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Family, Locale, Product } from '../lib/domain';
import { experience } from '../lib/experience';
import { translations } from '../lib/i18n';
import { AcrylicArt, Icon } from './BrandAssets';

type Props = {
  locale: Locale; products: Product[]; renderProduct: (product: Product) => ReactNode;
  onCatalog: (family?: Family | 'all') => void; onConfigure: (family?: Family) => void; onQuote: () => void;
};

export default function HomePage({ locale, products, renderProduct, onCatalog, onConfigure, onQuote }: Props) {
  const [application, setApplication] = useState(0);
  const c = experience[locale];
  const t = translations[locale];
  const project = c.projects[application];
  const contact = `mailto:contato@acrilchapas.com.br?subject=${encodeURIComponent(t.contactSubject)}&body=${encodeURIComponent(t.contactEmail)}`;
  const exportContact = `mailto:contato@acrilchapas.com.br?subject=${encodeURIComponent(t.exportSubject)}&body=${encodeURIComponent(t.exportEmail)}`;

  return <>
    <section className="showcase container" aria-labelledby="hero-heading">
      <div className="showcase-intro">
        <div><div className="eyebrow"><span className="accent-dot" />{c.heroIntro}</div><h1 id="hero-heading">{c.heroTitle}<br /><span>{c.heroAccent}</span></h1></div>
        <div className="showcase-copy"><p>{c.heroText}</p><button className="button button-dark" onClick={() => onCatalog()}>{t.explore}<Icon /></button></div>
      </div>
      <figure className="hero-photograph">
        <img src="/images/hero-wide.webp" srcSet="/images/hero-compact.webp 960w, /images/hero-wide.webp 1920w" sizes="(max-width: 600px) 100vw, (max-width: 1180px) calc(100vw - 64px), (max-width: 1416px) calc(100vw - 96px), 1320px" width="1920" height="851" fetchPriority="high" alt={c.heroAlt} />
        <figcaption><span>{c.photoCaption}</span><span>{c.photoDetail}<Icon name="diagonal" size={18} /></span></figcaption>
      </figure>
    </section>
    <section className="signature-strip container" aria-label="Acrilchapas">
      {[['layers', t.benefit1, t.benefit1Sub], ['ruler', t.benefit2, t.benefit2Sub], ['factory', t.benefit3, t.benefit3Sub]].map(([icon, title, description]) => <div key={icon}><Icon name={icon} size={26} /><div><strong>{title}</strong><span>{description}</span></div></div>)}
    </section>

    <section id="materials" className="collection-section container section-space">
      <div className="section-heading"><div><div className="eyebrow">{c.collection}</div><h2>{c.collectionTitle}</h2><p>{c.collectionText}</p></div><button className="text-link" onClick={() => onCatalog()}>{t.seeAll}<Icon /></button></div>
      <div className="product-grid collection-grid">{products.map(renderProduct)}</div>
      <p className="image-reference">{c.reference}</p>
      <div className="material-finder"><details><summary><span><Icon name="layers" /><strong>{c.finderTitle}</strong></span><Icon name="plus" /></summary><div className="finder-content"><p>{c.finderText}</p><div>{(Object.keys(c.needs) as Family[]).map(family => <button data-family={family} onClick={() => onCatalog(family)} key={family}>{c.needs[family]}<Icon name="arrow" size={17} /></button>)}</div></div></details></div>
    </section>

    <section id="solutions" className="application-section section-space">
      <div className="container"><div className="section-heading"><div><div className="eyebrow">{c.applications}</div><h2>{c.applicationsTitle}</h2></div><p>{c.applicationsText}</p></div>
        <div className="application-layout">
          <div className="application-tabs" role="group" aria-label={t.solutions}>{c.projects.map((item, index) => <button key={index} aria-pressed={application === index} aria-controls="application-panel" onClick={() => setApplication(index)}><span>0{index + 1}</span>{item.title}<Icon name="diagonal" /></button>)}</div>
          <div className="application-panel" id="application-panel" aria-live="polite">
            <div className="application-image"><AcrylicArt family={project.image} /></div>
            <div className="application-copy"><div className="eyebrow">{t.materials} / {t[project.family]}</div><h3>{project.title}</h3><p>{project.description}</p><ul>{project.tags.map(tag => <li key={tag}>{tag}</li>)}</ul><button className="text-link" onClick={() => onCatalog(project.family)}>{c.exploreApplication}<Icon /></button></div>
          </div>
        </div>
      </div>
    </section>

    <section id="factory" className="factory-story section-space">
      <div className="container factory-layout">
        <div className="factory-images"><img className="factory-wide" src="/images/acrylic-detail.webp" width="859" height="643" alt={c.factoryAlt} loading="lazy" decoding="async" /><div className="factory-location"><Icon name="factory" size={27} /><span>ACRILCHAPAS<strong>Atibaia, São Paulo</strong></span></div><img className="factory-close" src="/images/factory-detail.webp" width="546" height="576" alt={c.factoryDetailAlt} loading="lazy" decoding="async" /></div>
        <div className="factory-copy"><div className="eyebrow">{c.factory}</div><h2>{c.factoryTitle}</h2><p>{c.factoryText}</p><div className="factory-services">{c.services.map((service, index) => <div key={service.title}><Icon name={['layers', 'ruler', 'globe'][index]} /><div><h3>{service.title}</h3><p>{service.text}</p></div></div>)}</div><a className="text-link" href={contact}>{c.factoryCta}<Icon name="diagonal" /></a></div>
      </div>
    </section>

    <section className="process-section container section-space"><div className="section-heading"><div><div className="eyebrow">{c.process}</div><h2>{c.processTitle}</h2></div><button className="button button-outline" onClick={() => onConfigure()}>{t.calculate}<Icon name="ruler" /></button></div><ol className="process-steps">{c.steps.map((step, index) => <li key={step.title}><span className="step-number">0{index + 1}</span><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol></section>

    <section id="exports" className="international-section container"><div className="international-mark" aria-hidden="true"><Icon name="globe" size={54} /><span>PT / EN / ES</span></div><div><div className="eyebrow">{t.exportEyebrow}</div><h2>{t.exportTitle.replace('\n', ' ')}</h2><p>{t.exportText}</p><small>{t.exportNote}</small></div><a className="text-link" href={exportContact}>{t.exportCta}<Icon name="diagonal" /></a></section>

    <section className="faq-section container section-space"><div><div className="eyebrow">{c.faq}</div><h2>{c.faqTitle}</h2><a className="text-link" href={contact}>{t.talk}<Icon name="diagonal" /></a></div><div className="faq-list">{c.questions.map(item => <details key={item.question}><summary>{item.question}<Icon name="plus" /></summary><p>{item.answer}</p></details>)}</div></section>

    <section className="project-contact"><div className="container"><div><div className="eyebrow">{c.contactLabel}</div><h2>{c.contactTitle}</h2><p>{c.contactText}</p></div><div className="project-contact-actions"><button className="button button-dark" onClick={() => onCatalog()}>{c.contactCta}<Icon /></button><button className="text-link" onClick={onQuote}>{t.cart}<Icon name="bag" /></button></div></div></section>
  </>;
}
