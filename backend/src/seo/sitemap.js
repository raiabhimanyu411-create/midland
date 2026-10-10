import { mapBlog, mapTruck, pool } from '../db/mysql.js';
import { absoluteUrl, blogPath, staticPages, truckPath } from '../../../shared/seo.js';
import { getSiteUrl } from './render.js';

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
    const siteUrl = getSiteUrl(req);
    const [[truckRows], [blogRows]] = await Promise.all([
      pool.query("SELECT * FROM trucks WHERE status != 'archived' ORDER BY id DESC"),
      pool.query("SELECT * FROM blogs WHERE status = 'published' ORDER BY published_at DESC")
    ]);

    const entries = [
      ...Object.values(staticPages).map((page) => ({
        loc: absoluteUrl(siteUrl, page.path),
        changefreq: page.changefreq,
        priority: page.priority
      })),
      ...truckRows.map(mapTruck).map((truck) => ({
        loc: absoluteUrl(siteUrl, truckPath(truck)),
        lastmod: toDate(truck.updatedAt),
        changefreq: 'weekly',
        priority: '0.8'
      })),
      ...blogRows.map(mapBlog).map((post) => ({
        loc: absoluteUrl(siteUrl, blogPath(post)),
        lastmod: toDate(post.updatedAt || post.publishedAt),
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

export function robotsTxt(req, res) {
  const siteUrl = getSiteUrl(req);
  res.type('text/plain').set('Cache-Control', 'public, max-age=86400').send(
    ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /api/', '', `Sitemap: ${absoluteUrl(siteUrl, '/sitemap.xml')}`, ''].join('\n')
  );
}
