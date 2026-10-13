/**
 * Advanced Intelligence V2 — 12 new layers (fail-open, dependency-free).
 * All exports are pure functions; numerical only; safe to call from orchestrator.
 * State is in-memory per worker (resets on cold start) — good enough for online
 * adaptation; can be persisted to DB later.
 */
import type { Candle } from "@/lib/market-data/types";

// ──────────────────────────────────────────────────────────────────────────
// 1) Online SGD (fast post-trade adaptation, per symbol)
// ──────────────────────────────────────────────────────────────────────────
type SGDModel = { w: number[]; b: number; lr: number; n: number };
const sgdModels = new Map<string, SGDModel>();

export function sgdPredict(symbol: string, x: number[]): number {
  const m = sgdModels.get(symbol);
  if (!m || m.w.length !== x.length) return 0;
  let s = m.b;
  for (let i = 0; i < x.length; i++) s += m.w[i] * x[i];
  return Math.tanh(s);
}
export function sgdUpdate(symbol: string, x: number[], y: number) {
  let m = sgdModels.get(symbol);
  if (!m || m.w.length !== x.length) {
    m = { w: new Array(x.length).fill(0), b: 0, lr: 0.03, n: 0 };
  }
  const pred = sgdPredict(symbol, x);
  const err = y - pred;
  for (let i = 0; i < x.length; i++) m.w[i] += m.lr * err * x[i];
  m.b += m.lr * err;
  m.n++;
  sgdModels.set(symbol, m);
}

// ──────────────────────────────────────────────────────────────────────────
// 2) Conformal Prediction — distribution-free uncertainty interval
// ──────────────────────────────────────────────────────────────────────────
const residualsBuf = new Map<string, number[]>();
export function recordResidual(symbol: string, err: number) {
  const arr = residualsBuf.get(symbol) ?? [];
  arr.push(Math.abs(err));
  if (arr.length > 200) arr.shift();
  residualsBuf.set(symbol, arr);
}
export function conformalInterval(symbol: string, point: number, alpha = 0.1) {
  const arr = residualsBuf.get(symbol);
  if (!arr || arr.length < 10) return { lower: point - 5, upper: point + 5, q: 5 };
  const sorted = [...arr].sort((a, b) => a - b);
  const k = Math.min(sorted.length - 1, Math.ceil((1 - alpha) * sorted.length));
  const q = sorted[k];
  return { lower: point - q, upper: point + q, q };
}

// ──────────────────────────────────────────────────────────────────────────
// 3) Stacking Meta-Learner — logistic regression over module outputs
// ──────────────────────────────────────────────────────────────────────────
type Stack = { w: Record<string, number>; b: number; lr: number; n: number };
const stackState: Stack = { w: {}, b: 0, lr: 0.05, n: 0 };

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export function stackPredict(signals: Array<{ name: string; value: number }>): number {
  let z = stackState.b;
  for (const s of signals) z += (stackState.w[s.name] ?? 0) * s.value;
  return sigmoid(z); // probability of positive outcome
}
export function stackUpdate(signals: Array<{ name: string; value: number }>, y: 0 | 1) {
  const p = stackPredict(signals);
  const err = y - p;
  for (const s of signals) {
    stackState.w[s.name] = (stackState.w[s.name] ?? 0) + stackState.lr * err * s.value;
  }
  stackState.b += stackState.lr * err;
  stackState.n++;
}
export function stackMultiplier(signals: Array<{ name: string; value: number }>): number {
  if (stackState.n < 10) return 1;
  const p = stackPredict(signals);
  // p in [0,1]; map to multiplier [0.7, 1.25].
  return 0.7 + 0.55 * Math.max(0, Math.min(1, p));
}

// ──────────────────────────────────────────────────────────────────────────
// 4) Change-Point Detection — CUSUM on returns
// ──────────────────────────────────────────────────────────────────────────
export function cusumChangePoint(rets: number[], k = 0.005, h = 0.05): boolean {
  if (rets.length < 20) return false;
  let sPos = 0, sNeg = 0;
  const mean = rets.reduce((s, x) => s + x, 0) / rets.length;
  for (const r of rets.slice(-30)) {
    sPos = Math.max(0, sPos + (r - mean) - k);
    sNeg = Math.min(0, sNeg + (r - mean) + k);
    if (sPos > h || sNeg < -h) return true;
  }
  return false;
}

