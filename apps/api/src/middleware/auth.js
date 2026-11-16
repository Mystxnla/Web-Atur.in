import { verifyAccessToken } from '../lib/jwt.js';

/**
 * Verifikasi JWT dari Authorization header atau cookie.
 * Attach req.user = { id, email, role, name }
 */
export function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: 'Token tidak ditemukan.' });

    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token tidak valid atau sudah kedaluwarsa.' });
  }
}

/**
 * Hanya untuk admin / superadmin
 */
export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!['admin', 'superadmin'].includes(req.user?.role)) {
      return res.status(403).json({ error: 'Akses ditolak. Hanya admin yang diizinkan.' });
    }
    next();
  });
}

/**
 * Hanya superadmin
 */
export function requireSuperAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Akses ditolak. Hanya superadmin.' });
    }
    next();
  });
}

function extractToken(req) {
  // 1. Authorization: Bearer <token>
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);

  // 2. httpOnly cookie fallback
  if (req.cookies?.access_token) return req.cookies.access_token;

  return null;
}
