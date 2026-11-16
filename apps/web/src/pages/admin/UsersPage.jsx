import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api/auth.js';
import { formatTanggalWIB } from '../../lib/format.js';
import { useAuthStore } from '../../stores/authStore.js';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { toast } from 'sonner';
import { UserCheck, UserX } from 'lucide-react';

export default function UsersPage() {
  const qc = useQueryClient();
  const { user: me } = useAuthStore();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminApi.users,
  });

  const toggle = useMutation({
    mutationFn: (id) => adminApi.toggleUser(id),
    onSuccess: () => { toast.success('Status pengguna diperbarui.'); qc.invalidateQueries(['admin', 'users']); },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Pengguna</h1>
        <p className="text-sm text-gray-500">{users?.length ?? 0} akun terdaftar</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                {['Nama', 'Email', 'Role', 'Pesanan', 'Bergabung', 'Status', ''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users?.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.role === 'superadmin' ? 'danger' : u.role === 'admin' ? 'warning' : 'gray'}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.order_count}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatTanggalWIB(u.created_at)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.is_active ? 'success' : 'danger'}>
                      {u.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {me?.role === 'superadmin' && u.role !== 'superadmin' && (
                      <button
                        onClick={() => toggle.mutate(u.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                        aria-label={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {u.is_active ? <UserX size={16} aria-hidden /> : <UserCheck size={16} aria-hidden />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
