/**
 * Normalize nomor WhatsApp ke format tanpa kode negara.
 * Input: "0812-3456-7890", "+62 812 3456 7890", "6281234567890"
 * Output: "81234567890"
 */
export function normalizePhone(raw) {
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('62')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

/**
 * Format nomor (tanpa kode negara) ke tampilan: +62 812-3456-7890
 */
export function formatPhone(normalized) {
  if (!normalized) return '';
  // insert +62
  const d = normalized;
  if (d.length < 9) return `+62 ${d}`;
  const part1 = d.slice(0, 3);
  const part2 = d.slice(3, 7);
  const part3 = d.slice(7);
  return `+62 ${part1}-${part2}-${part3}`;
}

/**
 * Validate normalized phone: must match ^8[1-9]\d{7,10}$
 */
export function isValidPhone(normalized) {
  return /^8[1-9]\d{7,10}$/.test(normalized);
}
