import { useTranslation } from 'react-i18next';
import { Spec } from './InfoList.jsx';
import { trucks as fallbackTrucks } from '../data/siteData.js';
import { useInView } from '../utils/useInView.js';
import { IconCamera } from './icons.jsx';
import { demoDataEnabled } from '../utils/runtime.js';
import { formatTruckStatus } from '../utils/truckStatus.js';
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
        <img src={truck.image} alt={truck.title} loading={index < 3 ? 'eager' : 'lazy'} decoding="async" />
        <span>{truck.badge}</span>
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
        <h3>{truck.title}</h3>
        <div className={styles.statusRow}>
          <span>{formatTruckStatus(t, truck.status)}</span>
          <span>{truck.vatStatus || t('truckGrid.vatConfirm')}</span>
        </div>
        <dl>
          <Spec label={t('truckGrid.specs.year')} value={truck.year} />
          <Spec label={t('truckGrid.specs.mileage')} value={truck.mileage} />
          <Spec label={t('truckGrid.specs.body')} value={truck.type} />
          <Spec label={t('truckGrid.specs.gearbox')} value={truck.gearbox} />
          <Spec label={t('truckGrid.specs.euro')} value={truck.euroRating || truck.badge || confirm} />
          <Spec label={t('truckGrid.specs.mot')} value={truck.motExpiry || truck.mot || confirm} />
        </dl>
        <div className={styles.cardFooter}>
          <strong>{formatPrice(truck)}</strong>
          <a href={`/truck/${truck.id}`}>{t('truckGrid.viewDetails')}</a>
        </div>
      </div>
    </article>
  );
}

function formatPrice(truck) {
  if (!truck.vatStatus || String(truck.price || '').includes('VAT')) {
    return truck.price;
  }

  return `${truck.price} ${truck.vatStatus}`;
}
