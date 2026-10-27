import { Breadcrumb } from '../components/Breadcrumb.jsx';
import { InfoList, Spec } from '../components/InfoList.jsx';
import { PageHero } from '../components/PageHero.jsx';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { trucks as fallbackTrucks } from '../data/siteData.js';
import { api } from '../utils/api.js';
import { demoDataEnabled } from '../utils/runtime.js';
import { formatTruckStatus } from '../utils/truckStatus.js';
import { notFoundPage, truckJsonLd, truckSeo } from '../../../shared/seo.js';
import { truckDisplayPrice, truckDisplayTitle } from '../../../shared/truck.js';
import { setPageMeta, siteUrl } from '../utils/seo.js';
import styles from './TruckDetailPage.module.css';

export function TruckDetailPage({ truckId }) {
  const { t } = useTranslation();
  const confirm = t('common.confirm');
  const items = t('pages.truckDetail.items', { returnObjects: true });
  const findFallbackTruck = (id) => (demoDataEnabled ? fallbackTrucks.find((item) => item.id === id) || null : null);
  const [truck, setTruck] = useState(() => findFallbackTruck(truckId));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestStatus, setRequestStatus] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadTruck() {
      if (!truckId) {
        setTruck(null);
        setLoading(false);
        return;
      }

      try {
        const truckData = await api.getTruck(truckId);
        if (!active) return;
        setTruck({ ...(findFallbackTruck(truckData.data.id) || {}), ...truckData.data });
      } catch (requestError) {
        if (!active) return;
        setError(requestError.message);
        setRequestStatus(requestError.status || 0);
        setTruck(findFallbackTruck(truckId));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTruck();
    return () => { active = false; };
  }, [truckId]);

  useEffect(() => {
    if (loading && !truck) return;
    if (!truck) {
      // Only a real 404 marks the page as not found. Network or server errors keep the
      // server-rendered tags, so a slow API never de-indexes a listing.
      if (requestStatus === 404 || !truckId) setPageMeta({ ...notFoundPage, path: null });
      return;
    }
    setPageMeta({ ...truckSeo(truck), jsonLd: [truckJsonLd(truck, siteUrl())] });
  }, [truck, loading, requestStatus, truckId]);

  if (loading && !truck) return <section className="section"><p>{t('common.loading')}</p></section>;
  if (!truck && truckId && requestStatus !== 404) {
    return (
      <section className="section">
        <h1>{t('common.loadError')}</h1>
        <p>{error}</p>
        <button type="button" className="button primary" onClick={() => window.location.reload()}>{t('common.tryAgain')}</button>
      </section>
    );
  }
  if (!truck) return <section className="section"><h1>{t('common.notFound')}</h1><p>{error}</p><a className="button primary" href="/trucks">{t('nav.trucks')}</a></section>;

  const gallery = [...new Set([truck.image, ...(Array.isArray(truck.images) ? truck.images : [])]
    .filter((image) => typeof image === 'string' && image.trim()))];
  const activeImage = gallery.includes(selectedImage) ? selectedImage : gallery[0] || '';
  const videoEmbedUrl = getYoutubeEmbedUrl(truck.videoUrl);
  const displayTitle = truckDisplayTitle(truck);

  return (
    <>
      <Breadcrumb items={[{ label: t('nav.home'), href: '/' }, { label: t('nav.trucks'), href: '/trucks' }, { label: displayTitle }]} />
      <PageHero
        eyebrow={t('pages.truckDetail.hero.eyebrow')}
        title={displayTitle}
        copy={t('pages.truckDetail.hero.copy')}
        image={activeImage}
      />
      <section className={styles.detailLayout} data-no-tilt>
        <div>
          {activeImage
            ? <img className={styles.detailImage} src={activeImage} alt={displayTitle} decoding="async" />
            : <div className={`${styles.detailImage} ${styles.detailImagePlaceholder}`}>{t('pages.truckDetail.photosComingSoon')}</div>}
          {gallery.length > 1 && (
            <div className={styles.thumbnailRow} aria-label={t('pages.truckDetail.galleryAria')}>
              {gallery.map((image, index) => (
                <button
                  type="button"
                  className={image === activeImage ? styles.thumbnailActive : ''}
                  aria-label={`Show truck photo ${index + 1}`}
                  aria-pressed={image === activeImage}
                  onClick={() => setSelectedImage(image)}
                  key={image}
                >
                  <img src={image} alt="" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          )}
          <div className={styles.copyBlock}>
            <p className="eyebrow">{t('pages.truckDetail.prepNotes.eyebrow')}</p>
            <h2>{t('pages.truckDetail.prepNotes.heading')}</h2>
            <p>{truck.description}</p>
          </div>
          <InfoList items={items.map((item) => [item.title, item.copy])} />
        </div>
        <aside className={styles.detailPanel}>
          <span className={styles.statusBadge}>{formatTruckStatus(t, truck.status)}</span>
          <strong>{truckDisplayPrice(truck)}</strong>
          <p className={styles.priceNote}>
            {truck.vatStatus
              ? t('pages.truckDetail.priceNoteVat', { vatStatus: truck.vatStatus })
              : t('pages.truckDetail.priceNoteConfirm')}
          </p>
          <dl>
            <Spec label={t('pages.truckDetail.specs.make')} value={truck.make || confirm} />
            <Spec label={t('pages.truckDetail.specs.body')} value={truck.type || confirm} />
            <Spec label={t('pages.truckDetail.specs.year')} value={truck.year || confirm} />
            <Spec label={t('pages.truckDetail.specs.registration')} value={truck.registration || confirm} />
            <Spec label={t('pages.truckDetail.specs.vin')} value={truck.vin || confirm} />
            <Spec label={t('pages.truckDetail.specs.fuel')} value={truck.fuelType || confirm} />
            <Spec label={t('pages.truckDetail.specs.colour')} value={truck.colour || confirm} />
            <Spec label={t('pages.truckDetail.specs.mileage')} value={truck.mileage || confirm} />
            <Spec label={t('pages.truckDetail.specs.gearbox')} value={truck.gearbox || confirm} />
            <Spec label={t('pages.truckDetail.specs.location')} value={truck.location || confirm} />
            <Spec label={t('pages.truckDetail.specs.cab')} value={truck.cab || confirm} />
            <Spec label={t('pages.truckDetail.specs.power')} value={truck.power || confirm} />
            <Spec label={t('pages.truckDetail.specs.axle')} value={truck.axle || confirm} />
            <Spec label={t('pages.truckDetail.specs.weight')} value={truck.grossWeight || confirm} />
            <Spec label={t('pages.truckDetail.specs.payload')} value={truck.payload || confirm} />
            <Spec label={t('pages.truckDetail.specs.euroCaz')} value={truck.cleanAir || truck.euroRating || confirm} />
            <Spec label={t('pages.truckDetail.specs.mot')} value={truck.motExpiry || truck.mot || confirm} />
            <Spec label={t('pages.truckDetail.specs.service')} value={truck.serviceHistory || confirm} />
            <Spec label={t('pages.truckDetail.specs.previousOwners')} value={truck.owners || confirm} />
            <Spec label={t('pages.truckDetail.specs.tacho')} value={truck.tacho || confirm} />
            <Spec label={t('pages.truckDetail.specs.warranty')} value={truck.warranty || confirm} />
          </dl>
          <a className="button primary" href={`/contact?truck=${truck.id}`}>{t('pages.truckDetail.reserveEnquire')}</a>
        </aside>
      </section>
      {truck.videoUrl && (
        <section className={`${styles.copyBlock} section`}>
          <p className="eyebrow">{t('pages.truckDetail.walkaround.eyebrow')}</p>
          <h2>{t('pages.truckDetail.walkaround.heading')}</h2>
          {videoEmbedUrl
            ? <div className={styles.videoFrame}><iframe src={videoEmbedUrl} title={`${displayTitle} walkaround video`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>
            : <a className="button secondary" href={truck.videoUrl} target="_blank" rel="noopener noreferrer">{t('pages.truckDetail.walkaround.watch')}</a>}
        </section>
      )}
    </>
  );
}

function getYoutubeEmbedUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const id = host === 'youtu.be' ? url.pathname.slice(1).split('/')[0]
      : host === 'youtube.com' || host === 'm.youtube.com' ? (url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1])
        : null;
    return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : '';
  } catch { return ''; }
}
