import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../store/db.js';
import { ORDER_STATUSES, getPackageById, computePricing } from '@atur-in/shared';

const router = Router();

function makeOrderRef() {
  const year = new Date().getFullYear();
  const seq = String(db.orders.length + 1).padStart(4, '0');
  return `DWA-${year}-${seq}`;
}

// POST /api/orders — create new order
router.post('/', (req, res) => {
  const {
    packageId,
    namaLengkap,
    email,
    noWhatsapp,
    namaKelompok,
    jenisKebutuhan,
    jumlahAnggota,
    deskripsiKebutuhan,
    urlDokumenReferensi,
  } = req.body;

  if (!packageId || !namaLengkap || !email || !noWhatsapp || !namaKelompok) {
    return res.status(400).json({ error: 'Field wajib tidak lengkap.' });
  }

  const pkg = getPackageById(packageId);
  if (!pkg) return res.status(400).json({ error: 'Paket tidak valid.' });

  const { total } = computePricing(pkg);
  const customerId = `cust-${nanoid(8)}`;
  const orderId = makeOrderRef();
  const accessToken = nanoid(24);
  const now = new Date().toISOString();

  db.customers.push({ id: customerId, namaLengkap, email, noWhatsapp, namaKelompok, dibuatPada: now });

  const order = {
    id: orderId,
    nomorReferensi: `#${orderId}`,
    customerId,
    packageId,
    jenisKebutuhan,
    jumlahAnggota,
    deskripsiKebutuhan,
    urlDokumenReferensi: urlDokumenReferensi ?? null,
    status: ORDER_STATUSES.MENUNGGU_PEMBAYARAN,
    totalTagihan: total,
    metodePembayaran: null,
    dibuatPada: now,
    accessToken,
  };

  db.orders.push(order);
  db.statusLogs.push({ id: nanoid(), orderId, status: ORDER_STATUSES.MENUNGGU_PEMBAYARAN, catatan: 'Pesanan dibuat.', diperbuatPada: now });

  res.status(201).json({ ...order, customer: db.customers.at(-1), package: pkg });
});

// GET /api/orders/:id
router.get('/:id', (req, res) => {
  const order = db.orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });

  const customer = db.customers.find((c) => c.id === order.customerId);
  const pkg = getPackageById(order.packageId);
  const logs = db.statusLogs.filter((l) => l.orderId === order.id);

  res.json({ ...order, customer, package: pkg, statusLogs: logs });
});

// PATCH /api/orders/:id/status — demo: advance status
router.patch('/:id/status', (req, res) => {
  const order = db.orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });

  const { status, catatan } = req.body;
  if (!status) return res.status(400).json({ error: 'Status wajib diisi.' });

  const prev = order.status;
  order.status = status;
  const now = new Date().toISOString();
  db.statusLogs.push({ id: nanoid(), orderId: order.id, status, catatan: catatan ?? `Status diubah dari ${prev}.`, diperbuatPada: now });

  res.json({ ...order, package: getPackageById(order.packageId) });
});

export default router;
