import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/request/:username', requireAuth, (req, res) => {
  const target = db.prepare('SELECT * FROM users WHERE username = ?').get(req.params.username);
  if (!target) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
  if (target.id === req.user.id) return res.status(400).json({ error: 'Không thể tự kết bạn với chính mình.' });
  try {
    db.prepare('INSERT INTO friend_requests (from_user_id, to_user_id) VALUES (?, ?)')
      .run(req.user.id, target.id);
  } catch (e) {
    return res.status(409).json({ error: 'Đã gửi lời mời kết bạn trước đó.' });
  }
  res.status(201).json({ ok: true });
});

router.post('/respond/:requestId', requireAuth, (req, res) => {
  const { accept } = req.body || {};
  const request = db.prepare('SELECT * FROM friend_requests WHERE id = ?').get(req.params.requestId);
  if (!request || request.to_user_id !== req.user.id) {
    return res.status(404).json({ error: 'Không tìm thấy lời mời.' });
  }
  db.prepare('UPDATE friend_requests SET status = ? WHERE id = ?')
    .run(accept ? 'accepted' : 'declined', request.id);
  res.json({ ok: true });
});

router.get('/', requireAuth, (req, res) => {
  const friends = db
    .prepare(
      `SELECT users.id, users.username, users.display_name, users.avatar_url
       FROM friend_requests
       JOIN users ON users.id = CASE WHEN from_user_id = ? THEN to_user_id ELSE from_user_id END
       WHERE (from_user_id = ? OR to_user_id = ?) AND status = 'accepted'`
    )
    .all(req.user.id, req.user.id, req.user.id);

  const pending = db
    .prepare(
      `SELECT friend_requests.id, users.username, users.display_name
       FROM friend_requests JOIN users ON users.id = friend_requests.from_user_id
       WHERE to_user_id = ? AND status = 'pending'`
    )
    .all(req.user.id);

  res.json({ friends, pending });
});

export default router;
