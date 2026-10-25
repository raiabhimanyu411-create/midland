import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconClose } from './icons.jsx';
import styles from './CompareModal.module.css';
import { truckUrl } from '../utils/routes.js';
import { truckDisplayTitle } from '../../../shared/truck.js';

export function CompareModal({ trucks, onClose, onRemove }) {
  const { t } = useTranslation();
  const confirm = t('common.confirm');

  const rows = [
    [t('compareModal.rows.price'), (truck) => truck.price],
    [t('compareModal.rows.year'), (truck) => truck.year],
    [t('compareModal.rows.mileage'), (truck) => truck.mileage],
    [t('compareModal.rows.gearbox'), (truck) => truck.gearbox],
    [t('compareModal.rows.bodyType'), (truck) => truck.type],
    [t('compareModal.rows.euroRating'), (truck) => truck.euroRating || truck.badge || confirm],
    [t('compareModal.rows.mot'), (truck) => truck.motExpiry || truck.mot || confirm],
    [t('compareModal.rows.location'), (truck) => truck.location]
  ];

  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    if (trucks.length === 0) onClose();
  }, [trucks.length, onClose]);

  if (trucks.length === 0) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={t('compareModal.ariaLabel')}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2>{t('compareModal.title', { count: trucks.length })}</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label={t('compareModal.closeAria')}>
            <IconClose />
          </button>
        </div>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th scope="col" className={styles.rowLabelCell} />
                {trucks.map((truck) => (
                  <th scope="col" key={truck.id}>
                    {truck.image && <img src={truck.image} alt={truckDisplayTitle(truck)} />}
                    <span>{truckDisplayTitle(truck)}</span>
                    <button type="button" className="text-link" onClick={() => onRemove(truck.id)}>
                      {t('compareModal.remove')}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, getValue]) => (
                <tr key={label}>
                  <th scope="row" className={styles.rowLabelCell}>
                    {label}
                  </th>
                  {trucks.map((truck) => (
                    <td key={truck.id}>{getValue(truck)}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <th scope="row" className={styles.rowLabelCell} />
                {trucks.map((truck) => (
                  <td key={truck.id}>
                    <a className="button primary" href={truckUrl(truck)}>
                      {t('compareModal.viewDetails')}
                    </a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
