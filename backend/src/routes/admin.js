import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { uploadDir } from '../config/paths.js';
import { pool } from '../db/mysql.js';
import { allowRoles, audit, requireAuth } from '../middleware/auth.js';

export const adminRouter = Router();
adminRouter.use(requireAuth);

adminRouter.get('/dashboard', async (req,res,next)=>{try{
  const [[leadStats],[due],[stock],[unread]]=await Promise.all([
    pool.query(`SELECT COUNT(*) total, SUM(status='new') new_count, SUM(temperature='hot') hot_count FROM chat_leads`),
    pool.query(`SELECT COUNT(*) due_count FROM chat_leads WHERE follow_up_at IS NOT NULL AND follow_up_at<=NOW() AND status NOT IN('won','lost')`),
    pool.query(`SELECT COUNT(*) stock_count FROM trucks WHERE status!='archived'`),
    pool.query(`SELECT COUNT(*) unread_count FROM admin_notifications WHERE is_read=0 AND (user_id IS NULL OR user_id=?)`,[req.admin.id])]);
  res.json({data:{leads:Number(leadStats[0].total),newLeads:Number(leadStats[0].new_count),hotLeads:Number(leadStats[0].hot_count),followUps:Number(due[0].due_count),stock:Number(stock[0].stock_count),unread:Number(unread[0].unread_count)}});
}catch(e){next(e);}});

adminRouter.get('/users',allowRoles('admin','manager'),async(_req,res,next)=>{try{const[rows]=await pool.query('SELECT id,name,email,role,active,created_at createdAt FROM admin_users ORDER BY name');res.json({data:rows});}catch(e){next(e);}});
adminRouter.post('/users',allowRoles('admin'),async(req,res,next)=>{try{if(String(req.body.password||'').length<10)return res.status(400).json({message:'Password must be at least 10 characters'});const hash=await bcrypt.hash(req.body.password,12);const[result]=await pool.query('INSERT INTO admin_users(name,email,password_hash,role) VALUES(?,?,?,?)',[req.body.name,String(req.body.email).toLowerCase(),hash,req.body.role||'salesperson']);await audit(req,'create-user','admin_user',result.insertId,{role:req.body.role});res.status(201).json({message:'User created'});}catch(e){if(e.code==='ER_DUP_ENTRY')return res.status(409).json({message:'A user with that email already exists'});next(e);}});
adminRouter.patch('/users/:id',allowRoles('admin'),async(req,res,next)=>{try{
  const id=Number(req.params.id);
  const fields=[]; const values=[];
  if(req.body.role){fields.push('role=?');values.push(req.body.role);}
  if(typeof req.body.active==='boolean'){
    if(id===req.admin.id && req.body.active===false) return res.status(400).json({message:'You cannot disable your own account'});
    fields.push('active=?');values.push(req.body.active?1:0);
  }
  if(!fields.length) return res.status(400).json({message:'Nothing to update'});
  values.push(id);
  await pool.query(`UPDATE admin_users SET ${fields.join(',')} WHERE id=?`,values);
  await audit(req,'update-user','admin_user',id,req.body);
  res.json({message:'User updated'});
}catch(e){next(e);}});

adminRouter.get('/audit-logs',allowRoles('admin','manager'),async(req,res,next)=>{try{const page=Math.max(1,Number(req.query.page)||1),limit=25;const[rows]=await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',[limit,(page-1)*limit]);res.json({data:rows,page});}catch(e){next(e);}});
adminRouter.get('/notifications',async(req,res,next)=>{try{const[rows]=await pool.query('SELECT * FROM admin_notifications WHERE user_id IS NULL OR user_id=? ORDER BY created_at DESC LIMIT 30',[req.admin.id]);res.json({data:rows});}catch(e){next(e);}});
adminRouter.patch('/notifications/:id/read',async(req,res,next)=>{try{await pool.query('UPDATE admin_notifications SET is_read=1 WHERE id=? AND (user_id IS NULL OR user_id=?)',[Number(req.params.id),req.admin.id]);res.json({message:'Read'});}catch(e){next(e);}});

await mkdir(uploadDir,{recursive:true});
const storage=multer.diskStorage({destination:(_r,_f,cb)=>cb(null,uploadDir),filename:(_r,file,cb)=>cb(null,`${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`)});
const upload=multer({storage,limits:{fileSize:8*1024*1024},fileFilter:(_r,file,cb)=>cb(null,['image/jpeg','image/png','image/webp'].includes(file.mimetype))});
adminRouter.post('/upload',allowRoles('admin','manager'),upload.single('image'),async(req,res,next)=>{try{if(!req.file)return res.status(400).json({message:'JPEG, PNG or WebP image required'});await audit(req,'upload-image','file',req.file.filename);res.status(201).json({url:`/uploads/${req.file.filename}`});}catch(e){next(e);}});
