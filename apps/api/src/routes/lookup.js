import { Router } from 'express';
import { nanoid } from 'nanoid';
import pool, { formatOrder } from '../store/database.js';

const router = Router();

// Simple rate-limit map: noWhatsapp -> { count, resetAt }
const rateLimitMap = new Map();
const MAX_ATTEMPTS = 5;
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
router.post('/request-otp', async (req, res, next) => {
  try {
    const { noWhatsapp, nomorReferensi } = req.body;
    if (!noWhatsapp) return res.status(400).json({ error: 'Nomor WhatsApp wajib diisi.' });

    const normalized = noWhatsapp.replace(/\D/g, '').replace(/^0/, '').replace(/^62/, '');

    const retryAfter = checkRateLimit(normalized);
    if (retryAfter) {
      return res.status(429).json({
        code: 'rate_limited',
        retryAfter,
        error: `Terlalu banyak percobaan. Coba lagi dalam ${retryAfter} detik.`,
      });
    }

    const { rows: matchingOrders } = await pool.query(
      'SELECT * FROM orders WHERE whatsapp = $1 ORDER BY created_at DESC',
      [normalized]
    );

    if (matchingOrders.length === 0) {
      return res.status(404).json({
        code: 'phone_not_found',
        error: 'Nomor WhatsApp tidak ditemukan dalam pesanan manapun.',
      });
    }

    let cleanRef = null;
    if (nomorReferensi) {
      cleanRef = nomorReferensi.replace(/^#/, '').trim().toUpperCase();
      const filtered = matchingOrders.filter(
        (o) => o.ref_number.toUpperCase() === cleanRef || o.id.toUpperCase() === cleanRef
      );
      if (filtered.length === 0) {
        return res.status(404).json({
          code: 'ref_not_found',
          error: 'Nomor referensi tidak cocok dengan nomor WhatsApp tersebut.',
        });
      }
    }

    const requestId = nanoid(16);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const resendAt = new Date(Date.now() + 60 * 1000).toISOString();
    const maskedWa = `+62 ***-***-${normalized.slice(-4)}`;

    await pool.query(
      `INSERT INTO otp_requests (request_id, no_whatsapp, nomor_referensi, otp, verified, expires_at)
       VALUES ($1, $2, $3, '123456', FALSE, $4)`,
      [requestId, normalized, cleanRef, expiresAt]
    );

    console.log(`[OTP] Demo OTP for ${maskedWa}: 123456`);

    res.json({ requestId, expiresAt, resendAt, maskedWa });
  } catch (err) { next(err); }
});

// POST /api/lookup/verify-otp
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { requestId, otp } = req.body;
    if (!requestId || !otp) return res.status(400).json({ error: 'requestId dan otp wajib.' });

    const { rows } = await pool.query(
      'SELECT * FROM otp_requests WHERE request_id = $1',
      [requestId]
    );
    const otpReq = rows[0];
    if (!otpReq) return res.status(404).json({ error: 'Permintaan OTP tidak ditemukan.' });

    if (new Date() > new Date(otpReq.expires_at)) {
      return res.status(410).json({ code: 'otp_expired', error: 'Kode OTP sudah kedaluwarsa.' });
    }

    if (otp !== otpReq.otp) {
      return res.status(401).json({ code: 'otp_invalid', error: 'Kode OTP tidak sesuai.' });
    }

    await pool.query('UPDATE otp_requests SET verified = TRUE WHERE request_id = $1', [requestId]);
    const sessionToken = nanoid(32);

    const { rows: orderRows } = await pool.query(
      'SELECT * FROM orders WHERE whatsapp = $1 ORDER BY created_at DESC',
      [otpReq.no_whatsapp]
    );

    const filteredOrders = otpReq.nomor_referensi
      ? orderRows.filter(
          (o) =>
            o.ref_number.toUpperCase() === otpReq.nomor_referensi ||
            o.id.toUpperCase() === otpReq.nomor_referensi
        )
      : orderRows;

    const firstOrder = filteredOrders[0] ?? orderRows[0];
    const customer = firstOrder
      ? {
          id: firstOrder.user_id ?? `cust-${firstOrder.id}`,
          namaLengkap: firstOrder.name,
          email: firstOrder.email,
          noWhatsapp: firstOrder.whatsapp,
          namaKelompok: firstOrder.group_name,
        }
      : null;

    const orders = filteredOrders.map((o) => formatOrder(o));

    res.json({ sessionToken, customer, orders });
  } catch (err) { next(err); }
});

export default router;
