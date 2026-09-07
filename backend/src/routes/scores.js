import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/:gameId', requireAuth, (req, res) => {
  const { score } = req.body || {};
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return res.status(400).json({ error: 'Điểm số không hợp lệ.' });
  }
  db.prepare('INSERT INTO scores (game_id, user_id, score) VALUES (?, ?, ?)')
    .run(req.params.gameId, req.user.id, Math.round(score));
  res.status(201).json({ ok: true });
});

router.get('/:gameId/leaderboard', (req, res) => {
  const rows = db
    .prepare(
      `SELECT scores.score, scores.created_at, users.username, users.display_name, users.avatar_url
       FROM scores JOIN users ON users.id = scores.user_id
       WHERE scores.game_id = ?
       ORDER BY scores.score DESC LIMIT 50`
    )
    .all(req.params.gameId);
  res.json({
    leaderboard: rows.map((r) => ({
      username: r.username,
      displayName: r.display_name,
      avatarUrl: r.avatar_url,
      score: r.score,
      createdAt: r.created_at * 1000,
    })),
  });
});

router.get('/me/:gameId', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT score, created_at FROM scores WHERE game_id = ? AND user_id = ? ORDER BY score DESC LIMIT 10')
    .all(req.params.gameId, req.user.id);
  res.json({ scores: rows.map((r) => ({ score: r.score, createdAt: r.created_at * 1000 })) });
});

export default router;
