import { Router } from 'express';
import { pool } from '../db/mysql.js';
import { cleanText, createRecord, positiveInt, requireFields } from '../utils/validation.js';
import { requireAuth } from '../middleware/auth.js';

export const enquiriesRouter = Router();

enquiriesRouter.get('/', requireAuth, async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM enquiries ORDER BY created_at DESC');
    res.json({ data: rows.map(mapEnquiry) });
  } catch (error) {
    next(error);
  }
});

enquiriesRouter.post('/', async (req, res, next) => {
  try {
    const validation = requireFields(req.body, ['name', 'phone', 'requirement']);
    if (!validation.valid) {
      res.status(400).json({ message: validation.message });
      return;
    }

    const record = createRecord('enquiry', {
      name: cleanText(req.body.name, 120),
      phone: cleanText(req.body.phone, 60),
      email: cleanText(req.body.email, 160),
      requirement: cleanText(req.body.requirement, 5000),
      truckId: positiveInt(req.body.truckId)
    });

    const [result] = await pool.query(
      `INSERT INTO enquiries (name, phone, email, requirement, truck_id, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [record.name, record.phone, record.email, record.requirement, record.truckId, record.status]
    );
    const [rows] = await pool.query('SELECT * FROM enquiries WHERE id = ?', [result.insertId]);

    res.status(201).json({ data: mapEnquiry(rows[0]) });
  } catch (error) {
    next(error);
  }
});

function mapEnquiry(row) {
  return {
    id: row.id,
    type: 'enquiry',
    status: row.status,
    createdAt: row.created_at,
    name: row.name,
    phone: row.phone,
    email: row.email,
    requirement: row.requirement,
    truckId: row.truck_id
  };
}
