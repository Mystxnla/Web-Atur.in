import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/api/auth.js';
import { formatRupiah, formatTanggalWIB } from '../../lib/format.js';
import { toDisplayRef } from '../../lib/orderRef.js';
import { ORDER_STATUSES } from '@atur-in/shared';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { toast } from 'sonner';
import { Search, ChevronRight } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: ORDER_STATUSES.MENUNGGU_PEMBAYARAN, label: 'Menunggu Bayar' },
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

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const qc = useQueryClient();

  const queryStr = `?${search ? `search=${encodeURIComponent(search)}&` : ''}${statusFilter ? `status=${statusFilter}` : ''}`;

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'orders', search, statusFilter],
    queryFn: () => adminApi.orders(queryStr),
  });

  if (isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Pesanan</h1>
          <p className="text-sm text-gray-500">Total {data?.total ?? 0} pesanan</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            type="text"
            placeholder="Cari nama, email, nomor referensi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                {['Ref', 'Pelanggan', 'Paket', 'Total', 'Status', 'Tanggal', ''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.orders?.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-semibold text-primary-700 whitespace-nowrap">
                    {toDisplayRef(order.ref_number)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{order.name}</div>
                    <div className="text-xs text-gray-400">{order.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{order.package?.nama ?? order.package_id}</td>
                  <td className="px-4 py-3 font-semibold whitespace-nowrap">{formatRupiah(order.total)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_BADGE[order.status] ?? 'gray'}>
                      {STATUS_OPTIONS.find(s => s.value === order.status)?.label ?? order.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatTanggalWIB(order.created_at)}</td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/orders/${order.id}`} className="text-primary-600 hover:text-primary-800">
                      <ChevronRight size={18} aria-hidden />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.orders?.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-10">Tidak ada pesanan ditemukan.</p>
          )}
        </div>
      </div>
    </div>
  );
}
