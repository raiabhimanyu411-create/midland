import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api.js';
import { IconCheckBadge, IconMail } from './icons.jsx';
import { useInView } from '../utils/useInView.js';
import styles from './StockAlert.module.css';

export function StockAlert() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [criteria, setCriteria] = useState('');
  const [sectionRef, inView] = useInView();

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(false);
    setError('');
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);

    try {
      await api.createEnquiry({
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        requirement: `STOCK ALERT SIGN-UP: notify me about ${formData.get('criteria') || 'new stock matching my needs'}.`
      });
      formElement.reset();
      setCriteria('');
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section
      ref={sectionRef}
      className={`${styles.alertSection} ${inView ? styles.inView : ''}`}
      aria-label={t('stockAlert.badge')}
    >
      <div className={styles.panel}>
        <div className={styles.copySide}>
          <div className={styles.alertBadge}>
            <span className={styles.iconWrap}><IconMail /></span>
            {t('stockAlert.badge')}
          </div>
          <div className={styles.copy}>
            <p className="eyebrow">{t('stockAlert.eyebrow')}</p>
            <h2>{t('stockAlert.heading')}</h2>
            <p>{t('stockAlert.copy')}</p>
          </div>
          <div className={styles.previewCard}>
            <div className={styles.previewIcon}>
              <IconMail />
              <span />
            </div>
            <div>
              <span>{t('stockAlert.previewLabel')}</span>
              <strong>{criteria || t('stockAlert.previewDefault')}</strong>
              <small>{t('stockAlert.previewMeta')}</small>
            </div>
          </div>
          <div className={styles.assurances}>
            {t('stockAlert.assurances', { returnObjects: true }).map((assurance) => (
              <span key={assurance}><IconCheckBadge /> {assurance}</span>
            ))}
          </div>
        </div>
        <form className={styles.formCard} onSubmit={handleSubmit}>
          <div className={styles.formHeading}>
            <span>{t('stockAlert.formEyebrow')}</span>
            <strong>{t('stockAlert.formHeading')}</strong>
            <small>{t('stockAlert.formNote')}</small>
          </div>
          <label>
            {t('stockAlert.nameLabel')}
            <input name="name" type="text" placeholder={t('stockAlert.namePlaceholder')} required />
          </label>
          <label>
            {t('stockAlert.phoneLabel')}
            <input name="phone" type="tel" placeholder={t('stockAlert.phonePlaceholder')} required />
          </label>
          <label className={styles.fullField}>
            {t('stockAlert.emailLabel')}
            <input name="email" type="email" placeholder={t('stockAlert.emailPlaceholder')} required />
          </label>
          <label className={styles.fullField}>
            {t('stockAlert.criteriaLabel')}
            <input
              name="criteria"
              type="text"
              value={criteria}
              onChange={(event) => setCriteria(event.target.value)}
              placeholder={t('stockAlert.criteriaPlaceholder')}
            />
          </label>
          <div className={styles.quickChoices}>
            <span>{t('stockAlert.popular')}</span>
            {t('stockAlert.quickChoices', { returnObjects: true }).map((choice) => (
              <button type="button" onClick={() => setCriteria(choice)} key={choice}>{choice}</button>
            ))}
          </div>
          <button type="submit" className={styles.submitButton}>
            {t('stockAlert.submit')} <span aria-hidden="true">→</span>
          </button>
          {submitted && <p className={styles.formStatus}>{t('stockAlert.success')}</p>}
          {error && <p className={styles.formError}>{error}</p>}
        </form>
      </div>
    </section>
  );
}
