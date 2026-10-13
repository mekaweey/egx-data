/**
 * Stress Testing: replay historical crisis scenarios on current portfolio.
 */

export interface StressScenario {
  name: string;
  description: string;
  shocks: Record<string, number>; // asset/factor -> return shock
  durationDays: number;
}

export const HISTORICAL_SCENARIOS: StressScenario[] = [
  {
    name: "2008_financial_crisis",
    description: "Lehman collapse, equity -40%, credit spreads +800bp",
    shocks: { equity: -0.4, bonds: 0.08, gold: 0.05, oil: -0.6, vix: 2.5 },
    durationDays: 180,
  },
  {
    name: "2020_covid_crash",
    description: "March 2020 lockdown, equity -34% in 33 days",
    shocks: { equity: -0.34, bonds: 0.04, gold: 0.1, oil: -0.7, vix: 4.0 },
    durationDays: 33,
  },
  {
    name: "2022_inflation_shock",
    description: "Fed hiking, bonds -15%, growth equity -30%",
    shocks: { equity: -0.2, bonds: -0.15, gold: -0.05, oil: 0.3, vix: 1.5 },
    durationDays: 270,
  },
  {
    name: "flash_crash_2010",
    description: "Intraday -9% then recovery",
    shocks: { equity: -0.09, bonds: 0.01, gold: 0.02, oil: -0.05, vix: 3.0 },
    durationDays: 1,
  },
  {
    name: "dotcom_2000",
    description: "Nasdaq -78% over 2 years, value rotation",
    shocks: { equity: -0.5, bonds: 0.15, gold: 0.3, oil: 0.2, vix: 1.8 },
    durationDays: 730,
  },
];

export interface StressResult {
  scenario: string;
  portfolioLoss: number;
  worstAsset: string;
  drawdownPct: number;
  survives: boolean;
}

export function stressTestPortfolio(
  portfolio: Record<string, { weight: number; exposure: number }>,
  scenario: StressScenario,
  maxAcceptableDrawdown: number = 0.25,
): StressResult {
  let totalLoss = 0;
  let worstAsset = "";
  let worstLoss = 0;

  for (const [asset, { weight, exposure }] of Object.entries(portfolio)) {
    const shock = scenario.shocks[asset] ?? scenario.shocks.equity ?? 0;
    const assetLoss = weight * exposure * shock;
    totalLoss += assetLoss;
    if (assetLoss < worstLoss) {
      worstLoss = assetLoss;
      worstAsset = asset;
    }
  }

  const drawdown = Math.abs(Math.min(0, totalLoss));
  return {
    scenario: scenario.name,
    portfolioLoss: totalLoss,
    worstAsset,
    drawdownPct: drawdown,
    survives: drawdown <= maxAcceptableDrawdown,
  };
}

export function runAllStressTests(
  portfolio: Record<string, { weight: number; exposure: number }>,
): StressResult[] {
  return HISTORICAL_SCENARIOS.map((s) => stressTestPortfolio(portfolio, s));
}