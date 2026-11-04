import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '../components/Breadcrumb.jsx';
import { PageHero } from '../components/PageHero.jsx';
import { locationPages, locationPath } from '../../../shared/locations.js';
import { parseInline } from '../../../shared/blogContent.js';
import { NotFoundPage } from './NotFoundPage.jsx';
import styles from './LocationPage.module.css';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1800&q=85';

function Inline({ text }) {
  return parseInline(text).map((part, index) => (part.href ? <a key={index} href={part.href}>{part.text}</a> : part.text));
}

// "Used Trucks For Sale in <place>" landing pages. Copy lives in shared/locations.js so the
// server can render exactly the same text for crawlers.
export function LocationPage({ slug }) {
  const { t } = useTranslation();
  const location = locationPages.find((item) => item.slug === slug);
  if (!location) return <NotFoundPage />;
  const otherAreas = locationPages.filter((item) => item.slug !== location.slug);

  return (
    <>
      <Breadcrumb items={[{ label: t('nav.home'), href: '/' }, { label: location.heading }]} />
      <PageHero eyebrow={t('footer.areasHeading', { defaultValue: 'Areas We Serve' })} title={location.heading} copy={location.intro} image={HERO_IMAGE} />
      <article className={styles.article}>
        {location.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((text, index) => <p key={index}><Inline text={text} /></p>)}
          </section>
        ))}

        <section className={styles.faqs}>
          <h2>{`${location.place} Buyers Ask`}</h2>
          {location.faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </section>

        <aside className={styles.cta}>
          <div>
            <strong>Find Your Next Truck</strong>
            <p>Browse checked used trucks at our Swadlincote yard, open 7 days a week, or call 0121 663 1118.</p>
          </div>
          <div className={styles.actions}>
            <a className="button primary" href="/trucks">View Trucks For Sale</a>
            <a className="button outline" href="/part-exchange">Part Exchange</a>
          </div>
        </aside>

        <nav className={styles.areas} aria-label="Other areas we serve">
          <strong>Other Areas We Serve</strong>
          <ul>
            {otherAreas.map((item) => <li key={item.slug}><a href={locationPath(item)}>{item.heading}</a></li>)}
          </ul>
        </nav>
      </article>
    </>
  );
}