// ──────────────────────────────────────────────────────────────────────────
// 5) Hawkes contagion proxy — per-sector recent burst tracker
// ──────────────────────────────────────────────────────────────────────────
const sectorBursts = new Map<string, number[]>(); // sector → list of timestamps
export function recordSectorMove(sector: string | null, magnitude: number) {
  if (!sector) return;
  if (Math.abs(magnitude) < 0.02) return;
  const arr = sectorBursts.get(sector) ?? [];
  arr.push(Date.now());
  // Keep last hour
  const cutoff = Date.now() - 60 * 60 * 1000;
  const fresh = arr.filter((t) => t > cutoff);
  sectorBursts.set(sector, fresh);
}
export function contagionMultiplier(sector: string | null): number {
  if (!sector) return 1;
  const arr = sectorBursts.get(sector) ?? [];
  // Many recent bursts → expect mean-reversion / instability → dampen.
  if (arr.length >= 5) return 0.85;
  if (arr.length >= 2) return 0.95;
  return 1;
}

// ──────────────────────────────────────────────────────────────────────────
// 6) HMM-lite — 5 market states via simple clustering on (ret, vol)
// ──────────────────────────────────────────────────────────────────────────
export type HmmState = "risk_on" | "risk_off" | "rotation" | "panic" | "euphoria" | "neutral";
export function hmmState(rets: number[]): HmmState {
  if (rets.length < 20) return "neutral";
  const r = rets.slice(-20);
  const mean = r.reduce((s, x) => s + x, 0) / r.length;
  const vol = Math.sqrt(r.reduce((s, x) => s + (x - mean) ** 2, 0) / r.length);
  const skew = r.filter((x) => x > 0).length / r.length;
  if (mean > 0.01 && vol > 0.03) return "euphoria";
  if (mean < -0.01 && vol > 0.04) return "panic";
  if (mean > 0.003 && skew > 0.55) return "risk_on";
  if (mean < -0.003 && skew < 0.45) return "risk_off";
  if (vol > 0.02 && Math.abs(mean) < 0.002) return "rotation";
  return "neutral";
}
export function hmmMultiplier(state: HmmState): number {
  switch (state) {
    case "panic": return 0.6;
    case "euphoria": return 0.85; // late-cycle caution
    case "risk_on": return 1.1;
    case "risk_off": return 0.8;
    case "rotation": return 0.95;
    default: return 1;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 7) Granger-lite — does index move lead this symbol?
// ──────────────────────────────────────────────────────────────────────────
export function leadLagScore(symbolRets: number[], indexRets: number[], lag = 1): number {
  const n = Math.min(symbolRets.length, indexRets.length) - lag;
  if (n < 10) return 0;
  let num = 0, dx = 0, dy = 0;
  const mx = indexRets.slice(0, n).reduce((s, x) => s + x, 0) / n;
  const my = symbolRets.slice(lag, lag + n).reduce((s, x) => s + x, 0) / n;
  for (let i = 0; i < n; i++) {
    const xi = indexRets[i] - mx;
    const yi = symbolRets[i + lag] - my;
    num += xi * yi; dx += xi * xi; dy += yi * yi;
  }
  const denom = Math.sqrt(dx * dy);
  return denom > 0 ? num / denom : 0;
}

// ──────────────────────────────────────────────────────────────────────────
// 8) Order-book imbalance proxy — derived from OHLCV
// ──────────────────────────────────────────────────────────────────────────
export function obImbalance(candles: Candle[]): number {
  if (candles.length < 5) return 0;
  const recent = candles.slice(-10);
  let buy = 0, sell = 0;
  for (const c of recent) {
    const range = Math.max(1e-9, c.high - c.low);
    const closePos = (c.close - c.low) / range; // 0..1
    buy += c.volume * closePos;
    sell += c.volume * (1 - closePos);
  }
  const tot = buy + sell;
  return tot > 0 ? (buy - sell) / tot : 0; // [-1, 1]
}

// ──────────────────────────────────────────────────────────────────────────
// 9) Counterfactual replay — Q-value of "skip" baseline
// ──────────────────────────────────────────────────────────────────────────
const cfStats = { skipReward: 0, enterReward: 0, n: 0 };
export function recordCounterfactual(action: "enter" | "skip", realizedPct: number) {
  if (action === "enter") cfStats.enterReward += realizedPct;
  else cfStats.skipReward += 0; // skip = 0 reward
  cfStats.n++;
}
export function counterfactualEdge(): number {
  if (cfStats.n < 5) return 0;
  return (cfStats.enterReward - cfStats.skipReward) / cfStats.n;
}

// ──────────────────────────────────────────────────────────────────────────
// 10) Causal Inference — partial correlation between two features given a control
// ──────────────────────────────────────────────────────────────────────────
function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 3) return 0;
  const ma = a.slice(0, n).reduce((s, x) => s + x, 0) / n;
  const mb = b.slice(0, n).reduce((s, x) => s + x, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const xa = a[i] - ma, xb = b[i] - mb;
    num += xa * xb; da += xa * xa; db += xb * xb;
  }
  const d = Math.sqrt(da * db);
  return d > 0 ? num / d : 0;
}
export function partialCorr(x: number[], y: number[], z: number[]): number {
  const rxy = pearson(x, y);
  const rxz = pearson(x, z);
  const ryz = pearson(y, z);
  const denom = Math.sqrt(Math.max(1e-9, (1 - rxz * rxz) * (1 - ryz * ryz)));
  return (rxy - rxz * ryz) / denom;
}

