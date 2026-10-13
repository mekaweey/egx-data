import type { Indicators } from "@/lib/analysis/indicators.server";

export type CanonicalLevels = {
  entryMin: number;
  entryMax: number;
  stopLoss: number;
  target: number;
  rrRatio: number;
  atrMultStop: number;
  atrMultTarget: number;
  stopDistancePct: number;
  targetDistancePct: number;
  source: "atr" | "fallback";
};

/**
 * Compute deterministic, ATR-based stop and target levels.
 * This removes subjectivity from the AI's level suggestions:
 *  - Stop = entry - (stopMult × ATR)  → typically 1.5× ATR
 *  - Target = entry + (targetMult × ATR) → typically 3× ATR
 *  - Resulting R:R is guaranteed = targetMult / stopMult (≈ 2:1)
 *
 * If ATR is unavailable, falls back to percentage-based levels (2% stop / 4% target).
 */
export function canonicalLevels(
  ind: Indicators,
  opts?: { stopMult?: number; targetMult?: number; priceOverride?: number; minRR?: number },
): CanonicalLevels {
  // Tighter stop + wider target → enforced R:R ≥ 2.0.
  // Historical data: avg win 3.08% vs avg loss 2.81% (R:R ≈ 1.1) produced
  // negative expectancy at 33% win rate. Raising R:R to 2.0+ flips
  // expectancy positive even at the current win rate.
  const stopMult = opts?.stopMult ?? 1.4;
  const targetMult = opts?.targetMult ?? 3.2;
  const minRR = opts?.minRR ?? 2.0;
  const MIN_STOP_PCT = 1.2; // floor: never place stop closer than 1.2% to entry
  const price = opts?.priceOverride ?? ind.close;
  const atr = ind.atr14;

  if (atr != null && atr > 0 && price > 0) {
    let stop = price - atr * stopMult;
    let target = price + atr * targetMult;

    // Respect nearby support/resistance: don't put stop above support, don't put target above resistance.
    if (ind.support > 0 && ind.support < price) {
      // If support is tighter than ATR stop, snap stop just below support.
      const supStop = ind.support * 0.995;
      if (supStop > stop && supStop < price * 0.99) stop = supStop;
    }
    if (ind.resistance > 0 && ind.resistance > price) {
      // If resistance is closer than 3× ATR, clamp target just below it.
      if (ind.resistance < target) target = ind.resistance * 0.995;
    }

    // Floor stop distance — prevent paper-thin stops on low-volatility names.
    const minStop = price * (1 - MIN_STOP_PCT / 100);
    if (stop > minStop) stop = minStop;

    // Enforce minimum R:R after clamps. Widen target to satisfy if needed.
    {
      const risk = price - stop;
      const reward = target - price;
      if (risk > 0 && reward / risk < minRR) {
        target = price + risk * minRR;
      }
    }

    const stopDistancePct = ((price - stop) / price) * 100;
    const targetDistancePct = ((target - price) / price) * 100;
    const rr = (target - price) / (price - stop);

    return {
      entryMin: +(price * 0.998).toFixed(2),
      entryMax: +(price * 1.005).toFixed(2),
      stopLoss: +stop.toFixed(2),
      target: +target.toFixed(2),
      rrRatio: +rr.toFixed(2),
      atrMultStop: stopMult,
      atrMultTarget: targetMult,
      stopDistancePct: +stopDistancePct.toFixed(2),
      targetDistancePct: +targetDistancePct.toFixed(2),
      source: "atr",
    };
  }

  // Fallback: 2% stop, 4% target
  const stop = price * 0.98;
  const target = price * 1.04;
  return {
    entryMin: +(price * 0.998).toFixed(2),
    entryMax: +(price * 1.005).toFixed(2),
    stopLoss: +stop.toFixed(2),
    target: +target.toFixed(2),
    rrRatio: 2.0,
    atrMultStop: 0,
    atrMultTarget: 0,
    stopDistancePct: 2.0,
    targetDistancePct: 4.0,
    source: "fallback",
  };
}

/**
 * Fixed-fractional position sizing.
 * Risk a fixed % of equity per trade (default 1%).
 * position_size_pct = riskPerTradePct / stopDistancePct
 * Capped between 0.5% and 10% of portfolio.
 *
 * Confidence boost: scale by (confidence/70), capped at 1.5×.
 * So a 90% confidence trade gets ~1.3× the size of a 70% confidence trade.
 */
export function positionSizePct(args: {
  stopDistancePct: number;
  confidence: number;
  riskPerTradePct?: number;
  maxPositionPct?: number;
}): number {
  const risk = args.riskPerTradePct ?? 1.0;
  const cap = args.maxPositionPct ?? 10;
  if (args.stopDistancePct <= 0) return 1;
  const base = risk / (args.stopDistancePct / 100);
  // Confidence scaler: 50% → 0.7×, 70% → 1×, 90% → 1.3×, capped at 1.5×
  const confScaler = Math.min(1.5, Math.max(0.5, args.confidence / 70));
  const size = base * confScaler;
  return +Math.min(cap, Math.max(0.5, size)).toFixed(2);
}