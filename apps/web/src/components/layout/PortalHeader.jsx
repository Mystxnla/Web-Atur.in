import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, User } from 'lucide-react';
import Logo from '../ui/Logo.jsx';

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
        <div className="flex items-center gap-2">
          <Logo compact />
          <div className="text-center">
            <div className="text-xs text-gray-500">Digital Workspace</div>
            <div className="text-sm font-bold text-gray-900">Order Lookup</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100" aria-label="Bantuan">
            <HelpCircle size={18} aria-hidden />
          </button>
          <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100" aria-label="Akun">
            <User size={18} aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
