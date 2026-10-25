import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StatusPage } from '../components/StatusPage.jsx';
import { trackLead } from '../utils/analytics.js';

const knownForms = new Set(['enquiry', 'part-exchange', 'stock-alert']);

export function ThankYouPage() {
  const { t } = useTranslation();
  const requested = new URLSearchParams(window.location.search).get('form');
  const form = knownForms.has(requested) ? requested : 'enquiry';

  // Conversion event for GA4 / Google Ads / Meta (only fires if the visitor allowed those cookies).
  useEffect(() => {
    trackLead(form);
  }, [form]);

  return (
    <StatusPage
      eyebrow={t('thankYou.eyebrow')}
      title={t(`thankYou.${form}.heading`)}
      copy={t(`thankYou.${form}.copy`)}
      actions={[
        { label: t('thankYou.browse'), href: '/trucks', primary: true },
        { label: t('thankYou.home'), href: '/' }
      ]}
    />
  );
}
