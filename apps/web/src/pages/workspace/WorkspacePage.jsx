import { useState, useRef, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchWorkspace,
  updateWorkspace,
  resetWorkspaceTemplate,
} from '../../services/api/index.js';
import { useAuthStore } from '../../stores/authStore.js';
import { toDisplayRef } from '../../lib/orderRef.js';
import Skeleton from '../../components/ui/Skeleton.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
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
  User,
  Layers,
  Globe,
  UserPlus,
} from 'lucide-react';

const KANBAN_COLUMNS = [
  { id: 'todo', label: 'Rencana', dot: 'bg-gray-400', next: 'in_progress', nextLabel: 'Kerjakan' },
  { id: 'in_progress', label: 'Dikerjakan', dot: 'bg-primary-600', next: 'review', nextLabel: 'Review' },
  { id: 'review', label: 'Revisi & review', dot: 'bg-warning-500', next: 'done', nextLabel: 'Selesai' },
  { id: 'done', label: 'Selesai', dot: 'bg-success-600', next: null, nextLabel: null },
];

export default function WorkspacePage() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user: authUser } = useAuthStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  // activeView can be:
  // - 'personal' (Meja kerja saya - individual workspace)
  // - 'org' (Semua divisi / 1 Organisasi Master Board)
  // - 'div-<id>' (Specific division workspace)
  // - 'page-<id>' (Shared group document)
  // - 'resources' (Tim, pembagian akses divisi, & tautan)
  const [activeView, setActiveView] = useState('personal');
  const [activeMemberId, setActiveMemberId] = useState(null);
  const [initializedScope, setInitializedScope] = useState(false);

  const [quickTaskInputs, setQuickTaskInputs] = useState({});
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const [newChecklistText, setNewChecklistText] = useState('');
  const [newPersonalChecklistText, setNewPersonalChecklistText] = useState('');

  // Invite Member with Email + Division + Jobdesk
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberDivision, setNewMemberDivision] = useState('');

  // Create New Division
  const [addingDivision, setAddingDivision] = useState(false);
  const [newDivisionName, setNewDivisionName] = useState('');
  const [newDivisionDesc, setNewDivisionDesc] = useState('');

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

  // Match logged-in account email to member profile and default to their division or personal desk
  useEffect(() => {
    if (!workspace?.members?.length) return;
    const members = workspace.members;
    const divisions = workspace.divisions ?? [];

    let matched = null;
    if (authUser?.email) {
      matched = members.find(
        (m) => (m.email || '').toLowerCase() === authUser.email.toLowerCase()
      );
    }

    const chosenMember = matched ?? members.find((m) => m.id === activeMemberId) ?? members[0];
    if (!activeMemberId || (matched && activeMemberId !== matched.id)) {
      setActiveMemberId(chosenMember.id);
    }

    if (!newMemberDivision && divisions[0]) {
      setNewMemberDivision(divisions[0].id);
    }

    if (!initializedScope) {
      const requestedScope = searchParams.get('scope');
      if (requestedScope === 'personal') {
        setActiveView('personal');
      } else if (requestedScope && divisions.some((d) => d.id === requestedScope)) {
        setActiveView(requestedScope);
      } else if (matched?.divisionId) {
        // When a member logs in with their email, take them straight to their assigned division!
        setActiveView(matched.divisionId);
      } else {
        setActiveView('org');
      }
      setInitializedScope(true);
    }
  }, [workspace?.id, authUser?.email]);

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
        <div className="w-64 border-r border-gray-200 bg-gray-50 p-4 hidden md:block space-y-3">
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
  const divisions = workspace.divisions ?? [];
  const pages = workspace.pages ?? [];
  const tasks = workspace.tasks ?? [];
  const members = workspace.members ?? [];
  const links = workspace.links ?? [];

  const activeMember = members.find((m) => m.id === activeMemberId) ?? members[0];
  const activeMemberDivision =
    divisions.find((d) => d.id === activeMember?.divisionId) ?? divisions[0];

  const activeDivision = divisions.find((d) => d.id === activeView) ?? null;
  const activePage = pages.find((p) => p.id === activeView) ?? null;
  const isKanbanScope = activeView === 'org' || Boolean(activeDivision);

  // Filter tasks based on current scope:
  // - 'personal': only tasks assigned to activeMember
  // - 'div-*': only tasks in that division
  // - 'org': all tasks across the entire organization/group
  const scopedTasks =
    activeView === 'personal'
      ? tasks.filter(
          (t) =>
            (t.assigneeEmail &&
              activeMember?.email &&
              t.assigneeEmail.toLowerCase() === activeMember.email.toLowerCase()) ||
            t.assignee === activeMember?.name
        )
      : activeDivision
      ? tasks.filter((t) => t.divisionId === activeDivision.id)
      : tasks;

  const doneCount = scopedTasks.filter((t) => t.status === 'done').length;
  const totalOrgDone = tasks.filter((t) => t.status === 'done').length;

  // ── Kanban Handlers (Scoped to current View) ──
  const handleQuickAddTask = (colId) => {
    const title = (quickTaskInputs[colId] ?? '').trim();
    if (!title) return;

    const targetDivisionId = activeDivision
      ? activeDivision.id
      : activeMember?.divisionId ?? divisions[0]?.id ?? 'div-inti';

    const defaultAssigneeMember =
      activeView === 'personal'
        ? activeMember
        : activeDivision
        ? members.find((m) => m.divisionId === activeDivision.id) ?? activeMember
        : activeMember;

    const nextTasks = [
      ...tasks,
      {
        id: `tsk-${Date.now()}`,
        title,
        status: colId,
        divisionId: targetDivisionId,
        assignee: defaultAssigneeMember?.name || 'Anggota',
        assigneeEmail: defaultAssigneeMember?.email || '',
        priority: 'medium',
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
    const poolMembers = activeDivision
      ? members.filter((m) => m.divisionId === activeDivision.id)
      : members;
    const candidateList = poolMembers.length > 0 ? poolMembers : members;
    if (candidateList.length === 0) return;

    const nextTasks = tasks.map((t) => {
      if (t.id !== taskId) return t;
      const idx = candidateList.findIndex((m) => m.name === t.assignee);
      const nextMember = candidateList[(idx + 1) % candidateList.length];
      return {
        ...t,
        assignee: nextMember.name,
        assigneeEmail: nextMember.email,
        divisionId: nextMember.divisionId ?? t.divisionId,
      };
    });
    updateWorkspaceOptimistic({ tasks: nextTasks });
  };

  const handleDeleteTask = (taskId) => {
    const nextTasks = tasks.filter((t) => t.id !== taskId);
    updateWorkspaceOptimistic({ tasks: nextTasks });
  };

  // ── Personal Workspace (Meja Kerja Individu) Handlers ──
  const handleUpdatePersonalNotes = (val) => {
    if (!activeMember) return;
    const nextMembers = members.map((m) =>
      m.id === activeMember.id ? { ...m, personalNotes: val } : m
    );
    updateWorkspaceOptimistic({ members: nextMembers }, 450);
  };

  const handleTogglePersonalChecklist = (chkId) => {
    if (!activeMember) return;
    const nextMembers = members.map((m) => {
      if (m.id !== activeMember.id) return m;
      const nextList = (m.personalChecklist ?? []).map((c) =>
        c.id === chkId ? { ...c, done: !c.done } : c
      );
      return { ...m, personalChecklist: nextList };
    });
    updateWorkspaceOptimistic({ members: nextMembers });
  };

  const handleAddPersonalChecklist = () => {
    const text = newPersonalChecklistText.trim();
    if (!text || !activeMember) return;
    const nextMembers = members.map((m) => {
      if (m.id !== activeMember.id) return m;
      return {
        ...m,
        personalChecklist: [
          ...(m.personalChecklist ?? []),
          { id: `pchk-${Date.now()}`, text, done: false },
        ],
      };
    });
    setNewPersonalChecklistText('');
    updateWorkspaceOptimistic({ members: nextMembers });
  };

  const handleDeletePersonalChecklist = (chkId) => {
    if (!activeMember) return;
    const nextMembers = members.map((m) => {
      if (m.id !== activeMember.id) return m;
      return {
        ...m,
        personalChecklist: (m.personalChecklist ?? []).filter((c) => c.id !== chkId),
      };
    });
    updateWorkspaceOptimistic({ members: nextMembers });
  };

  // ── Division Management Handlers ──
  const handleCreateDivision = (e) => {
    e.preventDefault();
    if (!newDivisionName.trim()) return;
    const newId = `div-${Date.now()}`;
    const nextDivisions = [
      ...divisions,
      {
        id: newId,
        name: newDivisionName.trim(),
        description: newDivisionDesc.trim() || `Ruang kerja khusus ${newDivisionName.trim()}`,
      },
    ];
    setNewDivisionName('');
    setNewDivisionDesc('');
    setAddingDivision(false);
    updateWorkspaceOptimistic({ divisions: nextDivisions });
    setActiveView(newId);
    toast.success('Divisi baru ditambahkan');
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
      setActiveView(nextPages[0]?.id ?? 'org');
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

  // ── Team Access & Division Assignment Handlers ──
  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      toast.error('Nama dan email akun anggota wajib diisi');
      return;
    }
    const cleanEmail = newMemberEmail.trim().toLowerCase();
    if (members.some((m) => (m.email || '').toLowerCase() === cleanEmail)) {
      toast.error('Email ini sudah terdaftar di dalam ruang kerja');
      return;
    }

    const assignedDivId = newMemberDivision || divisions[0]?.id || 'div-inti';
    const assignedDivName =
      divisions.find((d) => d.id === assignedDivId)?.name ?? 'Divisi';

    const newMemberObj = {
      id: `mem-${Date.now()}`,
      name: newMemberName.trim(),
      email: cleanEmail,
      role: newMemberRole.trim() || `Anggota ${assignedDivName}`,
      divisionId: assignedDivId,
      isOwner: false,
      personalNotes: `Catatan kerja pribadi ${newMemberName.trim()} (${assignedDivName})...`,
      personalChecklist: [
        { id: `pchk-${Date.now()}`, text: `Cek tugas di ${assignedDivName}`, done: false },
      ],
    };

    const nextMembers = [...members, newMemberObj];
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberRole('');
    updateWorkspaceOptimistic({ members: nextMembers });
    toast.success(`Akses diberikan ke ${cleanEmail} (${assignedDivName})`);
  };

  const handleChangeMemberDivision = (memberId, nextDivId) => {
    const nextMembers = members.map((m) =>
      m.id === memberId ? { ...m, divisionId: nextDivId } : m
    );
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

  // Reusable Kanban Grid Renderer (Used for 1 Organisasi, Per Divisi, and Meja Kerja Individu)
  const renderKanbanBoard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
      {KANBAN_COLUMNS.map((col) => {
        const colTasks = scopedTasks.filter((t) => t.status === col.id);
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
                <h2 className="text-xs font-medium text-gray-800">{col.label}</h2>
              </div>
              <span className="text-xs font-mono text-gray-400 tabular-nums">
                {colTasks.length}
              </span>
            </div>

            {/* Task Cards */}
            <div className="space-y-2">
              {colTasks.map((task) => {
                const isDone = task.status === 'done';
                const taskDivision = divisions.find((d) => d.id === task.divisionId);
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDraggedTaskId(task.id)}
                    onDragEnd={() => {
                      setDraggedTaskId(null);
                      setDragOverCol(null);
                    }}
                    className="bg-white rounded-lg p-3 border border-gray-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-primary-300 transition-colors space-y-2 cursor-grab active:cursor-grabbing group"
                  >
                    {/* Show division tag when viewing 1 Organisasi or Personal desk */}
                    {!activeDivision && taskDivision && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                          {taskDivision.name}
                        </span>
                      </div>
                    )}

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

            {/* Inline Quick Add */}
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
  );

  return (
    <div className="min-h-screen bg-white text-gray-900 flex">
      {/* Unified Atur.in Brand Sidebar (3-Tier Scope: Individu, Per Divisi, 1 Organisasi) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[260px] bg-gray-50 border-r border-gray-200 flex flex-col transition-transform duration-150 select-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0 md:static md:flex'
        )}
      >
        {/* Top Organization Identity */}
        <div className="h-14 px-4 border-b border-gray-200 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{workspace.title}</div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono tabular-nums">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500" aria-hidden />
              <span>{displayRef}</span>
              <span>·</span>
              <span>{totalOrgDone}/{tasks.length}</span>
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

        {/* Active Member Identity Switcher (Auto-selected from logged-in account or switchable in demo) */}
        <div className="p-3 border-b border-gray-200 bg-white/60 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium px-1">
            <span>Akun anggota aktif</span>
            <span className="text-primary-600">{activeMemberDivision?.name}</span>
          </div>
          <select
            value={activeMember?.id ?? ''}
            onChange={(e) => {
              const nextMem = members.find((m) => m.id === e.target.value);
              setActiveMemberId(e.target.value);
              if (nextMem?.divisionId && activeView.startsWith('div-')) {
                setActiveView(nextMem.divisionId);
              }
            }}
            aria-label="Pilih identitas anggota aktif"
            className="w-full h-9 px-2.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {members.map((m) => {
              const div = divisions.find((d) => d.id === m.divisionId);
              return (
                <option key={m.id} value={m.id}>
                  {m.name} — {div?.name ?? m.role}
                </option>
              );
            })}
          </select>
        </div>

        {/* 3-Tier Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* LEVEL 1: LINGKUP INDIVIDU & 1 ORGANISASI */}
          <div>
            <div className="px-2 mb-2 text-xs font-medium text-gray-400">
              Lingkup kerja
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => { setActiveView('personal'); setSidebarOpen(false); }}
                className={cn(
                  'w-full h-9 px-2.5 rounded-lg text-sm flex items-center justify-between transition-colors',
                  activeView === 'personal'
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <User
                    size={16}
                    strokeWidth={1.5}
                    className={activeView === 'personal' ? 'text-primary-600' : 'text-gray-400'}
                  />
                  <span className="truncate">Meja kerja saya</span>
                </span>
                <span className="text-xs font-mono text-gray-400 tabular-nums">
                  {
                    tasks.filter(
                      (t) =>
                        (t.assigneeEmail &&
                          activeMember?.email &&
                          t.assigneeEmail.toLowerCase() === activeMember.email.toLowerCase()) ||
                        t.assignee === activeMember?.name
                    ).length
                  }
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveView('org'); setSidebarOpen(false); }}
                className={cn(
                  'w-full h-9 px-2.5 rounded-lg text-sm flex items-center justify-between transition-colors',
                  activeView === 'org'
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Globe
                    size={16}
                    strokeWidth={1.5}
                    className={activeView === 'org' ? 'text-primary-600' : 'text-gray-400'}
                  />
                  <span className="truncate">1 Organisasi (Semua)</span>
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
                <span className="flex items-center gap-2.5 min-w-0">
                  <Users
                    size={16}
                    strokeWidth={1.5}
                    className={activeView === 'resources' ? 'text-primary-600' : 'text-gray-400'}
                  />
                  <span className="truncate">Tim &amp; akses email</span>
                </span>
                <span className="text-xs font-mono text-gray-400 tabular-nums">
                  {members.length}
                </span>
              </button>
            </div>
          </div>

          {/* LEVEL 2: RUANG KERJA PER DIVISI / JOBDESK */}
          <div>
            <div className="px-2 mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">
                Ruang divisi
              </span>
              <button
                type="button"
                onClick={() => setAddingDivision(!addingDivision)}
                className="p-1 rounded-md text-gray-400 hover:text-primary-600 hover:bg-gray-100"
                title="Tambah divisi baru"
              >
                <Plus size={14} strokeWidth={1.5} />
              </button>
            </div>

            {addingDivision && (
              <form onSubmit={handleCreateDivision} className="mb-2 p-2 bg-white rounded-lg border border-gray-200 space-y-2">
                <input
                  type="text"
                  placeholder="Nama divisi (mis. Divisi Pubdok)"
                  value={newDivisionName}
                  onChange={(e) => setNewDivisionName(e.target.value)}
                  autoFocus
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => setAddingDivision(false)}
                    className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-xs font-medium bg-primary-600 text-white rounded hover:bg-primary-700"
                  >
                    Buat
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-1">
              {divisions.map((div) => {
                const isMyDiv = div.id === activeMember?.divisionId;
                const divTaskCount = tasks.filter((t) => t.divisionId === div.id).length;

                return (
                  <button
                    key={div.id}
                    type="button"
                    onClick={() => { setActiveView(div.id); setSidebarOpen(false); }}
                    className={cn(
                      'w-full h-9 px-2.5 rounded-lg text-sm flex items-center justify-between transition-colors text-left',
                      activeView === div.id
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Layers
                        size={16}
                        strokeWidth={1.5}
                        className={activeView === div.id ? 'text-primary-600 flex-shrink-0' : 'text-gray-400 flex-shrink-0'}
                      />
                      <span className="truncate">{div.name}</span>
                    </span>
                    <span className="flex items-center gap-1.5 flex-shrink-0">
                      {isMyDiv && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary-100 text-primary-700">
                          Divisi Anda
                        </span>
                      )}
                      <span className="text-xs font-mono text-gray-400 tabular-nums">
                        {divTaskCount}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LEVEL 3: KERTAS KERJA & DOKUMEN KELOMPOK */}
          <div>
            <div className="px-2 mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">
                Kertas kerja kelompok
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
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
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
              <span>Ganti akun / keluar</span>
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
              {activeView === 'personal'
                ? `Meja kerja ${activeMember?.name ?? 'saya'}`
                : activeView === 'org'
                ? '1 Organisasi (Semua divisi)'
                : activeDivision
                ? activeDivision.name
                : activeView === 'resources'
                ? 'Tim & akses email'
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
          {/* Context Header based on current scope */}
          <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-gray-200">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {activeView === 'personal' ? (
                  <Badge variant="primary">Ruang kerja individu · {activeMemberDivision?.name}</Badge>
                ) : activeDivision ? (
                  <Badge variant="primary">Ruang divisi · {workspace.title}</Badge>
                ) : (
                  <Badge variant="gray">Lingkup 1 Organisasi</Badge>
                )}
                <span className="text-xs text-gray-400">
                  Masuk sebagai <strong className="text-gray-700">{activeMember?.name}</strong> ({activeMember?.email})
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
                {activeView === 'personal'
                  ? `Meja kerja ${activeMember?.name}`
                  : activeDivision
                  ? activeDivision.name
                  : activePage
                  ? activePage.title.replace(/^[^\w\s]+\s*/, '')
                  : activeView === 'resources'
                  ? 'Manajemen tim & hak akses divisi'
                  : workspace.title}
              </h1>

              <p className="text-sm text-gray-500">
                {activeView === 'personal'
                  ? `Fokus pada tugas milik ${activeMember?.name} (${activeMember?.role}) beserta buku catatan pribadi.`
                  : activeDivision
                  ? `${activeDivision.description} · ${doneCount} dari ${scopedTasks.length} tugas divisi selesai.`
                  : `Progres gabungan seluruh divisi: ${totalOrgDone} dari ${tasks.length} tugas selesai.`}
              </p>
            </div>

            {/* Quick Resource Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {links.slice(0, 2).map((lnk) => (
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
              <button
                type="button"
                onClick={() => setActiveView('resources')}
                className="h-8 px-3 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <UserPlus size={13} strokeWidth={1.5} />
                <span>Beri akses anggota</span>
              </button>
            </div>
          </div>

          {/* ── VIEW A: MEJA KERJA SAYA (INDIVIDUAL WORKSPACE) ── */}
          {activeView === 'personal' && activeMember && (
            <div className="space-y-8">
              {/* Section 1: My Assigned Kanban Tasks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-900">
                    Tugas tanggung jawab saya ({scopedTasks.length})
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveView(activeMember.divisionId ?? 'org')}
                    className="text-xs text-primary-600 font-medium hover:underline flex items-center gap-1"
                  >
                    Lihat papan {activeMemberDivision?.name ?? 'divisi'} lengkap
                    <ChevronRight size={13} strokeWidth={1.5} />
                  </button>
                </div>
                {renderKanbanBoard()}
              </div>

              {/* Section 2: Personal Scratchpad & Checklist (Private to this member inside the group workspace) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                {/* Personal Checklist */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium text-gray-900">
                        Target &amp; to-do pribadi ({activeMember.name})
                      </h3>
                      <p className="text-xs text-gray-500">
                        Daftar periksa harian khusus untuk jobdesk kamu di {activeMemberDivision?.name}.
                      </p>
                    </div>
                    <span className="text-xs font-mono text-gray-400 tabular-nums">
                      {(activeMember.personalChecklist ?? []).filter((c) => c.done).length}/
                      {(activeMember.personalChecklist ?? []).length}
                    </span>
                  </div>

                  <div className="divide-y divide-gray-100 border-t border-b border-gray-200/80">
                    {(activeMember.personalChecklist ?? []).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 py-2.5 group"
                      >
                        <button
                          type="button"
                          onClick={() => handleTogglePersonalChecklist(item.id)}
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
                          onClick={() => handleDeletePersonalChecklist(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-danger-600 p-1"
                        >
                          <Trash2 size={14} strokeWidth={1.5} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Plus size={15} strokeWidth={1.5} className="text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Tambah to-do pribadi lalu tekan Enter"
                      value={newPersonalChecklistText}
                      onChange={(e) => setNewPersonalChecklistText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddPersonalChecklist();
                        }
                      }}
                      className="flex-1 text-sm text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none py-1"
                    />
                  </div>
                </div>

                {/* Personal Notes Canvas */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">
                      Buku catatan kerja ({activeMember.name})
                    </h3>
                    <p className="text-xs text-gray-500">
                      Tulis draf kerja, link referensi pribadi, atau bahan laporan sebelum dibagikan ke divisi.
                    </p>
                  </div>
                  <textarea
                    key={`pnotes-${activeMember.id}`}
                    defaultValue={activeMember.personalNotes}
                    rows={7}
                    onChange={(e) => handleUpdatePersonalNotes(e.target.value)}
                    placeholder="Ketik catatan pribadimu di sini..."
                    className="w-full rounded-lg bg-gray-50/70 border border-gray-200/80 p-3.5 text-sm text-gray-800 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── VIEW B: 1 ORGANISASI OR PER-DIVISION KANBAN BOARD ── */}
          {isKanbanScope && (
            <div className="space-y-6">
              {/* Division Filter Pills for quick switching across the organization */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveView('org')}
                  className={cn(
                    'h-8 px-3 rounded-lg text-xs font-medium transition-colors',
                    activeView === 'org'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  Semua divisi ({tasks.length})
                </button>
                {divisions.map((d) => {
                  const count = tasks.filter((t) => t.divisionId === d.id).length;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setActiveView(d.id)}
                      className={cn(
                        'h-8 px-3 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
                        activeView === d.id
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      <span>{d.name}</span>
                      <span className="opacity-75 font-mono">({count})</span>
                    </button>
                  );
                })}
              </div>

              {renderKanbanBoard()}
            </div>
          )}

          {/* ── VIEW C: BORDERLESS GROUP DOCUMENT CANVAS ── */}
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

              <div className="rounded-xl bg-primary-50/60 border border-primary-100 p-4">
                <div className="text-xs font-medium text-primary-700 mb-1">
                  Kesepakatan &amp; ringkasan
                </div>
                <textarea
                  key={`callout-${activePage.id}`}
                  defaultValue={activePage.callout}
                  rows={2}
                  onChange={(e) => handlePageChange(activePage.id, 'callout', e.target.value)}
                  className="w-full bg-transparent text-sm text-gray-800 leading-relaxed focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Daftar periksa kelompok</h3>
                  <span className="text-xs font-mono text-gray-500 tabular-nums">
                    {(activePage.checklist ?? []).filter((c) => c.done).length}/
                    {(activePage.checklist ?? []).length} selesai
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

              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="text-xs font-medium text-gray-400">
                  Catatan dokumen &amp; notulensi
                </div>
                <textarea
                  key={`content-${activePage.id}`}
                  defaultValue={activePage.content}
                  rows={10}
                  onChange={(e) => handlePageChange(activePage.id, 'content', e.target.value)}
                  className="w-full bg-transparent text-[15px] text-gray-800 leading-relaxed focus:outline-none resize-y"
                />
              </div>
            </div>
          )}

          {/* ── VIEW D: TEAM ACCESS & DIVISION ASSIGNMENT + LINKS ── */}
          {activeView === 'resources' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 Cols: Grant Member Access by Email & Assign Division */}
              <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Hak akses anggota &amp; penempatan divisi
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    Tambahkan email akun teman kelompokmu di bawah ini. Saat beliau login atau daftar akun dengan email tersebut di halaman masuk, ruang kerja dan divisinya otomatis tersedia tanpa perlu kode OTP.
                  </p>
                </div>

                {/* Add Member Access Form */}
                <form
                  onSubmit={handleAddMember}
                  className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-3"
                >
                  <div className="text-xs font-semibold text-gray-700">
                    Beri akses ke anggota baru
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      placeholder="Nama lengkap (mis. Riko Pratama)"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      required
                      className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="email"
                      placeholder="Email akun (mis. riko@kampus.ac.id)"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      required
                      className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <select
                      value={newMemberDivision}
                      onChange={(e) => setNewMemberDivision(e.target.value)}
                      className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {divisions.map((d) => (
                        <option key={d.id} value={d.id}>
                          Divisi: {d.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Jobdesk (mis. Penyusun Bab 3)"
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <Button type="submit" size="sm">
                    <UserPlus size={14} strokeWidth={1.5} />
                    Berikan akses ruang kerja &amp; divisi
                  </Button>
                </form>

                {/* Member List with Division Switcher */}
                <div className="divide-y divide-gray-100 border-t border-b border-gray-200/80">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                          {m.name[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 truncate">{m.name}</span>
                            {m.isOwner && <Badge variant="primary">Ketua / Pemesan</Badge>}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {m.email} · <span className="text-gray-700">{m.role}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <select
                          value={m.divisionId ?? ''}
                          onChange={(e) => handleChangeMemberDivision(m.id, e.target.value)}
                          className="h-8 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          aria-label={`Ubah divisi ${m.name}`}
                        >
                          {divisions.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMemberId(m.id);
                            setActiveView('personal');
                          }}
                          className="h-8 px-2.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:text-primary-700 hover:bg-primary-50 transition-colors"
                          title={`Buka meja kerja ${m.name}`}
                        >
                          Meja kerja
                        </button>

                        {members.length > 1 && !m.isOwner && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(m.id)}
                            className="text-gray-400 hover:text-danger-600 p-1"
                            aria-label="Cabut akses anggota"
                          >
                            <Trash2 size={14} strokeWidth={1.5} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right 5 Cols: Shared Links */}
              <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Tautan &amp; dokumen bersama</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Akses cepat folder Google Drive, ruang Meet, Figma, atau referensi kelompok.
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
                        >
                          <Trash2 size={14} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddLink} className="space-y-2 pt-1">
                  <input
                    type="text"
                    placeholder="Nama tautan (mis. Drive Divisi Riset)"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    className="w-full h-9 rounded-lg border border-gray-200 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <div className="flex gap-2">
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
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
