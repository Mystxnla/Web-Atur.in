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
  User,
  Layers,
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

  // Default to 'email' so every team member logs in or creates their own account
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
  const activeCustomerName = user?.name ?? customer?.namaLengkap;

  return (
    <div className="max-w-md mx-auto py-4 space-y-6 text-gray-900">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Masuk ke ruang kerja tim
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Masuk dengan akun email yang sudah diberi akses oleh ketua kelompokmu untuk membuka divisi dan meja kerja pribadimu.
        </p>
      </div>

      {/* Connected Workspaces (Shows division & role assigned to the logged-in member) */}
      {(sessionOrders?.length > 0 || user) && (
        <Card className="space-y-3 border-gray-200 p-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {activeCustomerName?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{activeCustomerName}</div>
                <div className="text-xs text-gray-400 truncate">{user?.email ?? 'Sesi WhatsApp'}</div>
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
            <p className="text-xs text-gray-400 py-3 text-center">Mencari ruang kerja dan divisi Anda...</p>
          ) : activeOrders.length === 0 ? (
            <div className="rounded-xl bg-gray-50 p-4 text-xs text-gray-600 leading-relaxed border border-gray-200/80 space-y-2">
              <p className="font-medium text-gray-900">Belum ada ruang kerja yang terhubung ke {user?.email}</p>
              <p>
                Minta ketua kelompokmu menambahkan email <strong>{user?.email}</strong> di menu <strong>Tim &amp; akses</strong> dalam ruang kerja kelompok, atau coba buka contoh ruang kerja di bawah.
              </p>
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
                          {toDisplayRef(ord.nomorReferensi ?? ord.ref_number ?? ord.id)} · {formatTanggalWIB(ord.dibuatPada ?? ord.created_at)}
                        </div>
                      </div>
                      <span className="text-xs font-medium text-primary-700 tabular-nums flex-shrink-0">
                        {ord.isTrial ? 'Trial 7 hari' : formatRupiah(ord.totalTagihan ?? ord.total ?? 0)}
                      </span>
                    </div>

                    {/* Assigned Division & Role Badge Box */}
                    {profile && (
                      <div className="bg-white rounded-lg border border-gray-200/80 p-2.5 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <Layers size={14} strokeWidth={1.5} className="text-primary-600 flex-shrink-0" />
                          <div className="truncate">
                            <span className="text-gray-500">Divisi: </span>
                            <span className="font-semibold text-gray-900">{profile.divisionName}</span>
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

                    {profile?.isOwner && (
                      <button
                        type="button"
                        onClick={() => navigate(`/lacak-pesanan/${ord.id}`)}
                        className="w-full pt-1 text-xs text-gray-500 hover:text-primary-600 flex items-center justify-center gap-1"
                      >
                        <FileText size={13} strokeWidth={1.5} />
                        Lihat status pesanan &amp; tagihan
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Main Sign-in Surface */}
      <Card className="p-5 space-y-5 border-gray-200/80">
        {/* Method Tabs: Akun Email is Primary, OTP WA is Secondary */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl">
          <button
            type="button"
            onClick={() => setLoginMethod('email')}
            className={`h-9 px-3 rounded-lg text-xs font-medium transition-colors ${
              loginMethod === 'email'
                ? 'bg-white text-primary-700 shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Akun Anggota / Ketua
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('wa')}
            className={`h-9 px-3 rounded-lg text-xs font-medium transition-colors ${
              loginMethod === 'wa'
                ? 'bg-white text-primary-700 shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Cek OTP Pemesan
          </button>
        </div>

        {loginMethod === 'email' ? (
          <form onSubmit={handleAuthSubmit(onSubmitAuth)} className="space-y-4" noValidate>
            <div className="flex items-center justify-between bg-gray-50 p-1 rounded-lg border border-gray-200/80 text-xs font-medium">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  authMode === 'login' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Masuk akun
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  authMode === 'register' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Buat akun baru
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
              hint="Gunakan email yang sudah didaftarkan ketua di dalam divisi tim"
              error={authErrors.email?.message}
              {...regAuth('email', { required: 'Email wajib diisi' })}
            />

            <Input
              label="Kata sandi"
              type="password"
              placeholder="Minimal 8 karakter"
              required
              hint={authMode === 'register' ? 'Kombinasi huruf kapital dan angka (mis. Kampus123)' : undefined}
              error={authErrors.password?.message}
              {...regAuth('password', {
                required: 'Kata sandi wajib diisi',
                minLength: { value: 8, message: 'Minimal 8 karakter' },
              })}
            />

            <Button type="submit" fullWidth size="lg" loading={isAuthSubmitting}>
              <span>{authMode === 'login' ? 'Masuk & buka divisi saya' : 'Buat akun & hubungkan divisi'}</span>
              <ArrowRight size={16} strokeWidth={1.5} aria-hidden />
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit(onSubmitWa)} className="space-y-4" noValidate>
            <Input
              label="Nomor WhatsApp pemesan (Ketua)"
              placeholder="81298451230"
              required
              prefix="+62"
              hint="Khusus pemesan yang membuat order awal (contoh: 81298451230)"
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
              <span>Kirim kode OTP ke WhatsApp pemesan</span>
              <ArrowRight size={16} strokeWidth={1.5} aria-hidden />
            </Button>
          </form>
        )}

        {/* Quick Demo Access with pre-configured Divisions & Members */}
        <div className="pt-4 border-t border-gray-100 space-y-2">
          <div className="text-xs text-gray-400">
            Ingin langsung mencoba simulasi multi-divisi &amp; meja kerja anggota?
          </div>
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
              4 Divisi
              <ChevronRight size={14} strokeWidth={1.5} aria-hidden />
            </span>
          </button>
        </div>
      </Card>

      {/* Bottom links */}
      <div className="flex items-center justify-between text-xs text-gray-400 px-1">
        <Link to="/#harga" className="text-primary-600 font-medium hover:underline">
          Buat ruang kerja kelompok baru
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
