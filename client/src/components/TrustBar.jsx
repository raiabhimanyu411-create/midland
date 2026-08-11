import { useTranslation } from 'react-i18next';
import { IconCheckBadge, IconShield, IconStar } from './icons.jsx';
import styles from './TrustBar.module.css';

const icons = [IconStar, IconShield, IconCheckBadge];

export function TrustBar() {
  const { t } = useTranslation();
  const badges = t('trustBar.badges', { returnObjects: true });

  return (
    <section className={styles.trustBar} aria-label={t('trustBar.ariaLabel')}>
      {badges.map(({ title, copy }, index) => {
        const Icon = icons[index];
        return (
          <div className={styles.badge} key={title}>
            <span className={styles.iconWrap}>
              <Icon />
            </span>
            <div>
              <strong>{title}</strong>
              <span>{copy}</span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
