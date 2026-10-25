import { Router } from 'express';
import express from 'express';
import { mapTruck, pool } from '../db/mysql.js';
import { cleanNumber, cleanText, positiveInt, queryText } from '../utils/validation.js';
import { lookupVehicleByRegistration, getVehicleLookupStatus } from '../utils/vehicleLookups.js';
import { allowRoles, audit, requireAuth } from '../middleware/auth.js';

export const trucksRouter = Router();

const truckStatuses = ['draft', 'available', 'reserved', 'sold', 'coming-soon', 'archived'];
const truckFields = [
  ['title', 'title'], ['make', 'make'], ['type', 'type'], ['location', 'location'], ['price', 'price'],
  ['priceValue', 'price_value'], ['mileage', 'mileage'], ['mileageValue', 'mileage_value'], ['year', 'year'],
  ['gearbox', 'gearbox'], ['registration', 'registration'], ['vin', 'vin'], ['vatStatus', 'vat_status'],
  ['axle', 'axle'], ['grossWeight', 'gross_weight'], ['payload', 'payload'], ['euroRating', 'euro_rating'],
  ['cleanAir', 'clean_air'], ['motExpiry', 'mot_expiry'], ['serviceHistory', 'service_history'],
  ['owners', 'owners'], ['warranty', 'warranty'], ['fuelType', 'fuel_type'], ['colour', 'colour'],
  ['tacho', 'tacho'], ['videoUrl', 'video_url'], ['slug', 'slug'], ['metaTitle', 'meta_title'],
  ['metaDescription', 'meta_description'], ['featured', 'featured'], ['sortOrder', 'sort_order'],
  ['soldAt', 'sold_at'], ['soldPrice', 'sold_price'], ['badge', 'badge'], ['cab', 'cab'], ['power', 'power'],
  ['mot', 'mot'], ['description', 'description'], ['image', 'image'], ['images', 'images'], ['status', 'status']
];

trucksRouter.get('/', async (req, res, next) => {
  try {
    const make = queryText(req.query.make);
    const body = queryText(req.query.body);
    const gearbox = queryText(req.query.gearbox);
    const sort = queryText(req.query.sort) || 'newest';
    const maxPrice = positiveInt(req.query.maxPrice);
    const year = positiveInt(req.query.year);
    const mileage = positiveInt(req.query.mileage);
    const where = ["status NOT IN ('archived','draft')"];
    const values = [];
    if (make) { where.push('make = ?'); values.push(make); }
    if (body) { where.push('type = ?'); values.push(body); }
    if (maxPrice) { where.push('price_value <= ?'); values.push(maxPrice); }
    if (year) { where.push('CAST(year AS UNSIGNED) >= ?'); values.push(year); }
    if (mileage) { where.push('mileage_value <= ?'); values.push(mileage); }
    if (gearbox) { where.push('gearbox = ?'); values.push(gearbox); }
    const orderBy = sort === 'home'
      ? 'featured DESC, sort_order ASC, CAST(year AS UNSIGNED) DESC, id DESC'
      : sort === 'price-low' ? 'price_value ASC'
        : sort === 'price-high' ? 'price_value DESC'
          : sort === 'mileage-low' ? 'mileage_value ASC'
            : sort === 'year-old' ? 'CAST(year AS UNSIGNED) ASC, id ASC'
              : 'CAST(year AS UNSIGNED) DESC, id DESC';
    const [rows] = await pool.query(`SELECT * FROM trucks WHERE ${where.join(' AND ')} ORDER BY ${orderBy}`, values);
    const data = rows.map(mapTruck);
    res.json({ count: data.length, data });
  } catch (error) { next(error); }
});

trucksRouter.get('/filters', async (_req, res, next) => {
  try {
    const visible = "status NOT IN ('archived','draft')";
    const [[makes], [bodies], [gearboxes]] = await Promise.all([
      pool.query(`SELECT DISTINCT make FROM trucks WHERE ${visible} ORDER BY make`),
      pool.query(`SELECT DISTINCT type FROM trucks WHERE ${visible} ORDER BY type`),
      pool.query(`SELECT DISTINCT gearbox FROM trucks WHERE ${visible} ORDER BY gearbox`)
    ]);
    res.json({ makes: makes.map((row) => row.make), bodies: bodies.map((row) => row.type), gearboxes: gearboxes.map((row) => row.gearbox) });
  } catch (error) { next(error); }
});

trucksRouter.get('/admin/all', requireAuth, async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM trucks ORDER BY updated_at DESC, id DESC');
    res.json({ count: rows.length, data: rows.map((row) => mapTruck(row, { includePrivate: true })) });
  } catch (error) { next(error); }
});

