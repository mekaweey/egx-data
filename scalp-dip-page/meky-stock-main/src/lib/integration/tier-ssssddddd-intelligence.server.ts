/**
 * Tier SSSS–DDDDD — Adaptive learning, risk intelligence, adversarial robustness.
 * Pure in-memory + snapshot/restore. JS-native, no external deps.
 *
 *  SSSS  onlineLearningSGD                 (per-feature online SGD weights)
 *  TTTT  transferLearningCrossMarket       (cross-market prior transfer)
 *  UUUU  fewShotPatternRecognition         (cosine match on rare patterns)
 *  VVVV  contrastiveRepresentationLearning (win/loss centroid contrast)
 *  WWWW  kellyCriterionPositionSizing      (Kelly edge boost / shrink)
 *  XXXX  correlationRegimeDetection        (crisis regime via avg pairwise ρ)
 *  YYYY  tailRiskCVaR                      (Conditional VaR @ 5%)
 *  ZZZZ  regimeSwitchingHMM                (4-state market regime)
 *  AAAAA adversarialRobustnessTesting      (input-perturb stability)
 *  BBBBB counterfactualReasoning           (causal what-if delta)
 *  CCCCC ensembleStackingMetaLearner       (per-regime, per-tier hit-rate)
 *  DDDDD bayesianModelAveraging            (posterior weights by log-lik)
 */

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const variance = (a: number[]) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return a.reduce((s, v) => s + (v - m) * (v - m), 0) / (a.length - 1);
};
const std = (a: number[]) => Math.sqrt(variance(a));
const dot = (a: number[], b: number[]) => {
  const n = Math.min(a.length, b.length);
  let s = 0;
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
};
const norm = (a: number[]) => Math.sqrt(dot(a, a));
const cosine = (a: number[], b: number[]) => {
  const d = norm(a) * norm(b);
  return d === 0 ? 0 : dot(a, b) / d;
};
const toBounded = (raw: number, dowAdjusted: number): number =>
  Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * raw));

// ═════════════ SSSS: Online SGD ══════════════════════════════════════════════
const sgdWeights: Record<string, number> = {};
let sgdBias = 0;
const SGD_LR = 0.01;

export function recordSGDOutcomeSSSS(features: Record<string, number>, realised: number): void {
  if (!Number.isFinite(realised)) return;
  // Predict
  let pred = sgdBias;
  for (const [k, v] of Object.entries(features)) {
    if (!Number.isFinite(v)) continue;
    pred += (sgdWeights[k] ?? 0) * v;
  }
  const err = realised - pred;
  // Gradient step (clipped)
  const clipped = clamp(err, -5, 5);
  sgdBias += SGD_LR * clipped;
  for (const [k, v] of Object.entries(features)) {
    if (!Number.isFinite(v)) continue;
    sgdWeights[k] = (sgdWeights[k] ?? 0) + SGD_LR * clipped * v;
    // L2 shrinkage
    sgdWeights[k] *= 0.9995;
  }
}

export function sgdMultiplierSSSS(features: Record<string, number>, dir: number): number {
  if (Object.keys(sgdWeights).length < 3) return 1;
  let pred = sgdBias;
  for (const [k, v] of Object.entries(features)) {
    if (!Number.isFinite(v)) continue;
    pred += (sgdWeights[k] ?? 0) * v;
  }
  const aligned = Math.sign(pred) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(pred) > 1) return 1.05;
  if (!aligned && Math.abs(pred) > 1.5) return 0.93;
  return 1;
}

// ═════════════ TTTT: Transfer learning (cross-market) ════════════════════════
const sourceMarketReturns: number[] = []; // proxy "global" market
const symbolReturns: Record<string, number[]> = {};

export function recordSourceReturnTTTT(ret: number): void {
  if (!Number.isFinite(ret)) return;
  sourceMarketReturns.push(ret);
  if (sourceMarketReturns.length > 500) sourceMarketReturns.shift();
}

export function recordSymbolReturnTTTT(symbol: string, ret: number): void {
  if (!Number.isFinite(ret)) return;
  const a = symbolReturns[symbol] ?? (symbolReturns[symbol] = []);
  a.push(ret);
  if (a.length > 200) a.shift();
}

