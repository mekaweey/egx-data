/**
 * Tier-O Intelligence
 * --------------------------------------------------------------------------
 * Six lightweight, self-contained improvements that lift accuracy without
 * any new data source:
 *   O.1  Kelly Criterion — optimal position-size multiplier per pattern.
 *   O.2  Correlation filter — penalise too-many picks in the same sector.
 *   O.3  Day-of-week / time-of-day bias from realised outcomes.
 *   O.4  Earnings-proximity guard (stricter than tier-J event multiplier).
 *   O.5  Meta-learning — rolling weighting of technical/sentiment/macro
 *        scores based on which one is "working" right now.
 *   O.6  Reliability-curve calibration (Platt-style bucket correction).
 *
 * All state is in-process; values are conservative and clamped.
 */

// ────────────────────────────────────────────────────────────────────────
// O.1 Kelly Criterion position sizing
// ────────────────────────────────────────────────────────────────────────
interface KellyStat { wins: number; losses: number; sumWin: number; sumLoss: number; }
const kellyByPattern = new Map<string, KellyStat>();

export function recordKellyOutcome(pattern: string, pnlPct: number) {
  if (!pattern) return;
  const s = kellyByPattern.get(pattern) ?? { wins: 0, losses: 0, sumWin: 0, sumLoss: 0 };
  if (pnlPct >= 0) { s.wins++; s.sumWin += pnlPct; }
  else { s.losses++; s.sumLoss += -pnlPct; }
  kellyByPattern.set(pattern, s);
}

/** Returns Kelly fraction in [0, 0.25] (quarter-Kelly for safety). */
export function kellyFraction(patterns: string[]): number {
  let best = 0;
  for (const p of patterns) {
    const s = kellyByPattern.get(p);
    if (!s) continue;
    const n = s.wins + s.losses;
    if (n < 5) continue;
    const winRate = s.wins / n;
    const avgWin = s.wins > 0 ? s.sumWin / s.wins : 0;
    const avgLoss = s.losses > 0 ? s.sumLoss / s.losses : 0;
    if (avgLoss <= 0) continue;
    const b = avgWin / avgLoss;
    // Kelly: f = (bp - q) / b
    const f = (b * winRate - (1 - winRate)) / b;
    const quarter = Math.max(0, Math.min(0.25, f * 0.25));
    if (quarter > best) best = quarter;
  }
  return best;
}

// ────────────────────────────────────────────────────────────────────────
// O.2 Correlation / sector concentration filter
// ────────────────────────────────────────────────────────────────────────
const sectorPickCounts = new Map<string, { count: number; ts: number }>();
const SECTOR_TTL_MS = 6 * 60 * 60 * 1000;

export function noteSectorPick(sector: string | null | undefined) {
  if (!sector) return;
  const now = Date.now();
  const cur = sectorPickCounts.get(sector);
  if (!cur || now - cur.ts > SECTOR_TTL_MS) {
    sectorPickCounts.set(sector, { count: 1, ts: now });
  } else {
    cur.count += 1; cur.ts = now;
  }
}

/** Penalty multiplier — 3rd pick in a sector → ×0.92, 4th → ×0.85, 5+ → ×0.78. */
export function sectorConcentrationMultiplier(sector: string | null | undefined): number {
  if (!sector) return 1;
  const cur = sectorPickCounts.get(sector);
  if (!cur) return 1;
  if (Date.now() - cur.ts > SECTOR_TTL_MS) return 1;
  if (cur.count <= 2) return 1;
  if (cur.count === 3) return 0.92;
  if (cur.count === 4) return 0.85;
  return 0.78;
}

// ────────────────────────────────────────────────────────────────────────
// O.3 Day-of-week edge learning (separate from tier-J static table)
// ────────────────────────────────────────────────────────────────────────
interface DowStat { wins: number; total: number; }
const dowStats: DowStat[] = Array.from({ length: 7 }, () => ({ wins: 0, total: 0 }));

export function recordDowOutcome(date: Date, won: boolean) {
  const d = date.getDay();
  dowStats[d].total++;
  if (won) dowStats[d].wins++;
}

export function dowLearnedMultiplier(date: Date): number {
  const s = dowStats[date.getDay()];
  if (s.total < 10) return 1;
  const wr = s.wins / s.total;
  // 0.40 → ×0.88, 0.50 → ×1.00, 0.65 → ×1.12
  return Math.max(0.85, Math.min(1.15, 1 + (wr - 0.50) * 0.8));
}

