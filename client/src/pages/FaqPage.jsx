import { useTranslation } from 'react-i18next';
import { PageHero } from '../components/PageHero.jsx';
import styles from './FaqPage.module.css';

export function FaqPage() {
  const { t } = useTranslation();
  const faqs = t('content.faqs', { returnObjects: true });

  return (
    <>
      <PageHero
        eyebrow={t('pages.faq.hero.eyebrow')}
        title={t('pages.faq.hero.title')}
        copy={t('pages.faq.hero.copy')}
        image="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1800&q=85"
      />
      <section className={styles.faqList}>
        {faqs.map(({ question, answer }) => (
          <details key={question}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </section>
    </>
  );
}
