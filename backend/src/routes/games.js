import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';
import db from '../db/index.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';

const router = Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, `${nanoid(10)}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(png|jpe?g|gif|webp|svg\+xml)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Chỉ chấp nhận file ảnh (png, jpg, gif, webp, svg).'));
  },
});

function serialize(g) {
  return {
    id: g.id,
    title: g.title,
    desc: g.description,
    language: g.language,
    code: g.code,
    logoUrl: g.logo_url,
    authorId: g.author_id,
    author: g.author_name,
    multiplayer: !!g.multiplayer,
    plays: g.plays,
    createdAt: g.created_at * 1000,
  };
}

router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT games.*, users.display_name AS author_name
       FROM games JOIN users ON users.id = games.author_id
       ORDER BY games.created_at DESC`
    )
    .all();
  res.json({ games: rows.map(serialize) });
});

router.get('/:id', (req, res) => {
  const g = db
    .prepare(
      `SELECT games.*, users.display_name AS author_name
       FROM games JOIN users ON users.id = games.author_id
       WHERE games.id = ?`
    )
    .get(req.params.id);
  if (!g) return res.status(404).json({ error: 'Không tìm thấy game.' });
  res.json({ game: serialize(g) });
});

// Only developers/admins may publish — this is the "gói dev" gate.
router.post('/', requireAuth, requireRole('developer', 'admin'), (req, res) => {
  const { title, desc, language, code, logoUrl, multiplayer } = req.body || {};
  if (!title || !code) return res.status(400).json({ error: 'Thiếu tên game hoặc mã nguồn.' });
  const info = db
    .prepare(
      `INSERT INTO games (title, description, language, code, logo_url, author_id, multiplayer)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(title, desc || '', language || 'html', typeof code === 'string' ? code : JSON.stringify(code), logoUrl || null, req.user.id, multiplayer ? 1 : 0);
  res.status(201).json({ id: info.lastInsertRowid });
});

router.put('/:id', requireAuth, (req, res) => {
  const g = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id);
  if (!g) return res.status(404).json({ error: 'Không tìm thấy game.' });
  if (g.author_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Bạn không sở hữu game này.' });
  }
  const { title, desc, language, code, logoUrl, multiplayer } = req.body || {};
  db.prepare(
    `UPDATE games SET title = COALESCE(?, title), description = COALESCE(?, description),
     language = COALESCE(?, language), code = COALESCE(?, code), logo_url = COALESCE(?, logo_url),
     multiplayer = COALESCE(?, multiplayer) WHERE id = ?`
  ).run(title ?? null, desc ?? null, language ?? null, code ? (typeof code === 'string' ? code : JSON.stringify(code)) : null, logoUrl ?? null, multiplayer === undefined ? null : (multiplayer ? 1 : 0), g.id);
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, (req, res) => {
  const g = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id);
  if (!g) return res.status(404).json({ error: 'Không tìm thấy game.' });
  if (g.author_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Bạn không sở hữu game này.' });
  }
  db.prepare('DELETE FROM games WHERE id = ?').run(g.id);
  res.json({ ok: true });
});

router.post('/:id/play', optionalAuth, (req, res) => {
  db.prepare('UPDATE games SET plays = plays + 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Logo upload — for the game itself or for a developer's studio brand.
router.post('/upload-logo', requireAuth, upload.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Không có file được tải lên.' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

export default router;
