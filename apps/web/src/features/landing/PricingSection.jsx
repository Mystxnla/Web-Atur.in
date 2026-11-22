import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { formatRupiah } from '../../lib/format.js';
import { PACKAGES, BILLING_CYCLES } from '@atur-in/shared';
import { Check, Sparkles } from 'lucide-react';
import { SITE } from '../../config/site.js';
import { cn } from '../../lib/cn.js';

export default function PricingSection() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState(BILLING_CYCLES.MONTHLY);
  const packages = SITE.enableProPackage ? PACKAGES : PACKAGES.filter((p) => !p.proOnly);

  const handleSelectPlan = (pkg, isTrial = false) => {
    const useTrial = Boolean(pkg.hasTrial && isTrial);
    navigate(`/checkout?paket=${pkg.id}&cycle=${billingCycle}&trial=${useTrial ? '1' : '0'}`);
  };

  return (
    <section id="harga" className="py-16 md:py-20 bg-white px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <Badge variant="primary" className="mb-4">Paket &amp; Investasi</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Investasi Terjangkau Ramah Kantong Mahasiswa
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto mb-6">
            Harga transparan, tidak ada kejutan. Pilih siklus langganan bulanan atau semesteran sesuai kebutuhan kelompokmu.
          </p>

          {/* Billing cycle switcher */}
          <div className="inline-flex items-center p-1.5 bg-gray-100 rounded-2xl border border-gray-200 mb-5">
            <button
              type="button"
              onClick={() => setBillingCycle(BILLING_CYCLES.MONTHLY)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                billingCycle === BILLING_CYCLES.MONTHLY
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              )}
            >
              Bulanan
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle(BILLING_CYCLES.SEMESTER)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2',
                billingCycle === BILLING_CYCLES.SEMESTER
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              )}
            >
              <span>Semesteran (6 Bulan)</span>
              <span className="px-2 py-0.5 text-xs font-bold bg-success-100 text-success-700 rounded-full">
                Hemat 20%
              </span>
            </button>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-xl text-sm text-primary-700 font-medium border border-primary-200">
              <Sparkles size={14} aria-hidden />
              Khusus <strong>Paket Lengkap: Setup Custom</strong> tersedia <strong>Free Trial 7 Hari (Rp 0 Hari Ini)</strong>!
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {packages.map((pkg) => (
            <PlanCard
              key={pkg.id}
              pkg={pkg}
              billingCycle={billingCycle}
              onSelectPrimary={() => handleSelectPlan(pkg, Boolean(pkg.hasTrial))}
              onSelectDirect={() => handleSelectPlan(pkg, false)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PlanCard({ pkg, billingCycle, onSelectPrimary, onSelectDirect }) {
  const isSemester = billingCycle === BILLING_CYCLES.SEMESTER;
  const displayPrice = isSemester ? (pkg.hargaSemester ?? pkg.harga * 6 * 0.8) : (pkg.hargaBulanan ?? pkg.harga);
  const strikePrice = isSemester ? (pkg.hargaCoretSemester ?? (pkg.hargaBulanan ?? pkg.harga) * 6) : pkg.hargaCoret;
  const unitLabel = isSemester ? (pkg.satuanSemester ?? 'Per Semester (6 Bulan)') : pkg.satuan;

  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border p-6 transition-shadow hover:shadow-md',
        pkg.popular
          ? 'border-primary-400 shadow-primary-100 shadow-lg ring-2 ring-primary-500 ring-offset-1'
          : 'border-gray-200 shadow-sm'
      )}
    >
      {(pkg.hasTrial || pkg.popular) && (
        <div className="flex items-center justify-between gap-2 mb-3">
          {pkg.hasTrial && (
            <Badge variant="success" dot>
              {pkg.trialBadge ?? 'Gratis Trial 7 Hari'}
            </Badge>
          )}
          {pkg.popular && <Badge variant="warning">Paling Populer</Badge>}
        </div>
      )}

      <div className="mb-1">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{pkg.kategori}</span>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-3">{pkg.nama}</h3>

      <div className="mb-1">
        {strikePrice && strikePrice > displayPrice && (
          <div className="text-sm text-gray-400 line-through">{formatRupiah(strikePrice)}</div>
        )}
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-extrabold text-primary-700">{formatRupiah(displayPrice)}</span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {unitLabel}
          {pkg.hasTrial && (
            <> • <span className="text-success-600 font-semibold">Rp 0 selama 7 hari pertama</span></>
          )}
        </div>
      </div>

      {pkg.patunganLabel && (
        <div className="mt-2 mb-3 text-sm font-semibold text-success-600">{pkg.patunganLabel}</div>
      )}

      <ul className="space-y-2 my-5 flex-1" aria-label={`Fitur ${pkg.nama}`}>
        {pkg.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
            <Check size={14} className="text-success-600 mt-0.5 flex-shrink-0" aria-hidden />
            {f}
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        <Button
          fullWidth
          variant={pkg.ctaVariant === 'primary' ? 'primary' : 'outline'}
          onClick={onSelectPrimary}
        >
          {pkg.ctaLabel}
        </Button>
        {pkg.hasTrial && (
          <button
            type="button"
            onClick={onSelectDirect}
            className="w-full py-1.5 text-xs font-semibold text-gray-500 hover:text-primary-600 transition-colors"
          >
            Atau langsung berlangganan tanpa trial →
          </button>
        )}
      </div>
    </div>
  );
}