trucksRouter.get('/admin/export.csv', requireAuth, allowRoles('admin', 'manager'), async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM trucks ORDER BY id');
    const columns = truckFields.map(([key]) => key);
    const csv = [columns, ...rows.map((row) => {
      const truck = mapTruck(row, { includePrivate: true });
      return columns.map((column) => column === 'images' ? JSON.stringify(truck.images) : truck[column] ?? '');
    })].map((line) => line.map(csvCell).join(',')).join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="midland-trucks.csv"');
    res.send(`\uFEFF${csv}`);
  } catch (error) { next(error); }
});

trucksRouter.post('/admin/import.csv', requireAuth, allowRoles('admin', 'manager'), express.text({ type: ['text/csv', 'text/plain'], limit: '2mb' }), async (req, res, next) => {
  try {
    const rows = parseCsv(req.body);
    if (!rows.length) return res.status(400).json({ message: 'CSV is empty. Use Export CSV as the template.' });
    if (rows.length > 500) return res.status(413).json({ message: 'Import is limited to 500 trucks per file.' });
    let imported = 0;
    const failures = [];
    for (const [index, row] of rows.entries()) {
      const payload = normalizeTruckPayload(row);
      const validation = validateTruckPayload(payload);
      if (validation) { failures.push({ row: index + 2, message: validation }); continue; }
      if (payload.status === 'archived' && req.admin.role !== 'admin') { failures.push({ row: index + 2, message: 'Only admins can import archived trucks' }); continue; }
      try {
        payload.slug = await uniqueSlug(payload.slug || payload.title);
        if (payload.status === 'sold' && !payload.soldAt) payload.soldAt = new Date();
        await insertTruck(payload);
        imported += 1;
      } catch (error) { failures.push({ row: index + 2, message: error.code === 'ER_DUP_ENTRY' ? 'Duplicate truck data' : 'Could not save this row' }); }
    }
    await audit(req, 'import-trucks-csv', 'truck', '', { imported, failed: failures.length });
    res.json({ imported, failed: failures.length, failures: failures.slice(0, 100) });
  } catch (error) {
    if (error.message?.startsWith('CSV')) return res.status(400).json({ message: error.message });
    next(error);
  }
});

trucksRouter.get('/admin/vehicle-lookup-status', requireAuth, allowRoles('admin', 'manager'), (_req, res) => {
  res.json({ data: getVehicleLookupStatus() });
});

trucksRouter.post('/admin/lookup-registration', requireAuth, allowRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const registration = cleanText(req.body.registration, 40).replace(/[^a-z0-9]/gi, '').toUpperCase();
    if (!registration || registration.length > 10) return res.status(400).json({ message: 'Enter a valid UK registration number.' });
    const result = await lookupVehicleByRegistration(registration);
    res.json({ data: result });
  } catch (error) {
    res.status(error.status || 502).json({ message: error.publicMessage || 'Vehicle lookup failed. Please enter details manually.' });
  }
});

trucksRouter.post('/', requireAuth, allowRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const payload = normalizeTruckPayload(req.body);
    const payloadError = validateTruckPayload(payload);
    if (payloadError) return res.status(400).json({ message: payloadError });
    if (payload.status === 'archived' && req.admin.role !== 'admin') return res.status(403).json({ message: 'Only admins can archive trucks' });
    payload.slug = await uniqueSlug(payload.slug || payload.title);
    if (payload.status === 'sold' && !payload.soldAt) payload.soldAt = new Date();
    const result = await insertTruck(payload);
    const [rows] = await pool.query('SELECT * FROM trucks WHERE id = ?', [result.insertId]);
    await audit(req, 'create-truck', 'truck', result.insertId, { title: payload.title });
    res.status(201).json({ data: mapTruck(rows[0], { includePrivate: true }) });
  } catch (error) { next(error); }
});

trucksRouter.post('/:id/duplicate', requireAuth, allowRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const id = positiveInt(req.params.id);
    const [rows] = await pool.query('SELECT * FROM trucks WHERE id = ?', [id]);
    if (!rows[0]) return res.status(404).json({ message: 'Truck not found' });
    const original = mapTruck(rows[0], { includePrivate: true });
    const clone = normalizeTruckPayload({ ...original, status: 'draft', featured: false, sortOrder: 0, soldAt: '', soldPrice: '' });
    clone.slug = await uniqueSlug(`${original.slug || original.title}-copy`);
    const result = await insertTruck(clone);
    const [copyRows] = await pool.query('SELECT * FROM trucks WHERE id = ?', [result.insertId]);
    await audit(req, 'duplicate-truck', 'truck', result.insertId, { sourceId: id });
    res.status(201).json({ data: mapTruck(copyRows[0], { includePrivate: true }) });
  } catch (error) { next(error); }
});

