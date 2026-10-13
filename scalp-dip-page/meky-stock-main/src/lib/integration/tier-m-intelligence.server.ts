/**
 * Tier-M Intelligence — freshness, multi-timeframe, sector rotation.
 * Self-contained, pure (except sector cache), fail-open.
 *
 *   M.1 Confidence Decay over Time
 *   M.2 Multi-Timeframe Confirmation (daily + weekly + bi-daily)
 *   M.3 Sector Rotation Intelligence
 */
import type { Candle } from "@/lib/market-data/types";

/* ------------------------------------------------------------------ */
/* M.1 Confidence Decay                                                */
/* ------------------------------------------------------------------ */
/**
 * Linear decay: full confidence on day 0–1, then -5%/day until day 6 → 0.
 * Returns multiplier in [0,1] to apply to a stored recommendation.
 */
export function confidenceDecayMultiplier(
  createdAt: Date | string,
  now: Date = new Date(),
): number {
  const t = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  if (!Number.isFinite(t.getTime())) return 1;
  const ageDays = (now.getTime() - t.getTime()) / 86400000;
  if (ageDays <= 1) return 1;
  if (ageDays >= 6) return 0;
  return Math.max(0, 1 - (ageDays - 1) * 0.2); // 0.2 = 20% per day after day 1
}

/** Decayed confidence (whole percent). */
export function decayConfidence(
  rawConfidence: number,
  createdAt: Date | string,
  now: Date = new Date(),
): number {
  return Math.round(rawConfidence * confidenceDecayMultiplier(createdAt, now));
}

/** Human label in Arabic for the decay state. */
export function decayLabelAr(createdAt: Date | string, now: Date = new Date()): string {
  const m = confidenceDecayMultiplier(createdAt, now);
  if (m >= 0.95) return "جديدة";
  if (m >= 0.6) return "حديثة";
  if (m >= 0.3) return "تتقادم";
  if (m > 0) return "قديمة جداً";
  return "منتهية";
}

/* ------------------------------------------------------------------ */
/* M.2 Multi-Timeframe Confirmation                                    */
/* ------------------------------------------------------------------ */
function trendDirection(closes: number[], lookback: number): -1 | 0 | 1 {
  if (closes.length < lookback + 2) return 0;
  const last = closes[closes.length - 1];
  const ref = closes[closes.length - 1 - lookback];
  if (!ref) return 0;
  const chg = (last - ref) / ref;
  if (chg > 0.015) return 1;
  if (chg < -0.015) return -1;
  return 0;
}

/** Aggregate N daily candles into one bar (close = last close). */
function aggregateCloses(candles: Candle[], step: number): number[] {
  if (step <= 1) return candles.map((c) => c.close);
  const out: number[] = [];
  for (let i = step - 1; i < candles.length; i += step) {
    out.push(candles[i].close);
  }
  return out;
}

/**
 * Returns additive nudge in points:
 *   +10 if daily + weekly + bi-weekly all bullish
 *   -8  if all bearish (penalty for bullish picks)
 *    0  otherwise
 * Plus a `direction` summary.
 */
export function multiTimeframeConfirm(candles?: Candle[]): {
  nudge: number;
  daily: -1 | 0 | 1;
  weekly: -1 | 0 | 1;
  biweekly: -1 | 0 | 1;
  agree: boolean;
} {
  if (!candles || candles.length < 45) {
    return { nudge: 0, daily: 0, weekly: 0, biweekly: 0, agree: false };
  }
  const daily = trendDirection(candles.map((c) => c.close), 5);
  const weekly = trendDirection(aggregateCloses(candles, 5), 4);     // ~20 trading days
  const biweekly = trendDirection(aggregateCloses(candles, 10), 4);  // ~40 trading days

  if (daily === 1 && weekly === 1 && biweekly === 1) {
    return { nudge: 10, daily, weekly, biweekly, agree: true };
  }
  if (daily === -1 && weekly === -1 && biweekly === -1) {
    return { nudge: -8, daily, weekly, biweekly, agree: true };
  }
  // mixed signals → small penalty
  const sum = daily + weekly + biweekly;
  if (Math.abs(sum) === 1) return { nudge: -3, daily, weekly, biweekly, agree: false };
  return { nudge: 0, daily, weekly, biweekly, agree: false };
}

/* ------------------------------------------------------------------ */
/* M.3 Sector Rotation                                                 */
/* ------------------------------------------------------------------ */
interface SectorStats { sum: number; n: number; ts: number; }
const sectorPerf = new Map<string, SectorStats>();
const SECTOR_TTL_MS = 24 * 3600 * 1000;

/** Caller pushes a 5-day return % for any symbol in the sector. */
export function recordSectorReturn(sector: string | null | undefined, return5dPct: number): void {
  if (!sector || !Number.isFinite(return5dPct)) return;
  const now = Date.now();
  const cur = sectorPerf.get(sector);
  if (!cur || now - cur.ts > SECTOR_TTL_MS) {
    sectorPerf.set(sector, { sum: return5dPct, n: 1, ts: now });
    return;
  }
  cur.sum += return5dPct;
  cur.n += 1;
  cur.ts = now;
}

/**
 * Multiplier for confidence based on sector momentum:
 *   leading sector  (avg5d > +2%) →  1.10
 *   neutral                       →  1.00
 *   lagging sector  (avg5d < -2%) →  0.88
 * Returns 1.0 when no data.
 */
export function sectorRotationMultiplier(sector: string | null | undefined): number {
  if (!sector) return 1;
  const s = sectorPerf.get(sector);
  if (!s || s.n < 2) return 1;
  const avg = s.sum / s.n;
  if (avg > 2) return 1.1;
  if (avg < -2) return 0.88;
  // smooth in-between
  return 1 + (avg / 100);
}

/** Quick read-only snapshot for diagnostics/UI. */
export function sectorPerfSnapshot(): Record<string, { avgReturn5d: number; samples: number }> {
  const out: Record<string, { avgReturn5d: number; samples: number }> = {};
  for (const [k, v] of sectorPerf) {
    out[k] = { avgReturn5d: v.n > 0 ? v.sum / v.n : 0, samples: v.n };
  }
  return out;
}