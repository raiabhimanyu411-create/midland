# MidLand Trucks

React/Vite frontend with a Node/Express API, MySQL storage, and an authenticated admin panel.

## Local setup

Requirements: Node.js 22.12+ and MySQL 8+.

```bash
npm ci
cp backend/.env.example backend/.env
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5001`
- Health: `http://localhost:5001/api/health`
- Database readiness: `http://localhost:5001/api/ready`
- Admin: `http://localhost:5173/admin`

The backend creates its tables and seeds the initial inventory on first start. It also creates the first admin only when `admin_users` is empty.

Sample truck data is seeded only outside production. Production starts with empty inventory unless `SEED_DEMO_DATA=true` is explicitly set.

## Verification

```bash
npm run check
```

This builds the production frontend, syntax-checks all backend JavaScript, and runs the dependency security audit.

## Production deployment

The simplest production topology is one container plus a managed MySQL database. Express serves both the built SPA and `/api`, so `VITE_API_URL` is not needed and CORS stays same-origin.

```bash
docker build -t midland-trucks .
docker run --rm -p 5001:5001 --env-file production.env midland-trucks
```

Required production variables:

```dotenv
NODE_ENV=production
PORT=5001
DB_HOST=mysql.example.internal
DB_PORT=3306
DB_USER=midland_app
DB_PASSWORD=use-a-strong-database-password
DB_NAME=midland
DB_SSL=true
JWT_SECRET=use-at-least-32-random-characters
ADMIN_EMAIL=real-admin@example.com
ADMIN_PASSWORD=use-a-unique-password-of-at-least-12-characters
SITE_URL=https://www.example.com
```

Set `DB_SSL=false` only if the database is on a trusted private network and does not support TLS. If the frontend is hosted separately, set `VITE_API_URL=https://api.example.com/api` at frontend build time and set `CLIENT_ORIGIN=https://www.example.com` on the API. Multiple origins are comma-separated.

Uploaded files use `backend/uploads` by default. Mount persistent storage there, or replace local uploads with object storage before using an ephemeral/serverless host.

## SEO

In production, Express renders each page's `<title>`, meta description, canonical URL, Open Graph tags, JSON-LD and a crawlable HTML fallback into `index.html` before sending it, and returns `404` for unknown pages, missing trucks and missing posts. `/sitemap.xml` (static pages, live trucks, published posts) and `/robots.txt` are generated from the database. Set `SITE_URL` to the public domain so canonical and sitemap URLs are correct behind a proxy, then submit `https://<domain>/sitemap.xml` in Google Search Console. Shared SEO copy lives in `shared/seo.js`.

Configure the platform health check to `/api/ready`. The application handles `SIGTERM` and closes its HTTP and MySQL connections cleanly.

## API summary

Public:

```text
GET  /api/health
GET  /api/ready
GET  /api/trucks
GET  /api/trucks/filters
GET  /api/trucks/:id
POST /api/enquiries
POST /api/finance-quotes
POST /api/part-exchange
POST /api/chat-leads
POST /api/auth/login
```

Inventory writes, lead lists, users, audit logs, uploads, and blog administration require an authenticated admin session. Role checks protect manager/admin-only actions.

## Before public launch

Replace and legally verify all company identity, VAT, FCA/finance, ratings, testimonial, address, phone, privacy, cookie, retention, and consent copy in `client/src/i18n/locales/*.json` and `client/src/data/siteData.js`. The current content includes demonstration values and is not a finished legal notice.

Also confirm the production domain (`SITE_URL`), connect password-reset email delivery, and use a persistent upload volume or object storage.
