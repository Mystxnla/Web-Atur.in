import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchWorkspace,
  updateWorkspace,
  resetWorkspaceTemplate,
} from '../../services/api/index.js';
import { toDisplayRef } from '../../lib/orderRef.js';
import { formatTanggalWIB } from '../../lib/format.js';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { toast } from 'sonner';
import { cn } from '../../lib/cn.js';
import {
  LayoutGrid,
  FileText,
  Users,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  ExternalLink,
  RotateCcw,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Menu,
  X,
  ArrowLeft,
  Calendar,
  Flag,
  FolderKanban,
} from 'lucide-react';

const EMOJI_CHOICES = ['🚀', '🎓', '🏛️', '🔬', '⚡', '📚', '🎯', '🧠', '💡', '📌'];

const COVER_CHOICES = [
  { id: 'indigo', label: 'Indigo Glow', cls: 'from-indigo-600 via-primary-600 to-purple-600' },
  { id: 'emerald', label: 'Emerald Forest', cls: 'from-emerald-600 via-teal-600 to-cyan-600' },
  { id: 'sunset', label: 'Sunset Orange', cls: 'from-rose-500 via-orange-500 to-amber-500' },
  { id: 'slate', label: 'Minimalist Slate', cls: 'from-slate-800 via-gray-800 to-zinc-700' },
];

const KANBAN_COLUMNS = [
  { id: 'todo', label: 'To Do', dot: 'bg-gray-400', bg: 'bg-gray-50/90 border-gray-200/80' },
  { id: 'in_progress', label: 'In Progress', dot: 'bg-primary-500', bg: 'bg-primary-50/40 border-primary-100' },
  { id: 'review', label: 'In Review', dot: 'bg-amber-500', bg: 'bg-amber-50/40 border-amber-100' },
  { id: 'done', label: 'Done', dot: 'bg-emerald-500', bg: 'bg-emerald-50/40 border-emerald-100' },
];