// ────────────────────────────────────────────────────────────────────────
// O.4 Earnings-proximity guard (stricter)
// ────────────────────────────────────────────────────────────────────────
export function earningsProximityGuard(daysToEarnings: number | null): number {
  if (daysToEarnings === null || daysToEarnings === undefined) return 1;
  const d = Math.abs(daysToEarnings);
  if (d <= 1) return 0.65;       // within 1 day: very risky
  if (d <= 3) return 0.80;       // 2–3 days: moderate
  if (d <= 5) return 0.92;       // 4–5 days: mild
  return 1;
}

// ────────────────────────────────────────────────────────────────────────
// O.5 Meta-learning — which sub-score is working?
// ────────────────────────────────────────────────────────────────────────
type ScoreKey = "technical" | "fundamental" | "sentiment" | "macro" | "sector";
interface MetaStat { hits: number; total: number; }
const metaStats = new Map<ScoreKey, MetaStat>();
(["technical", "fundamental", "sentiment", "macro", "sector"] as ScoreKey[])
  .forEach((k) => metaStats.set(k, { hits: 0, total: 0 }));

export function recordScoreOutcome(scores: Partial<Record<ScoreKey, number>>, won: boolean) {
  for (const [k, v] of Object.entries(scores) as Array<[ScoreKey, number | undefined]>) {
    if (typeof v !== "number") continue;
    // A score "predicted" win if it was > 0.5 (or > 50 on 0–100 scale).
    const norm = v > 1 ? v / 100 : v;
    const predictedWin = norm > 0.5;
    if (predictedWin === won) {
      const s = metaStats.get(k)!; s.hits++; s.total++;
    } else {
      const s = metaStats.get(k)!; s.total++;
    }
  }
}

/** Returns dynamic weights (sum normalised to N) for each score type. */
export function metaScoreWeights(): Record<ScoreKey, number> {
  const keys: ScoreKey[] = ["technical", "fundamental", "sentiment", "macro", "sector"];
  const raw: Record<ScoreKey, number> = {} as Record<ScoreKey, number>;
  let sum = 0;
  for (const k of keys) {
    const s = metaStats.get(k)!;
    const wr = s.total >= 20 ? s.hits / s.total : 0.5;
    const w = Math.max(0.4, Math.min(1.6, wr * 2));
    raw[k] = w; sum += w;
  }
  const target = keys.length;
  for (const k of keys) raw[k] = raw[k] * (target / sum);
  return raw;
}

/** Convenience: returns a single multiplier from a confidence-component map. */
export function metaWeightedMultiplier(scoreContribs: Partial<Record<ScoreKey, number>>): number {
  const w = metaScoreWeights();
  let mult = 1, n = 0;
  for (const [k, v] of Object.entries(scoreContribs) as Array<[ScoreKey, number | undefined]>) {
    if (typeof v !== "number") continue;
    mult *= 1 + (w[k] - 1) * 0.05 * Math.sign(v);
    n++;
  }
  return n === 0 ? 1 : Math.max(0.85, Math.min(1.18, mult));
}

// ────────────────────────────────────────────────────────────────────────
// O.6 Reliability-curve calibration (Platt-style buckets)
// ────────────────────────────────────────────────────────────────────────
interface CalibBucket { sum: number; hits: number; total: number; }
const calibBuckets: CalibBucket[] = Array.from({ length: 10 }, () => ({ sum: 0, hits: 0, total: 0 }));

export function recordCalibration(confidence0_100: number, won: boolean) {
  const bucket = Math.max(0, Math.min(9, Math.floor(confidence0_100 / 10)));
  const b = calibBuckets[bucket];
  b.sum += confidence0_100; b.total++;
  if (won) b.hits++;
}

/** Maps raw confidence (0–100) to an empirically-calibrated value (0–100). */
export function reliabilityCalibrate(confidence0_100: number): number {
  const bucket = Math.max(0, Math.min(9, Math.floor(confidence0_100 / 10)));
  const b = calibBuckets[bucket];
  if (b.total < 15) return confidence0_100;
  const actual = (b.hits / b.total) * 100;
  // Blend 60% historical actual + 40% raw to avoid overfitting.
  return Math.max(0, Math.min(100, actual * 0.6 + confidence0_100 * 0.4));
}