import { readFileSync } from 'node:fs';
import path from 'node:path';
import { clientDistDir } from '../config/paths.js';
import { mapBlog, mapTruck, pool } from '../db/mysql.js';
import { positiveInt } from '../utils/validation.js';
import {
  absoluteUrl,
  adminPage,
  blogJsonLd,
  blogPath,
  blogSeo,
  DEFAULT_IMAGE,
  notFoundPage,
  organizationJsonLd,
  pageForPath,
  serializeJsonLd,
  SITE_NAME,
  staticPages,
  truckJsonLd,
  truckPath,
  truckSeo
} from '../../../shared/seo.js';

const SEO_BLOCK = /<!-- seo:start[\s\S]*?<!-- seo:end -->/;
const BODY_MARKER = '<!-- seo:body -->';

let template = null;

function getTemplate() {
  if (!template) template = readFileSync(path.join(clientDistDir, 'index.html'), 'utf8');
  return template;
}

export function getSiteUrl(req) {
  const configured = String(process.env.SITE_URL || '').trim().replace(/\/$/, '');
  return configured || `${req.protocol}://${req.get('host')}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderHead(meta, siteUrl) {
  const canonical = meta.path ? absoluteUrl(siteUrl, meta.path) : null;
  const image = absoluteUrl(siteUrl, meta.image || DEFAULT_IMAGE);
  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="robots" content="${escapeHtml(meta.robots || 'index, follow, max-image-preview:large')}" />`,
    canonical && `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:type" content="${escapeHtml(meta.type || 'website')}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    canonical && `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    '<meta property="og:locale" content="en_GB" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    ...(meta.jsonLd || []).map((data) => `<script type="application/ld+json">${serializeJsonLd(data)}</script>`)
  ];
  return tags.filter(Boolean).join('\n    ');
}

// Lightweight HTML for crawlers that do not run JavaScript. React replaces it on first render.
function renderBody(meta) {
  const links = (meta.links || [])
    .map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`)
    .join('');
  return [
    '<main class="seo-fallback">',
    `<h1>${escapeHtml(meta.heading || meta.title)}</h1>`,
    `<p>${escapeHtml(meta.description)}</p>`,
    meta.bodyHtml || '',
    links ? `<ul>${links}</ul>` : '',
    '</main>'
  ].join('');
}

const primaryLinks = [
  { label: 'Used Trucks For Sale', href: '/trucks' },
  { label: 'Part Exchange', href: '/part-exchange' },
  { label: 'Guides & News', href: '/blog' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' }
];

async function listVisibleTrucks() {
  const [rows] = await pool.query("SELECT * FROM trucks WHERE status NOT IN ('archived','draft') ORDER BY featured DESC, sort_order ASC, CAST(year AS UNSIGNED) DESC, id DESC");
  return rows.map(mapTruck);
}

async function resolvePage(pathname, siteUrl) {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return { status: 200, meta: { ...adminPage, path: null } };
  }

  const truckMatch = pathname.match(/^\/truck\/(\d+)(?:-[^/]+)?$/);
  if (truckMatch) {
    const id = positiveInt(truckMatch[1]);
    const [rows] = id
      ? await pool.query("SELECT * FROM trucks WHERE id = ? AND status NOT IN ('archived','draft')", [id])
      : [[]];
    if (!rows[0]) return notFound();
    const truck = mapTruck(rows[0]);
    const seo = truckSeo(truck);
    const specs = [
      ['Price', truck.price], ['Year', truck.year], ['Mileage', truck.mileage], ['Gearbox', truck.gearbox],
      ['Body', truck.type], ['Location', truck.location], ['Status', truck.status]
    ].filter(([, value]) => value);
    return {
      status: 200,
      meta: {
        ...seo,
        heading: truck.title,
        bodyHtml: `<dl>${specs.map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`).join('')}</dl>`
          + (truck.description ? `<p>${escapeHtml(truck.description)}</p>` : ''),
        links: [{ label: 'Enquire about this truck', href: `/contact?truck=${truck.id}` }, ...primaryLinks],
        jsonLd: [truckJsonLd(truck, siteUrl)]
      }
    };
  }

  const blogMatch = pathname.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    let slug = blogMatch[1];
    try { slug = decodeURIComponent(slug); } catch { return notFound(); }
    const [rows] = await pool.query("SELECT * FROM blogs WHERE slug = ? AND status = 'published'", [slug]);
    if (!rows[0]) return notFound();
    const post = mapBlog(rows[0]);
    return {
      status: 200,
      meta: {
        ...blogSeo(post),
        heading: post.title,
        bodyHtml: post.content
          .split(/\n\s*\n/)
          .filter((paragraph) => paragraph.trim())
          .map((paragraph) => `<p>${escapeHtml(paragraph.trim())}</p>`)
          .join(''),
        links: primaryLinks,
        jsonLd: [blogJsonLd(post, siteUrl)]
      }
    };
  }

  const pageName = pageForPath(pathname);
  if (!pageName) return notFound();
  const page = staticPages[pageName];
  const meta = { ...page, links: primaryLinks, jsonLd: [] };

  if (pageName === 'home') {
    meta.jsonLd.push(organizationJsonLd(siteUrl), {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: absoluteUrl(siteUrl, '/')
    });
  }

  if (pageName === 'trucks' || pageName === 'home') {
    const trucks = await listVisibleTrucks();
    const shown = pageName === 'home' ? trucks.slice(0, 6) : trucks;
    meta.links = [...shown.map((truck) => ({ label: `${truck.title} – ${truck.price}`, href: truckPath(truck) })), ...primaryLinks];
  }

  if (pageName === 'blog') {
    const [rows] = await pool.query("SELECT * FROM blogs WHERE status = 'published' ORDER BY published_at DESC LIMIT 50");
    meta.links = [...rows.map(mapBlog).map((post) => ({ label: post.title, href: blogPath(post) })), ...primaryLinks];
  }

  return { status: 200, meta };
}

function notFound() {
  return { status: 404, meta: { ...notFoundPage, path: null, links: primaryLinks } };
}

export async function renderPage(req, res, next) {
  try {
    const siteUrl = getSiteUrl(req);
    let page;
    try {
      page = await resolvePage(req.path, siteUrl);
    } catch (error) {
      // If the database is unavailable, still serve the app shell with the default tags.
      console.error('SEO page resolution failed', error);
      page = { status: 200, meta: { ...staticPages.home, path: pageForPath(req.path) ? req.path : null } };
    }

    if (page.meta.robots?.startsWith('noindex')) res.set('X-Robots-Tag', page.meta.robots);
    const html = getTemplate()
      .replace(SEO_BLOCK, renderHead(page.meta, siteUrl))
      .replace(BODY_MARKER, renderBody(page.meta));
    res.status(page.status).type('html').set('Cache-Control', 'no-cache').send(html);
  } catch (error) {
    next(error);
  }
}
