/**
 * Intelligence Layer — 6 cross-cutting enhancements that wrap any pick:
 *   1. Bayesian confidence interval (uncertainty band on the score)
 *   2. Drift detection (PSI on feature distribution vs reference)
 *   3. Anomaly detection on raw candles (gap / split / volume spike)
 *   4. Multi-timeframe confluence (daily + weekly agreement bonus)
 *   5. Correlation-aware portfolio penalty (cluster crowding)
 *   6. A/B shadow tester (compare candidate weights vs prod in the dark)
 */
import type { Candle } from "@/lib/market-data/types";
import type { ModuleSignal } from "./pipeline-integrator.server";

// ── 1. Bayesian confidence interval ──────────────────────────────────────
export function bayesianInterval(signals: ModuleSignal[], rawConfidence: number) {
  const n = signals.length || 1;
  // Weighted variance of the signal values, weighted by per-module confidence.
  let wSum = 0, mean = 0;
  for (const s of signals) { const w = s.confidence ?? 0.5; mean += w * s.value; wSum += w; }
  mean = wSum > 0 ? mean / wSum : 0;
  let varSum = 0;
  for (const s of signals) { const w = s.confidence ?? 0.5; varSum += w * (s.value - mean) ** 2; }
  const variance = wSum > 0 ? varSum / wSum : 0;
  const std = Math.sqrt(variance);
  // 95% interval scaled to 0-100 space; bigger spread = wider band.
  const halfWidth = Math.min(25, std * 30 + (10 / Math.sqrt(n)));
  return {
    lower: Math.max(0, rawConfidence - halfWidth),
    upper: Math.min(100, rawConfidence + halfWidth),
    halfWidth,
    /** Trust multiplier ∈ [0.7,1]: wider band → less trust. */
    trust: Math.max(0.7, 1 - halfWidth / 80),
  };
}

// ── 2. Drift detection (Population Stability Index) ──────────────────────
const referenceDist = new Map<string, number[]>();

function buckets(xs: number[], n = 10): number[] {
  if (xs.length === 0) return new Array(n).fill(1 / n);
  const min = Math.min(...xs), max = Math.max(...xs);
  const w = (max - min) / n || 1;
  const counts = new Array(n).fill(0);
  for (const x of xs) {
    const i = Math.min(n - 1, Math.max(0, Math.floor((x - min) / w)));
    counts[i]++;
  }
  return counts.map((c) => (c + 1) / (xs.length + n));
}

export function driftPSI(symbol: string, recentReturns: number[]): number {
  if (recentReturns.length < 30) return 0;
  const cur = buckets(recentReturns);
  const ref = referenceDist.get(symbol);
  if (!ref) { referenceDist.set(symbol, cur); return 0; }
  let psi = 0;
  for (let i = 0; i < cur.length; i++) psi += (cur[i] - ref[i]) * Math.log(cur[i] / ref[i]);
  // Slowly update reference (EWMA).
  const updated = ref.map((r, i) => r * 0.9 + cur[i] * 0.1);
  referenceDist.set(symbol, updated);
  return Math.abs(psi);
}

/** PSI > 0.25 → significant drift → lower trust. */
export function driftMultiplier(psi: number): number {
  if (psi < 0.1) return 1;
  if (psi < 0.25) return 0.95;
  if (psi < 0.5) return 0.85;
  return 0.7;
}

// ── 3. Anomaly detection on raw candles ──────────────────────────────────
export function anomalyCheck(candles: Candle[]): { ok: boolean; reason?: string } {
  if (candles.length < 5) return { ok: true };
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  if (last.close <= 0 || prev.close <= 0) return { ok: false, reason: "bad_price" };
  const gap = Math.abs(last.open - prev.close) / prev.close;
  if (gap > 0.25) return { ok: false, reason: "split_or_gap" };
  const range = (last.high - last.low) / last.close;
  if (range > 0.5) return { ok: false, reason: "extreme_range" };
  // Volume spike vs 20-day avg
  const vols = candles.slice(-21, -1).map((c) => c.volume);
  const avg = vols.reduce((s, v) => s + v, 0) / Math.max(1, vols.length);
  if (avg > 0 && last.volume > avg * 25) return { ok: false, reason: "volume_spike" };
  return { ok: true };
}

// ── 4. Multi-timeframe confluence ────────────────────────────────────────
/** Aggregate daily candles to weekly and compute trend agreement. */
export function multiTimeframeAgreement(candles: Candle[]): { agree: boolean; bonus: number } {
  if (candles.length < 40) return { agree: false, bonus: 0 };
  // Daily trend = last 10 days slope sign
  const d10 = candles.slice(-10).map((c) => c.close);
  const dailyTrend = d10[d10.length - 1] - d10[0];
  // Weekly trend = aggregate every 5 days for last 8 "weeks"
  const weekly: number[] = [];
  for (let i = candles.length - 40; i < candles.length; i += 5) {
    weekly.push(candles[Math.min(i + 4, candles.length - 1)].close);
  }
  const weeklyTrend = weekly[weekly.length - 1] - weekly[0];
  const agree = Math.sign(dailyTrend) === Math.sign(weeklyTrend) && dailyTrend !== 0;
  // Multiplier applied to delta when timeframes align.
  return { agree, bonus: agree ? 1.1 : 0.9 };
}

// ── 5. Correlation-aware portfolio penalty ───────────────────────────────
/** Track sector/cluster crowding within a single scan run. */
const scanClusterCounts = new Map<string, number>();

export function resetClusterTracking() { scanClusterCounts.clear(); }

export function clusterPenalty(symbol: string, sector?: string | null): number {
  const key = sector || symbol.slice(0, 3); // fallback prefix
  const count = scanClusterCounts.get(key) ?? 0;
  scanClusterCounts.set(key, count + 1);
  // First pick in cluster: full credit. 2nd: 0.9. 3rd: 0.8. Cap at 0.7.
  return Math.max(0.7, 1 - count * 0.1);
}

// ── 6. A/B shadow tester ─────────────────────────────────────────────────
interface ShadowRecord {
  ts: number;
  symbol: string;
  prodConfidence: number;
  shadowConfidence: number;
}
const shadowLog: ShadowRecord[] = [];

export function recordShadow(symbol: string, prod: number, shadow: number) {
  shadowLog.push({ ts: Date.now(), symbol, prodConfidence: prod, shadowConfidence: shadow });
  if (shadowLog.length > 2000) shadowLog.splice(0, shadowLog.length - 1000);
}

export function shadowStats() {
  if (shadowLog.length === 0) return { n: 0, avgDelta: 0, maxDelta: 0 };
  let sum = 0, maxD = 0;
  for (const r of shadowLog) {
    const d = r.shadowConfidence - r.prodConfidence;
    sum += d; if (Math.abs(d) > Math.abs(maxD)) maxD = d;
  }
  return { n: shadowLog.length, avgDelta: sum / shadowLog.length, maxDelta: maxD };
}
