import { Router } from 'express';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import pool, { formatOrder } from '../store/database.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  getPackageById,
  computePricing,
  ORDER_STATUSES,
  BILLING_CYCLES,
  FREE_TRIAL_DAYS,
} from '@atur-in/shared';

const router = Router();

const CreateOrderSchema = z.object({
  packageId:           z.string(),
  billingCycle:        z.enum([BILLING_CYCLES.MONTHLY, BILLING_CYCLES.SEMESTER]).optional().default(BILLING_CYCLES.MONTHLY),
  isTrial:             z.boolean().optional().default(false),
  namaLengkap:         z.string().min(3).max(80),
  email:               z.string().email().transform(v => v.toLowerCase().trim()),
  noWhatsapp:          z.string().regex(/^8[1-9]\d{7,11}$/, 'Nomor WA tidak valid.'),
  namaKelompok:        z.string().min(2).max(80),
  jenisKebutuhan:      z.string().optional(),
  jumlahAnggota:       z.string().optional(),
  deskripsiKebutuhan:  z.string().max(500).optional(),
  urlDokumenReferensi: z.string().optional().nullable(),
});

async function makeRef() {
  const year = new Date().getFullYear();
  const { rows } = await pool.query('SELECT COUNT(*)::int as c FROM orders');
  const count = (rows[0]?.c ?? 0) + 1;
  const candidate = `DWA-${year}-${String(count).padStart(4, '0')}`;
  // Fallback if collision after delete
  const { rows: exists } = await pool.query('SELECT id FROM orders WHERE ref_number = $1', [candidate]);
  if (exists.length > 0) {
    return `DWA-${year}-${String(count).padStart(4, '0')}-${nanoid(3).toUpperCase()}`;
  }
  return candidate;
}

