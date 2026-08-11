import { InfoList, Spec } from '../components/InfoList.jsx';
import { PageHero } from '../components/PageHero.jsx';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { trucks as fallbackTrucks } from '../data/siteData.js';
import { api } from '../utils/api.js';
import { demoDataEnabled } from '../utils/runtime.js';
import styles from './TruckDetailPage.module.css';

export function TruckDetailPage({ truckId }) {
  const { t } = useTranslation();
  const confirm = t('common.confirm');
  const items = t('pages.truckDetail.items', { returnObjects: true });
  const [truck, setTruck] = useState(() => demoDataEnabled ? fallbackTrucks.find((item) => item.id === truckId) || fallbackTrucks[0] : null);
  const [allTrucks, setAllTrucks] = useState(() => demoDataEnabled ? fallbackTrucks : []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadTruck() {
      try {
        const [truckData, listData] = await Promise.all([api.getTruck(truckId || 1), api.listTrucks()]);
        const fallback = demoDataEnabled ? fallbackTrucks.find((item) => item.id === truckData.data.id) || {} : {};
        setTruck({ ...fallback, ...truckData.data });
        setAllTrucks(listData.data || []);
      } catch (requestError) {
        setError(requestError.message);
        setTruck(demoDataEnabled ? fallbackTrucks.find((item) => item.id === truckId) || fallbackTrucks[0] : null);
      } finally {
        setLoading(false);
      }
    }

    loadTruck();
  }, [truckId]);

  if (loading && !truck) return <section className="section"><p>{t('common.loading', { defaultValue: 'Loading vehicle…' })}</p></section>;
  if (!truck) return <section className="section"><h1>{t('common.notFound', { defaultValue: 'Vehicle unavailable' })}</h1><p>{error}</p><a className="button primary" href="/trucks">{t('nav.trucks')}</a></section>;

  const gallery = [truck.image, ...allTrucks.filter((item) => item.id !== truck.id).slice(0, 3).map((item) => item.image)].filter(Boolean);

  return (
    <>
      <PageHero
        eyebrow={t('pages.truckDetail.hero.eyebrow')}
        title={truck.title}
        copy={t('pages.truckDetail.hero.copy')}
        image={truck.image}
      />
      <section className={styles.detailLayout}>
        <div>
          <img className={styles.detailImage} src={truck.image} alt={truck.title} />
          <div className={styles.thumbnailRow} aria-label={t('pages.truckDetail.galleryAria')}>
            {gallery.map((image) => (
              <img src={image} alt="" key={image} />
            ))}
          </div>
          <div className={styles.copyBlock}>
            <p className="eyebrow">{t('pages.truckDetail.prepNotes.eyebrow')}</p>
            <h2>{t('pages.truckDetail.prepNotes.heading')}</h2>
            <p>{truck.description}</p>
          </div>
          <InfoList items={items.map((item) => [item.title, item.copy])} />
        </div>
        <aside className={styles.detailPanel}>
          <span className={styles.statusBadge}>{truck.status || t('truckGrid.available')}</span>
          <strong>{formatPrice(truck)}</strong>
          <p className={styles.priceNote}>
            {truck.vatStatus
              ? t('pages.truckDetail.priceNoteVat', { vatStatus: truck.vatStatus })
              : t('pages.truckDetail.priceNoteConfirm')}
          </p>
          <dl>
            <Spec label={t('pages.truckDetail.specs.make')} value={truck.make} />
            <Spec label={t('pages.truckDetail.specs.body')} value={truck.type} />
            <Spec label={t('pages.truckDetail.specs.year')} value={truck.year} />
            <Spec label={t('pages.truckDetail.specs.registration')} value={truck.registration || confirm} />
            <Spec label={t('pages.truckDetail.specs.mileage')} value={truck.mileage} />
            <Spec label={t('pages.truckDetail.specs.gearbox')} value={truck.gearbox} />
            <Spec label={t('pages.truckDetail.specs.location')} value={truck.location} />
            <Spec label={t('pages.truckDetail.specs.cab')} value={truck.cab} />
            <Spec label={t('pages.truckDetail.specs.power')} value={truck.power} />
            <Spec label={t('pages.truckDetail.specs.axle')} value={truck.axle || confirm} />
            <Spec label={t('pages.truckDetail.specs.weight')} value={truck.grossWeight || confirm} />
            <Spec label={t('pages.truckDetail.specs.payload')} value={truck.payload || confirm} />
            <Spec label={t('pages.truckDetail.specs.euroCaz')} value={truck.cleanAir || truck.euroRating || confirm} />
            <Spec label={t('pages.truckDetail.specs.mot')} value={truck.motExpiry || truck.mot} />
            <Spec label={t('pages.truckDetail.specs.service')} value={truck.serviceHistory || confirm} />
            <Spec label={t('pages.truckDetail.specs.owners')} value={truck.owners || confirm} />
            <Spec label={t('pages.truckDetail.specs.warranty')} value={truck.warranty || confirm} />
          </dl>
          <a className="button primary" href="/contact">{t('pages.truckDetail.reserveEnquire')}</a>
          <a className="button outline" href="/finance">{t('pages.truckDetail.financeOptions')}</a>
          <a className="button outline" href="/delivery">{t('pages.truckDetail.deliveryQuote')}</a>
        </aside>
      </section>
    </>
  );
}

function formatPrice(truck) {
  if (!truck.vatStatus || truck.price.includes('VAT')) {
    return truck.price;
  }

  return `${truck.price} ${truck.vatStatus}`;
}
