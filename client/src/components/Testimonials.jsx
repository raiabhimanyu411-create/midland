import { useTranslation } from 'react-i18next';
import { testimonialRatings } from '../data/siteData.js';
import { IconStar } from './icons.jsx';
import { useInView } from '../utils/useInView.js';
import styles from './Testimonials.module.css';

export function Testimonials() {
  const { t } = useTranslation();
  const testimonials = t('content.testimonials', { returnObjects: true });

  return (
    <section className={styles.testimonialSection} aria-label={t('testimonials.ariaLabel')}>
      <div className={styles.sectionHeading}>
        <p className="eyebrow">{t('testimonials.eyebrow')}</p>
        <h2>{t('testimonials.heading')}</h2>
      </div>
      <div className={styles.grid}>
        {testimonials.map((testimonial, index) => (
          <TestimonialCard
            testimonial={{ ...testimonial, rating: testimonialRatings[index] }}
            index={index}
            key={testimonial.name}
          />
        ))}
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial, index }) {
  const { t } = useTranslation();
  const [ref, inView] = useInView();

  return (
    <figure
      ref={ref}
      className={`${styles.card} ${styles.reveal} ${inView ? styles.inView : ''}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className={styles.stars} aria-label={t('testimonials.starsAria', { rating: testimonial.rating })}>
        {Array.from({ length: testimonial.rating }).map((_, starIndex) => (
          <IconStar key={starIndex} />
        ))}
      </div>
      <blockquote>{testimonial.quote}</blockquote>
      <figcaption>
        <strong>{testimonial.name}</strong>
        <span>{testimonial.role}</span>
      </figcaption>
    </figure>
  );
}
