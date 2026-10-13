/**
 * Tier-U intelligence layer.
 * --------------------------------------------------------------------------
 *   U.1  Isotonic regression calibration (monotone, no-shape)
 *   U.2  Conformal quantile residuals (per-quantile bands)
 *   U.3  Bayesian Online Changepoint Detection (BOCPD-lite)
 *   U.4  Transfer entropy between module signals
 *   U.5  SGLD posterior sampler (weight ensemble)
 *   U.6  EVT / GPD tail-risk multiplier
 *   U.7  Symbol-specific adaptive learning rate
 *   U.8  Rolling cross-validation OOF tracker
 *
 * Pure in-memory, bounded, no IO.
 */

// ───────────────────────── U.1 Isotonic calibration ──────────────────────
type IsoSample = { x: number; y: 0 | 1 };
const isoBuf: IsoSample[] = [];
const ISO_CAP = 600;
let isoBins: { x: number; y: number }[] = [];
export function recordIsotonicOutcomeU(score: number, won: boolean): void {
  isoBuf.push({ x: score, y: won ? 1 : 0 });
  if (isoBuf.length > ISO_CAP) isoBuf.shift();
  if (isoBuf.length % 25 === 0) refitIsotonic();
}
function refitIsotonic(): void {
  if (isoBuf.length < 30) return;
  const sorted = [...isoBuf].sort((a, b) => a.x - b.x);
  // Pool Adjacent Violators
  const bins: { x: number; y: number; w: number }[] = sorted.map((s) => ({ x: s.x, y: s.y, w: 1 }));
  let i = 0;
  while (i < bins.length - 1) {
    if (bins[i].y > bins[i + 1].y) {
      const wsum = bins[i].w + bins[i + 1].w;
      const ysum = (bins[i].y * bins[i].w + bins[i + 1].y * bins[i + 1].w) / wsum;
      const xsum = (bins[i].x * bins[i].w + bins[i + 1].x * bins[i + 1].w) / wsum;
      bins.splice(i, 2, { x: xsum, y: ysum, w: wsum });
      if (i > 0) i--;
    } else i++;
  }
  isoBins = bins.map((b) => ({ x: b.x, y: b.y }));
}
export function isotonicCalibrateU(rawConf: number): number {
  if (isoBins.length < 3) return rawConf;
  const x = rawConf;
  if (x <= isoBins[0].x) return isoBins[0].y * 100;
  if (x >= isoBins[isoBins.length - 1].x) return isoBins[isoBins.length - 1].y * 100;
  for (let i = 0; i < isoBins.length - 1; i++) {
    if (x >= isoBins[i].x && x <= isoBins[i + 1].x) {
      const t = (x - isoBins[i].x) / (isoBins[i + 1].x - isoBins[i].x || 1e-9);
      return (isoBins[i].y + t * (isoBins[i + 1].y - isoBins[i].y)) * 100;
    }
  }
  return rawConf;
}

// ───────────────────────── U.2 Conformal quantile residuals ──────────────
const qResid: number[] = [];
const Q_CAP = 400;
export function recordQuantileResidualU(predicted: number, realised: number): void {
  qResid.push(realised - predicted);
  if (qResid.length > Q_CAP) qResid.shift();
}
export function conformalQuantileU(predicted: number, alpha = 0.1): { lower: number; upper: number } {
  if (qResid.length < 20) return { lower: predicted, upper: predicted };
  const sorted = [...qResid].sort((a, b) => a - b);
  const lo = sorted[Math.floor((alpha / 2) * sorted.length)];
  const hi = sorted[Math.floor((1 - alpha / 2) * sorted.length)];
  return { lower: predicted + lo, upper: predicted + hi };
}
export function conformalWidthMultiplierU(predicted: number): number {
  if (qResid.length < 20) return 1.0;
  const { lower, upper } = conformalQuantileU(predicted);
  const width = upper - lower;
  // Wide band → low trust.
  if (width > 0.20) return 0.92;
  if (width < 0.05) return 1.05;
  return 1.0;
}

