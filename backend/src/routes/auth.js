import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { pool } from '../db/mysql.js';
import { audit, clearAdminCookie, readAdminSession, requireAuth, setAdminCookie, signAdminToken } from '../middleware/auth.js';

export const authRouter = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    setAdminCookie(res, signAdminToken(user, sid));
    res.json({ user: publicUser(user), expiresIn: 28800 });
  } catch (e) { next(e); }
});

authRouter.post('/logout', async (req, res, next) => {
  try {
    // Always clear the cookie, even when the session has already expired.
    const admin = await readAdminSession(req);
    if (admin) {
      req.admin = admin;
      await pool.query('UPDATE admin_sessions SET revoked_at=NOW() WHERE id=?', [admin.session_id]);
      await audit(req, 'logout', 'session', admin.session_id);
    }
    clearAdminCookie(res);
    res.json({ message: 'Logged out' });
  } catch (e) { next(e); }
});
authRouter.get('/me', requireAuth, (req,res)=>res.json({ user: publicUser(req.admin) }));

authRouter.patch('/credentials', requireAuth, async (req, res, next) => {
  try {
    const currentPassword = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
    const requestedEmail = typeof req.body.newEmail === 'string' ? req.body.newEmail.trim().toLowerCase() : '';
    const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
    const confirmPassword = typeof req.body.confirmPassword === 'string' ? req.body.confirmPassword : '';

    if (!currentPassword) return res.status(400).json({ message: 'Enter your current password to confirm this change.' });
    if (requestedEmail && (requestedEmail.length > 160 || !emailPattern.test(requestedEmail))) {
      return res.status(400).json({ message: 'Enter a valid login email address.' });
    }
    if (newPassword && newPassword.length < 10) return res.status(400).json({ message: 'New password must be at least 10 characters.' });
    if (newPassword && Buffer.byteLength(newPassword, 'utf8') > 72) return res.status(400).json({ message: 'New password cannot exceed 72 bytes.' });
    if (newPassword && newPassword !== confirmPassword) return res.status(400).json({ message: 'New password and confirmation do not match.' });
    if (!newPassword && confirmPassword) return res.status(400).json({ message: 'Enter the new password before confirming it.' });

    const [rows] = await pool.query('SELECT id, name, email, role, password_hash FROM admin_users WHERE id=? AND active=1', [req.admin.id]);
    const account = rows[0];
    if (!account) return res.status(401).json({ message: 'Your account is no longer active. Please sign in again.' });
    if (!(await bcrypt.compare(currentPassword, account.password_hash))) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    const email = requestedEmail || account.email.toLowerCase();
    const emailChanged = email !== account.email.toLowerCase();
    const passwordChanged = Boolean(newPassword);
    if (!emailChanged && !passwordChanged) return res.status(400).json({ message: 'Enter a new login email or password to save a change.' });
    if (passwordChanged && await bcrypt.compare(newPassword, account.password_hash)) {
      return res.status(400).json({ message: 'Choose a password different from your current password.' });
    }

    const passwordHash = passwordChanged ? await bcrypt.hash(newPassword, 12) : account.password_hash;
    await pool.query(
      'UPDATE admin_users SET email=?, password_hash=?, reset_token_hash=NULL, reset_expires_at=NULL WHERE id=?',
      [email, passwordHash, account.id]
    );
    await pool.query(
      'UPDATE admin_sessions SET revoked_at=NOW() WHERE user_id=? AND id<>? AND revoked_at IS NULL',
      [account.id, req.admin.session_id]
    );
    await audit(req, 'change-login-credentials', 'admin_user', account.id, { emailChanged, passwordChanged });

    res.json({
      message: 'Login details updated.',
      user: publicUser({ id: account.id, name: account.name, email, role: account.role })
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'That login email is already being used by another account.' });
    next(error);
  }
});

authRouter.post('/forgot-password', async (req,res,next)=>{
  try {
    const email=String(req.body.email||'').trim().toLowerCase(); const [rows]=await pool.query('SELECT id FROM admin_users WHERE email=?',[email]);
    if(rows[0]) { const token=crypto.randomBytes(32).toString('hex'); const hash=crypto.createHash('sha256').update(token).digest('hex'); await pool.query('UPDATE admin_users SET reset_token_hash=?,reset_expires_at=DATE_ADD(NOW(),INTERVAL 30 MINUTE) WHERE id=?',[hash,rows[0].id]); if(process.env.NODE_ENV!=='production') console.log(`Password reset token for ${email}: ${token}`); }
    res.json({message:'If that account exists, password reset instructions have been generated.'});
  } catch(e){next(e);}
});
authRouter.post('/reset-password', async(req,res,next)=>{
  try { const hash=crypto.createHash('sha256').update(String(req.body.token||'')).digest('hex'); const [rows]=await pool.query('SELECT id FROM admin_users WHERE reset_token_hash=? AND reset_expires_at>NOW() AND active=1',[hash]); if(!rows[0]) return res.status(400).json({message:'Reset link is invalid or expired'}); const password=typeof req.body.password==='string'?req.body.password:''; if(password.length<10) return res.status(400).json({message:'Password must be at least 10 characters'}); const passwordHash=await bcrypt.hash(password,12); await pool.query('UPDATE admin_users SET password_hash=?,reset_token_hash=NULL,reset_expires_at=NULL WHERE id=?',[passwordHash,rows[0].id]); await pool.query('UPDATE admin_sessions SET revoked_at=NOW() WHERE user_id=?',[rows[0].id]); res.json({message:'Password updated. Please log in.'}); } catch(e){next(e);}
});

function publicUser(u){return {id:u.id,name:u.name,email:u.email,role:u.role};}
