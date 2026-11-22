import { PACKAGE_IDS, BILLING_CYCLES, FREE_TRIAL_DAYS } from './constants.js';

export const PACKAGES = [
  {
    id: PACKAGE_IDS.TEMPLATE,
    nama: 'Template Siap Pakai',
    kategori: 'Mandiri',
    harga: 10000,
    hargaBulanan: 10000,
    hargaSemester: 48000, // Hemat 20% dari 60.000
    hargaCoret: null,
    hargaCoretSemester: 60000,
    satuan: 'Per Bulan / Tim',
    satuanSemester: 'Per Semester (6 Bulan)',
    hasTrial: false,
    trialDays: 0,
    trialBadge: null,
    badge: null,
    popular: false,
    features: [
      'Template Notion & Trello instan',
      'Video tutorial panduan mandiri',
      'Format deadline tracker standar',
      'Update template & sinkronisasi berkala',
    ],
    deliverables: [
      'Template Notion & Trello siap pakai',
      'Video tutorial onboarding mandiri',
      'Deadline tracker standar',
      'Akses penuh selama berlangganan',
    ],
    ctaLabel: 'Pilih Template',
    ctaVariant: 'outline',
  },
  {
    id: PACKAGE_IDS.CUSTOM,
    nama: 'Paket Lengkap: Setup Custom',
    kategori: 'Tugas Besar & Proyek',
    harga: 25000,
    hargaBulanan: 25000,
    hargaSemester: 120000, // Hemat 20% dari 150.000
    hargaCoret: null,
    hargaCoretSemester: 150000,
    satuan: 'Per Bulan / Kelompok',
    satuanSemester: 'Per Semester (6 Bulan)',
    hasTrial: true,
    trialDays: FREE_TRIAL_DAYS,
    trialBadge: 'Gratis Trial 7 Hari',
    badge: 'Paling Populer',
    popular: true,
    patunganLabel: 'Patungan ~Rp5.000/anak per bulan',
    features: [
      'Gratis uji coba 7 hari pertama (Rp 0)',
      'Desain workspace custom sesuai silabus mata kuliah',
      'Setup integrasi Google Calendar & Drive',
      '1x sesi live onboarding',
      'Support & maintenance WhatsApp aktif',
      'Garansi revisi struktur kapan saja',
    ],
    deliverables: [
      'Workspace custom sesuai silabus',
      'Integrasi Google Calendar & Drive',
      '1x sesi live onboarding',
      'Support WhatsApp selama berlangganan',
      'Garansi revisi struktur',
    ],
    ctaLabel: 'Mulai Free Trial 7 Hari',
    ctaVariant: 'primary',
  },
  {
    id: PACKAGE_IDS.ORGANISASI,
    nama: 'Kepanitiaan & Organisasi',
    kategori: 'Event & UKM',
    harga: 100000,
    hargaBulanan: 100000,
    hargaSemester: 480000, // Hemat 20% dari 600.000
    hargaCoret: null,
    hargaCoretSemester: 600000,
    satuan: 'Per Bulan / Organisasi',
    satuanSemester: 'Per Semester (6 Bulan)',
    hasTrial: false,
    trialDays: 0,
    trialBadge: null,
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
    hargaBulanan: 499000,
    hargaSemester: 2390000,
    hargaCoret: 750000,
    hargaCoretSemester: 3600000,
    satuan: 'Per Bulan / Organisasi',
    satuanSemester: 'Per Semester (6 Bulan)',
    hasTrial: false,
    trialDays: 0,
    trialBadge: null,
    badge: 'Pro',
    popular: false,
    proOnly: true,
    features: [
      'Arsitektur Workspace Notion + Google Drive terpadu',
      'Template Manajemen Proyek & Sprint Kanban Agile',
      'Database Dokumentasi Tim & SOP Terotomatisasi',
      'Hak Akses Tim & Pembagian Role-based Security',
      'Sesi Onboarding 60 Menit via Google Meet / Zoom',
      'Garansi Revisi & Maintenance Struktur Penuh',
    ],
    deliverables: [
      'Arsitektur Workspace Notion + Google Drive terpadu',
      'Template Manajemen Proyek & Sprint Kanban Agile',
      'Database Dokumentasi Tim & SOP Terotomatisasi',
      'Hak Akses Tim & Role-based Security',
      'Sesi Onboarding 60 Menit via Google Meet / Zoom',
      'Garansi Revisi & Maintenance Penuh',
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
 * @param {{ billingCycle?: 'monthly' | 'semester', isTrial?: boolean, ppnRate?: number }} options
 * @returns {{ hargaPokok: number, diskon: number, ppn: number, recurringTotal: number, total: number, cycleLabel: string, trialDays: number, hasTrial: boolean }}
 */
export function computePricing(
  pkg,
  { billingCycle = BILLING_CYCLES.MONTHLY, isTrial = false } = {}
) {
  if (!pkg) {
    return {
      hargaPokok: 0,
      diskon: 0,
      ppn: 0,
      recurringTotal: 0,
      total: 0,
      cycleLabel: 'Per Bulan',
      trialDays: 0,
      hasTrial: false,
    };
  }

  const isSemester = billingCycle === BILLING_CYCLES.SEMESTER;
  const hargaAktif = isSemester
    ? (pkg.hargaSemester ?? pkg.harga * 6 * 0.8)
    : (pkg.hargaBulanan ?? pkg.harga);
  const hargaPokok = isSemester
    ? (pkg.hargaCoretSemester ?? (pkg.hargaBulanan ?? pkg.harga) * 6)
    : (pkg.hargaCoret ?? hargaAktif);

  const diskon = Math.max(0, hargaPokok - hargaAktif);
  const ppn = 0; // PPN termasuk dalam promo
  const recurringTotal = hargaAktif + ppn;
  const effectiveTrial = Boolean(isTrial && pkg.hasTrial);
  const total = effectiveTrial ? 0 : recurringTotal;
  const cycleLabel = isSemester ? 'Per Semester (6 Bulan)' : 'Per Bulan';

  return {
    hargaPokok,
    diskon,
    ppn,
    recurringTotal,
    total,
    cycleLabel,
    trialDays: pkg.hasTrial ? (pkg.trialDays ?? FREE_TRIAL_DAYS) : 0,
    hasTrial: Boolean(pkg.hasTrial),
  };
}