trucksRouter.put('/:id', requireAuth, allowRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const payload = normalizeTruckPayload(req.body);
    const payloadError = validateTruckPayload(payload);
    if (payloadError) return res.status(400).json({ message: payloadError });
    const truckId = positiveInt(req.params.id);
    if (!truckId) return res.status(404).json({ message: 'Truck not found' });
    const [currentRows] = await pool.query('SELECT * FROM trucks WHERE id = ?', [truckId]);
    if (!currentRows[0]) return res.status(404).json({ message: 'Truck not found' });
    if (payload.status === 'archived' && req.admin.role !== 'admin' && currentRows[0].status !== 'archived') {
      return res.status(403).json({ message: 'Only admins can archive trucks' });
    }
    payload.slug = await uniqueSlug(payload.slug || payload.title, truckId);
    if (payload.status === 'sold' && !payload.soldAt) payload.soldAt = currentRows[0].sold_at || new Date();
    if (payload.status !== 'sold' && !payload.soldAt) payload.soldAt = null;
    const values = truckFields.map(([key, column]) => column === 'images' ? JSON.stringify(payload[key]) : payload[key]);
    const [result] = await pool.query(`UPDATE trucks SET ${truckFields.map(([, column]) => `${column} = ?`).join(', ')} WHERE id = ?`, [...values, truckId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Truck not found' });
    const [updated] = await pool.query('SELECT * FROM trucks WHERE id = ?', [truckId]);
    await audit(req, 'update-truck', 'truck', truckId, { title: payload.title, status: payload.status });
    res.json({ data: mapTruck(updated[0], { includePrivate: true }) });
  } catch (error) { next(error); }
});

trucksRouter.get('/:id', async (req, res, next) => {
  try {
    const id = positiveInt(String(req.params.id).match(/^\d+/)?.[0]);
    if (!id) return res.status(404).json({ message: 'Truck not found' });
    const [rows] = await pool.query("SELECT * FROM trucks WHERE id = ? AND status NOT IN ('archived','draft')", [id]);
    if (!rows[0]) return res.status(404).json({ message: 'Truck not found' });
    res.json({ data: mapTruck(rows[0]) });
  } catch (error) { next(error); }
});

