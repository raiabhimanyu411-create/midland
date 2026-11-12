import { mapBlog, mapTruck, pool, PUBLIC_TRUCKS_SQL } from '../db/mysql.js';
import { absoluteUrl, blogPath, SITE_CONTENT_UPDATED, staticPages, truckPath } from '../../../shared/seo.js';
import { locationPages, locationPath } from '../../../shared/locations.js';
import { categoryPages, categoryPath, categoryTrucks } from '../../../shared/categories.js';

// Canonical domain — hamesha www + https
const CANONICAL_SITE_URL = (process.env.CANONICAL_SITE_URL || 'https://www.midlandcommercials.com').replace(/\/+$/, '');

function escapeXml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function toDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : null;
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod && `    <lastmod>${lastmod}</lastmod>`,
    changefreq && `    <changefreq>${changefreq}</changefreq>`,
    priority && `    <priority>${priority}</priority>`,
    '  </url>'
  ].filter(Boolean).join('\n');
}

export async function sitemapXml(req, res, next) {
  try {
    const siteUrl = CANONICAL_SITE_URL;
    const [[truckRows], [blogRows]] = await Promise.all([
      pool.query(`SELECT * FROM trucks WHERE ${PUBLIC_TRUCKS_SQL} ORDER BY id DESC`),
      pool.query("SELECT * FROM blogs WHERE status = 'published' ORDER BY published_at DESC")
    ]);

    const trucks = truckRows.map(mapTruck);
    const posts = blogRows.map(mapBlog);
    const latest = (...dates) => dates.filter(Boolean).sort().pop() || null;
    const newestTruck = latest(...trucks.map((truck) => toDate(truck.updatedAt)));
    const newestPost = latest(...posts.map((post) => toDate(post.updatedAt || post.publishedAt)));
    // Listing pages change whenever their stock or posts do; the rest change with the site copy.
    const pageLastmod = {
      home: latest(SITE_CONTENT_UPDATED, newestTruck),
      trucks: latest(SITE_CONTENT_UPDATED, newestTruck),
      blog: latest(SITE_CONTENT_UPDATED, newestPost)
    };

    const entries = [
      ...Object.entries(staticPages).filter(([name]) => name !== 'blog' || blogRows.length > 0).map(([name, page]) => ({
        loc: absoluteUrl(siteUrl, page.path),
        lastmod: pageLastmod[name] || SITE_CONTENT_UPDATED,
        changefreq: page.changefreq,
        priority: page.priority
      })),
      ...categoryPages.map((page) => ({
        loc: absoluteUrl(siteUrl, categoryPath(page)),
        lastmod: latest(SITE_CONTENT_UPDATED, ...categoryTrucks(page, trucks).map((truck) => toDate(truck.updatedAt))),
        changefreq: 'daily',
        priority: '0.8'
      })),
      ...locationPages.map((location) => ({
        loc: absoluteUrl(siteUrl, locationPath(location)),
        lastmod: SITE_CONTENT_UPDATED,
        changefreq: 'monthly',
        priority: '0.7'
      })),
      // Sold trucks keep their page for a while but are not offered to Google as new URLs.
      ...trucks.filter((truck) => truck.status !== 'sold').map(truckEntry),
      ...posts.map((post) => ({
        loc: absoluteUrl(siteUrl, blogPath(post)),
        lastmod: toDate(post.updatedAt || post.publishedAt) || SITE_CONTENT_UPDATED,
        changefreq: 'monthly',
        priority: '0.6'
      }))
    ];

    res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map(urlEntry).join('\n')}\n</urlset>\n`
    );
  } catch (error) {
    next(error);
  }
}

function truckEntry(truck) {
  return {
    loc: absoluteUrl(CANONICAL_SITE_URL, truckPath(truck)),
    lastmod: toDate(truck.updatedAt) || SITE_CONTENT_UPDATED,
    changefreq: 'weekly',
    priority: '0.8'
  };
}

// Trucks only (unsold), submitted separately in Search Console so truck indexing can be tracked on its own.
export async function truckSitemapXml(_req, res, next) {
  try {
    const [rows] = await pool.query(`SELECT * FROM trucks WHERE ${PUBLIC_TRUCKS_SQL} AND status <> 'sold' ORDER BY updated_at DESC, id DESC`);
    res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.map(mapTruck).map(truckEntry).map(urlEntry).join('\n')}\n</urlset>\n`
    );
  } catch (error) {
    next(error);
  }
}

export function robotsTxt(req, res) {
  res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send(
    [
      'User-agent: *',
      'Allow: /',
      // Google renders pages with JavaScript, so it must be able to read the public data they load.
      // The API itself is kept out of search results with an X-Robots-Tag: noindex header (server.js).
      'Allow: /api/blogs',
      'Allow: /api/trucks',
      'Disallow: /api/blogs/admin',
      'Disallow: /api/trucks/admin',
      'Disallow: /admin',
      'Disallow: /api/',
      'Disallow: /thank-you',
      '',
      `Sitemap: ${absoluteUrl(CANONICAL_SITE_URL, '/sitemap.xml')}`,
      `Sitemap: ${absoluteUrl(CANONICAL_SITE_URL, '/sitemap-trucks.xml')}`, ''].join('\n')
  );
}
