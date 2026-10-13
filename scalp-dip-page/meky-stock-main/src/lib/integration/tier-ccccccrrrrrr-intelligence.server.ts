/**
 * Tier CCCCCC–RRRRRR — Bayesian/Stacked ensembles, advanced CV, deep microstructure,
 * smarter training, production trust metrics. Pure in-memory, JS-native.
 *
 *   CCCCCC bayesianModelAveraging
 *   DDDDDD stackedMetaLearner
 *   EEEEEE quantileRegressionForest
 *   FFFFFF purgedKFoldLeakageDetector
 *   GGGGGG orderFlowToxicityV2 (VPIN bucket)
 *   HHHHHH leadLagGrangerNetwork
 *   IIIIII dccGarchRegimeCorrelations
 *   JJJJJJ twoScaleRealizedVolatility
 *   KKKKKK activeLearningUncertaintySampling
 *   LLLLLL ewcContinualLearning
 *   MMMMMM smoteTimeSeriesOversampling
 *   NNNNNN curriculumLearningScheduler
 *   OOOOOO probabilityOfBacktestOverfitting (PBO)
 *   PPPPPP deflatedSharpeRatio
 *   QQQQQQ liveVsBacktestDivergence
 *   RRRRRR shapFeatureImportanceDrift
 */

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const variance = (a: number[]) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return a.reduce((s, v) => s + (v - m) * (v - m), 0) / (a.length - 1);
};
const std = (a: number[]) => Math.sqrt(variance(a));

// ═════════════ CCCCCC: Bayesian Model Averaging ══════════════════════════════
// Weight each model by posterior probability it's correct, given recent evidence.
const bmaEvidence: Record<string, { pred: number; outcome: number }[]> = {};

export function recordBMASampleCCCCCC(model: string, pred: number, outcome: number): void {
  if (!Number.isFinite(pred) || !Number.isFinite(outcome)) return;
  const a = bmaEvidence[model] ?? (bmaEvidence[model] = []);
  a.push({ pred, outcome });
  if (a.length > 200) a.shift();
}

export function bmaWeightsCCCCCC(models: string[]): Record<string, number> {
  const liks: Record<string, number> = {};
  for (const m of models) {
    const arr = bmaEvidence[m];
    if (!arr || arr.length < 10) { liks[m] = 1; continue; }
    const mse = mean(arr.map((s) => (s.pred - s.outcome) ** 2));
    liks[m] = Math.exp(-mse * 4); // Gaussian-style likelihood
  }
  const sum = Object.values(liks).reduce((a, b) => a + b, 0);
  if (sum === 0) return Object.fromEntries(models.map((m) => [m, 1 / models.length]));
  return Object.fromEntries(Object.entries(liks).map(([k, v]) => [k, v / sum]));
}

export function bmaMultiplierCCCCCC(models: string[]): number {
  const w = bmaWeightsCCCCCC(models);
  const vals = Object.values(w);
  if (vals.length < 2) return 1;
  // High entropy = uncertainty; low entropy (one model dominates with evidence) = trust
  const ent = -vals.reduce((s, p) => s + (p > 0 ? p * Math.log(p) : 0), 0);
  const maxEnt = Math.log(vals.length);
  const normEnt = ent / maxEnt;
  if (normEnt < 0.5) return 1.04;  // clear winner
  if (normEnt > 0.95) return 0.96; // models disagree
  return 1;
}

// ═════════════ DDDDDD: Stacked Meta-Learner ═════════════════════════════════
// Logistic regression on base-model outputs to predict win/loss.
const stackData: { features: number[]; won: boolean }[] = [];
let stackW: number[] = [];
let stackB = 0;

export function recordStackedDDDDDD(featuresVec: number[], won: boolean): void {
  if (!featuresVec.every(Number.isFinite)) return;
  stackData.push({ features: featuresVec.slice(), won });
  if (stackData.length > 1000) stackData.shift();
  if (stackData.length % 50 === 0) fitStackedDDDDDD();
}

