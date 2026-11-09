import { mapBlog, pool } from '../db/mysql.js';
import { absoluteUrl, blogPath, businessLocations, SITE_EMAIL, SITE_NAME, staticPages } from '../../../shared/seo.js';
import { locationPages, locationPath } from '../../../shared/locations.js';

const SITE_URL = (process.env.CANONICAL_SITE_URL || 'https://www.midlandcommercials.com').replace(/\/+$/, '');

// /llms.txt: a plain Markdown summary of the site for AI assistants and AI search
// (format from llmstxt.org). Built from the same data as the sitemap, so it stays current.
export async function llmsTxt(_req, res, next) {
  try {
    const [rows] = await pool.query("SELECT * FROM blogs WHERE status = 'published' ORDER BY published_at DESC LIMIT 100");
    const posts = rows.map(mapBlog);
    const location = businessLocations[0] || {};
    const link = (label, path, note) => `- [${label}](${absoluteUrl(SITE_URL, path)})${note ? `: ${note}` : ''}`;
    const page = (name, label) => link(label, staticPages[name].path, staticPages[name].description);

    const lines = [
      `# ${SITE_NAME}`,
      '',
      `> ${SITE_NAME} is an independent used truck and trailer dealer in Swadlincote, Derbyshire, UK. It sells checked used tractor units, rigids, tippers and trailers to hauliers, builders, owner-drivers and fleet operators, and takes trucks, vans and trailers in part exchange.`,
      '',
      `- Yard: ${location.address || ''}, near junction 11 of the M42 and the A42`,
      `- Phone: ${location.phone || ''}`,
      `- Email: ${SITE_EMAIL}`,
      '- Opening hours: Monday to Sunday, 8:00am to 6:00pm',
      '- Every listing shows year, mileage, gearbox, cab, VAT status, MOT and Euro rating.',
      '',
      '## Main pages',
      page('trucks', 'Used trucks for sale'),
      page('partExchange', 'Part exchange'),
      page('faq', 'Buying FAQs'),
      page('about', 'About us'),
      page('contact', 'Contact'),
      '',
      '## Areas served',
      ...locationPages.map((item) => link(item.heading, locationPath(item), item.description)),
      ''
    ];

    if (posts.length) {
      lines.push('## Buying guides', ...posts.map((post) => link(post.title, blogPath(post), post.excerpt || '')), '');
    }

    lines.push('## Optional', link('Privacy policy', staticPages.privacy.path), link('Sitemap', '/sitemap.xml'), '');
    res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send(lines.join('\n'));
  } catch (error) {
    next(error);
  }
}
