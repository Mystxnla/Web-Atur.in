import { useState } from 'react';
import CopyButton from '../../components/ui/CopyButton.jsx';
import { Wallet, Smartphone } from 'lucide-react';
import { cn } from '../../lib/cn.js';

const PROVIDERS = [
  { id: 'gopay', name: 'GoPay', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'ovo', name: 'OVO', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'dana', name: 'DANA', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { id: 'shopeepay', name: 'ShopeePay', color: 'bg-orange-50 text-orange-700 border-orange-200' },
];

export default function EwalletPanel({ payment }) {
  const [provider, setProvider] = useState('gopay');
  const destNumber = payment?.vaNumber ?? payment?.va_number ?? '0812-0000-2500';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Wallet size={18} className="text-primary-600" aria-hidden />
        <h3 className="text-sm font-bold text-gray-800">Pembayaran E-Wallet Instan</h3>
      </div>

      {/* Pilihan aplikasi E-Wallet */}
      <div className="grid grid-cols-4 gap-2">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setProvider(p.id)}
            className={cn(
              'py-2 px-2 rounded-xl border text-xs font-bold transition-all text-center',
              provider === p.id
                ? `${p.color} ring-2 ring-primary-500`
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-1">
            Nomor Tujuan {PROVIDERS.find((p) => p.id === provider)?.name} Merchant
          </p>
          <p className="text-lg font-bold text-gray-900 font-mono tracking-wider">{destNumber}</p>
        </div>
        <CopyButton text={destNumber} label="Salin" />
      </div>

      <div className="text-sm text-gray-500 space-y-1">
        <p className="font-semibold text-gray-700 flex items-center gap-1.5">
          <Smartphone size={14} aria-hidden />
          Panduan Pembayaran E-Wallet:
        </p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Buka aplikasi {PROVIDERS.find((p) => p.id === provider)?.name} di ponsel kamu.</li>
          <li>Pilih menu Kirim / Bayar ke nomor merchant di atas.</li>
          <li>Pastikan nominal sesuai total tagihan dan masukkan PIN kamu.</li>
          <li>Sistem akan memverifikasi pembayaran secara otomatis.</li>
        </ol>
      </div>
      <p className="text-xs text-center text-gray-400 italic">Demo — gunakan tombol Simulasi Bayar di bawah untuk menguji.</p>
    </div>
  );
}
