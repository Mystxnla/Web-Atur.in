import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FolderKanban,
  Globe,
  Info,
  Layers,
  Lock,
  MessageSquare,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  User,
} from 'lucide-react';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { cn } from '../../lib/cn.js';

const STORAGE_KEY = 'aturin.demo.sandbox.v2';

const COLUMNS = [
  { id: 'todo', label: 'Rencana', dot: 'bg-gray-400', next: 'in_progress', nextLabel: 'Kerjakan' },
  { id: 'in_progress', label: 'Dikerjakan', dot: 'bg-primary-600', next: 'review', nextLabel: 'Review' },
  { id: 'review', label: 'Revisi & review', dot: 'bg-warning-500', next: 'done', nextLabel: 'Selesai' },
  { id: 'done', label: 'Selesai', dot: 'bg-success-600', next: null, nextLabel: null },
];

const ROLE_META = {
  ketua: {
    badge: 'Ketua · Akses Penuh',
    variant: 'primary',
    summary: 'Memantau Ruang Utama, memimpin Forum Koor Only, dan dapat membuka semua Ruang Divisi.',
  },
  koor: {
    badge: 'Koordinator · Forum Koor & Divisi',
    variant: 'purple',
    summary: 'Mengelola Ruang Divisinya sendiri, mengakses Forum Koor Only, dan memaparkan progres di Ruang Utama. Divisi lain terkunci.',
  },
  anggota: {
    badge: 'Anggota · Divisi & Ruang Utama',
    variant: 'success',
    summary: 'Mengerjakan tugas di Ruang Divisinya dan memantau paparan progres di Ruang Utama (Read-Only). Forum Koor & divisi lain terkunci.',
  },
};

