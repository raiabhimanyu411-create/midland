import { breadcrumbJsonLd, serializeJsonLd } from '../../../shared/seo.js';
import { siteUrl } from '../utils/seo.js';
import styles from './Breadcrumb.module.css';

export function Breadcrumb({ items }) {
  const structuredData = breadcrumbJsonLd(items, siteUrl());

  return (
    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label}>
              {isLast || !item.href ? (
                <span aria-current={isLast ? 'page' : undefined}>{item.label}</span>
              ) : (
                <a href={item.href}>{item.label}</a>
              )}
              {!isLast && (
                <span className={styles.separator} aria-hidden="true">/</span>
              )}
            </li>
          );
        })}
      </ol>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
    </nav>
  );
}
