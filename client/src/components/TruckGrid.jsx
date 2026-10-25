import { useTranslation } from 'react-i18next';
import { Spec } from './InfoList.jsx';
import { trucks as fallbackTrucks } from '../data/siteData.js';
import { useInView } from '../utils/useInView.js';
import { IconCamera } from './icons.jsx';
import { demoDataEnabled } from '../utils/runtime.js';
import { formatTruckStatus } from '../utils/truckStatus.js';
import { truckUrl } from '../utils/routes.js';
import { truckDisplayPrice, truckDisplayTitle } from '../../../shared/truck.js';
import styles from './TruckGrid.module.css';

export function TruckGrid({ trucks: truckList, variant = '', compareEnabled = false, compareIds = [], onToggleCompare }) {
  return (
    <div className={`${styles.truckGrid} ${variant === 'listing' ? styles.listing : ''}`}>
      {truckList.map((truckItem, index) => {
        const fallback = demoDataEnabled ? fallbackTrucks.find((item) => item.id === truckItem.id) || {} : {};
        const truck = { ...fallback, ...truckItem };
        const checked = compareIds.includes(truck.id);

        return (
          <TruckCard
            key={truck.id}
            truck={truck}
            index={index}
            compareEnabled={compareEnabled}
            checked={checked}
            compareFull={!checked && compareIds.length >= 3}
            onToggleCompare={onToggleCompare}
          />
        );
      })}
    </div>
  );
}
export function TruckGridSkeleton({ count = 6, variant = '' }) {
  return (
    <div className={`${styles.truckGrid} ${variant === 'listing' ? styles.listing : ''}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div className={styles.skeletonCard} key={index} />
      ))}
    </div>
  );
}

function TruckCard({ truck, index, compareEnabled, checked, compareFull, onToggleCompare }) {
  const { t } = useTranslation();
  const confirm = t('common.confirm');
  const [ref, inView] = useInView();

  return (
    <article
      ref={ref}
      className={`${styles.truckCard} ${inView ? styles.inView : ''}`}
      style={{ transitionDelay: `${Math.min(index, 5) * 90}ms` }}
    >
      <div className={styles.truckImage}>
        {truck.image
          ? <img src={truck.image} alt={truckDisplayTitle(truck)} loading={index < 3 ? 'eager' : 'lazy'} decoding="async" />
          : <div className={styles.imagePlaceholder}>{t('truckGrid.photoComingSoon')}</div>}
        {truck.badge && <span>{truck.badge}</span>}
        {truck.featured && <span className={styles.featuredBadge}>{t('truckGrid.hotDeal')}</span>}
        {truck.photoCount > 0 && (
          <span className={styles.photoCount}>
            <IconCamera /> {truck.photoCount}
          </span>
        )}
        {compareEnabled && (
          <label
            className={`${styles.compareToggle} ${compareFull ? styles.compareDisabled : ''}`}
            title={compareFull ? t('truckGrid.compareRemoveHint') : t('truckGrid.compareAddHint')}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={compareFull}
              onChange={() => onToggleCompare(truck)}
            />
            {t('truckGrid.compareLabel')}
          </label>
        )}
      </div>
      <div className={styles.truckBody}>
        <p>{truck.location}</p>
        <h3>{truckDisplayTitle(truck)}</h3>
        <div className={styles.statusRow}>
          <span>{formatTruckStatus(t, truck.status)}</span>
          <span>{truck.vatStatus || t('truckGrid.vatConfirm')}</span>
        </div>
        <dl>
          <Spec label={t('truckGrid.specs.year')} value={truck.year || confirm} />
          <Spec label={t('truckGrid.specs.mileage')} value={truck.mileage || confirm} />
          <Spec label={t('truckGrid.specs.body')} value={truck.type || confirm} />
          <Spec label={t('truckGrid.specs.gearbox')} value={truck.gearbox || confirm} />
          <Spec label={t('truckGrid.specs.euro')} value={truck.euroRating || (/euro/i.test(truck.badge || '') ? truck.badge : confirm)} />
          <Spec label={t('truckGrid.specs.mot')} value={truck.motExpiry || truck.mot || confirm} />
        </dl>
        <div className={styles.cardFooter}>
          <strong>{truckDisplayPrice(truck)}</strong>
          <a href={truckUrl(truck)}>{t('truckGrid.viewDetails')}</a>
        </div>
      </div>
    </article>
  );
}
