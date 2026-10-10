import { absoluteUrl, DEFAULT_IMAGE, serializeJsonLd } from '../../../shared/seo.js';

const DEFAULT_ROBOTS = 'index, follow, max-image-preview:large';

function upsertMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonical(url) {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!url) {
    link?.remove();
    return;
  }
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

function setJsonLd(items) {
  // Server-rendered JSON-LD is replaced so the head only ever describes the current page.
  document.head.querySelectorAll('script[type="application/ld+json"]').forEach((script) => script.remove());
  items.filter(Boolean).forEach((data) => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = serializeJsonLd(data);
    document.head.appendChild(script);
  });
}

export function siteUrl() {
  return window.location.origin;
}

/**
 * Updates title, description, robots, canonical, Open Graph, Twitter and JSON-LD for the current page.
 * `path` is the canonical path (no query string); pass null for pages that must not be indexed.
 */
export function setPageMeta({ title, description, path = null, image = DEFAULT_IMAGE, type = 'website', robots = DEFAULT_ROBOTS, jsonLd = [] }) {
  const canonical = path ? absoluteUrl(siteUrl(), path) : null;
  const imageUrl = absoluteUrl(siteUrl(), image || DEFAULT_IMAGE);

  document.title = title;
  upsertMeta('name', 'description', description);
  upsertMeta('name', 'robots', robots);
  setCanonical(canonical);
  upsertMeta('property', 'og:type', type);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:image', imageUrl);
  if (canonical) upsertMeta('property', 'og:url', canonical);
  else document.head.querySelector('meta[property="og:url"]')?.remove();
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', description);
  upsertMeta('name', 'twitter:image', imageUrl);
  setJsonLd(jsonLd);
}
