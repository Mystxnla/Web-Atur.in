import { ShieldCheck, MessageCircle, Zap } from 'lucide-react';

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Data Aman & Rahasia (Enkripsi 256-bit)',
    desc: 'Kerahasiaan dokumen dan alur kerja tim Anda terproteksi standar enterprise.',
  },
  {
    icon: MessageCircle,
    title: 'Bisa Konsultasi Sebelum Bayar',
    desc: 'Masih ragu susunan tool yang dibutuhkan? Diskusikan langsung dengan workspace architect via WhatsApp.',
  },
  {
    icon: Zap,
    title: 'Tanya Arsitek via WhatsApp (Fast Response 10 Menit)',
    desc: 'Tim kami siap menjawab pertanyaan teknis seputar setup workspace.',
  },
];

export default function TrustStrip() {
  return (
    <div className="space-y-3">
      {TRUST_ITEMS.map((item) => (
        <div key={item.title} className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 p-3.5">
          <div className="w-8 h-8 bg-success-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <item.icon size={16} className="text-success-600" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">{item.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
