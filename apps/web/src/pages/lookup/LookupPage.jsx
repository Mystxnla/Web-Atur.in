import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { requestOtp } from '../../services/api/index.js';
import { authApi } from '../../services/api/auth.js';
import { useSessionStore } from '../../stores/sessionStore.js';
import { useAuthStore } from '../../stores/authStore.js';
import { normalizePhone, isValidPhone } from '../../lib/phone.js';
import { formatRupiah, formatTanggalWIB } from '../../lib/format.js';
import { toDisplayRef } from '../../lib/orderRef.js';
import { STATUS_LABELS } from '@atur-in/shared';
import { toast } from 'sonner';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { Card } from '../../components/ui/Card.jsx';
import Logo from '../../components/ui/Logo.jsx';
import {
  ShieldCheck,
  MessageCircle,
  Hash,
  LogOut,
  FolderKanban,
  FileText,
  Sparkles,
  Mail,
  ArrowRight,
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

export default function LookupPage() {
  const navigate = useNavigate();
  const { customer, orders: sessionOrders, setOtpRequest, clearSession } = useSessionStore();
  const { user, accessToken, setAuth, clearAuth } = useAuthStore();

  const [loginMethod, setLoginMethod] = useState('email'); // 'email' | 'wa'
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [accountOrders, setAccountOrders] = useState([]);
  const [loadingAccountOrders, setLoadingAccountOrders] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

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

  const onSubmitWa = async (data) => {
    const normalized = normalizePhone(data.noWhatsapp);
    if (!isValidPhone(normalized)) {
      toast.error('Format nomor WhatsApp belum valid. Contoh: 812-3456-7890');
      return;
    }
    try {
      const result = await requestOtp(normalized, data.nomorReferensi || undefined);
      setOtpRequest({
        requestId: result.requestId,
        expiresAt: result.expiresAt,
        maskedWa: result.maskedWa,
        noWhatsapp: normalized,
      });
      navigate('/lacak-pesanan/verifikasi');
    } catch (err) {
      if (err.status === 404) {
        toast.error('Nomor WhatsApp tidak ditemukan. Pastikan nomor yang kamu gunakan saat memesan.');
      } else {
        toast.error(err.message ?? 'Terjadi kesalahan.');
      }
    }
  };

  const onSubmitAuth = async (data) => {
    try {
      const res = authMode === 'login'
        ? await authApi.login({ email: data.email, password: data.password })
        : await authApi.register({ name: data.name, email: data.email, password: data.password });

      setAuth(res);
      toast.success(
        authMode === 'login'
          ? `Selamat datang di Workspace, ${res.user.name}!`
          : `Workspace akun ${res.user.name} berhasil dibuat!`
      );
    } catch (err) {
      toast.error(err.message ?? 'Gagal memproses autentikasi.');
    }
  };

  const handleLogoutAll = async () => {
    clearSession();
    if (accessToken) {
      await authApi.logout().catch(() => {});
      clearAuth();
    }
    toast.success('Berhasil keluar dari sesi workspace.');
  };

  const activeOrders = sessionOrders?.length > 0 ? sessionOrders : accountOrders;
  const activeCustomerName = customer?.namaLengkap ?? user?.name;

  return (
    <div className="space-y-6 py-4">
      {/* Minimalist Notion-inspired Auth Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-200 text-2xl mb-1">
          🚀
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Masuk ke Workspace Atur.in
        </h1>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Buka Sprint Kanban Board, dokumen SOP tim, dan pantau progres ruang kerja kelompok kamu.
        </p>
      </div>

      {/* Quick 1-Click Demo Workspace Card */}
      <div className="bg-gradient-to-r from-indigo-50 via-primary-50 to-purple-50 border border-primary-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles size={17} />
          </div>
          <div>
            <div className="text-xs font-bold text-primary-700 uppercase tracking-wider">
              Akses Instan Prototype
            </div>
            <div className="text-sm font-bold text-gray-900">
              Coba Workspace Interaktif (AI Research Hub)
            </div>
            <div className="text-xs text-gray-500">
              Langsung coba Kanban Board &amp; Dokumen ala Notion tanpa harus login
            </div>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => navigate('/workspace/DWA-2026-0001')}
          className="w-full sm:w-auto flex-shrink-0"
        >
          <FolderKanban size={14} />
          Buka Demo Workspace
        </Button>
      </div>

      {/* Active Workspace Switcher (Shown when user is logged in or OTP verified) */}
      {(sessionOrders?.length > 0 || user) && (
        <Card className="space-y-4 border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center text-xs font-bold">
                {activeCustomerName?.[0]?.toUpperCase() ?? 'W'}
              </div>
              <div>
                <p className="text-xs text-gray-400">Workspace Terhubung</p>
                <p className="text-sm font-bold text-gray-900">{activeCustomerName}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogoutAll}
              className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-danger-600 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <LogOut size={13} aria-hidden />
              Keluar
            </button>
          </div>

          {loadingAccountOrders ? (
            <p className="text-xs text-gray-500 py-4 text-center">Memuat daftar workspace...</p>
          ) : activeOrders.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100 space-y-2">
              <p className="text-sm font-semibold text-gray-700">Belum ada workspace pada akun ini.</p>
              <p className="text-xs text-gray-500">
                Kamu tetap bisa mencoba <strong>Demo Workspace</strong> di atas atau membuat pesanan baru dengan email <strong>{user?.email}</strong>.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 bg-[#fbfbfa] rounded-xl border border-gray-200 hover:border-gray-300 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-gray-900">
                          {ord.customer?.namaKelompok ?? ord.group_name ?? 'Workspace Tim'}
                        </span>
                        <Badge variant={STATUS_VARIANT[ord.status] ?? 'gray'}>
                          {STATUS_LABELS[ord.status] ?? ord.status}
                        </Badge>
                        {ord.isTrial && <Badge variant="primary">Free Trial 7 Hari</Badge>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {toDisplayRef(ord.nomorReferensi ?? ord.ref_number ?? ord.id)} • {ord.package?.nama ?? ord.packageId} • {formatTanggalWIB(ord.dibuatPada ?? ord.created_at)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-gray-700">
                      {ord.isTrial ? 'Rp 0' : formatRupiah(ord.totalTagihan ?? ord.total ?? 0)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/workspace/${ord.id}`)}
                    >
                      <FolderKanban size={14} />
                      Buka Workspace
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/lacak-pesanan/${ord.id}`)}
                    >
                      <FileText size={14} />
                      Status &amp; Invoice
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Clean Notion-style Login Card */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-6 space-y-5">
        {/* Method Switcher Pills */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-xl">
          <button
            type="button"
            onClick={() => setLoginMethod('email')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              loginMethod === 'email'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Mail size={14} />
            Akun Email
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('wa')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              loginMethod === 'wa'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <MessageCircle size={14} />
            Kode OTP WhatsApp
          </button>
        </div>

        {loginMethod === 'email' ? (
          <form onSubmit={handleAuthSubmit(onSubmitAuth)} className="space-y-4" noValidate>
            {authMode === 'register' && (
              <Input
                label="Nama Lengkap"
                placeholder="Ketik nama lengkap kamu..."
                required
                error={authErrors.name?.message}
                {...regAuth('name', {
                  required: authMode === 'register' ? 'Nama wajib diisi.' : false,
                  minLength: { value: 3, message: 'Minimal 3 karakter.' },
                })}
              />
            )}

            <Input
              label="Alamat Email"
              type="email"
              placeholder="nama@kampus.ac.id"
              required
              error={authErrors.email?.message}
              {...regAuth('email', { required: 'Email wajib diisi.' })}
            />

            <Input
              label="Kata Sandi"
              type="password"
              placeholder="Masukkan kata sandi..."
              required
              hint={authMode === 'register' ? 'Minimal 8 karakter dengan huruf besar & angka' : undefined}
              error={authErrors.password?.message}
              {...regAuth('password', {
                required: 'Kata sandi wajib diisi.',
                minLength: { value: 8, message: 'Minimal 8 karakter.' },
              })}
            />

            <Button type="submit" fullWidth size="lg" loading={isAuthSubmitting}>
              <span>{authMode === 'login' ? 'Lanjutkan ke Workspace' : 'Buat Akun Workspace'}</span>
              <ArrowRight size={15} />
            </Button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-xs text-gray-500 hover:text-primary-600 font-medium"
              >
                {authMode === 'login' ? (
                  <>Belum punya akun? <span className="text-primary-600 font-semibold">Daftar akun baru</span></>
                ) : (
                  <>Sudah punya akun? <span className="text-primary-600 font-semibold">Masuk dengan email</span></>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit(onSubmitWa)} className="space-y-4" noValidate>
            <Input
              label="Nomor WhatsApp Pemesan"
              placeholder="812-9845-1230"
              required
              prefix="+62"
              hint="Contoh nomor demo: 81298451230"
              error={errors.noWhatsapp?.message}
              {...register('noWhatsapp', { required: 'Nomor WhatsApp wajib diisi.' })}
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Hash size={13} aria-hidden />
                  Nomor Referensi Workspace
                </span>
                <span className="text-xs text-gray-400 font-normal">Opsional</span>
              </label>
              <input
                type="text"
                placeholder="#DWA-2026-0001"
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                {...register('nomorReferensi')}
              />
            </div>

            <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
              <span>Kirim Kode Masuk (OTP)</span>
              <ArrowRight size={15} />
            </Button>
          </form>
        )}
      </div>

      {/* Footer Links */}
      <div className="text-center space-y-2 pt-2">
        <Link
          to="/#harga"
          className="text-sm font-semibold text-primary-600 hover:underline inline-flex items-center gap-1"
        >
          Belum punya workspace tim? Mulai Free Trial 7 Hari
          <span aria-hidden>→</span>
        </Link>
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
          <Link to="/" className="hover:text-gray-600">Beranda</Link>
          <span>•</span>
          <a
            href={waSupportLink(SITE.supportWa)}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-600"
          >
            Bantuan Arsitek
          </a>
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 flex items-center justify-center gap-1 pb-4">
        <ShieldCheck size={12} className="text-success-500" aria-hidden />
        100% Guaranteed SLA &amp; Kerahasiaan Data • Atur.in Workspace
      </div>
    </div>
  );
}
