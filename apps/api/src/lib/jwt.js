import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET  ?? 'dev-access-secret-change-in-prod';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-in-prod';
const ACCESS_EXPIRY  = '15m';
const REFRESH_EXPIRY = '7d';

export function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshExpiresAt() {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
}
