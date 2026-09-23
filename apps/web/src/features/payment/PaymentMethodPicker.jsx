import { PAYMENT_METHODS } from '@atur-in/shared';
import { QrCode, Building2, Wallet } from 'lucide-react';
import { cn } from '../../lib/cn.js';

const METHODS = [
  {
    value: PAYMENT_METHODS.QRIS,
    label: 'QRIS Otomatis',
    badge: 'Otomatis',
    badgeColor: 'bg-success-100 text-success-700',
    icon: QrCode,
    sublabel: 'BCA, Mandiri, GoPay, OVO, ShopeePay, Dana, dll',
    tags: ['QRIS', 'GoPay', 'OVO', 'DANA', 'ShopeePay', 'BCA Mobile'],
  },
  {
    value: PAYMENT_METHODS.VA,
    label: 'Virtual Account / Transfer Bank',
    icon: Building2,
    sublabel: 'BCA, Mandiri, BNI, BRI, Permata',
  },
  {
    value: PAYMENT_METHODS.EWALLET,
    label: 'E-Wallet Langsung',
    icon: Wallet,
    sublabel: 'GoPay, OVO, DANA, ShopeePay',
  },
];

export default function PaymentMethodPicker({ value, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-800">Pilih Metode Pembayaran</h2>
        <span className="text-xs text-success-600 font-semibold">Verifikasi Instan</span>
      </div>

      <div className="space-y-2" role="radiogroup" aria-label="Metode pembayaran">
        {METHODS.map((m) => {
          const selected = value === m.value;
          return (
            <label
              key={m.value}
              className={cn(
                'flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-colors',
                selected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={m.value}
                checked={selected}
                onChange={() => onChange(m.value)}
                className="mt-1 accent-primary-600"
              />
              <m.icon size={20} className={cn('mt-0.5 flex-shrink-0', selected ? 'text-primary-600' : 'text-gray-400')} aria-hidden />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-800">{m.label}</span>
                  {m.badge && (
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold', m.badgeColor)}>
                      {m.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{m.sublabel}</p>
                {selected && m.tags && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {m.tags.map((t) => (
                      <span key={t} className="text-xs px-2 py-0.5 bg-white border border-gray-200 rounded-lg text-gray-600">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
