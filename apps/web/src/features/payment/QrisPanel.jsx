import { QRCodeSVG } from 'qrcode.react';
import Button from '../../components/ui/Button.jsx';
import { Download } from 'lucide-react';

export default function QrisPanel({ payment }) {
  const qrPayload = payment?.qrPayload ?? payment?.qr_payload;
  if (!qrPayload) return null;

  const handleDownload = () => {
    const svg = document.getElementById('qr-svg');
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qris-${payment.orderId}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="relative">
        <QRCodeSVG
          id="qr-svg"
          value={qrPayload}
          size={200}
          level="M"
          includeMargin
        />
        {/* Demo watermark */}
        <div className="absolute inset-0 flex items-end justify-center pb-2 pointer-events-none" aria-hidden>
          <span className="bg-white/80 text-gray-400 text-xs font-bold px-2 py-0.5 rounded">DEMO</span>
        </div>
      </div>
      <p className="text-sm text-gray-500 text-center">Dukungan Semua Aplikasi Pembayaran QR</p>
      <Button variant="outline" size="sm" onClick={handleDownload}>
        <Download size={14} aria-hidden />
        Unduh QR Code
      </Button>
    </div>
  );
}