function fitStackedDDDDDD(): void {
  if (stackData.length < 50) return;
  const dim = stackData[0].features.length;
  if (stackW.length !== dim) stackW = new Array(dim).fill(0);
  const lr = 0.01;
  for (let iter = 0; iter < 80; iter++) {
    const gW = new Array(dim).fill(0); let gB = 0;
    for (const d of stackData) {
      let z = stackB;
      for (let i = 0; i < dim; i++) z += stackW[i] * d.features[i];
      const p = 1 / (1 + Math.exp(-z));
      const err = p - (d.won ? 1 : 0);
      for (let i = 0; i < dim; i++) gW[i] += err * d.features[i];
      gB += err;
    }
    for (let i = 0; i < dim; i++) stackW[i] -= lr * gW[i] / stackData.length;
    stackB -= lr * gB / stackData.length;
  }
}

export function stackedMultiplierDDDDDD(featuresVec: number[]): number {
  if (stackData.length < 50 || stackW.length !== featuresVec.length) return 1;
  let z = stackB;
  for (let i = 0; i < featuresVec.length; i++) z += stackW[i] * featuresVec[i];
  const p = 1 / (1 + Math.exp(-z));
  // p > 0.6 → boost; p < 0.4 → shrink
  if (p > 0.65) return 1.06;
  if (p > 0.55) return 1.02;
  if (p < 0.35) return 0.92;
  if (p < 0.45) return 0.97;
  return 1;
}

// ═════════════ EEEEEE: Quantile Regression (P10/P50/P90 proxy) ══════════════
const qrfReturns: Record<string, number[]> = {};

export function recordReturnEEEEEE(symbol: string, ret: number): void {
  if (!Number.isFinite(ret)) return;
  const a = qrfReturns[symbol] ?? (qrfReturns[symbol] = []);
  a.push(ret);
  if (a.length > 250) a.shift();
}

export function quantilesEEEEEE(symbol: string): { p10: number; p50: number; p90: number } | null {
  const arr = qrfReturns[symbol];
  if (!arr || arr.length < 30) return null;
  const s = [...arr].sort((a, b) => a - b);
  const q = (p: number) => s[Math.floor(p * s.length)];
  return { p10: q(0.1), p50: q(0.5), p90: q(0.9) };
}

export function quantileMultiplierEEEEEE(symbol: string, dir: number): number {
  const q = quantilesEEEEEE(symbol);
  if (!q) return 1;
  const skew = (q.p90 - q.p50) - (q.p50 - q.p10);
  // Positive skew = upside fat tail; align with direction
  if (skew > 0.01 && dir > 0) return 1.04;
  if (skew < -0.01 && dir < 0) return 1.04;
  if (skew > 0.01 && dir < 0) return 0.95;
  if (skew < -0.01 && dir > 0) return 0.95;
  return 1;
}

// ═════════════ FFFFFF: Purged K-Fold leakage detector ═══════════════════════
const foldOutcomes: { fold: number; pred: number; outcome: number; time: number }[] = [];

export function recordFoldFFFFFF(fold: number, pred: number, outcome: number, time: number = Date.now()): void {
  if (![pred, outcome].every(Number.isFinite)) return;
  foldOutcomes.push({ fold, pred, outcome, time });
  if (foldOutcomes.length > 1000) foldOutcomes.shift();
}

export function leakageScoreFFFFFF(): number {
  if (foldOutcomes.length < 50) return 0;
  const folds = new Set(foldOutcomes.map((f) => f.fold));
  const perFoldAcc: number[] = [];
  for (const f of folds) {
    const sub = foldOutcomes.filter((x) => x.fold === f);
    const acc = sub.filter((x) => Math.sign(x.pred) === Math.sign(x.outcome)).length / sub.length;
    perFoldAcc.push(acc);
  }
  // If variance across folds is suspiciously LOW + accuracy high → likely leakage
  const v = variance(perFoldAcc);
  const m = mean(perFoldAcc);
  if (m > 0.7 && v < 0.005) return 1; // suspicious
  return 0;
}

export function leakageMultiplierFFFFFF(): number {
  return leakageScoreFFFFFF() > 0.5 ? 0.9 : 1;
}

// ═════════════ GGGGGG: Order Flow Toxicity V2 (VPIN bucket clock) ═══════════
const vpinBuckets: Record<string, { buy: number; sell: number }[]> = {};

export function recordVPINBucketGGGGGG(symbol: string, buyVol: number, sellVol: number): void {
  if (!Number.isFinite(buyVol) || !Number.isFinite(sellVol)) return;
  const a = vpinBuckets[symbol] ?? (vpinBuckets[symbol] = []);
  a.push({ buy: buyVol, sell: sellVol });
  if (a.length > 50) a.shift();
}

