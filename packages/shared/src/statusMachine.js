import { ORDER_STATUSES } from './constants.js';

export const STATUS_LABELS = {
  [ORDER_STATUSES.MENUNGGU_PEMBAYARAN]: 'Menunggu Pembayaran',
  [ORDER_STATUSES.DIBAYAR]: 'Pembayaran Diterima',
  [ORDER_STATUSES.DIVERIFIKASI]: 'Diverifikasi',
  [ORDER_STATUSES.PROSES_SETUP]: 'Proses Setup',
  [ORDER_STATUSES.SELESAI]: 'Selesai',
  [ORDER_STATUSES.KEDALUWARSA]: 'Kedaluwarsa',
};

export const STATUS_DESCRIPTIONS = {
  [ORDER_STATUSES.MENUNGGU_PEMBAYARAN]: 'Menunggu konfirmasi pembayaran dari kamu.',
  [ORDER_STATUSES.DIBAYAR]: 'Pembayaran berhasil diterima.',
  [ORDER_STATUSES.DIVERIFIKASI]: 'Pembayaran telah diverifikasi. Tim kami segera menghubungimu.',
  [ORDER_STATUSES.PROSES_SETUP]: 'Tim arsitek sedang mengerjakan workspace kamu.',
  [ORDER_STATUSES.SELESAI]: 'Workspace sudah selesai dan diserahterimakan.',
  [ORDER_STATUSES.KEDALUWARSA]: 'Batas waktu pembayaran telah habis.',
};

/** Urutan tampil di timeline (tanpa kedaluwarsa) */
export const STATUS_TIMELINE_ORDER = [
  ORDER_STATUSES.MENUNGGU_PEMBAYARAN,
  ORDER_STATUSES.DIBAYAR,
  ORDER_STATUSES.DIVERIFIKASI,
  ORDER_STATUSES.PROSES_SETUP,
  ORDER_STATUSES.SELESAI,
];

export function getStatusIndex(status) {
  return STATUS_TIMELINE_ORDER.indexOf(status);
}

export function isStatusAfter(a, b) {
  return getStatusIndex(a) > getStatusIndex(b);
}
