import { Router } from 'express';
import { nanoid } from 'nanoid';
import pool, { formatOrder } from '../store/database.js';

const router = Router();

export function buildDefaultWorkspaceBlueprint(order) {
  const groupName = order.group_name || 'Workspace Tim';
  const leaderName = order.name || 'Ketua Tim';
  const needType = order.need_type || 'tugas_kelompok';

  const isEvent = needType === 'kepanitiaan' || needType === 'organisasi';
  const icon = isEvent ? '🏛️' : needType === 'studi_riset' ? '🔬' : '🚀';

  const members = [
    { id: 'mem-1', name: leaderName, role: 'Project Lead / PIC', avatarBg: 'bg-primary-600' },
    { id: 'mem-2', name: isEvent ? 'Koordinator Acara' : 'Rekan Riset & Data', role: isEvent ? 'Divisi Acara' : 'Data & Literatur', avatarBg: 'bg-purple-600' },
    { id: 'mem-3', name: isEvent ? 'Koordinator Humas & Sponsor' : 'Rekan Penulis & Desain', role: isEvent ? 'Divisi Humas' : 'Penyusun Dokumen', avatarBg: 'bg-emerald-600' },
  ];

  const tasks = isEvent
    ? [
        {
          id: 'tsk-1',
          title: 'Finalisasi Proposal & RAB Kepanitiaan',
          status: 'done',
          assignee: leaderName,
          priority: 'high',
          tag: 'Inti & Bendahara',
          dueDate: 'Selesai',
        },
        {
          id: 'tsk-2',
          title: 'Follow-up 10 Media Partner & Sponsor Utama',
          status: 'in_progress',
          assignee: 'Koordinator Humas & Sponsor',
          priority: 'high',
          tag: 'Sponsorship',
          dueDate: 'Minggu Ini',
        },
        {
          id: 'tsk-3',
          title: 'Susun Rundown Teknis & Cue Card Hari-H',
          status: 'review',
          assignee: 'Koordinator Acara',
          priority: 'medium',
          tag: 'Acara',
          dueDate: '3 Hari Lagi',
        },
        {
          id: 'tsk-4',
          title: 'Booking Ruangan & Checklist Perlengkapan Logistik',
          status: 'todo',
          assignee: leaderName,
          priority: 'medium',
          tag: 'Logistik',
          dueDate: 'Minggu Depan',
        },
      ]
    : [
        {
          id: 'tsk-1',
          title: 'Pembagian Peran & Struktur Bab Proyek',
          status: 'done',
          assignee: leaderName,
          priority: 'high',
          tag: 'Manajemen',
          dueDate: 'Selesai',
        },
        {
          id: 'tsk-2',
          title: 'Kumpulkan 15 Referensi Jurnal Utama & Literatur',
          status: 'in_progress',
          assignee: 'Rekan Riset & Data',
          priority: 'high',
          tag: 'Riset',
          dueDate: 'Minggu Ini',
        },
        {
          id: 'tsk-3',
          title: 'Drafting Metodologi & Perancangan Sistem',
          status: 'review',
          assignee: leaderName,
          priority: 'medium',
          tag: 'Inti Proyek',
          dueDate: 'Besok',
        },
        {
          id: 'tsk-4',
          title: 'Siapkan Slide Presentasi Progress Mingguan',
          status: 'todo',
          assignee: 'Rekan Penulis & Desain',
          priority: 'low',
          tag: 'Presentasi',
          dueDate: 'Jumat Ini',
        },
      ];

  const pages = [
    {
      id: 'page-overview',
      title: 'Home & Ringkasan Proyek',
      icon: '🏠',
      callout: `Selamat datang di Workspace Digital ${groupName}! Semua pembagian tugas, SOP, dan catatan rapat tim terpusat di sini agar tidak tenggelam di chat WhatsApp.`,
      content: order.description
        ? `Tujuan & Spesifikasi Tim:\n${order.description}`
        : `Workspace ini dirancang khusus untuk mendukung kolaborasi ${groupName} secara terstruktur, transparan, dan bebas drama.`,
      checklist: [
        { id: 'chk-1', text: 'Undang seluruh anggota kelompok ke dalam workspace ini', done: true },
        { id: 'chk-2', text: 'Sepakati jadwal rapat evaluasi rutin mingguan', done: true },
        { id: 'chk-3', text: 'Hubungkan folder Google Drive & dokumen referensi utama', done: false },
        { id: 'chk-4', text: 'Selesaikan milestone Sprint minggu pertama', done: false },
      ],
    },
    {
      id: 'page-sop',
      title: 'SOP & Pembagian Peran Tim',
      icon: '📋',
      callout: 'Aturan Emas Tim: Setiap tugas yang dikerjakan wajib diperbarui statusnya di Sprint Kanban Board maksimal H-1 sebelum deadline.',
      content:
        '1. Komunikasi penting & file final tidak boleh hanya dikirim di grup WhatsApp, wajib ditempel di Resource Hub.\n2. Jika ada anggota yang terkendala, wajib memberi kabar minimal 24 jam sebelum tenggat waktu.\n3. Review silang dilakukan sebelum dokumen dikumpulkan ke dosen/pembina.',
      checklist: [
        { id: 'chk-sop-1', text: 'Semua anggota sudah memahami pembagian jobdesk masing-masing', done: true },
        { id: 'chk-sop-2', text: 'Template penamaan file di Google Drive sudah seragam', done: false },
      ],
    },
    {
      id: 'page-notes',
      title: 'Catatan Rapat & Bimbingan',
      icon: '📝',
      callout: 'Gunakan halaman ini untuk mencatat hasil diskusi kelompok, revisi dosen, atau evaluasi mingguan.',
      content:
        'Rapat Kick-off Perdana:\n- Fokus minggu ini adalah menyelesaikan fondasi literatur dan pembagian modul kerja.\n- Target pengumpulan draft pertama adalah hari Jumat pukul 20.00 WIB.',
      checklist: [
        { id: 'chk-not-1', text: 'Rangkum poin revisi dari diskusi terakhir', done: false },
        { id: 'chk-not-2', text: 'Bagikan tindak lanjut ke masing-masing PIC di Kanban', done: false },
      ],
    },
  ];

  const links = [
    {
      id: 'lnk-1',
      title: 'Folder Google Drive Utama',
      category: 'Cloud Storage',
      url: 'https://drive.google.com',
      icon: '📁',
    },
    {
      id: 'lnk-2',
      title: 'Ruang Diskusi Google Meet',
      category: 'Video Call',
      url: 'https://meet.google.com',
      icon: '🎥',
    },
    {
      id: 'lnk-3',
      title: 'Referensi Silabus / Dokumen Tim',
      category: 'Dokumen',
      url: order.doc_url || 'https://scholar.google.com',
      icon: '📑',
    },
  ];

  return {
    title: groupName,
    icon,
    coverGradient: 'from-indigo-600 via-primary-600 to-purple-600',
    pages,
    tasks,
    members,
    links,
  };
}

