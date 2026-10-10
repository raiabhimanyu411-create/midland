import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage, supportedLanguages } from '../i18n/index.js';
import { primaryRoutes, routePaths } from '../utils/routes.js';
import styles from './Header.module.css';

export function Header({ route }) {
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [route.name]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  return (
    <header className={`${styles.topbar} ${menuOpen ? styles.menuOpen : ''}`}>
      <a className={styles.brand} href="/" aria-label={t('header.brandAria')}>
        <span className={styles.brandMark}>M</span>
        <span>
          <strong>MidLand Trucks</strong>
          <small>{t('header.tagline')}</small>
        </span>
      </a>
      <nav className={styles.navLinks} aria-label={t('header.navAria')}>
        {primaryRoutes.map((key) => (
          <a
            className={route.name === key ? styles.active : ''}
            href={routePaths[key]}
            key={key}
            onClick={() => setMenuOpen(false)}
          >
            {t(`nav.${key}`)}
          </a>
        ))}
      </nav>
      <select
        className={styles.languageSelect}
        aria-label={t('header.languageAria')}
        value={i18n.language}
        onChange={(event) => changeLanguage(event.target.value)}
      >
        {supportedLanguages.map((language) => (
          <option value={language.code} key={language.code}>
            {language.nativeLabel}
          </option>
        ))}
      </select>
      <button
        className={styles.menuToggle}
        type="button"
        aria-label={t('header.navAria')}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((current) => !current)}
      >
        <span />
        <span />
        <span />
      </button>
      <a className={styles.phoneLink} href="tel:+441214960000">{t('common.phone')}</a>
    </header>
  );
}
