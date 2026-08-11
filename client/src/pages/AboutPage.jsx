import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '../components/Breadcrumb.jsx';
import { InfoCard } from '../components/InfoList.jsx';
import { LocationsSection } from '../components/LocationsSection.jsx';
import { PageHero } from '../components/PageHero.jsx';
import styles from './AboutPage.module.css';

export function AboutPage() {
  const { t } = useTranslation();
  const values = t('pages.about.values', { returnObjects: true });

  return (
    <>
      <Breadcrumb items={[{ label: t('nav.home'), href: '/' }, { label: t('nav.about') }]} />
      <PageHero
        eyebrow={t('pages.about.hero.eyebrow')}
        title={t('pages.about.hero.title')}
        copy={t('pages.about.hero.copy')}
        image="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1800&q=85"
      />
      <section className={`section ${styles.aboutGrid}`}>
        <div>
          <p className="eyebrow">{t('pages.about.approach.eyebrow')}</p>
          <h2>{t('pages.about.approach.heading')}</h2>
          <p>{t('pages.about.approach.p1')}</p>
          <p>{t('pages.about.approach.p2')}</p>
        </div>
        <div className={styles.valuesPanel}>
          {values.map((value) => (
            <InfoCard title={value.title} copy={value.copy} key={value.title} />
          ))}
        </div>
      </section>
      <LocationsSection />
      <AboutCta />
    </>
  );
}

function AboutCta() {
  const { t } = useTranslation();

  return (
    <section className={styles.aboutCta}>
      <div>
        <p className="eyebrow">{t('pages.about.cta.eyebrow')}</p>
        <h2>{t('pages.about.cta.heading')}</h2>
        <p>{t('pages.about.cta.copy')}</p>
      </div>
      <div className={styles.ctaActions}>
        <a className="button primary" href="/contact">{t('pages.about.cta.getInTouch')}</a>
        <a className="button outline" href="tel:+441214960000">{t('pages.about.cta.call')}</a>
      </div>
    </section>
  );
}
