import { PACKAGE_IDS } from './constants.js';

export const PACKAGES = [
  {
    id: PACKAGE_IDS.TEMPLATE,
    nama: 'Template Siap Pakai',
    kategori: 'Mandiri',
    harga: 10000,
    hargaCoret: null,
    satuan: 'Sekali Bayar',
    badge: null,
    popular: false,
    features: [
      'Template Notion & Trello instan',
      'Video tutorial panduan mandiri',
      'Format deadline tracker standar',
      'Akses file & duplikasi seumur hidup',
    ],
    deliverables: [
      'Template Notion & Trello siap pakai',
      'Video tutorial onboarding mandiri',
      'Deadline tracker standar',
      'Akses file seumur hidup',
    ],
    ctaLabel: 'Pilih Template',
    ctaVariant: 'outline',
  },
  {
    id: PACKAGE_IDS.CUSTOM,
    nama: 'Paket Lengkap: Setup Custom',
    kategori: 'Tugas Besar & Proyek',
    harga: 25000,
    hargaCoret: null,
    satuan: 'Per Kelompok',
    badge: 'Paling Populer',
    popular: true,
    patunganLabel: '-Rp5.000/anak',
    features: [
      'Desain workspace custom sesuai silabus mata kuliah',
      'Setup integrasi Google Calendar & Drive',
      '1x sesi live onboarding',
      'Support WhatsApp 1 bulan penuh',
      'Garansi revisi struktur 1x',
    ],
    deliverables: [
      'Workspace custom sesuai silabus',
      'Integrasi Google Calendar & Drive',
      '1x sesi live onboarding',
      'Support WhatsApp 1 bulan',
      'Garansi revisi struktur 1x',
    ],
    ctaLabel: 'Pesan Paket Lengkap',
    ctaVariant: 'primary',
  },
  {
    id: PACKAGE_IDS.ORGANISASI,
    nama: 'Kepanitiaan & Organisasi',
    kategori: 'Event & UKM',
    harga: 100000,
    hargaCoret: null,
    satuan: 'Per Event',
    badge: null,
    popular: false,
    features: [
      'Multi-divisi (Acara, Dana, Pubdok, Logistik)',
      'Master timeline Gantt chart terintegrasi',
      'Hak akses & permission terstruktur',
      'VIP setup prioritas 24 jam selesai',
    ],
    deliverables: [
      'Setup multi-divisi terstruktur',
      'Gantt chart timeline terintegrasi',
      'Hak akses & permission per divisi',
      'VIP setup prioritas 24 jam',
    ],
    ctaLabel: 'Konsultasi Acara',
    ctaVariant: 'outline',
  },
  {
    id: PACKAGE_IDS.PRO,
    nama: 'Paket Organisasi Pro',
    kategori: 'B2B Setup',
    harga: 499000,
    hargaCoret: 750000,
    satuan: 'Sekali Bayar / Setup',
    badge: 'Pro',
    popular: false,
    proOnly: true,
    features: [
      'Arsitektur Workspace Notion + Google Drive terpadu',
      'Template Manajemen Proyek & Sprint Kanban Agile',
      'Database Dokumentasi Tim & SOP Terotomatisasi',
      'Hak Akses Tim & Pembagian Role-based Security',
      'Sesi Onboarding 60 Menit via Google Meet / Zoom',
      'Garansi Revisi Struktur Ruang Kerja 14 Hari Penuh',
    ],
    deliverables: [
      'Arsitektur Workspace Notion + Google Drive terpadu',
      'Template Manajemen Proyek & Sprint Kanban Agile',
      'Database Dokumentasi Tim & SOP Terotomatisasi',
      'Hak Akses Tim & Role-based Security',
      'Sesi Onboarding 60 Menit via Google Meet / Zoom',
      'Garansi Revisi 14 Hari Penuh',
    ],
    ctaLabel: 'Pesan Paket Pro',
    ctaVariant: 'primary',
  },
];

/**
 * @param {string} packageId
 * @returns {object|undefined}
 */
export function getPackageById(packageId) {
  return PACKAGES.find((p) => p.id === packageId);
}

/**
 * @param {object} pkg
 * @param {{ ppnRate?: number }} options
 * @returns {{ hargaPokok: number, diskon: number, ppn: number, total: number }}
 */
export function computePricing(pkg, { ppnRate = 0.11 } = {}) {
  if (!pkg) return { hargaPokok: 0, diskon: 0, ppn: 0, total: 0 };
  const hargaPokok = pkg.hargaCoret ?? pkg.harga;
  const diskon = hargaPokok - pkg.harga;
  // Untuk prototype: PPN sudah termasuk (ditampilkan Rp 0 / Gratis sebagai insentif promo)
  const ppn = 0;
  const total = pkg.harga + ppn;
  return { hargaPokok, diskon, ppn, total };
}
