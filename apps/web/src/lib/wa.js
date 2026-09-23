/**
 * Generate WhatsApp link
 * @param {string} number - phone number without +, e.g. "6281200000000"
 * @param {string} text - pre-filled message
 */
export function waLink(number, text) {
  const base = `https://wa.me/${number}`;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

/**
 * Generate WA support link for an order
 */
export function waSupportLink(supportWa, orderRef) {
  const msg = orderRef
    ? `Halo, saya ingin bertanya tentang pesanan saya dengan nomor referensi ${orderRef}.`
    : `Halo, saya membutuhkan bantuan dari tim Digital Workspace Architect.`;
  return waLink(supportWa, msg);
}