const INITIAL_SCENARIOS = {
  kepanitiaan: {
    id: 'kepanitiaan',
    label: 'Kepanitiaan & Event',
    title: 'Panitia Festival Kampus 2026',
    divisions: [
      { id: 'div-acara', name: 'Divisi Acara', summary: 'Rundown hari-H 80% final, tinggal konfirmasi MC dan cue card.' },
      { id: 'div-humas', name: 'Humas & Sponsor', summary: '3 sponsor utama sudah tanda tangan MoU, 2 sedang tahap follow-up.' },
      { id: 'div-logistik', name: 'Logistik & Perlengkapan', summary: 'Vendor sound system & panggung sudah booking DP tahap 1.' },
    ],
    members: [
      { id: 'm1', name: 'Raka Aditya', role: 'Ketua Pelaksana', level: 'ketua', divisionId: null },
      { id: 'm2', name: 'Nadia Putri', role: 'Koor Divisi Acara', level: 'koor', divisionId: 'div-acara' },
      { id: 'm3', name: 'Dimas Saputra', role: 'Koor Humas & Sponsor', level: 'koor', divisionId: 'div-humas' },
      { id: 'm4', name: 'Sinta Dewi', role: 'Anggota Divisi Acara', level: 'anggota', divisionId: 'div-acara' },
    ],
    koorForum: [
      {
        id: 'kf1',
        author: 'Raka Aditya (Ketua Pelaksana)',
        topic: 'Sinkronisasi RAB Acara & Dana Sponsor',
        note: 'Mohon Koor Acara & Koor Humas finalisasi kebutuhan dana bintang tamu sebelum Jumat pukul 18.00 WIB.',
        tag: 'Keputusan Rapat',
        resolved: false,
      },
      {
        id: 'kf2',
        author: 'Nadia Putri (Koor Acara)',
        topic: 'Eskalasi Kebutuhan Sound System dari Logistik',
        note: 'Butuh tambahan 2 mic wireless untuk sesi talkshow — sudah koordinasi dengan Koor Logistik.',
        tag: 'Eskalasi Lintas Divisi',
        resolved: true,
      },
    ],
    tasks: [
      { id: 'k1', title: 'Finalisasi rundown teknis hari-H & cue card MC', status: 'in_progress', divisionId: 'div-acara', assignee: 'Nadia Putri' },
      { id: 'k2', title: 'Susun daftar pengisi acara & gladi bersih', status: 'todo', divisionId: 'div-acara', assignee: 'Sinta Dewi' },
      { id: 'k3', title: 'Konfirmasi konfirmator bintang tamu utama', status: 'done', divisionId: 'div-acara', assignee: 'Sinta Dewi' },
      { id: 'k4', title: 'Follow-up 2 proposal sponsor utama', status: 'in_progress', divisionId: 'div-humas', assignee: 'Dimas Saputra' },
      { id: 'k5', title: 'Briefing media partner & publikasi Reels', status: 'review', divisionId: 'div-humas', assignee: 'Dimas Saputra' },
      { id: 'k6', title: 'Booking vendor panggung & lighting auditorium', status: 'done', divisionId: 'div-logistik', assignee: 'Raka Aditya' },
      { id: 'k7', title: 'Cek surat izin peminjaman gedung rektorat', status: 'review', divisionId: 'div-logistik', assignee: 'Raka Aditya' },
    ],
    personalChecklist: [
      { id: 'kc1', text: 'Siapkan bahan paparan progres untuk rapat pleno pekan ini', done: true },
      { id: 'kc2', text: 'Follow-up jadwal gladi bersih dengan koordinator', done: false },
    ],
  },
  kelompok: {
    id: 'kelompok',
    label: 'Kelompok Kuliah & Riset',
    title: 'AI Research Hub & Skripsi Kelompok',
    divisions: [
      { id: 'div-riset', name: 'Divisi Riset & Data', summary: 'Pengumpulan data 10 responden SUS selesai, masuk tahap analisis.' },
      { id: 'div-sistem', name: 'Penulisan & Sistem', summary: 'Integrasi API selesai, sedang penyusunan Bab 3 & dokumentasi.' },
    ],
    members: [
      { id: 'm1', name: 'Budi Pratama', role: 'Ketua Kelompok', level: 'ketua', divisionId: null },
      { id: 'm2', name: 'Citra Maharani', role: 'Koor Divisi Riset', level: 'koor', divisionId: 'div-riset' },
      { id: 'm3', name: 'Andi Wijaya', role: 'Koor Penulisan & Sistem', level: 'koor', divisionId: 'div-sistem' },
      { id: 'm4', name: 'Dina Kartika', role: 'Anggota Divisi Riset', level: 'anggota', divisionId: 'div-riset' },
    ],
    koorForum: [
      {
        id: 'kf1',
        author: 'Budi Pratama (Ketua Kelompok)',
        topic: 'Target Pengumpulan Draft UAS ke Dosen',
        note: 'Pastikan hasil skor SUS dari Divisi Riset sudah sinkron dengan Bab 3 Divisi Penulisan maksimal Kamis malam.',
        tag: 'Keputusan Inti',
        resolved: false,
      },
    ],
    tasks: [
      { id: 't1', title: 'Analisis hasil kuesioner SUS 10 responden', status: 'in_progress', divisionId: 'div-riset', assignee: 'Citra Maharani' },
      { id: 't2', title: 'Susun daftar pertanyaan wawancara evaluasi', status: 'todo', divisionId: 'div-riset', assignee: 'Dina Kartika' },
      { id: 't3', title: 'Rekap data responden Google Form ke tabel', status: 'done', divisionId: 'div-riset', assignee: 'Dina Kartika' },
      { id: 't4', title: 'Integrasi endpoint serah terima Link Notion', status: 'in_progress', divisionId: 'div-sistem', assignee: 'Andi Wijaya' },
      { id: 't5', title: 'Finalisasi Bab 3 Hasil Mockup & Alur', status: 'review', divisionId: 'div-sistem', assignee: 'Andi Wijaya' },
    ],
    personalChecklist: [
      { id: 'c1', text: 'Kirim ringkasan progres pekan ini ke dosen pembimbing', done: true },
      { id: 'c2', text: 'Cek ulang slide presentasi UAS', done: false },
    ],
  },
};