export function transferMultiplierTTTT(symbol: string, dir: number): number {
  const local = symbolReturns[symbol];
  if (sourceMarketReturns.length < 30) return 1;
  const sourceMean = mean(sourceMarketReturns.slice(-30));
  // If local data is sparse, lean on source prior
  if (!local || local.length < 20) {
    const aligned = Math.sign(sourceMean) === Math.sign(dir) && Math.sign(dir) !== 0;
    if (aligned && Math.abs(sourceMean) > 0.3) return 1.04;
    if (!aligned && Math.abs(sourceMean) > 0.5) return 0.94;
  }
  return 1;
}

// ═════════════ UUUU: Few-shot pattern recognition ════════════════════════════
type PatternTemplate = { vec: number[]; outcome: number };
const patternBank: PatternTemplate[] = [];

export function recordPatternTemplateUUUU(features: number[], realised: number): void {
  if (!features.every(Number.isFinite) || !Number.isFinite(realised)) return;
  // Only keep "rare" extreme outcomes
  if (Math.abs(realised) < 3) return;
  patternBank.push({ vec: features.slice(), outcome: realised });
  if (patternBank.length > 100) patternBank.shift();
}

export function fewShotMultiplierUUUU(features: number[], dir: number): number {
  if (patternBank.length < 5 || features.length === 0) return 1;
  let bestSim = -1, bestOutcome = 0;
  for (const p of patternBank) {
    if (p.vec.length !== features.length) continue;
    const sim = cosine(p.vec, features);
    if (sim > bestSim) { bestSim = sim; bestOutcome = p.outcome; }
  }
  if (bestSim < 0.85) return 1;
  const aligned = Math.sign(bestOutcome) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned) return 1.06;
  if (!aligned) return 0.9;
  return 1;
}

// ═════════════ VVVV: Contrastive centroids (win/loss) ════════════════════════
const winCentroid: { sum: number[]; count: number } = { sum: [], count: 0 };
const lossCentroid: { sum: number[]; count: number } = { sum: [], count: 0 };

export function recordContrastiveVVVV(features: number[], won: boolean): void {
  if (!features.every(Number.isFinite)) return;
  const target = won ? winCentroid : lossCentroid;
  if (target.sum.length === 0) target.sum = new Array(features.length).fill(0);
  if (target.sum.length !== features.length) return;
  for (let i = 0; i < features.length; i++) target.sum[i] += features[i];
  target.count += 1;
}

export function contrastiveMultiplierVVVV(features: number[]): number {
  if (winCentroid.count < 10 || lossCentroid.count < 10) return 1;
  if (winCentroid.sum.length !== features.length) return 1;
  const win = winCentroid.sum.map((v) => v / winCentroid.count);
  const loss = lossCentroid.sum.map((v) => v / lossCentroid.count);
  const simWin = cosine(features, win);
  const simLoss = cosine(features, loss);
  const margin = simWin - simLoss;
  if (margin > 0.15) return 1.05;
  if (margin < -0.15) return 0.9;
  return 1;
}

// ═════════════ WWWW: Kelly criterion ═════════════════════════════════════════
const kellyHistory: { won: boolean; pct: number }[] = [];

export function recordKellyOutcomeWWWW(won: boolean, realisedPct: number): void {
  if (!Number.isFinite(realisedPct)) return;
  kellyHistory.push({ won, pct: realisedPct });
  if (kellyHistory.length > 500) kellyHistory.shift();
}

export function kellyMultiplierWWWW(): number {
  if (kellyHistory.length < 30) return 1;
  const wins = kellyHistory.filter((h) => h.won);
  const losses = kellyHistory.filter((h) => !h.won);
  if (!wins.length || !losses.length) return 1;
  const p = wins.length / kellyHistory.length;
  const b = mean(wins.map((h) => Math.abs(h.pct)));
  const a = mean(losses.map((h) => Math.abs(h.pct)));
  if (a === 0) return 1;
  // Kelly fraction f* = (b·p − (1−p)·a) / (b·a)
  const f = (b * p - (1 - p) * a) / (b * a);
  if (f > 0.15) return 1.06;
  if (f > 0.05) return 1.02;
  if (f < -0.05) return 0.88;
  return 1;
}

// ═════════════ XXXX: Correlation regime detection ════════════════════════════
const corrReturnsByDate: Record<string, Record<string, number>> = {};
let lastCorrAvg = 0;

