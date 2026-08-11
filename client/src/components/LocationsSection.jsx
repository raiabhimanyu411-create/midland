import { useTranslation } from 'react-i18next';
import { locations } from '../data/siteData.js';
import { IconPin } from './icons.jsx';
import styles from './LocationsSection.module.css';

export function LocationsSection() {
  const { t } = useTranslation();
  const locationsContent = t('content.locations', { returnObjects: true });

  return (
    <section className={styles.locationsSection} aria-label={t('locationsSection.ariaLabel')}>
      <div className={styles.heading}>
        <p className="eyebrow">{t('locationsSection.eyebrow')}</p>
        <h2>{t('locationsSection.heading')}</h2>
      </div>
      <div className={styles.grid}>
        {locations.map((location, index) => {
          const content = locationsContent[index];
          return (
            <div className={styles.card} key={location.address}>
              <span className={styles.iconWrap}>
                <IconPin />
              </span>
              <strong>{content.name}</strong>
              <address className={styles.address}>{location.address}</address>
              <span className={styles.hours}>{content.hours}</span>
              <a className="text-link" href={`tel:${location.phone.replace(/\s+/g, '')}`}>
                {location.phone}
              </a>
              <a
                className={styles.directions}
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`}
                target="_blank"
                rel="noreferrer"
              >
                {t('locationsSection.getDirections')}
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
}
