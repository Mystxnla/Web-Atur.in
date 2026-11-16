import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/api/auth.js';
import { formatTanggalWIB } from '../../lib/format.js';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { JENIS_KEBUTUHAN_OPTIONS } from '@atur-in/shared';

export default function LeadsPage() {
  const { data: leads, isLoading } = useQuery({
    queryKey: ['admin', 'leads'],
    queryFn: adminApi.leads,
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Leads Konsultasi</h1>
        <p className="text-sm text-gray-500">{leads?.length ?? 0} leads masuk</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                {['Nama PIC', 'WhatsApp', 'Kelompok', 'Kebutuhan', 'Anggota', 'Catatan', 'Tanggal'].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leads?.map((lead) => {
                const jenis = JENIS_KEBUTUHAN_OPTIONS.find(j => j.value === lead.need_type)?.label ?? lead.need_type ?? '-';
                return (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{lead.name}</td>
                    <td className="px-4 py-3 text-gray-600">+62 {lead.whatsapp}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.group_name}</td>
                    <td className="px-4 py-3 text-gray-500">{jenis}</td>
                    <td className="px-4 py-3 text-gray-500">{lead.member_estimate ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{lead.note ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatTanggalWIB(lead.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {leads?.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-10">Belum ada leads.</p>
          )}
        </div>
      </div>
    </div>
  );
}
