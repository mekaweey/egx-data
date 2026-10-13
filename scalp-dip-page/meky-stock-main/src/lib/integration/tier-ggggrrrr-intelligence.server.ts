/**
 * Tier GGGG–RRRR — Deep microstructure, causal inference, and meta-cognition.
 * Pure in-memory + snapshot/restore. JS-native, no external deps.
 *
 *  GGGG orderFlowToxicityVPIN          (volume-bucketed informed-trading prob)
 *  HHHH hawkesProcessSelfExcitation    (trade clustering self-excitation)
 *  IIII kyleLambdaMarketDepth          (price impact per unit volume)
 *  JJJJ pinModelInformedTrading        (Easley–O'Hara PIN proxy)
 *  KKKK doubleMLCausalForest           (double-ML residualised causal effect)
 *  LLLL syntheticControlMethod         (synthetic counterfactual basket)
 *  MMMM instrumentalVariablesIV        (2SLS for feedback loops)
 *  NNNN regressionDiscontinuityRDD     (threshold discovery)
 *  OOOO metacognitiveConfidenceCalibration (confidence-on-confidence)
 *  PPPP epistemicVsAleatoricUncertainty (decompose uncertainty)
 *  QQQQ outOfDistributionDetection     (Mahalanobis-lite OOD)
 *  RRRR modelDecayMonitoring           (PSI + KL divergence drift)
 */

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const variance = (a: number[]) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return a.reduce((s, v) => s + (v - m) * (v - m), 0) / (a.length - 1);
};
const std = (a: number[]) => Math.sqrt(variance(a));

// ═════════════ GGGG: VPIN (volume-synchronized PIN) ══════════════════════════
type VpinBucket = { buy: number; sell: number };
const vpinState: Record<string, { buckets: VpinBucket[]; cur: VpinBucket; vps: number; capacity: number }> = {};

export function recordTradeGGGG(symbol: string, volume: number, side: "buy" | "sell", bucketSize = 1000): void {
  if (!Number.isFinite(volume) || volume <= 0) return;
  const s = vpinState[symbol] ?? (vpinState[symbol] = { buckets: [], cur: { buy: 0, sell: 0 }, vps: 0, capacity: bucketSize });
  if (side === "buy") s.cur.buy += volume; else s.cur.sell += volume;
  s.vps += volume;
  if (s.vps >= s.capacity) {
    s.buckets.push(s.cur);
    if (s.buckets.length > 50) s.buckets.shift();
    s.cur = { buy: 0, sell: 0 };
    s.vps = 0;
  }
}

export function vpinMultiplierGGGG(symbol: string, dir: number): number {
  const s = vpinState[symbol];
  if (!s || s.buckets.length < 5) return 1;
  const recent = s.buckets.slice(-20);
  const imb = recent.map((b) => Math.abs(b.buy - b.sell) / Math.max(1, b.buy + b.sell));
  const vpin = mean(imb);
  // High VPIN = toxic flow = informed traders active → reduce confidence
  if (vpin > 0.5) return 0.88;
  if (vpin > 0.35) return 0.95;
  // Low VPIN aligned with direction → slight boost
  if (vpin < 0.15 && Math.abs(dir) > 0.2) return 1.03;
  return 1;
}

// ═════════════ HHHH: Hawkes self-exciting process ════════════════════════════
type HawkesEvent = { ts: number; mag: number };
const hawkesEvents: Record<string, HawkesEvent[]> = {};
const HAWKES_DECAY = 1 / (60 * 60 * 1000); // 1h decay

export function recordHawkesEventHHHH(symbol: string, magnitude: number): void {
  if (!Number.isFinite(magnitude) || magnitude <= 0) return;
  const arr = hawkesEvents[symbol] ?? (hawkesEvents[symbol] = []);
  arr.push({ ts: Date.now(), mag: magnitude });
  if (arr.length > 200) arr.splice(0, arr.length - 200);
}

