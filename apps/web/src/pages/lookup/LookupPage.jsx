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
  ShieldCheck, Clock, CheckCircle, MessageCircle,
  Hash, ChevronRight, LogOut, UserCheck
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
  const { customer, orders: sessionOrders, setOtpRequest, setSession, clearSession } = useSessionStore();
  const { user, accessToken, setAuth, clearAuth } = useAuthStore();
  const [tab, setTab] = useState('wa');
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

  // Fetch user's orders when logged in via email & password
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
      } else if (err.status === 429) {
        toast.error(err.message);
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
          ? `Selamat datang kembali, ${res.user.name}!`
          : `Akun ${res.user.name} berhasil dibuat!`
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
    toast.success('Sesi pencarian telah ditutup.');
  };

  const activeOrders = sessionOrders?.length > 0 ? sessionOrders : accountOrders;
  const activeCustomerName = customer?.namaLengkap ?? user?.name;

  return (
    <div className="space-y-6 py-2">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-gray-400">
        <Link to="/" className="hover:text-primary-600">Beranda</Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-600 font-medium">Lacak Pesanan</span>
      </nav>

      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Lacak Pesanan &amp; Akses Workspace</h1>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          Pantau progres arsitektur ruang kerja digital tim kamu secara real-time tanpa ribet.
        </p>
      </div>

      {/* Verified Session Orders List (Fixes multi-order lookup & logged-in customer view) */}
      {(sessionOrders?.length > 0 || user) && (
        <Card className="space-y-4 border-primary-200 bg-primary-50/40">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-primary-600 text-white rounded-xl flex items-center justify-center">
                <UserCheck size={18} aria-hidden />
              </div>
              <div>
                <p className="text-xs text-gray-500">Daftar Pesanan Terverifikasi</p>
                <p className="text-sm font-bold text-gray-900">{activeCustomerName}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogoutAll}
              className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-danger-600 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
            >
              <LogOut size={13} aria-hidden />
              Ganti Nomor / Logout
            </button>
          </div>

          {loadingAccountOrders ? (
            <p className="text-xs text-gray-500 py-3 text-center">Memuat daftar pesanan...</p>
          ) : activeOrders.length === 0 ? (
            <div className="bg-white rounded-xl p-4 text-center border border-gray-100 space-y-2">
              <p className="text-sm font-semibold text-gray-700">Belum ada pesanan pada email ini.</p>
              <p className="text-xs text-gray-400">
                Gunakan tab Cek via WhatsApp di bawah atau buat pesanan baru dengan email <strong>{user?.email}</strong>.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeOrders.map((ord) => (
                <Link
                  key={ord.id}
                  to={`/lacak-pesanan/${ord.id}`}
                  className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-200 hover:border-primary-400 hover:shadow-sm transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-primary-700">
                        {toDisplayRef(ord.nomorReferensi ?? ord.ref_number ?? ord.id)}
                      </span>
                      <Badge variant={STATUS_VARIANT[ord.status] ?? 'gray'}>
                        {STATUS_LABELS[ord.status] ?? ord.status}
                      </Badge>
                      {ord.isTrial && <Badge variant="primary">Free Trial</Badge>}
                    </div>
                    <p className="text-xs text-gray-500">
                      {ord.package?.nama ?? ord.packageId} • {formatTanggalWIB(ord.dibuatPada ?? ord.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">
                      {ord.isTrial ? 'Rp 0' : formatRupiah(ord.totalTagihan ?? ord.total ?? 0)}
                    </span>
                    <ChevronRight size={16} className="text-gray-400" aria-hidden />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        {/* Portal header */}
        <div className="flex flex-col items-center py-5 border-b border-gray-100">
          <Logo />
          <Badge variant="primary" dot className="mt-2">Portal Pelanggan</Badge>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 border-b border-gray-100" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'wa'}
            onClick={() => setTab('wa')}
            className={`py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              tab === 'wa' ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <MessageCircle size={14} aria-hidden />
            <div className="text-left">
              <div className="text-xs">Cek via WhatsApp</div>
              <div className="text-xs font-normal text-gray-400">Tanpa Password</div>
            </div>
          </button>
          <button
            role="tab"
            aria-selected={tab === 'login'}
            onClick={() => setTab('login')}
            className={`py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              tab === 'login' ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600' : 'text-gray-400 hover:bg-gray-50'
            }`}
          >
            <div>
              <div className="text-xs">Login Akun</div>
              <div className="text-xs font-normal text-gray-400">Email &amp; Sandi</div>
            </div>
          </button>
        </div>

        <div className="p-5">
          {tab === 'wa' ? (
            <form onSubmit={handleSubmit(onSubmitWa)} className="space-y-4" noValidate>
              <Input
                label="Nomor WhatsApp Terdaftar"
                placeholder="812-3456-7890"
                required
                prefix="+62"
                hint="Contoh demo: 81298451230"
                error={errors.noWhatsapp?.message}
                {...register('noWhatsapp', { required: 'Nomor WhatsApp wajib diisi.' })}
              />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Hash size={13} aria-hidden />Atau Nomor Referensi Pesanan</span>
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
                Cek Status Pesanan
              </Button>

              <p className="text-xs text-center text-gray-400 flex items-start gap-1.5">
                <ShieldCheck size={12} className="mt-0.5 flex-shrink-0 text-success-600" aria-hidden />
                Kode OTP verifikasi instan akan dikirimkan otomatis ke WhatsApp kamu untuk menjaga kerahasiaan data arsitektur &amp; SLA proyek.
              </p>
            </form>
          ) : (
            <form onSubmit={handleAuthSubmit(onSubmitAuth)} className="space-y-4" noValidate>
              <div className="flex items-center justify-between bg-gray-50 p-1 rounded-xl border border-gray-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    authMode === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Masuk Akun
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    authMode === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Daftar Akun Baru
                </button>
              </div>

              {authMode === 'register' && (
                <Input
                  label="Nama Lengkap"
                  placeholder="Contoh: Budi Pratama"
                  required
                  error={authErrors.name?.message}
                  {...regAuth('name', {
                    required: authMode === 'register' ? 'Nama wajib diisi.' : false,
                    minLength: { value: 3, message: 'Minimal 3 karakter.' },
                  })}
                />
              )}

              <Input
                label="Email"
                type="email"
                placeholder="nama@kampus.ac.id"
                required
                error={authErrors.email?.message}
                {...regAuth('email', { required: 'Email wajib diisi.' })}
              />

              <Input
                label="Kata Sandi"
                type="password"
                placeholder="Minimal 8 karakter (Huruf besar & angka)"
                required
                error={authErrors.password?.message}
                {...regAuth('password', {
                  required: 'Kata sandi wajib diisi.',
                  minLength: { value: 8, message: 'Minimal 8 karakter.' },
                })}
              />

              <Button type="submit" fullWidth size="lg" loading={isAuthSubmitting}>
                {authMode === 'login' ? 'Masuk & Lihat Pesanan Saya' : 'Daftar & Hubungkan Pesanan'}
              </Button>
            </form>
          )}
        </div>
      </Card>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Clock, value: '24 Menit', label: 'Rata-rata Respon', color: 'bg-primary-50 text-primary-700' },
          { icon: CheckCircle, value: '99.8%', label: 'SLA Delivery', color: 'bg-success-50 text-success-700' },
        ].map((s) => (
          <div key={s.value} className={`${s.color} rounded-2xl p-4 flex items-center gap-3`}>
            <s.icon size={20} className="flex-shrink-0" aria-hidden />
            <div>
              <div className="text-lg font-extrabold">{s.value}</div>
              <div className="text-xs">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Help block */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
            <MessageCircle size={16} className="text-primary-600" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Lupa nomor WhatsApp atau butuh bantuan?</p>
            <p className="text-xs text-gray-500">Tim Digital Workspace Architect siap mendampingi verifikasi pesanan dan sinkronisasi workspace kamu.</p>
          </div>
        </div>
        <a
          href={waSupportLink(SITE.supportWa)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-white transition-colors"
        >
          <MessageCircle size={14} aria-hidden />
          Hubungi Tim Arsitek
        </a>
      </div>

      <div className="text-center space-y-2">
        <Link to="/#harga" className="text-sm font-semibold text-primary-600 hover:underline flex items-center justify-center gap-1">
          Belum pernah order? Buat Workspace Tim Kamu Sekarang
          <span aria-hidden>→</span>
        </Link>
        <Link to="/" className="block text-xs text-gray-400 hover:text-gray-600">Kembali ke Beranda Utama</Link>
      </div>

      <div className="text-center text-xs text-gray-400 flex items-center justify-center gap-1 pb-4">
        <ShieldCheck size={12} className="text-success-500" aria-hidden />
        100% Guaranteed SLA &amp; Kerahasiaan Data (NDA Enforced) • Digital Workspace Architect
      </div>
    </div>
  );
}
