/**
 * Tier F + G + H — infrastructure, signal extraction, self-awareness.
 * ----------------------------------------------------------------------------
 * 9 fail-open learners. All snapshot/restore via model_state.
 *
 *  F.1 Walk-Forward harness   F.2 Feature Store snapshots   F.3 Stacking-L2
 *  G.4 Wavelet decomposition   G.5 Hurst exponent           G.6 Volume bars
 *  H.7 SHAP-lite attribution   H.8 Uncertainty (ensemble)   H.9 Anomaly circuit-breaker
 */

/* ---------------- state ---------------- */
const featureStore: { ts: number; symbol: string; feats: Record<string, number> }[] = [];
const stackL2: { w: Record<string, number>; n: number } = { w: {}, n: 0 };
const recentOutcomes: { ts: number; won: boolean; pct: number }[] = [];
let circuitOpen = false;
let circuitOpenedAt = 0;

/* ---------------- F.1 Walk-Forward ---------------- */
export interface WFResult { folds: number; avgAccuracy: number; avgReturn: number; ok: boolean; }
export function walkForward<T>(
  data: T[],
  trainPct = 0.7,
  folds = 5,
  evaluate: (train: T[], test: T[]) => { accuracy: number; ret: number } = () => ({ accuracy: 0.5, ret: 0 }),
): WFResult {
  if (data.length < folds * 10) return { folds: 0, avgAccuracy: 0, avgReturn: 0, ok: false };
  const step = Math.floor(data.length / folds);
  let accSum = 0, retSum = 0, n = 0;
  for (let i = 1; i <= folds; i++) {
    const cut = step * i;
    const trainEnd = Math.floor(cut * trainPct);
    const train = data.slice(0, trainEnd);
    const test = data.slice(trainEnd, cut);
    if (train.length < 5 || test.length < 1) continue;
    const r = evaluate(train, test);
    accSum += r.accuracy; retSum += r.ret; n++;
  }
  return { folds: n, avgAccuracy: n > 0 ? accSum / n : 0, avgReturn: n > 0 ? retSum / n : 0, ok: n > 0 };
}

/* ---------------- F.2 Feature Store ---------------- */
export function snapshotFeatures(symbol: string, feats: Record<string, number>): void {
  featureStore.push({ ts: Date.now(), symbol, feats });
  if (featureStore.length > 5000) featureStore.shift();
}
export function getFeaturesAt(symbol: string, tsMs: number, toleranceMs = 86_400_000): Record<string, number> | null {
  let best: { d: number; rec: typeof featureStore[number] } | null = null;
  for (const r of featureStore) {
    if (r.symbol !== symbol) continue;
    const d = Math.abs(r.ts - tsMs);
    if (d > toleranceMs) continue;
    if (!best || d < best.d) best = { d, rec: r };
  }
  return best?.rec.feats ?? null;
}

/* ---------------- F.3 Stacking L2 (over Tier scores) ---------------- */
export function stackL2Multiplier(tierScores: Record<string, number>): number {
  let dot = 0, abs = 0;
  for (const k of Object.keys(tierScores)) {
    const w = stackL2.w[k] ?? 0;
    dot += w * tierScores[k];
    abs += Math.abs(w);
  }
  if (abs === 0 || stackL2.n < 10) return 1.0;
  const z = Math.tanh(dot / Math.max(1, abs));
  return Math.max(0.85, Math.min(1.18, 1 + z * 0.15));
}
export function stackL2Update(tierScores: Record<string, number>, won: boolean): void {
  const y = won ? 1 : -1;
  const lr = 0.02;
  for (const k of Object.keys(tierScores)) {
    const w = stackL2.w[k] ?? 0;
    stackL2.w[k] = w + lr * (y - Math.tanh(w * tierScores[k])) * tierScores[k];
  }
  stackL2.n++;
}

/* ---------------- G.4 Wavelet (Haar 3 levels) ---------------- */
export function waveletDivergence(closes: number[]): number {
  if (closes.length < 16) return 0;
  const n = Math.min(64, closes.length - (closes.length % 8));
  let x = closes.slice(-n);
  const energies: number[] = [];
  for (let lvl = 0; lvl < 3 && x.length >= 2; lvl++) {
    const avg: number[] = [], det: number[] = [];
    for (let i = 0; i + 1 < x.length; i += 2) {
      avg.push((x[i] + x[i + 1]) / 2);
      det.push((x[i] - x[i + 1]) / 2);
    }
    energies.push(det.reduce((s, d) => s + d * d, 0) / det.length);
    x = avg;
  }
  // divergence = short-term vs long-term energy ratio
  const ratio = energies[0] / Math.max(1e-9, energies[energies.length - 1]);
  return Math.tanh(Math.log(Math.max(1e-9, ratio)));
}
export function waveletMultiplier(closes: number[]): number {
  const d = waveletDivergence(closes);
  // strong multi-timeframe alignment (low divergence) → boost
  return Math.max(0.92, Math.min(1.10, 1 + (0.5 - Math.abs(d)) * 0.15));
}

