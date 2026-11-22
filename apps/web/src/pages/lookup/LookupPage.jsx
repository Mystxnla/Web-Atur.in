import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authApi } from '../../services/api/auth.js';
import { useSessionStore } from '../../stores/sessionStore.js';
import { useAuthStore } from '../../stores/authStore.js';
import { formatRupiah, formatTanggalWIB } from '../../lib/format.js';
import { toDisplayRef } from '../../lib/orderRef.js';
import { STATUS_LABELS } from '@atur-in/shared';
import { toast } from 'sonner';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { Card } from '../../components/ui/Card.jsx';
import {
  LogOut,
  FolderKanban,
  ArrowRight,
  User,
  Layers,
  Globe,
} from 'lucide-react';
import { waSupportLink } from '../../lib/wa.js';
import { SITE } from '../../config/site.js';

const STATUS_VARIANT = {
  menunggu_pembayaran: 'warning',
  dibayar: 'primary',
  diverifikasi: 'primary',
  proses_setup: 'purple',
  selesai: 'success',
  kedaluwarsa: 'danger',
};

const PROTOTYPE_SCENARIOS = {
  kelompok: {
    orderId: 'DWA-2026-0001',
    title: 'AI Research Hub & Skripsi Kelompok',
    subtitle: 'Skenario Kelompok Kuliah & Riset (4 Divisi)',
    personas: [
      {
        id: 'mem-1',
        name: 'Budi Pratama',
        role: 'Ketua Kelompok / Project Lead',
        scopeLabel: 'Lingkup 1 Organisasi',
        desc: 'Melihat progres gabungan seluruh divisi, kelola hak akses email anggota, dan SOP utama.',
        targetUrl: '/workspace/DWA-2026-0001?member=mem-1&scope=org',
        cta: 'Masuk sebagai Ketua',
        icon: Globe,
      },
      {
        id: 'mem-2',
        name: 'Citra Maharani',
        role: 'Divisi Riset & Data',
        scopeLabel: 'Lingkup Divisi Riset',
        desc: 'Langsung fokus ke papan tugas Divisi Riset & Literatur tanpa tercampur tugas divisi lain.',
        targetUrl: '/workspace/DWA-2026-0001?member=mem-2&scope=div-riset',
        cta: 'Masuk ke Divisi Riset',
        icon: Layers,
      },
      {
        id: 'mem-3',
        name: 'Andi Wijaya',
        role: 'Divisi Penulisan & Sistem',
        scopeLabel: 'Meja Kerja Individu',
        desc: 'Melihat meja kerja pribadi Andi: daftar tugas milik Andi sendiri dan buku catatan kerja pribadi.',
        targetUrl: '/workspace/DWA-2026-0001?member=mem-3&scope=personal',
        cta: 'Masuk ke Meja Kerja Individu',
        icon: User,
      },
    ],
  },
  kepanitiaan: {
    orderId: 'DWA-2026-0002',
    title: 'Panitia Dies Natalis & Festival Kampus 2026',
    subtitle: 'Skenario Kepanitiaan Acara & UKM (BPH, Acara, Humas, Logistik)',
    personas: [
      {
        id: 'mem-1',
        name: 'Raka Aditya',
        role: 'Ketua Pelaksana (BPH & Inti)',
        scopeLabel: 'Lingkup 1 Kepanitiaan',
        desc: 'Memantau seluruh kesiapan acara lintas divisi (Acara, Humas & Sponsor, Logistik).',
        targetUrl: '/workspace/DWA-2026-0002?member=mem-1&scope=org',
        cta: 'Masuk sebagai Ketua Pelaksana',
        icon: Globe,
      },
      {
        id: 'mem-2',
        name: 'Citra Maharani',
        role: 'Koordinator Divisi Acara',
        scopeLabel: 'Lingkup Divisi Acara',
        desc: 'Langsung masuk ke ruang kerja khusus Divisi Acara (rundown teknis, pengisi acara, cue card).',
        targetUrl: '/workspace/DWA-2026-0002?member=mem-2&scope=div-acara',
        cta: 'Masuk ke Divisi Acara',
        icon: Layers,
      },
      {
        id: 'mem-3',
        name: 'Andi Wijaya',
        role: 'Divisi Humas & Sponsor',
        scopeLabel: 'Meja Kerja Individu',
        desc: 'Fokus pada target follow-up sponsor milik Andi sendiri beserta checklist harian pribadi.',
        targetUrl: '/workspace/DWA-2026-0002?member=mem-3&scope=personal',
        cta: 'Masuk ke Meja Kerja Individu',
        icon: User,
      },
    ],
  },
};

