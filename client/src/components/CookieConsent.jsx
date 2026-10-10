import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { readStorage, writeStorage } from '../utils/storage.js';
import styles from './CookieConsent.module.css';

const STORAGE_KEY = 'midland-cookie-consent';

export function CookieConsent() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!readStorage(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function decide(value) {
    writeStorage(STORAGE_KEY, value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className={styles.banner} role="dialog" aria-live="polite" aria-label={t('cookie.ariaLabel')}>
      <p>
        <Trans i18nKey="cookie.message">
          We use cookies to run this site and understand how it is used. Read our{' '}
          <a href="/privacy" className="text-link">Privacy Policy</a> for details.
        </Trans>
      </p>
      <div className={styles.actions}>
        <button type="button" className="button outline" onClick={() => decide('necessary-only')}>
          {t('cookie.necessaryOnly')}
        </button>
        <button type="button" className="button primary" onClick={() => decide('accepted')}>
          {t('cookie.acceptAll')}
        </button>
      </div>
    </div>
  );
}