export function hawkesMultiplierHHHH(symbol: string, dir: number): number {
  const arr = hawkesEvents[symbol];
  if (!arr || arr.length < 5) return 1;
  const now = Date.now();
  // Conditional intensity: λ(t) = μ + Σ α·mag·exp(-β(t-ti))
  const baseline = 0.1;
  const alpha = 0.5;
  let intensity = baseline;
  for (const e of arr) {
    const dt = (now - e.ts) * HAWKES_DECAY;
    if (dt > 10) continue;
    intensity += alpha * e.mag * Math.exp(-dt);
  }
  // High intensity + aligned direction → momentum cascade
  if (intensity > 5 && Math.abs(dir) > 0.1) return 1.08;
  if (intensity > 2 && Math.abs(dir) > 0.1) return 1.03;
  if (intensity > 5 && Math.abs(dir) < 0.05) return 0.93; // volatile noise
  return 1;
}

// ═════════════ IIII: Kyle's lambda (market depth) ════════════════════════════
type DepthSample = { dPrice: number; signedVol: number };
const kyleSamples: Record<string, DepthSample[]> = {};

export function recordKyleSampleIIII(symbol: string, priceChange: number, signedVolume: number): void {
  if (!Number.isFinite(priceChange) || !Number.isFinite(signedVolume) || signedVolume === 0) return;
  const arr = kyleSamples[symbol] ?? (kyleSamples[symbol] = []);
  arr.push({ dPrice: priceChange, signedVol: signedVolume });
  if (arr.length > 100) arr.splice(0, arr.length - 100);
}

export function kyleLambdaMultiplierIIII(symbol: string): number {
  const arr = kyleSamples[symbol];
  if (!arr || arr.length < 20) return 1;
  // OLS: dPrice = λ · signedVol
  let num = 0, den = 0;
  for (const s of arr) { num += s.dPrice * s.signedVol; den += s.signedVol * s.signedVol; }
  if (den === 0) return 1;
  const lambda = num / den;
  const absL = Math.abs(lambda);
  // High λ = shallow market = fragile → reduce confidence
  if (absL > 0.01) return 0.9;
  if (absL > 0.005) return 0.96;
  if (absL < 0.001) return 1.04; // deep, liquid
  return 1;
}

// ═════════════ JJJJ: PIN model (Easley–O'Hara proxy) ═════════════════════════
const pinHistory: Record<string, { buys: number[]; sells: number[] }> = {};

export function recordDailyOrderFlowJJJJ(symbol: string, buys: number, sells: number): void {
  if (!Number.isFinite(buys) || !Number.isFinite(sells)) return;
  const s = pinHistory[symbol] ?? (pinHistory[symbol] = { buys: [], sells: [] });
  s.buys.push(buys); s.sells.push(sells);
  if (s.buys.length > 60) { s.buys.shift(); s.sells.shift(); }
}

export function pinMultiplierJJJJ(symbol: string, dir: number): number {
  const s = pinHistory[symbol];
  if (!s || s.buys.length < 10) return 1;
  const meanB = mean(s.buys), meanS = mean(s.sells);
  const totalMean = meanB + meanS;
  if (totalMean === 0) return 1;
  // Imbalance proxy for PIN: |E[B]-E[S]| / (E[B]+E[S]+ε·σ)
  const sigma = std([...s.buys, ...s.sells]);
  const pin = Math.abs(meanB - meanS) / (totalMean + 0.5 * sigma);
  // High PIN = informed trading dominant → align with imbalance sign
  const flowSign = Math.sign(meanB - meanS);
  const aligned = flowSign === Math.sign(dir) && Math.sign(dir) !== 0;
  if (pin > 0.3 && aligned) return 1.07;
  if (pin > 0.3 && !aligned) return 0.88;
  return 1;
}

// ═════════════ KKKK: Double ML causal forest ═════════════════════════════════
type DmlSample = { treatment: number; outcome: number; confounder: number };
const dmlSamples: DmlSample[] = [];

