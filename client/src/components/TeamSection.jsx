import { useTranslation } from 'react-i18next';
import { teamMembers } from '../data/siteData.js';
import { useInView } from '../utils/useInView.js';
import styles from './TeamSection.module.css';

export function TeamSection() {
  const { t } = useTranslation();
  const teamContent = t('content.teamMembers', { returnObjects: true });

  return (
    <section className={styles.teamSection} aria-label={t('teamSection.ariaLabel')}>
      <div className={styles.heading}>
        <p className="eyebrow">{t('teamSection.eyebrow')}</p>
        <h2>{t('teamSection.heading')}</h2>
      </div>
      <div className={styles.grid}>
        {teamMembers.map((member, index) => (
          <TeamCard member={{ ...member, ...teamContent[index] }} index={index} key={member.key} />
        ))}
      </div>
    </section>
  );
}

function TeamCard({ member, index }) {
  const [ref, inView] = useInView();

  return (
    <div
      ref={ref}
      className={`${styles.card} ${styles.reveal} ${inView ? styles.inView : ''}`}
      style={{ transitionDelay: `${index * 90}ms` }}
    >
      <span className={styles.avatar} aria-hidden="true">{member.initials}</span>
      <strong>{member.name}</strong>
      <span className={styles.role}>{member.role}</span>
      <p>{member.bio}</p>
    </div>
  );
}
