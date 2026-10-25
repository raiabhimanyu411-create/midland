import { useTranslation } from 'react-i18next';
import { ContactForm } from './ContactForm.jsx';
import { IconCheckBadge, IconDelivery, IconShield } from './icons.jsx';
import { locations } from '../data/siteData.js';
import { useInView } from '../utils/useInView.js';
import styles from './ContactPreview.module.css';

const benefitIcons = [IconCheckBadge, IconShield, IconDelivery];

export function ContactPreview() {
  const { t } = useTranslation();
  const benefits = t('contactPreview.benefits', { returnObjects: true });
  const [ref, inView] = useInView();

  return (
    <section
      ref={ref}
      className={`${styles.contactSection} ${inView ? styles.inView : ''}`}
    >
      <div className={styles.salesPanel}>
        <div className={styles.responseBadge}>
          <span />
          {t('contactPreview.badge')}
        </div>
        <p className="eyebrow">{t('contactPreview.eyebrow')}</p>
        <h2>{t('contactPreview.heading')}</h2>
        <p className={styles.intro}>{t('contactPreview.intro')}</p>
        <div className={styles.benefits}>
          {benefits.map(({ title, copy }, index) => {
            const Icon = benefitIcons[index];
            return (
              <div key={title}>
                <Icon />
                <span><strong>{title}</strong>{copy}</span>
              </div>
            );
          })}
        </div>
        <div className={styles.directContact}>
          <span>{t('contactPreview.preferTalk')}</span>
          <a href={`tel:${locations[0].phone.replace(/\s+/g, '')}`}>{locations[0].phone} <b aria-hidden="true">→</b></a>
          <small>{t('contactPreview.hoursNote')}</small>
        </div>
      </div>
      <div className={styles.formWrap}>
        <div className={styles.formTop}>
          <div>
            <span>{t('contactPreview.quickEnquiry')}</span>
            <strong>{t('contactPreview.quickEnquirySub')}</strong>
          </div>
          <span className={styles.stepBadge}>{t('contactPreview.stepBadge')}</span>
        </div>
        <ContactForm embedded />
        <p className={styles.privacyNote}>
          <IconShield /> {t('contactPreview.privacyNote')}
        </p>
      </div>
    </section>
  );
}
