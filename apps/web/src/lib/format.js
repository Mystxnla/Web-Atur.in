import { format } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Format angka ke Rupiah: Rp 499.000
 */
export function formatRupiah(n) {
  return (
    'Rp\u00a0' +
    new Intl.NumberFormat('id-ID').format(n)
  );
}

/**
 * Format tanggal ke: 24 Okt 2025, 14:32 WIB
 */
export function formatTanggalWIB(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return (
      format(d, "d MMM yyyy, HH:mm", { locale: id }) + ' WIB'
    );
  } catch {
    return String(dateStr);
  }
}

/**
 * Format durasi detik ke MM:SS
 */
export function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
