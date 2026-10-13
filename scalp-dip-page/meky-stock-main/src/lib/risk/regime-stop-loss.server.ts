// Regime-aware stop loss multipliers
export function regimeStopMultiplier(
  regime: 'trending_up' | 'trending_down' | 'ranging' | 'volatile' | 'unknown',
  atr14: number,
  price: number
): { stopDistance: number; atrMultiplier: number } {
  let mult = 2;
  switch (regime) {
    case 'trending_up':
    case 'trending_down': mult = 2.5; break;  // wider in trends to avoid noise
    case 'ranging': mult = 1.5; break;        // tighter in chop
    case 'volatile': mult = 3; break;         // very wide in chaos
    default: mult = 2;
  }
  return { stopDistance: atr14 * mult, atrMultiplier: mult };
}
