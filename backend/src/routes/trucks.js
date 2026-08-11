import { Router } from 'express';
import { mapTruck, pool } from '../db/mysql.js';
import { cleanNumber, cleanText, requireFields } from '../utils/validation.js';
import { allowRoles, audit, requireAuth } from '../middleware/auth.js';

export const trucksRouter = Router();

trucksRouter.get('/', async (req, res, next) => {
  try {
  const { make, body, maxPrice, year, mileage, gearbox, sort = 'newest' } = req.query;
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
      values.push(Number(maxPrice));
    }
    if (year) {
      where.push('CAST(year AS UNSIGNED) >= ?');
      values.push(Number(year));
    }
    if (mileage) {
      where.push('mileage_value <= ?');
      values.push(Number(mileage));
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

trucksRouter.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM trucks WHERE id = ? AND status != ?', [
      Number(req.params.id),
      'archived'
    ]);
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
        Number(req.params.id)
      ]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Truck not found' });
      return;
    }

    const [rows] = await pool.query('SELECT * FROM trucks WHERE id = ?', [Number(req.params.id)]);
    await audit(req,'update-truck','truck',req.params.id,{title:payload.title}); res.json({ data: mapTruck(rows[0]) });
  } catch (error) {
    next(error);
  }
});

trucksRouter.delete('/:id', requireAuth, allowRoles('admin'), async (req, res, next) => {
  try {
    const [result] = await pool.query('UPDATE trucks SET status = ? WHERE id = ?', ['archived', Number(req.params.id)]);

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
    title: cleanText(body.title),
    make: cleanText(body.make),
    type: cleanText(body.type),
    location: cleanText(body.location),
    price: cleanText(body.price),
    priceValue: cleanNumber(body.priceValue),
    mileage: cleanText(body.mileage),
    mileageValue: cleanNumber(body.mileageValue),
    year: cleanText(body.year),
    gearbox: cleanText(body.gearbox),
    badge: cleanText(body.badge),
    cab: cleanText(body.cab),
    power: cleanText(body.power),
    mot: cleanText(body.mot),
    description: cleanText(body.description),
    image: cleanText(body.image),
    status: cleanText(body.status) || 'available'
  };
}
