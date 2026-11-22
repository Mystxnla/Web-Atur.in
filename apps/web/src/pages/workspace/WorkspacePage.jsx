import { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchWorkspace,
  updateWorkspace,
  resetWorkspaceTemplate,
} from '../../services/api/index.js';
import { toDisplayRef } from '../../lib/orderRef.js';
import Skeleton from '../../components/ui/Skeleton.jsx';
import Button from '../../components/ui/Button.jsx';
import { toast } from 'sonner';
import { cn } from '../../lib/cn.js';
import {
  FolderKanban,
  FileText,
  Users,
  Plus,
  Trash2,
  Check,
  ExternalLink,
  RotateCcw,
  ChevronRight,
  Menu,
  X,
  ArrowLeft,
  ArrowRight,
  Link2,
} from 'lucide-react';

const KANBAN_COLUMNS = [
  { id: 'todo', label: 'Rencana', dot: 'bg-gray-400', next: 'in_progress', nextLabel: 'Kerjakan' },
  { id: 'in_progress', label: 'Dikerjakan', dot: 'bg-primary-600', next: 'review', nextLabel: 'Review' },
  { id: 'review', label: 'Revisi & review', dot: 'bg-warning-500', next: 'done', nextLabel: 'Selesai' },
  { id: 'done', label: 'Selesai', dot: 'bg-success-600', next: null, nextLabel: null },
];

