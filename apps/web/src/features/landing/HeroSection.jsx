import { useNavigate } from 'react-router-dom';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import KanbanPreview from './KanbanPreview.jsx';
import { MessageSquareOff } from 'lucide-react';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="bg-white py-16 md:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left: copy */}
        <div>
          <Badge variant="primary" className="mb-5">
            <MessageSquareOff size={12} aria-hidden />
            Berhenti Tenggelam di Ribuan Chat WhatsApp
          </Badge>

          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
            Ubah Koordinasi Kelompok yang Kacau Menjadi Workspace Digital yang Rapi &amp; Terpusat
          </h1>

          <p className="text-lg text-gray-500 leading-relaxed mb-8">
            Kami merancangkan ruang kerja digital untuk kelompok mahasiswa, kepanitiaan, dan organisasi supaya koordinasi tugas tidak lagi bergantung pada WhatsApp Group yang penuh drama.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Button size="lg" onClick={() => document.getElementById('harga')?.scrollIntoView({ behavior: 'smooth' })}>
              Mulai Setup Workspace
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById('cara-kerja')?.scrollIntoView({ behavior: 'smooth' })}>
              Lihat Cara Kerja
            </Button>
          </div>

          <p className="text-sm text-gray-400">
            Setup beres 24 sampai 48 jam <span className="mx-1">|</span> Bimbingan sampai paham
          </p>
        </div>

        {/* Right: Kanban preview */}
        <div className="hidden md:block">
          <KanbanPreview />
        </div>
      </div>
    </section>
  );
}
