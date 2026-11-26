import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api/auth.js';
import { formatRupiah, formatTanggalWIB } from '../../lib/format.js';
import { toDisplayRef } from '../../lib/orderRef.js';
import { ORDER_STATUSES } from '@atur-in/shared';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, ExternalLink, Link2 } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: ORDER_STATUSES.MENUNGGU_PEMBAYARAN, label: 'Menunggu Pembayaran' },
  { value: ORDER_STATUSES.DIBAYAR,             label: 'Dibayar' },
  { value: ORDER_STATUSES.DIVERIFIKASI,        label: 'Diverifikasi' },
  { value: ORDER_STATUSES.PROSES_SETUP,        label: 'Proses Setup' },
  { value: ORDER_STATUSES.SELESAI,             label: 'Selesai' },
  { value: ORDER_STATUSES.KEDALUWARSA,         label: 'Kedaluwarsa' },
];

const STATUS_BADGE = {
  menunggu_pembayaran: 'warning',
  dibayar: 'primary',
  diverifikasi: 'primary',
  proses_setup: 'purple',
  selesai: 'success',
  kedaluwarsa: 'danger',
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [newStatus, setNewStatus] = useState('');
  const [catatan, setCatatan] = useState('');
  const [notionUrl, setNotionUrl] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [accessType, setAccessType] = useState('guest_trial');

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin', 'order', id],
    queryFn: () => adminApi.orderDetail(id),
  });

  useEffect(() => {
    if (!order) return;
    setNotionUrl(order.notionUrl ?? order.notion_url ?? '');
    setDriveUrl(order.driveUrl ?? order.drive_url ?? '');
    setAccessType(order.accessType ?? order.access_type ?? (order.is_trial ? 'guest_trial' : 'full_owner'));
  }, [order?.id]);

  const deliveryMutation = useMutation({
    mutationFn: () => adminApi.updateDelivery(id, { notionUrl, driveUrl, accessType }),
    onSuccess: () => {
      toast.success('Link serah terima Notion & Drive berhasil disimpan.');
      qc.invalidateQueries(['admin', 'order', id]);
    },
    onError: (err) => toast.error(err.message),
  });

  const mutation = useMutation({
    mutationFn: () => adminApi.updateStatus(id, newStatus, catatan),
    onSuccess: () => {
      toast.success('Status berhasil diperbarui.');
      qc.invalidateQueries(['admin', 'order', id]);
      qc.invalidateQueries(['admin', 'orders']);
      qc.invalidateQueries(['admin', 'dashboard']);
      setNewStatus('');
      setCatatan('');
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />;
  if (!order) return <p className="text-danger-600">Pesanan tidak ditemukan.</p>;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to="/admin/orders" className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50">
          <ArrowLeft size={18} aria-hidden />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">{toDisplayRef(order.ref_number)}</h1>
          <p className="text-sm text-gray-500">{formatTanggalWIB(order.created_at)}</p>
        </div>
        <Badge variant={STATUS_BADGE[order.status] ?? 'gray'} className="ml-auto">
          {STATUS_OPTIONS.find(s => s.value === order.status)?.label ?? order.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">Info Pelanggan</h2>
          <dl className="space-y-2 text-sm">
            {[
              ['Nama', order.name],
              ['Email', order.email],
              ['WhatsApp', `+62 ${order.whatsapp}`],
              ['Kelompok', order.group_name],
              ['Jenis Kebutuhan', order.need_type ?? '-'],
              ['Jumlah Anggota', order.member_count ?? '-'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-gray-400">{k}</dt>
                <dd className="font-medium text-gray-800 text-right">{v}</dd>
              </div>
            ))}
          </dl>
          {order.description && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Deskripsi kebutuhan</p>
              <p className="text-sm text-gray-700 leading-relaxed">{order.description}</p>
            </div>
          )}
          {order.doc_url && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Dokumen Referensi</p>
              <a
                href={order.doc_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-primary-600 hover:underline break-all"
              >
                {order.doc_url}
              </a>
            </div>
          )}
        </div>

        {/* Order info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">Info Pesanan &amp; Langganan</h2>
          <dl className="space-y-2 text-sm">
            {[
              ['Paket', order.package?.nama ?? order.package_id],
              ['Siklus Langganan', order.billing_cycle === 'semester' ? 'Semesteran (6 Bulan)' : 'Bulanan'],
              ['Tipe', order.is_trial ? 'Free Trial 7 Hari' : 'Langganan Berbayar'],
              ['Tagihan Saat Ini', order.is_trial ? 'Rp 0 (Free Trial)' : formatRupiah(order.total)],
              ['Biaya Perpanjangan', formatRupiah(order.recurring_total ?? order.total)],
              ['Batas Trial', order.trial_ends_at ? formatTanggalWIB(order.trial_ends_at) : '-'],
              ['Metode', order.payments?.[0]?.method ?? order.payment_method ?? '-'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-gray-400">{k}</dt>
                <dd className="font-medium text-gray-800 text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Workspace Delivery Links (Notion & Drive) */}
      <div className="bg-white rounded-2xl border border-primary-100 p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link2 size={16} className="text-primary-600" aria-hidden />
            <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
              Serah Terima Link Workspace (Notion &amp; Drive)
            </h2>
          </div>
          {order.notionUrl && (
            <a
              href={order.notionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline"
            >
              Cek Link Notion
              <ExternalLink size={12} aria-hidden />
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Link Notion Workspace</label>
            <input
              type="url"
              placeholder="https://www.notion.so/..."
              value={notionUrl}
              onChange={(e) => setNotionUrl(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Link Google Drive (Opsional)</label>
            <input
              type="url"
              placeholder="https://drive.google.com/..."
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Tipe Hak Akses Notion</label>
            <select
              value={accessType}
              onChange={(e) => setAccessType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="guest_trial">Akses Guest Free Trial 7 Hari (Anti-Duplicate)</option>
              <option value="full_owner">Hak Milik Penuh — Lunas (Bisa Duplicate)</option>
            </select>
          </div>
          <Button
            onClick={() => deliveryMutation.mutate()}
            loading={deliveryMutation.isPending}
          >
            <CheckCircle size={15} aria-hidden />
            Simpan &amp; Kirim ke Klien
          </Button>
        </div>
      </div>

      {/* Update status */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">Ubah Status</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="">Pilih status baru...</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Catatan (opsional)"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Button
            onClick={() => mutation.mutate()}
            disabled={!newStatus}
            loading={mutation.isPending}
          >
            <CheckCircle size={15} aria-hidden />
            Simpan
          </Button>
        </div>
      </div>

      {/* Activity log */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">Riwayat Status</h2>
        <ul className="space-y-3">
          {[...(order.statusLogs ?? [])].reverse().map((log) => (
            <li key={log.id} className="flex gap-3 text-sm">
              <div className="w-2 h-2 bg-primary-400 rounded-full mt-1.5 flex-shrink-0" aria-hidden />
              <div>
                <p className="font-medium text-gray-700">{STATUS_OPTIONS.find(s => s.value === log.status)?.label ?? log.status}</p>
                {log.note && <p className="text-xs text-gray-400">{log.note}</p>}
                <p className="text-xs text-gray-300">{formatTanggalWIB(log.created_at)} {log.changed_by ? `oleh ${log.changed_by}` : ''}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
