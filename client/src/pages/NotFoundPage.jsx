import { useTranslation } from 'react-i18next';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <section className="section">
      <p className="eyebrow">404</p>
      <h1>{t('notFound.heading')}</h1>
      <p>{t('notFound.copy')}</p>
      <a className="button primary" href="/trucks">{t('notFound.cta')}</a>
    </section>
  );
}
