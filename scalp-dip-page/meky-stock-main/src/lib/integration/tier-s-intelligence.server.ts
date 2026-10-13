/**
 * Tier-S intelligence layer.
 * --------------------------------------------------------------------------
 *   S.1  Kalman trend filter (adaptive smoother)
 *   S.2  Hurst exponent (trending vs mean-reverting)
 *   S.3  CUSUM change-point detector
 *   S.4  Information Coefficient (Spearman) per feature
 *   S.5  Vol-targeting position multiplier
 *   S.6  Pairs / cointegration spread z-score
 *   S.7  Order-flow imbalance from OHLC
 *   S.8  Meta-confidence (confidence-of-confidence)
 *
 * Pure in-memory; bounded capacity; no IO.
 */

// ───────────────────────── S.1 Kalman trend ──────────────────────────────
export function kalmanTrendS(prices: number[]): number {
  if (!prices || prices.length < 2) return prices?.[prices.length - 1] ?? 0;
  let x = prices[0], p = 1;
  const q = 1e-4, r = 1e-2;
  for (let i = 1; i < prices.length; i++) {
    p += q;
    const k = p / (p + r);
    x = x + k * (prices[i] - x);
    p = (1 - k) * p;
  }
  return x;
}
export function kalmanTrendMultiplierS(price: number, kalman: number): number {
  if (!price || !kalman) return 1.0;
  const dev = (price - kalman) / kalman;
  if (dev > 0.05) return 1.05;
  if (dev < -0.05) return 0.95;
  return 1.0;
}

// ───────────────────────── S.2 Hurst exponent ────────────────────────────
export function hurstS(returns: number[]): number {
  if (!returns || returns.length < 20) return 0.5;
  const lags = [2, 4, 8, 16];
  const tau: number[] = [];
  for (const lag of lags) {
    const diffs: number[] = [];
    for (let i = lag; i < returns.length; i++) diffs.push(returns[i] - returns[i - lag]);
    const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const v = diffs.reduce((a, b) => a + (b - mean) ** 2, 0) / diffs.length;
    tau.push(Math.sqrt(Math.max(v, 1e-12)));
  }
  // log-log slope
  const lx = lags.map((l) => Math.log(l));
  const ly = tau.map((t) => Math.log(t));
  const mx = lx.reduce((a, b) => a + b, 0) / lx.length;
  const my = ly.reduce((a, b) => a + b, 0) / ly.length;
  let num = 0, den = 0;
  for (let i = 0; i < lx.length; i++) { num += (lx[i] - mx) * (ly[i] - my); den += (lx[i] - mx) ** 2; }
  const h = den > 0 ? num / den : 0.5;
  return Math.max(0, Math.min(1, h));
}
export function hurstMultiplierS(h: number, signalDir: number): number {
  // Trending market favours directional; mean-reverting favours fades.
  if (h > 0.6 && signalDir !== 0) return 1.06;
  if (h < 0.4 && signalDir !== 0) return 0.94;
  return 1.0;
}

// ───────────────────────── S.3 CUSUM change-point ────────────────────────
export function cusumChangeS(returns: number[], threshold = 5): boolean {
  if (!returns || returns.length < 20) return false;
  const tail = returns.slice(-60);
  const mean = tail.reduce((a, b) => a + b, 0) / tail.length;
  const sd = Math.sqrt(tail.reduce((a, b) => a + (b - mean) ** 2, 0) / tail.length) || 1e-6;
  let posS = 0, negS = 0;
  for (const r of tail) {
    const z = (r - mean) / sd;
    posS = Math.max(0, posS + z - 0.5);
    negS = Math.max(0, negS - z - 0.5);
    if (posS > threshold || negS > threshold) return true;
  }
  return false;
}
export function cusumMultiplierS(changed: boolean): number {
  return changed ? 0.92 : 1.0;
}

// ───────────────────────── S.4 Information Coefficient ───────────────────
type ICSample = { signal: number; realised: number };
const icBuf = new Map<string, ICSample[]>();
const IC_CAP = 200;
export function recordICSampleS(feature: string, signal: number, realised: number): void {
  const a = icBuf.get(feature) ?? [];
  a.push({ signal, realised });
  if (a.length > IC_CAP) a.shift();
  icBuf.set(feature, a);
}
function spearman(xs: number[], ys: number[]): number {
  if (xs.length < 5) return 0;
  const rank = (arr: number[]) => {
    const idx = arr.map((v, i) => [v, i] as [number, number]).sort((a, b) => a[0] - b[0]);
    const r = new Array(arr.length).fill(0);
    idx.forEach(([, i], k) => { r[i] = k + 1; });
    return r;
  };
  const rx = rank(xs), ry = rank(ys);
  const n = xs.length;
  let d2 = 0;
  for (let i = 0; i < n; i++) d2 += (rx[i] - ry[i]) ** 2;
  return 1 - (6 * d2) / (n * (n * n - 1));
}
export function icScoreS(feature: string): number {
  const a = icBuf.get(feature);
  if (!a || a.length < 20) return 0;
  return spearman(a.map((s) => s.signal), a.map((s) => s.realised));
}
export function icMultiplierS(features: string[]): number {
  if (!features.length) return 1.0;
  const ics = features.map((f) => icScoreS(f)).filter((x) => x !== 0);
  if (!ics.length) return 1.0;
  const avg = ics.reduce((a, b) => a + b, 0) / ics.length;
  // avg IC in [-0.3..0.3] → multiplier [0.9..1.1]
  return Math.max(0.9, Math.min(1.1, 1 + Math.max(-0.3, Math.min(0.3, avg)) / 3));
}