export function recordCorrReturnXXXX(date: string, symbol: string, ret: number): void {
  if (!Number.isFinite(ret)) return;
  const day = corrReturnsByDate[date] ?? (corrReturnsByDate[date] = {});
  day[symbol] = ret;
  const keys = Object.keys(corrReturnsByDate);
  if (keys.length > 60) delete corrReturnsByDate[keys[0]];
}

function computeAvgPairwiseCorr(): number {
  const dates = Object.keys(corrReturnsByDate).sort().slice(-30);
  if (dates.length < 15) return 0;
  const symbols = new Set<string>();
  for (const d of dates) for (const s of Object.keys(corrReturnsByDate[d])) symbols.add(s);
  const syms = Array.from(symbols);
  if (syms.length < 3) return 0;
  const series: Record<string, number[]> = {};
  for (const s of syms) series[s] = dates.map((d) => corrReturnsByDate[d][s] ?? 0);
  let total = 0, n = 0;
  for (let i = 0; i < syms.length; i++) {
    for (let j = i + 1; j < syms.length; j++) {
      const a = series[syms[i]], b = series[syms[j]];
      const ma = mean(a), mb = mean(b);
      let num = 0, da = 0, db = 0;
      for (let k = 0; k < a.length; k++) {
        num += (a[k] - ma) * (b[k] - mb);
        da += (a[k] - ma) ** 2;
        db += (b[k] - mb) ** 2;
      }
      const denom = Math.sqrt(da * db);
      if (denom > 0) { total += num / denom; n++; }
    }
  }
  return n > 0 ? total / n : 0;
}

export function correlationRegimeMultiplierXXXX(): number {
  const r = computeAvgPairwiseCorr();
  lastCorrAvg = r;
  // High avg correlation (>0.6) = crisis / single-factor market → de-risk
  if (r > 0.7) return 0.85;
  if (r > 0.55) return 0.93;
  if (r < 0.2) return 1.03; // healthy dispersion
  return 1;
}

export function getLastCorrelationAvgXXXX(): number { return lastCorrAvg; }

// ═════════════ YYYY: Tail risk CVaR ══════════════════════════════════════════
const cvarReturns: number[] = [];

export function recordReturnYYYY(ret: number): void {
  if (!Number.isFinite(ret)) return;
  cvarReturns.push(ret);
  if (cvarReturns.length > 500) cvarReturns.shift();
}

export function cvarMultiplierYYYY(): number {
  if (cvarReturns.length < 30) return 1;
  const sorted = [...cvarReturns].sort((a, b) => a - b);
  const cut = Math.max(1, Math.floor(sorted.length * 0.05));
  const tail = sorted.slice(0, cut);
  const cvar = mean(tail); // negative value
  if (cvar < -7) return 0.82;
  if (cvar < -4) return 0.92;
  if (cvar > -1.5) return 1.02; // benign tail
  return 1;
}

// ═════════════ ZZZZ: Regime-switching (HMM-lite) ═════════════════════════════
const regimeReturns: number[] = [];

export function recordRegimeReturnZZZZ(ret: number): void {
  if (!Number.isFinite(ret)) return;
  regimeReturns.push(ret);
  if (regimeReturns.length > 200) regimeReturns.shift();
}

export type HmmRegime = "bull" | "bear" | "sideways" | "crash";

export function detectHmmRegimeZZZZ(): HmmRegime {
  if (regimeReturns.length < 10) return "sideways";
  const recent = regimeReturns.slice(-20);
  const m = mean(recent);
  const v = std(recent);
  if (v > 3.5 && m < -0.5) return "crash";
  if (m > 0.3 && v < 2.5) return "bull";
  if (m < -0.3 && v < 2.5) return "bear";
  return "sideways";
}

export function hmmRegimeMultiplierZZZZ(dir: number): number {
  const r = detectHmmRegimeZZZZ();
  if (r === "crash") return 0.78;
  if (r === "bear" && dir > 0) return 0.9;
  if (r === "bear" && dir < 0) return 1.04;
  if (r === "bull" && dir > 0) return 1.05;
  if (r === "bull" && dir < 0) return 0.93;
  return 1;
}

