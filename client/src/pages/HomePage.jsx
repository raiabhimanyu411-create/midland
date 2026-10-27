import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { serviceCardHrefs, trucks } from '../data/siteData.js';
import { BrandStrip } from '../components/BrandStrip.jsx';
import { ContactPreview } from '../components/ContactPreview.jsx';
import {
  IconCheckBadge,
  IconPin,
  IconExchange
} from '../components/icons.jsx';
import { InfoCard } from '../components/InfoList.jsx';
import { SearchBand } from '../components/SearchBand.jsx';
import { StockAlert } from '../components/StockAlert.jsx';
import { TruckGrid, TruckGridSkeleton } from '../components/TruckGrid.jsx';
import { VideoWalkaround } from '../components/VideoWalkaround.jsx';
import { api } from '../utils/api.js';
import { demoDataEnabled } from '../utils/runtime.js';
import { useInView } from '../utils/useInView.js';
import { truckUrl } from '../utils/routes.js';
import { responsiveImage } from '../utils/images.js';
import { truckDisplayTitle } from '../../../shared/truck.js';
import styles from './HomePage.module.css';

const serviceIcons = [IconCheckBadge, IconExchange, IconPin];

// Home page stock is loaded once and shared by the hero "Latest arrival" card and the featured grid.
function useHomeStock() {
  const [stock, setStock] = useState(() => ({ loaded: demoDataEnabled, trucks: demoDataEnabled ? trucks : [] }));

  useEffect(() => {
    let active = true;
    api.listTrucks({ sort: 'home' })
      .then((response) => { if (active) setStock({ loaded: true, trucks: response.data || [] }); })
      .catch(() => { if (active) setStock({ loaded: true, trucks: demoDataEnabled ? trucks : [] }); });
    return () => { active = false; };
  }, []);

  return stock;
}

// Most recently added listing that can still be bought.
function latestArrival(list) {
  return list
    .filter((truck) => String(truck.status || 'available').toLowerCase() === 'available')
    .reduce((latest, truck) => (!latest || Number(truck.id) > Number(latest.id) ? truck : latest), null);
}

export function HomePage() {
  const { t } = useTranslation();
  const introPoints = t('pages.home.intro.points', { returnObjects: true });
  const stock = useHomeStock();

  return (
    <div className={styles.homePage}>
      <Hero latest={latestArrival(stock.trucks)} />
      <SearchBand />
      <BrandStrip />
      <RevealSection className={`section ${styles.introSection}`}>
        <div className={styles.introHeading}>
          <p className="eyebrow">{t('pages.home.intro.eyebrow')}</p>
          <h2>{t('pages.home.intro.heading')}</h2>
        </div>
        <div className={styles.introCopy}>
          <span className={styles.introRule} aria-hidden="true" />
          <p>{t('pages.home.intro.copy')}</p>
          <div className={styles.introPoints}>
            {introPoints.map((point) => (
              <span key={point}>{point}</span>
            ))}
          </div>
        </div>
      </RevealSection>
      <FeaturedStock stock={stock} />
      <BuyerJourney />
      <VideoWalkaround />
      <ServiceCards />
      <FeatureBand />
      <StockAlert />
      <ContactPreview />
    </div>
  );
}

function Hero({ latest }) {
  const { t } = useTranslation();
  const proof = t('pages.home.hero.proof', { returnObjects: true });

  return (
    <section className={styles.hero}>
      <div className={styles.heroFrame} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className={styles.heroMedia}>
        <img
          {...responsiveImage('https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1800&q=85')}
          alt={t('pages.home.hero.imageAlt')}
          fetchPriority="high"
          decoding="async"
        />
      </div>
      <div className={styles.heroContent}>
        <div className={styles.heroKicker}>
          <span className={styles.liveDot} />
          {t('pages.home.hero.kicker')}
        </div>
        <p className="eyebrow">{t('pages.home.hero.eyebrow')}</p>
        <h1>{t('pages.home.hero.title')}</h1>
        <p className={styles.heroCopy}>{t('pages.home.hero.copy')}</p>
        <div className={styles.heroActions}>
          <a className="button primary" href="/trucks">{t('pages.home.hero.viewStock')}</a>
          <a className="button secondary" href="/contact">{t('pages.home.hero.requestCallback')}</a>
        </div>
        <div className={styles.heroProof} aria-label={t('pages.home.hero.proofAria')}>
          {proof.map((item) => (
            <span key={item}>✓ {item}</span>
          ))}
        </div>
      </div>
      {latest && (
        <aside className={styles.heroCard} aria-label={t('pages.home.hero.cardLabel')}>
          <span className={styles.heroCardLabel}>{t('pages.home.hero.cardLabel')}</span>
          <strong>{truckDisplayTitle(latest)}</strong>
          <span>{[latest.mileage, latest.gearbox, latest.euroRating].filter(Boolean).join(' · ')}</span>
          <a href={truckUrl(latest)}>{t('pages.home.hero.cardCta')} <span aria-hidden="true">→</span></a>
        </aside>
      )}
      <div className={styles.scrollCue} aria-hidden="true">
        <span />
        {t('pages.home.hero.scrollCue')}
      </div>
    </section>
  );
}

