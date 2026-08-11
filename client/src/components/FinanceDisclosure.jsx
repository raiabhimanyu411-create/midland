import { useTranslation } from 'react-i18next';
import styles from './FinanceDisclosure.module.css';

export function FinanceDisclosure() {
  const { t } = useTranslation();

  return (
    <p className={styles.disclosure}>
      <strong>{t('financeDisclosure.label')}</strong> {t('financeDisclosure.body')}
    </p>
  );
}
