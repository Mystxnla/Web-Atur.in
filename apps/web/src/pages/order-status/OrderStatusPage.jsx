import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchOrder } from '../../services/api/index.js';
import { STATUS_LABELS, STATUS_DESCRIPTIONS, STATUS_TIMELINE_ORDER, getStatusIndex } from '@atur-in/shared';
import Badge from '../../components/ui/Badge.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import CopyButton from '../../components/ui/CopyButton.jsx';
import Timeline from '../../components/ui/Timeline.jsx';
import { formatRupiah, formatTanggalWIB } from '../../lib/format.js';
import { toDisplayRef } from '../../lib/orderRef.js';
import { waSupportLink } from '../../lib/wa.js';
import { SITE } from '../../config/site.js';
import { MessageCircle, ShieldCheck, Home, RefreshCw } from 'lucide-react';

const STATUS_VARIANT = {
  menunggu_pembayaran: 'warning',
  dibayar: 'primary',
  diverifikasi: 'primary',
  proses_setup: 'purple',
  selesai: 'success',
  kedaluwarsa: 'danger',
};

export default function OrderStatusPage() {
  const { orderId } = useParams();

  const { data: order, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrder(orderId),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 py-2">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-60 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center space-y-4">
        <p className="text-danger-600 text-sm">Pesanan tidak ditemukan atau akses ditolak.</p>
        <Link to="/lacak-pesanan" className="text-sm text-primary-600 hover:underline">
          Kembali ke Lacak Pesanan
        </Link>
      </div>
    );
  }

  const pkg = order?.package;
  const customer = order?.customer;
  const logs = order?.statusLogs ?? [];
  const currentStatusIdx = getStatusIndex(order.status);

  const timelineSteps = STATUS_TIMELINE_ORDER.map((s) => ({
    label: STATUS_LABELS[s],
    description: STATUS_DESCRIPTIONS[s],
  }));

  return (
    <div className="space-y-5 py-2 pb-8">
      <nav aria-label="Breadcrumb" className="text-xs text-gray-400">
        <Link to="/lacak-pesanan" className="hover:text-primary-600">Lacak Pesanan</Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-600 font-medium">{toDisplayRef(orderId)}</span>
      </nav>

      {/* Status hero */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-gray-400">Nomor Referensi Pesanan</p>
            <p className="text-lg font-extrabold text-primary-700">{toDisplayRef(orderId)}</p>
          </div>
          <div className="flex items-center gap-2">
            <CopyButton text={toDisplayRef(orderId)} />
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
              aria-label="Refresh status"
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} aria-hidden />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[order.status] ?? 'gray'} dot>
            {STATUS_LABELS[order.status] ?? order.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Paket', value: pkg?.nama ?? '—' },
            { label: 'Pelanggan', value: customer?.namaLengkap ?? '—' },
            { label: 'Total Tagihan', value: formatRupiah(order.totalTagihan) },
            { label: 'Dibuat', value: formatTanggalWIB(order.dibuatPada) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-400">{label}</p>
              <p className="font-semibold text-gray-800 text-sm">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Status timeline */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-800 mb-4">Progress Pesanan</h2>
        <Timeline steps={timelineSteps} currentIndex={currentStatusIdx} />
      </div>

      {/* Activity log */}
      {logs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-3">Riwayat Aktivitas</h2>
          <ul className="space-y-3">
            {[...logs].reverse().map((log) => (
              <li key={log.id} className="flex gap-3 text-sm">
                <div className="w-2 h-2 bg-primary-400 rounded-full mt-1.5 flex-shrink-0" aria-hidden />
                <div>
                  <p className="font-medium text-gray-700">{STATUS_LABELS[log.status] ?? log.status}</p>
                  {log.catatan && <p className="text-xs text-gray-400">{log.catatan}</p>}
                  <p className="text-xs text-gray-300 mt-0.5">{formatTanggalWIB(log.diperbuatPada)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick contact */}
      <a
        href={waSupportLink(SITE.supportWa, toDisplayRef(orderId))}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3.5 bg-success-600 text-white font-semibold rounded-2xl text-sm hover:bg-success-700 transition-colors"
      >
        <MessageCircle size={16} aria-hidden />
        Chat Arsitek via WhatsApp
      </a>

      <Link
        to="/"
        className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <Home size={14} aria-hidden />
        Kembali ke Beranda
      </Link>

      <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1 pb-4">
        <ShieldCheck size={12} className="text-success-500" aria-hidden />
        100% Guaranteed SLA &amp; Kerahasiaan Data (NDA Enforced)
      </p>
    </div>
  );
}
