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
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Logo from '../../components/ui/Logo.jsx';
import {
  LogOut,
  FolderKanban,
  FileText,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { waSupportLink } from '../../lib/wa.js';
import { SITE } from '../../config/site.js';

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
    <div className="max-w-md mx-auto py-6 space-y-6 text-[#1f1b16]">
      {/* Quiet Header */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-medium tracking-tight text-[#1f1b16]">
          Masuk ke ruang kerja tim
        </h1>
        <p className="text-sm text-[#5e554a] leading-relaxed">
          Buka papan tugas, kertas kerja SOP, atau cek status pesanan kelompokmu.
        </p>
      </div>

      {/* Connected Workspaces (Shown first when verified/logged in) */}
      {(sessionOrders?.length > 0 || user) && (
        <div className="rounded-xl border border-[#1f1b16]/10 bg-[#fdfbf7] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1f1b16]/8 pb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-md bg-[#1f1b16] text-[#fdfbf7] flex items-center justify-center text-xs font-medium flex-shrink-0">
                {activeCustomerName?.[0]?.toUpperCase() ?? 'T'}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-[#1f1b16] truncate">{activeCustomerName}</div>
                <div className="text-xs text-[#7b7266]">Ruang kerja terhubung</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogoutAll}
              className="flex items-center gap-1.5 text-xs font-medium text-[#5e554a] hover:text-[#dc2626] px-2.5 py-1.5 rounded-lg border border-[#1f1b16]/10 bg-white transition-colors"
            >
              <LogOut size={14} strokeWidth={1.5} aria-hidden />
              Keluar
            </button>
          </div>

          {loadingAccountOrders ? (
            <p className="text-xs text-[#7b7266] py-3 text-center">Memuat ruang kerja...</p>
          ) : activeOrders.length === 0 ? (
            <div className="rounded-lg bg-[#f7f4ee] p-3.5 text-xs text-[#5e554a] leading-relaxed">
              Belum ada ruang kerja pada email <strong>{user?.email}</strong>. Gunakan tab WhatsApp di bawah atau buka ruang kerja contoh.
            </div>
          ) : (
            <div className="space-y-2">
              {activeOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-3.5 bg-white rounded-lg border border-[#1f1b16]/10 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#1f1b16] truncate">
                        {ord.customer?.namaKelompok ?? ord.group_name ?? 'Ruang Kerja Tim'}
                      </div>
                      <div className="text-xs text-[#7b7266] mt-0.5 tabular-nums">
                        {toDisplayRef(ord.nomorReferensi ?? ord.ref_number ?? ord.id)} · {STATUS_LABELS[ord.status] ?? ord.status} · {formatTanggalWIB(ord.dibuatPada ?? ord.created_at)}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-[#5e554a] tabular-nums flex-shrink-0">
                      {ord.isTrial ? 'Trial 7 hari' : formatRupiah(ord.totalTagihan ?? ord.total ?? 0)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/workspace/${ord.id}`)}
                      className="h-9 px-3 rounded-lg bg-[#1f1b16] text-white text-xs font-medium hover:bg-[#332d25] transition-colors flex items-center justify-center gap-2"
                    >
                      <FolderKanban size={15} strokeWidth={1.5} aria-hidden />
                      Buka ruang kerja
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/lacak-pesanan/${ord.id}`)}
                      className="h-9 px-3 rounded-lg border border-[#1f1b16]/12 bg-white text-[#1f1b16] text-xs font-medium hover:bg-[#f7f4ee] transition-colors flex items-center justify-center gap-2"
                    >
                      <FileText size={15} strokeWidth={1.5} aria-hidden />
                      Detail &amp; tagihan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Sign-in Surface */}
      <div className="bg-white rounded-xl border border-[#1f1b16]/10 p-5 space-y-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        {/* Two quiet method tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#f7f4ee] rounded-lg border border-[#1f1b16]/6">
          <button
            type="button"
            onClick={() => setLoginMethod('wa')}
            className={`h-8 px-3 rounded-md text-xs font-medium transition-colors ${
              loginMethod === 'wa'
                ? 'bg-white text-[#1f1b16] shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                : 'text-[#5e554a] hover:text-[#1f1b16]'
            }`}
          >
            Nomor WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('email')}
            className={`h-8 px-3 rounded-md text-xs font-medium transition-colors ${
              loginMethod === 'email'
                ? 'bg-white text-[#1f1b16] shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                : 'text-[#5e554a] hover:text-[#1f1b16]'
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

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#1f1b16]">
                  Nomor referensi pesanan
                </label>
                <span className="text-xs text-[#7b7266]">Opsional</span>
              </div>
              <input
                type="text"
                placeholder="#DWA-2026-0001"
                className="w-full h-10 rounded-lg border border-[#1f1b16]/15 bg-white px-3 text-sm text-[#1f1b16] placeholder-[#7b7266] focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                className="text-xs text-[#5e554a] hover:text-[#1f1b16] transition-colors"
              >
                {authMode === 'login' ? (
                  <>Belum punya akun? <span className="font-medium text-primary-700 underline underline-offset-4">Daftar akun baru</span></>
                ) : (
                  <>Sudah punya akun? <span className="font-medium text-primary-700 underline underline-offset-4">Masuk dengan email</span></>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Quiet 1-click sample workspace button */}
        <div className="pt-4 border-t border-[#1f1b16]/8">
          <button
            type="button"
            onClick={() => navigate('/workspace/DWA-2026-0001')}
            className="w-full h-10 px-3.5 rounded-lg bg-[#f7f4ee] hover:bg-[#efe9df] text-[#1f1b16] text-xs font-medium transition-colors flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#16a34a]" aria-hidden />
              <span>Buka ruang kerja contoh (AI Research Hub)</span>
            </span>
            <span className="flex items-center gap-1 text-[#5e554a] font-mono">
              #DWA-2026-0001
              <ChevronRight size={14} strokeWidth={1.5} aria-hidden />
            </span>
          </button>
        </div>
      </div>

      {/* Quiet bottom links */}
      <div className="flex items-center justify-between text-xs text-[#7b7266] px-1">
        <Link to="/#harga" className="hover:text-[#1f1b16] transition-colors">
          Buat pesanan baru
        </Link>
        <a
          href={waSupportLink(SITE.supportWa)}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#1f1b16] transition-colors"
        >
          Hubungi bantuan WhatsApp
        </a>
      </div>
    </div>
  );
}
