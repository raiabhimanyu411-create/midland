import { pageGuides } from '../../../shared/pageGuides.js';
import { parseInline } from '../../../shared/blogContent.js';
import styles from './PageGuide.module.css';

function Inline({ text }) {
  return parseInline(text).map((part, index) => (part.href ? <a key={index} href={part.href}>{part.text}</a> : part.text));
}

// Long-form guide copy below a page's main content. The server renders the same copy for
// crawlers (see backend/src/seo/render.js), so the two always match.
export function PageGuide({ page }) {
  const guide = pageGuides[page];
  if (!guide) return null;

  return (
    <section className={styles.guide} aria-labelledby={`guide-${page}`}>
      <div className={styles.inner}>
        <p className="eyebrow">{guide.eyebrow}</p>
        <h2 id={`guide-${page}`} className={styles.title}>{guide.heading}</h2>
        {guide.sections.map((part, index) => (
          <div className={styles.part} key={part.heading || index}>
            {part.heading && <h3>{part.heading}</h3>}
            {(part.paragraphs || []).map((text, i) => <p key={i}><Inline text={text} /></p>)}
            {part.list && (
              <ul>
                {part.list.map((text, i) => <li key={i}><Inline text={text} /></li>)}
              </ul>
            )}
          </div>
        ))}
        {guide.faqs?.length > 0 && (
          <div className={styles.faqs}>
            <h3>Common Questions</h3>
            {guide.faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
