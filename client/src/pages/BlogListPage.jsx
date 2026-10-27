import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '../components/Breadcrumb.jsx';
import { BlogHero } from '../components/BlogHero.jsx';
import { readingMinutes } from '../../../shared/blogContent.js';
import { api } from '../utils/api.js';
import styles from './BlogListPage.module.css';

const formatDate = (value) => new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const postHref = (post) => `/blog/${encodeURIComponent(post.slug)}`;

function PostMeta({ post }) {
  const { t } = useTranslation();
  return (
    <p className={styles.meta}>
      {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
      <span aria-hidden="true">·</span>
      <span>{t('pages.blog.readTime', { count: readingMinutes(post.content) })}</span>
    </p>
  );
}

function FeaturedPost({ post }) {
  const { t } = useTranslation();
  return (
    <article className={styles.featured}>
      <a className={styles.featuredVisual} href={postHref(post)} tabIndex={-1} aria-hidden="true">
        {post.coverImage
          ? <img src={post.coverImage} alt="" loading="lazy" decoding="async" />
          : (
            <span className={styles.visualFallback}>
              <span className={styles.visualLabel}>{t('pages.blog.featured')}</span>
              <strong>{post.tags?.[0] || t('pages.blog.guide')}</strong>
            </span>
          )}
      </a>
      <div className={styles.featuredBody}>
        <p className={styles.kicker}>{t('pages.blog.featured')}{post.tags?.[0] ? ` · ${post.tags[0]}` : ''}</p>
        <h2><a href={postHref(post)}>{post.title}</a></h2>
        {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}
        <PostMeta post={post} />
        <a className="button primary" href={postHref(post)}>{t('pages.blog.readMore')}</a>
      </div>
    </article>
  );
}

function PostCard({ post, index }) {
  const { t } = useTranslation();
  return (
    <article className={styles.card} style={{ '--card-delay': `${Math.min(index, 6) * 60}ms` }}>
      {post.coverImage && <img src={post.coverImage} alt="" loading="lazy" decoding="async" width="640" height="360" />}
      <div className={styles.cardBody}>
        <p className={styles.kicker}>{post.tags?.[0] || t('pages.blog.guide')}</p>
        <h3><a className={styles.cardLink} href={postHref(post)}>{post.title}</a></h3>
        {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}
        <div className={styles.cardFooter}>
          <PostMeta post={post} />
          <span className={styles.arrow} aria-hidden="true">→</span>
        </div>
      </div>
    </article>
  );
}

export function BlogListPage() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [topic, setTopic] = useState('');

  useEffect(() => {
    let active = true;
    api.listBlogs({ limit: 50 })
      .then((response) => { if (active) setPosts(response.data || []); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // Keep an empty blog out of search results until the first post is published.
  useEffect(() => {
    if (loading || error) return;
    document.head.querySelector('meta[name="robots"]')?.setAttribute('content', posts.length ? 'index, follow, max-image-preview:large' : 'noindex, follow');
  }, [loading, error, posts.length]);

  const topics = useMemo(() => {
    const counts = new Map();
    posts.forEach((post) => post.tags?.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1)));
    return [...counts.entries()].filter(([, count]) => count > 1).map(([tag]) => tag).slice(0, 6);
  }, [posts]);

  const filtered = topic ? posts.filter((post) => post.tags?.includes(topic)) : posts;
  const [featured, ...rest] = filtered;

  return (
    <>
      <Breadcrumb items={[{ label: t('nav.home'), href: '/' }, { label: t('nav.blog') }]} />
      <BlogHero
        eyebrow={t('pages.blog.eyebrow')}
        title={t('pages.blog.title')}
        copy={t('pages.blog.copy')}
        meta={[
          posts.length > 0 && t('pages.blog.statGuides', { count: posts.length }),
          t('pages.blog.statUk'),
          t('pages.blog.statFree')
        ]}
      />

      <section className={styles.page} aria-busy={loading}>
        {loading && (
          <div className={styles.skeletonGrid} aria-hidden="true">
            {[0, 1, 2].map((item) => <span key={item} className={styles.skeleton} />)}
          </div>
        )}
        {!loading && error && <p className={styles.notice}>{error}</p>}
        {!loading && !error && posts.length === 0 && <p className={styles.notice}>{t('pages.blog.empty')}</p>}

        {!loading && topics.length > 0 && (
          <div className={styles.topics} role="group" aria-label={t('pages.blog.filterLabel')}>
            <button type="button" aria-pressed={!topic} onClick={() => setTopic('')}>{t('pages.blog.allTopics')}</button>
            {topics.map((tag) => (
              <button type="button" key={tag} aria-pressed={topic === tag} onClick={() => setTopic(tag)}>{tag}</button>
            ))}
          </div>
        )}

        {featured && <FeaturedPost post={featured} />}

        {rest.length > 0 && (
          <>
            <h2 className={styles.sectionTitle}>{t('pages.blog.moreGuides')}</h2>
            <div className={styles.grid}>
              {rest.map((post, index) => <PostCard key={post.id} post={post} index={index} />)}
            </div>
          </>
        )}
      </section>

      <section className={styles.cta}>
        <div>
          <h2>{t('pages.blog.ctaHeading')}</h2>
          <p>{t('pages.blog.ctaCopy')}</p>
        </div>
        <div className={styles.ctaActions}>
          <a className="button primary" href="/trucks">{t('pages.blog.ctaPrimary')}</a>
          <a className={`button ${styles.ctaSecondary}`} href="/#stock-alert">{t('pages.blog.ctaSecondary')}</a>
        </div>
      </section>
    </>
  );
}
