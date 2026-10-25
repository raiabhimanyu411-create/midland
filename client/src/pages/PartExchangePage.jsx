import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHero } from '../components/PageHero.jsx';
import { api } from '../utils/api.js';
import { FormPrivacyNote } from '../components/FormPrivacyNote.jsx';
import { navigate } from '../utils/routes.js';
import styles from './PartExchangePage.module.css';

export function PartExchangePage() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  return (
    <>
      <PageHero
        eyebrow={t('pages.partExchange.hero.eyebrow')}
        title={t('pages.partExchange.hero.title')}
        copy={t('pages.partExchange.hero.copy')}
        image="https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?auto=format&fit=crop&w=1800&q=85"
      />
      <section className={styles.splitPage}>
        <div className={styles.copyBlock}>
          <p className="eyebrow">{t('pages.partExchange.details.eyebrow')}</p>
          <h2>{t('pages.partExchange.details.heading')}</h2>
          <p>{t('pages.partExchange.details.copy')}</p>
        </div>
        <form
          className={styles.contactForm}
          onSubmit={async (event) => {
            event.preventDefault();
            setSubmitted(false);
            setError('');
            const formElement = event.currentTarget;
            const formData = new FormData(formElement);

            try {
              await api.createPartExchange({
                name: formData.get('name'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                registration: formData.get('registration'),
                mileage: formData.get('mileage'),
                notes: formData.get('notes')
              });
              formElement.reset();
              setSubmitted(true);
              navigate('/thank-you?form=part-exchange');
            } catch (requestError) {
              setError(requestError.message);
            }
          }}
        >
          <label>
            {t('pages.partExchange.form.nameLabel')}
            <input name="name" type="text" placeholder={t('pages.partExchange.form.namePlaceholder')} required />
          </label>
          <label>
            {t('pages.partExchange.form.phoneLabel')}
            <input name="phone" type="tel" placeholder={t('pages.partExchange.form.phonePlaceholder')} required />
          </label>
          <label>
            {t('pages.partExchange.form.emailLabel')}
            <input name="email" type="email" placeholder={t('pages.partExchange.form.emailPlaceholder')} />
          </label>
          <label>
            {t('pages.partExchange.form.registrationLabel')}
            <input name="registration" type="text" placeholder={t('pages.partExchange.form.registrationPlaceholder')} required />
          </label>
          <label>
            {t('pages.partExchange.form.mileageLabel')}
            <input name="mileage" type="text" placeholder={t('pages.partExchange.form.mileagePlaceholder')} required />
          </label>
          <label>
            {t('pages.partExchange.form.notesLabel')}
            <textarea name="notes" placeholder={t('pages.partExchange.form.notesPlaceholder')} required />
          </label>
          {submitted && <p className={styles.formStatus}>{t('pages.partExchange.form.success')}</p>}
          {error && <p className={styles.formError}>{error}</p>}
          <button type="submit">{t('pages.partExchange.form.submit')}</button>
          <FormPrivacyNote />
        </form>
      </section>
    </>
  );
}
