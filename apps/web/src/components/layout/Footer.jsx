import { Link } from 'react-router-dom';
import Logo from '../ui/Logo.jsx';
import { SITE } from '../../config/site.js';
import { waLink } from '../../lib/wa.js';
import { MessageCircle, Mail, Instagram } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Masalah', href: '#masalah' },
  { label: 'Solusi', href: '#solusi' },
  { label: 'Cara Kerja', href: '#cara-kerja' },
  { label: 'Harga', href: '#harga' },
  { label: 'Order', href: '#order' },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="mb-3">
              <Logo dark />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">{SITE.tagline}</p>
            <a
              href={waLink(SITE.supportWa, 'Halo, saya ingin konsultasi workspace digital.')}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-success-600 text-white text-sm font-semibold rounded-lg hover:bg-success-700 transition-colors"
            >
              <MessageCircle size={16} aria-hidden />
              WhatsApp Support
            </a>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Navigasi</h3>
            <ul className="space-y-2">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <Link to="/lacak-pesanan" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Lacak Pesanan
                </Link>
              </li>
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Kontak & Info</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <MessageCircle size={14} aria-hidden />
                <span>{SITE.supportPhone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} aria-hidden />
                <a href={`mailto:${SITE.supportEmail}`} className="hover:text-white transition-colors">
                  {SITE.supportEmail}
                </a>
              </li>
              <li className="text-xs">Aktif setiap {SITE.operationalHours}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <span>&copy; {new Date().getFullYear()} Digital Workspace Architect. Hak cipta dilindungi.</span>
          <span>Dibuat oleh mahasiswa Sistem Informasi UNNES</span>
        </div>
      </div>
    </footer>
  );
}