// ───────────────────────── S.5 Vol-targeting ─────────────────────────────
export function volTargetMultiplierS(returns: number[], targetAnnualVol = 0.15): number {
  if (!returns || returns.length < 20) return 1.0;
  const tail = returns.slice(-30);
  const mean = tail.reduce((a, b) => a + b, 0) / tail.length;
  const dailyVol = Math.sqrt(tail.reduce((a, b) => a + (b - mean) ** 2, 0) / tail.length) || 1e-6;
  const annualVol = dailyVol * Math.sqrt(252);
  // Scale confidence by ratio, clipped tightly.
  const ratio = targetAnnualVol / annualVol;
  return Math.max(0.85, Math.min(1.15, ratio));
}

// ───────────────────────── S.6 Pairs spread z-score ──────────────────────
const priceCache = new Map<string, number[]>();
export function cachePriceForPairsS(symbol: string, price: number): void {
  const a = priceCache.get(symbol) ?? [];
  a.push(price);
  if (a.length > 120) a.shift();
  priceCache.set(symbol, a);
}
export function pairsZScoreS(symbol: string, peerSymbol: string): number {
  const a = priceCache.get(symbol), b = priceCache.get(peerSymbol);
  if (!a || !b || a.length < 30 || b.length < 30) return 0;
  const n = Math.min(a.length, b.length);
  const sa = a.slice(-n), sb = b.slice(-n);
  const ratio = sa.map((p, i) => p / (sb[i] || 1e-9));
  const m = ratio.reduce((x, y) => x + y, 0) / ratio.length;
  const sd = Math.sqrt(ratio.reduce((x, y) => x + (y - m) ** 2, 0) / ratio.length) || 1e-6;
  return (ratio[ratio.length - 1] - m) / sd;
}
export function pairsMultiplierS(z: number): number {
  // Extreme spread → mean-revert opportunity if dir aligns with reversion.
  if (Math.abs(z) < 1.5) return 1.0;
  return z > 2 ? 0.95 : z < -2 ? 1.05 : 1.0;
}

// ───────────────────────── S.7 Order-flow imbalance ──────────────────────
export function orderFlowImbalanceS(c: { open: number; high: number; low: number; close: number }): number {
  const range = c.high - c.low;
  if (range <= 0) return 0;
  return (c.close - c.open) / range; // [-1..1]
}
export function orderFlowMultiplierS(ofi: number, signalDir: number): number {
  if (!signalDir) return 1.0;
  const aligned = Math.sign(ofi) === Math.sign(signalDir);
  const mag = Math.min(1, Math.abs(ofi));
  return aligned ? 1 + mag * 0.06 : 1 - mag * 0.06;
}

// ───────────────────────── S.8 Meta-confidence ───────────────────────────
type MetaSample = { features: number[]; correct: number };
const metaBuf: MetaSample[] = [];
const META_CAP = 500;
let metaW: number[] = [0, 0, 0, 0];
let metaB = 0;
function sigmoid(x: number): number { return 1 / (1 + Math.exp(-x)); }
export function recordMetaConfidenceS(features: number[], won: boolean): void {
  const f = features.slice(0, 4);
  while (f.length < 4) f.push(0);
  metaBuf.push({ features: f, correct: won ? 1 : 0 });
  if (metaBuf.length > META_CAP) metaBuf.shift();
  // Online SGD step.
  const z = f.reduce((s, x, i) => s + metaW[i] * x, metaB);
  const p = sigmoid(z);
  const err = (won ? 1 : 0) - p;
  const lr = 0.02;
  metaW = metaW.map((w, i) => w + lr * err * f[i]);
  metaB += lr * err;
}
export function metaConfidenceS(features: number[]): number {
  if (metaBuf.length < 30) return 1.0;
  const f = features.slice(0, 4);
  while (f.length < 4) f.push(0);
  const z = f.reduce((s, x, i) => s + metaW[i] * x, metaB);
  const p = sigmoid(z); // 0..1
  // Trust-scaled multiplier in [0.85..1.10]
  return Math.max(0.85, Math.min(1.10, 0.85 + p * 0.25));
}

// ─────────────────── State snapshot/restore ───────────────────────────────
export function snapshotTierSState(): unknown {
  return {
    ic: Array.from(icBuf.entries()),
    metaW, metaB,
    metaBuf: metaBuf.slice(-200),
  };
}
export function restoreTierSState(s: unknown): void {
  const o = s as Partial<{
    ic: Array<[string, ICSample[]]>;
    metaW: number[]; metaB: number;
    metaBuf: MetaSample[];
  }>;
  if (!o) return;
  if (o.ic) for (const [k, v] of o.ic) icBuf.set(k, v.slice(-IC_CAP));
  if (o.metaW && o.metaW.length === 4) metaW = o.metaW;
  if (typeof o.metaB === "number") metaB = o.metaB;
  if (o.metaBuf) metaBuf.push(...o.metaBuf.slice(-META_CAP));
}