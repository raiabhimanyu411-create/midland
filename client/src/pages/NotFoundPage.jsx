import { useTranslation } from 'react-i18next';
import { StatusPage } from '../components/StatusPage.jsx';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <StatusPage
      code="404"
      eyebrow={t('notFound.eyebrow')}
      title={t('notFound.heading')}
      copy={t('notFound.copy')}
      actions={[
        { label: t('notFound.cta'), href: '/trucks', primary: true },
        { label: t('notFound.home'), href: '/' },
        { label: t('notFound.contact'), href: '/contact' }
      ]}
    />
  );
}
