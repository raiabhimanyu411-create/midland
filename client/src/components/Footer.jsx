import { useTranslation } from 'react-i18next';
import { locations } from '../data/siteData.js';
import { SITE_EMAIL } from '../../../shared/seo.js';
import { BrandMark } from './BrandLogo.jsx';
import { OPEN_COOKIE_SETTINGS } from '../utils/analytics.js';
import styles from './Footer.module.css';

function openCookieSettings(event) {
  event.preventDefault();
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS));
}

// The server marks the page when no blog posts are published yet, so the footer hides the link.
function blogHasPosts() {
  if (typeof document === 'undefined') return true;
  return document.querySelector('meta[name="midland:has-blog"]')?.getAttribute('content') !== '0';
}

export function Footer() {
  const { t } = useTranslation();
  const headquarters = locations[0];

  const linkColumns = [
    {
      heading: t('footer.stockHeading'),
      links: [
        { label: t('footer.links.allTrucks'), href: '/trucks' },
        { label: t('footer.links.partExchange'), href: '/part-exchange' }
      ]
    },
    {
      heading: t('footer.companyHeading'),
      links: [
        { label: t('footer.links.aboutUs'), href: '/about' },
        { label: t('footer.links.faq'), href: '/faq' },
        ...(blogHasPosts() ? [{ label: t('footer.links.news'), href: '/blog' }] : []),
        { label: t('footer.links.contactUs'), href: '/contact' },
        { label: t('footer.links.privacyPolicy'), href: '/privacy' },
        { label: t('footer.links.cookieSettings'), href: '#cookie-settings', onClick: openCookieSettings }
      ]
    }
  ];

  return (
    <footer className={styles.siteFooter}>
      <div className={styles.footerTop}>
        <div className={styles.brandColumn}>
          <a className={styles.brand} href="/">
            <span className={styles.brandMark}><BrandMark /></span>
            <span><strong>Midland</strong><small>Commercials</small></span>
          </a>
          <p>{t('footer.intro')}</p>
          {headquarters && <address>{headquarters.address}</address>}
          {headquarters && <a className="text-link" href={`tel:${headquarters.phone.replace(/\s+/g, '')}`}>{headquarters.phone}</a>}
          <a className="text-link" href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>
        </div>
        {linkColumns.map((column) => (
          <div className={styles.linkColumn} key={column.heading}>
            <strong>{column.heading}</strong>
            <nav aria-label={t('footer.navAria', { heading: column.heading })}>
              {column.links.map((link) => (
                <a href={link.href} key={link.label} onClick={link.onClick}>{link.label}</a>
              ))}
            </nav>
          </div>
        ))}
      </div>
      <div className={styles.footerBottom}>
        <small>{t('footer.legalLine')}</small>
        <small>{t('footer.credit', { year: new Date().getFullYear() })}</small>
      </div>
    </footer>
  );
}
