import CopyButton from '../../components/ui/CopyButton.jsx';
import { Building2 } from 'lucide-react';

export default function VaPanel({ payment }) {
  const vaNumber = payment?.vaNumber ?? payment?.va_number;
  if (!vaNumber) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Building2 size={18} className="text-primary-600" aria-hidden />
        <h3 className="text-sm font-bold text-gray-800">Nomor Virtual Account</h3>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-1">No. Rekening Virtual</p>
          <p className="text-lg font-bold text-gray-900 font-mono tracking-wider">{vaNumber}</p>
        </div>
        <CopyButton text={vaNumber} label="Salin" />
      </div>

      <div className="text-sm text-gray-500 space-y-1">
        <p className="font-semibold text-gray-700">Panduan Transfer:</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Buka m-banking atau ATM bank pilihanmu.</li>
          <li>Pilih menu Transfer &gt; ke Rekening Virtual Account.</li>
          <li>Masukkan nomor VA di atas dan cek nominal sesuai tagihan.</li>
          <li>Konfirmasi transaksi. Verifikasi otomatis dalam 1–3 menit.</li>
        </ol>
      </div>
      <p className="text-xs text-center text-gray-400 italic">Demo — nomor VA ini bukan rekening nyata.</p>
    </div>
  );
}
