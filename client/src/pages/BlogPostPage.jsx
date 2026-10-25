import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '../components/Breadcrumb.jsx';
import { PageHero } from '../components/PageHero.jsx';
import { api } from '../utils/api.js';
import { blogJsonLd, blogSeo, notFoundPage } from '../../../shared/seo.js';
import { setPageMeta, siteUrl } from '../utils/seo.js';
import styles from './BlogPostPage.module.css';

const fallbackImage = 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1800&q=85';

export function BlogPostPage({ slug }) {
  const { t } = useTranslation();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    api.getBlogBySlug(slug)
      .then((response) => {
        if (!active) return;
        setPost(response.data);
        setPageMeta({ ...blogSeo(response.data), jsonLd: [blogJsonLd(response.data, siteUrl())] });
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message);
        setPageMeta({ ...notFoundPage, path: null });
      })
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [slug]);

  if (loading) return <section className="section"><p>{t('pages.blog.loading')}</p></section>;
  if (!post) return <section className="section"><h1>{t('pages.blog.unavailable')}</h1><p>{error}</p><a className="button primary" href="/">{t('pages.blog.backHome')}</a></section>;

  return (
    <>
      <Breadcrumb items={[{ label: t('nav.home'), href: '/' }, { label: t('nav.blog'), href: '/blog' }, { label: post.title }]} />
      <PageHero eyebrow={t('pages.blog.eyebrow')} title={post.title} copy={post.excerpt} image={post.coverImage || fallbackImage} />
      <article className={styles.article}>
        <div className={styles.meta}>
          {post.authorName && <span>By {post.authorName}</span>}
          {post.publishedAt && <time dateTime={post.publishedAt}>{new Date(post.publishedAt).toLocaleDateString('en-GB', { dateStyle: 'long' })}</time>}
        </div>
        <div className={styles.content}>
          {post.content.split(/\n\s*\n/).filter((paragraph) => paragraph.trim()).map((paragraph, index) => (
            <p key={index}>{paragraph.trim()}</p>
          ))}
        </div>
        {post.tags?.length > 0 && <div className={styles.tags}>{post.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
      </article>
    </>
  );
}
