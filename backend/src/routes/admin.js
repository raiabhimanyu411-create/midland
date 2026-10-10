import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import crypto from 'node:crypto';
import { mkdir, open, unlink } from 'node:fs/promises';
import { uploadDir } from '../config/paths.js';
import { pool } from '../db/mysql.js';
import { allowRoles, audit, requireAuth } from '../middleware/auth.js';
import { cleanText, positiveInt } from '../utils/validation.js';

export const adminRouter = Router();
adminRouter.use(requireAuth);

const adminRoles = ['admin', 'manager', 'salesperson'];
const imageExtensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Global notifications (user_id NULL) are shared, so read state is tracked per user.
const unreadForUser = `n.id NOT IN (SELECT notification_id FROM admin_notification_reads WHERE user_id = ?)`;

adminRouter.get('/dashboard', async (req,res,next)=>{try{
  const [[leadStats],[due],[stock],[unread]]=await Promise.all([
    pool.query(`SELECT COUNT(*) total, SUM(status='new') new_count, SUM(temperature='hot') hot_count FROM chat_leads`),
    pool.query(`SELECT COUNT(*) due_count FROM chat_leads WHERE follow_up_at IS NOT NULL AND follow_up_at<=NOW() AND status NOT IN('won','lost')`),
    pool.query(`SELECT COUNT(*) stock_count FROM trucks WHERE status!='archived'`),
    pool.query(`SELECT COUNT(*) unread_count FROM admin_notifications n WHERE (n.user_id IS NULL OR n.user_id=?) AND ${unreadForUser}`,[req.admin.id,req.admin.id])]);
  res.json({data:{leads:Number(leadStats[0].total),newLeads:Number(leadStats[0].new_count),hotLeads:Number(leadStats[0].hot_count),followUps:Number(due[0].due_count),stock:Number(stock[0].stock_count),unread:Number(unread[0].unread_count)}});
}catch(e){next(e);}});

adminRouter.get('/users',allowRoles('admin','manager'),async(_req,res,next)=>{try{const[rows]=await pool.query('SELECT id,name,email,role,active,created_at createdAt FROM admin_users ORDER BY name');res.json({data:rows});}catch(e){next(e);}});
adminRouter.post('/users',allowRoles('admin'),async(req,res,next)=>{try{
  const name=cleanText(req.body.name,120); const email=cleanText(req.body.email,160).toLowerCase(); const password=typeof req.body.password==='string'?req.body.password:''; const role=req.body.role||'salesperson';
  if(!name) return res.status(400).json({message:'Name is required'});
  if(!emailPattern.test(email)) return res.status(400).json({message:'A valid email is required'});
  if(password.length<10) return res.status(400).json({message:'Password must be at least 10 characters'});
  if(!adminRoles.includes(role)) return res.status(400).json({message:'Invalid role'});
  const hash=await bcrypt.hash(password,12);
  const[result]=await pool.query('INSERT INTO admin_users(name,email,password_hash,role) VALUES(?,?,?,?)',[name,email,hash,role]);
  await audit(req,'create-user','admin_user',result.insertId,{role});
  res.status(201).json({message:'User created'});
}catch(e){if(e.code==='ER_DUP_ENTRY')return res.status(409).json({message:'A user with that email already exists'});next(e);}});
adminRouter.patch('/users/:id',allowRoles('admin'),async(req,res,next)=>{try{
  const id=positiveInt(req.params.id);
  if(!id) return res.status(404).json({message:'User not found'});
  const fields=[]; const values=[];
  if(req.body.role!==undefined){
    if(!adminRoles.includes(req.body.role)) return res.status(400).json({message:'Invalid role'});
    if(id===req.admin.id && req.body.role!=='admin') return res.status(400).json({message:'You cannot remove your own admin role'});
    fields.push('role=?');values.push(req.body.role);
  }
  if(typeof req.body.active==='boolean'){
    if(id===req.admin.id && req.body.active===false) return res.status(400).json({message:'You cannot disable your own account'});
    fields.push('active=?');values.push(req.body.active?1:0);
  }
  if(!fields.length) return res.status(400).json({message:'Nothing to update'});
  values.push(id);
  const[result]=await pool.query(`UPDATE admin_users SET ${fields.join(',')} WHERE id=?`,values);
  if(!result.affectedRows) return res.status(404).json({message:'User not found'});
  if(req.body.active===false) await pool.query('UPDATE admin_sessions SET revoked_at=NOW() WHERE user_id=? AND revoked_at IS NULL',[id]);
  await audit(req,'update-user','admin_user',id,{role:req.body.role,active:req.body.active});
  res.json({message:'User updated'});
}catch(e){next(e);}});

adminRouter.get('/audit-logs',allowRoles('admin','manager'),async(req,res,next)=>{try{const page=Math.max(1,Number(req.query.page)||1),limit=25;const[rows]=await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',[limit,(page-1)*limit]);res.json({data:rows,page});}catch(e){next(e);}});
adminRouter.get('/notifications',async(req,res,next)=>{try{const[rows]=await pool.query(`SELECT n.id,n.user_id,n.title,n.message,n.link,n.created_at,EXISTS(SELECT 1 FROM admin_notification_reads r WHERE r.notification_id=n.id AND r.user_id=?) is_read FROM admin_notifications n WHERE n.user_id IS NULL OR n.user_id=? ORDER BY n.created_at DESC LIMIT 30`,[req.admin.id,req.admin.id]);res.json({data:rows.map((row)=>({...row,is_read:Boolean(row.is_read)}))});}catch(e){next(e);}});
adminRouter.patch('/notifications/:id/read',async(req,res,next)=>{try{const id=positiveInt(req.params.id);if(!id)return res.status(404).json({message:'Notification not found'});await pool.query('INSERT IGNORE INTO admin_notification_reads(notification_id,user_id) SELECT id,? FROM admin_notifications WHERE id=? AND (user_id IS NULL OR user_id=?)',[req.admin.id,id,req.admin.id]);res.json({message:'Read'});}catch(e){next(e);}});

await mkdir(uploadDir,{recursive:true});
const storage=multer.diskStorage({destination:(_r,_f,cb)=>cb(null,uploadDir),filename:(_r,file,cb)=>cb(null,`${Date.now()}-${crypto.randomUUID()}${imageExtensions[file.mimetype]}`)});
const upload=multer({storage,limits:{fileSize:8*1024*1024},fileFilter:(_r,file,cb)=>cb(null,Boolean(imageExtensions[file.mimetype]))});
adminRouter.post('/upload',allowRoles('admin','manager'),upload.single('image'),async(req,res,next)=>{try{if(!req.file)return res.status(400).json({message:'JPEG, PNG or WebP image required'});if(!(await hasImageSignature(req.file.path,req.file.mimetype))){await unlink(req.file.path).catch(()=>{});return res.status(400).json({message:'JPEG, PNG or WebP image required'});}await audit(req,'upload-image','file',req.file.filename);res.status(201).json({url:`/uploads/${req.file.filename}`});}catch(e){next(e);}});

// The browser-supplied mimetype is not trusted: check the file's magic bytes too.
async function hasImageSignature(filePath, mimetype) {
  const handle = await open(filePath, 'r');
  try {
    const { buffer, bytesRead } = await handle.read(Buffer.alloc(12), 0, 12, 0);
    if (bytesRead < 12) return false;
    if (mimetype === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (mimetype === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (mimetype === 'image/webp') return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
    return false;
  } finally {
    await handle.close();
  }
}