/* ---------------- G.5 Hurst exponent ---------------- */
export function hurstExponent(series: number[]): number {
  if (series.length < 20) return 0.5;
  const n = series.length;
  const mean = series.reduce((a, b) => a + b, 0) / n;
  const dev = series.map((x) => x - mean);
  const cum: number[] = [];
  let s = 0;
  for (const d of dev) { s += d; cum.push(s); }
  const R = Math.max(...cum) - Math.min(...cum);
  const S = Math.sqrt(dev.reduce((a, b) => a + b * b, 0) / n);
  if (S === 0) return 0.5;
  const h = Math.log(R / S) / Math.log(n);
  return Math.max(0, Math.min(1, h));
}
export function hurstMultiplier(closes: number[], sigDir: 1 | -1 | 0): number {
  if (sigDir === 0 || closes.length < 20) return 1.0;
  const rets: number[] = [];
  for (let i = 1; i < closes.length; i++) rets.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  const h = hurstExponent(rets);
  // trending market (H>0.55) → boost trend signals; mean-reverting (H<0.45) → boost contrarian
  const trending = h > 0.55, reverting = h < 0.45;
  const recentDir = Math.sign(rets.slice(-5).reduce((a, b) => a + b, 0)) as 1 | -1 | 0;
  if (trending && recentDir === sigDir) return 1.10;
  if (reverting && recentDir !== sigDir) return 1.08;
  return 1.0;
}

/* ---------------- G.6 Volume-synchronized bars ---------------- */
export interface VBar { open: number; close: number; high: number; low: number; vol: number; }
export function volumeBars(closes: number[], volumes: number[], bucket: number): VBar[] {
  const n = Math.min(closes.length, volumes.length);
  const out: VBar[] = [];
  let acc = 0, open = closes[0] ?? 0, hi = -Infinity, lo = Infinity, vol = 0;
  for (let i = 0; i < n; i++) {
    acc += volumes[i]; vol += volumes[i];
    hi = Math.max(hi, closes[i]); lo = Math.min(lo, closes[i]);
    if (acc >= bucket) {
      out.push({ open, close: closes[i], high: hi, low: lo, vol });
      open = closes[i]; hi = -Infinity; lo = Infinity; vol = 0; acc = 0;
    }
  }
  return out;
}
export function volumeBarMultiplier(closes: number[], volumes: number[], sigDir: 1 | -1 | 0): number {
  if (sigDir === 0 || closes.length < 20) return 1.0;
  const totalVol = volumes.reduce((a, b) => a + b, 0);
  const bars = volumeBars(closes, volumes, Math.max(1, totalVol / 10));
  if (bars.length < 3) return 1.0;
  const last = bars[bars.length - 1];
  const trend = Math.sign(last.close - bars[0].open) as 1 | -1 | 0;
  return trend === sigDir ? 1.05 : 0.97;
}

/* ---------------- H.7 SHAP-lite attribution ---------------- */
export function shapAttribution(signals: { name: string; value: number; weight?: number }[]): { name: string; contribution: number }[] {
  const base = signals.reduce((s, x) => s + (x.value * (x.weight ?? 1)), 0) / Math.max(1, signals.length);
  const out = signals.map((s) => ({
    name: s.name,
    contribution: Math.abs(s.value * (s.weight ?? 1) - base),
  }));
  out.sort((a, b) => b.contribution - a.contribution);
  return out.slice(0, 5);
}

/* ---------------- H.8 Uncertainty / ensemble variance ---------------- */
export function ensembleUncertainty(signals: number[]): { mean: number; std: number; multiplier: number } {
  if (signals.length === 0) return { mean: 0, std: 0, multiplier: 1 };
  const mean = signals.reduce((a, b) => a + b, 0) / signals.length;
  const v = signals.reduce((a, b) => a + (b - mean) ** 2, 0) / signals.length;
  const std = Math.sqrt(v);
  // high std → low trust
  const mul = Math.max(0.75, 1 - Math.min(0.25, std));
  return { mean, std, multiplier: mul };
}

/* ---------------- H.9 Anomaly self-detection (circuit breaker) ---------------- */
export function recordTradeOutcome(won: boolean, pct: number): void {
  recentOutcomes.push({ ts: Date.now(), won, pct });
  if (recentOutcomes.length > 50) recentOutcomes.shift();
  // open if loss rate >70% over last 10 trades
  if (recentOutcomes.length >= 10) {
    const last10 = recentOutcomes.slice(-10);
    const losses = last10.filter((x) => !x.won).length;
    if (losses >= 7 && !circuitOpen) {
      circuitOpen = true;
      circuitOpenedAt = Date.now();
    }
  }
  // auto-close after 24h or after 3 consecutive wins
  if (circuitOpen) {
    const sinceOpen = Date.now() - circuitOpenedAt;
    const last3 = recentOutcomes.slice(-3);
    if (sinceOpen > 86_400_000 || (last3.length === 3 && last3.every((x) => x.won))) {
      circuitOpen = false;
    }
  }
}
export function circuitBreakerMultiplier(): number {
  return circuitOpen ? 0.5 : 1.0;
}
export function isCircuitOpen(): boolean { return circuitOpen; }

/* ---------------- persistence ---------------- */
export function snapshotTierFGHState(): Record<string, unknown> {
  return {
    featureStore: featureStore.slice(-1000),
    stackL2,
    recentOutcomes: recentOutcomes.slice(-50),
    circuitOpen,
    circuitOpenedAt,
  };
}
export function restoreTierFGHState(s: unknown): void {
  if (!s || typeof s !== "object") return;
  const o = s as Record<string, unknown>;
  try {
    if (Array.isArray(o.featureStore)) { featureStore.length = 0; featureStore.push(...(o.featureStore as typeof featureStore)); }
    if (o.stackL2 && typeof o.stackL2 === "object") {
      const x = o.stackL2 as typeof stackL2;
      stackL2.w = x.w ?? {}; stackL2.n = x.n ?? 0;
    }
    if (Array.isArray(o.recentOutcomes)) { recentOutcomes.length = 0; recentOutcomes.push(...(o.recentOutcomes as typeof recentOutcomes)); }
    if (typeof o.circuitOpen === "boolean") circuitOpen = o.circuitOpen;
    if (typeof o.circuitOpenedAt === "number") circuitOpenedAt = o.circuitOpenedAt;
  } catch { /* fail-open */ }
}