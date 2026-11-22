import { Router } from 'express';
import { nanoid } from 'nanoid';
import pool, { formatPayment, formatOrder } from '../store/database.js';
import { ORDER_STATUSES, PAYMENT_METHODS, BILLING_CYCLES } from '@atur-in/shared';

const router = Router();

// ─── Create payment bill (POST /api/orders/:id/payments) ──────────────────────
router.post('/:id/payments', async (req, res, next) => {
  try {
    const cleanId = req.params.id.replace(/^#/, '');
    const { rows } = await pool.query(
      'SELECT * FROM orders WHERE id = $1 OR UPPER(ref_number) = UPPER($1) LIMIT 1',
      [cleanId]
    );
    const order = rows[0];
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });

    const canPay =
      [ORDER_STATUSES.MENUNGGU_PEMBAYARAN, ORDER_STATUSES.KEDALUWARSA].includes(order.status) ||
      Boolean(order.is_trial);

    if (!canPay) {
      return res.status(400).json({ error: 'Pesanan sudah dibayar.' });
    }

    const { metode = PAYMENT_METHODS.QRIS } = req.body;
    const id = `pay-${nanoid(10)}`;
    const billNumber = `INV-${order.ref_number}-${Date.now()}`;
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const billAmount = Number(order.total) > 0
      ? Number(order.total)
      : Number(order.recurring_total || 25000);

    const qrPayload = [PAYMENT_METHODS.QRIS, PAYMENT_METHODS.EWALLET].includes(metode)
      ? `00020101021126570011ID.DANA.WWW011893600915300123456789520411115303360540${billAmount}5802ID5913Atur-in Demo6007Jakarta6105123456304ABCD`
      : null;
    const vaNumber = metode === PAYMENT_METHODS.VA
      ? `880-0000-${String(billAmount).slice(0, 6)}`
      : metode === PAYMENT_METHODS.EWALLET
      ? `0812-0000-${String(billAmount).slice(0, 4)}`
      : null;

    if (order.status === ORDER_STATUSES.KEDALUWARSA) {
      await pool.query(
        'UPDATE orders SET status = $1, payment_method = $2, updated_at = $3 WHERE id = $4',
        [ORDER_STATUSES.MENUNGGU_PEMBAYARAN, metode, now, order.id]
      );
    } else {
      await pool.query(
        'UPDATE orders SET payment_method = $1, updated_at = $2 WHERE id = $3',
        [metode, now, order.id]
      );
    }

    await pool.query(
      `INSERT INTO payments (id, order_id, method, bill_number, status, qr_payload, va_number, amount, expires_at, created_at)
       VALUES ($1,$2,$3,$4,'pending',$5,$6,$7,$8,$9)`,
      [id, order.id, metode, billNumber, qrPayload, vaNumber, billAmount, expiresAt, now]
    );

    res.status(201).json({
      id,
      orderId: order.id,
      metode,
      method: metode,
      nomorTagihan: billNumber,
      amount: billAmount,
      status: 'pending',
      qrPayload,
      vaNumber,
      expiresAt,
    });
  } catch (err) { next(err); }
});

// ─── Get payment status ───────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM payments WHERE id = $1', [req.params.id]);
    const pay = rows[0];
    if (!pay) return res.status(404).json({ error: 'Tagihan tidak ditemukan.' });
    res.json(formatPayment(pay));
  } catch (err) { next(err); }
});

// ─── Simulate paid (prototype / demo) ─────────────────────────────────────────
router.post('/:id/simulate-paid', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM payments WHERE id = $1', [req.params.id]);
    const pay = rows[0];
    if (!pay) return res.status(404).json({ error: 'Tagihan tidak ditemukan.' });

    const now = new Date();
    const nowIso = now.toISOString();
    await pool.query(
      'UPDATE payments SET status = $1, paid_at = $2 WHERE id = $3',
      ['paid', nowIso, pay.id]
    );

    const { rows: orderRows } = await pool.query('SELECT * FROM orders WHERE id = $1', [pay.order_id]);
    const order = orderRows[0];

    let updatedOrder = null;
    if (order) {
      const paidAmount = Number(pay.amount || order.recurring_total || order.total || 0);
      const durationDays = order.billing_cycle === BILLING_CYCLES.SEMESTER ? 180 : 30;
      const subEndsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();
      const nextStatus = [ORDER_STATUSES.PROSES_SETUP, ORDER_STATUSES.SELESAI].includes(order.status)
        ? order.status
        : ORDER_STATUSES.DIVERIFIKASI;

      await pool.query(
        `UPDATE orders
         SET status = $1, is_trial = FALSE, total = $2, subscription_ends_at = $3, payment_method = $4, updated_at = $5
         WHERE id = $6`,
        [nextStatus, paidAmount, subEndsAt, pay.method, nowIso, order.id]
      );

      await pool.query(
        `INSERT INTO order_logs (id, order_id, status, note, changed_by, created_at)
         VALUES ($1,$2,$3,$4,'system',$5)`,
        [nanoid(), order.id, ORDER_STATUSES.DIBAYAR, 'Pembayaran langganan diterima.', nowIso]
      );
      await pool.query(
        `INSERT INTO order_logs (id, order_id, status, note, changed_by, created_at)
         VALUES ($1,$2,$3,$4,'system',$5)`,
        [nanoid(), order.id, nextStatus, 'Langganan penuh diverifikasi & diaktifkan otomatis.', new Date(now.getTime() + 500).toISOString()]
      );

      const { rows: refreshed } = await pool.query('SELECT * FROM orders WHERE id = $1', [order.id]);
      updatedOrder = formatOrder(refreshed[0]);
    }

    res.json({
      payment: formatPayment({ ...pay, status: 'paid', paid_at: nowIso }),
      order: updatedOrder,
    });
  } catch (err) { next(err); }
});

// ─── Simulate expired ─────────────────────────────────────────────────────────
router.post('/:id/simulate-expired', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM payments WHERE id = $1', [req.params.id]);
    const pay = rows[0];
    if (!pay) return res.status(404).json({ error: 'Tagihan tidak ditemukan.' });

    await pool.query('UPDATE payments SET status = $1 WHERE id = $2', ['expired', pay.id]);
    await pool.query(
      'UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3 AND is_trial = FALSE',
      [ORDER_STATUSES.KEDALUWARSA, new Date().toISOString(), pay.order_id]
    );

    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