trucksRouter.delete('/:id', requireAuth, allowRoles('admin'), async (req, res, next) => {
  try {
    const [result] = await pool.query('UPDATE trucks SET status = ? WHERE id = ?', ['archived', positiveInt(req.params.id)]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Truck not found' });
    await audit(req, 'archive-truck', 'truck', req.params.id);
    res.json({ message: 'Truck archived' });
  } catch (error) { next(error); }
});

async function insertTruck(payload) {
  const values = truckFields.map(([key, column]) => column === 'images' ? JSON.stringify(payload[key]) : payload[key]);
  const columns = truckFields.map(([, column]) => column);
  const [result] = await pool.query(`INSERT INTO trucks (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`, values);
  return result;
}

async function uniqueSlug(source, excludeId = 0) {
  const base = slugify(source).slice(0, 200) || 'truck';
  let candidate = base;
  let suffix = 2;
  while (true) {
    const [rows] = await pool.query('SELECT id FROM trucks WHERE slug = ? AND id != ? LIMIT 1', [candidate, excludeId]);
    if (!rows.length) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

// Accept "youtu.be/abc" or "http://…" as typed; anything that still is not a valid link is left out
// so the rest of the truck saves instead of failing.
function normalizeVideoUrl(value) {
  const text = cleanText(value, 500);
  if (!text) return '';
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text.replace(/^http:\/\//i, 'https://') : `https://${text}`;
  try {
    const url = new URL(withProtocol);
    return url.protocol === 'https:' && url.hostname.includes('.') ? url.toString() : '';
  } catch {
    return '';
  }
}

function normalizeTruckPayload(body = {}) {
  let providedImages = Array.isArray(body.images) ? body.images.map((image) => cleanText(image, 2000)).filter(Boolean) : [];
  if (typeof body.images === 'string') {
    try { providedImages = JSON.parse(body.images).map((image) => cleanText(image, 2000)).filter(Boolean); } catch { providedImages = []; }
  }
  const cover = cleanText(body.image, 2000);
  const images = [...new Set([cover, ...providedImages].filter(Boolean))];
  const status = cleanText(body.status).toLowerCase() || 'available';
  const soldAtValue = cleanText(body.soldAt, 40);
  const soldAt = soldAtValue ? new Date(soldAtValue) : null;
  const payload = {
    title: cleanText(body.title, 255), make: cleanText(body.make, 100), type: cleanText(body.type, 100),
    location: cleanText(body.location, 180), price: cleanText(body.price, 50),
    priceValue: Math.round(cleanNumber(body.priceValue, 0)), mileage: cleanText(body.mileage, 50),
    mileageValue: Math.round(cleanNumber(body.mileageValue, 0)), year: cleanText(body.year, 10),
    gearbox: cleanText(body.gearbox, 80), registration: cleanText(body.registration, 40), vin: cleanText(body.vin, 80),
    vatStatus: cleanText(body.vatStatus, 40), axle: cleanText(body.axle, 100), grossWeight: cleanText(body.grossWeight, 100),
    payload: cleanText(body.payload, 100), euroRating: cleanText(body.euroRating, 50), cleanAir: cleanText(body.cleanAir, 120),
    motExpiry: cleanText(body.motExpiry, 160), serviceHistory: cleanText(body.serviceHistory, 5000),
    owners: cleanText(body.owners, 100), warranty: cleanText(body.warranty, 160), fuelType: cleanText(body.fuelType, 80),
    colour: cleanText(body.colour, 80), tacho: cleanText(body.tacho, 160), videoUrl: normalizeVideoUrl(body.videoUrl),
    slug: slugify(cleanText(body.slug, 220)), metaTitle: cleanText(body.metaTitle, 70),
    metaDescription: cleanText(body.metaDescription, 160), featured: body.featured === true || body.featured === 1 || body.featured === '1' || body.featured === 'true',
    sortOrder: Math.max(0, Math.min(100000, Math.round(cleanNumber(body.sortOrder, 0)))),
    soldAt: soldAt && !Number.isNaN(soldAt.getTime()) ? soldAt : null,
    soldPrice: body.soldPrice === '' || body.soldPrice === null || body.soldPrice === undefined || !Number.isFinite(Number(body.soldPrice)) ? null : Math.round(cleanNumber(body.soldPrice, 0)),
    badge: cleanText(body.badge, 80), cab: cleanText(body.cab, 120), power: cleanText(body.power, 80), mot: cleanText(body.mot, 160),
    description: cleanText(body.description, 20000), image: images[0] || '', images, status
  };
  if (status !== 'sold') { payload.soldAt = null; payload.soldPrice = null; }
  return payload;
}

function validateTruckPayload(payload) {
  if (!truckStatuses.includes(payload.status)) return `Status must be one of: ${truckStatuses.join(', ')}`;
  if (payload.priceValue < 0 || payload.priceValue > 2_000_000_000) return 'Price number must be between 0 and 2,000,000,000';
  if (payload.mileageValue < 0 || payload.mileageValue > 2_000_000_000) return 'Mileage number must be between 0 and 2,000,000,000';
  if (payload.soldPrice !== null && (payload.soldPrice < 0 || payload.soldPrice > 2_000_000_000)) return 'Sold price must be between 0 and 2,000,000,000';
  if (!Number.isInteger(payload.sortOrder)) return 'Homepage order must be a whole number';
  if (payload.videoUrl) {
    try { if (new URL(payload.videoUrl).protocol !== 'https:') return 'Video link must use a valid HTTPS URL'; }
    catch { return 'Video link must use a valid HTTPS URL'; }
  }
  if (payload.images.length > 9) return 'A truck can have up to 9 photos';
  return null;
}

function slugify(value) { return String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function csvCell(value) { const text = String(value ?? ''); return `"${text.replace(/"/g, '""')}"`; }

function parseCsv(text) {
  if (typeof text !== 'string' || !text.trim()) return [];
  const lines = [];
  let row = []; let cell = ''; let quoted = false;
  const source = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (char === '"' && quoted && source[i + 1] === '"') { cell += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[i + 1] === '\n') i += 1;
      row.push(cell); if (row.some((value) => value.trim())) lines.push(row); row = []; cell = '';
    } else cell += char;
  }
  if (quoted) throw new Error('CSV has an unclosed quoted field.');
  row.push(cell); if (row.some((value) => value.trim())) lines.push(row);
  const headers = lines.shift()?.map((header) => header.trim());
  if (!headers?.length) return [];
  return lines.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])));
}