// ──────────────────────────────────────────────────────────────────────────
// 11) Sector Graph — neighbor average signal
// ──────────────────────────────────────────────────────────────────────────
const sectorSignals = new Map<string, number[]>();
export function recordSectorSignal(sector: string | null, value: number) {
  if (!sector) return;
  const arr = sectorSignals.get(sector) ?? [];
  arr.push(value);
  if (arr.length > 50) arr.shift();
  sectorSignals.set(sector, arr);
}
export function neighborConsensus(sector: string | null): { value: number; n: number } {
  if (!sector) return { value: 0, n: 0 };
  const arr = sectorSignals.get(sector) ?? [];
  if (arr.length < 2) return { value: 0, n: arr.length };
  const avg = arr.reduce((s, x) => s + x, 0) / arr.length;
  return { value: Math.max(-1, Math.min(1, avg)), n: arr.length };
}

// ──────────────────────────────────────────────────────────────────────────
// 12) Active Learning — flag uncertain candidates for follow-up labelling
// ──────────────────────────────────────────────────────────────────────────
export const activeLearningQueue: Array<{ symbol: string; confidence: number; reason: string; ts: number }> = [];
export function maybeQueueForLabel(symbol: string, confidence: number, intervalWidth: number) {
  // High uncertainty band OR mid-confidence (40-60) → most informative.
  const isUncertain = intervalWidth > 15 || (confidence >= 40 && confidence <= 60);
  if (!isUncertain) return;
  activeLearningQueue.push({ symbol, confidence, reason: intervalWidth > 15 ? "wide_band" : "mid_conf", ts: Date.now() });
  if (activeLearningQueue.length > 500) activeLearningQueue.splice(0, 250);
}

// ──────────────────────────────────────────────────────────────────────────
// Persistence — snapshot/restore of in-memory learning state
// ──────────────────────────────────────────────────────────────────────────
export function snapshotV2State() {
  return {
    sgd: Array.from(sgdModels.entries()),
    residuals: Array.from(residualsBuf.entries()),
    stack: stackState,
    cf: cfStats,
    sectorSignals: Array.from(sectorSignals.entries()),
  };
}

export function restoreV2State(s: unknown) {
  if (!s || typeof s !== "object") return;
  const o = s as Record<string, unknown>;
  try {
    if (Array.isArray(o.sgd)) {
      sgdModels.clear();
      for (const [k, v] of o.sgd as Array<[string, SGDModel]>) sgdModels.set(k, v);
    }
    if (Array.isArray(o.residuals)) {
      residualsBuf.clear();
      for (const [k, v] of o.residuals as Array<[string, number[]]>) residualsBuf.set(k, v);
    }
    if (o.stack && typeof o.stack === "object") {
      const st = o.stack as Stack;
      stackState.w = st.w ?? {};
      stackState.b = st.b ?? 0;
      stackState.lr = st.lr ?? 0.05;
      stackState.n = st.n ?? 0;
    }
    if (o.cf && typeof o.cf === "object") {
      const c = o.cf as typeof cfStats;
      cfStats.skipReward = c.skipReward ?? 0;
      cfStats.enterReward = c.enterReward ?? 0;
      cfStats.n = c.n ?? 0;
    }
    if (Array.isArray(o.sectorSignals)) {
      sectorSignals.clear();
      for (const [k, v] of o.sectorSignals as Array<[string, number[]]>) sectorSignals.set(k, v);
    }
  } catch {}
}