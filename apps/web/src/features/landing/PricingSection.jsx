import { useNavigate } from 'react-router-dom';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { formatRupiah } from '../../lib/format.js';
import { PACKAGES } from '@atur-in/shared';
import { Check, Minus } from 'lucide-react';
import { SITE } from '../../config/site.js';
import { cn } from '../../lib/cn.js';

export default function PricingSection() {
  const navigate = useNavigate();
  const packages = SITE.enableProPackage ? PACKAGES : PACKAGES.filter((p) => !p.proOnly);

  return (
    <section id="harga" className="py-16 md:py-20 bg-white px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <Badge variant="primary" className="mb-4">Paket & Investasi</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Investasi Terjangkau Ramah Kantong Mahasiswa
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto mb-6">
            Harga transparan, tidak ada kejutan. Pilih paket yang paling sesuai dengan kebutuhan kelompokmu.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-success-50 rounded-xl text-sm text-success-700 font-medium border border-success-200">
            <Check size={14} aria-hidden />
            Tanpa biaya langganan berulang bulanan. Sekali bayar untuk seluruh tim.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {packages.map((pkg) => (
            <PlanCard key={pkg.id} pkg={pkg} onSelect={() => navigate(`/checkout?paket=${pkg.id}`)} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PlanCard({ pkg, onSelect }) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border p-6 transition-shadow hover:shadow-md',
        pkg.popular
          ? 'border-primary-400 shadow-primary-100 shadow-lg ring-2 ring-primary-500 ring-offset-1'
          : 'border-gray-200 shadow-sm'
      )}
    >
      {pkg.popular && (
        <div className="mb-3">
          <Badge variant="warning">Paling Populer (Rekomendasi)</Badge>
        </div>
      )}

      <div className="mb-1">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{pkg.kategori}</span>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-3">{pkg.nama}</h3>

      <div className="mb-1">
        {pkg.hargaCoret && (
          <div className="text-sm text-gray-400 line-through">{formatRupiah(pkg.hargaCoret)}</div>
        )}
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-primary-700">{formatRupiah(pkg.harga)}</span>
        </div>
        <div className="text-xs text-gray-400 mt-0.5">{pkg.satuan}</div>
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

      <Button
        fullWidth
        variant={pkg.ctaVariant === 'primary' ? 'primary' : 'outline'}
        onClick={onSelect}
      >
        {pkg.ctaLabel}
      </Button>
    </div>
  );
}
