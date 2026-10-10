import { Router } from 'express';
import { pool } from '../db/mysql.js';
import { cleanNumber, cleanText, createRecord, positiveInt, requireFields } from '../utils/validation.js';
import { requireAuth } from '../middleware/auth.js';

export const financeRouter = Router();

financeRouter.get('/', requireAuth, async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM finance_quotes ORDER BY created_at DESC');
    res.json({ data: rows.map(mapFinanceQuote) });
  } catch (error) {
    next(error);
  }
});

financeRouter.post('/', async (req, res, next) => {
  try {
    const validation = requireFields(req.body, ['name', 'phone', 'vehiclePrice', 'deposit', 'term']);
    if (!validation.valid) {
      res.status(400).json({ message: validation.message });
      return;
    }

    const vehiclePrice = Math.round(cleanNumber(req.body.vehiclePrice, -1));
    const deposit = Math.round(cleanNumber(req.body.deposit, -1));
    const term = Math.round(cleanNumber(req.body.term, -1));

    if (vehiclePrice <= 0 || vehiclePrice > 10_000_000) {
      res.status(400).json({ message: 'Vehicle price must be between 1 and 10,000,000' });
      return;
    }
    if (deposit < 0 || deposit > vehiclePrice) {
      res.status(400).json({ message: 'Deposit must be between 0 and the vehicle price' });
      return;
    }
    if (term < 12 || term > 120) {
      res.status(400).json({ message: 'Term must be between 12 and 120 months' });
      return;
    }
    const monthlyEstimate = Math.round((Math.max(vehiclePrice - deposit, 0) * 1.09) / term);

    const record = createRecord('finance_quote', {
      name: cleanText(req.body.name, 120),
      phone: cleanText(req.body.phone, 60),
      email: cleanText(req.body.email, 160),
      vehiclePrice,
      deposit,
      term,
      monthlyEstimate,
      truckId: positiveInt(req.body.truckId)
    });

    const [result] = await pool.query(
      `INSERT INTO finance_quotes (
        name, phone, email, vehicle_price, deposit, term, monthly_estimate, truck_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.name,
        record.phone,
        record.email,
        record.vehiclePrice,
        record.deposit,
        record.term,
        record.monthlyEstimate,
        record.truckId,
        record.status
      ]
    );
    const [rows] = await pool.query('SELECT * FROM finance_quotes WHERE id = ?', [result.insertId]);

    res.status(201).json({ data: mapFinanceQuote(rows[0]) });
  } catch (error) {
    next(error);
  }
});

function mapFinanceQuote(row) {
  return {
    id: row.id,
    type: 'finance_quote',
    status: row.status,
    createdAt: row.created_at,
    name: row.name,
    phone: row.phone,
    email: row.email,
    vehiclePrice: row.vehicle_price,
    deposit: row.deposit,
    term: row.term,
    monthlyEstimate: row.monthly_estimate,
    truckId: row.truck_id
  };
}
