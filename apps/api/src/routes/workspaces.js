import { Router } from 'express';
import { nanoid } from 'nanoid';
import pool, { formatOrder } from '../store/database.js';

const router = Router();

export function buildDefaultWorkspaceBlueprint(order) {
  const groupName = order.group_name || 'Ruang Kerja Tim';
  const leaderName = order.name || 'Budi Pratama';
  const leaderEmail = (order.email || 'budi.pratama@techteam.id').toLowerCase();
  const needType = order.need_type || 'tugas_kelompok';

  const isEvent = needType === 'kepanitiaan' || needType === 'organisasi';

  const divisions = isEvent
    ? [
        { id: 'div-inti', name: 'BPH & Inti', description: 'Koordinasi ketua, sekretaris, bendahara, dan keputusan lintas divisi.' },
        { id: 'div-acara', name: 'Divisi Acara', description: 'Konsep acara, rundown teknis, pengisi acara, dan gladi bersih.' },
        { id: 'div-humas', name: 'Humas & Sponsor', description: 'Pendanaan sponsorship, media partner, dan surat-menyurat eksternal.' },
        { id: 'div-logistik', name: 'Logistik & Pubdok', description: 'Perlengkapan tempat, konsumsi, dokumentasi, dan desain publikasi.' },
      ]
    : [
        { id: 'div-inti', name: 'Koordinasi & Inti', description: 'Manajemen timeline kelompok, pembagian bab, dan jadwal bimbingan.' },
        { id: 'div-riset', name: 'Riset & Data', description: 'Pengumpulan jurnal, studi literatur, pengolahan data, dan eksperimen.' },
        { id: 'div-dokumen', name: 'Penulisan & Sistem', description: 'Penyusunan laporan/skripsi, implementasi teknis, dan integrasi modul.' },
        { id: 'div-desain', name: 'Visual & Presentasi', description: 'Pembuatan slide deck, poster ilmiah, dan persiapan demo akhir.' },
      ];

  const members = [
    {
      id: 'mem-1',
      name: leaderName,
      email: leaderEmail,
      role: isEvent ? 'Ketua Pelaksana / BPH' : 'Ketua Kelompok / Project Lead',
      divisionId: 'div-inti',
      isOwner: true,
      personalNotes: `Catatan kerja pribadi ${leaderName}:\n- Pastikan semua divisi memperbarui status tugas sebelum rapat evaluasi.\n- Siapkan agenda diskusi mingguan.`,
      personalChecklist: [
        { id: 'pchk-1', text: 'Periksa progres papan tugas seluruh divisi', done: true },
        { id: 'pchk-2', text: 'Konfirmasi jadwal rapat evaluasi minggu ini', done: false },
      ],
    },
    {
      id: 'mem-2',
      name: 'Citra Maharani',
      email: 'citra@kampus.ac.id',
      role: isEvent ? 'Koordinator Divisi Acara' : 'PIC Riset Literatur & Data',
      divisionId: isEvent ? 'div-acara' : 'div-riset',
      isOwner: false,
      personalNotes: isEvent
        ? 'Catatan pribadi Citra (Divisi Acara):\n- Finalisasi daftar pembicara dan durasi tiap sesi di rundown.'
        : 'Catatan pribadi Citra (Divisi Riset & Data):\n- Fokus merangkum 15 jurnal IEEE/Scopus 5 tahun terakhir untuk Bab 2.',
      personalChecklist: [
        { id: 'pchk-c1', text: isEvent ? 'Susun draf rundown menit-ke-menit' : 'Rekap matriks perbandingan 15 jurnal utama', done: true },
        { id: 'pchk-c2', text: isEvent ? 'Kirim brief ke moderator acara' : 'Validasi dataset dan variabel penelitian', done: false },
      ],
    },
    {
      id: 'mem-3',
      name: 'Andi Wijaya',
      email: 'andi@kampus.ac.id',
      role: isEvent ? 'Koordinator Humas & Sponsor' : 'PIC Penulisan & Implementasi',
      divisionId: isEvent ? 'div-humas' : 'div-dokumen',
      isOwner: false,
      personalNotes: isEvent
        ? 'Catatan pribadi Andi (Humas & Sponsor):\n- Follow up 5 perusahaan sponsor tier Gold yang sudah menerima proposal.'
        : 'Catatan pribadi Andi (Penulisan & Sistem):\n- Selesaikan diagram arsitektur dan draf metodologi di Bab 3.',
      personalChecklist: [
        { id: 'pchk-a1', text: isEvent ? 'Kirim proposal batch ke-2 ke sponsor' : 'Susun alur metodologi & arsitektur sistem', done: false },
        { id: 'pchk-a2', text: isEvent ? 'Rekap daftar media partner kampus' : 'Rapikan format sitasi Mendeley/Zotero', done: false },
      ],
    },
    {
      id: 'mem-4',
      name: 'Dina Lestari',
      email: 'dina@kampus.ac.id',
      role: isEvent ? 'Koordinator Logistik & Pubdok' : 'PIC Visual & Slide Presentasi',
      divisionId: isEvent ? 'div-logistik' : 'div-desain',
      isOwner: false,
      personalNotes: 'Catatan pribadi Dina:\n- Siapkan template desain dan kebutuhan visual tim.',
      personalChecklist: [
        { id: 'pchk-d1', text: 'Siapkan template presentasi & aset visual', done: false },
      ],
    },
  ];

  const tasks = isEvent
    ? [
        {
          id: 'tsk-1',
          title: 'Finalisasi proposal utama & RAB kepanitiaan',
          status: 'done',
          assignee: leaderName,
          assigneeEmail: leaderEmail,
          divisionId: 'div-inti',
          priority: 'high',
          dueDate: 'Selesai',
        },
        {
          id: 'tsk-2',
          title: 'Susun rundown teknis & cue card pengisi acara',
          status: 'in_progress',
          assignee: 'Citra Maharani',
          assigneeEmail: 'citra@kampus.ac.id',
          divisionId: 'div-acara',
          priority: 'high',
          dueDate: 'Minggu ini',
        },
        {
          id: 'tsk-3',
          title: 'Follow-up 10 media partner & perusahaan sponsor',
          status: 'review',
          assignee: 'Andi Wijaya',
          assigneeEmail: 'andi@kampus.ac.id',
          divisionId: 'div-humas',
          priority: 'medium',
          dueDate: '3 hari lagi',
        },
        {
          id: 'tsk-4',
          title: 'Peminjaman aula & daftar perlengkapan logistik',
          status: 'todo',
          assignee: 'Dina Lestari',
          assigneeEmail: 'dina@kampus.ac.id',
          divisionId: 'div-logistik',
          priority: 'medium',
          dueDate: 'Minggu depan',
        },
      ]
    : [
        {
          id: 'tsk-1',
          title: 'Pembagian peran anggota & struktur bab proyek',
          status: 'done',
          assignee: leaderName,
          assigneeEmail: leaderEmail,
          divisionId: 'div-inti',
          priority: 'high',
          dueDate: 'Selesai',
        },
        {
          id: 'tsk-2',
          title: 'Kumpulkan 15 referensi jurnal utama & sintesis literatur',
          status: 'in_progress',
          assignee: 'Citra Maharani',
          assigneeEmail: 'citra@kampus.ac.id',
          divisionId: 'div-riset',
          priority: 'high',
          dueDate: 'Minggu ini',
        },
        {
          id: 'tsk-3',
          title: 'Penyusunan metodologi & perancangan arsitektur sistem',
          status: 'review',
          assignee: 'Andi Wijaya',
          assigneeEmail: 'andi@kampus.ac.id',
          divisionId: 'div-dokumen',
          priority: 'medium',
          dueDate: 'Besok',
        },
        {
          id: 'tsk-4',
          title: 'Siapkan slide presentasi progres mingguan',
          status: 'todo',
          assignee: 'Dina Lestari',
          assigneeEmail: 'dina@kampus.ac.id',
          divisionId: 'div-desain',
          priority: 'low',
          dueDate: 'Jumat ini',
        },
      ];

  const pages = [
    {
      id: 'page-overview',
      title: 'Ringkasan & Panduan Organisasi',
      callout: `Selamat datang di ruang kerja ${groupName}. Setiap anggota dapat bekerja di divisi masing-masing maupun di meja kerja pribadinya, namun tetap terhubung dalam satu lingkup kelompok.`,
      content: order.description
        ? `Tujuan & spesifikasi ruang kerja:\n${order.description}`
        : `Ruang kerja ini menghubungkan seluruh divisi di ${groupName} agar pembagian tugas, dokumen referensi, dan progres per anggota transparan.`,
      checklist: [
        { id: 'chk-1', text: 'Berikan akses email kepada seluruh anggota sesuai divisinya', done: true },
        { id: 'chk-2', text: 'Sepakati jadwal evaluasi rutin mingguan', done: true },
        { id: 'chk-3', text: 'Hubungkan folder Google Drive & dokumen referensi utama', done: false },
        { id: 'chk-4', text: 'Selesaikan target tugas masing-masing divisi minggu ini', done: false },
      ],
    },
    {
      id: 'page-sop',
      title: 'SOP & Pembagian Jobdesk Divisi',
      callout: 'Setiap anggota bertanggung jawab memperbarui kartu tugas di divisinya minimal H-1 sebelum rapat evaluasi.',
      content:
        '1. Lingkup 1 Organisasi: Digunakan untuk melihat progres gabungan seluruh tim dan pengumuman bersama.\n2. Lingkup Divisi: Setiap divisi memiliki papan tugas dan fokus kerja sesuai bidangnya.\n3. Meja Kerja Individu: Setiap anggota memiliki halaman tugas dan catatan pribadi yang otomatis tersinkron dengan akunnya.',
      checklist: [
        { id: 'chk-sop-1', text: 'Semua anggota sudah masuk dengan akun email masing-masing', done: true },
        { id: 'chk-sop-2', text: 'Format penamaan file di Google Drive sudah seragam antar divisi', done: false },
      ],
    },
    {
      id: 'page-notes',
      title: 'Notulensi Rapat & Evaluasi',
      callout: 'Catatan rapat gabungan lintas divisi dan hasil asistensi/bimbingan.',
      content:
        'Hasil Rapat Koordinasi:\n- Divisi Riset/Acara menyelesaikan kerangka dasar minggu ini.\n- Divisi Penulisan/Humas menyiapkan draf dokumen tahap pertama untuk direview bersama hari Jumat.',
      checklist: [
        { id: 'chk-not-1', text: 'Rangkum poin masukan dari evaluasi terakhir', done: false },
        { id: 'chk-not-2', text: 'Distribusikan tindak lanjut ke papan tugas tiap divisi', done: false },
      ],
    },
  ];

  const links = [
    {
      id: 'lnk-1',
      title: 'Folder Google Drive Utama',
      category: 'Cloud Storage',
      url: 'https://drive.google.com',
    },
    {
      id: 'lnk-2',
      title: 'Ruang Diskusi Google Meet',
      category: 'Video Call',
      url: 'https://meet.google.com',
    },
    {
      id: 'lnk-3',
      title: 'Dokumen Referensi / Silabus',
      category: 'Dokumen',
      url: order.doc_url || 'https://scholar.google.com',
    },
  ];

  return {
    title: groupName,
    divisions,
    pages,
    tasks,
    members,
    links,
  };
}

