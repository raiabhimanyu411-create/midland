import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { trucks } from '../data/siteData.js';
import styles from './SearchBand.module.css';

export function SearchBand({ value, onChange, onSubmit }) {
  const { t, i18n } = useTranslation();
  const isControlled = Boolean(value && onChange);
  const [internal, setInternal] = useState({ make: '', body: '', maxPrice: '' });
  const state = isControlled ? value : internal;

  function setField(field, fieldValue) {
    if (isControlled) {
      onChange(field, fieldValue);
    } else {
      setInternal((current) => ({ ...current, [field]: fieldValue }));
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (onSubmit) {
      onSubmit(state);
      return;
    }

    const params = new URLSearchParams();
    if (state.make) params.set('make', state.make);
    if (state.body) params.set('body', state.body);
    if (state.maxPrice) params.set('maxPrice', state.maxPrice);
    window.location.assign(`/trucks${params.toString() ? `?${params.toString()}` : ''}`);
  }

  return (
    <section className={styles.searchBand} aria-label={t('searchBand.ariaLabel')}>
      <form className={styles.searchPanel} onSubmit={handleSubmit}>
        <label>
          {t('searchBand.make')}
          <select value={state.make} onChange={(event) => setField('make', event.target.value)}>
            <option value="">{t('searchBand.anyMake')}</option>
            {[...new Set(trucks.map((truck) => truck.make))].map((truckMake) => (
              <option key={truckMake}>{truckMake}</option>
            ))}
          </select>
        </label>
        <label>
          {t('searchBand.bodyType')}
          <select value={state.body} onChange={(event) => setField('body', event.target.value)}>
            <option value="">{t('searchBand.anyType')}</option>
            {[...new Set(trucks.map((truck) => truck.type))].map((truckBody) => (
              <option key={truckBody}>{truckBody}</option>
            ))}
          </select>
        </label>
        <label>
          {t('searchBand.maxPrice')}
          <select value={state.maxPrice} onChange={(event) => setField('maxPrice', event.target.value)}>
            <option value="">{t('searchBand.noLimit')}</option>
            <option value="30000">{t('searchBand.priceUnder', { amount: Number(30000).toLocaleString(i18n.language) })}</option>
            <option value="50000">{t('searchBand.priceUnder', { amount: Number(50000).toLocaleString(i18n.language) })}</option>
            <option value="75000">{t('searchBand.priceUnder', { amount: Number(75000).toLocaleString(i18n.language) })}</option>
            <option value="100000">{t('searchBand.priceUnderPlus', { amount: Number(100000).toLocaleString(i18n.language) })}</option>
          </select>
        </label>
        <button type="submit">{t('searchBand.search')}</button>
      </form>
    </section>
  );
}