export function vpinV2GGGGGG(symbol: string): number {
  const a = vpinBuckets[symbol];
  if (!a || a.length < 10) return 0;
  const recent = a.slice(-20);
  return mean(recent.map((b) => Math.abs(b.buy - b.sell) / Math.max(1, b.buy + b.sell)));
}

export function toxicityMultiplierGGGGGG(symbol: string): number {
  const v = vpinV2GGGGGG(symbol);
  if (v > 0.4) return 0.9;  // toxic flow → avoid
  if (v > 0.25) return 0.96;
  return 1;
}

// ═════════════ HHHHHH: Lead-Lag Granger network ═════════════════════════════
const llSeries: Record<string, number[]> = {};

export function recordLLReturnHHHHHH(symbol: string, ret: number): void {
  if (!Number.isFinite(ret)) return;
  const a = llSeries[symbol] ?? (llSeries[symbol] = []);
  a.push(ret);
  if (a.length > 100) a.shift();
}

function grangerScore(X: number[], Y: number[], lag = 1): number {
  const n = Math.min(X.length, Y.length) - lag;
  if (n < 20) return 0;
  // Restricted: Y[t] from Y[t-1]. Unrestricted: Y[t] from Y[t-1], X[t-1].
  let ssrR = 0, ssrU = 0;
  for (let i = lag; i < lag + n; i++) {
    const predR = Y[i - 1];
    const predU = 0.5 * Y[i - 1] + 0.5 * X[i - 1];
    ssrR += (Y[i] - predR) ** 2;
    ssrU += (Y[i] - predU) ** 2;
  }
  if (ssrU === 0) return 0;
  return Math.max(0, (ssrR - ssrU) / ssrU);
}

export function leadLagMultiplierHHHHHH(leader: string, target: string, leaderDir: number, dir: number): number {
  const X = llSeries[leader], Y = llSeries[target];
  if (!X || !Y || X.length < 30) return 1;
  const g = grangerScore(X, Y);
  if (g < 0.05) return 1;
  const aligned = Math.sign(leaderDir) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && g > 0.15) return 1.05;
  if (!aligned && g > 0.2) return 0.93;
  return 1;
}

// ═════════════ IIIIII: DCC-GARCH-lite regime correlations ════════════════════
let dccRegimeCorr = 0.3;

export function updateDCCIIIIII(retA: number, retB: number, lambda = 0.94): void {
  if (![retA, retB].every(Number.isFinite)) return;
  const instantCorr = Math.sign(retA) === Math.sign(retB) ? Math.abs(retA * retB) * 100 : -Math.abs(retA * retB) * 100;
  dccRegimeCorr = lambda * dccRegimeCorr + (1 - lambda) * clamp(instantCorr, -1, 1);
}

export function dccCorrelationIIIIII(): number { return dccRegimeCorr; }

export function dccMultiplierIIIIII(): number {
  // Very high correlation regime = systemic risk = de-risk
  if (dccRegimeCorr > 0.8) return 0.92;
  if (dccRegimeCorr < 0.1) return 1.03; // diversification benefit
  return 1;
}

// ═════════════ JJJJJJ: Two-Scale Realized Volatility (noise-filtered) ═══════
export function twoScaleRVJJJJJJ(returns: number[]): number {
  if (returns.length < 20) return 0;
  const slow = returns.filter((_, i) => i % 5 === 0);
  const rvFast = returns.reduce((s, r) => s + r * r, 0);
  const rvSlow = slow.reduce((s, r) => s + r * r, 0) * 5;
  // TSRV = slow - bias-adjusted fast
  return Math.max(0, rvSlow - (rvFast - rvSlow) * 0.2);
}

export function tsrvMultiplierJJJJJJ(returns: number[]): number {
  if (returns.length < 20) return 1;
  const tsrv = twoScaleRVJJJJJJ(returns);
  const rv = returns.reduce((s, r) => s + r * r, 0);
  if (rv === 0) return 1;
  const noiseRatio = 1 - tsrv / rv;
  if (noiseRatio > 0.5) return 0.95; // mostly noise
  if (noiseRatio < 0.15) return 1.03; // clean signal
  return 1;
}

