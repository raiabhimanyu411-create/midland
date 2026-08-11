import { useTranslation } from 'react-i18next';
import { locations } from '../data/siteData.js';
import styles from './Footer.module.css';

export function Footer() {
  const { t } = useTranslation();
  const headquarters = locations[0];

  const linkColumns = [
    {
      heading: t('footer.stockHeading'),
      links: [
        { label: t('footer.links.allTrucks'), href: '/trucks' },
        { label: t('footer.links.finance'), href: '/finance' },
        { label: t('footer.links.partExchange'), href: '/part-exchange' },
        { label: t('footer.links.delivery'), href: '/delivery' }
      ]
    },
    {
      heading: t('footer.companyHeading'),
      links: [
        { label: t('footer.links.aboutUs'), href: '/about' },
        { label: t('footer.links.faq'), href: '/faq' },
        { label: t('footer.links.contactUs'), href: '/contact' },
        { label: t('footer.links.privacyPolicy'), href: '/privacy' }
      ]
    }
  ];

  return (
    <footer className={styles.siteFooter}>
      <div className={styles.footerTop}>
        <div className={styles.brandColumn}>
          <a className={styles.brand} href="/" aria-label={t('footer.brandAria')}>
            <span className={styles.brandMark}>M</span>
            <strong>MidLand Trucks</strong>
          </a>
          <p>{t('footer.intro')}</p>
          {headquarters && <address>{headquarters.address}</address>}
          <a className="text-link" href="tel:+441214960000">0121 496 0000</a>
          <a className="text-link" href="mailto:sales@midlandtrucks.co.uk">sales@midlandtrucks.co.uk</a>
        </div>
        {linkColumns.map((column) => (
          <div className={styles.linkColumn} key={column.heading}>
            <strong>{column.heading}</strong>
            <nav aria-label={t('footer.navAria', { heading: column.heading })}>
              {column.links.map((link) => (
                <a href={link.href} key={link.label}>{link.label}</a>
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