export function recordDoubleMLKKKK(treatment: number, outcome: number, confounder: number): void {
  if (![treatment, outcome, confounder].every(Number.isFinite)) return;
  dmlSamples.push({ treatment, outcome, confounder });
  if (dmlSamples.length > 500) dmlSamples.shift();
}

export function doubleMLMultiplierKKKK(treatment: number, dir: number): number {
  if (dmlSamples.length < 30) return 1;
  // Residualise treatment and outcome against confounder via simple OLS
  const c = dmlSamples.map((s) => s.confounder);
  const t = dmlSamples.map((s) => s.treatment);
  const y = dmlSamples.map((s) => s.outcome);
  const olsCoef = (x: number[], z: number[]): number => {
    const mx = mean(x), mz = mean(z);
    let num = 0, den = 0;
    for (let i = 0; i < x.length; i++) { num += (x[i] - mx) * (z[i] - mz); den += (z[i] - mz) ** 2; }
    return den === 0 ? 0 : num / den;
  };
  const bT = olsCoef(t, c);
  const bY = olsCoef(y, c);
  const mc = mean(c);
  const resT = t.map((v, i) => v - bT * (c[i] - mc));
  const resY = y.map((v, i) => v - bY * (c[i] - mc));
  const theta = olsCoef(resY, resT); // causal effect
  const expected = theta * treatment;
  const aligned = Math.sign(expected) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(expected) > 0.5) return 1.05;
  if (!aligned && Math.abs(expected) > 1) return 0.93;
  return 1;
}

// ═════════════ LLLL: Synthetic control ═══════════════════════════════════════
const scHistory: Record<string, number[]> = {};

export function recordReturnLLLL(symbol: string, ret: number): void {
  if (!Number.isFinite(ret)) return;
  const a = scHistory[symbol] ?? (scHistory[symbol] = []);
  a.push(ret);
  if (a.length > 60) a.shift();
}

export function syntheticControlMultiplierLLLL(symbol: string, dir: number): number {
  const target = scHistory[symbol];
  if (!target || target.length < 20) return 1;
  const peers = Object.entries(scHistory).filter(([k, v]) => k !== symbol && v.length >= target.length);
  if (peers.length < 3) return 1;
  // Equal-weighted synthetic
  const n = target.length;
  const synth: number[] = new Array(n).fill(0);
  for (const [, v] of peers) {
    const tail = v.slice(-n);
    for (let i = 0; i < n; i++) synth[i] += tail[i] / peers.length;
  }
  const recent = target.slice(-5);
  const synthRecent = synth.slice(-5);
  const gap = mean(recent) - mean(synthRecent);
  const aligned = Math.sign(gap) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(gap) > 0.5) return 1.05;
  if (!aligned && Math.abs(gap) > 1) return 0.94;
  return 1;
}

// ═════════════ MMMM: Instrumental Variables (2SLS) ═══════════════════════════
type IVSample = { instrument: number; endogenous: number; outcome: number };
const ivSamples: IVSample[] = [];

export function recordIVMMMM(instrument: number, endogenous: number, outcome: number): void {
  if (![instrument, endogenous, outcome].every(Number.isFinite)) return;
  ivSamples.push({ instrument, endogenous, outcome });
  if (ivSamples.length > 500) ivSamples.shift();
}

export function ivMultiplierMMMM(endogenousValue: number, dir: number): number {
  if (ivSamples.length < 30) return 1;
  const z = ivSamples.map((s) => s.instrument);
  const x = ivSamples.map((s) => s.endogenous);
  const y = ivSamples.map((s) => s.outcome);
  const mz = mean(z), mx = mean(x), my = mean(y);
  // Stage 1: x ~ z
  let num1 = 0, den1 = 0;
  for (let i = 0; i < z.length; i++) { num1 += (z[i] - mz) * (x[i] - mx); den1 += (z[i] - mz) ** 2; }
  if (den1 === 0) return 1;
  const pi = num1 / den1;
  const xhat = z.map((zi) => pi * (zi - mz) + mx);
  // Stage 2: y ~ xhat
  const mxh = mean(xhat);
  let num2 = 0, den2 = 0;
  for (let i = 0; i < xhat.length; i++) { num2 += (xhat[i] - mxh) * (y[i] - my); den2 += (xhat[i] - mxh) ** 2; }
  if (den2 === 0) return 1;
  const beta = num2 / den2;
  const expected = beta * endogenousValue;
  const aligned = Math.sign(expected) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(expected) > 0.3) return 1.04;
  if (!aligned && Math.abs(expected) > 0.8) return 0.93;
  return 1;
}

