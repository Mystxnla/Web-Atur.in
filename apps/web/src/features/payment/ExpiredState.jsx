import Button from '../../components/ui/Button.jsx';
import { AlertCircle } from 'lucide-react';

export default function ExpiredState({ onRenew }) {
  return (
    <div className="bg-warning-50 border border-warning-200 rounded-2xl p-6 text-center space-y-4">
      <div className="w-14 h-14 bg-warning-100 rounded-full flex items-center justify-center mx-auto">
        <AlertCircle size={28} className="text-warning-600" aria-hidden />
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Batas Waktu Pembayaran Habis</h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          Tagihan ini sudah kedaluwarsa. Kamu bisa membuat tagihan baru untuk melanjutkan pembayaran.
        </p>
      </div>
      <Button variant="primary" onClick={onRenew}>
        Buat Tagihan Baru
      </Button>
    </div>
  );
}
