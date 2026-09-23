import { LayoutGrid, Zap, CalendarSync, GraduationCap } from 'lucide-react';

export const SOLUTIONS = [
  {
    icon: LayoutGrid,
    color: 'primary',
    badge: 'Core',
    badgeVariant: 'primary',
    title: 'Desain Workspace Terpusat',
    description:
      'Satu tempat untuk semua: tugas, dokumen, jadwal, dan status proyek. Tidak perlu buka banyak aplikasi.',
  },
  {
    icon: Zap,
    color: 'warning',
    badge: 'Instant',
    badgeVariant: 'warning',
    title: 'Template Siap Pakai',
    description:
      'Template Notion & Trello yang sudah disesuaikan untuk kelompok mahasiswa. Setup dalam hitungan menit.',
  },
  {
    icon: CalendarSync,
    color: 'success',
    badge: 'Sync',
    badgeVariant: 'success',
    title: 'Otomatisasi & Integrasi Kalender',
    description:
      'Deadline otomatis masuk ke Google Calendar seluruh anggota. Tidak ada yang ketinggalan jadwal penting.',
  },
  {
    icon: GraduationCap,
    color: 'purple',
    badge: '1-on-1',
    badgeVariant: 'purple',
    title: 'Onboarding & Ramah Pemula',
    description:
      'Sesi onboarding langsung bersama arsitek sampai tim kamu benar-benar paham cara menggunakan workspace-nya.',
  },
];
