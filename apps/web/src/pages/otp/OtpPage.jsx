import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { verifyOtp, requestOtp } from '../../services/api/index.js';
import { useSessionStore } from '../../stores/sessionStore.js';
import { toast } from 'sonner';
import OtpInput from '../../components/ui/OtpInput.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { ShieldCheck, RefreshCw } from 'lucide-react';

export default function OtpPage() {
  const navigate = useNavigate();
  const { otpRequest, setOtpRequest, setSession } = useSessionStore();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);

  // Guard: if no OTP request in session, redirect back
  useEffect(() => {
    if (!otpRequest) {
      navigate('/lacak-pesanan', { replace: true });
    }
  }, []);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  const handleVerify = async () => {
    if (otp.length < 6) {
      setError('Masukkan 6 digit kode.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await verifyOtp(otpRequest.requestId, otp);
      setSession({ sessionToken: result.sessionToken, customer: result.customer, orders: result.orders });
      toast.success('Verifikasi berhasil!');
      if (result.orders.length === 1) {
        navigate(`/workspace/${result.orders[0].id}`);
      } else {
        navigate('/lacak-pesanan');
      }
    } catch (err) {
      if (err.code === 'otp_invalid') {
        setError('Kode OTP tidak sesuai. Cek kembali kode yang dikirim.');
      } else if (err.code === 'otp_expired') {
        setError('Kode OTP sudah kedaluwarsa. Minta kode baru.');
      } else {
        setError(err.message ?? 'Terjadi kesalahan.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!otpRequest?.noWhatsapp) return;
    try {
      const result = await requestOtp(otpRequest.noWhatsapp);
      setOtpRequest({ ...otpRequest, requestId: result.requestId, expiresAt: result.expiresAt });
      setResendCountdown(60);
      setOtp('');
      setError('');
      toast.success('Kode OTP baru sudah dikirim ke WhatsApp kamu.');
    } catch (err) {
      toast.error(err.message ?? 'Gagal mengirim ulang OTP.');
    }
  };

  return (
    <div className="space-y-6 py-2">
      <nav aria-label="Breadcrumb" className="text-xs text-gray-400">
        <Link to="/lacak-pesanan" className="hover:text-primary-600">Lacak Pesanan</Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-600 font-medium">Verifikasi OTP</span>
      </nav>

      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
          <ShieldCheck size={28} className="text-primary-600" aria-hidden />
        </div>
        <Badge variant="primary" dot>Verifikasi WhatsApp</Badge>
        <h1 className="text-2xl font-extrabold text-gray-900">Masukkan Kode OTP</h1>
        <p className="text-sm text-gray-500">
          Kode verifikasi 6 digit telah dikirim ke{' '}
          <strong className="text-gray-700">{otpRequest?.maskedWa ?? 'WhatsApp kamu'}</strong>.
        </p>
        <p className="text-xs text-primary-600 font-semibold bg-primary-50 px-3 py-1.5 rounded-full inline-block">
          Demo: gunakan kode <strong>123456</strong>
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        <OtpInput value={otp} onChange={setOtp} length={6} error={error} />

        <Button fullWidth size="lg" loading={loading} onClick={handleVerify} disabled={otp.length < 6}>
          Verifikasi Kode
        </Button>

        <div className="text-center">
          {resendCountdown > 0 ? (
            <p className="text-xs text-gray-400">
              Kirim ulang kode dalam <span className="font-semibold text-gray-600">{resendCountdown}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline mx-auto"
            >
              <RefreshCw size={13} aria-hidden />
              Kirim Ulang Kode OTP
            </button>
          )}
        </div>
      </div>

      <div className="text-center">
        <Link to="/lacak-pesanan" className="text-sm text-gray-400 hover:text-gray-600">
          Kembali &amp; ubah nomor WhatsApp
        </Link>
      </div>
    </div>
  );
}
