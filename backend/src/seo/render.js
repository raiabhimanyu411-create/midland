import { readFileSync } from 'node:fs';
import path from 'node:path';
import { clientDistDir, projectRoot } from '../config/paths.js';
import { mapBlog, mapTruck, pool } from '../db/mysql.js';
import { positiveInt } from '../utils/validation.js';
import { truckDisplayPrice } from '../../../shared/truck.js';
import {
  absoluteUrl,
  adminPage,
  blogJsonLd,
  blogPath,
  blogSeo,
  DEFAULT_IMAGE,
  notFoundPage,
  thankYouPage,
  organizationJsonLd,
  pageForPath,
  serializeJsonLd,
  SITE_NAME,
  staticPages,
  truckJsonLd,
  truckPath,
  truckSeo,
  businessLocations,
  SITE_EMAIL,
  truckListJsonLd
} from '../../../shared/seo.js';

const SEO_BLOCK = /<!-- seo:start[\s\S]*?<!-- seo:end -->/;
const BODY_MARKER = '<!-- seo:body -->';

let template = null;
let siteCopy = null;

// English page copy, so crawlers get the real page text (not just links) before JavaScript runs.
function getCopy() {
  if (siteCopy) return siteCopy;
  try {
    siteCopy = JSON.parse(readFileSync(path.join(projectRoot, 'client', 'src', 'i18n', 'locales', 'en.json'), 'utf8'));
  } catch {
    siteCopy = {};
  }
  return siteCopy;
}

const stripTags = (text) => String(text || '').replace(/<\/?\d+>/g, '');
const paragraphs = (...texts) => texts.filter(Boolean).map((text) => `<p>${escapeHtml(stripTags(text))}</p>`).join('');

function staticPageBody(pageName) {
  const pages = getCopy().pages || {};
  const content = getCopy().content || {};
  const location = businessLocations[0] || {};
  switch (pageName) {
    case 'home':
      return { heading: pages.home?.hero?.title, bodyHtml: paragraphs(pages.home?.hero?.copy, pages.home?.intro?.heading, pages.home?.intro?.copy) };
    case 'trucks':
      return { heading: pages.trucks?.hero?.title, bodyHtml: paragraphs(pages.trucks?.hero?.copy) };
    case 'about':
      return { heading: pages.about?.hero?.title, bodyHtml: paragraphs(pages.about?.hero?.copy, pages.about?.approach?.p1, pages.about?.approach?.p2) };
    case 'partExchange':
      return { heading: pages.partExchange?.hero?.title, bodyHtml: paragraphs(pages.partExchange?.hero?.copy, pages.partExchange?.details?.copy) };
    case 'contact':
      return {
        heading: pages.contact?.hero?.title,
        bodyHtml: paragraphs(pages.contact?.hero?.copy)
          + `<address>${escapeHtml(location.address || '')}<br>${escapeHtml(location.phone || '')}<br>${escapeHtml(SITE_EMAIL)}</address>`
          + paragraphs(pages.contact?.details?.hours)
      };
    case 'faq': {
      const faqs = Array.isArray(content.faqs) ? content.faqs : [];
      return {
        heading: pages.faq?.hero?.title,
        bodyHtml: paragraphs(pages.faq?.hero?.copy)
          + `<dl>${faqs.map((faq) => `<dt>${escapeHtml(faq.question)}</dt><dd>${escapeHtml(faq.answer)}</dd>`).join('')}</dl>`,
        jsonLd: faqs.length ? [{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((faq) => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } }))
        }] : []
      };
    }
    default:
      return {};
  }
}

function truckListHtml(trucks) {
  if (!trucks.length) return '';
  const items = trucks.map((truck) => {
    const facts = [truck.price ? truckDisplayPrice(truck) : '', truck.year, truck.mileage, truck.gearbox, truck.location].filter(Boolean).map(escapeHtml).join(' · ');
    return `<li><a href="${escapeHtml(truckPath(truck))}">${escapeHtml(truck.title)}</a>${facts ? ` – ${facts}` : ''}</li>`;
  });
  return `<ul>${items.join('')}</ul>`;
}

function getTemplate() {
  if (!template) template = readFileSync(path.join(clientDistDir, 'index.html'), 'utf8');
  return template;
}

const CANONICAL_SITE_URL = 'https://www.midlandcommercials.com';

export function getSiteUrl(req) {
  const configured = String(process.env.SITE_URL || '').trim().replace(/\/$/, '');
  const siteUrl = configured || `${req.protocol}://${req.get('host')}`;
  // Google treats www as canonical, so the bare domain must never appear in canonicals or the sitemap.
  return siteUrl.replace(/^https?:\/\/midlandcommercials\.com(?=$|[/:])/i, CANONICAL_SITE_URL);
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

  if (pathname === '/thank-you') {
    return { status: 200, meta: { ...thankYouPage, path: null, links: primaryLinks } };
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
      ['Price', truck.price ? truckDisplayPrice(truck) : ''], ['Year', truck.year], ['Mileage', truck.mileage], ['Gearbox', truck.gearbox],
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
  const body = staticPageBody(pageName);
  const meta = { ...page, links: primaryLinks, jsonLd: [...(body.jsonLd || [])] };
  if (body.heading) meta.heading = stripTags(body.heading);
  if (body.bodyHtml) meta.bodyHtml = body.bodyHtml;

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
    meta.bodyHtml = `${meta.bodyHtml || ''}${truckListHtml(shown)}`;
    if (pageName === 'trucks' && shown.length) meta.jsonLd.push(truckListJsonLd(shown, siteUrl));
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
