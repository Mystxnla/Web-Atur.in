import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../store/database.js';
import { requireAuth } from '../middleware/auth.js';
import { ORDER_STATUSES, PAYMENT_METHODS } from '@atur-in/shared';

const router = Router();

// ─── Create payment bill ──────────────────────────────────────────────────────
router.post('/orders/:id/payments', (req, res, next) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });

    if (![ORDER_STATUSES.MENUNGGU_PEMBAYARAN, ORDER_STATUSES.KEDALUWARSA].includes(order.status)) {
      return res.status(400).json({ error: 'Pesanan sudah dibayar.' });
    }

    const { metode = PAYMENT_METHODS.QRIS } = req.body;
    const id = `pay-${nanoid(10)}`;
    const billNumber = `INV-${order.ref_number}-${Date.now()}`;
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const qrPayload = metode === PAYMENT_METHODS.QRIS
      ? `00020101021126570011ID.DANA.WWW011893600915300123456789520411115303360540${order.total}5802ID5913Atur-in Demo6007Jakarta6105123456304ABCD`
      : null;
    const vaNumber = metode === PAYMENT_METHODS.VA
      ? `880-0000-${String(order.total).slice(0, 6)}`
      : null;

    // Reset jika expired
    db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
      .run(ORDER_STATUSES.MENUNGGU_PEMBAYARAN, now, order.id);

    db.prepare(`
      INSERT INTO payments (id, order_id, method, bill_number, status, qr_payload, va_number, expires_at, created_at)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(id, order.id, metode, billNumber, 'pending', qrPayload, vaNumber, expiresAt, now);

    res.status(201).json({
      id, orderId: order.id, metode, nomorTagihan: billNumber,
      status: 'pending', qrPayload, vaNumber, expiresAt,
    });
  } catch (err) { next(err); }
});

// ─── Get payment status ───────────────────────────────────────────────────────
router.get('/:id', (req, res, next) => {
  try {
    const pay = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
    if (!pay) return res.status(404).json({ error: 'Tagihan tidak ditemukan.' });
    res.json(pay);
  } catch (err) { next(err); }
});

// ─── Simulate paid (prototype only) ──────────────────────────────────────────
router.post('/:id/simulate-paid', (req, res, next) => {
  try {
    const pay = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
    if (!pay) return res.status(404).json({ error: 'Tagihan tidak ditemukan.' });

    const now = new Date().toISOString();
    db.prepare('UPDATE payments SET status = ?, paid_at = ? WHERE id = ?').run('paid', now, pay.id);

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(pay.order_id);
    if (order) {
      db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
        .run(ORDER_STATUSES.DIVERIFIKASI, now, order.id);
      db.prepare(`
        INSERT INTO order_logs (id, order_id, status, note, changed_by, created_at)
        VALUES (?,?,?,?,?,?)
      `).run(nanoid(), order.id, ORDER_STATUSES.DIBAYAR, 'Pembayaran diterima (simulasi).', 'system', now);
      db.prepare(`
        INSERT INTO order_logs (id, order_id, status, note, changed_by, created_at)
        VALUES (?,?,?,?,?,?)
      `).run(nanoid(), order.id, ORDER_STATUSES.DIVERIFIKASI, 'Diverifikasi otomatis.', 'system', now);
    }

    res.json({ payment: { ...pay, status: 'paid' }, order: db.prepare('SELECT * FROM orders WHERE id = ?').get(pay.order_id) });
  } catch (err) { next(err); }
});

// ─── Simulate expired ─────────────────────────────────────────────────────────
router.post('/:id/simulate-expired', (req, res, next) => {
  try {
    const pay = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
    if (!pay) return res.status(404).json({ error: 'Tagihan tidak ditemukan.' });

    db.prepare('UPDATE payments SET status = ? WHERE id = ?').run('expired', pay.id);
    db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
      .run(ORDER_STATUSES.KEDALUWARSA, new Date().toISOString(), pay.order_id);

    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
