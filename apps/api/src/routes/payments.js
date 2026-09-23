import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../store/db.js';
import { ORDER_STATUSES, PAYMENT_METHODS } from '@atur-in/shared';

const router = Router();

// POST /api/orders/:id/payments — create payment bill
router.post('/orders/:id/payments', (req, res) => {
  const order = db.orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });

  if (order.status !== ORDER_STATUSES.MENUNGGU_PEMBAYARAN && order.status !== ORDER_STATUSES.KEDALUWARSA) {
    return res.status(400).json({ error: 'Pesanan sudah dibayar atau tidak valid.' });
  }

  const { metode = PAYMENT_METHODS.QRIS } = req.body;
  const paymentId = `pay-${nanoid(8)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

  // Reset status to waiting if it was expired
  order.status = ORDER_STATUSES.MENUNGGU_PEMBAYARAN;
  order.metodePembayaran = metode;

  const payment = {
    id: paymentId,
    orderId: order.id,
    metode,
    nomorTagihan: `INV-${order.id}-${Date.now()}`,
    status: 'pending',
    expiresAt,
    qrPayload: metode === PAYMENT_METHODS.QRIS ? `00020101021126570011ID.DANA.WWW011893600915300123456789520411115303360540${order.totalTagihan}5802ID5913Atur-in Demo6007Jakarta6105123456304ABCD` : null,
    vaNumber: metode === PAYMENT_METHODS.VA ? `880-0000-${String(order.totalTagihan).slice(0, 6)}` : null,
    ewalletLink: metode === PAYMENT_METHODS.EWALLET ? `https://example.com/pay/demo` : null,
    dibuatPada: now.toISOString(),
  };

  db.payments.push(payment);

  res.status(201).json(payment);
});

// GET /api/payments/:id — poll payment status
router.get('/:id', (req, res) => {
  const payment = db.payments.find((p) => p.id === req.params.id);
  if (!payment) return res.status(404).json({ error: 'Tagihan tidak ditemukan.' });
  res.json(payment);
});

// POST /api/payments/:id/simulate-paid — demo only
router.post('/:id/simulate-paid', (req, res) => {
  const payment = db.payments.find((p) => p.id === req.params.id);
  if (!payment) return res.status(404).json({ error: 'Tagihan tidak ditemukan.' });

  payment.status = 'paid';
  payment.waktuBayar = new Date().toISOString();

  const order = db.orders.find((o) => o.id === payment.orderId);
  if (order) {
    order.status = ORDER_STATUSES.DIBAYAR;
    const now = new Date().toISOString();
    db.statusLogs.push({ id: nanoid(), orderId: order.id, status: ORDER_STATUSES.DIBAYAR, catatan: 'Pembayaran diterima (simulasi).', diperbuatPada: now });

    // auto-verify after short delay simulation — set immediately for prototype
    order.status = ORDER_STATUSES.DIVERIFIKASI;
    db.statusLogs.push({ id: nanoid(), orderId: order.id, status: ORDER_STATUSES.DIVERIFIKASI, catatan: 'Pembayaran diverifikasi otomatis.', diperbuatPada: now });
  }

  res.json({ payment, order });
});

// POST /api/payments/:id/simulate-expired — demo only
router.post('/:id/simulate-expired', (req, res) => {
  const payment = db.payments.find((p) => p.id === req.params.id);
  if (!payment) return res.status(404).json({ error: 'Tagihan tidak ditemukan.' });

  payment.status = 'expired';
  const order = db.orders.find((o) => o.id === payment.orderId);
  if (order) {
    order.status = ORDER_STATUSES.KEDALUWARSA;
  }

  res.json({ payment, order });
});

export default router;
