import { useNavigate } from 'react-router-dom';
import { getPackageById, computePricing, BILLING_CYCLES } from '@atur-in/shared';
import { formatRupiah } from '../../lib/format.js';
import { useCheckoutStore } from '../../stores/checkoutStore.js';
import Badge from '../../components/ui/Badge.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Check, ShoppingBag, Sparkles } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export default function SelectedPlanCard({ packageId }) {
  const navigate = useNavigate();
  const { billingCycle, setBillingCycle, isTrial, setIsTrial } = useCheckoutStore();
  const pkg = getPackageById(packageId);

  if (!pkg) return null;

  const effectiveTrial = Boolean(pkg.hasTrial && isTrial);
  const { hargaPokok, diskon, recurringTotal, total, cycleLabel, trialDays } = computePricing(pkg, {
    billingCycle,
    isTrial: effectiveTrial,
  });
  const discountPct = diskon > 0 && hargaPokok > 0 ? Math.round((diskon / hargaPokok) * 100) : 0;

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
          <ShoppingBag size={16} className="text-success-700" aria-hidden />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="success">Paket Pilihan</Badge>
            {effectiveTrial && <Badge variant="primary" dot>Free Trial {trialDays} Hari</Badge>}
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

      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{pkg.nama}</h3>
        <p className="text-sm text-gray-500">
          Solusi lengkap arsitektur workspace terstandarisasi untuk tim &amp; organisasi.
        </p>
      </div>

      {/* Billing Cycle Selector */}
      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2">
        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Pilih Siklus Langganan
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setBillingCycle(BILLING_CYCLES.MONTHLY)}
            className={cn(
              'py-2 px-3 rounded-lg text-xs font-semibold border text-left transition-all',
              billingCycle === BILLING_CYCLES.MONTHLY
                ? 'bg-white border-primary-500 text-primary-700 ring-1 ring-primary-500'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            <div>Bulanan</div>
            <div className="text-gray-400 font-normal">{formatRupiah(pkg.hargaBulanan ?? pkg.harga)}/bln</div>
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle(BILLING_CYCLES.SEMESTER)}
            className={cn(
              'py-2 px-3 rounded-lg text-xs font-semibold border text-left transition-all',
              billingCycle === BILLING_CYCLES.SEMESTER
                ? 'bg-white border-primary-500 text-primary-700 ring-1 ring-primary-500'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            <div className="flex items-center justify-between">
              <span>Semesteran</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-success-100 text-success-700 rounded-full">Hemat 20%</span>
            </div>
            <div className="text-gray-400 font-normal">{formatRupiah(pkg.hargaSemester ?? pkg.harga * 6 * 0.8)}/6 bln</div>
          </button>
        </div>
      </div>

      {/* Free Trial Toggle — HANYA tampil jika paket mendukung trial (paket tengah) */}
      {pkg.hasTrial && (
        <div
          onClick={() => setIsTrial(!isTrial)}
          role="switch"
          aria-checked={effectiveTrial}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsTrial(!isTrial);
            }
          }}
          className={cn(
            'p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3',
            effectiveTrial
              ? 'bg-primary-50/70 border-primary-300'
              : 'bg-white border-gray-200 hover:bg-gray-50'
          )}
        >
          <div className="flex items-start gap-2.5">
            <div className={cn('p-1.5 rounded-lg mt-0.5', effectiveTrial ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500')}>
              <Sparkles size={14} aria-hidden />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">
                Mulai dengan Free Trial {trialDays} Hari (Rp 0 Hari Ini)
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Workspace langsung disiapkan hari ini. Bayar langganan {formatRupiah(recurringTotal)} ({cycleLabel.toLowerCase()}) setelah masa uji coba selesai. Berlaku 1x per nomor WA / Email.
              </div>
            </div>
          </div>
          <div
            className={cn(
              'w-10 h-6 rounded-full transition-colors flex-shrink-0 p-0.5 mt-1',
              effectiveTrial ? 'bg-primary-600' : 'bg-gray-300'
            )}
          >
            <div
              className={cn(
                'w-5 h-5 rounded-full bg-white shadow transition-transform',
                effectiveTrial ? 'translate-x-4' : 'translate-x-0'
              )}
            />
          </div>
        </div>
      )}

      <ul className="space-y-2" aria-label={`Deliverable ${pkg.nama}`}>
        {pkg.deliverables.map((d) => (
          <li key={d} className="flex items-start gap-2 text-sm text-gray-600">
            <Check size={14} className="text-success-600 mt-0.5 flex-shrink-0" aria-hidden />
            {d}
          </li>
        ))}
      </ul>

      <div className="border-t border-gray-100 pt-4 space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Biaya Langganan ({cycleLabel})</span>
          <span className="font-semibold text-gray-800">{formatRupiah(recurringTotal)}</span>
        </div>
        {effectiveTrial && (
          <div className="flex items-center justify-between text-sm text-success-600 font-semibold">
            <span>Potongan Free Trial {trialDays} Hari Pertama</span>
            <span>-{formatRupiah(recurringTotal)}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-sm font-bold text-gray-900">Total Tagihan Hari Ini</span>
          <span className="text-2xl font-extrabold text-primary-700">
            {effectiveTrial ? 'Rp 0 (Gratis 7 Hari)' : formatRupiah(total)}
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-right">
        {effectiveTrial
          ? 'Tanpa kartu kredit / tanpa bayar di muka. Langsung aktif setelah submit.'
          : 'Langkah berikutnya: Pilih metode QRIS, Virtual Account, atau E-Wallet.'}
      </p>
    </Card>
  );
}
