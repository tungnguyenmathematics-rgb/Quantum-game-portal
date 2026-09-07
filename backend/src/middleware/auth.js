import jwt from 'jsonwebtoken';
import db from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Roles (player -> developer, or admin promotions) can change after a
// token was issued. Rather than forcing a re-login for every promotion,
// we trust the JWT for identity but always re-read the current role from
// the DB, so a "become developer" call takes effect immediately.
function attachFreshUser(payload) {
  const row = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(payload.id);
  if (!row) return null;
  return { id: row.id, username: row.username, role: row.role };
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Chưa đăng nhập.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = attachFreshUser(payload);
    if (!user) return res.status(401).json({ error: 'Tài khoản không còn tồn tại.' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = attachFreshUser(payload) || undefined;
    } catch (e) { /* ignore, stays anonymous */ }
  }
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền thực hiện thao tác này.' });
    }
    next();
  };
}

export { JWT_SECRET };
