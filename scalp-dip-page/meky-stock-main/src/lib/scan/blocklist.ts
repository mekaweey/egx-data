/**
 * Symbols permanently excluded from any recommendation, daily pick, or
 * auto-replacement. Add a symbol here to ban it across the whole system.
 */
export const BLOCKED_SYMBOLS: ReadonlySet<string> = new Set([
]);

export function isBlocked(symbol: string | null | undefined): boolean {
  return !!symbol && BLOCKED_SYMBOLS.has(symbol.toUpperCase());
}