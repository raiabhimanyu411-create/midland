import { Router } from 'express';
import { pool } from '../db/mysql.js';
import { cleanNumber, cleanText, requireFields } from '../utils/validation.js';
import { audit, requireAuth } from '../middleware/auth.js';

export const chatLeadsRouter = Router();

chatLeadsRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const page=Math.max(1,Number(req.query.page)||1), limit=Math.min(50,Math.max(5,Number(req.query.limit)||10));
    const where=['1=1'],values=[];
    if(req.query.search){where.push('(name LIKE ? OR phone LIKE ? OR email LIKE ? OR company LIKE ? OR postcode LIKE ?)');const q=`%${req.query.search}%`;values.push(q,q,q,q,q);}
    if(req.query.status){where.push('status=?');values.push(req.query.status);}
    if(req.query.temperature){where.push('temperature=?');values.push(req.query.temperature);}
    if(req.query.followUp==='due') where.push("follow_up_at IS NOT NULL AND follow_up_at<=NOW() AND status NOT IN('won','lost')");
    const [[count],[rows]]=await Promise.all([pool.query(`SELECT COUNT(*) total FROM chat_leads WHERE ${where.join(' AND ')}`,values),pool.query(`SELECT * FROM chat_leads WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ? OFFSET ?`,[...values,limit,(page-1)*limit])]);
    res.json({ data: rows.map(mapLead), pagination:{page,limit,total:Number(count[0].total),pages:Math.ceil(count[0].total/limit)} });
  } catch (error) {
    next(error);
  }
});