// ───────────────────────── U.3 BOCPD-lite ────────────────────────────────
let runLength = 0;
let bocpdMean = 0, bocpdM2 = 0, bocpdN = 0;
export function bocpdUpdateU(value: number): { runLength: number; changeProb: number } {
  bocpdN++;
  const delta = value - bocpdMean;
  bocpdMean += delta / bocpdN;
  bocpdM2 += delta * (value - bocpdMean);
  const variance = bocpdN > 1 ? bocpdM2 / (bocpdN - 1) : 1e-6;
  const sd = Math.sqrt(Math.max(variance, 1e-9));
  const z = Math.abs((value - bocpdMean) / sd);
  // Hazard-style change probability from z.
  const changeProb = 1 - Math.exp(-z * 0.5);
  if (changeProb > 0.85) { runLength = 0; bocpdMean = value; bocpdM2 = 0; bocpdN = 1; }
  else runLength++;
  return { runLength, changeProb };
}
export function bocpdMultiplierU(): number {
  if (bocpdN < 10) return 1.0;
  if (runLength < 3) return 0.88; // very fresh regime, distrust
  if (runLength < 10) return 0.95;
  return 1.0;
}

// ───────────────────────── U.4 Transfer entropy (proxy) ──────────────────
const modSig = new Map<string, number[]>();
const TE_CAP = 200;
export function recordModuleSignalU(name: string, sig: number): void {
  const a = modSig.get(name) ?? [];
  a.push(sig);
  if (a.length > TE_CAP) a.shift();
  modSig.set(name, a);
}
function te(src: number[], dst: number[]): number {
  // Lag-1 mutual-information proxy via correlation of sign(src_{t-1}) with sign(dst_t).
  const n = Math.min(src.length, dst.length);
  if (n < 20) return 0;
  let hits = 0;
  for (let i = 1; i < n; i++) if (Math.sign(src[i - 1]) === Math.sign(dst[i])) hits++;
  return Math.max(0, hits / (n - 1) - 0.5) * 2; // 0..1
}
export function transferEntropyLeaderMultiplierU(active: string[]): number {
  if (active.length < 2) return 1.0;
  const arrs = active.map((n) => modSig.get(n) ?? []);
  let bestLead = 0;
  for (let i = 0; i < arrs.length; i++) {
    for (let j = 0; j < arrs.length; j++) {
      if (i === j) continue;
      const t = te(arrs[i], arrs[j]);
      if (t > bestLead) bestLead = t;
    }
  }
  // Strong leader → ×1.05; nothing leads → 1.0.
  return 1 + Math.min(0.05, bestLead * 0.1);
}

