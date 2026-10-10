import { useTranslation } from 'react-i18next';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <section className="section">
      <p className="eyebrow">404</p>
      <h1>{t('notFound.heading', { defaultValue: 'Page not found' })}</h1>
      <p>{t('notFound.copy', { defaultValue: 'The page you were looking for has moved or no longer exists.' })}</p>
      <a className="button primary" href="/trucks">{t('notFound.cta', { defaultValue: 'Browse used trucks' })}</a>
    </section>
  );
}
