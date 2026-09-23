import { Router } from 'express';
import { db } from '../store/db.js';
import { ORDER_STATUSES } from '@atur-in/shared';
import { nanoid } from 'nanoid';

const router = Router();

// GET /api/demo/state — return full db snapshot for Demo Panel
router.get('/state', (req, res) => {
  res.json({
    orders: db.orders,
    customers: db.customers,
    payments: db.payments,
    leads: db.leads,
  });
});

// POST /api/demo/advance-order/:id — advance order to next status
router.post('/advance-order/:id', (req, res) => {
  const order = db.orders.find((o) => o.id === req.params.id);
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
  order.status = nextStatus;
  const now = new Date().toISOString();
  db.statusLogs.push({ id: nanoid(), orderId: order.id, status: nextStatus, catatan: 'Status dimajukan lewat Demo Panel.', diperbuatPada: now });

  res.json({ order, nextStatus });
});

// POST /api/demo/reset — reset db to seed state
router.post('/reset', async (req, res) => {
  // Reload seed data
  const { db: dbModule } = await import('../store/db.js');
  // Just truncate non-seed data
  db.orders = db.orders.filter((o) => o.id === 'DWA-2026-0001');
  db.customers = db.customers.filter((c) => c.id === 'cust-seed-1');
  db.payments = [];
  db.leads = [];
  db.otpRequests = [];

  res.json({ success: true, message: 'Demo data direset ke kondisi awal.' });
});

export default router;
