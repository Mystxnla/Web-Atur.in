import { Router } from 'express';
import pool, { formatOrder } from '../store/database.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/auth.js';
import { ORDER_STATUSES } from '@atur-in/shared';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';

const router = Router();

// Semua route admin butuh role admin/superadmin
router.use(requireAdmin);

// ─── Dashboard stats ──────────────────────────────────────────────────────────
router.get('/dashboard', async (req, res, next) => {
  try {
    const [
      totalOrdersRes,
      totalRevenueRes,
      pendingOrdersRes,
      activeSetupRes,
      doneOrdersRes,
      trialOrdersRes,
      totalUsersRes,
      totalLeadsRes,
      recentOrdersRes,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*)::int as c FROM orders'),
      pool.query("SELECT COALESCE(SUM(total), 0)::int as r FROM orders WHERE status != 'menunggu_pembayaran' AND status != 'kedaluwarsa'"),
      pool.query("SELECT COUNT(*)::int as c FROM orders WHERE status = 'menunggu_pembayaran'"),
      pool.query("SELECT COUNT(*)::int as c FROM orders WHERE status = 'proses_setup'"),
      pool.query("SELECT COUNT(*)::int as c FROM orders WHERE status = 'selesai'"),
      pool.query('SELECT COUNT(*)::int as c FROM orders WHERE is_trial = TRUE'),
      pool.query("SELECT COUNT(*)::int as c FROM users WHERE role = 'user'"),
      pool.query('SELECT COUNT(*)::int as c FROM leads'),
      pool.query(`
        SELECT o.*, u.name as user_name, u.email as user_email
        FROM orders o LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC LIMIT 5
      `),
    ]);

    res.json({
      stats: {
        totalOrders:   totalOrdersRes.rows[0].c,
        totalRevenue:  totalRevenueRes.rows[0].r,
        pendingOrders: pendingOrdersRes.rows[0].c,
        activeSetup:   activeSetupRes.rows[0].c,
        doneOrders:    doneOrdersRes.rows[0].c,
        trialOrders:   trialOrdersRes.rows[0].c,
        totalUsers:    totalUsersRes.rows[0].c,
        totalLeads:    totalLeadsRes.rows[0].c,
      },
      recentOrders: recentOrdersRes.rows.map((o) => formatOrder(o)),
    });
  } catch (err) { next(err); }
});

// ─── Orders list ─────────────────────────────────────────────────────────────
router.get('/orders', async (req, res, next) => {
  try {
    const { status, search, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT o.*, u.name as user_name FROM orders o LEFT JOIN users u ON o.user_id = u.id';
    const params = [];
    const conditions = [];

    if (status) {
      params.push(status);
      conditions.push(`o.status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      conditions.push(`(o.name ILIKE $${idx} OR o.email ILIKE $${idx} OR o.ref_number ILIKE $${idx})`);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    params.push(Number(limit), Number(offset));
    query += ` ORDER BY o.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const [{ rows }, totalRes] = await Promise.all([
      pool.query(query, params),
      pool.query('SELECT COUNT(*)::int as c FROM orders'),
    ]);

    res.json({
      orders: rows.map((o) => formatOrder(o)),
      total: totalRes.rows[0].c,
    });
  } catch (err) { next(err); }
});

// ─── Order detail ─────────────────────────────────────────────────────────────
router.get('/orders/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM orders WHERE id = $1 OR ref_number = $1 LIMIT 1',
      [req.params.id]
    );
    const order = rows[0];
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });

    const [{ rows: logs }, { rows: payments }] = await Promise.all([
      pool.query('SELECT * FROM order_logs WHERE order_id = $1 ORDER BY created_at ASC', [order.id]),
      pool.query('SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC', [order.id]),
    ]);

    res.json(formatOrder(order, logs, payments));
  } catch (err) { next(err); }
});

