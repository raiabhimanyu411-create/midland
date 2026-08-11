import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { pool } from '../db/mysql.js';
import { audit, requireAuth, signAdminToken } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const [rows] = await pool.query('SELECT * FROM admin_users WHERE email=? AND active=1', [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.password_hash)))
      return res.status(401).json({ message: 'Incorrect email or password' });
    const sid = crypto.randomUUID();
    await pool.query('INSERT INTO admin_sessions(id,user_id,expires_at) VALUES(?,?,DATE_ADD(NOW(), INTERVAL 8 HOUR))', [sid, user.id]);
    req.admin = user; await audit(req, 'login', 'session', sid);
    res.json({ token: signAdminToken(user, sid), user: publicUser(user), expiresIn: 28800 });
  } catch (e) { next(e); }
});

authRouter.post('/logout', requireAuth, async (req, res, next) => {
  try { await pool.query('UPDATE admin_sessions SET revoked_at=NOW() WHERE id=?', [req.admin.session_id]); await audit(req,'logout','session',req.admin.session_id); res.json({ message:'Logged out' }); } catch(e){next(e);}
});
authRouter.get('/me', requireAuth, (req,res)=>res.json({ user: publicUser(req.admin) }));

authRouter.post('/forgot-password', async (req,res,next)=>{
  try {
    const email=String(req.body.email||'').trim().toLowerCase(); const [rows]=await pool.query('SELECT id FROM admin_users WHERE email=?',[email]);
    if(rows[0]) { const token=crypto.randomBytes(32).toString('hex'); const hash=crypto.createHash('sha256').update(token).digest('hex'); await pool.query('UPDATE admin_users SET reset_token_hash=?,reset_expires_at=DATE_ADD(NOW(),INTERVAL 30 MINUTE) WHERE id=?',[hash,rows[0].id]); if(process.env.NODE_ENV!=='production') console.log(`Password reset token for ${email}: ${token}`); }
    res.json({message:'If that account exists, password reset instructions have been generated.'});
  } catch(e){next(e);}
});
authRouter.post('/reset-password', async(req,res,next)=>{
  try { const hash=crypto.createHash('sha256').update(String(req.body.token||'')).digest('hex'); const [rows]=await pool.query('SELECT id FROM admin_users WHERE reset_token_hash=? AND reset_expires_at>NOW()',[hash]); if(!rows[0]) return res.status(400).json({message:'Reset link is invalid or expired'}); if(String(req.body.password||'').length<10) return res.status(400).json({message:'Password must be at least 10 characters'}); const passwordHash=await bcrypt.hash(req.body.password,12); await pool.query('UPDATE admin_users SET password_hash=?,reset_token_hash=NULL,reset_expires_at=NULL WHERE id=?',[passwordHash,rows[0].id]); await pool.query('UPDATE admin_sessions SET revoked_at=NOW() WHERE user_id=?',[rows[0].id]); res.json({message:'Password updated. Please log in.'}); } catch(e){next(e);}
});

function publicUser(u){return {id:u.id,name:u.name,email:u.email,role:u.role};}
