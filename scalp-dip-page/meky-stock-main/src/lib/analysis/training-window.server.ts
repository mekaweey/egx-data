/**
 * Rolling training window helpers.
 *
 * Returns ISO date strings for "last N days" windows so meta-learner,
 * GA optimizer, and regime-specific models all train on recent data
 * (prevents concept drift).
 */
export const TRAINING_WINDOW_DAYS = 90;

export function windowStartISO(days: number = TRAINING_WINDOW_DAYS): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

/**
 * Per-symbol weight: same-symbol historical samples count more during
 * training because each Egyptian stock behaves uniquely.
 */
export function symbolWeight(rowSymbol: string, focusSymbol: string | null): number {
  if (!focusSymbol) return 1;
  return rowSymbol === focusSymbol ? 2 : 1;
}