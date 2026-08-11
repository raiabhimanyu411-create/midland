import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api.js';
import styles from './ContactForm.module.css';

export function ContactForm({ embedded = false }) {
  const { t } = useTranslation();
  const contactReasons = t('contactForm.reasons', { returnObjects: true });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  return (
    <form
      className={`${styles.contactForm} ${embedded ? styles.embedded : ''}`}
      onSubmit={async (event) => {
        event.preventDefault();
        setSubmitted(false);
        setError('');
        const formData = new FormData(event.currentTarget);

        try {
          await api.createEnquiry({
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            requirement: `[${formData.get('reason')}] ${formData.get('requirement')}`
          });
          event.currentTarget.reset();
          setSubmitted(true);
        } catch (requestError) {
          setError(requestError.message);
        }
      }}
    >
      <label className={styles.halfField}>
        {t('contactForm.nameLabel')}
        <input name="name" type="text" placeholder={t('contactForm.namePlaceholder')} required />
      </label>
      <label className={styles.halfField}>
        {t('contactForm.reasonLabel')}
        <select name="reason" defaultValue={contactReasons[0]}>
          {contactReasons.map((reason) => (
            <option key={reason}>{reason}</option>
          ))}
        </select>
      </label>
      <label className={styles.halfField}>
        {t('contactForm.phoneLabel')}
        <input name="phone" type="tel" placeholder={t('contactForm.phonePlaceholder')} required />
      </label>
      <label className={styles.halfField}>
        {t('contactForm.emailLabel')}
        <input name="email" type="email" placeholder={t('contactForm.emailPlaceholder')} />
      </label>
      <label>
        {t('contactForm.requirementLabel')}
        <textarea name="requirement" placeholder={t('contactForm.requirementPlaceholder')} required />
      </label>
      {submitted && <p className={styles.formStatus}>{t('contactForm.success')}</p>}
      {error && <p className={styles.formError}>{error}</p>}
      <button type="submit">{t('contactForm.submit')} <span aria-hidden="true">→</span></button>
    </form>
  );
}