// ═════════════ AAAAA: Adversarial robustness ═════════════════════════════════
export function adversarialRobustnessMultiplierAAAAA(
  features: number[],
  scoreFn: (perturbed: number[]) => number,
  noiseScale = 0.05,
): number {
  if (features.length === 0) return 1;
  try {
    const base = scoreFn(features);
    const samples: number[] = [];
    for (let t = 0; t < 8; t++) {
      const perturbed = features.map((v) => v * (1 + (Math.random() - 0.5) * 2 * noiseScale));
      samples.push(scoreFn(perturbed));
    }
    const drift = std(samples);
    const range = Math.max(...samples) - Math.min(...samples);
    if (!Number.isFinite(base)) return 1;
    // Highly unstable under tiny perturbation → reduce
    if (drift > 8 || range > 20) return 0.85;
    if (drift > 4 || range > 12) return 0.94;
    return 1;
  } catch { return 1; }
}

// ═════════════ BBBBB: Counterfactual reasoning ═══════════════════════════════
type CFSample = { feature: number; outcome: number };
const cfSamples: Record<string, CFSample[]> = {};

export function recordCounterfactualBBBBB(featureName: string, value: number, realised: number): void {
  if (!Number.isFinite(value) || !Number.isFinite(realised)) return;
  const a = cfSamples[featureName] ?? (cfSamples[featureName] = []);
  a.push({ feature: value, outcome: realised });
  if (a.length > 300) a.shift();
}

export function counterfactualMultiplierBBBBB(
  featureName: string,
  actualValue: number,
  counterfactualValue: number,
  dir: number,
): number {
  const arr = cfSamples[featureName];
  if (!arr || arr.length < 20) return 1;
  // Estimate ∂outcome/∂feature via OLS slope
  const xs = arr.map((s) => s.feature);
  const ys = arr.map((s) => s.outcome);
  const mx = mean(xs), my = mean(ys);
  let num = 0, den = 0;
  for (let i = 0; i < xs.length; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
  if (den === 0) return 1;
  const slope = num / den;
  const delta = (actualValue - counterfactualValue) * slope;
  const aligned = Math.sign(delta) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(delta) > 0.5) return 1.03;
  if (!aligned && Math.abs(delta) > 1) return 0.95;
  return 1;
}

// ═════════════ CCCCC: Ensemble stacking meta-learner ═════════════════════════
type StackKey = string; // regime|tier
const stackHits: Record<StackKey, { hits: number; total: number }> = {};

export function recordStackOutcomeCCCCC(regime: string, tier: string, won: boolean): void {
  const k = `${regime}|${tier}`;
  const s = stackHits[k] ?? (stackHits[k] = { hits: 0, total: 0 });
  if (won) s.hits++;
  s.total++;
}

export function stackWeightCCCCC(regime: string, tier: string): number {
  const s = stackHits[`${regime}|${tier}`];
  if (!s || s.total < 8) return 1;
  const rate = s.hits / s.total;
  // Map hit-rate to multiplier: 0.5 → neutral, 0.65 → 1.05, 0.35 → 0.93
  if (rate > 0.65) return 1.05;
  if (rate > 0.55) return 1.02;
  if (rate < 0.35) return 0.9;
  if (rate < 0.45) return 0.96;
  return 1;
}

export function stackMultiplierCCCCC(regime: string, activeTiers: string[]): number {
  if (!activeTiers.length) return 1;
  let prod = 1;
  for (const t of activeTiers) prod *= stackWeightCCCCC(regime, t);
  // Bound aggregate
  return clamp(prod, 0.8, 1.15);
}

// ═════════════ DDDDD: Bayesian model averaging ═══════════════════════════════
const bmaLogLik: Record<string, number> = {}; // cumulative log-likelihood proxy
const bmaCount: Record<string, number> = {};

export function recordBMAOutcomeDDDDD(model: string, prediction: number, realised: number): void {
  if (!Number.isFinite(prediction) || !Number.isFinite(realised)) return;
  // Gaussian likelihood (σ=2)
  const err = realised - prediction;
  const ll = -0.5 * (err * err) / 4 - Math.log(Math.sqrt(2 * Math.PI * 4));
  bmaLogLik[model] = (bmaLogLik[model] ?? 0) + ll;
  bmaCount[model] = (bmaCount[model] ?? 0) + 1;
}

