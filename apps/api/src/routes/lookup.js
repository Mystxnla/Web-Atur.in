import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../store/db.js';

const router = Router();

// Simple rate-limit map: noWhatsapp -> { count, resetAt }
const rateLimitMap = new Map();
const MAX_ATTEMPTS = 3;
const WINDOW_MS = 10 * 60 * 1000;

function checkRateLimit(noWa) {
  const now = Date.now();
  const entry = rateLimitMap.get(noWa);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(noWa, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return Math.ceil((entry.resetAt - now) / 1000);
  }
  entry.count += 1;
  return null;
}

// POST /api/lookup/request-otp
router.post('/request-otp', (req, res) => {
  const { noWhatsapp, nomorReferensi } = req.body;
  if (!noWhatsapp) return res.status(400).json({ error: 'Nomor WhatsApp wajib diisi.' });

  // normalize
  const normalized = noWhatsapp.replace(/\D/g, '').replace(/^0/, '').replace(/^62/, '');

  const retryAfter = checkRateLimit(normalized);
  if (retryAfter) {
    return res.status(429).json({ code: 'rate_limited', retryAfter, error: `Terlalu banyak percobaan. Coba lagi dalam ${retryAfter} detik.` });
  }

  // Check if customer with this number exists
  const customer = db.customers.find((c) => c.noWhatsapp === normalized);
  if (!customer) {
    return res.status(404).json({ code: 'phone_not_found', error: 'Nomor WhatsApp tidak ditemukan dalam pesanan manapun.' });
  }

  // Also filter by ref if provided
  let orders = db.orders.filter((o) => o.customerId === customer.id);
  if (nomorReferensi) {
    const clean = nomorReferensi.replace(/^#/, '').toUpperCase();
    orders = orders.filter((o) => o.id.toUpperCase() === clean);
    if (orders.length === 0) {
      return res.status(404).json({ code: 'ref_not_found', error: 'Nomor referensi tidak cocok.' });
    }
  }

  const requestId = nanoid(16);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const resendAt = new Date(Date.now() + 60 * 1000).toISOString();
  const maskedWa = `+62 ***-***-${normalized.slice(-4)}`;

  // OTP always 123456 in demo
  db.otpRequests.push({
    requestId,
    noWhatsapp: normalized,
    customerId: customer.id,
    otp: '123456',
    expiresAt,
    verified: false,
  });

  console.log(`[OTP] Demo OTP for ${maskedWa}: 123456`);

  res.json({ requestId, expiresAt, resendAt, maskedWa });
});

// POST /api/lookup/verify-otp
router.post('/verify-otp', (req, res) => {
  const { requestId, otp } = req.body;
  if (!requestId || !otp) return res.status(400).json({ error: 'requestId dan otp wajib.' });

  const otpReq = db.otpRequests.find((r) => r.requestId === requestId);
  if (!otpReq) return res.status(404).json({ error: 'Permintaan OTP tidak ditemukan.' });

  if (new Date() > new Date(otpReq.expiresAt)) {
    return res.status(410).json({ code: 'otp_expired', error: 'Kode OTP sudah kedaluwarsa.' });
  }

  if (otp !== otpReq.otp) {
    return res.status(401).json({ code: 'otp_invalid', error: 'Kode OTP tidak sesuai.' });
  }

  otpReq.verified = true;
  const sessionToken = nanoid(32);

  const customer = db.customers.find((c) => c.id === otpReq.customerId);
  const orders = db.orders
    .filter((o) => o.customerId === otpReq.customerId)
    .map((o) => ({
      id: o.id,
      nomorReferensi: o.nomorReferensi,
      packageId: o.packageId,
      status: o.status,
      totalTagihan: o.totalTagihan,
      dibuatPada: o.dibuatPada,
    }));

  res.json({ sessionToken, customer, orders });
});

export default router;
