import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import Logo from '../ui/Logo.jsx';
import { cn } from '../../lib/cn.js';

const NAV_LINKS = [
  { label: 'Masalah', href: '#masalah' },
  { label: 'Solusi', href: '#solusi' },
  { label: 'Cara Kerja', href: '#cara-kerja' },
  { label: 'Harga', href: '#harga' },
  { label: 'Order', href: '#order' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-40 transition-shadow duration-200',
        scrolled ? 'bg-white shadow-sm' : 'bg-white/90 backdrop-blur'
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Menu utama">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/lacak-pesanan"
            className="hidden md:flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary-600"
            aria-label="Lacak pesanan"
          >
            <User size={16} aria-hidden />
            <span>Pesanan</span>
          </Link>
          <a
            href="#harga"
            className="hidden md:inline-flex px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"
          >
            Pesan Sekarang
          </a>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-3">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="py-2 text-base font-medium text-gray-700 hover:text-primary-600"
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/lacak-pesanan"
            onClick={() => setMenuOpen(false)}
            className="py-2 text-base font-medium text-gray-700"
          >
            Lacak Pesanan
          </Link>
          <a
            href="#harga"
            onClick={() => setMenuOpen(false)}
            className="mt-2 w-full text-center px-4 py-3 bg-primary-600 text-white font-semibold rounded-lg"
          >
            Pesan Sekarang
          </a>
        </div>
      )}
    </header>
  );
}