// ─── Update status ────────────────────────────────────────────────────────────
router.patch('/orders/:id/status', async (req, res, next) => {
  try {
    const { status, catatan } = req.body;
    const validStatuses = Object.values(ORDER_STATUSES);
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Status tidak valid.' });

    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    const order = rows[0];
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });

    const now = new Date().toISOString();
    await pool.query('UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3', [status, now, order.id]);
    await pool.query(
      `INSERT INTO order_logs (id, order_id, status, note, changed_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [nanoid(), order.id, status, catatan ?? null, req.user.email, now]
    );

    res.json({ success: true, status });
  } catch (err) { next(err); }
});

// ─── Update workspace delivery links (Notion & Google Drive) ──────────────────
router.patch('/orders/:id/delivery', async (req, res, next) => {
  try {
    const { notionUrl, driveUrl, accessType } = req.body;
    const allowedAccess = ['guest_trial', 'full_owner'];
    const safeAccess = allowedAccess.includes(accessType) ? accessType : 'guest_trial';

    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    const order = rows[0];
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });

    const cleanNotion = typeof notionUrl === 'string' && notionUrl.trim() ? notionUrl.trim() : null;
    const cleanDrive = typeof driveUrl === 'string' && driveUrl.trim() ? driveUrl.trim() : null;

    if (cleanNotion && !/^https?:\/\//i.test(cleanNotion)) {
      return res.status(400).json({ error: 'Link Notion harus diawali https://' });
    }
    if (cleanDrive && !/^https?:\/\//i.test(cleanDrive)) {
      return res.status(400).json({ error: 'Link Google Drive harus diawali https://' });
    }

    const now = new Date().toISOString();
    await pool.query(
      'UPDATE orders SET notion_url = $1, drive_url = $2, access_type = $3, updated_at = $4 WHERE id = $5',
      [cleanNotion, cleanDrive, safeAccess, now, order.id]
    );

    const accessLabel =
      safeAccess === 'full_owner'
        ? 'Hak Milik Penuh (Bisa Duplicate)'
        : 'Akses Guest Free Trial 7 Hari (Anti-Duplicate)';

    await pool.query(
      `INSERT INTO order_logs (id, order_id, status, note, changed_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        nanoid(),
        order.id,
        order.status,
        `Link workspace diperbarui (${accessLabel}).`,
        req.user.email,
        now,
      ]
    );

    res.json({
      success: true,
      notionUrl: cleanNotion,
      driveUrl: cleanDrive,
      accessType: safeAccess,
    });
  } catch (err) { next(err); }
});

// ─── Users list ───────────────────────────────────────────────────────────────
router.get('/users', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, email, name, role, is_active, created_at,
        (SELECT COUNT(*)::int FROM orders WHERE user_id = users.id) as order_count
      FROM users ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

// ─── Toggle user active ───────────────────────────────────────────────────────
router.patch('/users/:id/toggle', requireSuperAdmin, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });
    if (user.role === 'superadmin') return res.status(400).json({ error: 'Tidak bisa menonaktifkan superadmin.' });

    const newActive = user.is_active ? 0 : 1;
    await pool.query('UPDATE users SET is_active = $1 WHERE id = $2', [newActive, user.id]);
    res.json({ success: true, is_active: newActive });
  } catch (err) { next(err); }
});

// ─── Leads list ───────────────────────────────────────────────────────────────
router.get('/leads', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { next(err); }
});

// ─── Create admin (superadmin only) ──────────────────────────────────────────
router.post('/admins', requireSuperAdmin, async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Email, password, dan nama wajib.' });

    const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.length > 0) return res.status(409).json({ error: 'Email sudah terdaftar.' });

    const hash = await bcrypt.hash(password, 12);
    const id = `adm-${nanoid(10)}`;
    await pool.query(
      'INSERT INTO users (id, email, password, name, role) VALUES ($1,$2,$3,$4,$5)',
      [id, email.toLowerCase(), hash, name, 'admin']
    );

    res.status(201).json({ id, email, name, role: 'admin' });
  } catch (err) { next(err); }
});

export default router;
