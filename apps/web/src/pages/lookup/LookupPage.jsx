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
import {
  LogOut,
  FolderKanban,
  FileText,
  ArrowRight,
  ChevronRight,
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

  const [loginMethod, setLoginMethod] = useState('wa'); // 'wa' | 'email'
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
      toast.error('Format nomor WhatsApp belum sesuai, contoh: 812-3456-7890');
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
        toast.error('Nomor WhatsApp belum terdaftar di pesanan mana pun');
      } else {
        toast.error(err.message ?? 'Terjadi kendala jaringan');
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
          ? `Masuk sebagai ${res.user.name}`
          : `Akun ${res.user.name} telah dibuat`
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
  const activeCustomerName = customer?.namaLengkap ?? user?.name;

  return (
    <div className="max-w-md mx-auto py-4 space-y-6 text-gray-900">
      {/* Header aligned with primary brand tokens */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Masuk ke ruang kerja tim
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Buka papan tugas, kertas kerja SOP, atau cek status pesanan kelompokmu.
        </p>
      </div>

      {/* Connected Workspaces (Shown first when verified/logged in) */}
      {(sessionOrders?.length > 0 || user) && (
        <Card className="space-y-3 border-gray-200 p-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-primary-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {activeCustomerName?.[0]?.toUpperCase() ?? 'T'}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{activeCustomerName}</div>
                <div className="text-xs text-gray-400">Ruang kerja terhubung</div>
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
            <p className="text-xs text-gray-400 py-3 text-center">Memuat ruang kerja...</p>
          ) : activeOrders.length === 0 ? (
            <div className="rounded-xl bg-gray-50 p-3.5 text-xs text-gray-500 leading-relaxed border border-gray-100">
              Belum ada ruang kerja pada email <strong>{user?.email}</strong>. Gunakan tab WhatsApp di bawah atau buka ruang kerja contoh.
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-200/80 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {ord.customer?.namaKelompok ?? ord.group_name ?? 'Ruang Kerja Tim'}
                        </span>
                        <Badge variant={STATUS_VARIANT[ord.status] ?? 'gray'}>
                          {STATUS_LABELS[ord.status] ?? ord.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 tabular-nums">
                        {toDisplayRef(ord.nomorReferensi ?? ord.ref_number ?? ord.id)} · {formatTanggalWIB(ord.dibuatPada ?? ord.created_at)}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-primary-700 tabular-nums flex-shrink-0">
                      {ord.isTrial ? 'Trial 7 hari' : formatRupiah(ord.totalTagihan ?? ord.total ?? 0)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/workspace/${ord.id}`)}
                    >
                      <FolderKanban size={15} strokeWidth={1.5} aria-hidden />
                      Buka ruang kerja
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/lacak-pesanan/${ord.id}`)}
                    >
                      <FileText size={15} strokeWidth={1.5} aria-hidden />
                      Detail &amp; tagihan
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Main Sign-in Surface */}
      <Card className="p-5 space-y-5 border-gray-200/80">
        {/* Two quiet method tabs using brand neutral gray-100 & primary active text */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl">
          <button
            type="button"
            onClick={() => setLoginMethod('wa')}
            className={`h-9 px-3 rounded-lg text-xs font-medium transition-colors ${
              loginMethod === 'wa'
                ? 'bg-white text-primary-700 shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Nomor WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('email')}
            className={`h-9 px-3 rounded-lg text-xs font-medium transition-colors ${
              loginMethod === 'email'
                ? 'bg-white text-primary-700 shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Akun Email
          </button>
        </div>

        {loginMethod === 'wa' ? (
          <form onSubmit={handleSubmit(onSubmitWa)} className="space-y-4" noValidate>
            <Input
              label="Nomor WhatsApp pemesan"
              placeholder="81298451230"
              required
              prefix="+62"
              hint="Gunakan 81298451230 untuk mencoba data contoh"
              error={errors.noWhatsapp?.message}
              {...register('noWhatsapp', { required: 'Nomor WhatsApp wajib diisi' })}
            />

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Nomor referensi pesanan
                </label>
                <span className="text-xs text-gray-400">Opsional</span>
              </div>
              <input
                type="text"
                placeholder="#DWA-2026-0001"
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                {...register('nomorReferensi')}
              />
            </div>

            <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
              <span>Masuk dengan kode OTP</span>
              <ArrowRight size={16} strokeWidth={1.5} aria-hidden />
            </Button>
          </form>
        ) : (
          <form onSubmit={handleAuthSubmit(onSubmitAuth)} className="space-y-4" noValidate>
            {authMode === 'register' && (
              <Input
                label="Nama lengkap"
                placeholder="Budi Pratama"
                required
                error={authErrors.name?.message}
                {...regAuth('name', {
                  required: authMode === 'register' ? 'Nama wajib diisi' : false,
                  minLength: { value: 3, message: 'Minimal 3 karakter' },
                })}
              />
            )}

            <Input
              label="Alamat email"
              type="email"
              placeholder="nama@kampus.ac.id"
              required
              error={authErrors.email?.message}
              {...regAuth('email', { required: 'Email wajib diisi' })}
            />

            <Input
              label="Kata sandi"
              type="password"
              placeholder="Minimal 8 karakter"
              required
              hint={authMode === 'register' ? 'Gunakan kombinasi huruf kapital dan angka' : undefined}
              error={authErrors.password?.message}
              {...regAuth('password', {
                required: 'Kata sandi wajib diisi',
                minLength: { value: 8, message: 'Minimal 8 karakter' },
              })}
            />

            <Button type="submit" fullWidth size="lg" loading={isAuthSubmitting}>
              <span>{authMode === 'login' ? 'Masuk ke ruang kerja' : 'Buat akun baru'}</span>
              <ArrowRight size={16} strokeWidth={1.5} aria-hidden />
            </Button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
              >
                {authMode === 'login' ? (
                  <>Belum punya akun? <span className="font-medium text-primary-600 hover:underline">Daftar akun baru</span></>
                ) : (
                  <>Sudah punya akun? <span className="font-medium text-primary-600 hover:underline">Masuk dengan email</span></>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Quiet 1-click sample workspace button matching brand primary-50 & gray-200 */}
        <div className="pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/workspace/DWA-2026-0001')}
            className="w-full h-10 px-3.5 rounded-xl bg-gray-50 hover:bg-primary-50 border border-gray-200/80 hover:border-primary-200 text-gray-800 hover:text-primary-700 text-xs font-medium transition-colors flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success-500" aria-hidden />
              <span>Buka ruang kerja contoh (AI Research Hub)</span>
            </span>
            <span className="flex items-center gap-1 text-gray-500 font-mono">
              #DWA-2026-0001
              <ChevronRight size={14} strokeWidth={1.5} aria-hidden />
            </span>
          </button>
        </div>
      </Card>

      {/* Quiet bottom links */}
      <div className="flex items-center justify-between text-xs text-gray-400 px-1">
        <Link to="/#harga" className="text-primary-600 font-medium hover:underline">
          Buat pesanan baru
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
