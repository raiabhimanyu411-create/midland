import jwt from 'jsonwebtoken';
import { pool } from '../db/mysql.js';

const secret = process.env.JWT_SECRET || 'development-only-change-this-secret';

export function signAdminToken(user, sessionId) {
  return jwt.sign({ sub: user.id, role: user.role, sid: sessionId }, secret, { expiresIn: '8h' });
}

export async function requireAuth(req, res, next) {
  try {
    const raw = req.headers.authorization || '';
    const token = raw.startsWith('Bearer ') ? raw.slice(7) : '';
    if (!token) return res.status(401).json({ message: 'Admin login required' });
    const payload = jwt.verify(token, secret);
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, s.id session_id FROM admin_users u
       JOIN admin_sessions s ON s.user_id=u.id WHERE u.id=? AND u.active=1 AND s.id=?
       AND s.revoked_at IS NULL AND s.expires_at > NOW()`, [payload.sub, payload.sid]);
    if (!rows[0]) return res.status(401).json({ message: 'Session expired' });
    req.admin = rows[0];
    next();
  } catch { res.status(401).json({ message: 'Session expired or invalid' }); }
}

export function allowRoles(...roles) {
  return (req, res, next) => roles.includes(req.admin.role) ? next() : res.status(403).json({ message: 'You do not have permission for this action' });
}

export async function audit(req, action, entityType, entityId, details = {}) {
  await pool.query(`INSERT INTO audit_logs(user_id,user_name,action,entity_type,entity_id,details) VALUES(?,?,?,?,?,?)`,
    [req.admin?.id || null, req.admin?.name || 'System', action, entityType, String(entityId || ''), JSON.stringify(details)]);
}
