/**
 * Tier-T intelligence layer.
 * --------------------------------------------------------------------------
 *   T.1  HMM transition-probability multiplier (regime stability)
 *   T.2  GARCH(1,1) vol forecast multiplier
 *   T.3  Bayesian Beta posterior per arm (regime × signal family)
 *   T.4  Mutual information / concentration risk across module signals
 *   T.5  KS-test drift detector with meta-reset hook
 *   T.6  Permutation feature importance
 *   T.7  Online multiplicative-weights ensemble
 *   T.8  Platt-scaling confidence calibrator
 *
 * Pure in-memory, bounded capacity, no IO.
 */

// ───────────────────────── T.1 HMM transition stability ──────────────────
type HmmState = "bull" | "bear" | "chop";
const hmmHist: HmmState[] = [];
const HMM_CAP = 400;
const hmmCounts = new Map<string, number>(); // "from->to" → count
function classifyHmm(rets: number[]): HmmState {
  if (!rets.length) return "chop";
  const tail = rets.slice(-20);
  const m = tail.reduce((a, b) => a + b, 0) / tail.length;
  const v = tail.reduce((a, b) => a + (b - m) ** 2, 0) / tail.length;
  if (v > 0.0009 && Math.abs(m) < 0.001) return "chop";
  return m > 0 ? "bull" : "bear";
}
export function recordHmmStateT(rets: number[]): HmmState {
  const s = classifyHmm(rets);
  const prev = hmmHist[hmmHist.length - 1];
  if (prev) {
    const k = `${prev}->${s}`;
    hmmCounts.set(k, (hmmCounts.get(k) ?? 0) + 1);
  }
  hmmHist.push(s);
  if (hmmHist.length > HMM_CAP) hmmHist.shift();
  return s;
}
export function hmmTransitionMultiplierT(rets: number[]): number {
  const cur = classifyHmm(rets);
  const prev = hmmHist[hmmHist.length - 1] ?? cur;
  // P(stay) high → market is stable, trust signal more.
  let total = 0, stay = 0;
  for (const [k, v] of hmmCounts) {
    if (k.startsWith(`${prev}->`)) { total += v; if (k === `${prev}->${prev}`) stay += v; }
  }
  if (total < 10) return 1.0;
  const pStay = stay / total;
  // pStay ∈ [0..1] → mult ∈ [0.92..1.08]
  return 0.92 + pStay * 0.16;
}

// ───────────────────────── T.2 GARCH(1,1) vol forecast ───────────────────
let garchSigma2 = 0.0001;
const GARCH = { omega: 0.000002, alpha: 0.08, beta: 0.9 };
export function updateGarchT(ret: number): void {
  garchSigma2 = GARCH.omega + GARCH.alpha * ret * ret + GARCH.beta * garchSigma2;
}
export function garchVolMultiplierT(rets: number[]): number {
  if (!rets.length) return 1.0;
  for (const r of rets.slice(-30)) updateGarchT(r);
  const fcastVol = Math.sqrt(garchSigma2 * 252);
  // Forecast vol > 0.35 → reduce trust; < 0.10 → boost mildly.
  if (fcastVol > 0.35) return 0.92;
  if (fcastVol < 0.10) return 1.04;
  return 1.0;
}

// ───────────────────────── T.3 Bayesian Beta posterior arms ──────────────
const beta = new Map<string, { a: number; b: number }>();
export function recordBetaOutcomeT(arm: string, won: boolean): void {
  const x = beta.get(arm) ?? { a: 1, b: 1 };
  if (won) x.a += 1; else x.b += 1;
  beta.set(arm, x);
}
export function betaMultiplierT(arm: string): number {
  const x = beta.get(arm);
  if (!x || x.a + x.b < 8) return 1.0;
  const mean = x.a / (x.a + x.b); // 0..1
  // Map mean ∈ [0.3..0.7] → [0.9..1.1]
  const clipped = Math.max(0.3, Math.min(0.7, mean));
  return 0.9 + (clipped - 0.3) * 0.5;
}

