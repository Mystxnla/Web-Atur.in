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
  Plus,
  RotateCcw,
  Trash2,
  User,
} from 'lucide-react';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { cn } from '../../lib/cn.js';

const STORAGE_KEY = 'aturin.demo.sandbox.v1';

const COLUMNS = [
  { id: 'todo', label: 'Rencana', dot: 'bg-gray-400', next: 'in_progress', nextLabel: 'Kerjakan' },
  { id: 'in_progress', label: 'Dikerjakan', dot: 'bg-primary-600', next: 'review', nextLabel: 'Review' },
  { id: 'review', label: 'Revisi & review', dot: 'bg-warning-500', next: 'done', nextLabel: 'Selesai' },
  { id: 'done', label: 'Selesai', dot: 'bg-success-600', next: null, nextLabel: null },
];

const INITIAL_SCENARIOS = {
  kelompok: {
    id: 'kelompok',
    label: 'Kelompok Kuliah & Riset',
    title: 'AI Research Hub & Skripsi Kelompok',
    divisions: [
      { id: 'div-inti', name: 'Inti & Koordinasi' },
      { id: 'div-riset', name: 'Divisi Riset & Data' },
      { id: 'div-sistem', name: 'Penulisan & Sistem' },
    ],
    members: [
      { id: 'm1', name: 'Budi Pratama', role: 'Ketua Kelompok', divisionId: 'div-inti' },
      { id: 'm2', name: 'Citra Maharani', role: 'Divisi Riset & Data', divisionId: 'div-riset' },
      { id: 'm3', name: 'Andi Wijaya', role: 'Penulisan & Sistem', divisionId: 'div-sistem' },
    ],
    tasks: [
      { id: 't1', title: 'Susun daftar pertanyaan wawancara dosen', status: 'todo', divisionId: 'div-riset', assignee: 'Citra Maharani' },
      { id: 't2', title: 'Analisis hasil kuesioner SUS 10 responden', status: 'in_progress', divisionId: 'div-riset', assignee: 'Citra Maharani' },
      { id: 't3', title: 'Integrasi modul autentikasi & endpoint API', status: 'in_progress', divisionId: 'div-sistem', assignee: 'Andi Wijaya' },
      { id: 't4', title: 'Review draft Bab 3 Hasil Mockup & Alur', status: 'review', divisionId: 'div-inti', assignee: 'Budi Pratama' },
      { id: 't5', title: 'Finalisasi pembagian 3 divisi & jadwal mingguan', status: 'done', divisionId: 'div-inti', assignee: 'Budi Pratama' },
      { id: 't6', title: 'Setup folder Google Drive referensi jurnal', status: 'done', divisionId: 'div-sistem', assignee: 'Andi Wijaya' },
    ],
    personalChecklist: [
      { id: 'c1', text: 'Kirim ringkasan progres pekan ini ke dosen pembimbing', done: true },
      { id: 'c2', text: 'Cek ulang jadwal rapat sinkronisasi Jumat malam', done: false },
    ],
  },
  kepanitiaan: {
    id: 'kepanitiaan',
    label: 'Kepanitiaan & Event',
    title: 'Panitia Festival Kampus 2026',
    divisions: [
      { id: 'div-bph', name: 'BPH & Inti' },
      { id: 'div-acara', name: 'Divisi Acara' },
      { id: 'div-humas', name: 'Humas & Sponsor' },
    ],
    members: [
      { id: 'm1', name: 'Raka Aditya', role: 'Ketua Pelaksana', divisionId: 'div-bph' },
      { id: 'm2', name: 'Nadia Putri', role: 'Koordinator Acara', divisionId: 'div-acara' },
      { id: 'm3', name: 'Dimas Saputra', role: 'Humas & Sponsor', divisionId: 'div-humas' },
    ],
    tasks: [
      { id: 'k1', title: 'Finalisasi rundown teknis hari-H & cue card MC', status: 'in_progress', divisionId: 'div-acara', assignee: 'Nadia Putri' },
      { id: 'k2', title: 'Follow-up 5 proposal sponsor utama', status: 'in_progress', divisionId: 'div-humas', assignee: 'Dimas Saputra' },
      { id: 'k3', title: 'Konfirmasi surat izin peminjaman auditorium', status: 'review', divisionId: 'div-bph', assignee: 'Raka Aditya' },
      { id: 'k4', title: 'Briefing media partner & publikasi Instagram Reels', status: 'todo', divisionId: 'div-humas', assignee: 'Dimas Saputra' },
      { id: 'k5', title: 'Penetapan tema acara & struktur panitia inti', status: 'done', divisionId: 'div-bph', assignee: 'Raka Aditya' },
    ],
    personalChecklist: [
      { id: 'kc1', text: 'Konfirmasi konfirmator bintang tamu', done: true },
      { id: 'kc2', text: 'Cek RAB divisi logistik sebelum rapat pleno', done: false },
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
  const [scenarioKey, setScenarioKey] = useState('kelompok');
  const [activeScope, setActiveScope] = useState('org'); // 'org' | 'personal' | divisionId
  const [activeMemberId, setActiveMemberId] = useState('m1');
  const [quickInputs, setQuickInputs] = useState({});
  const [newCheckText, setNewCheckText] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
    } catch {
      // ignore storage errors
    }
  }, [scenarios]);

  const current = scenarios[scenarioKey];
  const activeMember = current.members.find((m) => m.id === activeMemberId) ?? current.members[0];
  const activeDivision = current.divisions.find((d) => d.id === activeScope) ?? null;

  const scopedTasks =
    activeScope === 'personal'
      ? current.tasks.filter((t) => t.assignee === activeMember.name)
      : activeDivision
      ? current.tasks.filter((t) => t.divisionId === activeDivision.id)
      : current.tasks;

  const doneCount = scopedTasks.filter((t) => t.status === 'done').length;

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
    const targetDiv = activeDivision?.id ?? activeMember.divisionId;
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
      {/* Top Clarity Banner — 100% Client-Side Notice */}
      <div className="bg-primary-900 text-white px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start md:items-center gap-2.5 text-xs sm:text-sm">
            <Info size={16} className="text-primary-200 flex-shrink-0 mt-0.5 md:mt-0" aria-hidden />
            <p className="leading-relaxed">
              <strong className="font-semibold">Simulasi Pratinjau Interaktif (Browser Only):</strong>{' '}
              Beginilah gambaran struktur kerja yang akan kami bangun di <strong>Notion &amp; Google Drive</strong> tim kamu.
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
        {/* Sidebar — One Source of Navigation */}
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
                      setActiveScope('org');
                      setActiveMemberId('m1');
                    }}
                    className={cn(
                      'py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors',
                      scenarioKey === sc.id
                        ? 'bg-white text-primary-700 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    {sc.id === 'kelompok' ? 'Kelompok' : 'Kepanitiaan'}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Member Switcher */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">
                Simulasi Peran Anggota
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
            </div>

            {/* Scope Navigation */}
            <div className="space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-2 pb-1">
                Lingkup Kerja
              </div>
              <button
                type="button"
                onClick={() => setActiveScope('org')}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
                  activeScope === 'org'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Globe size={14} aria-hidden />
                Semua Divisi (1 Organisasi)
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

            {/* Division List */}
            <div className="space-y-1 pt-2 border-t border-gray-100">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-2 pb-1">
                Ruang Divisi
              </div>
              {current.divisions.map((div) => (
                <button
                  key={div.id}
                  type="button"
                  onClick={() => setActiveScope(div.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors',
                    activeScope === div.id
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <Layers size={14} aria-hidden />
                  {div.name}
                </button>
              ))}
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
          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <FolderKanban size={18} className="text-primary-600" aria-hidden />
                <h1 className="text-lg font-bold text-gray-900">
                  {activeScope === 'org'
                    ? `${current.title} — Master Board`
                    : activeScope === 'personal'
                    ? `Meja Kerja ${activeMember.name}`
                    : activeDivision?.name}
                </h1>
                <Badge variant="primary">Simulasi Notion</Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Progres lingkup ini: <strong>{doneCount}</strong> dari <strong>{scopedTasks.length}</strong> tugas selesai.
                Coba tambah atau pindahkan status tugas di bawah.
              </p>
            </div>
          </div>

          {activeScope === 'personal' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Personal Tasks */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                <h2 className="text-sm font-bold text-gray-900">Daftar Tugas Milik {activeMember.name}</h2>
                {scopedTasks.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4">Belum ada tugas untuk anggota ini.</p>
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

              {/* Personal Checklist */}
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
          ) : (
            /* 4-Column Kanban Board */
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
                      {colTasks.map((task) => {
                        const divName = current.divisions.find((d) => d.id === task.divisionId)?.name;
                        return (
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
                            <div className="flex items-center justify-between gap-1 text-[10px] text-gray-500">
                              <span className="px-1.5 py-0.5 rounded bg-primary-50 text-primary-700 font-medium truncate">
                                {divName ?? 'Umum'}
                              </span>
                              <span className="truncate">{task.assignee}</span>
                            </div>
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
                        );
                      })}
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
          )}
        </main>
      </div>
    </div>
  );
}
