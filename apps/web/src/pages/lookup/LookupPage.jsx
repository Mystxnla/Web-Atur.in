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
  ArrowRight,
  Search,
  ExternalLink,
  PlayCircle,
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
  const { customer, orders: sessionOrders, clearSession } = useSessionStore();
  const { user, accessToken, setAuth, clearAuth } = useAuthStore();

  const [refInput, setRefInput] = useState('');
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

  const handleTrackByRef = (e) => {
    e.preventDefault();
    const cleaned = refInput.trim().replace(/^#/, '');
    if (!cleaned) {
      toast.error('Masukkan nomor referensi pesanan, contoh: DWA-2026-0001');
      return;
    }
    navigate(`/lacak-pesanan/${encodeURIComponent(cleaned)}`);
  };

  const onSubmitAuth = async (data) => {
    try {
      const res =
        authMode === 'login'
          ? await authApi.login({ email: data.email, password: data.password })
          : await authApi.register({ name: data.name, email: data.email, password: data.password });

      setAuth(res);
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

  return (
    <div className="max-w-lg mx-auto py-4 space-y-6 text-gray-900">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Lacak Pesanan &amp; Akses Notion
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Pantau progres setup workspace Notion tim kamu secara real-time dan ambil tautan aksesnya di sini.
        </p>
      </div>

      {/* Primary Card: Direct Order Reference Lookup */}
      <Card className="p-5 border-gray-200 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Cek Cepat dengan Nomor Referensi</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Masukkan nomor referensi dari halaman konfirmasi atau WhatsApp (contoh: <code>DWA-2026-0001</code>).
          </p>
        </div>

        <form onSubmit={handleTrackByRef} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={refInput}
            onChange={(e) => setRefInput(e.target.value)}
            placeholder="Contoh: DWA-2026-0001"
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Button type="submit" size="md">
            <Search size={15} aria-hidden />
            Lacak Status
          </Button>
        </form>
      </Card>

      {/* Secondary Card: Account Login / Order History */}
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
              Memuat riwayat pesanan kamu...
            </p>
          ) : activeOrders.length === 0 ? (
            <div className="rounded-xl bg-gray-50 p-4 text-xs text-gray-600 leading-relaxed border border-gray-200/80 space-y-3">
              <p>
                Belum ada pesanan yang terhubung ke email <strong>{user?.email}</strong>.
              </p>
              <Button
                size="sm"
                onClick={() => navigate('/checkout?paket=custom&cycle=monthly&trial=1')}
              >
                Mulai Free Trial 7 Hari
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 bg-gray-50/70 rounded-xl border border-gray-200/80 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {ord.customer?.namaKelompok ?? ord.group_name ?? 'Workspace Tim'}
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

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      fullWidth
                      onClick={() => navigate(`/lacak-pesanan/${ord.id}`)}
                    >
                      Lihat Status &amp; Link Notion
                      <ArrowRight size={14} aria-hidden />
                    </Button>
                    {ord.notionUrl && (
                      <a
                        href={ord.notionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1 px-3 h-9 rounded-xl border border-primary-200 bg-primary-50 text-primary-700 text-xs font-semibold hover:bg-primary-100 flex-shrink-0"
                      >
                        Notion
                        <ExternalLink size={13} aria-hidden />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-5 border-gray-200 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Atau Masuk dengan Akun Email</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Untuk melihat seluruh riwayat pesanan yang pernah dibuat dengan email kamu.
            </p>
          </div>

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
              label="Email akun"
              type="email"
              placeholder="budi@kampus.ac.id"
              required
              error={authErrors.email?.message}
              {...regAuth('email', { required: 'Email wajib diisi' })}
            />

            <Input
              label="Kata sandi"
              type="password"
              placeholder="Minimal 8 karakter"
              required
              error={authErrors.password?.message}
              {...regAuth('password', {
                required: 'Kata sandi wajib diisi',
                minLength: { value: 8, message: 'Minimal 8 karakter' },
              })}
            />

            <Button type="submit" fullWidth size="md" loading={isAuthSubmitting}>
              <span>{authMode === 'login' ? 'Masuk & Lihat Pesanan' : 'Daftar Akun'}</span>
              <ArrowRight size={15} aria-hidden />
            </Button>
          </form>
        </Card>
      )}

      {/* Helpful shortcut to Demo */}
      <div className="bg-primary-50/70 border border-primary-100 rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="text-xs text-gray-700">
          <div className="font-semibold text-gray-900">Belum pesan dan ingin lihat contohnya dulu?</div>
          <p className="text-gray-500 mt-0.5">Coba simulasi interaktif struktur workspace Notion langsung di browser.</p>
        </div>
        <Link
          to="/demo"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-primary-200 text-primary-700 text-xs font-semibold hover:bg-primary-50 flex-shrink-0"
        >
          <PlayCircle size={14} aria-hidden />
          Lihat Demo
        </Link>
      </div>

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
