import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH ?? path.join(__dirname, '../../../../db.sqlite');

export const db = new Database(DB_PATH);

// Performance tuning
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ───────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'user',   -- 'user' | 'admin' | 'superadmin'
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL,
    device_info TEXT,
    expires_at  TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id              TEXT PRIMARY KEY,
    ref_number      TEXT UNIQUE NOT NULL,
    user_id         TEXT REFERENCES users(id),
    package_id      TEXT NOT NULL,
    name            TEXT NOT NULL,
    email           TEXT NOT NULL,
    whatsapp        TEXT NOT NULL,
    group_name      TEXT NOT NULL,
    need_type       TEXT,
    member_count    TEXT,
    description     TEXT,
    doc_url         TEXT,
    status          TEXT NOT NULL DEFAULT 'menunggu_pembayaran',
    total           INTEGER NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS payments (
    id            TEXT PRIMARY KEY,
    order_id      TEXT NOT NULL REFERENCES orders(id),
    method        TEXT NOT NULL,
    bill_number   TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'pending',
    qr_payload    TEXT,
    va_number     TEXT,
    expires_at    TEXT NOT NULL,
    paid_at       TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_logs (
    id          TEXT PRIMARY KEY,
    order_id    TEXT NOT NULL REFERENCES orders(id),
    status      TEXT NOT NULL,
    note        TEXT,
    changed_by  TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leads (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    whatsapp        TEXT NOT NULL,
    group_name      TEXT NOT NULL,
    need_type       TEXT,
    member_estimate TEXT,
    note            TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ─── Seed admin dari .env ─────────────────────────────────────────────────────

function seedAdmin() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@atur-in.id';
  const password = process.env.ADMIN_PASSWORD ?? 'Admin1234!';
  const name = process.env.ADMIN_NAME ?? 'Super Admin';

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return;

  const hash = bcrypt.hashSync(password, 12);
  const id = `admin-${Date.now()}`;

  db.prepare(`
    INSERT INTO users (id, email, password, name, role)
    VALUES (?, ?, ?, ?, 'superadmin')
  `).run(id, email, hash, name);

  console.log(`[db] Admin seeded: ${email}`);
}

seedAdmin();

export default db;
