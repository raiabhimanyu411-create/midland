import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '../components/Breadcrumb.jsx';
import { ContactForm } from '../components/ContactForm.jsx';
import { LocationsSection } from '../components/LocationsSection.jsx';
import { PageHero } from '../components/PageHero.jsx';
import { locations } from '../data/siteData.js';
import { SITE_EMAIL } from '../../../shared/seo.js';
import styles from './ContactPage.module.css';

export function ContactPage() {
  const { t } = useTranslation();

  return (
    <>
      <Breadcrumb items={[{ label: t('nav.home'), href: '/' }, { label: t('nav.contact') }]} />
      <PageHero
        eyebrow={t('pages.contact.hero.eyebrow')}
        title={t('pages.contact.hero.title')}
        copy={t('pages.contact.hero.copy')}
        image="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=85"
      />
      <section className={styles.contactSection}>
        <div>
          <p className="eyebrow">{t('pages.contact.salesDesk.eyebrow')}</p>
          <h2>{t('pages.contact.salesDesk.heading')}</h2>
          <p>{t('pages.contact.salesDesk.copy')}</p>
          <div className={styles.contactDetails}>
            <a href={`tel:${locations[0].phone.replace(/\s+/g, '')}`}>{locations[0].phone}</a>
            <a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>
            <span>{t('pages.contact.details.location')}</span>
            <span>{t('pages.contact.details.hours')}</span>
          </div>
          <p className={styles.responseNote}>{t('pages.contact.responseNote')}</p>
          <a className={styles.faqTeaser} href="/faq">
            {t('pages.contact.faqTeaser')} <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
        <ContactForm />
      </section>
      <LocationsSection />
    </>
  );
}
