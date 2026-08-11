import { useTranslation } from 'react-i18next';
import { useInView } from '../utils/useInView.js';
import styles from './Timeline.module.css';

export function Timeline() {
  const { t } = useTranslation();
  const companyMilestones = t('content.companyMilestones', { returnObjects: true });

  return (
    <section className={styles.timelineSection} aria-label={t('timeline.ariaLabel')}>
      <div className={styles.heading}>
        <p className="eyebrow">{t('timeline.eyebrow')}</p>
        <h2>{t('timeline.heading')}</h2>
      </div>
      <ol className={styles.timeline}>
        {companyMilestones.map((milestone, index) => (
          <MilestoneItem milestone={milestone} index={index} key={milestone.year} />
        ))}
      </ol>
    </section>
  );
}

function MilestoneItem({ milestone, index }) {
  const [ref, inView] = useInView();

  return (
    <li
      ref={ref}
      className={`${styles.item} ${styles.reveal} ${inView ? styles.inView : ''}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <span className={styles.year}>{milestone.year}</span>
      <div className={styles.content}>
        <strong>{milestone.title}</strong>
        <p>{milestone.copy}</p>
      </div>
    </li>
  );
}
