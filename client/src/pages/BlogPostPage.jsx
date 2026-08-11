import { useEffect, useState } from 'react';
import { Breadcrumb } from '../components/Breadcrumb.jsx';
import { PageHero } from '../components/PageHero.jsx';
import { api } from '../utils/api.js';
import styles from './BlogPostPage.module.css';

const fallbackImage = 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1800&q=85';

export function BlogPostPage({ slug }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    api.getBlogBySlug(slug)
      .then((response) => {
        if (!active) return;
        setPost(response.data);
        document.title = `${response.data.metaTitle || response.data.title} | MidLand Trucks`;
        if (response.data.metaDescription || response.data.excerpt) {
          document.querySelector('meta[name="description"]')?.setAttribute('content', response.data.metaDescription || response.data.excerpt);
        }
      })
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [slug]);

  if (loading) return <section className="section"><p>Loading article…</p></section>;
  if (!post) return <section className="section"><h1>Article unavailable</h1><p>{error}</p><a className="button primary" href="/">Back to home</a></section>;

  return (
    <>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'News' }, { label: post.title }]} />
      <PageHero eyebrow="MidLand journal" title={post.title} copy={post.excerpt} image={post.coverImage || fallbackImage} />
      <article className={styles.article}>
        <div className={styles.meta}>
          {post.authorName && <span>By {post.authorName}</span>}
          {post.publishedAt && <time dateTime={post.publishedAt}>{new Date(post.publishedAt).toLocaleDateString('en-GB', { dateStyle: 'long' })}</time>}
        </div>
        <div className={styles.content}>{post.content}</div>
        {post.tags?.length > 0 && <div className={styles.tags}>{post.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
      </article>
    </>
  );
}
