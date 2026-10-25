import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '../components/Breadcrumb.jsx';
import { PageHero } from '../components/PageHero.jsx';
import { api } from '../utils/api.js';
import styles from './BlogListPage.module.css';

export function BlogListPage() {
  const { t, i18n } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.listBlogs({ limit: 50 })
      .then((response) => { if (active) setPosts(response.data || []); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <>
      <Breadcrumb items={[{ label: t('nav.home'), href: '/' }, { label: t('nav.blog') }]} />
      <PageHero
        eyebrow={t('pages.blog.eyebrow')}
        title={t('pages.blog.title')}
        copy={t('pages.blog.copy')}
        image="https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1800&q=85"
      />
      <section className="section">
        {loading && <p>{t('pages.blog.loading')}</p>}
        {!loading && error && <p>{error}</p>}
        {!loading && !error && posts.length === 0 && <p>{t('pages.blog.empty')}</p>}
        <div className={styles.grid}>
          {posts.map((post) => (
            <article className={styles.card} key={post.id}>
              {post.coverImage && <img src={post.coverImage} alt="" loading="lazy" decoding="async" width="640" height="360" />}
              <div>
                {post.publishedAt && (
                  <time dateTime={post.publishedAt}>{new Date(post.publishedAt).toLocaleDateString(i18n.language, { dateStyle: 'medium' })}</time>
                )}
                <h2><a href={`/blog/${encodeURIComponent(post.slug)}`}>{post.title}</a></h2>
                {post.excerpt && <p>{post.excerpt}</p>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
