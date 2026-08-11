import { Router } from 'express';
import { pool } from '../db/mysql.js';
import { cleanText, createRecord, requireFields } from '../utils/validation.js';
import { requireAuth } from '../middleware/auth.js';

export const partExchangeRouter = Router();

partExchangeRouter.get('/', requireAuth, async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM part_exchange_requests ORDER BY created_at DESC');
    res.json({ data: rows.map(mapPartExchange) });
  } catch (error) {
    next(error);
  }
});

partExchangeRouter.post('/', async (req, res, next) => {
  try {
    const validation = requireFields(req.body, ['registration', 'mileage', 'notes']);
    if (!validation.valid) {
      res.status(400).json({ message: validation.message });
      return;
    }

    const record = createRecord('part_exchange', {
      name: cleanText(req.body.name),
      phone: cleanText(req.body.phone),
      email: cleanText(req.body.email),
      registration: cleanText(req.body.registration).toUpperCase(),
      mileage: cleanText(req.body.mileage),
      notes: cleanText(req.body.notes),
      targetTruckId: req.body.targetTruckId ? Number(req.body.targetTruckId) : null
    });

    const [result] = await pool.query(
      `INSERT INTO part_exchange_requests (
        name, phone, email, registration, mileage, notes, target_truck_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.name,
        record.phone,
        record.email,
        record.registration,
        record.mileage,
        record.notes,
        record.targetTruckId,
        record.status
      ]
    );
    const [rows] = await pool.query('SELECT * FROM part_exchange_requests WHERE id = ?', [result.insertId]);

    res.status(201).json({ data: mapPartExchange(rows[0]) });
  } catch (error) {
    next(error);
  }
});

function mapPartExchange(row) {
  return {
    id: row.id,
    type: 'part_exchange',
    status: row.status,
    createdAt: row.created_at,
    name: row.name,
    phone: row.phone,
    email: row.email,
    registration: row.registration,
    mileage: row.mileage,
    notes: row.notes,
    targetTruckId: row.target_truck_id
  };
}