export default function WorkspacePage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('kanban'); // 'kanban' | 'resources' | pageId
  const [quickTaskInputs, setQuickTaskInputs] = useState({});
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const [newChecklistText, setNewChecklistText] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const saveTimerRef = useRef(null);

  const { data: workspace, isLoading, error } = useQuery({
    queryKey: ['workspace', orderId],
    queryFn: () => fetchWorkspace(orderId),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => updateWorkspace(orderId, payload),
    onSuccess: (updated) => {
      qc.setQueryData(['workspace', orderId], updated);
    },
    onError: (err) => toast.error('Gagal menyimpan: ' + err.message),
  });

  const resetMutation = useMutation({
    mutationFn: () => resetWorkspaceTemplate(orderId),
    onSuccess: (updated) => {
      qc.setQueryData(['workspace', orderId], updated);
      toast.success('Ruang kerja dikembalikan ke templat awal');
    },
  });

  const updateWorkspaceOptimistic = (patch, debounceMs = 0) => {
    qc.setQueryData(['workspace', orderId], (old) => (old ? { ...old, ...patch } : old));
    clearTimeout(saveTimerRef.current);
    if (debounceMs > 0) {
      saveTimerRef.current = setTimeout(() => {
        saveMutation.mutate(patch);
      }, debounceMs);
    } else {
      saveMutation.mutate(patch);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex">
        <div className="w-60 border-r border-gray-200 bg-gray-50 p-4 hidden md:block space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-5/6" />
        </div>
        <div className="flex-1 p-8 space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center space-y-3">
        <p className="text-danger-600 text-sm font-medium">Ruang kerja tidak ditemukan</p>
        <Link to="/lacak-pesanan" className="text-xs text-primary-600 font-medium hover:underline">
          Kembali ke halaman masuk
        </Link>
      </div>
    );
  }

  const order = workspace.order;
  const displayRef = toDisplayRef(order?.ref_number ?? orderId);
  const pages = workspace.pages ?? [];
  const tasks = workspace.tasks ?? [];
  const members = workspace.members ?? [];
  const links = workspace.links ?? [];

  const activePage = pages.find((p) => p.id === activeView);
  const doneCount = tasks.filter((t) => t.status === 'done').length;

  // ── Kanban Handlers ──
  const handleQuickAddTask = (colId) => {
    const title = (quickTaskInputs[colId] ?? '').trim();
    if (!title) return;

    const nextTasks = [
      ...tasks,
      {
        id: `tsk-${Date.now()}`,
        title,
        status: colId,
        assignee: members[0]?.name || 'Anggota',
        priority: 'medium',
        tag: 'Tugas',
        dueDate: 'Minggu ini',
      },
    ];
    setQuickTaskInputs((prev) => ({ ...prev, [colId]: '' }));
    updateWorkspaceOptimistic({ tasks: nextTasks });
  };

  const handleMoveTask = (taskId, nextStatus) => {
    if (!nextStatus) return;
    const nextTasks = tasks.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t));
    updateWorkspaceOptimistic({ tasks: nextTasks });
  };

  const handleCycleTaskAssignee = (taskId) => {
    if (members.length === 0) return;
    const nextTasks = tasks.map((t) => {
      if (t.id !== taskId) return t;
      const idx = members.findIndex((m) => m.name === t.assignee);
      const nextMember = members[(idx + 1) % members.length];
      return { ...t, assignee: nextMember.name };
    });
    updateWorkspaceOptimistic({ tasks: nextTasks });
  };

  const handleDeleteTask = (taskId) => {
    const nextTasks = tasks.filter((t) => t.id !== taskId);
    updateWorkspaceOptimistic({ tasks: nextTasks });
  };

  // ── Document Canvas Handlers ──
  const handleAddPage = () => {
    const newId = `page-${Date.now()}`;
    const newPage = {
      id: newId,
      title: 'Kertas kerja baru',
      callout: 'Ringkasan atau kesepakatan utama untuk dokumen ini.',
      content: '',
      checklist: [
        { id: `chk-${Date.now()}`, text: 'Tulis langkah pertama tim di sini', done: false },
      ],
    };
    const nextPages = [...pages, newPage];
    updateWorkspaceOptimistic({ pages: nextPages });
    setActiveView(newId);
  };

  const handleDeletePage = (pageId) => {
    if (pages.length <= 1) {
      toast.error('Minimal harus ada satu halaman dokumen');
      return;
    }
    const nextPages = pages.filter((p) => p.id !== pageId);
    updateWorkspaceOptimistic({ pages: nextPages });
    if (activeView === pageId) {
      setActiveView(nextPages[0]?.id ?? 'kanban');
    }
  };

  const handlePageChange = (pageId, field, value) => {
    const nextPages = pages.map((p) => (p.id === pageId ? { ...p, [field]: value } : p));
    updateWorkspaceOptimistic({ pages: nextPages }, 450);
  };

  const handleToggleChecklist = (pageId, chkId) => {
    const nextPages = pages.map((p) => {
      if (p.id !== pageId) return p;
      const nextList = (p.checklist ?? []).map((c) =>
        c.id === chkId ? { ...c, done: !c.done } : c
      );
      return { ...p, checklist: nextList };
    });
    updateWorkspaceOptimistic({ pages: nextPages });
  };

  const handleAddChecklistItem = (pageId) => {
    const text = newChecklistText.trim();
    if (!text) return;
    const nextPages = pages.map((p) => {
      if (p.id !== pageId) return p;
      return {
        ...p,
        checklist: [
          ...(p.checklist ?? []),
          { id: `chk-${Date.now()}`, text, done: false },
        ],
      };
    });
    setNewChecklistText('');
    updateWorkspaceOptimistic({ pages: nextPages });
  };

  const handleDeleteChecklistItem = (pageId, chkId) => {
    const nextPages = pages.map((p) => {
      if (p.id !== pageId) return p;
      return {
        ...p,
        checklist: (p.checklist ?? []).filter((c) => c.id !== chkId),
      };
    });
    updateWorkspaceOptimistic({ pages: nextPages });
  };

  // ── Team & Links Handlers ──
  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    const nextMembers = [
      ...members,
      {
        id: `mem-${Date.now()}`,
        name: newMemberName.trim(),
        role: newMemberRole.trim() || 'Anggota',
      },
    ];
    setNewMemberName('');
    setNewMemberRole('');
    updateWorkspaceOptimistic({ members: nextMembers });
  };

  const handleRemoveMember = (memberId) => {
    if (members.length <= 1) return;
    updateWorkspaceOptimistic({ members: members.filter((m) => m.id !== memberId) });
  };

  const handleAddLink = (e) => {
    e.preventDefault();
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;
    const url = newLinkUrl.startsWith('http') ? newLinkUrl.trim() : `https://${newLinkUrl.trim()}`;
    const nextLinks = [
      ...links,
      {
        id: `lnk-${Date.now()}`,
        title: newLinkTitle.trim(),
        category: 'Tautan',
        url,
      },
    ];
    setNewLinkTitle('');
    setNewLinkUrl('');
    updateWorkspaceOptimistic({ links: nextLinks });
  };

  const handleRemoveLink = (linkId) => {
    updateWorkspaceOptimistic({ links: links.filter((l) => l.id !== linkId) });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex">
      {/* Unified Atur.in Brand Sidebar (bg-gray-50, border-gray-200, primary-50/primary-700 active state) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[248px] bg-gray-50 border-r border-gray-200 flex flex-col transition-transform duration-150 select-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0 md:static md:flex'
        )}
      >
        {/* Workspace Identity & Signature Live Reference */}
        <div className="h-14 px-4 border-b border-gray-200 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{workspace.title}</div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono tabular-nums">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500" aria-hidden />
              <span>{displayRef}</span>
              <span>·</span>
              <span>{doneCount}/{tasks.length}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 text-gray-400 hover:text-gray-700 rounded-md"
            aria-label="Tutup navigasi"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Group 1: Ruang kerja utama */}
          <div>
            <div className="px-2 mb-2 text-xs font-medium text-gray-400">
              Ruang kerja
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => { setActiveView('kanban'); setSidebarOpen(false); }}
                className={cn(
                  'w-full h-9 px-2.5 rounded-lg text-sm flex items-center justify-between transition-colors',
                  activeView === 'kanban'
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <span className="flex items-center gap-2.5">
                  <FolderKanban
                    size={16}
                    strokeWidth={1.5}
                    className={activeView === 'kanban' ? 'text-primary-600' : 'text-gray-400'}
                  />
                  <span>Papan tugas</span>
                </span>
                <span className="text-xs font-mono text-gray-400 tabular-nums">
                  {tasks.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveView('resources'); setSidebarOpen(false); }}
                className={cn(
                  'w-full h-9 px-2.5 rounded-lg text-sm flex items-center justify-between transition-colors',
                  activeView === 'resources'
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Users
                    size={16}
                    strokeWidth={1.5}
                    className={activeView === 'resources' ? 'text-primary-600' : 'text-gray-400'}
                  />
                  <span>Tim &amp; tautan</span>
                </span>
                <span className="text-xs font-mono text-gray-400 tabular-nums">
                  {members.length}
                </span>
              </button>
            </div>
          </div>

          {/* Group 2: Kertas kerja & dokumen */}
          <div>
            <div className="px-2 mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">
                Kertas kerja
              </span>
              <button
                type="button"
                onClick={handleAddPage}
                className="p-1 rounded-md text-gray-400 hover:text-primary-600 hover:bg-gray-100"
                title="Tambah halaman kertas kerja"
              >
                <Plus size={14} strokeWidth={1.5} />
              </button>
            </div>
            <div className="space-y-1">
              {pages.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setActiveView(p.id); setSidebarOpen(false); }}
                  className={cn(
                    'w-full h-9 px-2.5 rounded-lg text-sm flex items-center gap-2.5 transition-colors text-left',
                    activeView === p.id
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <FileText
                    size={16}
                    strokeWidth={1.5}
                    className={activeView === p.id ? 'text-primary-600 flex-shrink-0' : 'text-gray-400 flex-shrink-0'}
                  />
                  <span className="truncate flex-1">{p.title.replace(/^[^\w\s]+\s*/, '')}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={handleAddPage}
                className="w-full h-8 px-2.5 rounded-lg text-xs text-gray-400 hover:text-primary-600 hover:bg-gray-100 flex items-center gap-2.5 transition-colors"
              >
                <Plus size={14} strokeWidth={1.5} />
                <span>Halaman baru</span>
              </button>
            </div>
          </div>
        </div>

        {/* Trial strip & Bottom Actions */}
        <div className="p-3 border-t border-gray-200 space-y-2">
          {order?.isTrial && (
            <div className="p-2.5 rounded-xl bg-primary-50 border border-primary-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-primary-700">Masa uji coba 7 hari</span>
                <span className="text-primary-600 font-mono">Rp 0</span>
              </div>
              <Button
                size="sm"
                fullWidth
                onClick={() => navigate(`/checkout/pembayaran/${order.id}`)}
              >
                Aktifkan paket penuh
              </Button>
            </div>
          )}

          <div className="space-y-0.5 text-xs">
            <Link
              to={`/lacak-pesanan/${order?.id ?? orderId}`}
              className="h-8 px-2.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-2 transition-colors"
            >
              <FileText size={14} strokeWidth={1.5} />
              <span>Detail &amp; invoice pesanan</span>
            </Link>
            <Link
              to="/lacak-pesanan"
              className="h-8 px-2.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-2 transition-colors"
            >
              <ArrowLeft size={14} strokeWidth={1.5} />
              <span>Pindah ruang kerja</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Quiet 56px Top Bar */}
        <header className="h-14 bg-white/90 backdrop-blur border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 min-w-0 text-sm">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 -ml-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
              aria-label="Buka sidebar"
            >
              <Menu size={18} strokeWidth={1.5} />
            </button>
            <span className="text-gray-400 truncate hidden sm:inline">{workspace.title}</span>
            <ChevronRight size={14} strokeWidth={1.5} className="text-gray-300 hidden sm:inline" />
            <span className="font-medium text-gray-900 truncate">
              {activeView === 'kanban'
                ? 'Papan tugas'
                : activeView === 'resources'
                ? 'Tim & tautan'
                : activePage?.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 tabular-nums">
              {saveMutation.isPending ? 'Menyimpan...' : 'Tersimpan'}
            </span>
            <button
              type="button"
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
              className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
              title="Kembalikan isi contoh awal"
            >
              <RotateCcw size={13} strokeWidth={1.5} />
              <span className="hidden sm:inline">Reset templat</span>
            </button>
          </div>
        </header>

        {/* Main Workspace Canvas */}
        <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 py-8">
          {/* Editable Workspace Title & Quick Links Bar */}
          <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-gray-200">
            <div className="space-y-1 flex-1">
              <input
                type="text"
                key={workspace.title}
                defaultValue={workspace.title}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val && val !== workspace.title) {
                    updateWorkspaceOptimistic({ title: val });
                  }
                }}
                aria-label="Nama ruang kerja"
                className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 bg-transparent focus:outline-none focus:bg-gray-50 rounded-md px-1.5 -ml-1.5 w-full max-w-xl"
              />
              <p className="text-sm text-gray-500">
                {order?.package?.nama ?? 'Setup Custom'} · <span className="tabular-nums font-medium text-primary-700">{doneCount} dari {tasks.length} tugas selesai</span>
              </p>
            </div>

            {/* Quick Resource Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {links.slice(0, 3).map((lnk) => (
                <a
                  key={lnk.id}
                  href={lnk.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 px-3 rounded-lg border border-gray-200 bg-white hover:bg-primary-50 hover:border-primary-200 text-xs font-medium text-gray-700 hover:text-primary-700 flex items-center gap-1.5 transition-colors"
                >
                  <Link2 size={13} strokeWidth={1.5} className="text-gray-400" />
                  <span>{lnk.title}</span>
                  <ExternalLink size={12} strokeWidth={1.5} className="text-gray-400" />
                </a>
              ))}
            </div>
          </div>

          {/* ── VIEW 1: SPRINT KANBAN BOARD ── */}
          {activeView === 'kanban' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
                {KANBAN_COLUMNS.map((col) => {
                  const colTasks = tasks.filter((t) => t.status === col.id);
                  const isDragTarget = dragOverCol === col.id;

                  return (
                    <div
                      key={col.id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragOverCol !== col.id) setDragOverCol(col.id);
                      }}
                      onDragLeave={() => setDragOverCol(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverCol(null);
                        if (draggedTaskId) {
                          handleMoveTask(draggedTaskId, col.id);
                          setDraggedTaskId(null);
                        }
                      }}
                      className={cn(
                        'rounded-xl bg-gray-50 border p-3 space-y-2.5 transition-colors',
                        isDragTarget ? 'border-primary-500 bg-primary-50/50' : 'border-gray-200/80'
                      )}
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between px-1 py-0.5">
                        <div className="flex items-center gap-2">
                          <span className={cn('w-2 h-2 rounded-full', col.dot)} aria-hidden />
                          <h2 className="text-xs font-medium text-gray-800">
                            {col.label}
                          </h2>
                        </div>
                        <span className="text-xs font-mono text-gray-400 tabular-nums">
                          {colTasks.length}
                        </span>
                      </div>

                      {/* Task Cards */}
                      <div className="space-y-2">
                        {colTasks.map((task) => {
                          const isDone = task.status === 'done';
                          return (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={() => setDraggedTaskId(task.id)}
                              onDragEnd={() => {
                                setDraggedTaskId(null);
                                setDragOverCol(null);
                              }}
                              className="bg-white rounded-lg p-3 border border-gray-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-primary-300 transition-colors space-y-2.5 cursor-grab active:cursor-grabbing group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p
                                  className={cn(
                                    'text-sm leading-snug',
                                    isDone ? 'line-through text-gray-400' : 'text-gray-900 font-normal'
                                  )}
                                >
                                  {task.title}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-danger-600 p-0.5 rounded transition-opacity flex-shrink-0"
                                  title="Hapus tugas"
                                >
                                  <Trash2 size={13} strokeWidth={1.5} />
                                </button>
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
                                <button
                                  type="button"
                                  onClick={() => handleCycleTaskAssignee(task.id)}
                                  title="Klik untuk ganti penanggung jawab (PIC)"
                                  className="px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium truncate max-w-[130px] transition-colors"
                                >
                                  {task.assignee}
                                </button>

                                {col.next ? (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveTask(task.id, col.next)}
                                    className="px-2 py-0.5 rounded bg-primary-50 hover:bg-primary-600 hover:text-white text-primary-700 font-medium flex items-center gap-1 transition-colors"
                                    title={`Pindahkan ke ${col.nextLabel}`}
                                  >
                                    <span>{col.nextLabel}</span>
                                    <ArrowRight size={12} strokeWidth={1.5} />
                                  </button>
                                ) : (
                                  <span className="text-success-600 font-medium flex items-center gap-1">
                                    <Check size={13} strokeWidth={1.5} />
                                    Selesai
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Zero-friction Inline Quick Add */}
                      <div className="pt-0.5">
                        <div className="flex items-center gap-1.5 bg-white/80 focus-within:bg-white rounded-lg border border-transparent focus-within:border-primary-400 px-2.5 h-9 transition-colors">
                          <Plus size={14} strokeWidth={1.5} className="text-gray-400 flex-shrink-0" />
                          <input
                            type="text"
                            placeholder="Ketik tugas baru, tekan Enter"
                            value={quickTaskInputs[col.id] ?? ''}
                            onChange={(e) =>
                              setQuickTaskInputs((prev) => ({ ...prev, [col.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleQuickAddTask(col.id);
                              }
                            }}
                            className="w-full bg-transparent text-xs text-gray-900 placeholder-gray-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── VIEW 2: BORDERLESS DOCUMENT CANVAS ── */}
          {activePage && (
            <div className="max-w-3xl bg-white rounded-xl border border-gray-200 p-6 sm:p-10 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-8">
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5">
                <input
                  type="text"
                  key={`title-${activePage.id}`}
                  defaultValue={activePage.title.replace(/^[^\w\s]+\s*/, '')}
                  onChange={(e) =>
                    handlePageChange(activePage.id, 'title', e.target.value || 'Dokumen tanpa judul')
                  }
                  placeholder="Judul halaman"
                  className="text-2xl font-semibold text-gray-900 bg-transparent w-full focus:outline-none"
                />
                {pages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeletePage(activePage.id)}
                    className="text-xs text-gray-400 hover:text-danger-600 px-2 py-1 rounded hover:bg-gray-50 transition-colors flex-shrink-0"
                  >
                    Hapus halaman
                  </button>
                )}
              </div>

              {/* Quiet Summary Callout */}
              <div className="rounded-xl bg-primary-50/60 border border-primary-100 p-4">
                <div className="text-xs font-medium text-primary-700 mb-1">
                  Kesepakatan &amp; ringkasan
                </div>
                <textarea
                  key={`callout-${activePage.id}`}
                  defaultValue={activePage.callout}
                  rows={2}
                  onChange={(e) => handlePageChange(activePage.id, 'callout', e.target.value)}
                  placeholder="Tulis tujuan utama atau aturan singkat halaman ini..."
                  className="w-full bg-transparent text-sm text-gray-800 leading-relaxed focus:outline-none resize-none"
                />
              </div>

              {/* Interactive Checklist Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Daftar periksa (Checklist)</h3>
                  <span className="text-xs font-mono text-gray-500 tabular-nums">
                    {(activePage.checklist ?? []).filter((c) => c.done).length}/{(activePage.checklist ?? []).length} selesai
                  </span>
                </div>

                <div className="divide-y divide-gray-100 border-t border-b border-gray-200/80">
                  {(activePage.checklist ?? []).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 py-2.5 group"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleChecklist(activePage.id, item.id)}
                        className="flex items-center gap-3 text-left flex-1"
                      >
                        <span
                          className={cn(
                            'w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0',
                            item.done
                              ? 'bg-primary-600 border-primary-600 text-white'
                              : 'border-gray-300 bg-white'
                          )}
                        >
                          {item.done && <Check size={11} strokeWidth={2} />}
                        </span>
                        <span
                          className={cn(
                            'text-sm leading-snug',
                            item.done ? 'line-through text-gray-400' : 'text-gray-800'
                          )}
                        >
                          {item.text}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteChecklistItem(activePage.id, item.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-danger-600 p-1 transition-opacity"
                        aria-label="Hapus baris"
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <Plus size={15} strokeWidth={1.5} className="text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Tambah item periksa baru lalu tekan Enter"
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklistItem(activePage.id);
                      }
                    }}
                    className="flex-1 text-sm text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none py-1"
                  />
                </div>
              </div>

              {/* Seamless Document Body Canvas */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="text-xs font-medium text-gray-400">
                  Catatan dokumen &amp; notulensi
                </div>
                <textarea
                  key={`content-${activePage.id}`}
                  defaultValue={activePage.content}
                  rows={10}
                  onChange={(e) => handlePageChange(activePage.id, 'content', e.target.value)}
                  placeholder="Ketik langsung di sini seperti di halaman buku catatan. Semua perubahan tersimpan otomatis..."
                  className="w-full bg-transparent text-[15px] text-gray-800 leading-relaxed focus:outline-none resize-y"
                />
              </div>
            </div>
          )}

          {/* ── VIEW 3: TEAM & RESOURCE LINKS ── */}
          {activeView === 'resources' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Resource Links Table */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <div>
                  <h2 className="text-base font-medium text-gray-900">Tautan &amp; dokumen tim</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Simpan akses folder Google Drive, ruang Meet, Figma, atau referensi jurnal.
                  </p>
                </div>

                <div className="divide-y divide-gray-100 border-t border-b border-gray-200/80">
                  {links.map((lnk) => (
                    <div key={lnk.id} className="py-3 flex items-center justify-between gap-3 group">
                      <a
                        href={lnk.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 min-w-0 flex-1 hover:text-primary-600 transition-colors"
                      >
                        <Link2 size={16} strokeWidth={1.5} className="text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{lnk.title}</div>
                          <div className="text-xs text-gray-400 truncate">{lnk.url}</div>
                        </div>
                      </a>
                      <div className="flex items-center gap-2">
                        <a
                          href={lnk.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 hover:bg-primary-50 px-2.5 py-1 rounded-md border border-primary-200 font-medium"
                        >
                          Buka
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveLink(lnk.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-danger-600 p-1"
                          aria-label="Hapus tautan"
                        >
                          <Trash2 size={14} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddLink} className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Nama tautan (mis. Folder Drive)"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    className="flex-1 h-9 rounded-lg border border-gray-200 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="text"
                    placeholder="https://drive.google.com/..."
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    className="flex-1 h-9 rounded-lg border border-gray-200 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <Button type="submit" size="sm">
                    Simpan
                  </Button>
                </form>
              </div>

              {/* Team Members List */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <div>
                  <h2 className="text-base font-medium text-gray-900">Anggota kelompok</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Klik nama anggota pada kartu tugas di papan Kanban untuk mengganti PIC.
                  </p>
                </div>

                <div className="divide-y divide-gray-100 border-t border-b border-gray-200/80">
                  {members.map((m) => (
                    <div key={m.id} className="py-3 flex items-center justify-between gap-3 group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-md bg-primary-50 text-primary-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                          {m.name[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{m.name}</div>
                          <div className="text-xs text-gray-500 truncate">{m.role}</div>
                        </div>
                      </div>
                      {members.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-danger-600 p-1"
                          aria-label="Hapus anggota"
                        >
                          <Trash2 size={14} strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Nama anggota"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="flex-1 h-9 rounded-lg border border-gray-200 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="text"
                    placeholder="Peran / divisi"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="flex-1 h-9 rounded-lg border border-gray-200 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <Button type="submit" size="sm">
                    Tambah
                  </Button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
