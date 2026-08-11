import { useTranslation } from 'react-i18next';
import { ContactPreview } from '../components/ContactPreview.jsx';
import { InfoList } from '../components/InfoList.jsx';
import { PageHero } from '../components/PageHero.jsx';
import { IconDelivery, IconGlobe, IconMail, IconPin, IconShip } from '../components/icons.jsx';
import { useInView } from '../utils/useInView.js';
import styles from './DeliveryPage.module.css';

const reachIcons = [IconGlobe, IconDelivery, IconShip, IconMail];

export function DeliveryPage() {
  const { t } = useTranslation();
  const items = t('pages.delivery.items', { returnObjects: true });

  return (
    <>
      <PageHero
        eyebrow={t('pages.delivery.hero.eyebrow')}
        title={t('pages.delivery.hero.title')}
        copy={t('pages.delivery.hero.copy')}
        image="https://images.unsplash.com/photo-1501700493788-fa1a4fc9fe62?auto=format&fit=crop&w=1800&q=85"
      />
      <ReachStats />
      <section className={styles.splitPage}>
        <InfoList items={items.map((item) => [item.title, item.copy])} />
        <div className={styles.copyBlock}>
          <p className="eyebrow">{t('pages.delivery.support.eyebrow')}</p>
          <h2>{t('pages.delivery.support.heading')}</h2>
          <p>{t('pages.delivery.support.copy')}</p>
        </div>
      </section>
      <Process />
      <Regions />
      <ContactPreview />
    </>
  );
}

function ReachStats() {
  const { t } = useTranslation();
  const stats = t('pages.delivery.reach.stats', { returnObjects: true });

  return (
    <section className={styles.reachGrid} aria-label={t('pages.delivery.reach.ariaLabel')}>
      {stats.map(({ value, label }, index) => {
        const Icon = reachIcons[index];
        return (
          <div className={styles.reachTile} key={label} style={{ '--delay': `${index * 90}ms` }}>
            {Icon && <Icon />}
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        );
      })}
    </section>
  );
}

function Process() {
  const { t } = useTranslation();
  const steps = t('pages.delivery.process.steps', { returnObjects: true });
  const [ref, inView] = useInView();

  return (
    <section
      ref={ref}
      className={`${styles.processSection} ${styles.reveal} ${inView ? styles.inView : ''}`}
    >
      <div className={styles.processIntro}>
        <p className="eyebrow">{t('pages.delivery.process.eyebrow')}</p>
        <h2>{t('pages.delivery.process.heading')}</h2>
        <p>{t('pages.delivery.process.copy')}</p>
      </div>
      <div className={styles.processSteps}>
        {steps.map(({ number, title, copy }) => (
          <article className={styles.processStep} key={number}>
            <span>{number}</span>
            <div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Regions() {
  const { t } = useTranslation();
  const regions = t('pages.delivery.regions.list', { returnObjects: true });
  const [ref, inView] = useInView();

  return (
    <section
      ref={ref}
      className={`section ${styles.regionsSection} ${styles.reveal} ${inView ? styles.inView : ''}`}
    >
      <div className={styles.regionsIntro}>
        <p className="eyebrow">{t('pages.delivery.regions.eyebrow')}</p>
        <h2>{t('pages.delivery.regions.heading')}</h2>
        <p>{t('pages.delivery.regions.copy')}</p>
      </div>
      <div className={styles.regionsGrid}>
        {regions.map(({ title, copy }) => (
          <div className={styles.regionCard} key={title}>
            <IconPin />
            <strong>{title}</strong>
            <span>{copy}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
