/**
 * Tier-I Intelligence — production-grade enhancements on top of Tier A-H.
 * ---------------------------------------------------------------------
 * Self-contained, fail-open, no external deps.
 *   I.1 Kelly Criterion position sizing (capped fractional Kelly)
 *   I.2 Portfolio-level correlation guard (sector & symbol clustering)
 *   I.3 Slippage & liquidity model (EGX-tuned)
 *   I.4 Order-flow proxy (volume delta + close location value from OHLCV)
 *   I.5 Sector rotation momentum (cross-sector relative strength)
 */

/* ------------------------------------------------------------------ */
/* I.1 Kelly Criterion                                                 */
/* ------------------------------------------------------------------ */
export interface KellyInput {
  /** Win probability 0..1 (e.g. from calibrated confidence/100). */
  p: number;
  /** Average win % (e.g. 0.05 = +5%). */
  avgWin: number;
  /** Average loss % positive number (e.g. 0.025 = 2.5%). */
  avgLoss: number;
  /** Fractional Kelly multiplier (0.25 = quarter-Kelly, safer). */
  fraction?: number;
  /** Hard cap on position size (default 10%). */
  cap?: number;
}
/** Returns position size as fraction of equity (0..cap). */
export function kellySize(input: KellyInput): number {
  const { p, avgWin, avgLoss } = input;
  const fraction = input.fraction ?? 0.25;
  const cap = input.cap ?? 0.10;
  if (!(p > 0 && p < 1) || avgWin <= 0 || avgLoss <= 0) return 0;
  const b = avgWin / avgLoss; // payoff ratio
  const q = 1 - p;
  const kelly = (b * p - q) / b;
  if (!Number.isFinite(kelly) || kelly <= 0) return 0;
  return Math.max(0, Math.min(cap, kelly * fraction));
}

/* ------------------------------------------------------------------ */
/* I.2 Portfolio correlation guard                                     */
/* ------------------------------------------------------------------ */
interface PortfolioPick { symbol: string; sector?: string | null; confidence: number; }
/** Penalize confidence when many existing picks share the same sector. */
export function portfolioCorrelationPenalty(
  candidate: { sector?: string | null },
  existing: PortfolioPick[],
  maxPerSector = 2,
): number {
  if (!candidate.sector || existing.length === 0) return 1.0;
  const sameSector = existing.filter((p) => p.sector === candidate.sector).length;
  if (sameSector < maxPerSector) return 1.0;
  // Each extra same-sector pick reduces confidence by 8%.
  const excess = sameSector - maxPerSector + 1;
  return Math.max(0.6, 1 - 0.08 * excess);
}

/* ------------------------------------------------------------------ */
/* I.3 Slippage & liquidity model (EGX-tuned)                          */
/* ------------------------------------------------------------------ */
export interface SlippageInput {
  /** Order size in EGP. */
  orderValue: number;
  /** 20-day average daily turnover in EGP. */
  avgDailyValue: number;
  /** Recent ATR % of price (e.g. 0.02 = 2%). */
  atrPct: number;
}
/** Returns expected slippage as a fraction of price (e.g. 0.003 = 0.3%). */
export function estimateSlippage(input: SlippageInput): number {
  const { orderValue, avgDailyValue, atrPct } = input;
  if (avgDailyValue <= 0) return 0.01; // unknown liquidity -> assume 1%
  const participation = Math.min(0.5, orderValue / avgDailyValue);
  // Square-root impact model + volatility component.
  const impact = 0.1 * Math.sqrt(participation) * Math.max(0.005, atrPct);
  return Math.min(0.05, impact); // cap at 5%
}

/* ------------------------------------------------------------------ */
/* I.4 Order-flow proxy from OHLCV                                     */
/* ------------------------------------------------------------------ */
export interface Candle { open: number; high: number; low: number; close: number; volume: number; }
/**
 * Close Location Value (CLV) weighted by volume — proxy for buying pressure.
 * Returns a normalized score in [-1, +1] (avg over last N bars).
 */
export function orderFlowProxy(candles: Candle[], lookback = 10): number {
  if (candles.length === 0) return 0;
  const slice = candles.slice(-lookback);
  let sumVol = 0, sumWeighted = 0;
  for (const c of slice) {
    const range = c.high - c.low;
    if (range <= 0 || c.volume <= 0) continue;
    const clv = ((c.close - c.low) - (c.high - c.close)) / range; // [-1,+1]
    sumWeighted += clv * c.volume;
    sumVol += c.volume;
  }
  if (sumVol === 0) return 0;
  return Math.max(-1, Math.min(1, sumWeighted / sumVol));
}

/* ------------------------------------------------------------------ */
/* I.5 Sector rotation                                                  */
/* ------------------------------------------------------------------ */
const sectorReturns = new Map<string, number[]>();
export function recordSectorReturn(sector: string | null | undefined, ret: number): void {
  if (!sector || !Number.isFinite(ret)) return;
  const arr = sectorReturns.get(sector) ?? [];
  arr.push(ret);
  if (arr.length > 60) arr.shift();
  sectorReturns.set(sector, arr);
}
/** Relative momentum of sector vs market average over last `n` bars. */
export function sectorRotationScore(sector: string | null | undefined, n = 20): number {
  if (!sector) return 0;
  const arr = sectorReturns.get(sector);
  if (!arr || arr.length < 5) return 0;
  const slice = arr.slice(-n);
  const sectorMom = slice.reduce((a, b) => a + b, 0) / slice.length;
  // Market average across all tracked sectors.
  let mktSum = 0, mktN = 0;
  for (const [, vals] of sectorReturns) {
    const s = vals.slice(-n);
    if (s.length === 0) continue;
    mktSum += s.reduce((a, b) => a + b, 0) / s.length;
    mktN++;
  }
  const mktMom = mktN > 0 ? mktSum / mktN : 0;
  // Normalized to a multiplier in [-1, +1] range.
  return Math.max(-1, Math.min(1, (sectorMom - mktMom) * 50));
}
/** Convert rotation score to confidence multiplier (0.9 .. 1.1). */
export function sectorRotationMultiplier(sector: string | null | undefined): number {
  const score = sectorRotationScore(sector);
  return 1 + 0.1 * score;
}

/* ------------------------------------------------------------------ */
/* Aggregate tier multiplier                                            */
/* ------------------------------------------------------------------ */
export interface TierICtx {
  symbol: string;
  sector?: string | null;
  candles?: Candle[];
  existingPicks?: PortfolioPick[];
}
export interface TierIResult {
  multiplier: number;
  orderFlow: number;
  sectorRotation: number;
  correlationPenalty: number;
}
/** Combine I.2 + I.4 + I.5 into a single confidence multiplier. */
export function runTierI(ctx: TierICtx): TierIResult {
  let multiplier = 1.0;
  const orderFlow = ctx.candles ? orderFlowProxy(ctx.candles) : 0;
  // Order-flow: ±5% confidence tilt based on buying/selling pressure.
  multiplier *= 1 + 0.05 * orderFlow;
  const sectorRotation = sectorRotationMultiplier(ctx.sector);
  multiplier *= sectorRotation;
  const correlationPenalty = portfolioCorrelationPenalty(
    { sector: ctx.sector },
    ctx.existingPicks ?? [],
  );
  multiplier *= correlationPenalty;
  return {
    multiplier: Math.max(0.5, Math.min(1.5, multiplier)),
    orderFlow,
    sectorRotation: sectorRotation - 1,
    correlationPenalty,
  };
}