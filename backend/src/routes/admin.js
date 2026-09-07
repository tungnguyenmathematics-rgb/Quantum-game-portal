import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/users', (req, res) => {
  const users = db
    .prepare('SELECT id, username, display_name, role, created_at FROM users ORDER BY created_at DESC')
    .all();
  res.json({ users });
});

router.put('/users/:id/role', (req, res) => {
  const { role } = req.body || {};
  if (!['player', 'developer', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Vai trò không hợp lệ.' });
  }
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  res.json({ ok: true });
});

router.delete('/users/:id', (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.delete('/games/:id', (req, res) => {
  db.prepare('DELETE FROM games WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.get('/stats', (req, res) => {
  const users = db.prepare('SELECT COUNT(*) c FROM users').get().c;
  const games = db.prepare('SELECT COUNT(*) c FROM games').get().c;
  const plays = db.prepare('SELECT COALESCE(SUM(plays),0) c FROM games').get().c;
  const scores = db.prepare('SELECT COUNT(*) c FROM scores').get().c;
  res.json({ users, games, plays, scores });
});

export default router;