/**
 * Ensures older workspace rows in Supabase that were created before `divisions_json`
 * or `member.email` / `task.divisionId` existed are smoothly upgraded on read.
 */
export function normalizeWorkspaceData(row, orderRow) {
  const blueprint = buildDefaultWorkspaceBlueprint(orderRow || {});
  const divisions =
    Array.isArray(row.divisions_json) && row.divisions_json.length > 0
      ? row.divisions_json
      : blueprint.divisions;

  const defaultDivId = divisions[0]?.id ?? 'div-inti';

  const rawMembers =
    Array.isArray(row.members_json) && row.members_json.length > 0
      ? row.members_json
      : blueprint.members;

  const members = rawMembers.map((m, idx) => {
    const fallbackBlueprintMember = blueprint.members[idx] ?? blueprint.members[0];
    const assignedDiv =
      m.divisionId && divisions.some((d) => d.id === m.divisionId)
        ? m.divisionId
        : divisions[idx % divisions.length]?.id ?? defaultDivId;

    return {
      ...m,
      email: (m.email || fallbackBlueprintMember?.email || `anggota${idx + 1}@kampus.ac.id`).toLowerCase(),
      divisionId: assignedDiv,
      isOwner: idx === 0 ? true : Boolean(m.isOwner),
      personalNotes:
        m.personalNotes ??
        fallbackBlueprintMember?.personalNotes ??
        `Catatan kerja pribadi ${m.name}...`,
      personalChecklist:
        Array.isArray(m.personalChecklist) && m.personalChecklist.length > 0
          ? m.personalChecklist
          : fallbackBlueprintMember?.personalChecklist ?? [
              { id: `pchk-${idx}-1`, text: 'Selesaikan tugas divisi minggu ini', done: false },
            ],
    };
  });

  const rawTasks =
    Array.isArray(row.tasks_json) && row.tasks_json.length > 0
      ? row.tasks_json
      : blueprint.tasks;

  const tasks = rawTasks.map((t, idx) => {
    const matchedMember = members.find(
      (m) =>
        (t.assigneeEmail && m.email === t.assigneeEmail.toLowerCase()) ||
        (t.assignee && m.name.toLowerCase() === t.assignee.toLowerCase())
    );
    const divisionId =
      t.divisionId && divisions.some((d) => d.id === t.divisionId)
        ? t.divisionId
        : matchedMember?.divisionId ?? divisions[idx % divisions.length]?.id ?? defaultDivId;

    return {
      ...t,
      divisionId,
      assignee: matchedMember?.name ?? t.assignee ?? members[0]?.name ?? 'Anggota',
      assigneeEmail: matchedMember?.email ?? t.assigneeEmail ?? members[0]?.email ?? '',
    };
  });

  return {
    id: row.id,
    orderId: row.order_id,
    title: row.title,
    divisions,
    pages: row.pages_json ?? blueprint.pages,
    tasks,
    members,
    links: row.links_json ?? blueprint.links,
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

export async function ensureWorkspaceForOrder(order) {
  const { rows } = await pool.query('SELECT * FROM workspaces WHERE order_id = $1', [order.id]);
  if (rows.length > 0) {
    const normalized = normalizeWorkspaceData(rows[0], order);
    // Persist backfilled divisions/emails if they were missing in older rows
    const needsUpgrade =
      !Array.isArray(rows[0].divisions_json) ||
      rows[0].divisions_json.length === 0 ||
      !rows[0].members_json?.[0]?.email;

    if (needsUpgrade) {
      await pool.query(
        `UPDATE workspaces
         SET divisions_json = $1::jsonb, members_json = $2::jsonb, tasks_json = $3::jsonb
         WHERE id = $4`,
        [
          JSON.stringify(normalized.divisions),
          JSON.stringify(normalized.members),
          JSON.stringify(normalized.tasks),
          rows[0].id,
        ]
      );
    }
    return normalized;
  }

  const blueprint = buildDefaultWorkspaceBlueprint(order);
  const id = `wks-${nanoid(10)}`;
  const now = new Date().toISOString();

  const { rows: inserted } = await pool.query(
    `INSERT INTO workspaces (
      id, order_id, title, divisions_json,
      pages_json, tasks_json, members_json, links_json, created_at, updated_at
    ) VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9,$10)
    RETURNING *`,
    [
      id,
      order.id,
      blueprint.title,
      JSON.stringify(blueprint.divisions),
      JSON.stringify(blueprint.pages),
      JSON.stringify(blueprint.tasks),
      JSON.stringify(blueprint.members),
      JSON.stringify(blueprint.links),
      now,
      now,
    ]
  );

  return normalizeWorkspaceData(inserted[0], order);
}

// ─── GET /api/workspaces/:orderId ─────────────────────────────────────────────
router.get('/:orderId', async (req, res, next) => {
  try {
    const order = await findOrderByIdOrRef(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Pesanan atau workspace tidak ditemukan.' });

    const workspace = await ensureWorkspaceForOrder(order);
    res.json(workspace);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/workspaces/:orderId ───────────────────────────────────────────
router.patch('/:orderId', async (req, res, next) => {
  try {
    const order = await findOrderByIdOrRef(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Workspace tidak ditemukan.' });

    const current = await ensureWorkspaceForOrder(order);

    const title = req.body.title ?? current.title;
    const divisions = req.body.divisions ?? current.divisions;
    const pages = req.body.pages ?? current.pages;
    const tasks = req.body.tasks ?? current.tasks;
    const members = req.body.members ?? current.members;
    const links = req.body.links ?? current.links;
    const now = new Date().toISOString();

    const { rows: updated } = await pool.query(
      `UPDATE workspaces
       SET title = $1,
           divisions_json = $2::jsonb,
           pages_json = $3::jsonb,
           tasks_json = $4::jsonb,
           members_json = $5::jsonb,
           links_json = $6::jsonb,
           updated_at = $7
       WHERE order_id = $8
       RETURNING *`,
      [
        title,
        JSON.stringify(divisions),
        JSON.stringify(pages),
        JSON.stringify(tasks),
        JSON.stringify(members),
        JSON.stringify(links),
        now,
        order.id,
      ]
    );

    res.json(normalizeWorkspaceData(updated[0], order));
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
           divisions_json = $2::jsonb,
           pages_json = $3::jsonb,
           tasks_json = $4::jsonb,
           members_json = $5::jsonb,
           links_json = $6::jsonb,
           updated_at = $7
       WHERE order_id = $8
       RETURNING *`,
      [
        blueprint.title,
        JSON.stringify(blueprint.divisions),
        JSON.stringify(blueprint.pages),
        JSON.stringify(blueprint.tasks),
        JSON.stringify(blueprint.members),
        JSON.stringify(blueprint.links),
        now,
        order.id,
      ]
    );

    res.json(normalizeWorkspaceData(updated[0], order));
  } catch (err) {
    next(err);
  }
});

export default router;