export function bmaWeightsDDDDD(models: string[]): Record<string, number> {
  const eligible = models.filter((m) => (bmaCount[m] ?? 0) >= 5);
  if (eligible.length === 0) {
    const uniform: Record<string, number> = {};
    for (const m of models) uniform[m] = 1 / Math.max(1, models.length);
    return uniform;
  }
  const avgLL: Record<string, number> = {};
  for (const m of eligible) avgLL[m] = bmaLogLik[m] / bmaCount[m];
  const maxLL = Math.max(...Object.values(avgLL));
  const exps: Record<string, number> = {};
  let sum = 0;
  for (const m of eligible) { exps[m] = Math.exp(avgLL[m] - maxLL); sum += exps[m]; }
  const out: Record<string, number> = {};
  for (const m of models) out[m] = sum > 0 && exps[m] !== undefined ? exps[m] / sum : 0;
  return out;
}

export function bmaMultiplierDDDDD(predictions: Record<string, number>, dir: number): number {
  const models = Object.keys(predictions);
  if (models.length < 2) return 1;
  const w = bmaWeightsDDDDD(models);
  let combined = 0;
  for (const m of models) combined += (w[m] ?? 0) * predictions[m];
  const aligned = Math.sign(combined) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(combined) > 1) return 1.04;
  if (!aligned && Math.abs(combined) > 1.5) return 0.94;
  return 1;
}

// Helper for orchestrator to apply a multiplier in standard bounded fashion
export function applyBoundedMultiplier(dowAdjusted: number, m: number): number {
  if (m === 1) return dowAdjusted;
  return toBounded(m, dowAdjusted);
}

// ───────────────────────── Snapshot / Restore ────────────────────────────────
export function snapshotTierSSSSDDDDDState(): unknown {
  return {
    sgdWeights, sgdBias,
    sourceMarketReturns: sourceMarketReturns.slice(-500),
    symbolReturns,
    patternBank: patternBank.slice(-100),
    winCentroid, lossCentroid,
    kellyHistory: kellyHistory.slice(-500),
    corrReturnsByDate,
    cvarReturns: cvarReturns.slice(-500),
    regimeReturns: regimeReturns.slice(-200),
    cfSamples,
    stackHits, bmaLogLik, bmaCount,
  };
}

export function restoreTierSSSSDDDDDState(s: unknown): void {
  try {
    const d = s as Partial<{
      sgdWeights: Record<string, number>; sgdBias: number;
      sourceMarketReturns: number[];
      symbolReturns: typeof symbolReturns;
      patternBank: PatternTemplate[];
      winCentroid: typeof winCentroid; lossCentroid: typeof lossCentroid;
      kellyHistory: typeof kellyHistory;
      corrReturnsByDate: typeof corrReturnsByDate;
      cvarReturns: number[]; regimeReturns: number[];
      cfSamples: typeof cfSamples;
      stackHits: typeof stackHits;
      bmaLogLik: Record<string, number>; bmaCount: Record<string, number>;
    }>;
    if (d.sgdWeights) Object.assign(sgdWeights, d.sgdWeights);
    if (typeof d.sgdBias === "number") sgdBias = d.sgdBias;
    if (Array.isArray(d.sourceMarketReturns)) { sourceMarketReturns.length = 0; sourceMarketReturns.push(...d.sourceMarketReturns); }
    if (d.symbolReturns) Object.assign(symbolReturns, d.symbolReturns);
    if (Array.isArray(d.patternBank)) { patternBank.length = 0; patternBank.push(...d.patternBank); }
    if (d.winCentroid) { winCentroid.sum = d.winCentroid.sum ?? []; winCentroid.count = d.winCentroid.count ?? 0; }
    if (d.lossCentroid) { lossCentroid.sum = d.lossCentroid.sum ?? []; lossCentroid.count = d.lossCentroid.count ?? 0; }
    if (Array.isArray(d.kellyHistory)) { kellyHistory.length = 0; kellyHistory.push(...d.kellyHistory); }
    if (d.corrReturnsByDate) Object.assign(corrReturnsByDate, d.corrReturnsByDate);
    if (Array.isArray(d.cvarReturns)) { cvarReturns.length = 0; cvarReturns.push(...d.cvarReturns); }
    if (Array.isArray(d.regimeReturns)) { regimeReturns.length = 0; regimeReturns.push(...d.regimeReturns); }
    if (d.cfSamples) Object.assign(cfSamples, d.cfSamples);
    if (d.stackHits) Object.assign(stackHits, d.stackHits);
    if (d.bmaLogLik) Object.assign(bmaLogLik, d.bmaLogLik);
    if (d.bmaCount) Object.assign(bmaCount, d.bmaCount);
  } catch { /* noop */ }
}