// ───────────────────────── U.5 SGLD posterior ensemble ───────────────────
let sgldW: number[][] = [[0, 0, 0, 0]];
const SGLD_CAP = 8;
function gaussian(): number {
  const u = Math.random() || 1e-9, v = Math.random() || 1e-9;
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
export function sgldUpdateU(features: number[], target: number): void {
  const f = features.slice(0, 4); while (f.length < 4) f.push(0);
  const lr = 0.01, sigma = 0.005;
  const w = sgldW[sgldW.length - 1].slice();
  const pred = f.reduce((s, x, i) => s + w[i] * x, 0);
  const err = target - pred;
  for (let i = 0; i < 4; i++) w[i] += lr * err * f[i] + sigma * gaussian();
  sgldW.push(w);
  if (sgldW.length > SGLD_CAP) sgldW.shift();
}
export function sgldUncertaintyMultiplierU(features: number[]): number {
  if (sgldW.length < 3) return 1.0;
  const f = features.slice(0, 4); while (f.length < 4) f.push(0);
  const preds = sgldW.map((w) => f.reduce((s, x, i) => s + w[i] * x, 0));
  const m = preds.reduce((a, b) => a + b, 0) / preds.length;
  const v = preds.reduce((a, b) => a + (b - m) ** 2, 0) / preds.length;
  const sd = Math.sqrt(v);
  // High disagreement → low trust.
  if (sd > 0.5) return 0.92;
  if (sd < 0.1) return 1.04;
  return 1.0;
}

// ───────────────────────── U.6 EVT / GPD tail risk ───────────────────────
const losses: number[] = [];
const LOSS_CAP = 500;
export function recordLossU(realisedPct: number): void {
  losses.push(realisedPct);
  if (losses.length > LOSS_CAP) losses.shift();
}
export function evtTailMultiplierU(): number {
  if (losses.length < 50) return 1.0;
  const sorted = [...losses].sort((a, b) => a - b);
  // Worst 10%
  const tail = sorted.slice(0, Math.max(5, Math.floor(sorted.length * 0.1)));
  const meanTail = tail.reduce((a, b) => a + b, 0) / tail.length;
  // CVaR very negative → market punishing; reduce trust.
  if (meanTail < -0.10) return 0.88;
  if (meanTail < -0.06) return 0.94;
  return 1.0;
}

// ───────────────────────── U.7 Per-symbol adaptive LR ────────────────────
const symStats = new Map<string, { vol: number; trades: number }>();
export function recordSymbolTradeU(symbol: string, ret: number): void {
  const s = symStats.get(symbol) ?? { vol: 0.02, trades: 0 };
  s.vol = 0.95 * s.vol + 0.05 * Math.abs(ret);
  s.trades++;
  symStats.set(symbol, s);
}
export function symbolLearningRateU(symbol: string): number {
  const s = symStats.get(symbol);
  if (!s || s.trades < 5) return 0.02;
  // High vol & many trades → faster LR; quiet → slower.
  const lr = 0.005 + Math.min(0.05, s.vol * 2);
  return lr;
}
export function symbolAdaptiveMultiplierU(symbol: string): number {
  const s = symStats.get(symbol);
  if (!s || s.trades < 10) return 1.0;
  // Symbols with stable high-vol history get a tiny trust bonus.
  if (s.vol > 0.03 && s.trades > 20) return 1.02;
  return 1.0;
}

// ───────────────────────── U.8 Rolling CV OOF accuracy ───────────────────
const oofBuf: { pred: number; won: 0 | 1 }[] = [];
const OOF_CAP = 300;
export function recordOOFSampleU(predConf: number, won: boolean): void {
  oofBuf.push({ pred: predConf, won: won ? 1 : 0 });
  if (oofBuf.length > OOF_CAP) oofBuf.shift();
}
export function oofAccuracyU(): number {
  if (oofBuf.length < 30) return 0.5;
  let hits = 0;
  for (const s of oofBuf) {
    const pred = s.pred >= 50 ? 1 : 0;
    if (pred === s.won) hits++;
  }
  return hits / oofBuf.length;
}
export function oofRegularizerMultiplierU(): number {
  const acc = oofAccuracyU();
  if (oofBuf.length < 30) return 1.0;
  // Overfitting detector: train-time conf high but OOF acc low → dampen.
  if (acc < 0.45) return 0.90;
  if (acc < 0.52) return 0.96;
  if (acc > 0.62) return 1.04;
  return 1.0;
}

// ─────────────────── State snapshot/restore ───────────────────────────────
export function snapshotTierUState(): unknown {
  return {
    isoBuf: isoBuf.slice(-300), isoBins,
    qResid: qResid.slice(-200),
    runLength, bocpdMean, bocpdM2, bocpdN,
    modSig: Array.from(modSig.entries()).map(([k, v]) => [k, v.slice(-100)]),
    sgldW: sgldW.slice(-SGLD_CAP),
    losses: losses.slice(-300),
    symStats: Array.from(symStats.entries()),
    oofBuf: oofBuf.slice(-200),
  };
}
export function restoreTierUState(s: unknown): void {
  const o = s as Partial<{
    isoBuf: IsoSample[]; isoBins: { x: number; y: number }[];
    qResid: number[];
    runLength: number; bocpdMean: number; bocpdM2: number; bocpdN: number;
    modSig: Array<[string, number[]]>;
    sgldW: number[][];
    losses: number[];
    symStats: Array<[string, { vol: number; trades: number }]>;
    oofBuf: { pred: number; won: 0 | 1 }[];
  }>;
  if (!o) return;
  if (o.isoBuf) isoBuf.push(...o.isoBuf.slice(-ISO_CAP));
  if (o.isoBins) isoBins = o.isoBins;
  if (o.qResid) qResid.push(...o.qResid.slice(-Q_CAP));
  if (typeof o.runLength === "number") runLength = o.runLength;
  if (typeof o.bocpdMean === "number") bocpdMean = o.bocpdMean;
  if (typeof o.bocpdM2 === "number") bocpdM2 = o.bocpdM2;
  if (typeof o.bocpdN === "number") bocpdN = o.bocpdN;
  if (o.modSig) for (const [k, v] of o.modSig) modSig.set(k, v.slice(-TE_CAP));
  if (o.sgldW && o.sgldW.length) sgldW = o.sgldW.slice(-SGLD_CAP);
  if (o.losses) losses.push(...o.losses.slice(-LOSS_CAP));
  if (o.symStats) for (const [k, v] of o.symStats) symStats.set(k, v);
  if (o.oofBuf) oofBuf.push(...o.oofBuf.slice(-OOF_CAP));
}