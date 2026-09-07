import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function roomFor(userId, otherId) {
  const [a, b] = [Number(userId), Number(otherId)].sort((x, y) => x - y);
  return `dm:${a}-${b}`;
}

router.get('/global', (req, res) => {
  const rows = db
    .prepare(
      `SELECT messages.id, messages.body, messages.created_at, users.username, users.display_name, users.avatar_url
       FROM messages JOIN users ON users.id = messages.from_user_id
       WHERE room = 'global' ORDER BY messages.id DESC LIMIT 50`
    )
    .all();
  res.json({ messages: rows.reverse().map(format) });
});

router.get('/dm/:userId', requireAuth, (req, res) => {
  const room = roomFor(req.user.id, req.params.userId);
  const rows = db
    .prepare(
      `SELECT messages.id, messages.body, messages.created_at, users.username, users.display_name, users.avatar_url
       FROM messages JOIN users ON users.id = messages.from_user_id
       WHERE room = ? ORDER BY messages.id DESC LIMIT 50`
    )
    .all(room);
  res.json({ messages: rows.reverse().map(format) });
});

function format(r) {
  return {
    id: r.id,
    body: r.body,
    from: { username: r.username, displayName: r.display_name, avatarUrl: r.avatar_url },
    createdAt: r.created_at * 1000,
  };
}

export { roomFor };
export default router;