chatLeadsRouter.post('/', async (req, res, next) => {
  try {
    const validation = requireFields(req.body, ['sessionId', 'name', 'phone', 'requirement']);
    if (!validation.valid || req.body.consent !== true) {
      res.status(400).json({ message: validation.valid ? 'Contact consent is required' : validation.message });
      return;
    }

    const lead = normalizeLead(req.body);
    const { score, temperature } = scoreLead(lead);
    const [result] = await pool.query(
      `INSERT INTO chat_leads (
        session_id, name, phone, email, company, postcode, requirement, vehicle_type,
        budget, budget_vat, purchase_timeline, preferred_callback, finance_required,
        part_exchange, truck_id, source_page, transcript, consent, lead_score, temperature
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [lead.sessionId, lead.name, lead.phone, lead.email, lead.company, lead.postcode,
        lead.requirement, lead.vehicleType, lead.budget, lead.budgetVat, lead.purchaseTimeline,
        lead.preferredCallback, lead.financeRequired, lead.partExchange, lead.truckId,
        lead.sourcePage, JSON.stringify(lead.transcript), true, score, temperature]
    );
    const [rows] = await pool.query('SELECT * FROM chat_leads WHERE id = ?', [result.insertId]);
    if(temperature==='hot') await pool.query(`INSERT INTO admin_notifications(user_id,title,message,link) VALUES(NULL,?,?,?)`,['New hot lead',`${lead.name} submitted a ${score}/100 lead`, `/admin?lead=${result.insertId}`]);
    res.status(201).json({ data: mapLead(rows[0]) });
  } catch (error) {
    next(error);
  }
});

chatLeadsRouter.get('/:id', requireAuth, async(req,res,next)=>{try{const[[rows],[history]]=await Promise.all([pool.query('SELECT * FROM chat_leads WHERE id=?',[Number(req.params.id)]),pool.query(`SELECT h.*,u.name changed_by_name FROM lead_status_history h LEFT JOIN admin_users u ON u.id=h.changed_by WHERE lead_id=? ORDER BY h.created_at DESC`,[Number(req.params.id)])]);if(!rows[0])return res.status(404).json({message:'Lead not found'});res.json({data:{...mapLead(rows[0]),history}});}catch(e){next(e);}});

chatLeadsRouter.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const allowedStatuses = ['new', 'contacted', 'qualified', 'viewing-booked', 'won', 'lost'];
    const status = cleanText(req.body.status);
    if (status && !allowedStatuses.includes(status)) {
      res.status(400).json({ message: 'Invalid lead status' });
      return;
    }
    const [currentRows]=await pool.query('SELECT status FROM chat_leads WHERE id=?',[Number(req.params.id)]); if(!currentRows[0]) return res.status(404).json({message:'Lead not found'});
    const [result] = await pool.query(
      `UPDATE chat_leads SET status = COALESCE(NULLIF(?, ''), status), assigned_to = ?,
       sales_notes = ?, follow_up_at = ? WHERE id = ?`,
      [status, cleanText(req.body.assignedTo), cleanText(req.body.salesNotes), req.body.followUpAt || null, Number(req.params.id)]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Lead not found' });
    if(status&&status!==currentRows[0].status) await pool.query('INSERT INTO lead_status_history(lead_id,from_status,to_status,changed_by,note) VALUES(?,?,?,?,?)',[Number(req.params.id),currentRows[0].status,status,req.admin.id,cleanText(req.body.salesNotes)]);
    await audit(req,'update-lead','chat_lead',req.params.id,{status,assignedTo:req.body.assignedTo,followUpAt:req.body.followUpAt});
    const [rows] = await pool.query('SELECT * FROM chat_leads WHERE id = ?', [Number(req.params.id)]);
    res.json({ data: mapLead(rows[0]) });
  } catch (error) { next(error); }
});

function normalizeLead(body) {
  return {
    sessionId: cleanText(body.sessionId).slice(0, 80), name: cleanText(body.name).slice(0, 120),
    phone: cleanText(body.phone).slice(0, 60), email: cleanText(body.email).slice(0, 160),
    company: cleanText(body.company).slice(0, 160), postcode: cleanText(body.postcode).toUpperCase().slice(0, 16),
    requirement: cleanText(body.requirement).slice(0, 3000), vehicleType: cleanText(body.vehicleType).slice(0, 100),
    budget: Math.max(0, cleanNumber(body.budget)), budgetVat: cleanText(body.budgetVat) || 'excluding VAT',
    purchaseTimeline: cleanText(body.purchaseTimeline), preferredCallback: cleanText(body.preferredCallback),
    financeRequired: Boolean(body.financeRequired), partExchange: Boolean(body.partExchange),
    truckId: body.truckId ? cleanNumber(body.truckId) : null, sourcePage: cleanText(body.sourcePage).slice(0, 255),
    transcript: Array.isArray(body.transcript) ? body.transcript.slice(-30) : []
  };
}

function scoreLead(lead) {
  let score = 20;
  if (/^\+?44|^0[1-9]/.test(lead.phone.replace(/\s/g, ''))) score += 15;
  if (lead.email) score += 5;
  if (lead.postcode) score += 5;
  if (lead.truckId) score += 20;
  if (lead.budget) score += 10;
  if (lead.financeRequired || lead.partExchange) score += 10;
  if (/immediately|7 days|this week|this month/i.test(lead.purchaseTimeline)) score += 20;
  else if (lead.purchaseTimeline) score += 5;
  return { score: Math.min(score, 100), temperature: score >= 70 ? 'hot' : score >= 45 ? 'warm' : 'cold' };
}

function mapLead(row) {
  return {
    id: row.id, sessionId: row.session_id, name: row.name, phone: row.phone, email: row.email,
    company: row.company, postcode: row.postcode, requirement: row.requirement, vehicleType: row.vehicle_type,
    budget: row.budget, budgetVat: row.budget_vat, purchaseTimeline: row.purchase_timeline,
    preferredCallback: row.preferred_callback, financeRequired: Boolean(row.finance_required),
    partExchange: Boolean(row.part_exchange), truckId: row.truck_id, sourcePage: row.source_page,
    transcript: typeof row.transcript === 'string' ? JSON.parse(row.transcript) : row.transcript,
    consent: Boolean(row.consent), leadScore: row.lead_score, temperature: row.temperature,
    status: row.status, assignedTo: row.assigned_to, salesNotes: row.sales_notes,
    followUpAt: row.follow_up_at, createdAt: row.created_at
  };
}
