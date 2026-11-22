import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import Logo from '../ui/Logo.jsx';
import { waSupportLink } from '../../lib/wa.js';
import { SITE } from '../../config/site.js';

export default function PortalHeader() {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-2 py-1.5 -ml-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors flex items-center gap-1.5"
          aria-label="Kembali ke beranda"
        >
          <ArrowLeft size={16} aria-hidden />
          <span>Beranda</span>
        </button>

        <Link to="/" className="flex items-center gap-2">
          <Logo compact />
          <div className="text-left leading-tight">
            <div className="text-xs font-semibold text-gray-900">Portal Workspace</div>
            <div className="text-[11px] text-gray-500">Atur.in</div>
          </div>
        </Link>

        <a
          href={waSupportLink(SITE.supportWa)}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors flex items-center gap-1"
          aria-label="Bantuan WhatsApp"
        >
          <HelpCircle size={15} aria-hidden />
          <span className="hidden sm:inline">Bantuan</span>
        </a>
      </div>
    </header>
  );
}