// ═════════════ NNNN: Regression discontinuity (RDD) ══════════════════════════
type RDDSample = { running: number; outcome: number };
const rddSamples: Record<string, RDDSample[]> = {};

export function recordRDDNNNN(symbol: string, running: number, outcome: number): void {
  if (!Number.isFinite(running) || !Number.isFinite(outcome)) return;
  const a = rddSamples[symbol] ?? (rddSamples[symbol] = []);
  a.push({ running, outcome });
  if (a.length > 200) a.shift();
}

export function rddMultiplierNNNN(symbol: string, runningValue: number, dir: number): number {
  const arr = rddSamples[symbol];
  if (!arr || arr.length < 20) return 1;
  // Probe thresholds at quantiles 0.3 / 0.5 / 0.7 of running variable
  const sorted = [...arr].sort((a, b) => a.running - b.running);
  let bestJump = 0, bestThresh = 0;
  for (const q of [0.3, 0.5, 0.7]) {
    const idx = Math.floor(sorted.length * q);
    const thresh = sorted[idx].running;
    const below = arr.filter((s) => s.running < thresh && s.running >= thresh - Math.abs(thresh) * 0.2);
    const above = arr.filter((s) => s.running >= thresh && s.running <= thresh + Math.abs(thresh) * 0.2);
    if (below.length < 3 || above.length < 3) continue;
    const jump = mean(above.map((s) => s.outcome)) - mean(below.map((s) => s.outcome));
    if (Math.abs(jump) > Math.abs(bestJump)) { bestJump = jump; bestThresh = thresh; }
  }
  if (Math.abs(bestJump) < 0.3) return 1;
  // Predict crossing effect
  const crossing = runningValue >= bestThresh;
  const expected = crossing ? bestJump : 0;
  const aligned = Math.sign(expected) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned) return 1.04;
  if (!aligned && Math.abs(expected) > 0.6) return 0.95;
  return 1;
}

// ═════════════ OOOO: Metacognitive confidence calibration ════════════════════
type CalibSample = { predConf: number; correct: 0 | 1 };
const calibBuckets: Record<string, CalibSample[]> = {};

export function recordCalibrationOOOO(bucket: string, predConf: number, correct: boolean): void {
  if (!Number.isFinite(predConf)) return;
  const a = calibBuckets[bucket] ?? (calibBuckets[bucket] = []);
  a.push({ predConf, correct: correct ? 1 : 0 });
  if (a.length > 500) a.shift();
}

export function metacognitiveMultiplierOOOO(bucket: string, predConf: number): number {
  const arr = calibBuckets[bucket];
  if (!arr || arr.length < 20) return 1;
  // Brier-like calibration error in the predConf neighbourhood (±10)
  const near = arr.filter((s) => Math.abs(s.predConf - predConf) <= 10);
  if (near.length < 5) return 1;
  const empirical = mean(near.map((s) => s.correct)) * 100;
  const gap = empirical - predConf; // negative → overconfident
  if (gap < -15) return 0.88; // strongly overconfident historically
  if (gap < -7) return 0.95;
  if (gap > 10) return 1.04; // historically underconfident → trust more
  return 1;
}

// ═════════════ PPPP: Epistemic vs Aleatoric uncertainty ══════════════════════
const epistemicSamples: Record<string, number[]> = {}; // residuals
const ensembleVar: Record<string, number[]> = {}; // disagreement across models

