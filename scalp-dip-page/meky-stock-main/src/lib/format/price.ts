/**
 * Format a price for display.
 * Penny stocks (< 1 EGP) need 4 decimals so 0.187 / 0.189 / 0.186 don't all
 * collapse to "0.19" on screen. Normal-priced stocks keep 2 decimals.
 */
export function fmtPrice(p: number | string | null | undefined): string {
  const n = Number(p);
  if (!isFinite(n)) return "—";
  return Math.abs(n) < 1 ? n.toFixed(4) : n.toFixed(2);
}