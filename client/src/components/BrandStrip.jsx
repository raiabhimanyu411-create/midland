import { useTranslation } from 'react-i18next';
import styles from './BrandStrip.module.css';

// `make` must match the make names used on truck listings so the /trucks filter picks it up.
const brands = [
  { make: 'Scania', logo: '/brands/scania.png', emblem: true },
  { make: 'Volvo', logo: '/brands/volvo.svg' },
  { make: 'DAF', logo: '/brands/daf.svg' },
  { make: 'Mercedes-Benz', logo: '/brands/mercedes-benz.svg', emblem: true },
  { make: 'MAN', logo: '/brands/man.svg' },
  { make: 'Renault', logo: '/brands/renault.svg' },
  { make: 'Iveco', logo: '/brands/iveco.svg' }
];

export function BrandStrip() {
  const { t } = useTranslation();

  return (
    <section className={styles.brandStrip} aria-label={t('brandStrip.ariaLabel')}>
      <p className={styles.label}>{t('brandStrip.heading')}</p>
      <div className={styles.viewport}>
        {/* The list is rendered twice so the scroll loops without a gap; the copy is hidden from screen readers. */}
        <div className={styles.track}>
          {[0, 1].map((copy) => (
            <ul className={styles.list} key={copy} aria-hidden={copy === 1 || undefined}>
              {brands.map(({ make, logo, emblem }) => (
                <li key={make}>
                  <a
                    href={`/trucks?make=${encodeURIComponent(make)}`}
                    tabIndex={copy === 1 ? -1 : undefined}
                    title={t('brandStrip.viewMake', { make })}
                  >
                    <img className={emblem ? styles.emblem : undefined} src={logo} alt={make} loading="lazy" decoding="async" />
                  </a>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
