import { useTranslation } from 'react-i18next';
import { IconClose, IconScale } from './icons.jsx';
import styles from './CompareBar.module.css';

export function CompareBar({ trucks, onRemove, onClear, onOpen }) {
  const { t } = useTranslation();

  if (trucks.length === 0) return null;

  return (
    <div className={styles.bar} role="region" aria-label={t('compareBar.ariaLabel')}>
      <div className={styles.items}>
        {trucks.map((truck) => (
          <div className={styles.item} key={truck.id}>
            <img src={truck.image} alt="" />
            <span>{truck.title}</span>
            <button
              type="button"
              aria-label={t('compareBar.removeAria', { title: truck.title })}
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