export default function LookupPage() {
  const navigate = useNavigate();
  const { customer, orders: sessionOrders, clearSession } = useSessionStore();
  const { user, accessToken, setAuth, clearAuth } = useAuthStore();

  // Top-level clear 2-mode choice: 'demo' (Mode Demo Prototype) | 'account' (Masuk / Daftar Akun)
  const [portalTab, setPortalTab] = useState(() => (user ? 'account' : 'demo'));
  const [scenarioKey, setScenarioKey] = useState('kelompok'); // 'kelompok' | 'kepanitiaan'
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [accountOrders, setAccountOrders] = useState([]);
  const [loadingAccountOrders, setLoadingAccountOrders] = useState(false);

  const {
    register: regAuth,
    handleSubmit: handleAuthSubmit,
    formState: { errors: authErrors, isSubmitting: isAuthSubmitting },
  } = useForm();

  useEffect(() => {
    if (!accessToken || !user) {
      setAccountOrders([]);
      return;
    }
    setLoadingAccountOrders(true);
    fetch(`${import.meta.env.VITE_API_BASE_URL ?? '/api'}/orders`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => setAccountOrders(Array.isArray(list) ? list : []))
      .catch(() => setAccountOrders([]))
      .finally(() => setLoadingAccountOrders(false));
  }, [accessToken, user?.id]);

  const onSubmitAuth = async (data) => {
    try {
      const res =
        authMode === 'login'
          ? await authApi.login({ email: data.email, password: data.password })
          : await authApi.register({ name: data.name, email: data.email, password: data.password });

      setAuth(res);
      setPortalTab('account');
      toast.success(
        authMode === 'login'
          ? `Masuk sebagai ${res.user.name}`
          : `Akun ${res.user.name} berhasil dibuat`
      );
    } catch (err) {
      toast.error(err.message ?? 'Gagal memproses akun');
    }
  };

  const handleLogoutAll = async () => {
    clearSession();
    if (accessToken) {
      await authApi.logout().catch(() => {});
      clearAuth();
    }
    toast.success('Sesi telah ditutup');
  };

  const activeOrders = sessionOrders?.length > 0 ? sessionOrders : accountOrders;
  const activeCustomerName = user?.name ?? customer?.namaLengkap;
  const currentScenario = PROTOTYPE_SCENARIOS[scenarioKey];

  return (
    <div className="max-w-lg mx-auto py-4 space-y-6 text-gray-900">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          {portalTab === 'demo'
            ? 'Coba Workspace Langsung'
            : user
            ? 'Workspace & Divisi Kamu'
            : authMode === 'login'
            ? 'Masuk ke Akun Atur.in'
            : 'Daftar Akun Anggota'}
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          {portalTab === 'demo'
            ? 'Pilih salah satu peran contoh untuk mencoba tampilan 1 Organisasi, Ruang Divisi, atau Meja Kerja Individu tanpa perlu daftar.'
            : 'Gunakan email akunmu untuk membuka workspace dan divisi yang sudah diberi akses oleh ketua tim.'}
        </p>
      </div>

      {/* Top-Level 2-Mode Switcher: Mode Demo Prototype vs Masuk / Daftar Akun */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-xl border border-gray-200/70">
        <button
          type="button"
          onClick={() => setPortalTab('demo')}
          className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
            portalTab === 'demo'
              ? 'bg-white text-primary-700 shadow-2xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Mode Demo Prototype
        </button>
        <button
          type="button"
          onClick={() => setPortalTab('account')}
          className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
            portalTab === 'account'
              ? 'bg-white text-primary-700 shadow-2xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {user ? 'Akun Saya' : 'Masuk / Daftar Akun'}
        </button>
      </div>

      {/* TAB 1: MODE DEMO PROTOTYPE */}
      {portalTab === 'demo' && (
        <Card className="p-5 space-y-4 border-gray-200">
          {/* Scenario Switcher: Kelompok Kuliah vs Kepanitiaan */}
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-gray-500">Pilih skenario ruang kerja:</div>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => setScenarioKey('kelompok')}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors text-left ${
                  scenarioKey === 'kelompok'
                    ? 'bg-white text-primary-700 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="font-semibold">Kelompok Kuliah &amp; Riset</div>
                <div className="text-[11px] text-gray-400">Skripsi &amp; Tugas Besar</div>
              </button>
              <button
                type="button"
                onClick={() => setScenarioKey('kepanitiaan')}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors text-left ${
                  scenarioKey === 'kepanitiaan'
                    ? 'bg-white text-primary-700 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="font-semibold">Kepanitiaan &amp; Organisasi</div>
                <div className="text-[11px] text-gray-400">Event Kampus &amp; UKM</div>
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <div className="text-sm font-semibold text-gray-900">{currentScenario.title}</div>
            <div className="text-xs text-gray-500">{currentScenario.subtitle}</div>
          </div>

          {/* 3 Clickable Persona Cards */}
          <div className="space-y-2.5">
            {currentScenario.personas.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(p.targetUrl)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(p.targetUrl);
                    }
                  }}
                  className="p-4 rounded-xl border border-gray-200 hover:border-primary-400 hover:bg-primary-50/40 bg-white transition-colors cursor-pointer space-y-2.5 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center flex-shrink-0">
                        <Icon size={16} strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                          {p.name}
                        </div>
                        <div className="text-xs text-gray-500">{p.role}</div>
                      </div>
                    </div>
                    <Badge variant="primary">{p.scopeLabel}</Badge>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">{p.desc}</p>

                  <div className="pt-1 flex items-center justify-between text-xs font-semibold text-primary-600">
                    <span>{p.cta}</span>
                    <ArrowRight
                      size={14}
                      strokeWidth={1.5}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shortcut to create a brand new workspace via Free Trial or Rp 10.000 Template */}
          <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <span className="text-gray-500">Mau buat ruang kerja baru untuk timmu?</span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate('/checkout?paket=template&cycle=monthly&trial=0')}
                className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 font-medium text-gray-700"
              >
                Template 10rb
              </button>
              <button
                type="button"
                onClick={() => navigate('/checkout?paket=custom&cycle=monthly&trial=1')}
                className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 font-medium text-white"
              >
                Free Trial 7 Hari
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 2: MASUK / DAFTAR AKUN EMAIL */}
      {portalTab === 'account' && (
        <>
          {user || sessionOrders?.length > 0 ? (
            <Card className="space-y-4 border-gray-200 p-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {activeCustomerName?.[0]?.toUpperCase() ?? 'A'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {activeCustomerName}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {user?.email ?? 'Sesi Aktif'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogoutAll}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-danger-600 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white transition-colors"
                >
                  <LogOut size={14} strokeWidth={1.5} aria-hidden />
                  Keluar
                </button>
              </div>

              {loadingAccountOrders ? (
                <p className="text-xs text-gray-400 py-4 text-center">
                  Mencari ruang kerja dan divisi kamu...
                </p>
              ) : activeOrders.length === 0 ? (
                <div className="rounded-xl bg-gray-50 p-4 text-xs text-gray-600 leading-relaxed border border-gray-200/80 space-y-3">
                  <p>
                    Belum ada ruang kerja yang terhubung ke email <strong>{user?.email}</strong>.
                    Minta ketua timmu menambahkan email ini di menu <strong>Tim &amp; akses email</strong>, atau buat ruang kerja baru sekarang.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => navigate('/checkout?paket=custom&cycle=monthly&trial=1')}
                    >
                      Buat Free Trial 7 Hari
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPortalTab('demo')}
                    >
                      Lihat Mode Demo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeOrders.map((ord) => {
                    const profile = ord.myMemberProfile;
                    return (
                      <div
                        key={ord.id}
                        className="p-4 bg-gray-50/70 rounded-xl border border-gray-200/80 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-gray-900 truncate">
                                {ord.customer?.namaKelompok ?? ord.group_name ?? 'Ruang Kerja Tim'}
                              </span>
                              <Badge variant={STATUS_VARIANT[ord.status] ?? 'gray'}>
                                {STATUS_LABELS[ord.status] ?? ord.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 tabular-nums">
                              {toDisplayRef(ord.nomorReferensi ?? ord.ref_number ?? ord.id)} ·{' '}
                              {formatTanggalWIB(ord.dibuatPada ?? ord.created_at)}
                            </div>
                          </div>
                          <span className="text-xs font-medium text-primary-700 tabular-nums flex-shrink-0">
                            {ord.isTrial
                              ? 'Trial 7 hari'
                              : formatRupiah(ord.totalTagihan ?? ord.total ?? 0)}
                          </span>
                        </div>

                        {profile && (
                          <div className="bg-white rounded-lg border border-gray-200/80 p-2.5 flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <Layers
                                size={14}
                                strokeWidth={1.5}
                                className="text-primary-600 flex-shrink-0"
                              />
                              <div className="truncate">
                                <span className="text-gray-500">Divisi: </span>
                                <span className="font-semibold text-gray-900">
                                  {profile.divisionName}
                                </span>
                              </div>
                            </div>
                            <Badge variant="primary" className="flex-shrink-0">
                              {profile.role}
                            </Badge>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              navigate(
                                profile?.divisionId
                                  ? `/workspace/${ord.id}?scope=${profile.divisionId}`
                                  : `/workspace/${ord.id}`
                              )
                            }
                          >
                            <FolderKanban size={15} strokeWidth={1.5} aria-hidden />
                            Buka divisi saya
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/workspace/${ord.id}?scope=personal`)}
                          >
                            <User size={15} strokeWidth={1.5} aria-hidden />
                            Meja kerja saya
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-5 border-gray-200">
              <form onSubmit={handleAuthSubmit(onSubmitAuth)} className="space-y-4" noValidate>
                <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-xl text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className={`py-2 rounded-lg transition-colors ${
                      authMode === 'login'
                        ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Masuk Akun
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className={`py-2 rounded-lg transition-colors ${
                      authMode === 'register'
                        ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Daftar Akun Baru
                  </button>
                </div>

                {authMode === 'register' && (
                  <Input
                    label="Nama lengkap"
                    placeholder="Citra Maharani"
                    required
                    error={authErrors.name?.message}
                    {...regAuth('name', {
                      required: authMode === 'register' ? 'Nama wajib diisi' : false,
                      minLength: { value: 3, message: 'Minimal 3 karakter' },
                    })}
                  />
                )}

                <Input
                  label="Email akun"
                  type="email"
                  placeholder="citra@kampus.ac.id"
                  required
                  hint="Gunakan email yang sudah diberi akses di dalam divisi tim"
                  error={authErrors.email?.message}
                  {...regAuth('email', { required: 'Email wajib diisi' })}
                />

                <Input
                  label="Kata sandi"
                  type="password"
                  placeholder="Minimal 8 karakter"
                  required
                  hint={
                    authMode === 'register'
                      ? 'Kombinasi huruf kapital dan angka (mis. Kampus123)'
                      : undefined
                  }
                  error={authErrors.password?.message}
                  {...regAuth('password', {
                    required: 'Kata sandi wajib diisi',
                    minLength: { value: 8, message: 'Minimal 8 karakter' },
                  })}
                />

                <Button type="submit" fullWidth size="lg" loading={isAuthSubmitting}>
                  <span>
                    {authMode === 'login'
                      ? 'Masuk & buka workspace saya'
                      : 'Daftar & hubungkan divisi'}
                  </span>
                  <ArrowRight size={16} strokeWidth={1.5} aria-hidden />
                </Button>
              </form>
            </Card>
          )}
        </>
      )}

      {/* Bottom links */}
      <div className="flex items-center justify-between text-xs text-gray-400 px-1">
        <Link to="/" className="hover:text-gray-700 transition-colors">
          ← Kembali ke beranda
        </Link>
        <a
          href={waSupportLink(SITE.supportWa)}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-700 transition-colors"
        >
          Hubungi bantuan WhatsApp
        </a>
      </div>
    </div>
  );
}
