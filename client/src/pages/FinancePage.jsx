import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ContactPreview } from '../components/ContactPreview.jsx';
import { InfoList } from '../components/InfoList.jsx';
import { PageHero } from '../components/PageHero.jsx';
import { api } from '../utils/api.js';
import styles from './FinancePage.module.css';

export function FinancePage() {
  const { t } = useTranslation();
  const items = t('pages.finance.items', { returnObjects: true });

  return (
    <>
      <PageHero
        eyebrow={t('pages.finance.hero.eyebrow')}
        title={t('pages.finance.hero.title')}
        copy={t('pages.finance.hero.copy')}
        image="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1800&q=85"
      />
      <section className={styles.splitPage}>
        <div className={styles.copyBlock}>
          <p className="eyebrow">{t('pages.finance.how.eyebrow')}</p>
          <h2>{t('pages.finance.how.heading')}</h2>
          <p>{t('pages.finance.how.p1')}</p>
          <p>{t('pages.finance.how.p2')}</p>
        </div>
        <InfoList items={items.map((item) => [item.title, item.copy])} />
      </section>
      <FinanceCalculator />
      <ContactPreview />
    </>
  );
}

function FinanceCalculator() {
  const { t, i18n } = useTranslation();
  const termOptions = t('pages.finance.calculator.termOptions', { returnObjects: true });
  const [price, setPrice] = useState(54950);
  const [deposit, setDeposit] = useState(10000);
  const [term, setTerm] = useState(48);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const safePrice = Math.max(price || 0, 0);
  const safeDeposit = Math.min(Math.max(deposit || 0, 0), safePrice);
  const balance = Math.max(safePrice - safeDeposit, 0);
  const monthly = Math.round((balance * 1.09) / term);

  async function requestQuote(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    setSubmitted(false);
    setError('');
    setSubmitting(true);

    try {
      await api.createFinanceQuote({
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        vehiclePrice: safePrice,
        deposit: safeDeposit,
        term
      });
      formElement.reset();
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={styles.calculatorPanel} aria-label={t('pages.finance.calculator.ariaLabel')}>
      <div>
        <p className="eyebrow">{t('pages.finance.calculator.eyebrow')}</p>
        <h2>{t('pages.finance.calculator.heading')}</h2>
        <p>{t('pages.finance.calculator.copy')}</p>
      </div>
      <div className={styles.calculatorControls}>
        <label>
          {t('pages.finance.calculator.priceLabel')}
          <input type="number" value={price} min="0" onChange={(event) => setPrice(Math.max(Number(event.target.value) || 0, 0))} />
        </label>
        <label>
          {t('pages.finance.calculator.depositLabel')}
          <input type="number" value={deposit} min="0" max={price} onChange={(event) => setDeposit(Math.max(Number(event.target.value) || 0, 0))} />
        </label>
        <label>
          {t('pages.finance.calculator.termLabel')}
          <select value={term} onChange={(event) => setTerm(Number(event.target.value))}>
            <option value="36">{termOptions[0]}</option>
            <option value="48">{termOptions[1]}</option>
            <option value="60">{termOptions[2]}</option>
          </select>
        </label>
      </div>
      <div className={styles.calculatorResult}>
        <span>{t('pages.finance.calculator.resultLabel')}</span>
        <strong>GBP {monthly.toLocaleString(i18n.language)}</strong>
        <small>{t('pages.finance.calculator.resultNote')}</small>
      </div>
      <form className={styles.quoteForm} onSubmit={requestQuote}>
        <label>
          {t('pages.finance.quote.nameLabel', { defaultValue: 'Name' })}
          <input name="name" type="text" required />
        </label>
        <label>
          {t('pages.finance.quote.phoneLabel', { defaultValue: 'Phone' })}
          <input name="phone" type="tel" required />
        </label>
        <label>
          {t('pages.finance.quote.emailLabel', { defaultValue: 'Email' })}
          <input name="email" type="email" />
        </label>
        <button type="submit" disabled={submitting || safePrice <= 0}>
          {t('pages.finance.quote.submit', { defaultValue: 'Request this quote' })}
        </button>
        {submitted && <p className={styles.formStatus}>{t('pages.finance.quote.success', { defaultValue: 'Thanks — our finance team will contact you about this quote.' })}</p>}
        {error && <p className={styles.formError}>{error}</p>}
      </form>
    </section>
  );
}