const PRIORITY_BADGE = {
  high: { label: 'High', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  medium: { label: 'Medium', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  low: { label: 'Low', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export default function WorkspacePage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('kanban'); // 'kanban' | 'resources' | pageId
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Task Modal / Inline add state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCol, setNewTaskCol] = useState('todo');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskTag, setNewTaskTag] = useState('Umum');
  const [addingTaskCol, setAddingTaskCol] = useState(null);

  // Checklist & Page editing state
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const { data: workspace, isLoading, error } = useQuery({
    queryKey: ['workspace', orderId],
    queryFn: () => fetchWorkspace(orderId),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => updateWorkspace(orderId, payload),
    onSuccess: (updated) => {
      qc.setQueryData(['workspace', orderId], updated);
    },
    onError: (err) => toast.error('Gagal menyimpan perubahan: ' + err.message),
  });

  const resetMutation = useMutation({
    mutationFn: () => resetWorkspaceTemplate(orderId),
    onSuccess: (updated) => {
      qc.setQueryData(['workspace', orderId], updated);
      toast.success('Workspace dikembalikan ke blueprint standar.');
    },
  });

  useEffect(() => {
    if (workspace?.pages?.length > 0 && activeView === 'default') {
      setActiveView(workspace.pages[0].id);
    }
  }, [workspace?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex">
        <div className="w-64 border-r border-gray-200 p-4 hidden md:block space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-5/6" />
        </div>
        <div className="flex-1 p-8 space-y-4">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <p className="text-danger-600 font-semibold">Workspace tidak ditemukan.</p>
        <Link to="/lacak-pesanan" className="text-sm text-primary-600 font-semibold hover:underline">
          ← Kembali ke Portal Workspace
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

  // Handlers for updating workspace state in Supabase
  const handleAddTask = (colId) => {
    if (!newTaskTitle.trim()) return;
    const nextTasks = [
      ...tasks,
      {
        id: `tsk-${Date.now()}`,
        title: newTaskTitle.trim(),
        status: colId,
        assignee: newTaskAssignee.trim() || members[0]?.name || 'Tim',
        priority: newTaskPriority,
        tag: newTaskTag.trim() || 'Task',
        dueDate: 'Minggu Ini',
      },
    ];
    setNewTaskTitle('');
    setAddingTaskCol(null);
    saveMutation.mutate({ tasks: nextTasks });
    toast.success('Kartu tugas ditambahkan.');
  };

  const handleMoveTask = (taskId, nextStatus) => {
    const nextTasks = tasks.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t));
    saveMutation.mutate({ tasks: nextTasks });
  };

  const handleDeleteTask = (taskId) => {
    const nextTasks = tasks.filter((t) => t.id !== taskId);
    saveMutation.mutate({ tasks: nextTasks });
  };

  const handleAddPage = () => {
    const newId = `page-${Date.now()}`;
    const newPage = {
      id: newId,
      title: 'Halaman Dokumen Baru',
      icon: '📄',
      callout: 'Tulis ringkasan atau instruksi penting di kotak callout ini.',
      content: 'Ketik catatan rapat, pembagian tugas, atau dokumentasi proyek di sini...',
      checklist: [
        { id: `chk-${Date.now()}`, text: 'Item to-do pertama di halaman ini', done: false },
      ],
    };
    const nextPages = [...pages, newPage];
    saveMutation.mutate({ pages: nextPages });
    setActiveView(newId);
    toast.success('Halaman baru dibuat.');
  };

  const handleUpdatePageField = (pageId, field, value) => {
    const nextPages = pages.map((p) => (p.id === pageId ? { ...p, [field]: value } : p));
    saveMutation.mutate({ pages: nextPages });
  };

  const handleToggleChecklist = (pageId, chkId) => {
    const nextPages = pages.map((p) => {
      if (p.id !== pageId) return p;
      const nextList = (p.checklist ?? []).map((c) =>
        c.id === chkId ? { ...c, done: !c.done } : c
      );
      return { ...p, checklist: nextList };
    });
    saveMutation.mutate({ pages: nextPages });
  };

  const handleAddChecklistItem = (pageId) => {
    if (!newChecklistText.trim()) return;
    const nextPages = pages.map((p) => {
      if (p.id !== pageId) return p;
      return {
        ...p,
        checklist: [
          ...(p.checklist ?? []),
          { id: `chk-${Date.now()}`, text: newChecklistText.trim(), done: false },
        ],
      };
    });
    setNewChecklistText('');
    saveMutation.mutate({ pages: nextPages });
  };

  const handleDeleteChecklistItem = (pageId, chkId) => {
    const nextPages = pages.map((p) => {
      if (p.id !== pageId) return p;
      return {
        ...p,
        checklist: (p.checklist ?? []).filter((c) => c.id !== chkId),
      };
    });
    saveMutation.mutate({ pages: nextPages });
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    const nextMembers = [
      ...members,
      {
        id: `mem-${Date.now()}`,
        name: newMemberName.trim(),
        role: newMemberRole.trim() || 'Anggota Tim',
        avatarBg: 'bg-primary-600',
      },
    ];
    setNewMemberName('');
    setNewMemberRole('');
    saveMutation.mutate({ members: nextMembers });
    toast.success('Anggota ditambahkan ke workspace.');
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
        category: 'Tautan Tim',
        url,
        icon: '🔗',
      },
    ];
    setNewLinkTitle('');
    setNewLinkUrl('');
    saveMutation.mutate({ links: nextLinks });
    toast.success('Tautan berhasil disimpan.');
  };

  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const progressPct = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-gray-900 flex">
      {/* Notion-style Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-[#f7f7f5] border-r border-gray-200/80 flex flex-col transition-transform duration-200 select-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0 md:static md:flex'
        )}
      >
        {/* Workspace Switcher Top */}
        <div className="p-3.5 border-b border-gray-200/70 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-white shadow-xs border border-gray-200 flex items-center justify-center text-base flex-shrink-0">
              {workspace.icon}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-gray-900 truncate">{workspace.title}</div>
              <div className="text-[11px] text-gray-400 font-mono truncate">{displayRef}</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 text-gray-400 hover:text-gray-700 rounded"
            aria-label="Tutup sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Trial / Plan Status Strip */}
        {order?.isTrial && (
          <div className="mx-3 mt-3 p-2.5 rounded-xl bg-primary-50 border border-primary-200/80 text-xs space-y-1.5">
            <div className="flex items-center justify-between font-bold text-primary-800">
              <span className="flex items-center gap-1">
                <Sparkles size={12} /> Free Trial 7 Hari
              </span>
              <span>Aktif</span>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/checkout/pembayaran/${order.id}`)}
              className="w-full py-1 px-2 rounded-lg bg-primary-600 text-white font-semibold text-[11px] hover:bg-primary-700 transition-colors"
            >
              Upgrade ke Full Plan →
            </button>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5">
          {/* Core Workspace Views */}
          <div>
            <div className="px-2.5 mb-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Database &amp; Views
            </div>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => { setActiveView('kanban'); setSidebarOpen(false); }}
                className={cn(
                  'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeView === 'kanban'
                    ? 'bg-gray-200/80 text-gray-900 font-semibold'
                    : 'text-gray-600 hover:bg-gray-200/40'
                )}
              >
                <span className="flex items-center gap-2">
                  <FolderKanban size={16} className="text-primary-600" />
                  Sprint Kanban Board
                </span>
                <span className="text-xs bg-white px-1.5 py-0.5 rounded-md border border-gray-200 text-gray-500">
                  {tasks.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveView('resources'); setSidebarOpen(false); }}
                className={cn(
                  'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeView === 'resources'
                    ? 'bg-gray-200/80 text-gray-900 font-semibold'
                    : 'text-gray-600 hover:bg-gray-200/40'
                )}
              >
                <span className="flex items-center gap-2">
                  <Users size={16} className="text-emerald-600" />
                  Tim &amp; Resource Hub
                </span>
                <span className="text-xs bg-white px-1.5 py-0.5 rounded-md border border-gray-200 text-gray-500">
                  {members.length}
                </span>
              </button>
            </div>
          </div>

          {/* Notion-style Pages */}
          <div>
            <div className="px-2.5 mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Halaman &amp; Dokumen
              </span>
              <button
                type="button"
                onClick={handleAddPage}
                className="p-0.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-800"
                title="Tambah Halaman Baru"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-0.5">
              {pages.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setActiveView(p.id); setSidebarOpen(false); }}
                  className={cn(
                    'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors text-left',
                    activeView === p.id
                      ? 'bg-gray-200/80 text-gray-900 font-semibold'
                      : 'text-gray-600 hover:bg-gray-200/40'
                  )}
                >
                  <span className="text-base">{p.icon || '📄'}</span>
                  <span className="truncate flex-1">{p.title}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={handleAddPage}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-200/40 transition-colors"
              >
                <Plus size={14} />
                <span>Tambah halaman...</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer links */}
        <div className="p-3 border-t border-gray-200/70 space-y-1 text-xs">
          <Link
            to={`/lacak-pesanan/${order?.id ?? orderId}`}
            className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-gray-600 hover:bg-gray-200/50 font-medium"
          >
            <FileText size={14} />
            Status &amp; Detail Pesanan
          </Link>
          <Link
            to="/lacak-pesanan"
            className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-gray-500 hover:bg-gray-200/50"
          >
            <ArrowLeft size={14} />
            Ganti Workspace / Portal
          </Link>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Notion Bar */}
        <header className="h-12 bg-white/90 backdrop-blur border-b border-gray-200/70 px-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 min-w-0 text-sm">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
              aria-label="Buka menu workspace"
            >
              <Menu size={18} />
            </button>
            <span className="text-gray-400 truncate hidden sm:inline">{workspace.title}</span>
            <ChevronRight size={14} className="text-gray-300 hidden sm:inline" />
            <span className="font-semibold text-gray-800 truncate">
              {activeView === 'kanban'
                ? '🗂️ Sprint Kanban Board'
                : activeView === 'resources'
                ? '👥 Tim & Resource Hub'
                : `${activePage?.icon ?? '📄'} ${activePage?.title ?? 'Dokumen'}`}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span className="hidden sm:inline">
                {saveMutation.isPending ? 'Menyimpan...' : 'Tersimpan di Cloud'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
              className="text-xs text-gray-500 hover:text-gray-800 px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-1"
              title="Reset ke template awal"
            >
              <RotateCcw size={12} />
              <span className="hidden sm:inline">Reset Template</span>
            </button>
          </div>
        </header>

        {/* Notion Cover Banner */}
        <div className={cn('h-32 sm:h-40 w-full bg-gradient-to-r relative', workspace.coverGradient)}>
          <div className="absolute bottom-3 right-4 flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded-lg">
            {COVER_CHOICES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => saveMutation.mutate({ coverGradient: c.cls })}
                className={cn(
                  'w-4 h-4 rounded-full bg-gradient-to-r border border-white/70 transition-transform hover:scale-110',
                  c.cls
                )}
                title={`Ganti tema: ${c.label}`}
              />
            ))}
          </div>
        </div>

        {/* Workspace Body */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 pb-16 -mt-8 relative z-10">
          {/* Icon + Title Header */}
          <div className="mb-6">
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-16 h-16 rounded-2xl bg-white shadow-md border border-gray-100 flex items-center justify-center text-3xl hover:scale-105 transition-transform"
                title="Klik untuk ganti ikon"
              >
                {workspace.icon}
              </button>
              {showEmojiPicker && (
                <div className="absolute left-0 mt-2 p-2 bg-white rounded-xl shadow-xl border border-gray-200 flex gap-1.5 z-40">
                  {EMOJI_CHOICES.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => {
                        saveMutation.mutate({ icon: em });
                        setShowEmojiPicker(false);
                      }}
                      className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-lg"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <input
                  type="text"
                  defaultValue={workspace.title}
                  onBlur={(e) => {
                    if (e.target.value.trim() && e.target.value !== workspace.title) {
                      saveMutation.mutate({ title: e.target.value.trim() });
                    }
                  }}
                  className="text-2xl sm:text-3xl font-extrabold text-gray-900 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary-300 rounded-lg px-1 -ml-1 w-full sm:w-auto"
                />
                <p className="text-xs text-gray-500 mt-0.5">
                  Paket: <strong>{order?.package?.nama ?? 'Workspace Custom'}</strong> • Progress Sprint:{' '}
                  <strong className="text-primary-700">{doneCount}/{tasks.length} selesai ({progressPct}%)</strong>
                </p>
              </div>

              {/* Quick View Tabs */}
              <div className="inline-flex bg-gray-100 p-1 rounded-xl border border-gray-200 self-start">
                <button
                  type="button"
                  onClick={() => setActiveView('kanban')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all',
                    activeView === 'kanban' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                  )}
                >
                  <LayoutGrid size={13} />
                  Kanban
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView(pages[0]?.id ?? 'kanban')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all',
                    activePage ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                  )}
                >
                  <FileText size={13} />
                  Dokumen SOP
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('resources')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all',
                    activeView === 'resources' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                  )}
                >
                  <Users size={13} />
                  Tim &amp; Link
                </button>
              </div>
            </div>
          </div>

          {/* VIEW 1: SPRINT KANBAN BOARD */}
          {activeView === 'kanban' && (
            <div className="space-y-5">
              {/* Sprint Progress Bar */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Sprint Tracker Aktif
                  </div>
                  <div className="text-sm font-semibold text-gray-800 mt-0.5">
                    {doneCount} dari {tasks.length} kartu tugas selesai dikerjakan
                  </div>
                </div>
                <div className="w-full sm:w-64 bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* 4-Column Kanban Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                {KANBAN_COLUMNS.map((col) => {
                  const colTasks = tasks.filter((t) => t.status === col.id);
                  return (
                    <div
                      key={col.id}
                      className={cn('rounded-2xl border p-3 space-y-3 min-h-[260px]', col.bg)}
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <span className={cn('w-2.5 h-2.5 rounded-full', col.dot)} />
                          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                            {col.label}
                          </h3>
                          <span className="text-xs font-semibold text-gray-400">
                            {colTasks.length}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingTaskCol(col.id);
                            setNewTaskCol(col.id);
                          }}
                          className="p-1 rounded-lg hover:bg-white/80 text-gray-500 hover:text-gray-800"
                          title={`Tambah tugas di ${col.label}`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Cards */}
                      <div className="space-y-2.5">
                        {colTasks.map((task) => {
                          const prio = PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE.medium;
                          return (
                            <div
                              key={task.id}
                              className="bg-white rounded-xl p-3 shadow-2xs border border-gray-200/80 hover:border-primary-300 transition-all space-y-2.5 group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-primary-50 text-primary-700">
                                  {task.tag || 'Task'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-danger-600 transition-opacity"
                                  title="Hapus kartu"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>

                              <p className="text-sm font-semibold text-gray-800 leading-snug">
                                {task.title}
                              </p>

                              <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
                                <span className="truncate font-medium">👤 {task.assignee}</span>
                                <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-semibold', prio.cls)}>
                                  {prio.label}
                                </span>
                              </div>

                              {/* Quick status switcher */}
                              <div className="pt-1 flex items-center justify-between gap-1">
                                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                  <Calendar size={11} /> {task.dueDate || 'Minggu Ini'}
                                </span>
                                <select
                                  value={task.status}
                                  onChange={(e) => handleMoveTask(task.id, e.target.value)}
                                  className="text-[11px] bg-gray-50 border border-gray-200 rounded-md px-1.5 py-0.5 text-gray-600 font-medium focus:outline-none focus:ring-1 focus:ring-primary-500"
                                  aria-label="Pindahkan kolom"
                                >
                                  {KANBAN_COLUMNS.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      → {c.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          );
                        })}

                        {/* Inline Add Task Form */}
                        {addingTaskCol === col.id ? (
                          <div className="bg-white rounded-xl p-3 border-2 border-primary-400 shadow-sm space-y-2">
                            <input
                              type="text"
                              placeholder="Judul tugas baru..."
                              value={newTaskTitle}
                              onChange={(e) => setNewTaskTitle(e.target.value)}
                              autoFocus
                              className="w-full text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                            />
                            <div className="grid grid-cols-2 gap-1.5">
                              <input
                                type="text"
                                placeholder="Nama PIC"
                                value={newTaskAssignee}
                                onChange={(e) => setNewTaskAssignee(e.target.value)}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1"
                              />
                              <select
                                value={newTaskPriority}
                                onChange={(e) => setNewTaskPriority(e.target.value)}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                              >
                                <option value="high">High Priority</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                              </select>
                            </div>
                            <div className="flex items-center justify-end gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => setAddingTaskCol(null)}
                                className="px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-lg"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAddTask(col.id)}
                                className="px-3 py-1 text-xs font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                              >
                                Tambah
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAddingTaskCol(col.id)}
                            className="w-full py-2 px-2.5 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-white/70 flex items-center gap-1.5 transition-colors"
                          >
                            <Plus size={14} />
                            Tambah kartu
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: NOTION-STYLE DOCUMENT & CHECKLIST PAGE */}
          {activePage && (
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <span className="text-3xl">{activePage.icon || '📄'}</span>
                <input
                  type="text"
                  key={activePage.id}
                  defaultValue={activePage.title}
                  onBlur={(e) =>
                    handleUpdatePageField(activePage.id, 'title', e.target.value.trim() || 'Dokumen')
                  }
                  className="text-xl sm:text-2xl font-extrabold text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-primary-200 rounded-lg px-1"
                />
              </div>

              {/* Callout Block ala Notion */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3">
                <span className="text-xl" aria-hidden>💡</span>
                <textarea
                  key={`callout-${activePage.id}`}
                  defaultValue={activePage.callout}
                  rows={2}
                  onBlur={(e) => handleUpdatePageField(activePage.id, 'callout', e.target.value)}
                  className="w-full bg-transparent text-sm text-amber-900 font-medium leading-relaxed focus:outline-none resize-none"
                />
              </div>

              {/* Main Notes Block */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Catatan &amp; Dokumentasi Tim (Klik untuk mengedit)
                </label>
                <textarea
                  key={`content-${activePage.id}`}
                  defaultValue={activePage.content}
                  rows={6}
                  onBlur={(e) => handleUpdatePageField(activePage.id, 'content', e.target.value)}
                  placeholder="Tulis pembagian tugas, SOP, atau notulensi rapat di sini..."
                  className="w-full rounded-xl border border-gray-200 p-4 text-sm text-gray-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Action Checklist Block ala Notion */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-800">Checklist Action Items</h3>
                  <span className="text-xs text-gray-400">
                    {(activePage.checklist ?? []).filter((c) => c.done).length} / {(activePage.checklist ?? []).length} selesai
                  </span>
                </div>

                <div className="space-y-2">
                  {(activePage.checklist ?? []).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 group"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleChecklist(activePage.id, item.id)}
                        className="flex items-center gap-3 text-left flex-1"
                      >
                        {item.done ? (
                          <CheckSquare size={18} className="text-primary-600 flex-shrink-0" />
                        ) : (
                          <Square size={18} className="text-gray-400 flex-shrink-0" />
                        )}
                        <span
                          className={cn(
                            'text-sm',
                            item.done ? 'line-through text-gray-400' : 'text-gray-800 font-medium'
                          )}
                        >
                          {item.text}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteChecklistItem(activePage.id, item.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-danger-600 p-1"
                        aria-label="Hapus checklist"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Tambah checklist baru..."
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem(activePage.id)}
                    className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <Button size="sm" onClick={() => handleAddChecklistItem(activePage.id)}>
                    <Plus size={14} />
                    Tambah
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: TEAM & RESOURCE HUB */}
          {activeView === 'resources' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quick Links Card */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Resource Hub &amp; Integrasi</h2>
                  <p className="text-xs text-gray-500">
                    Tautan penting tim (Google Drive, Google Meet, Figma, GitHub, Silabus)
                  </p>
                </div>

                <div className="space-y-2.5">
                  {links.map((lnk) => (
                    <a
                      key={lnk.id}
                      href={lnk.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-primary-400 hover:bg-primary-50/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{lnk.icon || '🔗'}</span>
                        <div>
                          <div className="text-sm font-semibold text-gray-800">{lnk.title}</div>
                          <div className="text-xs text-gray-400 truncate max-w-[220px]">{lnk.url}</div>
                        </div>
                      </div>
                      <ExternalLink size={15} className="text-gray-400" />
                    </a>
                  ))}
                </div>

                <form onSubmit={handleAddLink} className="pt-3 border-t border-gray-100 space-y-2">
                  <div className="text-xs font-semibold text-gray-600">Tambah Tautan Baru</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nama (mis. Drive Bab 2)"
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      className="rounded-xl border border-gray-200 px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="https://drive.google.com/..."
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      className="rounded-xl border border-gray-200 px-3 py-2 text-xs"
                    />
                  </div>
                  <Button type="submit" size="sm" variant="outline" fullWidth>
                    <Plus size={14} /> Simpan Tautan
                  </Button>
                </form>
              </div>

              {/* Team Directory Card */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Direktori Anggota Kelompok</h2>
                  <p className="text-xs text-gray-500">
                    Daftar anggota &amp; pembagian peran di dalam workspace
                  </p>
                </div>

                <div className="space-y-2.5">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center',
                            m.avatarBg || 'bg-primary-600'
                          )}
                        >
                          {m.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-800">{m.name}</div>
                          <div className="text-xs text-gray-500">{m.role}</div>
                        </div>
                      </div>
                      <Badge variant="success">Aktif</Badge>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddMember} className="pt-3 border-t border-gray-100 space-y-2">
                  <div className="text-xs font-semibold text-gray-600">Undang / Tambah Anggota Tim</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nama anggota..."
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="rounded-xl border border-gray-200 px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Peran / Divisi..."
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      className="rounded-xl border border-gray-200 px-3 py-2 text-xs"
                    />
                  </div>
                  <Button type="submit" size="sm" variant="outline" fullWidth>
                    <Plus size={14} /> Tambah Anggota
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
