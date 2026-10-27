import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '../components/Breadcrumb.jsx';
import { BlogHero } from '../components/BlogHero.jsx';
import { api } from '../utils/api.js';
import { blogJsonLd, blogSeo, notFoundPage } from '../../../shared/seo.js';
import { setPageMeta, siteUrl } from '../utils/seo.js';
import { parseBlogContent, parseInline, readingMinutes } from '../../../shared/blogContent.js';
import styles from './BlogPostPage.module.css';

function Inline({ text }) {
  return parseInline(text).map((part, index) => (part.href ? <a key={index} href={part.href}>{part.text}</a> : part.text));
}

function BlogBlock({ block }) {
  if (block.type === 'h2') return <h2>{block.text}</h2>;
  if (block.type === 'h3') return <h3>{block.text}</h3>;
  if (block.type === 'ul' || block.type === 'ol') {
    const List = block.type;
    return <List>{block.items.map((item, index) => <li key={index}><Inline text={item} /></li>)}</List>;
  }
  return <p><Inline text={block.text} /></p>;
}


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
      <BlogHero
        eyebrow={post.tags?.[0] || t('pages.blog.guide')}
        title={post.title}
        copy={post.excerpt}
        image={post.coverImage}
        meta={[
          post.publishedAt && new Date(post.publishedAt).toLocaleDateString('en-GB', { dateStyle: 'long' }),
          t('pages.blog.readTime', { count: readingMinutes(post.content) }),
          post.authorName && t('pages.blog.byline', { name: post.authorName })
        ]}
      />
      <article className={styles.article}>
        <div className={styles.content}>
          {parseBlogContent(post.content).map((block, index) => <BlogBlock key={index} block={block} />)}
        </div>
        {post.tags?.length > 0 && <div className={styles.tags}>{post.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
        <aside className={styles.endCta}>
          <div>
            <strong>{t('pages.blog.ctaHeading')}</strong>
            <p>{t('pages.blog.ctaCopy')}</p>
          </div>
          <div className={styles.endActions}>
            <a className="button primary" href="/trucks">{t('pages.blog.ctaPrimary')}</a>
            <a className="button outline" href="/blog">{t('pages.blog.backToGuides')}</a>
          </div>
        </aside>
      </article>
    </>
  );
}