// ═════════════ KKKKKK: Active learning uncertainty sampling ═════════════════
const uncertainQueue: { symbol: string; score: number; width: number; time: number }[] = [];

export function queueUncertainKKKKKK(symbol: string, score: number, intervalWidth: number): void {
  if (intervalWidth < 5) return; // confident enough
  uncertainQueue.push({ symbol, score, width: intervalWidth, time: Date.now() });
  uncertainQueue.sort((a, b) => b.width - a.width);
  if (uncertainQueue.length > 100) uncertainQueue.length = 100;
}

export function getUncertainPicksKKKKKK(n = 10): typeof uncertainQueue {
  return uncertainQueue.slice(0, n);
}

export function activeLearningMultiplierKKKKKK(symbol: string): number {
  const q = uncertainQueue.find((u) => u.symbol === symbol);
  if (!q) return 1;
  // Reduce confidence in regions we're actively learning about
  return 0.96;
}

// ═════════════ LLLLLL: EWC continual learning (anti-forgetting) ═════════════
const ewcAnchors: { weights: Record<string, number>; fisher: Record<string, number> }[] = [];

export function snapshotEWCLLLLLL(weights: Record<string, number>): void {
  const fisher: Record<string, number> = {};
  for (const k of Object.keys(weights)) fisher[k] = Math.abs(weights[k]) + 0.01;
  ewcAnchors.push({ weights: { ...weights }, fisher });
  if (ewcAnchors.length > 5) ewcAnchors.shift();
}

export function ewcPenaltyLLLLLL(currentWeights: Record<string, number>): number {
  if (ewcAnchors.length === 0) return 0;
  let penalty = 0;
  for (const anchor of ewcAnchors) {
    for (const k of Object.keys(anchor.weights)) {
      const cur = currentWeights[k] ?? 0;
      penalty += anchor.fisher[k] * (cur - anchor.weights[k]) ** 2;
    }
  }
  return penalty / ewcAnchors.length;
}

export function ewcMultiplierLLLLLL(currentWeights: Record<string, number>): number {
  const p = ewcPenaltyLLLLLL(currentWeights);
  if (p > 2) return 0.95; // weights drifted too far from anchors
  return 1;
}

// ═════════════ MMMMMM: SMOTE-TS synthetic oversampling (training-side metric) ═
const classBalance = { wins: 0, losses: 0 };

export function recordClassMMMMMM(won: boolean): void {
  if (won) classBalance.wins++; else classBalance.losses++;
}

export function imbalanceRatioMMMMMM(): number {
  const total = classBalance.wins + classBalance.losses;
  if (total < 20) return 1;
  return Math.min(classBalance.wins, classBalance.losses) / Math.max(1, Math.max(classBalance.wins, classBalance.losses));
}

export function smoteMultiplierMMMMMM(): number {
  const r = imbalanceRatioMMMMMM();
  // Severe imbalance → model likely biased → distrust raw confidence
  if (r < 0.3) return 0.93;
  if (r < 0.5) return 0.98;
  return 1;
}

// ═════════════ NNNNNN: Curriculum learning scheduler ═══════════════════════
let curriculumLevel = 0; // 0 = easy, 1 = medium, 2 = hard
const curriculumPerf: number[] = [];

export function recordCurriculumPerfNNNNNN(accuracy: number): void {
  if (!Number.isFinite(accuracy)) return;
  curriculumPerf.push(accuracy);
  if (curriculumPerf.length > 50) curriculumPerf.shift();
  if (curriculumPerf.length >= 20) {
    const recent = mean(curriculumPerf.slice(-20));
    if (recent > 0.65 && curriculumLevel < 2) curriculumLevel++;
    else if (recent < 0.45 && curriculumLevel > 0) curriculumLevel--;
  }
}

export function curriculumMultiplierNNNNNN(volatility: number): number {
  // Easy phase = avoid high-vol; hard phase = embrace it
  if (curriculumLevel === 0 && volatility > 0.04) return 0.92;
  if (curriculumLevel === 2 && volatility > 0.04) return 1.02;
  return 1;
}

export function getCurriculumLevelNNNNNN(): number { return curriculumLevel; }

// ═════════════ OOOOOO: Probability of Backtest Overfitting (PBO) ════════════
const btReturns: number[][] = []; // each row = a backtest config's returns

