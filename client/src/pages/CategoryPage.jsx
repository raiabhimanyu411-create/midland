import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '../components/Breadcrumb.jsx';
import { PageHero } from '../components/PageHero.jsx';
import { TruckGrid, TruckGridSkeleton } from '../components/TruckGrid.jsx';
import { categoryGuideLinks, categoryListingHref, categoryPages, categoryPath, categoryTrucks } from '../../../shared/categories.js';
import { locationPages, locationPath } from '../../../shared/locations.js';
import { parseInline } from '../../../shared/blogContent.js';
import { trucks as fallbackTrucks } from '../data/siteData.js';
import { api } from '../utils/api.js';
import { demoDataEnabled } from '../utils/runtime.js';
import { NotFoundPage } from './NotFoundPage.jsx';
import articleStyles from './LocationPage.module.css';
import styles from './CategoryPage.module.css';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1800&q=85';
const SHOWN = 6;

function Inline({ text }) {
  return parseInline(text).map((part, index) => (part.href ? <a key={index} href={part.href}>{part.text}</a> : part.text));
}

// Stock landing pages by body type or make. Copy lives in shared/categories.js so the server
// renders exactly the same text for crawlers.
export function CategoryPage({ slug }) {
  const { t } = useTranslation();
  const page = categoryPages.find((item) => item.slug === slug);
  const [stock, setStock] = useState({ loaded: false, trucks: [] });

  useEffect(() => {
    if (!page) return undefined;
    let active = true;
    api.listTrucks({ sort: 'newest' })
      .then((response) => { if (active) setStock({ loaded: true, trucks: categoryTrucks(page, response.data || []) }); })
      .catch(() => { if (active) setStock({ loaded: true, trucks: demoDataEnabled ? categoryTrucks(page, fallbackTrucks) : [] }); });
    return () => { active = false; };
  }, [page]);

  if (!page) return <NotFoundPage />;
  const siblings = categoryPages.filter((item) => item.kind === page.kind && item.slug !== page.slug);
  const others = categoryPages.filter((item) => item.kind !== page.kind);
  const guides = categoryGuideLinks(page);
  const shown = stock.trucks.slice(0, SHOWN);

  return (
    <>
      <Breadcrumb items={[{ label: t('nav.home'), href: '/' }, { label: t('nav.trucks'), href: '/trucks' }, { label: page.heading }]} />
      <PageHero eyebrow={page.kind === 'make' ? 'Used Trucks by Make' : 'Used Trucks by Body Type'} title={page.heading} copy={page.intro} image={HERO_IMAGE} />

      <section className={`section ${styles.stock}`} aria-labelledby="category-stock">
        <div className={styles.stockHeading}>
          <div>
            <p className="eyebrow">In Stock Now</p>
            <h2 id="category-stock">{stock.loaded && !stock.trucks.length ? 'New Stock Arriving Soon' : `Current ${page.name} Stock`}</h2>
          </div>
          {stock.trucks.length > SHOWN && (
            <a className="text-link" href={categoryListingHref(page)}>View All {stock.trucks.length} <span aria-hidden="true">→</span></a>
          )}
        </div>
        {!stock.loaded && <TruckGridSkeleton count={3} />}
        {stock.loaded && shown.length > 0 && <TruckGrid trucks={shown} />}
        {stock.loaded && !shown.length && (
          <div className={styles.empty}>
            <p>We don’t have any {page.kind === 'make' ? `${page.name} trucks` : page.name.toLowerCase()} listed right now, but new stock arrives every week. Set up a free stock alert and we will tell you as soon as a match comes in, or call us on 0121 663 1118.</p>
            <div className={styles.actions}>
              <a className="button primary" href="/#stock-alert">Get a Stock Alert</a>
              <a className="button outline" href="/contact">Send Your Requirement</a>
            </div>
          </div>
        )}
      </section>

      <article className={articleStyles.article}>
        {page.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((text, index) => <p key={index}><Inline text={text} /></p>)}
          </section>
        ))}

        <section className={articleStyles.faqs}>
          <h2>{`${page.name} Questions`}</h2>
          {page.faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </section>

        <aside className={articleStyles.cta}>
          <div>
            <strong>Find Your Next Truck</strong>
            <p>Browse checked used trucks at our Swadlincote yard, open 7 days a week, or call 0121 663 1118.</p>
          </div>
          <div className={articleStyles.actions}>
            <a className="button primary" href="/trucks">View All Trucks</a>
            <a className="button outline" href="/part-exchange">Part Exchange</a>
          </div>
        </aside>

        <nav className={styles.related} aria-label="Related pages">
          <div>
            <strong>{page.kind === 'make' ? 'Other Makes' : 'Other Body Types'}</strong>
            <ul>{siblings.map((item) => <li key={item.slug}><a href={categoryPath(item)}>{item.heading}</a></li>)}</ul>
          </div>
          <div>
            <strong>{page.kind === 'make' ? 'Browse by Body Type' : 'Browse by Make'}</strong>
            <ul>{others.map((item) => <li key={item.slug}><a href={categoryPath(item)}>{item.heading}</a></li>)}</ul>
          </div>
          {guides.length > 0 && (
            <div>
              <strong>Buying Guides</strong>
              <ul>{guides.map((guide) => <li key={guide.href}><a href={guide.href}>{guide.label}</a></li>)}</ul>
            </div>
          )}
          <div>
            <strong>Areas We Serve</strong>
            <ul>{locationPages.map((item) => <li key={item.slug}><a href={locationPath(item)}>{item.heading}</a></li>)}</ul>
          </div>
        </nav>
      </article>
    </>
  );
}
