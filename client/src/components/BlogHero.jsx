import styles from './BlogHero.module.css';

export function BlogHero({ eyebrow, title, copy, meta, image, imageAlt, children }) {
  return (
    <section className={styles.hero}>
      <div className={`${styles.inner} ${image ? '' : styles.textOnly}`}>
        <div className={styles.text}>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          <h1>{title}</h1>
          {copy && <p className={styles.copy}>{copy}</p>}
          {meta?.length > 0 && (
            <ul className={styles.meta}>
              {meta.filter(Boolean).map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}
          {children}
        </div>
        {image && (
          <figure className={styles.media}>
            <img src={image} alt={imageAlt || ''} fetchPriority="high" decoding="async" />
          </figure>
        )}
      </div>
    </section>
  );
}