// ───────────────────────── T.4 Concentration / MI proxy ──────────────────
export function concentrationMultiplierT(signals: number[]): number {
  if (signals.length < 3) return 1.0;
  const abs = signals.map((s) => Math.abs(s));
  const tot = abs.reduce((a, b) => a + b, 0) || 1e-9;
  // Herfindahl on |signal| shares: high → one module dominates.
  const h = abs.reduce((acc, v) => acc + (v / tot) ** 2, 0);
  // h ∈ [1/n .. 1]. > 0.6 → too concentrated → 0.95.
  if (h > 0.6) return 0.95;
  if (h < 0.25) return 1.04;
  return 1.0;
}

// ───────────────────────── T.5 KS-test drift detector ────────────────────
const refDist = new Map<string, number[]>();
const curDist = new Map<string, number[]>();
const DIST_CAP = 200;
let driftResetFlag = false;
export function recordFeatureDistT(feature: string, value: number, ref: boolean): void {
  const buf = (ref ? refDist : curDist).get(feature) ?? [];
  buf.push(value);
  if (buf.length > DIST_CAP) buf.shift();
  (ref ? refDist : curDist).set(feature, buf);
}
function ksStat(a: number[], b: number[]): number {
  const sa = [...a].sort((x, y) => x - y), sb = [...b].sort((x, y) => x - y);
  let i = 0, j = 0, d = 0;
  while (i < sa.length && j < sb.length) {
    if (sa[i] <= sb[j]) i++; else j++;
    d = Math.max(d, Math.abs(i / sa.length - j / sb.length));
  }
  return d;
}
export function ksDriftMultiplierT(feature: string): number {
  const a = refDist.get(feature), b = curDist.get(feature);
  if (!a || !b || a.length < 30 || b.length < 30) return 1.0;
  const d = ksStat(a, b);
  // Critical ~ 1.36 * sqrt((n+m)/(n*m)) at α=0.05.
  const crit = 1.36 * Math.sqrt((a.length + b.length) / (a.length * b.length));
  if (d > crit * 1.5) { driftResetFlag = true; return 0.9; }
  if (d > crit) return 0.95;
  return 1.0;
}
export function consumeDriftResetT(): boolean {
  const v = driftResetFlag; driftResetFlag = false; return v;
}

// ───────────────────────── T.6 Permutation feature importance ────────────
type PermSample = { features: Record<string, number>; pnl: number };
const permBuf: PermSample[] = [];
const PERM_CAP = 300;
export function recordPermSampleT(features: Record<string, number>, pnl: number): void {
  permBuf.push({ features, pnl });
  if (permBuf.length > PERM_CAP) permBuf.shift();
}
function corr(xs: number[], ys: number[]): number {
  const n = xs.length; if (n < 5) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) { const ax = xs[i] - mx, ay = ys[i] - my; num += ax * ay; dx += ax * ax; dy += ay * ay; }
  const den = Math.sqrt(dx * dy); return den > 0 ? num / den : 0;
}
export function featureImportanceT(name: string): number {
  if (permBuf.length < 30) return 0;
  const xs = permBuf.map((s) => s.features[name] ?? 0);
  const ys = permBuf.map((s) => s.pnl);
  return Math.abs(corr(xs, ys));
}
export function permImportanceMultiplierT(activeFeatures: string[]): number {
  if (!activeFeatures.length) return 1.0;
  const imps = activeFeatures.map((f) => featureImportanceT(f));
  const avg = imps.reduce((a, b) => a + b, 0) / imps.length;
  // avg ∈ [0..0.5] → multiplier [0.95..1.08]
  return Math.max(0.95, Math.min(1.08, 0.95 + avg * 0.26));
}