export function recordBacktestOOOOOO(configReturns: number[]): void {
  if (!Array.isArray(configReturns) || configReturns.length < 10) return;
  btReturns.push(configReturns.slice());
  if (btReturns.length > 50) btReturns.shift();
}

export function pboOOOOOO(): number {
  if (btReturns.length < 4) return 0.5;
  // Combinatorial split: best in-sample vs out-of-sample rank
  const n = btReturns.length;
  const mid = Math.floor(btReturns[0].length / 2);
  const isSharpe = btReturns.map((r) => {
    const half = r.slice(0, mid);
    const m = mean(half), s = std(half);
    return s === 0 ? 0 : m / s;
  });
  const oosSharpe = btReturns.map((r) => {
    const half = r.slice(mid);
    const m = mean(half), s = std(half);
    return s === 0 ? 0 : m / s;
  });
  const bestIS = isSharpe.indexOf(Math.max(...isSharpe));
  const oosRank = oosSharpe.slice().sort((a, b) => b - a).indexOf(oosSharpe[bestIS]);
  return oosRank / Math.max(1, n - 1); // 0 = no overfit, 1 = severe
}

export function pboMultiplierOOOOOO(): number {
  const p = pboOOOOOO();
  if (p > 0.7) return 0.88; // backtest results likely overfit
  if (p > 0.5) return 0.96;
  return 1;
}

// ═════════════ PPPPPP: Deflated Sharpe Ratio ════════════════════════════════
let trialsCount = 0;
const allTrialSharpes: number[] = [];

export function recordTrialSharpePPPPPP(sharpe: number): void {
  if (!Number.isFinite(sharpe)) return;
  trialsCount++;
  allTrialSharpes.push(sharpe);
  if (allTrialSharpes.length > 500) allTrialSharpes.shift();
}

export function deflatedSharpePPPPPP(observedSharpe: number, n: number = 252): number {
  if (allTrialSharpes.length < 5) return observedSharpe;
  const v = variance(allTrialSharpes);
  const expectedMaxSR = Math.sqrt(2 * Math.log(Math.max(2, trialsCount))) * Math.sqrt(v);
  const dsr = (observedSharpe - expectedMaxSR) * Math.sqrt(n - 1);
  return dsr;
}

export function deflatedSharpeMultiplierPPPPPP(observedSharpe: number): number {
  const dsr = deflatedSharpePPPPPP(observedSharpe);
  if (dsr < 0) return 0.9;   // no real edge after deflation
  if (dsr > 2) return 1.04;  // genuine edge
  return 1;
}

// ═════════════ QQQQQQ: Live vs Backtest divergence ══════════════════════════
let backtestExpectedPnl = 0;
const liveRecentPnl: number[] = [];

export function setBacktestExpectedQQQQQQ(expectedDailyPnl: number): void {
  if (Number.isFinite(expectedDailyPnl)) backtestExpectedPnl = expectedDailyPnl;
}

export function recordLivePnlQQQQQQ(pnl: number): void {
  if (!Number.isFinite(pnl)) return;
  liveRecentPnl.push(pnl);
  if (liveRecentPnl.length > 30) liveRecentPnl.shift();
}

export function divergenceScoreQQQQQQ(): number {
  if (liveRecentPnl.length < 10) return 0;
  const liveAvg = mean(liveRecentPnl);
  const sigma = std(liveRecentPnl) || 1;
  return Math.abs(liveAvg - backtestExpectedPnl) / sigma;
}

export function divergenceMultiplierQQQQQQ(): number {
  const d = divergenceScoreQQQQQQ();
  if (d > 2.5) return 0.85; // live materially worse/different than backtest
  if (d > 1.5) return 0.94;
  return 1;
}

// ═════════════ RRRRRR: SHAP-based feature importance drift ══════════════════
const shapHistory: { time: number; importances: Record<string, number> }[] = [];

export function recordShapSnapshotRRRRRR(importances: Record<string, number>): void {
  shapHistory.push({ time: Date.now(), importances: { ...importances } });
  if (shapHistory.length > 50) shapHistory.shift();
}

