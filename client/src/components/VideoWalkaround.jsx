import { useTranslation } from 'react-i18next';
import { IconPlay } from './icons.jsx';
import styles from './VideoWalkaround.module.css';

export function VideoWalkaround() {
  const { t } = useTranslation();

  return (
    <section className={styles.videoSection} aria-label={t('videoWalkaround.ariaLabel')}>
      <div className={styles.copy}>
        <p className="eyebrow">{t('videoWalkaround.eyebrow')}</p>
        <h2>{t('videoWalkaround.heading')}</h2>
        <p>{t('videoWalkaround.copy')}</p>
        <a className="button primary" href="/contact">{t('videoWalkaround.cta')}</a>
      </div>
      <a className={styles.preview} href="/contact" aria-label={t('videoWalkaround.cta')}>
        <img
          src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80"
          alt={t('videoWalkaround.imageAlt')}
        />
        <span className={styles.playButton}>
          <IconPlay />
        </span>
      </a>
    </section>
  );
}