// ───────────────────────── T.7 Multiplicative weights ensemble ───────────
const mwWeights = new Map<string, number>();
const MW_ETA = 0.05;
export function recordMWOutcomeT(module: string, signal: number, pnl: number): void {
  const w = mwWeights.get(module) ?? 1.0;
  // Loss in [-1..1]: opposite-sign signal/pnl is bad.
  const loss = Math.tanh(-signal * pnl * 10);
  const next = Math.max(0.1, Math.min(5.0, w * Math.exp(-MW_ETA * loss)));
  mwWeights.set(module, next);
}
export function mwEnsembleMultiplierT(modules: string[]): number {
  if (!modules.length) return 1.0;
  const ws = modules.map((m) => mwWeights.get(m) ?? 1.0);
  const avg = ws.reduce((a, b) => a + b, 0) / ws.length;
  // avg ∈ [0.5..1.5] → [0.92..1.08]
  return Math.max(0.92, Math.min(1.08, 0.92 + (avg - 0.5) * 0.16));
}

// ───────────────────────── T.8 Platt scaling calibrator ──────────────────
let plattA = -1, plattB = 0;
type PlattSample = { score: number; won: 0 | 1 };
const plattBuf: PlattSample[] = [];
const PLATT_CAP = 500;
function sigmoid(x: number): number { return 1 / (1 + Math.exp(-x)); }
export function recordPlattOutcomeT(score: number, won: boolean): void {
  plattBuf.push({ score, won: won ? 1 : 0 });
  if (plattBuf.length > PLATT_CAP) plattBuf.shift();
  // Single SGD step on logistic loss.
  const z = plattA * score + plattB;
  const p = sigmoid(z);
  const err = (won ? 1 : 0) - p;
  const lr = 0.01;
  plattA += lr * err * score;
  plattB += lr * err;
}
export function plattCalibrateT(rawConf: number): number {
  if (plattBuf.length < 30) return rawConf;
  const score = (rawConf - 50) / 50;
  const p = sigmoid(plattA * score + plattB);
  return Math.max(0, Math.min(100, p * 100));
}

// ─────────────────── State snapshot/restore ───────────────────────────────
export function snapshotTierTState(): unknown {
  return {
    hmmHist: hmmHist.slice(-200),
    hmmCounts: Array.from(hmmCounts.entries()),
    garchSigma2,
    beta: Array.from(beta.entries()),
    refDist: Array.from(refDist.entries()),
    curDist: Array.from(curDist.entries()),
    permBuf: permBuf.slice(-150),
    mwWeights: Array.from(mwWeights.entries()),
    plattA, plattB, plattBuf: plattBuf.slice(-200),
  };
}
export function restoreTierTState(s: unknown): void {
  const o = s as Partial<{
    hmmHist: HmmState[];
    hmmCounts: Array<[string, number]>;
    garchSigma2: number;
    beta: Array<[string, { a: number; b: number }]>;
    refDist: Array<[string, number[]]>;
    curDist: Array<[string, number[]]>;
    permBuf: PermSample[];
    mwWeights: Array<[string, number]>;
    plattA: number; plattB: number; plattBuf: PlattSample[];
  }>;
  if (!o) return;
  if (o.hmmHist) hmmHist.push(...o.hmmHist.slice(-HMM_CAP));
  if (o.hmmCounts) for (const [k, v] of o.hmmCounts) hmmCounts.set(k, v);
  if (typeof o.garchSigma2 === "number") garchSigma2 = o.garchSigma2;
  if (o.beta) for (const [k, v] of o.beta) beta.set(k, v);
  if (o.refDist) for (const [k, v] of o.refDist) refDist.set(k, v.slice(-DIST_CAP));
  if (o.curDist) for (const [k, v] of o.curDist) curDist.set(k, v.slice(-DIST_CAP));
  if (o.permBuf) permBuf.push(...o.permBuf.slice(-PERM_CAP));
  if (o.mwWeights) for (const [k, v] of o.mwWeights) mwWeights.set(k, v);
  if (typeof o.plattA === "number") plattA = o.plattA;
  if (typeof o.plattB === "number") plattB = o.plattB;
  if (o.plattBuf) plattBuf.push(...o.plattBuf.slice(-PLATT_CAP));
}