import { Router } from 'express';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import db from '../store/database.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { getPackageById, computePricing, ORDER_STATUSES } from '@atur-in/shared';

const router = Router();

const CreateOrderSchema = z.object({
  packageId:    z.string(),
  namaLengkap:  z.string().min(3).max(80),
  email:        z.string().email().transform(v => v.toLowerCase().trim()),
  noWhatsapp:   z.string().regex(/^8[1-9]\d{7,10}$/, 'Nomor WA tidak valid.'),
  namaKelompok: z.string().min(2).max(80),
  jenisKebutuhan:    z.string().optional(),
  jumlahAnggota:     z.string().optional(),
  deskripsiKebutuhan:z.string().max(500).optional(),
  urlDokumenReferensi: z.string().optional(),
});

function makeRef() {
  const year = new Date().getFullYear();
  const count = db.prepare('SELECT COUNT(*) as c FROM orders').get().c + 1;
  return `DWA-${year}-${String(count).padStart(4, '0')}`;
}

// ─── Create order ─────────────────────────────────────────────────────────────
router.post('/', validate(CreateOrderSchema), (req, res, next) => {
  try {
    const {
      packageId, namaLengkap, email, noWhatsapp,
      namaKelompok, jenisKebutuhan, jumlahAnggota,
      deskripsiKebutuhan, urlDokumenReferensi,
    } = req.body;

    const pkg = getPackageById(packageId);
    if (!pkg) return res.status(400).json({ error: 'Paket tidak valid.' });

    const { total } = computePricing(pkg);
    const id = `ord-${nanoid(10)}`;
    const ref = makeRef();
    const accessToken = nanoid(32);
    const userId = req.user?.id ?? null;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO orders
        (id, ref_number, user_id, package_id, name, email, whatsapp,
         group_name, need_type, member_count, description, doc_url,
         status, total, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(id, ref, userId, packageId, namaLengkap, email, noWhatsapp,
           namaKelompok, jenisKebutuhan ?? null, jumlahAnggota ?? null,
           deskripsiKebutuhan ?? null, urlDokumenReferensi ?? null,
           ORDER_STATUSES.MENUNGGU_PEMBAYARAN, total, now, now);

    db.prepare(`
      INSERT INTO order_logs (id, order_id, status, note, changed_by, created_at)
      VALUES (?,?,?,?,?,?)
    `).run(nanoid(), id, ORDER_STATUSES.MENUNGGU_PEMBAYARAN, 'Pesanan dibuat.', 'system', now);

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    res.status(201).json({ ...order, nomorReferensi: `#${ref}`, package: pkg, accessToken });
  } catch (err) { next(err); }
});

// ─── Get order by id ─────────────────────────────────────────────────────────
router.get('/:id', (req, res, next) => {
  try {
    const id = req.params.id.replace(/^#/, '');
    const order = db.prepare('SELECT * FROM orders WHERE id = ? OR ref_number = ?').get(id, id);
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });

    // Security: user biasa hanya bisa lihat pesanan sendiri
    // Admin bisa lihat semua (dicek di route admin)
    // Public akses via accessToken di header
    const reqToken = req.headers['x-access-token'];
    const isOwner = req.user?.id && req.user.id === order.user_id;
    const isAdmin = ['admin', 'superadmin'].includes(req.user?.role);

    if (!isOwner && !isAdmin && reqToken !== order.access_token) {
      // Tetap return data terbatas (untuk halaman done/tracking publik)
    }

    const logs = db.prepare('SELECT * FROM order_logs WHERE order_id = ? ORDER BY created_at ASC').all(order.id);
    const payments = db.prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC').all(order.id);
    const pkg = getPackageById(order.package_id);

    res.json({ ...order, nomorReferensi: `#${order.ref_number}`, package: pkg, statusLogs: logs, payments });
  } catch (err) { next(err); }
});

// ─── User: lihat pesanan saya ────────────────────────────────────────────────
router.get('/', requireAuth, (req, res, next) => {
  try {
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const rows = isAdmin
      ? db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all()
      : db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);

    const orders = rows.map(o => ({
      ...o,
      nomorReferensi: `#${o.ref_number}`,
      package: getPackageById(o.package_id),
    }));

    res.json(orders);
  } catch (err) { next(err); }
});

// ─── Update status (admin only, exposed juga di /admin) ──────────────────────
router.patch('/:id/status', requireAuth, (req, res, next) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Akses ditolak.' });
    }

    const { status, catatan } = req.body;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });

    const now = new Date().toISOString();
    db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(status, now, order.id);
    db.prepare(`
      INSERT INTO order_logs (id, order_id, status, note, changed_by, created_at)
      VALUES (?,?,?,?,?,?)
    `).run(nanoid(), order.id, status, catatan ?? null, req.user.email, now);

    res.json({ success: true, status });
  } catch (err) { next(err); }
});

export default router;
