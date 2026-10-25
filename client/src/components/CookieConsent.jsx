import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { OPEN_COOKIE_SETTINGS, applyConsent, readConsent, saveConsent } from '../utils/analytics.js';
import styles from './CookieConsent.module.css';

export function CookieConsent() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [managing, setManaging] = useState(false);
  const [choice, setChoice] = useState({ analytics: false, marketing: false });

  useEffect(() => {
    const saved = readConsent();
    if (saved) applyConsent(saved);
    else setVisible(true);

    // The footer "Cookie settings" link reopens the panel so people can change their mind.
    const reopen = () => {
      setChoice(readConsent() || { analytics: false, marketing: false });
      setManaging(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS, reopen);
  }, []);

  function decide(next) {
    saveConsent(next);
    setVisible(false);
    setManaging(false);
  }

  if (!visible) return null;

  return (
    <div className={styles.banner} role="dialog" aria-live="polite" aria-label={t('cookie.ariaLabel')}>
      <p>
        <Trans i18nKey="cookie.message">
          We use cookies to run this site and understand how it is used. Read our <a href="/privacy" className="text-link">Privacy Policy</a> for details.
        </Trans>
      </p>
      {managing && (
        <fieldset className={styles.options}>
          <legend className={styles.visuallyHidden}>{t('cookie.manageHeading')}</legend>
          <label className={styles.option}>
            <input type="checkbox" checked disabled />
            <span><strong>{t('cookie.necessaryTitle')}</strong>{t('cookie.necessaryCopy')}</span>
          </label>
          <label className={styles.option}>
            <input type="checkbox" checked={choice.analytics} onChange={(event) => setChoice((c) => ({ ...c, analytics: event.target.checked }))} />
            <span><strong>{t('cookie.analyticsTitle')}</strong>{t('cookie.analyticsCopy')}</span>
          </label>
          <label className={styles.option}>
            <input type="checkbox" checked={choice.marketing} onChange={(event) => setChoice((c) => ({ ...c, marketing: event.target.checked }))} />
            <span><strong>{t('cookie.marketingTitle')}</strong>{t('cookie.marketingCopy')}</span>
          </label>
        </fieldset>
      )}
      <div className={styles.actions}>
        <button type="button" className="button outline" onClick={() => decide({ analytics: false, marketing: false })}>
          {t('cookie.rejectAll')}
        </button>
        {managing ? (
          <button type="button" className="button outline" onClick={() => decide(choice)}>
            {t('cookie.savePreferences')}
          </button>
        ) : (
          <button type="button" className="button outline" onClick={() => setManaging(true)}>
            {t('cookie.manage')}
          </button>
        )}
        <button type="button" className="button primary" onClick={() => decide({ analytics: true, marketing: true })}>
          {t('cookie.acceptAll')}
        </button>
      </div>
    </div>
  );
}