export function recordUncertaintyPPPP(bucket: string, residual: number, ensembleVariance: number): void {
  if (!Number.isFinite(residual) || !Number.isFinite(ensembleVariance)) return;
  const a = epistemicSamples[bucket] ?? (epistemicSamples[bucket] = []);
  const e = ensembleVar[bucket] ?? (ensembleVar[bucket] = []);
  a.push(Math.abs(residual)); e.push(ensembleVariance);
  if (a.length > 200) a.shift();
  if (e.length > 200) e.shift();
}

export function uncertaintyMultiplierPPPP(bucket: string): number {
  const res = epistemicSamples[bucket]; const ens = ensembleVar[bucket];
  if (!res || !ens || res.length < 20) return 1;
  const total = variance(res);
  const epistemic = mean(ens); // model disagreement = reducible
  const aleatoric = Math.max(0, total - epistemic); // irreducible market noise
  if (total === 0) return 1;
  const aleatoricFrac = aleatoric / total;
  // High irreducible noise → market is unpredictable, stand down
  if (aleatoricFrac > 0.75 && total > 4) return 0.85;
  if (aleatoricFrac > 0.6) return 0.93;
  // Low aleatoric + moderate epistemic → more training will help, neutral now
  if (aleatoricFrac < 0.3 && epistemic > 1) return 1.02;
  return 1;
}

// ═════════════ QQQQ: Out-of-distribution detection (Mahalanobis-lite) ═══════
const oodTrain: number[][] = []; // training feature vectors
const oodStats: { mean: number[]; varDiag: number[] } = { mean: [], varDiag: [] };

export function recordOODTrainingQQQQ(features: number[]): void {
  if (!features.every(Number.isFinite)) return;
  oodTrain.push(features.slice());
  if (oodTrain.length > 500) oodTrain.shift();
  // Recompute periodically (every 25 samples)
  if (oodTrain.length % 25 === 0 && oodTrain.length >= 25) {
    const d = oodTrain[0].length;
    const m = new Array(d).fill(0);
    for (const v of oodTrain) for (let i = 0; i < d; i++) m[i] += v[i];
    for (let i = 0; i < d; i++) m[i] /= oodTrain.length;
    const vr = new Array(d).fill(0);
    for (const v of oodTrain) for (let i = 0; i < d; i++) vr[i] += (v[i] - m[i]) ** 2;
    for (let i = 0; i < d; i++) vr[i] = vr[i] / oodTrain.length + 1e-6;
    oodStats.mean = m; oodStats.varDiag = vr;
  }
}

export function oodMultiplierQQQQ(features: number[]): number {
  if (!oodStats.mean.length || features.length !== oodStats.mean.length) return 1;
  if (oodTrain.length < 50) return 1;
  let d2 = 0;
  for (let i = 0; i < features.length; i++) {
    const diff = features[i] - oodStats.mean[i];
    d2 += (diff * diff) / oodStats.varDiag[i];
  }
  const mahal = Math.sqrt(d2);
  // Threshold ≈ sqrt(d) for in-distribution; > 2·sqrt(d) is OOD
  const expected = Math.sqrt(features.length);
  if (mahal > 3 * expected) return 0.75; // strongly OOD → standdown
  if (mahal > 2 * expected) return 0.88;
  if (mahal > 1.5 * expected) return 0.95;
  return 1;
}

// ═════════════ RRRR: Model decay monitoring (PSI / KL) ═══════════════════════
type DistSnapshot = { bins: number[]; total: number };
const baselineDist: Record<string, DistSnapshot> = {};
const recentDist: Record<string, DistSnapshot> = {};
const BINS = 10;

function binIndex(v: number, lo: number, hi: number): number {
  if (hi <= lo) return 0;
  const idx = Math.floor(((v - lo) / (hi - lo)) * BINS);
  return clamp(idx, 0, BINS - 1);
}