function loadInitialData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore storage errors
  }
  return INITIAL_SCENARIOS;
}

export default function DemoSandboxPage() {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState(loadInitialData);
  const [scenarioKey, setScenarioKey] = useState('kepanitiaan');
  const [activeScope, setActiveScope] = useState('main'); // 'main' | 'koor-forum' | 'personal' | divisionId
  const [activeMemberId, setActiveMemberId] = useState('m1');
  const [quickInputs, setQuickInputs] = useState({});
  const [newCheckText, setNewCheckText] = useState('');
  const [newForumTopic, setNewForumTopic] = useState('');
  const [newForumNote, setNewForumNote] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
    } catch {
      // ignore storage errors
    }
  }, [scenarios]);

  const current = scenarios[scenarioKey];
  const activeMember = current.members.find((m) => m.id === activeMemberId) ?? current.members[0];
  const roleInfo = ROLE_META[activeMember.level];

  // RBAC Permission Helpers
  const canAccessKoorForum = activeMember.level === 'ketua' || activeMember.level === 'koor';
  const canAccessDivision = (divId) =>
    activeMember.level === 'ketua' || activeMember.divisionId === divId;

  const activeDivision = current.divisions.find((d) => d.id === activeScope) ?? null;
  const isCurrentScopeLocked =
    (activeScope === 'koor-forum' && !canAccessKoorForum) ||
    (Boolean(activeDivision) && !canAccessDivision(activeDivision.id));

  const scopedTasks =
    activeScope === 'personal'
      ? current.tasks.filter((t) => t.assignee === activeMember.name)
      : activeDivision
      ? current.tasks.filter((t) => t.divisionId === activeDivision.id)
      : current.tasks;

  const updateCurrentScenario = (updater) => {
    setScenarios((prev) => ({
      ...prev,
      [scenarioKey]: updater(prev[scenarioKey]),
    }));
  };

  const handleMoveTask = (taskId, nextStatus) => {
    if (!nextStatus) return;
    updateCurrentScenario((sc) => ({
      ...sc,
      tasks: sc.tasks.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t)),
    }));
  };

  const handleDeleteTask = (taskId) => {
    updateCurrentScenario((sc) => ({
      ...sc,
      tasks: sc.tasks.filter((t) => t.id !== taskId),
    }));
  };

  const handleAddTask = (colId) => {
    const title = (quickInputs[colId] ?? '').trim();
    if (!title) return;
    const targetDiv = activeDivision?.id ?? activeMember.divisionId ?? current.divisions[0].id;
    updateCurrentScenario((sc) => ({
      ...sc,
      tasks: [
        ...sc.tasks,
        {
          id: `t-${Date.now()}`,
          title,
          status: colId,
          divisionId: targetDiv,
          assignee: activeMember.name,
        },
      ],
    }));
    setQuickInputs((prev) => ({ ...prev, [colId]: '' }));
  };

  const handleAddForumPost = (e) => {
    e.preventDefault();
    const topic = newForumTopic.trim();
    const note = newForumNote.trim();
    if (!topic) return;
    updateCurrentScenario((sc) => ({
      ...sc,
      koorForum: [
        {
          id: `kf-${Date.now()}`,
          author: `${activeMember.name} (${activeMember.role})`,
          topic,
          note: note || 'Agenda koordinasi lintas divisi.',
          tag: activeMember.level === 'ketua' ? 'Arahan Ketua' : 'Koordinasi Koor',
          resolved: false,
        },
        ...sc.koorForum,
      ],
    }));
    setNewForumTopic('');
    setNewForumNote('');
  };

  const handleToggleForumResolved = (id) => {
    updateCurrentScenario((sc) => ({
      ...sc,
      koorForum: sc.koorForum.map((f) => (f.id === id ? { ...f, resolved: !f.resolved } : f)),
    }));
  };

  const handleAddChecklist = (e) => {
    e.preventDefault();
    const text = newCheckText.trim();
    if (!text) return;
    updateCurrentScenario((sc) => ({
      ...sc,
      personalChecklist: [...sc.personalChecklist, { id: `c-${Date.now()}`, text, done: false }],
    }));
    setNewCheckText('');
  };

  const handleToggleChecklist = (id) => {
    updateCurrentScenario((sc) => ({
      ...sc,
      personalChecklist: sc.personalChecklist.map((c) =>
        c.id === id ? { ...c, done: !c.done } : c
      ),
    }));
  };

  const handleResetDemo = () => {
    setScenarios(INITIAL_SCENARIOS);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Clarity Banner */}
      <div className="bg-primary-900 text-white px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start md:items-center gap-2.5 text-xs sm:text-sm">
            <Info size={16} className="text-primary-200 flex-shrink-0 mt-0.5 md:mt-0" aria-hidden />
            <p className="leading-relaxed">
              <strong className="font-semibold">Simulasi Pratinjau Notion (Browser Only):</strong>{' '}
              Coba ganti peran <strong>Ketua → Koor → Anggota</strong> di kiri untuk melihat pembatasan hak akses (RBAC) &amp; <strong>Forum Koor Only</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors"
            >
              <ArrowLeft size={13} aria-hidden />
              Beranda
            </Link>
            <Button
              size="sm"
              onClick={() => navigate('/checkout?paket=custom&cycle=monthly&trial=1')}
              className="bg-white text-primary-700 hover:bg-primary-50"
            >
              Bangunkan di Notion (Gratis 7 Hari)
              <ArrowRight size={14} aria-hidden />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Sandbox Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar — One Source of Navigation with RBAC Locks */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
            {/* Scenario Switcher */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Pilih Skenario Contoh
              </div>
              <div className="grid grid-cols-2 gap-1.5 bg-gray-100 p-1 rounded-xl">
                {Object.values(INITIAL_SCENARIOS).map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      setScenarioKey(sc.id);
                      setActiveScope('main');
                      setActiveMemberId('m1');
                    }}
                    className={cn(
                      'py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors',
                      scenarioKey === sc.id
                        ? 'bg-white text-primary-700 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    {sc.id === 'kepanitiaan' ? 'Kepanitiaan' : 'Kelompok'}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Role Switcher */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block">
                Simulasi Peran (RBAC)
              </label>
              <select
                value={activeMember.id}
                onChange={(e) => setActiveMemberId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {current.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.role}
                  </option>
                ))}
              </select>
              <div className="rounded-xl bg-gray-50 border border-gray-200/80 p-2.5 space-y-1">
                <Badge variant={roleInfo.variant}>{roleInfo.badge}</Badge>
                <p className="text-[11px] text-gray-500 leading-relaxed">{roleInfo.summary}</p>
              </div>
            </div>

            {/* Main Spaces */}
            <div className="space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-2 pb-1">
                Ruang Organisasi
              </div>
              <button
                type="button"
                onClick={() => setActiveScope('main')}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
                  activeScope === 'main'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <span className="flex items-center gap-2">
                  <Globe size={14} aria-hidden />
                  Ruang Utama (Progres)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveScope('koor-forum')}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
                  activeScope === 'koor-forum'
                    ? 'bg-primary-50 text-primary-700'
                    : canAccessKoorForum
                    ? 'text-gray-700 hover:bg-gray-50'
                    : 'text-gray-400 hover:bg-gray-50'
                )}
              >
                <span className="flex items-center gap-2">
                  <MessageSquare size={14} aria-hidden />
                  Forum Koor Only
                </span>
                {canAccessKoorForum ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold">
                    Koor+
                  </span>
                ) : (
                  <Lock size={13} className="text-gray-400" aria-label="Terkunci" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveScope('personal')}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
                  activeScope === 'personal'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <User size={14} aria-hidden />
                Meja Kerja Saya
              </button>
            </div>

            {/* Division List with RBAC Lock */}
            <div className="space-y-1 pt-2 border-t border-gray-100">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-2 pb-1">
                Ruang Divisi (Terproteksi)
              </div>
              {current.divisions.map((div) => {
                const allowed = canAccessDivision(div.id);
                return (
                  <button
                    key={div.id}
                    type="button"
                    onClick={() => setActiveScope(div.id)}
                    className={cn(
                      'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors',
                      activeScope === div.id
                        ? 'bg-primary-50 text-primary-700 font-semibold'
                        : allowed
                        ? 'text-gray-700 hover:bg-gray-50'
                        : 'text-gray-400 hover:bg-gray-50'
                    )}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Layers size={14} aria-hidden />
                      <span className="truncate">{div.name}</span>
                    </span>
                    {!allowed && <Lock size={13} className="text-gray-400 flex-shrink-0" aria-label="Terkunci" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleResetDemo}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-500 hover:text-gray-800 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <RotateCcw size={13} aria-hidden />
                Reset Simulasi
              </button>
            </div>
          </div>
        </aside>

        {/* Main Workspace Canvas */}
        <main className="lg:col-span-9 space-y-4">
          {/* Locked Screen if RBAC denies access */}
          {isCurrentScopeLocked ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center mx-auto">
                <Lock size={22} aria-hidden />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h1 className="text-lg font-bold text-gray-900">
                  Akses Terbatas ({activeScope === 'koor-forum' ? 'Forum Koor Only' : activeDivision?.name})
                </h1>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Kamu sedang mensimulasikan peran <strong>{activeMember.name} ({activeMember.role})</strong>.{' '}
                  {activeScope === 'koor-forum'
                    ? 'Forum Koor Only hanya dapat dibuka oleh Ketua Pelaksana dan Koordinator Divisi.'
                    : 'Ruang kerja internal divisi lain dikunci untuk menjaga fokus & privasi kerja tiap divisi. Kamu tetap bisa memantau paparan progres tiap divisi di Ruang Utama.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button size="sm" onClick={() => setActiveScope('main')}>
                  Kembali ke Ruang Utama
                </Button>
                {activeMember.divisionId && (
                  <Button size="sm" variant="outline" onClick={() => setActiveScope(activeMember.divisionId)}>
                    Buka Divisi Saya
                  </Button>
                )}
              </div>
            </div>
          ) : activeScope === 'main' ? (
            /* VIEW 1: RUANG UTAMA — PAPARAN PROGRES TIAP DIVISI */
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Globe size={18} className="text-primary-600" aria-hidden />
                    <h1 className="text-lg font-bold text-gray-900">
                      Ruang Utama — Paparan Progres Tiap Divisi
                    </h1>
                    <Badge variant={activeMember.level === 'anggota' ? 'gray' : 'primary'}>
                      {activeMember.level === 'anggota' ? 'Mode Lihat (Read-Only)' : 'Akses Pantau & Kelola'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Transparansi progres seluruh divisi <strong>{current.title}</strong> agar Ketua, Koor, maupun Anggota saling mengetahui capaian besar tanpa mencampuri tugas internal divisi lain.
                  </p>
                </div>
              </div>

              {/* Progress Cards per Division */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {current.divisions.map((div) => {
                  const divTasks = current.tasks.filter((t) => t.divisionId === div.id);
                  const divDone = divTasks.filter((t) => t.status === 'done').length;
                  const pct = divTasks.length > 0 ? Math.round((divDone / divTasks.length) * 100) : 0;
                  const allowed = canAccessDivision(div.id);

                  return (
                    <div key={div.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col justify-between gap-4">
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <h2 className="text-sm font-bold text-gray-900">{div.name}</h2>
                          <Badge variant={pct >= 50 ? 'success' : 'primary'}>{pct}%</Badge>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{div.summary}</p>
                        <div className="text-[11px] text-gray-400">
                          {divDone} dari {divTasks.length} tugas utama selesai
                        </div>
                      </div>

                      {allowed ? (
                        <Button size="sm" variant="outline" fullWidth onClick={() => setActiveScope(div.id)}>
                          Buka Ruang {div.name} →
                        </Button>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[11px] font-medium text-gray-400">
                          <Lock size={12} aria-hidden />
                          Ruang Internal Terkunci
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Hierarchy Explanation Strip */}
              <div className="bg-primary-50/70 border border-primary-100 rounded-2xl p-4 flex items-start gap-3 text-xs text-primary-900">
                <ShieldCheck size={18} className="text-primary-600 flex-shrink-0 mt-0.5" aria-hidden />
                <div className="leading-relaxed">
                  <strong>Hierarki Akses Notion Atur.in:</strong>{' '}
                  <strong>Ketua</strong> memantau semua ruang &amp; divisi; <strong>Koordinator</strong> memiliki akses eksklusif <strong>Forum Koor Only</strong> + divisinya sendiri; <strong>Anggota</strong> fokus pada ruang divisinya dan melihat ringkasan progres di <strong>Ruang Utama</strong> ini.
                </div>
              </div>
            </div>
          ) : activeScope === 'koor-forum' ? (
            /* VIEW 2: FORUM KOOR ONLY (KETUA & KOORDINATOR) */
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-purple-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <MessageSquare size={18} className="text-purple-600" aria-hidden />
                    <h1 className="text-lg font-bold text-gray-900">Forum Koor Only</h1>
                    <Badge variant="purple">Khusus Ketua &amp; Koordinator Divisi</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Ruang koordinasi strategis lintas divisi, keputusan rapat BPH/Koor, dan eskalasi kendala yang tidak ditampilkan ke anggota biasa.
                  </p>
                </div>
              </div>

              {/* Add Topic Form */}
              <form onSubmit={handleAddForumPost} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                <h2 className="text-sm font-bold text-gray-900">Tambah Agenda / Keputusan Rapat Koor</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newForumTopic}
                    onChange={(e) => setNewForumTopic(e.target.value)}
                    placeholder="Judul topik koordinasi (mis. Finalisasi anggaran panggung)"
                    className="px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="text"
                    value={newForumNote}
                    onChange={(e) => setNewForumNote(e.target.value)}
                    placeholder="Catatan singkat / tindak lanjut antar-koor..."
                    className="px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <Button type="submit" size="sm">
                  <Plus size={14} aria-hidden />
                  Posting ke Forum Koor
                </Button>
              </form>

              {/* Forum Threads */}
              <div className="space-y-3">
                {current.koorForum.map((post) => (
                  <div key={post.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={post.resolved ? 'success' : 'purple'}>{post.tag}</Badge>
                        <span className="text-[11px] text-gray-400">{post.author}</span>
                      </div>
                      <h3 className={cn('text-sm font-bold text-gray-900', post.resolved && 'line-through text-gray-400')}>
                        {post.topic}
                      </h3>
                      <p className="text-xs text-gray-600 leading-relaxed">{post.note}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleForumResolved(post.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 border transition-colors',
                        post.resolved
                          ? 'bg-success-50 text-success-700 border-success-200'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-primary-50 hover:text-primary-700'
                      )}
                    >
                      {post.resolved ? '✓ Selesai Dibahas' : 'Tandai Selesai'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : activeScope === 'personal' ? (
            /* VIEW 3: MEJA KERJA PRIBADI */
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-primary-600" aria-hidden />
                  <h1 className="text-lg font-bold text-gray-900">Meja Kerja {activeMember.name}</h1>
                  <Badge variant={roleInfo.variant}>{activeMember.role}</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Fokus tugas khusus milik sendiri dan checklist harian pribadi.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                  <h2 className="text-sm font-bold text-gray-900">Daftar Tugas Milik {activeMember.name}</h2>
                  {scopedTasks.length === 0 ? (
                    <p className="text-xs text-gray-400 py-4">Belum ada tugas yang ditugaskan langsung.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {scopedTasks.map((t) => {
                        const col = COLUMNS.find((c) => c.id === t.status);
                        return (
                          <div
                            key={t.id}
                            className="p-3 rounded-xl border border-gray-200 bg-gray-50/70 flex items-center justify-between gap-3"
                          >
                            <div>
                              <p className={cn('text-xs font-semibold text-gray-900', t.status === 'done' && 'line-through text-gray-400')}>
                                {t.title}
                              </p>
                              <p className="text-[11px] text-gray-500 mt-0.5">Status: {col?.label}</p>
                            </div>
                            {col?.next && (
                              <button
                                type="button"
                                onClick={() => handleMoveTask(t.id, col.next)}
                                className="px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 text-[11px] font-semibold hover:bg-primary-100 flex-shrink-0"
                              >
                                {col.nextLabel} →
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                  <h2 className="text-sm font-bold text-gray-900">Checklist Harian Pribadi</h2>
                  <div className="space-y-2">
                    {current.personalChecklist.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggleChecklist(item.id)}
                        className="w-full flex items-start gap-2.5 text-left p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50"
                      >
                        <span
                          className={cn(
                            'w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border',
                            item.done
                              ? 'bg-success-600 border-success-600 text-white'
                              : 'border-gray-300 bg-white'
                          )}
                        >
                          {item.done && <Check size={11} aria-hidden />}
                        </span>
                        <span className={cn('text-xs text-gray-700', item.done && 'line-through text-gray-400')}>
                          {item.text}
                        </span>
                      </button>
                    ))}
                  </div>
                  <form onSubmit={handleAddChecklist} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newCheckText}
                      onChange={(e) => setNewCheckText(e.target.value)}
                      placeholder="Tambah checklist harian..."
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <Button type="submit" size="sm">
                      <Plus size={14} aria-hidden />
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            /* VIEW 4: RUANG DIVISI — KANBAN 4 KOLOM */
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <FolderKanban size={18} className="text-primary-600" aria-hidden />
                  <h1 className="text-lg font-bold text-gray-900">Ruang {activeDivision?.name}</h1>
                  <Badge variant="primary">Kanban Internal Divisi</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Hanya dapat diakses oleh <strong>Ketua</strong>, <strong>Koor {activeDivision?.name}</strong>, dan <strong>Anggota {activeDivision?.name}</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
                {COLUMNS.map((col) => {
                  const colTasks = scopedTasks.filter((t) => t.status === col.id);
                  return (
                    <div
                      key={col.id}
                      className="bg-white rounded-2xl border border-gray-200 p-3.5 flex flex-col gap-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn('w-2 h-2 rounded-full', col.dot)} aria-hidden />
                          <span className="text-xs font-bold text-gray-800">{col.label}</span>
                        </div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {colTasks.length}
                        </span>
                      </div>

                      <div className="space-y-2 flex-1">
                        {colTasks.map((task) => (
                          <div
                            key={task.id}
                            className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn('text-xs font-semibold text-gray-900 leading-snug', task.status === 'done' && 'line-through text-gray-400')}>
                                {task.title}
                              </p>
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-gray-300 hover:text-danger-600 flex-shrink-0"
                                aria-label="Hapus tugas"
                              >
                                <Trash2 size={12} aria-hidden />
                              </button>
                            </div>
                            <div className="text-[10px] text-gray-500">PIC: {task.assignee}</div>
                            {col.next && (
                              <button
                                type="button"
                                onClick={() => handleMoveTask(task.id, col.next)}
                                className="w-full text-right text-[11px] font-semibold text-primary-600 hover:text-primary-700 pt-1"
                              >
                                Pindah ke {col.nextLabel} →
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-1.5 pt-1">
                        <input
                          type="text"
                          value={quickInputs[col.id] ?? ''}
                          onChange={(e) => setQuickInputs((p) => ({ ...p, [col.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddTask(col.id);
                          }}
                          placeholder="+ Tambah tugas..."
                          className="flex-1 min-w-0 px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddTask(col.id)}
                          className="px-2 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100"
                          aria-label="Tambah tugas"
                        >
                          <Plus size={13} aria-hidden />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
