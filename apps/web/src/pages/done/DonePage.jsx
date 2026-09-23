import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOrder } from '../../services/api/index.js';
import { ORDER_STATUSES } from '@atur-in/shared';
import Stepper from '../../components/ui/Stepper.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import CopyButton from '../../components/ui/CopyButton.jsx';
import Timeline from '../../components/ui/Timeline.jsx';
import { NEXT_STEPS } from '../../content/nextSteps.js';
import { formatRupiah } from '../../lib/format.js';
import { formatTanggalWIB } from '../../lib/format.js';
import { toDisplayRef } from '../../lib/orderRef.js';
import { waSupportLink } from '../../lib/wa.js';
import { SITE } from '../../config/site.js';
import { useCheckoutStore } from '../../stores/checkoutStore.js';
import { MessageCircle, Home, Download, ShieldCheck } from 'lucide-react';

export default function DonePage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { clearCheckout } = useCheckoutStore();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrder(orderId),
  });

  useEffect(() => {
    if (order && order.status === ORDER_STATUSES.MENUNGGU_PEMBAYARAN) {
      navigate(`/checkout/pembayaran/${orderId}`, { replace: true });
    }
  }, [order?.status]);

  // Clear checkout state after success
  useEffect(() => {
    const t = setTimeout(() => clearCheckout(), 2000);
    return () => clearTimeout(t);
  }, []);

  if (isLoading) return <div className="space-y-4 pt-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  const methodLabel = order?.metodePembayaran === 'qris'
    ? 'QRIS Otomatis (Gojek / BCA / Mandiri)'
    : order?.metodePembayaran === 'va' ? 'Virtual Account' : 'E-Wallet';

  const pkg = order?.package;

  return (
    <div className="space-y-5 pb-8">
      <Stepper currentStep={4} />

      {/* Success hero */}
      <div className="text-center py-6">
        <div className="relative inline-block mb-4">
          <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M6 17L12 23L26 9" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-success-400 rounded-full flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 8L5.5 11.5L12 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <Badge variant="success" dot className="mb-4">Konfirmasi Checkout Otomatis</Badge>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Pesanan Berhasil Diterima!</h1>
        <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
          Terima kasih telah mempercayakan perancangan ruang kerja digital tim kamu kepada{' '}
          <strong>Digital Workspace Architect</strong>.
        </p>
      </div>

      {/* Receipt card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Nomor Referensi Pesanan</p>
            <p className="text-lg font-extrabold text-primary-700">{toDisplayRef(orderId)}</p>
          </div>
          <CopyButton text={toDisplayRef(orderId)} />
        </div>

        <div className="bg-primary-50 rounded-xl p-3 flex items-center gap-2">
          <div className="w-6 h-6 flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 4v8m0 0l3-3m-3 3l-3-3M5 17h14" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-primary-700">Pembayaran Sedang Diverifikasi</p>
            <p className="text-xs text-primary-500">Sistem QRIS instan sinkron dalam 1–3 menit</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          {[
            { label: 'Paket Terpilih', value: pkg?.nama ?? '—' },
            { label: 'Metode Pembayaran', value: methodLabel },
            { label: 'Waktu Transaksi', value: formatTanggalWIB(order?.dibuatPada) },
            { label: 'Total Tagihan', value: formatRupiah(order?.totalTagihan ?? 0), bold: true },
          ].map(({ label, value, bold }) => (
            <div key={label} className="flex justify-between">
              <span className="text-gray-500">{label}</span>
              <span className={bold ? 'font-extrabold text-primary-700 text-base' : 'font-semibold text-gray-800'}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Next steps */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 2v6l4 2" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="8" cy="8" r="6" stroke="#6366f1" strokeWidth="1.5"/>
            </svg>
          </div>
          <h2 className="font-bold text-gray-800">Apa Langkah Selanjutnya?</h2>
        </div>
        <Timeline steps={NEXT_STEPS} currentIndex={0} />
      </div>

      {/* Invoice */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <Download size={18} className="text-gray-600" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Unduh Bukti Invoice Resmi</p>
            <p className="text-xs text-gray-400">Format PDF (dilengkapi rincian PPN &amp; No. Pokok)</p>
          </div>
        </div>
        <button
          onClick={() => alert('Invoice PDF — fitur aktif di versi produksi.')}
          className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
          aria-label="Unduh invoice"
        >
          <Download size={20} aria-hidden />
        </button>
      </div>

      {/* CTAs */}
      <a
        href={waSupportLink(SITE.supportWa, toDisplayRef(orderId))}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3.5 bg-success-600 text-white font-semibold rounded-2xl text-sm hover:bg-success-700 transition-colors"
      >
        <MessageCircle size={18} aria-hidden />
        Chat Arsitek via WhatsApp
      </a>

      <Link
        to="/"
        className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <Home size={16} aria-hidden />
        Kembali ke Beranda
      </Link>

      {/* Trust footer */}
      <div className="bg-gray-50 rounded-2xl p-4 text-center space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-600">
          <ShieldCheck size={14} className="text-success-600" aria-hidden />
          100% Guaranteed SLA &amp; Kerahasiaan Data (NDA Enforced)
        </div>
        <p className="text-xs text-gray-400">
          Butuh bantuan mendesak? Hubungi tim support kami di{' '}
          <a href={`mailto:${SITE.supportEmail}`} className="text-primary-600 hover:underline">{SITE.supportEmail}</a>
          {' '}atau WhatsApp{' '}
          <a href={`tel:${SITE.supportPhone}`} className="text-primary-600 hover:underline">{SITE.supportPhone}</a>.
        </p>
        <p className="text-xs text-gray-400">Layanan aktif setiap {SITE.operationalHours}.</p>
      </div>
    </div>
  );
}
