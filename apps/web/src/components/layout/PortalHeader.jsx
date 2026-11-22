import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, User } from 'lucide-react';
import Logo from '../ui/Logo.jsx';
import { waSupportLink } from '../../lib/wa.js';
import { SITE } from '../../config/site.js';

export default function PortalHeader() {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft size={20} aria-hidden />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <Logo compact />
          <div className="text-center">
            <div className="text-xs text-gray-500">Digital Workspace</div>
            <div className="text-sm font-bold text-gray-900">Order Lookup</div>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <a
            href={waSupportLink(SITE.supportWa)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Bantuan WhatsApp"
          >
            <HelpCircle size={18} aria-hidden />
          </a>
          <Link
            to="/lacak-pesanan"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Portal Pelanggan"
          >
            <User size={18} aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}
