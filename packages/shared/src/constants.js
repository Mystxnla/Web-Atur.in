export const ORDER_STATUSES = {
  MENUNGGU_PEMBAYARAN: 'menunggu_pembayaran',
  DIBAYAR: 'dibayar',
  DIVERIFIKASI: 'diverifikasi',
  PROSES_SETUP: 'proses_setup',
  SELESAI: 'selesai',
  KEDALUWARSA: 'kedaluwarsa',
};

export const PAYMENT_METHODS = {
  QRIS: 'qris',
  VA: 'va',
  EWALLET: 'ewallet',
};

export const PACKAGE_IDS = {
  TEMPLATE: 'template',
  CUSTOM: 'custom',
  ORGANISASI: 'organisasi',
  PRO: 'pro',
};

export const BILLING_CYCLES = {
  MONTHLY: 'monthly',
  SEMESTER: 'semester',
};

export const FREE_TRIAL_DAYS = 7;

export const JENIS_KEBUTUHAN_OPTIONS = [
  { value: 'tugas_kelompok', label: 'Tugas Kelompok Kuliah' },
  { value: 'kepanitiaan', label: 'Kepanitiaan Acara' },
  { value: 'organisasi', label: 'Organisasi / Perusahaan Rintisan' },
  { value: 'studi_riset', label: 'Kelompok Studi & Riset' },
  { value: 'lainnya', label: 'Lainnya' },
];

export const JUMLAH_ANGGOTA_OPTIONS = [
  { value: '1-5', label: '1–5 Orang' },
  { value: '6-15', label: '6–15 Orang' },
  { value: '16-30', label: '16–30 Orang' },
  { value: '30+', label: '30+ Orang' },
];

export const PAYMENT_TIMER_SECONDS = 15 * 60; // 15 menit

export const OTP_TIMER_SECONDS = 5 * 60; // 5 menit
