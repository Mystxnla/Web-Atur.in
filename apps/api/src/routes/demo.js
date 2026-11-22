import { Router } from 'express';
import pool, { formatOrder, formatPayment, seedSampleOrder } from '../store/database.js';
import { ORDER_STATUSES } from '@atur-in/shared';
import { nanoid } from 'nanoid';

const router = Router();

// GET /api/demo/state — return full db snapshot for Demo Panel
router.get('/state', async (req, res, next) => {
  try {
    const { rows: orders } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 20');
    const { rows: payments } = await pool.query('SELECT * FROM payments ORDER BY created_at DESC LIMIT 20');
    const { rows: leads } = await pool.query('SELECT * FROM leads ORDER BY created_at DESC LIMIT 20');

    res.json({
      orders: orders.map((o) => formatOrder(o)),
      payments: payments.map(formatPayment),
      leads,
    });
  } catch (err) { next(err); }
});

// POST /api/demo/advance-order/:id — advance order to next status
router.post('/advance-order/:id', async (req, res, next) => {
  try {
    const cleanId = req.params.id.replace(/^#/, '');
    const { rows } = await pool.query(
      'SELECT * FROM orders WHERE id = $1 OR UPPER(ref_number) = UPPER($1) LIMIT 1',
      [cleanId]
    );
    const order = rows[0];
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });

    const progression = [
      ORDER_STATUSES.MENUNGGU_PEMBAYARAN,
      ORDER_STATUSES.DIBAYAR,
      ORDER_STATUSES.DIVERIFIKASI,
      ORDER_STATUSES.PROSES_SETUP,
      ORDER_STATUSES.SELESAI,
    ];

    const currentIdx = progression.indexOf(order.status);
    if (currentIdx === -1 || currentIdx === progression.length - 1) {
      return res.status(400).json({ error: 'Status sudah final atau tidak diketahui.' });
    }

    const nextStatus = progression[currentIdx + 1];
    const now = new Date().toISOString();

    await pool.query(
      'UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3',
      [nextStatus, now, order.id]
    );
    await pool.query(
      `INSERT INTO order_logs (id, order_id, status, note, changed_by, created_at)
       VALUES ($1, $2, $3, $4, 'demo-panel', $5)`,
      [nanoid(), order.id, nextStatus, 'Status dimajukan lewat Demo Panel.', now]
    );

    const { rows: updated } = await pool.query('SELECT * FROM orders WHERE id = $1', [order.id]);
    res.json({ order: formatOrder(updated[0]), nextStatus });
  } catch (err) { next(err); }
});

// POST /api/demo/reset — reset db to seed state
router.post('/reset', async (req, res, next) => {
  try {
    await pool.query("DELETE FROM orders WHERE ref_number != 'DWA-2026-0001'");
    await pool.query("UPDATE orders SET status = $1 WHERE ref_number = 'DWA-2026-0001'", [ORDER_STATUSES.PROSES_SETUP]);
    await pool.query('DELETE FROM leads');
    await pool.query('DELETE FROM otp_requests');
    await seedSampleOrder();

    res.json({ success: true, message: 'Demo data di Supabase direset ke kondisi awal.' });
  } catch (err) { next(err); }
});

export default router;
