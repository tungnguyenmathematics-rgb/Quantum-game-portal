import bcrypt from 'bcryptjs';
import db from './index.js';

// Defaults match what was requested, but in production you should always
// override these via environment variables (ADMIN_USERNAME / ADMIN_PASSWORD)
// on Render rather than relying on the fallback below.
const username = process.env.ADMIN_USERNAME || 'QuantumPortalGameADMIN12345678';
const password = process.env.ADMIN_PASSWORD || 'Tunglaihoclaptrinhmobile@142010ADMINQUANTUMPORTAL';

const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);

if (existing) {
  const hash = bcrypt.hashSync(password, 12);
  db.prepare('UPDATE users SET password_hash = ?, role = ? WHERE id = ?')
    .run(hash, 'admin', existing.id);
  console.log(`[seed] Admin account "${username}" already existed — password/role refreshed.`);
} else {
  const hash = bcrypt.hashSync(password, 12);
  db.prepare(
    `INSERT INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, 'admin')`
  ).run(username, hash, 'Quantum Admin');
  console.log(`[seed] Admin account "${username}" created.`);
}
