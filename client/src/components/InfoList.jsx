import styles from './InfoList.module.css';

export function InfoList({ items }) {
  return (
    <div className={styles.valuesPanel}>
      {items.map(([title, copy]) => (
        <InfoCard title={title} copy={copy} key={title} />
      ))}
    </div>
  );
}

export function InfoCard({ title, copy }) {
  return (
    <div>
      <strong>{title}</strong>
      <span>{copy}</span>
    </div>
  );
}

export function Spec({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
