import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import db from '../store/database.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  refreshExpiresAt,
} from '../lib/jwt.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const RegisterSchema = z.object({
  name:     z.string().min(3, 'Nama minimal 3 karakter.').max(80),
  email:    z.string().email('Format email tidak valid.').transform(v => v.toLowerCase().trim()),
  password: z.string()
    .min(8, 'Password minimal 8 karakter.')
    .regex(/[A-Z]/, 'Harus ada huruf kapital.')
    .regex(/[0-9]/, 'Harus ada angka.'),
});

const LoginSchema = z.object({
  email:    z.string().email().transform(v => v.toLowerCase().trim()),
  password: z.string().min(1),
});

// ─── Register ────────────────────────────────────────────────────────────────
router.post('/register', validate(RegisterSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email sudah terdaftar.' });

    const hash = await bcrypt.hash(password, 12);
    const id = `usr-${nanoid(10)}`;

    db.prepare(`
      INSERT INTO users (id, email, password, name, role)
      VALUES (?, ?, ?, ?, 'user')
    `).run(id, email, hash, name);

    const user = { id, email, name, role: 'user' };
    const { accessToken, refreshToken } = issueTokens(user, req);

    setRefreshCookie(res, refreshToken);
    res.status(201).json({ user, accessToken });
  } catch (err) { next(err); }
});

// ─── Login ───────────────────────────────────────────────────────────────────
router.post('/login', validate(LoginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!row) return res.status(401).json({ error: 'Email atau password salah.' });
    if (!row.is_active) return res.status(403).json({ error: 'Akun dinonaktifkan.' });

    const match = await bcrypt.compare(password, row.password);
    if (!match) return res.status(401).json({ error: 'Email atau password salah.' });

    const user = { id: row.id, email: row.email, name: row.name, role: row.role };
    const { accessToken, refreshToken } = issueTokens(user, req);

    setRefreshCookie(res, refreshToken);
    res.json({ user, accessToken });
  } catch (err) { next(err); }
});

// ─── Refresh token ───────────────────────────────────────────────────────────
router.post('/refresh', (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token ?? req.body?.refreshToken;
    if (!token) return res.status(401).json({ error: 'Refresh token tidak ada.' });

    const payload = verifyRefreshToken(token);
    const tokenHash = hashToken(token);

    const stored = db.prepare(
      'SELECT * FROM refresh_tokens WHERE token_hash = ? AND user_id = ?'
    ).get(tokenHash, payload.id);

    if (!stored) return res.status(401).json({ error: 'Refresh token tidak valid.' });
    if (new Date() > new Date(stored.expires_at)) {
      db.prepare('DELETE FROM refresh_tokens WHERE id = ?').run(stored.id);
      return res.status(401).json({ error: 'Refresh token kedaluwarsa.' });
    }

    // Rotate: hapus lama, buat baru
    db.prepare('DELETE FROM refresh_tokens WHERE id = ?').run(stored.id);

    const user = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(payload.id);
    if (!user) return res.status(401).json({ error: 'User tidak ditemukan.' });

    const { accessToken, refreshToken: newRefresh } = issueTokens(user, req);
    setRefreshCookie(res, newRefresh);
    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ error: 'Refresh token tidak valid.' });
  }
});

// ─── Logout ──────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  const token = req.cookies?.refresh_token ?? req.body?.refreshToken;
  if (token) {
    const hash = hashToken(token);
    db.prepare('DELETE FROM refresh_tokens WHERE token_hash = ?').run(hash);
  }
  res.clearCookie('refresh_token');
  res.clearCookie('access_token');
  res.json({ success: true });
});

// ─── Me ──────────────────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?')
    .get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });
  res.json(user);
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function issueTokens(user, req) {
  const accessToken  = signAccessToken({ id: user.id, email: user.email, name: user.name, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id });
  const tokenHash    = hashToken(refreshToken);

  db.prepare(`
    INSERT INTO refresh_tokens (id, user_id, token_hash, device_info, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(nanoid(), user.id, tokenHash, req.headers['user-agent'] ?? null, refreshExpiresAt());

  return { accessToken, refreshToken };
}

function setRefreshCookie(res, token) {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth/refresh',
  });
}

export default router;
