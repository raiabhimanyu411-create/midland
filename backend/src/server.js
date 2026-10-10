import 'dotenv/config';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { clientDistDir, uploadDir } from './config/paths.js';
import { isProduction, validateRuntimeConfig } from './config/runtime.js';
import { initializeDatabase, pool } from './db/mysql.js';
import { enquiriesRouter } from './routes/enquiries.js';
import { financeRouter } from './routes/finance.js';
import { partExchangeRouter } from './routes/partExchange.js';
import { trucksRouter } from './routes/trucks.js';
import { chatLeadsRouter } from './routes/chatLeads.js';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';
import { blogsRouter } from './routes/blogs.js';
import { renderPage } from './seo/render.js';
import { robotsTxt, sitemapXml } from './seo/sitemap.js';

const app = express();
const port = process.env.PORT || 5001;
const originSetting = process.env.CLIENT_ORIGIN ?? (isProduction ? '' : 'http://localhost:5173,http://localhost:5174');
const allowedOrigins = originSetting
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

validateRuntimeConfig();

app.disable('x-powered-by');
if (isProduction) app.set('trust proxy', Number(process.env.TRUST_PROXY || 1));
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

if (allowedOrigins.length) {
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  }));
}

app.use(express.json({ limit: '100kb' }));
// Express 5 leaves req.body undefined when no body was sent; routes expect an object.
app.use((req, _res, next) => {
  if (req.body === undefined || req.body === null || typeof req.body !== 'object') req.body = {};
  next();
});
app.use('/uploads', express.static(uploadDir, { maxAge: isProduction ? '1d' : 0 }));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false });
const submissionLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false });

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.post('/api/enquiries', submissionLimiter);
app.post('/api/finance-quotes', submissionLimiter);
app.post('/api/part-exchange', submissionLimiter);
app.post('/api/chat-leads', submissionLimiter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'midland-backend'
  });
});

app.get('/api/ready', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ready', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'not-ready', database: 'unavailable' });
  }
});

app.use('/api/trucks', trucksRouter);
app.use('/api/enquiries', enquiriesRouter);
app.use('/api/finance-quotes', financeRouter);
app.use('/api/part-exchange', partExchangeRouter);
app.use('/api/chat-leads', chatLeadsRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/blogs', blogsRouter);

app.use('/api/{*splat}', (_req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

app.get('/robots.txt', robotsTxt);
app.get('/sitemap.xml', sitemapXml);

if (isProduction) {
  if (!existsSync(path.join(clientDistDir, 'index.html'))) {
    throw new Error(`Production frontend build not found at ${clientDistDir}`);
  }

  // One URL per page: /trucks/ and /index.html permanently redirect to their canonical form.
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    const query = req.originalUrl.slice(req.path.length);
    if (req.path === '/index.html') return res.redirect(301, `/${query}`);
    if (req.path.length > 1 && req.path.endsWith('/')) {
      // Collapse leading slashes so "//evil.com/" can never become an off-site redirect.
      const target = `/${req.path.replace(/^\/+|\/+$/g, '')}`;
      return res.redirect(301, `${target}${query}`);
    }
    next();
  });
  app.use('/assets', express.static(path.join(clientDistDir, 'assets'), { maxAge: '1y', immutable: true }));
  app.use(express.static(clientDistDir, { maxAge: '1h', index: false }));
  app.get('/{*splat}', renderPage);
}

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.message?.startsWith('CORS blocked')) {
    return res.status(403).json({ message: 'Origin not allowed' });
  }
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'Image must be 8 MB or smaller' });
  }
  res.status(500).json({ message: 'Internal server error' });
});

const server = http.createServer(app);

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the existing backend or set PORT to another value.`);
    process.exit(1);
  }

  throw error;
});

initializeDatabase()
  .then(() => {
    server.listen(port, () => {
      console.log(`Backend running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Database initialization failed');
    console.error(error);
    process.exit(1);
  });

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, shutting down`);

  server.close(async () => {
    await pool.end();
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
