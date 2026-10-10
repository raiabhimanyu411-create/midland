import { Router } from 'express';
import { mapTruck, pool } from '../db/mysql.js';
import { cleanNumber, cleanText, positiveInt, queryText, requireFields } from '../utils/validation.js';
import { allowRoles, audit, requireAuth } from '../middleware/auth.js';

export const trucksRouter = Router();

const truckStatuses = ['available', 'reserved', 'sold', 'archived'];

trucksRouter.get('/', async (req, res, next) => {
  try {
    const make = queryText(req.query.make);
    const body = queryText(req.query.body);
    const gearbox = queryText(req.query.gearbox);
    const sort = queryText(req.query.sort) || 'newest';
    const maxPrice = positiveInt(req.query.maxPrice);
    const year = positiveInt(req.query.year);
    const mileage = positiveInt(req.query.mileage);
    const where = ['status != ?'];
    const values = ['archived'];

    if (make) {
      where.push('make = ?');
      values.push(make);
    }
    if (body) {
      where.push('type = ?');
      values.push(body);
    }
    if (maxPrice) {
      where.push('price_value <= ?');
      values.push(maxPrice);
    }
    if (year) {
      where.push('CAST(year AS UNSIGNED) >= ?');
      values.push(year);
    }
    if (mileage) {
      where.push('mileage_value <= ?');
      values.push(mileage);
    }
    if (gearbox) {
      where.push('gearbox = ?');
      values.push(gearbox);
    }

    const orderBy =
      sort === 'price-low'
        ? 'price_value ASC'
        : sort === 'price-high'
          ? 'price_value DESC'
          : sort === 'mileage-low'
            ? 'mileage_value ASC'
            : sort === 'year-old'
              ? 'CAST(year AS UNSIGNED) ASC, id ASC'
              : 'CAST(year AS UNSIGNED) DESC, id DESC';

    const [rows] = await pool.query(
      `SELECT * FROM trucks WHERE ${where.join(' AND ')} ORDER BY ${orderBy}`,
      values
    );

    const results = rows.map(mapTruck);

  res.json({
    count: results.length,
    data: results
  });
  } catch (error) {
    next(error);
  }
});

trucksRouter.get('/filters', async (_req, res, next) => {
  try {
    const [makes] = await pool.query('SELECT DISTINCT make FROM trucks WHERE status != ? ORDER BY make', ['archived']);
    const [bodies] = await pool.query('SELECT DISTINCT type FROM trucks WHERE status != ? ORDER BY type', ['archived']);
    const [gearboxes] = await pool.query('SELECT DISTINCT gearbox FROM trucks WHERE status != ? ORDER BY gearbox', ['archived']);

    res.json({
      makes: makes.map((row) => row.make),
      bodies: bodies.map((row) => row.type),
      gearboxes: gearboxes.map((row) => row.gearbox)
    });
  } catch (error) {
    next(error);
  }
});

trucksRouter.get('/admin/all', requireAuth, async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM trucks ORDER BY updated_at DESC, id DESC');
    res.json({ count: rows.length, data: rows.map(mapTruck) });
  } catch (error) {
    next(error);
  }
});

trucksRouter.get('/:id', async (req, res, next) => {
  try {
    const id = positiveInt(req.params.id);
    if (!id) {
      res.status(404).json({ message: 'Truck not found' });
      return;
    }

    const [rows] = await pool.query('SELECT * FROM trucks WHERE id = ? AND status != ?', [id, 'archived']);
    const truck = rows[0] ? mapTruck(rows[0]) : null;

  if (!truck) {
    res.status(404).json({ message: 'Truck not found' });
    return;
  }

  res.json({ data: truck });
  } catch (error) {
    next(error);
  }
});

