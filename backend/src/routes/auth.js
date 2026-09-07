import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/index.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();

function publicUser(u) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.display_name,
    avatarUrl: u.avatar_url,
    role: u.role,
    bio: u.bio,
    createdAt: u.created_at,
  };
}

router.post('/register', (req, res) => {
  const { username, password, displayName } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
  }
  if (username.length < 3 || password.length < 6) {
    return res.status(400).json({ error: 'Tên đăng nhập tối thiểu 3 ký tự, mật khẩu tối thiểu 6 ký tự.' });
  }
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại.' });

  const hash = bcrypt.hashSync(password, 12);
  const info = db
    .prepare('INSERT INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)')
    .run(username, hash, displayName || username, 'player');
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Thiếu thông tin đăng nhập.' });

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu.' });
  }
  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
  res.json({ user: publicUser(user) });
});

router.put('/me', requireAuth, (req, res) => {
  const { displayName, bio, avatarUrl } = req.body || {};
  db.prepare('UPDATE users SET display_name = COALESCE(?, display_name), bio = COALESCE(?, bio), avatar_url = COALESCE(?, avatar_url) WHERE id = ?')
    .run(displayName ?? null, bio ?? null, avatarUrl ?? null, req.user.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: publicUser(user) });
});

router.post('/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user || !bcrypt.compareSync(currentPassword || '', user.password_hash)) {
    return res.status(401).json({ error: 'Mật khẩu hiện tại không đúng.' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu mới tối thiểu 6 ký tự.' });
  }
  const hash = bcrypt.hashSync(newPassword, 12);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
  res.json({ ok: true });
});

// "Gói Dev" — upgrade a player account so they can publish games.
router.post('/become-developer', requireAuth, (req, res) => {
  db.prepare("UPDATE users SET role = CASE WHEN role = 'player' THEN 'developer' ELSE role END WHERE id = ?")
    .run(req.user.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: publicUser(user) });
});

export { publicUser };
export default router;
