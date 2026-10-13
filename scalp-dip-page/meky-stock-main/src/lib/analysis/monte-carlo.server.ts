import type { Candle } from "@/lib/market-data/types";

export type MonteCarloProjection = {
  expected_pct: number;
  prob_profit: number; // 0..100
  ci_low_pct: number; // 10th percentile
  ci_high_pct: number; // 90th percentile
  prob_hit_target: number; // 0..100
  prob_hit_stop: number; // 0..100
  description_ar: string;
};

/**
 * Run a Monte Carlo simulation on recent daily returns to estimate the
 * probability distribution of returns over `horizonDays`.
 * Returns null if there isn't enough history.
 */
export function monteCarloProject(params: {
  candles?: Candle[];
  currentPrice: number;
  target: number;
  stopLoss: number;
  horizonDays: number;
  simulations?: number;
}): MonteCarloProjection | null {
  const { candles, currentPrice, target, stopLoss, horizonDays } = params;
  const sims = params.simulations ?? 2000;
  if (!candles || candles.length < 30 || currentPrice <= 0) return null;

  // Compute log returns from last 60 days for a robust distribution
  const tail = candles.slice(-60);
  const returns: number[] = [];
  for (let i = 1; i < tail.length; i++) {
    if (tail[i - 1].close > 0 && tail[i].close > 0) {
      returns.push(Math.log(tail[i].close / tail[i - 1].close));
    }
  }
  if (returns.length < 20) return null;

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
  const stdev = Math.sqrt(variance);

  // Run simulations
  const finalReturns: number[] = [];
  let hitTarget = 0;
  let hitStop = 0;
  let profitable = 0;

  for (let s = 0; s < sims; s++) {
    let price = currentPrice;
    let hadTarget = false;
    let hadStop = false;
    for (let d = 0; d < horizonDays; d++) {
      const z = boxMuller();
      const dailyReturn = mean + stdev * z;
      price *= Math.exp(dailyReturn);
      if (!hadTarget && target > 0 && price >= target) hadTarget = true;
      if (!hadStop && stopLoss > 0 && price <= stopLoss) hadStop = true;
    }
    const pct = ((price - currentPrice) / currentPrice) * 100;
    finalReturns.push(pct);
    if (pct > 0) profitable++;
    if (hadTarget) hitTarget++;
    if (hadStop) hitStop++;
  }

  finalReturns.sort((a, b) => a - b);
  const expected = finalReturns.reduce((a, b) => a + b, 0) / finalReturns.length;
  const p10 = finalReturns[Math.floor(sims * 0.1)];
  const p90 = finalReturns[Math.floor(sims * 0.9)];

  return {
    expected_pct: +expected.toFixed(2),
    prob_profit: +((profitable / sims) * 100).toFixed(1),
    ci_low_pct: +p10.toFixed(2),
    ci_high_pct: +p90.toFixed(2),
    prob_hit_target: +((hitTarget / sims) * 100).toFixed(1),
    prob_hit_stop: +((hitStop / sims) * 100).toFixed(1),
    description_ar: `احتمال الربح ${((profitable / sims) * 100).toFixed(0)}% • المدى المتوقع بين ${p10.toFixed(1)}% و ${p90.toFixed(1)}%`,
  };
}

function boxMuller(): number {
  // Standard normal random via Box-Muller
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}