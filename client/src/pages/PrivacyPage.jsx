import { useTranslation } from 'react-i18next';
import { PageHero } from '../components/PageHero.jsx';
import { businessLocations, legalDetails, SITE_EMAIL } from '../../../shared/seo.js';
import styles from './PrivacyPage.module.css';

const contactValues = { email: SITE_EMAIL, phone: businessLocations[0].phone };

export function PrivacyPage() {
  const { t } = useTranslation();
  const sections = t('pages.privacy.sections', { returnObjects: true, ...contactValues });
  const detail = (key, value) => value && <li key={key}>{t(`pages.privacy.controller.${key}`, { value })}</li>;

  return (
    <>
      <PageHero
        eyebrow={t('pages.privacy.hero.eyebrow')}
        title={t('pages.privacy.hero.title')}
        copy={t('pages.privacy.hero.copy')}
        image="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1800&q=85"
      />
      <section className={styles.policyPage}>
        <p className={styles.updated}>{t('pages.privacy.updated', { date: legalDetails.privacyUpdated })}</p>
        <article>
          <h2>{t('pages.privacy.controller.heading')}</h2>
          <p>{t('pages.privacy.controller.intro')}</p>
          <ul>
            {detail('registeredName', legalDetails.registeredName)}
            {detail('companyNumber', legalDetails.companyNumber)}
            {detail('registeredOffice', legalDetails.registeredOffice)}
            {detail('tradingAddress', businessLocations[0].address)}
            {detail('ico', legalDetails.icoNumber)}
            <li>{t('pages.privacy.controller.contact', contactValues)}</li>
          </ul>
        </article>
        {sections.map((section) => (
          <article key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs?.map((text) => <p key={text}>{text}</p>)}
            {section.items && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}
            {section.after?.map((text) => <p key={text}>{text}</p>)}
          </article>
        ))}
      </section>
    </>
  );
}
