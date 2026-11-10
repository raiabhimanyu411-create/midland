import { responsiveImage } from '../utils/images.js';
import styles from './PageHero.module.css';

export function PageHero({ eyebrow, title, copy, image }) {
  return (
    <section className={styles.pageHero}>
      <div className={styles.pageHeroMedia} aria-hidden="true">
        {image && <img {...responsiveImage(image)} alt="" width="1440" height="960" fetchPriority="high" decoding="async" />}
      </div>
      <div className={styles.pageHeroContent}>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
    </section>
  );
}