export function shapDriftRRRRRR(): number {
  if (shapHistory.length < 4) return 0;
  const oldSnap = shapHistory[0].importances;
  const newSnap = shapHistory[shapHistory.length - 1].importances;
  const keys = new Set([...Object.keys(oldSnap), ...Object.keys(newSnap)]);
  let totalDiff = 0, totalMag = 0;
  for (const k of keys) {
    const a = oldSnap[k] ?? 0;
    const b = newSnap[k] ?? 0;
    totalDiff += Math.abs(a - b);
    totalMag += Math.abs(a) + Math.abs(b);
  }
  if (totalMag === 0) return 0;
  return totalDiff / totalMag;
}

export function shapDriftMultiplierRRRRRR(): number {
  const d = shapDriftRRRRRR();
  if (d > 0.6) return 0.92; // features the model relies on have shifted
  if (d > 0.4) return 0.97;
  return 1;
}

// ═════════════ Snapshot / Restore ════════════════════════════════════════════
export function snapshotTierCCCCCCRRRRRRState(): unknown {
  return {
    bmaEvidence,
    stackData: stackData.slice(-1000), stackW, stackB,
    qrfReturns,
    foldOutcomes: foldOutcomes.slice(-1000),
    vpinBuckets, llSeries,
    dccRegimeCorr,
    uncertainQueue: uncertainQueue.slice(0, 100),
    ewcAnchors,
    classBalance,
    curriculumLevel, curriculumPerf: curriculumPerf.slice(-50),
    btReturns: btReturns.slice(-50),
    trialsCount, allTrialSharpes: allTrialSharpes.slice(-500),
    backtestExpectedPnl, liveRecentPnl: liveRecentPnl.slice(-30),
    shapHistory: shapHistory.slice(-50),
  };
}

export function restoreTierCCCCCCRRRRRRState(s: unknown): void {
  try {
    const d = s as Record<string, unknown>;
    if (d.bmaEvidence) Object.assign(bmaEvidence, d.bmaEvidence as typeof bmaEvidence);
    if (Array.isArray(d.stackData)) { stackData.length = 0; stackData.push(...(d.stackData as typeof stackData)); }
    if (Array.isArray(d.stackW)) stackW = d.stackW as number[];
    if (typeof d.stackB === "number") stackB = d.stackB;
    if (d.qrfReturns) Object.assign(qrfReturns, d.qrfReturns as typeof qrfReturns);
    if (Array.isArray(d.foldOutcomes)) { foldOutcomes.length = 0; foldOutcomes.push(...(d.foldOutcomes as typeof foldOutcomes)); }
    if (d.vpinBuckets) Object.assign(vpinBuckets, d.vpinBuckets as typeof vpinBuckets);
    if (d.llSeries) Object.assign(llSeries, d.llSeries as typeof llSeries);
    if (typeof d.dccRegimeCorr === "number") dccRegimeCorr = d.dccRegimeCorr;
    if (Array.isArray(d.uncertainQueue)) { uncertainQueue.length = 0; uncertainQueue.push(...(d.uncertainQueue as typeof uncertainQueue)); }
    if (Array.isArray(d.ewcAnchors)) { ewcAnchors.length = 0; ewcAnchors.push(...(d.ewcAnchors as typeof ewcAnchors)); }
    if (d.classBalance && typeof d.classBalance === "object") Object.assign(classBalance, d.classBalance);
    if (typeof d.curriculumLevel === "number") curriculumLevel = d.curriculumLevel;
    if (Array.isArray(d.curriculumPerf)) { curriculumPerf.length = 0; curriculumPerf.push(...(d.curriculumPerf as number[])); }
    if (Array.isArray(d.btReturns)) { btReturns.length = 0; btReturns.push(...(d.btReturns as number[][])); }
    if (typeof d.trialsCount === "number") trialsCount = d.trialsCount;
    if (Array.isArray(d.allTrialSharpes)) { allTrialSharpes.length = 0; allTrialSharpes.push(...(d.allTrialSharpes as number[])); }
    if (typeof d.backtestExpectedPnl === "number") backtestExpectedPnl = d.backtestExpectedPnl;
    if (Array.isArray(d.liveRecentPnl)) { liveRecentPnl.length = 0; liveRecentPnl.push(...(d.liveRecentPnl as number[])); }
    if (Array.isArray(d.shapHistory)) { shapHistory.length = 0; shapHistory.push(...(d.shapHistory as typeof shapHistory)); }
  } catch { /* noop */ }
}