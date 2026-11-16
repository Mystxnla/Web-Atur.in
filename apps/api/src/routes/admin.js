import { Router } from 'express';
import { z } from 'zod';
import db from '../store/database.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { getPackageById, ORDER_STATUSES } from '@atur-in/shared';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';

const router = Router();

// Semua route admin butuh role admin/superadmin
router.use(requireAdmin);

// ─── Dashboard stats ──────────────────────────────────────────────────────────
router.get('/dashboard', (req, res) => {
  const totalOrders    = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
  const totalRevenue   = db.prepare("SELECT COALESCE(SUM(total),0) as r FROM orders WHERE status != 'menunggu_pembayaran' AND status != 'kedaluwarsa'").get().r;
  const pendingOrders  = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'menunggu_pembayaran'").get().c;
  const activeSetup    = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'proses_setup'").get().c;
  const doneOrders     = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'selesai'").get().c;
  const totalUsers     = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'user'").get().c;
  const totalLeads     = db.prepare('SELECT COUNT(*) as c FROM leads').get().c;

  const recentOrders = db.prepare(`
    SELECT o.*, u.name as user_name, u.email as user_email
    FROM orders o LEFT JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC LIMIT 5
  `).all().map(o => ({ ...o, nomorReferensi: `#${o.ref_number}`, package: getPackageById(o.package_id) }));

  res.json({
    stats: { totalOrders, totalRevenue, pendingOrders, activeSetup, doneOrders, totalUsers, totalLeads },
    recentOrders,
  });
});

// ─── Orders list ─────────────────────────────────────────────────────────────
router.get('/orders', (req, res) => {
  const { status, search, limit = 50, offset = 0 } = req.query;

  let query = 'SELECT o.*, u.name as user_name FROM orders o LEFT JOIN users u ON o.user_id = u.id';
  const params = [];

  const conditions = [];
  if (status) { conditions.push('o.status = ?'); params.push(status); }
  if (search) {
    conditions.push('(o.name LIKE ? OR o.email LIKE ? OR o.ref_number LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const rows = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;

  res.json({
    orders: rows.map(o => ({ ...o, nomorReferensi: `#${o.ref_number}`, package: getPackageById(o.package_id) })),
    total,
  });
});

// ─── Order detail ─────────────────────────────────────────────────────────────
router.get('/orders/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });

  const logs = db.prepare('SELECT * FROM order_logs WHERE order_id = ? ORDER BY created_at ASC').all(order.id);
  const payments = db.prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC').all(order.id);

  res.json({ ...order, nomorReferensi: `#${order.ref_number}`, package: getPackageById(order.package_id), statusLogs: logs, payments });
});

// ─── Update status ────────────────────────────────────────────────────────────
router.patch('/orders/:id/status', (req, res, next) => {
  try {
    const { status, catatan } = req.body;
    const validStatuses = Object.values(ORDER_STATUSES);
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Status tidak valid.' });

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

// ─── Users list ───────────────────────────────────────────────────────────────
router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT id, email, name, role, is_active, created_at,
      (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as order_count
    FROM users ORDER BY created_at DESC
  `).all();
  res.json(users);
});

// ─── Toggle user active ───────────────────────────────────────────────────────
router.patch('/users/:id/toggle', requireSuperAdmin, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });
  if (user.role === 'superadmin') return res.status(400).json({ error: 'Tidak bisa menonaktifkan superadmin.' });

  const newActive = user.is_active ? 0 : 1;
  db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(newActive, user.id);
  res.json({ success: true, is_active: newActive });
});

// ─── Leads list ───────────────────────────────────────────────────────────────
router.get('/leads', (req, res) => {
  const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
  res.json(leads);
});

// ─── Create admin (superadmin only) ──────────────────────────────────────────
router.post('/admins', requireSuperAdmin, async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Email, password, dan nama wajib.' });

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) return res.status(409).json({ error: 'Email sudah terdaftar.' });

    const hash = await bcrypt.hash(password, 12);
    const id = `adm-${nanoid(10)}`;
    db.prepare('INSERT INTO users (id, email, password, name, role) VALUES (?,?,?,?,?)')
      .run(id, email.toLowerCase(), hash, name, 'admin');

    res.status(201).json({ id, email, name, role: 'admin' });
  } catch (err) { next(err); }
});

export default router;
