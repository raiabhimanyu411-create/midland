import { useTranslation } from 'react-i18next';
import { PageHero } from '../components/PageHero.jsx';
import styles from './PrivacyPage.module.css';

export function PrivacyPage() {
  const { t } = useTranslation();
  const sections = t('pages.privacy.sections', { returnObjects: true });

  return (
    <>
      <PageHero
        eyebrow={t('pages.privacy.hero.eyebrow')}
        title={t('pages.privacy.hero.title')}
        copy={t('pages.privacy.hero.copy')}
        image="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1800&q=85"
      />
      <section className={styles.policyPage}>
        {sections.map((section) => (
          <article key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.copy}</p>
          </article>
        ))}
      </section>
    </>
  );
}
