/**
 * "#DWA-2026-0819" -> "DWA-2026-0819" (for URL/route param)
 */
export function toRouteId(ref) {
  if (!ref) return '';
  return ref.replace(/^#/, '');
}

/**
 * "DWA-2026-0819" -> "#DWA-2026-0819" (for display)
 */
export function toDisplayRef(id) {
  if (!id) return '';
  return id.startsWith('#') ? id : `#${id}`;
}

/**
 * Validate order ref format (with or without #)
 */
export function isValidOrderRef(input) {
  return /^#?DWA-\d{4}-\d{4}$/i.test(input?.trim() ?? '');
}
