import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/api/auth.js';
import { formatRupiah, formatTanggalWIB } from '../../lib/format.js';
import { toDisplayRef } from '../../lib/orderRef.js';
import Skeleton from '../../components/ui/Skeleton.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, Users, FileText, TrendingUp,
  Clock, CheckCircle, Settings, AlertCircle
} from 'lucide-react';

const STATUS_BADGE = {
  menunggu_pembayaran: { variant: 'warning',  label: 'Menunggu Bayar' },
  dibayar:             { variant: 'primary',  label: 'Dibayar' },
  diverifikasi:        { variant: 'primary',  label: 'Diverifikasi' },
  proses_setup:        { variant: 'purple',   label: 'Proses Setup' },
  selesai:             { variant: 'success',  label: 'Selesai' },
  kedaluwarsa:         { variant: 'danger',   label: 'Kedaluwarsa' },
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: adminApi.dashboard,
    refetchInterval: 30000,
  });

  if (isLoading) return <DashboardSkeleton />;

  const { stats, recentOrders } = data;

  const statCards = [
    { label: 'Total Pesanan',  value: stats.totalOrders,              icon: ShoppingBag,  color: 'bg-primary-50 text-primary-600' },
    { label: 'Revenue',        value: formatRupiah(stats.totalRevenue), icon: TrendingUp, color: 'bg-success-50 text-success-600' },
    { label: 'Menunggu Bayar', value: stats.pendingOrders,            icon: Clock,        color: 'bg-warning-50 text-warning-600' },
    { label: 'Proses Setup',   value: stats.activeSetup,              icon: Settings,     color: 'bg-purple-100 text-purple-600' },
    { label: 'Selesai',        value: stats.doneOrders,               icon: CheckCircle,  color: 'bg-success-50 text-success-600' },
    { label: 'Pengguna',       value: stats.totalUsers,               icon: Users,        color: 'bg-blue-100 text-blue-700' },
    { label: 'Leads Masuk',    value: stats.totalLeads,               icon: FileText,     color: 'bg-orange-100 text-orange-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ringkasan aktivitas Atur.in</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon size={18} aria-hidden />
            </div>
            <div className="text-2xl font-extrabold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Pesanan Terbaru</h2>
          <Link to="/admin/orders" className="text-sm text-primary-600 font-semibold hover:underline">
            Lihat semua
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                {['Ref', 'Pelanggan', 'Paket', 'Total', 'Status', 'Tanggal'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.map((order) => {
                const badge = STATUS_BADGE[order.status] ?? { variant: 'gray', label: order.status };
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-primary-700">
                      <Link to={`/admin/orders/${order.id}`} className="hover:underline">
                        {toDisplayRef(order.ref_number)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{order.name}</div>
                      <div className="text-xs text-gray-400">{order.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{order.package?.nama ?? order.package_id}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{formatRupiah(order.total)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatTanggalWIB(order.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {recentOrders.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">Belum ada pesanan.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array(7).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
