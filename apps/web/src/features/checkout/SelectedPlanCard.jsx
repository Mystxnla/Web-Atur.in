import { useNavigate } from 'react-router-dom';
import { getPackageById, computePricing } from '@atur-in/shared';
import { formatRupiah } from '../../lib/format.js';
import Badge from '../../components/ui/Badge.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Check, ShoppingBag } from 'lucide-react';

export default function SelectedPlanCard({ packageId }) {
  const navigate = useNavigate();
  const pkg = getPackageById(packageId);

  if (!pkg) return null;

  const { hargaPokok, diskon, ppn, total } = computePricing(pkg);
  const discountPct = diskon > 0 ? Math.round((diskon / hargaPokok) * 100) : 0;

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
          <ShoppingBag size={16} className="text-success-700" aria-hidden />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="success">Paket Pilihan Terbaik</Badge>
            {discountPct > 0 && <Badge variant="warning">Hemat {discountPct}%</Badge>}
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/#harga')}
          className="text-xs text-primary-600 font-semibold hover:underline"
        >
          Ubah Paket
        </button>
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-1">{pkg.nama}</h3>
      <p className="text-sm text-gray-500 mb-4">
        Solusi lengkap arsitektur workspace terstandarisasi untuk tim &amp; organisasi.
      </p>

      {hargaPokok > pkg.harga && (
        <div className="text-sm text-gray-400 line-through">{formatRupiah(hargaPokok)}</div>
      )}
      <div className="text-3xl font-extrabold text-primary-700 mb-1">{formatRupiah(pkg.harga)}</div>
      <div className="text-xs text-gray-400 mb-4">{pkg.satuan}</div>

      <ul className="space-y-2 mb-5" aria-label={`Deliverable ${pkg.nama}`}>
        {pkg.deliverables.map((d) => (
          <li key={d} className="flex items-start gap-2 text-sm text-gray-600">
            <Check size={14} className="text-success-600 mt-0.5 flex-shrink-0" aria-hidden />
            {d}
          </li>
        ))}
      </ul>

      <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Total Tagihan</span>
        <span className="text-xl font-extrabold text-primary-700">{formatRupiah(total)}</span>
      </div>
      <p className="text-xs text-gray-400 text-right mt-1">
        Langkah berikutnya: Pilih metode transfer bank, Virtual Account, QRIS, atau E-Wallet.
      </p>
    </Card>
  );
}
