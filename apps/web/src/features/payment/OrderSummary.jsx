import Badge from '../../components/ui/Badge.jsx';
import { formatRupiah } from '../../lib/format.js';
import { getPackageById, computePricing } from '@atur-in/shared';
import { Check } from 'lucide-react';

export default function OrderSummary({ order }) {
  const pkg = getPackageById(order?.packageId ?? order?.package_id);
  if (!pkg) return null;

  const billingCycle = order?.billingCycle ?? order?.billing_cycle ?? 'monthly';
  const { hargaPokok, diskon, ppn, recurringTotal, cycleLabel } = computePricing(pkg, {
    billingCycle,
    isTrial: false,
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ringkasan Langganan</h3>
        <Badge variant="gray">{cycleLabel}</Badge>
      </div>

      <div>
        <h4 className="text-lg font-bold text-gray-900">{pkg.nama}</h4>
        <ul className="mt-3 space-y-1.5">
          {pkg.deliverables.slice(0, 3).map((d) => (
            <li key={d} className="flex items-center gap-2 text-sm text-gray-600">
              <Check size={12} className="text-success-600 flex-shrink-0" aria-hidden />
              {d}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
        {hargaPokok > recurringTotal && (
          <div className="flex justify-between text-gray-400">
            <span>Harga Normal</span>
            <span className="line-through">{formatRupiah(hargaPokok)}</span>
          </div>
        )}
        {diskon > 0 && (
          <div className="flex justify-between text-success-600 font-semibold">
            <span>Diskon Siklus Langganan</span>
            <span>-{formatRupiah(diskon)}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-600">
          <span>Biaya Layanan &amp; Pajak</span>
          <span>{ppn === 0 ? 'Rp\u00a00 (Gratis)' : formatRupiah(ppn)}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-100 pt-2">
          <span>Total Tagihan <span className="text-xs font-normal text-gray-400">({cycleLabel})</span></span>
          <span className="text-primary-700 text-xl">{formatRupiah(recurringTotal)}</span>
        </div>
      </div>

      <div className="bg-primary-50 rounded-xl p-3 text-xs text-primary-700 leading-relaxed">
        Setelah pembayaran langganan diverifikasi otomatis, masa aktif workspace tim kamu langsung diperpanjang dan didampingi penuh oleh Digital Workspace Architect.
      </div>
    </div>
  );
}