// ─── Create order ─────────────────────────────────────────────────────────────
router.post('/', validate(CreateOrderSchema), async (req, res, next) => {
  try {
    const {
      packageId, billingCycle, isTrial,
      namaLengkap, email, noWhatsapp,
      namaKelompok, jenisKebutuhan, jumlahAnggota,
      deskripsiKebutuhan, urlDokumenReferensi,
    } = req.body;

    const pkg = getPackageById(packageId);
    if (!pkg) return res.status(400).json({ error: 'Paket tidak valid.' });

    const effectiveTrial = Boolean(isTrial && pkg.hasTrial);

    // Validasi 1x klaim Free Trial per nomor WhatsApp atau Email
    if (effectiveTrial) {
      const { rows: claimed } = await pool.query(
        'SELECT id, ref_number FROM orders WHERE is_trial = TRUE AND (LOWER(email) = $1 OR whatsapp = $2) LIMIT 1',
        [email.toLowerCase(), noWhatsapp]
      );
      if (claimed.length > 0) {
        return res.status(409).json({
          code: 'trial_already_used',
          error: 'Nomor WhatsApp atau Email ini sudah pernah menggunakan Free Trial 7 Hari. Silakan gunakan opsi Langsung Berlangganan.',
        });
      }
    }

    const { total, recurringTotal } = computePricing(pkg, { billingCycle, isTrial: effectiveTrial });
    const id = `ord-${nanoid(10)}`;
    const ref = await makeRef();
    const accessToken = nanoid(32);
    const userId = req.user?.id ?? null;
    const now = new Date();
    const nowIso = now.toISOString();

    const trialEndsAt = effectiveTrial
      ? new Date(now.getTime() + (pkg.trialDays ?? FREE_TRIAL_DAYS) * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const initialStatus = effectiveTrial
      ? ORDER_STATUSES.PROSES_SETUP
      : ORDER_STATUSES.MENUNGGU_PEMBAYARAN;

    await pool.query(
      `INSERT INTO orders (
        id, ref_number, user_id, package_id, billing_cycle, is_trial, trial_ends_at,
        recurring_total, name, email, whatsapp, group_name, need_type, member_count,
        description, doc_url, status, total, payment_method, access_token, created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22
      )`,
      [
        id, ref, userId, packageId, billingCycle, effectiveTrial, trialEndsAt,
        recurringTotal, namaLengkap, email, noWhatsapp, namaKelompok,
        jenisKebutuhan ?? null, jumlahAnggota ?? null,
        deskripsiKebutuhan ?? null, urlDokumenReferensi ?? null,
        initialStatus, total, effectiveTrial ? 'free_trial' : 'qris', accessToken, nowIso, nowIso,
      ]
    );

    if (effectiveTrial) {
      await pool.query(
        `INSERT INTO order_logs (id, order_id, status, note, changed_by, created_at)
         VALUES ($1, $2, $3, $4, 'system', $5)`,
        [
          nanoid(),
          id,
          ORDER_STATUSES.DIVERIFIKASI,
          'Free Trial 7 Hari berhasil diklaim (Rp 0).',
          nowIso,
        ]
      );
      await pool.query(
        `INSERT INTO order_logs (id, order_id, status, note, changed_by, created_at)
         VALUES ($1, $2, $3, $4, 'system', $5)`,
        [
          nanoid(),
          id,
          ORDER_STATUSES.PROSES_SETUP,
          'Masa Free Trial aktif! Tim arsitek mulai menyiapkan workspace kamu.',
          new Date(now.getTime() + 1000).toISOString(),
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO order_logs (id, order_id, status, note, changed_by, created_at)
         VALUES ($1, $2, $3, $4, 'system', $5)`,
        [nanoid(), id, ORDER_STATUSES.MENUNGGU_PEMBAYARAN, 'Pesanan dibuat.', nowIso]
      );
    }

    const { rows: createdRows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    const { rows: logs } = await pool.query('SELECT * FROM order_logs WHERE order_id = $1 ORDER BY created_at ASC', [id]);

    res.status(201).json(formatOrder(createdRows[0], logs, []));
  } catch (err) { next(err); }
});

// ─── Get order by id or ref_number ───────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const cleanId = req.params.id.replace(/^#/, '');
    const { rows } = await pool.query(
      'SELECT * FROM orders WHERE id = $1 OR UPPER(ref_number) = UPPER($1) LIMIT 1',
      [cleanId]
    );
    const order = rows[0];
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });

    const { rows: logs } = await pool.query(
      'SELECT * FROM order_logs WHERE order_id = $1 ORDER BY created_at ASC',
      [order.id]
    );
    const { rows: payments } = await pool.query(
      'SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC',
      [order.id]
    );

    res.json(formatOrder(order, logs, payments));
  } catch (err) { next(err); }
});

// ─── User: lihat pesanan saya ────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const { rows } = isAdmin
      ? await pool.query('SELECT * FROM orders ORDER BY created_at DESC')
      : await pool.query(
          'SELECT * FROM orders WHERE user_id = $1 OR LOWER(email) = LOWER($2) ORDER BY created_at DESC',
          [req.user.id, req.user.email]
        );

    res.json(rows.map((o) => formatOrder(o)));
  } catch (err) { next(err); }
});

// ─── Update status ───────────────────────────────────────────────────────────
router.patch('/:id/status', requireAuth, async (req, res, next) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Akses ditolak.' });
    }

    const { status, catatan } = req.body;
    const { rows } = await pool.query(
      'SELECT * FROM orders WHERE id = $1 OR ref_number = $1',
      [req.params.id]
    );
    const order = rows[0];
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });

    const now = new Date().toISOString();
    await pool.query(
      'UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3',
      [status, now, order.id]
    );
    await pool.query(
      `INSERT INTO order_logs (id, order_id, status, note, changed_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [nanoid(), order.id, status, catatan ?? null, req.user.email, now]
    );

    res.json({ success: true, status });
  } catch (err) { next(err); }
});

export default router;