function formatWorkspaceRow(row, orderRow) {
  return {
    id: row.id,
    orderId: row.order_id,
    title: row.title,
    icon: row.icon,
    coverGradient: row.cover_gradient,
    pages: row.pages_json ?? [],
    tasks: row.tasks_json ?? [],
    members: row.members_json ?? [],
    links: row.links_json ?? [],
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
    order: orderRow ? formatOrder(orderRow) : undefined,
  };
}

async function findOrderByIdOrRef(idParam) {
  const cleanId = idParam.replace(/^#/, '').trim();
  const { rows } = await pool.query(
    'SELECT * FROM orders WHERE id = $1 OR UPPER(ref_number) = UPPER($1) LIMIT 1',
    [cleanId]
  );
  return rows[0] ?? null;
}

// ─── GET /api/workspaces/:orderId (Auto-provisions if not yet created) ────────
router.get('/:orderId', async (req, res, next) => {
  try {
    const order = await findOrderByIdOrRef(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Pesanan atau workspace tidak ditemukan.' });

    const { rows } = await pool.query('SELECT * FROM workspaces WHERE order_id = $1', [order.id]);
    if (rows.length > 0) {
      return res.json(formatWorkspaceRow(rows[0], order));
    }

    // Auto-provision default Notion-like workspace for this order
    const blueprint = buildDefaultWorkspaceBlueprint(order);
    const id = `wks-${nanoid(10)}`;
    const now = new Date().toISOString();

    const { rows: inserted } = await pool.query(
      `INSERT INTO workspaces (
        id, order_id, title, icon, cover_gradient,
        pages_json, tasks_json, members_json, links_json, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10,$11)
      RETURNING *`,
      [
        id,
        order.id,
        blueprint.title,
        blueprint.icon,
        blueprint.coverGradient,
        JSON.stringify(blueprint.pages),
        JSON.stringify(blueprint.tasks),
        JSON.stringify(blueprint.members),
        JSON.stringify(blueprint.links),
        now,
        now,
      ]
    );

    res.json(formatWorkspaceRow(inserted[0], order));
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/workspaces/:orderId (Update tasks, pages, title, icon, etc.) ──
router.patch('/:orderId', async (req, res, next) => {
  try {
    const order = await findOrderByIdOrRef(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Workspace tidak ditemukan.' });

    const { rows: existingRows } = await pool.query(
      'SELECT * FROM workspaces WHERE order_id = $1',
      [order.id]
    );
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Workspace belum diinisialisasi.' });
    }

    const current = existingRows[0];
    const title = req.body.title ?? current.title;
    const icon = req.body.icon ?? current.icon;
    const coverGradient = req.body.coverGradient ?? current.cover_gradient;
    const pages = req.body.pages ?? current.pages_json;
    const tasks = req.body.tasks ?? current.tasks_json;
    const members = req.body.members ?? current.members_json;
    const links = req.body.links ?? current.links_json;
    const now = new Date().toISOString();

    const { rows: updated } = await pool.query(
      `UPDATE workspaces
       SET title = $1,
           icon = $2,
           cover_gradient = $3,
           pages_json = $4::jsonb,
           tasks_json = $5::jsonb,
           members_json = $6::jsonb,
           links_json = $7::jsonb,
           updated_at = $8
       WHERE order_id = $9
       RETURNING *`,
      [
        title,
        icon,
        coverGradient,
        JSON.stringify(pages),
        JSON.stringify(tasks),
        JSON.stringify(members),
        JSON.stringify(links),
        now,
        order.id,
      ]
    );

    res.json(formatWorkspaceRow(updated[0], order));
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/workspaces/:orderId/reset-template ─────────────────────────────
router.post('/:orderId/reset-template', async (req, res, next) => {
  try {
    const order = await findOrderByIdOrRef(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Workspace tidak ditemukan.' });

    const blueprint = buildDefaultWorkspaceBlueprint(order);
    const now = new Date().toISOString();

    const { rows: updated } = await pool.query(
      `UPDATE workspaces
       SET title = $1,
           icon = $2,
           cover_gradient = $3,
           pages_json = $4::jsonb,
           tasks_json = $5::jsonb,
           members_json = $6::jsonb,
           links_json = $7::jsonb,
           updated_at = $8
       WHERE order_id = $9
       RETURNING *`,
      [
        blueprint.title,
        blueprint.icon,
        blueprint.coverGradient,
        JSON.stringify(blueprint.pages),
        JSON.stringify(blueprint.tasks),
        JSON.stringify(blueprint.members),
        JSON.stringify(blueprint.links),
        now,
        order.id,
      ]
    );

    res.json(formatWorkspaceRow(updated[0], order));
  } catch (err) {
    next(err);
  }
});

export default router;