trucksRouter.post('/', requireAuth, allowRoles('admin','manager'), async (req, res, next) => {
  try {
    const validation = requireFields(req.body, ['title', 'make', 'type', 'location', 'price', 'mileage', 'year', 'gearbox']);
    if (!validation.valid) {
      res.status(400).json({ message: validation.message });
      return;
    }

    const payload = normalizeTruckPayload(req.body);
    const payloadError = validateTruckPayload(payload);
    if (payloadError) {
      res.status(400).json({ message: payloadError });
      return;
    }
    const [result] = await pool.query(
      `INSERT INTO trucks (
        title, make, type, location, price, price_value, mileage, mileage_value,
        year, gearbox, badge, cab, power, mot, description, image, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.title,
        payload.make,
        payload.type,
        payload.location,
        payload.price,
        payload.priceValue,
        payload.mileage,
        payload.mileageValue,
        payload.year,
        payload.gearbox,
        payload.badge,
        payload.cab,
        payload.power,
        payload.mot,
        payload.description,
        payload.image,
        payload.status
      ]
    );
    const [rows] = await pool.query('SELECT * FROM trucks WHERE id = ?', [result.insertId]);

    await audit(req,'create-truck','truck',result.insertId,{title:payload.title});
    res.status(201).json({ data: mapTruck(rows[0]) });
  } catch (error) {
    next(error);
  }
});

trucksRouter.put('/:id', requireAuth, allowRoles('admin','manager'), async (req, res, next) => {
  try {
    const validation = requireFields(req.body, ['title', 'make', 'type', 'location', 'price', 'mileage', 'year', 'gearbox']);
    if (!validation.valid) {
      res.status(400).json({ message: validation.message });
      return;
    }

    const payload = normalizeTruckPayload(req.body);
    const payloadError = validateTruckPayload(payload);
    if (payloadError) {
      res.status(400).json({ message: payloadError });
      return;
    }
    const [result] = await pool.query(
      `UPDATE trucks SET
        title = ?, make = ?, type = ?, location = ?, price = ?, price_value = ?,
        mileage = ?, mileage_value = ?, year = ?, gearbox = ?, badge = ?, cab = ?,
        power = ?, mot = ?, description = ?, image = ?, status = ?
      WHERE id = ?`,
      [
        payload.title,
        payload.make,
        payload.type,
        payload.location,
        payload.price,
        payload.priceValue,
        payload.mileage,
        payload.mileageValue,
        payload.year,
        payload.gearbox,
        payload.badge,
        payload.cab,
        payload.power,
        payload.mot,
        payload.description,
        payload.image,
        payload.status,
        positiveInt(req.params.id)
      ]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Truck not found' });
      return;
    }

    const [rows] = await pool.query('SELECT * FROM trucks WHERE id = ?', [positiveInt(req.params.id)]);
    await audit(req,'update-truck','truck',req.params.id,{title:payload.title}); res.json({ data: mapTruck(rows[0]) });
  } catch (error) {
    next(error);
  }
});

trucksRouter.delete('/:id', requireAuth, allowRoles('admin'), async (req, res, next) => {
  try {
    const [result] = await pool.query('UPDATE trucks SET status = ? WHERE id = ?', ['archived', positiveInt(req.params.id)]);

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Truck not found' });
      return;
    }

    await audit(req,'archive-truck','truck',req.params.id); res.json({ message: 'Truck archived' });
  } catch (error) {
    next(error);
  }
});

function normalizeTruckPayload(body) {
  return {
    title: cleanText(body.title, 255),
    make: cleanText(body.make, 100),
    type: cleanText(body.type, 100),
    location: cleanText(body.location, 180),
    price: cleanText(body.price, 50),
    priceValue: Math.round(cleanNumber(body.priceValue)),
    mileage: cleanText(body.mileage, 50),
    mileageValue: Math.round(cleanNumber(body.mileageValue)),
    year: cleanText(body.year, 10),
    gearbox: cleanText(body.gearbox, 80),
    badge: cleanText(body.badge, 80),
    cab: cleanText(body.cab, 120),
    power: cleanText(body.power, 80),
    mot: cleanText(body.mot, 160),
    description: cleanText(body.description, 20000),
    image: cleanText(body.image, 2000),
    status: cleanText(body.status).toLowerCase() || 'available'
  };
}

function validateTruckPayload(payload) {
  if (!truckStatuses.includes(payload.status)) return `Status must be one of: ${truckStatuses.join(', ')}`;
  if (payload.priceValue < 0 || payload.priceValue > 2_000_000_000) return 'Price number must be a positive amount';
  if (payload.mileageValue < 0 || payload.mileageValue > 2_000_000_000) return 'Mileage number must be a positive amount';
  return null;
}
