// What-if scenario simulator
export type Scenario = {
  name: string;
  marketShockPct: number;
  expectedPortfolioImpactPct: number;
  picksLikelyToTriggerStop: number;
  worstCasePick: { symbol: string; expectedLossPct: number } | null;
};

export function simulateScenarios(
  picks: { symbol: string; entryPrice: number; stopLoss: number; beta?: number }[]
): Scenario[] {
  const scenarios: { name: string; shock: number }[] = [
    { name: 'سوق ينزل 5%', shock: -0.05 },
    { name: 'سوق ينزل 10%', shock: -0.10 },
    { name: 'سوق ينزل 15%', shock: -0.15 },
    { name: 'سوق يصعد 5%', shock: 0.05 },
    { name: 'سوق يصعد 10%', shock: 0.10 }
  ];
  return scenarios.map(sc => {
    let totalImpact = 0; let triggers = 0;
    let worst: Scenario['worstCasePick'] = null;
    for (const p of picks) {
      const beta = p.beta || 1;
      const expectedMove = sc.shock * beta;
      const newPrice = p.entryPrice * (1 + expectedMove);
      const impactPct = expectedMove * 100;
      totalImpact += impactPct;
      if (sc.shock < 0 && newPrice <= p.stopLoss) triggers++;
      if (!worst || impactPct < worst.expectedLossPct) {
        worst = { symbol: p.symbol, expectedLossPct: +impactPct.toFixed(2) };
      }
    }
    return {
      name: sc.name,
      marketShockPct: sc.shock * 100,
      expectedPortfolioImpactPct: +(totalImpact / picks.length).toFixed(2),
      picksLikelyToTriggerStop: triggers,
      worstCasePick: worst
    };
  });
}
