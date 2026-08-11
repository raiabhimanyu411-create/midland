import { Router } from 'express';
import { mapBlog, pool } from '../db/mysql.js';
import { cleanText, requireFields } from '../utils/validation.js';
import { allowRoles, audit, requireAuth } from '../middleware/auth.js';

export const blogsRouter = Router();

blogsRouter.get('/', async (req, res, next) => {
  try {
    const { tag, page = 1, limit = 9 } = req.query;
    const where = ["status = 'published'"];
    const values = [];

    if (tag) {
      where.push('FIND_IN_SET(?, REPLACE(tags, ", ", ",")) > 0');
      values.push(tag);
    }

    const offset = (Math.max(1, Number(page)) - 1) * Number(limit);
    const [rows] = await pool.query(
      `SELECT * FROM blogs WHERE ${where.join(' AND ')} ORDER BY published_at DESC LIMIT ? OFFSET ?`,
      [...values, Number(limit), offset]
    );
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) total FROM blogs WHERE ${where.join(' AND ')}`, values);

    res.json({
      data: rows.map(mapBlog),
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) || 1 }
    });
  } catch (error) {
    next(error);
  }
});

blogsRouter.get('/admin/list', requireAuth, allowRoles('admin', 'manager'), async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM blogs ORDER BY created_at DESC');
    res.json({ data: rows.map(mapBlog) });
  } catch (error) {
    next(error);
  }
});

blogsRouter.get('/admin/:id', requireAuth, allowRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM blogs WHERE id = ?', [Number(req.params.id)]);
    if (!rows[0]) return res.status(404).json({ message: 'Post not found' });
    res.json({ data: mapBlog(rows[0]) });
  } catch (error) {
    next(error);
  }
});

blogsRouter.get('/:slug', async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM blogs WHERE slug = ? AND status = 'published'", [req.params.slug]);
    if (!rows[0]) return res.status(404).json({ message: 'Post not found' });
    res.json({ data: mapBlog(rows[0]) });
  } catch (error) {
    next(error);
  }
});

blogsRouter.post('/', requireAuth, allowRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const validation = requireFields(req.body, ['title', 'slug', 'content']);
    if (!validation.valid) return res.status(400).json({ message: validation.message });

    const payload = normalizeBlogPayload(req.body);
    const [existing] = await pool.query('SELECT id FROM blogs WHERE slug = ?', [payload.slug]);
    if (existing[0]) return res.status(409).json({ message: 'A post with that URL slug already exists' });

    const [result] = await pool.query(
      `INSERT INTO blogs (title, slug, excerpt, content, cover_image, tags, meta_title, meta_description, status, author_id, author_name, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.title, payload.slug, payload.excerpt, payload.content, payload.coverImage, payload.tags,
        payload.metaTitle, payload.metaDescription, payload.status, req.admin.id, req.admin.name,
        payload.status === 'published' ? new Date() : null
      ]
    );

    const [rows] = await pool.query('SELECT * FROM blogs WHERE id = ?', [result.insertId]);
    await audit(req, 'create-blog', 'blog', result.insertId, { title: payload.title });
    res.status(201).json({ data: mapBlog(rows[0]) });
  } catch (error) {
    next(error);
  }
});

blogsRouter.put('/:id', requireAuth, allowRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const validation = requireFields(req.body, ['title', 'slug', 'content']);
    if (!validation.valid) return res.status(400).json({ message: validation.message });

    const payload = normalizeBlogPayload(req.body);
    const id = Number(req.params.id);
    const [existing] = await pool.query('SELECT id FROM blogs WHERE slug = ? AND id != ?', [payload.slug, id]);
    if (existing[0]) return res.status(409).json({ message: 'A post with that URL slug already exists' });

    const [current] = await pool.query('SELECT status, published_at FROM blogs WHERE id = ?', [id]);
    if (!current[0]) return res.status(404).json({ message: 'Post not found' });
    const publishedAt = payload.status === 'published' ? current[0].published_at || new Date() : current[0].published_at;

    const [result] = await pool.query(
      `UPDATE blogs SET title=?, slug=?, excerpt=?, content=?, cover_image=?, tags=?, meta_title=?, meta_description=?, status=?, published_at=? WHERE id=?`,
      [payload.title, payload.slug, payload.excerpt, payload.content, payload.coverImage, payload.tags, payload.metaTitle, payload.metaDescription, payload.status, publishedAt, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: 'Post not found' });

    const [rows] = await pool.query('SELECT * FROM blogs WHERE id = ?', [id]);
    await audit(req, 'update-blog', 'blog', id, { title: payload.title });
    res.json({ data: mapBlog(rows[0]) });
  } catch (error) {
    next(error);
  }
});

blogsRouter.delete('/:id', requireAuth, allowRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM blogs WHERE id = ?', [Number(req.params.id)]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Post not found' });
    await audit(req, 'delete-blog', 'blog', req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (error) {
    next(error);
  }
});

function normalizeBlogPayload(body) {
  return {
    title: cleanText(body.title),
    slug: cleanText(body.slug).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    excerpt: cleanText(body.excerpt),
    content: cleanText(body.content),
    coverImage: cleanText(body.coverImage),
    tags: cleanText(body.tags),
    metaTitle: cleanText(body.metaTitle),
    metaDescription: cleanText(body.metaDescription),
    status: body.status === 'published' ? 'published' : 'draft'
  };
}
