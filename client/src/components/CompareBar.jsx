import { useTranslation } from 'react-i18next';
import { IconClose, IconScale } from './icons.jsx';
import styles from './CompareBar.module.css';
import { truckDisplayTitle } from '../../../shared/truck.js';

export function CompareBar({ trucks, onRemove, onClear, onOpen }) {
  const { t } = useTranslation();

  if (trucks.length === 0) return null;

  return (
    <div className={styles.bar} role="region" aria-label={t('compareBar.ariaLabel')}>
      <div className={styles.items}>
        {trucks.map((truck) => (
          <div className={styles.item} key={truck.id}>
            {truck.image && <img src={truck.image} alt="" />}
            <span>{truckDisplayTitle(truck)}</span>
            <button
              type="button"
              aria-label={t('compareBar.removeAria', { title: truckDisplayTitle(truck) })}
              onClick={() => onRemove(truck.id)}
            >
              <IconClose />
            </button>
          </div>
        ))}
      </div>
      <div className={styles.actions}>
        <button type="button" className="button outline" onClick={onClear}>
          {t('compareBar.clear')}
        </button>
        <button type="button" className="button primary" onClick={onOpen} disabled={trucks.length < 2}>
          <IconScale /> {t('compareBar.compare', { count: trucks.length })}
        </button>
      </div>
    </div>
  );
}
