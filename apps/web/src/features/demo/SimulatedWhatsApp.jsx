import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function SimulatedWhatsApp({ title, body, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed top-4 right-4 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-top-2 duration-300"
      role="alert"
      aria-live="polite"
    >
      {/* WA-style header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-green-600">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="white" aria-hidden="true">
            <path d="M8 0C3.6 0 0 3.6 0 8c0 1.4.4 2.8 1 4L0 16l4.1-1.1C5.3 15.6 6.6 16 8 16c4.4 0 8-3.6 8-8s-3.6-8-8-8zm3.9 11.5c-.2.5-.9.9-1.5 1-.4.1-.9.1-1.3-.1-.3-.1-.7-.2-1.1-.4-2-.8-3.3-2.8-3.4-2.9-.1-.2-.8-1-.8-1.9s.5-1.4.7-1.6c.2-.2.4-.2.5-.2h.4c.1 0 .3 0 .4.3.2.4.6 1.4.6 1.5.1.1.1.3 0 .4-.1.1-.1.2-.2.3l-.3.3c-.1.1-.2.2-.1.4.1.2.6 1 1.3 1.7.9.8 1.7 1.1 1.9 1.2.2.1.3 0 .4-.1l.5-.6c.1-.2.3-.2.5-.1.2.1 1.2.6 1.4.7.2.1.3.1.4.2.1.1.1.5-.1 1z"/>
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-xs text-white/70">Notifikasi WhatsApp (Simulasi)</div>
          <div className="text-sm font-bold text-white">Digital Workspace Architect</div>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white p-1" aria-label="Tutup notifikasi">
          <X size={14} aria-hidden />
        </button>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm font-semibold text-gray-800 mb-1">{title}</p>
        <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
        <p className="text-xs text-gray-400 mt-2 italic">Demo — bukan pesan WhatsApp asli</p>
      </div>
    </div>
  );
}