export function recordDistributionRRRR(bucket: string, value: number, baseline: boolean): void {
  if (!Number.isFinite(value)) return;
  // Use fixed score range [0,100] for confidence-like buckets; clip otherwise.
  const lo = 0, hi = 100;
  const target = baseline ? baselineDist : recentDist;
  const s = target[bucket] ?? (target[bucket] = { bins: new Array(BINS).fill(0), total: 0 });
  s.bins[binIndex(value, lo, hi)] += 1;
  s.total += 1;
  // Cap counts
  if (s.total > 2000) {
    for (let i = 0; i < BINS; i++) s.bins[i] *= 0.5;
    s.total *= 0.5;
  }
}

export function modelDecayMultiplierRRRR(bucket: string): number {
  const b = baselineDist[bucket]; const r = recentDist[bucket];
  if (!b || !r || b.total < 50 || r.total < 30) return 1;
  let psi = 0;
  for (let i = 0; i < BINS; i++) {
    const pB = Math.max(1e-4, b.bins[i] / b.total);
    const pR = Math.max(1e-4, r.bins[i] / r.total);
    psi += (pR - pB) * Math.log(pR / pB);
  }
  // PSI > 0.25 = significant shift (industry standard)
  if (psi > 0.5) return 0.82; // major drift → suppress
  if (psi > 0.25) return 0.92;
  if (psi > 0.1) return 0.97;
  return 1;
}

// ───────────────────────── Snapshot / Restore ────────────────────────────────
export function snapshotTierGGGGRRRRState(): unknown {
  return {
    vpinState, hawkesEvents, kyleSamples, pinHistory,
    dmlSamples: dmlSamples.slice(-500),
    scHistory,
    ivSamples: ivSamples.slice(-500),
    rddSamples,
    calibBuckets, epistemicSamples, ensembleVar,
    oodTrain: oodTrain.slice(-500), oodStats,
    baselineDist, recentDist,
  };
}

export function restoreTierGGGGRRRRState(s: unknown): void {
  try {
    const d = s as Partial<{
      vpinState: typeof vpinState; hawkesEvents: typeof hawkesEvents;
      kyleSamples: typeof kyleSamples; pinHistory: typeof pinHistory;
      dmlSamples: DmlSample[]; scHistory: typeof scHistory;
      ivSamples: IVSample[]; rddSamples: typeof rddSamples;
      calibBuckets: typeof calibBuckets;
      epistemicSamples: typeof epistemicSamples; ensembleVar: typeof ensembleVar;
      oodTrain: number[][]; oodStats: typeof oodStats;
      baselineDist: typeof baselineDist; recentDist: typeof recentDist;
    }>;
    if (d.vpinState) Object.assign(vpinState, d.vpinState);
    if (d.hawkesEvents) Object.assign(hawkesEvents, d.hawkesEvents);
    if (d.kyleSamples) Object.assign(kyleSamples, d.kyleSamples);
    if (d.pinHistory) Object.assign(pinHistory, d.pinHistory);
    if (Array.isArray(d.dmlSamples)) { dmlSamples.length = 0; dmlSamples.push(...d.dmlSamples); }
    if (d.scHistory) Object.assign(scHistory, d.scHistory);
    if (Array.isArray(d.ivSamples)) { ivSamples.length = 0; ivSamples.push(...d.ivSamples); }
    if (d.rddSamples) Object.assign(rddSamples, d.rddSamples);
    if (d.calibBuckets) Object.assign(calibBuckets, d.calibBuckets);
    if (d.epistemicSamples) Object.assign(epistemicSamples, d.epistemicSamples);
    if (d.ensembleVar) Object.assign(ensembleVar, d.ensembleVar);
    if (Array.isArray(d.oodTrain)) { oodTrain.length = 0; oodTrain.push(...d.oodTrain); }
    if (d.oodStats) { oodStats.mean = d.oodStats.mean ?? []; oodStats.varDiag = d.oodStats.varDiag ?? []; }
    if (d.baselineDist) Object.assign(baselineDist, d.baselineDist);
    if (d.recentDist) Object.assign(recentDist, d.recentDist);
  } catch { /* noop */ }
}