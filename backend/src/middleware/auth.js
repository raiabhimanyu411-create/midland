import jwt from 'jsonwebtoken';
import { pool } from '../db/mysql.js';

const secret = process.env.JWT_SECRET || 'development-only-change-this-secret';

export function signAdminToken(user, sessionId) {
  return jwt.sign({ sub: user.id, role: user.role, sid: sessionId }, secret, { expiresIn: '8h' });
}

// The admin session lives in an httpOnly cookie so page scripts (and any XSS) can never read it.
export const ADMIN_COOKIE = 'midland_admin';
const SESSION_MS = 8 * 60 * 60 * 1000;

function cookieOptions() {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api' };
}

export function setAdminCookie(res, token) {
  res.cookie(ADMIN_COOKIE, token, { ...cookieOptions(), maxAge: SESSION_MS });
}

export function clearAdminCookie(res) {
  res.clearCookie(ADMIN_COOKIE, cookieOptions());
}

function readCookie(req, name) {
  for (const part of String(req.headers.cookie || '').split(';')) {
    const index = part.indexOf('=');
    if (index > 0 && part.slice(0, index).trim() === name) {
      try { return decodeURIComponent(part.slice(index + 1).trim()); } catch { return ''; }
    }
  }
  return '';
}

// Returns the signed-in admin for this request, or null.
export async function readAdminSession(req) {
  try {
    const token = readCookie(req, ADMIN_COOKIE);
    if (!token) return null;
    const payload = jwt.verify(token, secret);
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, s.id session_id FROM admin_users u
       JOIN admin_sessions s ON s.user_id=u.id WHERE u.id=? AND u.active=1 AND s.id=?
       AND s.revoked_at IS NULL AND s.expires_at > NOW()`, [payload.sub, payload.sid]);
    return rows[0] || null;
  } catch { return null; }
}

export async function requireAuth(req, res, next) {
  const admin = await readAdminSession(req);
  if (!admin) return res.status(401).json({ message: readCookie(req, ADMIN_COOKIE) ? 'Session expired' : 'Admin login required' });
  req.admin = admin;
  next();
}

export function allowRoles(...roles) {
  return (req, res, next) => roles.includes(req.admin.role) ? next() : res.status(403).json({ message: 'You do not have permission for this action' });
}

export async function audit(req, action, entityType, entityId, details = {}) {
  await pool.query(`INSERT INTO audit_logs(user_id,user_name,action,entity_type,entity_id,details) VALUES(?,?,?,?,?,?)`,
    [req.admin?.id || null, req.admin?.name || 'System', action, entityType, String(entityId || ''), JSON.stringify(details)]);
}
