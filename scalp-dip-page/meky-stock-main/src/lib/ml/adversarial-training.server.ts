/**
 * #22 Adversarial Training: توليد سيناريوهات flash crash للتدريب.
 */
export interface AdversarialScenario { name: string; shockPct: number; volumeMultiplier: number }

export function generateAdversarialScenarios(): AdversarialScenario[] {
  return [
    { name: "Flash Crash", shockPct: -15, volumeMultiplier: 5 },
    { name: "Gap Down", shockPct: -8, volumeMultiplier: 3 },
    { name: "Black Swan", shockPct: -25, volumeMultiplier: 10 },
    { name: "Squeeze", shockPct: 12, volumeMultiplier: 4 },
    { name: "Stop Run", shockPct: -5, volumeMultiplier: 2 },
  ];
}

export function augmentWithAdversarial<T extends { close: number; volume: number }>(
  candles: T[],
  scenario: AdversarialScenario,
): T[] {
  return candles.map((c, i) => i === candles.length - 1 ? {
    ...c,
    close: c.close * (1 + scenario.shockPct / 100),
    volume: c.volume * scenario.volumeMultiplier,
  } : c);
}