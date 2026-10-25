import { useTranslation } from 'react-i18next';
import { locations } from '../data/siteData.js';
import { BrandMark } from './BrandLogo.jsx';
import styles from './StatusPage.module.css';

// Shared branded layout for the 404 and thank-you pages.
export function StatusPage({ code, eyebrow, title, copy, actions }) {
  const { t } = useTranslation();
  const phone = locations[0]?.phone;

  return (
    <section className={styles.statusPage}>
      <div className={styles.panel}>
        <span className={styles.mark} aria-hidden="true"><BrandMark /></span>
        {code && <span className={styles.code} aria-hidden="true">{code}</span>}
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className={styles.copy}>{copy}</p>
        <div className={styles.actions}>
          {actions.map(({ label, href, primary }) => (
            <a key={href} className={`button ${primary ? 'primary' : 'outline'}`} href={href}>{label}</a>
          ))}
        </div>
        {phone && (
          <p className={styles.help}>
            {t('statusPage.help')} <a href={`tel:${phone.replace(/\s+/g, '')}`}>{phone}</a>
          </p>
        )}
      </div>
    </section>
  );
}
