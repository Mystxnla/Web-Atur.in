import { Clock, Brain, Moon, FolderOpen } from 'lucide-react';

export const PROBLEMS = [
  {
    icon: Clock,
    color: 'warning',
    title: 'Academic Deadline Clustering',
    description:
      'Tugas menumpuk di waktu yang sama lintas mata kuliah. Tanpa sistem terpusat, anggota saling menunggu dan miskomunikasi.',
  },
  {
    icon: Brain,
    color: 'danger',
    title: 'Burnout & Decision Fatigue',
    description:
      'Terlalu banyak keputusan kecil di obrolan yang panjang menguras energi, bahkan sebelum pekerjaan inti dimulai.',
  },
  {
    icon: Moon,
    color: 'purple',
    title: 'Disrupted Lifestyle & Sleep',
    description:
      'Notifikasi grup tengah malam, revisi mendadak, dan koordinasi tak terstruktur mengacaukan pola tidur dan kesehatan.',
  },
  {
    icon: FolderOpen,
    color: 'primary',
    title: 'Tool Overload & File Tercecer',
    description:
      'Draf revisi tersebar di Google Drive, WhatsApp, dan email. Tidak ada yang tahu mana versi terbaru.',
  },
];