function RevealSection({ className, children }) {
  const [ref, inView] = useInView();

  return (
    <section
      ref={ref}
      className={`${className} ${styles.reveal} ${inView ? styles.inView : ''}`}
    >
      {children}
    </section>
  );
}

function BuyerJourney() {
  const { t } = useTranslation();
  const steps = t('pages.home.journey.steps', { returnObjects: true });

  return (
    <RevealSection className={styles.journeySection}>
      <div className={styles.journeyIntro}>
        <p className="eyebrow">{t('pages.home.journey.eyebrow')}</p>
        <h2>{t('pages.home.journey.heading')}</h2>
        <p>{t('pages.home.journey.copy')}</p>
        <a className="text-link" href="/trucks">{t('pages.home.journey.cta')} →</a>
      </div>
      <div className={styles.journeySteps}>
        {steps.map(({ number, title, copy }) => (
          <article className={styles.journeyStep} key={number}>
            <span>{number}</span>
            <div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          </article>
        ))}
      </div>
    </RevealSection>
  );
}

function FeaturedStock({ stock }) {
  const { t } = useTranslation();
  const [headingRef, headingInView] = useInView();
  const featuredTrucks = stock.trucks.slice(0, 3);
  const empty = stock.loaded && featuredTrucks.length === 0;

  return (
    <section className="section">
      <div
        ref={headingRef}
        className={`${styles.sectionHeading} ${styles.reveal} ${headingInView ? styles.inView : ''}`}
      >
        <div>
          <p className="eyebrow">{t('pages.home.featuredStock.eyebrow')}</p>
          <h2>{empty ? t('pages.home.featuredStock.emptyHeading') : t('pages.home.featuredStock.heading')}</h2>
        </div>
        {!empty && <a className="text-link" href="/trucks">{t('pages.home.featuredStock.viewAll')}</a>}
      </div>
      {!stock.loaded && <TruckGridSkeleton count={3} />}
      {stock.loaded && !empty && <TruckGrid trucks={featuredTrucks} />}
      {empty && (
        <div className={styles.stockEmpty}>
          <p>{t('pages.home.featuredStock.emptyCopy')}</p>
          <a className="button primary" href="#stock-alert">{t('pages.home.featuredStock.emptyCta')}</a>
        </div>
      )}
    </section>
  );
}

function ServiceCards() {
  const { t } = useTranslation();
  const serviceCards = t('content.serviceCards', { returnObjects: true });

  return (
    <section className={styles.serviceGrid} aria-label={t('pages.home.featuredStock.eyebrow')}>
      {serviceCards.map(({ title, copy }, index) => (
        <ServiceCard key={title} title={title} copy={copy} href={serviceCardHrefs[index]} index={index} />
      ))}
    </section>
  );
}

function ServiceCard({ title, copy, href, index }) {
  const { t } = useTranslation();
  const [ref, inView] = useInView();
  const Icon = serviceIcons[index];

  return (
    <a
      ref={ref}
      className={`${styles.serviceCard} ${styles.reveal} ${inView ? styles.inView : ''}`}
      href={href}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {Icon && (
        <span className={styles.serviceIcon}>
          <Icon />
        </span>
      )}
      <span className={styles.serviceTitle}>{title}</span>
      <p>{copy}</p>
      <strong>{t('pages.home.serviceCard.openPage')}</strong>
    </a>
  );
}

export function FeatureBand() {
  const { t } = useTranslation();
  const items = t('pages.home.featureBand.items', { returnObjects: true });

  return (
    <section className={styles.featureBand}>
      <div className={styles.featureCopy}>
        <p className="eyebrow">{t('pages.home.featureBand.eyebrow')}</p>
        <h2>{t('pages.home.featureBand.heading')}</h2>
        <p>{t('pages.home.featureBand.copy')}</p>
      </div>
      <div className={styles.featureList}>
        {items.map((item) => (
          <InfoCard title={item.title} copy={item.copy} key={item.title} />
        ))}
      </div>
    </section>
  );
}
