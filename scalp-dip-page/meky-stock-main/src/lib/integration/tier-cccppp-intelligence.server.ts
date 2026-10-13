/**
 * Tier CCC–PPP — Wave-1/2/3 intelligence upgrades:
 *  CCC Bayesian Model Averaging (regime-conditional posteriors per tier)
 *  DDD Conformal Prediction Intervals
 *  EEE SHAP-lite Feature Importance
 *  FFF Microstructure Tick Analysis (VWAP dev, imbalance, size dist)
 *  GGG Event Study (abnormal returns library)
 *  HHH Kalman Filter trend (latent state)
 *  III GARCH(1,1) volatility forecast
 *  JJJ Cluster regime detection (online K-means lite)
 *  KKK Transformer-lite sequence model (attention over decision history)
 *  LLL Causal inference (do-Why lite via partial regression)
 *  MMM Adversarial robustness scoring
 *  NNN Continual learning (EWC-lite weight protection)
 *  OOO Multi-timeframe hierarchical fusion
 *  PPP Portfolio-level risk parity & concentration
 *
 * Pure in-memory + snapshot/restore. No IO.
 */

type Num = number;
const clamp = (x: Num, lo: Num, hi: Num) => Math.max(lo, Math.min(hi, x));
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const variance = (a: number[]) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return a.reduce((s, v) => s + (v - m) * (v - m), 0) / (a.length - 1);
};

// ─────────────── CCC: Bayesian Model Averaging (per regime per tier) ─────────
// Track per (regime,tier) wins/losses → posterior weight = Beta(α,β) mean.
type Posterior = { a: number; b: number };
const bmaTable: Record<string, Posterior> = {}; // key = `${regime}::${tier}`

export function recordTierOutcomeCCC(
  regime: string, tierName: string, tierSignal: number, realisedPct: number,
): void {
  if (!Number.isFinite(tierSignal) || !Number.isFinite(realisedPct)) return;
  const correct = Math.sign(tierSignal) === Math.sign(realisedPct) && Math.sign(tierSignal) !== 0;
  const key = `${regime}::${tierName}`;
  const p = bmaTable[key] ?? (bmaTable[key] = { a: 1, b: 1 });
  if (correct) p.a += 1; else p.b += 1;
}

export function bayesianModelAveragingMultiplierCCC(
  regime: string, signals: Array<{ name: string; value: number }>,
): number {
  if (signals.length === 0) return 1;
  let weighted = 0, totalW = 0;
  for (const s of signals) {
    const p = bmaTable[`${regime}::${s.name}`];
    if (!p) continue;
    const w = p.a / (p.a + p.b); // posterior mean ∈ (0,1)
    weighted += w * s.value;
    totalW += w;
  }
  if (totalW < 0.5) return 1;
  const blend = weighted / totalW; // ≈ tanh-range
  return clamp(1 + clamp(blend, -0.6, 0.6) * 0.12, 0.9, 1.08);
}

// ─────────────── DDD: Conformal Prediction Intervals ─────────────────────────
// Track absolute residuals of (confidence-implied move vs realised) for quantile.
const conformalResiduals: number[] = [];

export function recordConformalSampleDDD(confidence: number, realisedPct: number): void {
  if (!Number.isFinite(confidence) || !Number.isFinite(realisedPct)) return;
  const expected = ((confidence - 50) / 50) * 3;
  conformalResiduals.push(Math.abs(realisedPct - expected));
  if (conformalResiduals.length > 500) conformalResiduals.splice(0, conformalResiduals.length - 500);
}

export function getConformalIntervalDDD(confidence: number, alpha = 0.1): { lower: number; upper: number; halfWidth: number } {
  const expected = ((confidence - 50) / 50) * 3;
  if (conformalResiduals.length < 20) return { lower: expected - 3, upper: expected + 3, halfWidth: 3 };
  const sorted = [...conformalResiduals].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((1 - alpha) * sorted.length));
  const q = sorted[idx];
  return { lower: expected - q, upper: expected + q, halfWidth: q };
}

export function conformalMultiplierDDD(confidence: number): number {
  const { halfWidth } = getConformalIntervalDDD(confidence);
  // Narrow interval → high reliability → boost. Wide → cut.
  if (halfWidth < 1.0) return 1.05;
  if (halfWidth < 2.0) return 1.02;
  if (halfWidth > 6) return 0.88;
  if (halfWidth > 4) return 0.94;
  return 1;
}

// ─────────────── EEE: SHAP-lite Feature Importance ───────────────────────────
// Approximate Shapley: per-feature avg |signal * realised correlation|.
const shapAgg: Record<string, { sumAbs: number; n: number; corr: number }> = {};

export function recordShapSampleEEE(signals: Array<{ name: string; value: number }>, realisedPct: number): void {
  if (!Number.isFinite(realisedPct)) return;
  const r = Math.tanh(realisedPct / 5);
  for (const s of signals) {
    const e = shapAgg[s.name] ?? (shapAgg[s.name] = { sumAbs: 0, n: 0, corr: 0 });
    e.sumAbs += Math.abs(s.value);
    e.corr = e.corr * 0.95 + s.value * r * 0.05;
    e.n += 1;
  }
}

export function featureImportanceMultiplierEEE(
  signals: Array<{ name: string; value: number }>,
): number {
  if (signals.length === 0) return 1;
  let aligned = 0, total = 0;
  for (const s of signals) {
    const e = shapAgg[s.name];
    if (!e || e.n < 5) continue;
    total += 1;
    if (Math.sign(s.value) === Math.sign(e.corr) && Math.abs(e.corr) > 0.02) aligned += 1;
  }
  if (total < 3) return 1;
  const r = aligned / total;
  if (r > 0.75) return 1.05;
  if (r > 0.6) return 1.02;
  if (r < 0.3) return 0.92;
  if (r < 0.45) return 0.97;
  return 1;
}

export function getShapReportEEE(): Array<{ name: string; importance: number; n: number }> {
  return Object.entries(shapAgg)
    .map(([name, e]) => ({ name, n: e.n, importance: e.n > 0 ? e.corr : 0 }))
    .sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance));
}

// ─────────────── FFF: Microstructure Tick Analysis ───────────────────────────
// VWAP-deviation + buy/sell volume imbalance proxy.
type MicroStat = { vwapDev: number[]; imbalance: number[] };
const microFFF: Record<string, MicroStat> = {};

export function recordMicrostructureFFF(
  symbol: string, price: number, vwap: number, buyVol: number, sellVol: number,
): void {
  if (!Number.isFinite(price) || !Number.isFinite(vwap) || vwap < 1e-6) return;
  const s = microFFF[symbol] ?? (microFFF[symbol] = { vwapDev: [], imbalance: [] });
  s.vwapDev.push((price - vwap) / vwap);
  if (s.vwapDev.length > 60) s.vwapDev.splice(0, s.vwapDev.length - 60);
  const tot = buyVol + sellVol;
  if (tot > 0) {
    s.imbalance.push((buyVol - sellVol) / tot);
    if (s.imbalance.length > 60) s.imbalance.splice(0, s.imbalance.length - 60);
  }
}

export function microstructureTickMultiplierFFF(symbol: string, dir: number): number {
  const s = microFFF[symbol];
  if (!s || s.imbalance.length < 8) return 1;
  const imb = mean(s.imbalance.slice(-10));
  const dev = mean(s.vwapDev.slice(-10));
  const aligned = Math.sign(imb) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(imb) > 0.3 && Math.sign(dev) === Math.sign(dir)) return 1.06;
  if (aligned && Math.abs(imb) > 0.15) return 1.03;
  if (!aligned && Math.abs(imb) > 0.3) return 0.9;
  return 1;
}

// ─────────────── GGG: Event Study (abnormal returns library) ─────────────────
type EventStat = { car: number[] }; // cumulative abnormal returns
const eventTable: Record<string, EventStat> = {};

export function recordEventOutcomeGGG(eventType: string, abnormalReturn: number): void {
  if (!eventType || !Number.isFinite(abnormalReturn)) return;
  const e = eventTable[eventType] ?? (eventTable[eventType] = { car: [] });
  e.car.push(abnormalReturn);
  if (e.car.length > 200) e.car.splice(0, e.car.length - 200);
}

export function eventStudyMultiplierGGG(activeEvents: string[], dir: number): number {
  if (!activeEvents.length) return 1;
  let sum = 0, n = 0;
  for (const ev of activeEvents) {
    const e = eventTable[ev];
    if (!e || e.car.length < 5) continue;
    sum += mean(e.car); n += 1;
  }
  if (n === 0) return 1;
  const avgCar = sum / n;
  const aligned = Math.sign(avgCar) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(avgCar) > 2) return 1.06;
  if (aligned && Math.abs(avgCar) > 0.8) return 1.03;
  if (!aligned && Math.abs(avgCar) > 2) return 0.88;
  if (!aligned && Math.abs(avgCar) > 0.8) return 0.95;
  return 1;
}

// ─────────────── HHH: Kalman Filter trend (per symbol) ───────────────────────
type Kalman = { x: number; p: number; q: number; r: number };
const kalmanState: Record<string, Kalman> = {};

export function updateKalmanHHH(symbol: string, observation: number): number {
  if (!Number.isFinite(observation)) return 0;
  const k = kalmanState[symbol] ?? (kalmanState[symbol] = { x: observation, p: 1, q: 0.01, r: 0.5 });
  // Predict
  k.p = k.p + k.q;
  // Update
  const gain = k.p / (k.p + k.r);
  k.x = k.x + gain * (observation - k.x);
  k.p = (1 - gain) * k.p;
  return k.x;
}

export function kalmanTrendMultiplierHHH(symbol: string, currentPrice: number, dir: number): number {
  const k = kalmanState[symbol];
  if (!k) return 1;
  if (!Number.isFinite(currentPrice) || currentPrice < 1e-6) return 1;
  const dev = (currentPrice - k.x) / k.x;
  const aligned = Math.sign(dev) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(dev) > 0.02) return 1.04;
  if (!aligned && Math.abs(dev) > 0.03) return 0.92;
  return 1;
}

// ─────────────── III: GARCH(1,1) volatility forecast ─────────────────────────
type Garch = { omega: number; alpha: number; beta: number; sigma2: number };
const garchState: Record<string, Garch> = {};

export function updateGarchIII(symbol: string, ret: number): void {
  if (!Number.isFinite(ret)) return;
  const g = garchState[symbol] ?? (garchState[symbol] = { omega: 0.0001, alpha: 0.1, beta: 0.85, sigma2: 0.0004 });
  g.sigma2 = g.omega + g.alpha * ret * ret + g.beta * g.sigma2;
}

export function garchVolMultiplierIII(symbol: string): number {
  const g = garchState[symbol];
  if (!g) return 1;
  const vol = Math.sqrt(g.sigma2) * 100; // pct
  // Low forecasted vol → tighter conviction; very high vol → cut.
  if (vol < 1) return 1.04;
  if (vol < 2) return 1.02;
  if (vol > 6) return 0.85;
  if (vol > 4) return 0.93;
  return 1;
}

export function getForecastedVolIII(symbol: string): number {
  const g = garchState[symbol];
  return g ? Math.sqrt(g.sigma2) * 100 : 0;
}

// ─────────────── JJJ: Cluster Regime Detection (online K-means lite) ─────────
// Maintain k=4 centroids over feature vectors; multiplier = stability of cluster.
const K = 4;
let centroids: number[][] = [];
let centroidCounts: number[] = [];
const recentClusterIds: number[] = [];

function dist(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let s = 0;
  for (let i = 0; i < n; i++) { const d = a[i] - b[i]; s += d * d; }
  return Math.sqrt(s);
}

export function recordClusterRegimeJJJ(features: number[]): number {
  if (!features.length) return -1;
  if (centroids.length < K) {
    centroids.push([...features]);
    centroidCounts.push(1);
    const id = centroids.length - 1;
    recentClusterIds.push(id);
    if (recentClusterIds.length > 30) recentClusterIds.shift();
    return id;
  }
  let best = 0, bestD = Infinity;
  for (let i = 0; i < centroids.length; i++) {
    const d = dist(centroids[i], features);
    if (d < bestD) { bestD = d; best = i; }
  }
  // Online update
  centroidCounts[best] += 1;
  const lr = 1 / Math.min(centroidCounts[best], 100);
  const c = centroids[best];
  for (let i = 0; i < Math.min(c.length, features.length); i++) {
    c[i] = c[i] * (1 - lr) + features[i] * lr;
  }
  recentClusterIds.push(best);
  if (recentClusterIds.length > 30) recentClusterIds.shift();
  return best;
}

export function clusterRegimeMultiplierJJJ(features: number[]): number {
  if (recentClusterIds.length < 10 || centroids.length < K) return 1;
  const id = recordClusterRegimeJJJ(features);
  if (id < 0) return 1;
  const same = recentClusterIds.filter((x) => x === id).length;
  const stability = same / recentClusterIds.length;
  if (stability > 0.7) return 1.04; // stable regime
  if (stability < 0.25) return 0.95; // unstable
  return 1;
}

// ─────────────── KKK: Transformer-lite (attention over decision history) ─────
// Soft-attention weighted historical signal-outcome alignment.
type DecisionEntry = { signal: number; outcome: number; ts: number };
const decisionHistory: DecisionEntry[] = [];

export function recordDecisionKKK(signal: number, outcome: number): void {
  if (!Number.isFinite(signal) || !Number.isFinite(outcome)) return;
  decisionHistory.push({ signal, outcome, ts: Date.now() });
  if (decisionHistory.length > 200) decisionHistory.splice(0, decisionHistory.length - 200);
}

export function transformerSeqMultiplierKKK(currentSignal: number): number {
  if (decisionHistory.length < 20) return 1;
  // Attention: similarity in signal-space → softmax → weighted outcome.
  const sims = decisionHistory.map((d) => Math.exp(-Math.abs(d.signal - currentSignal) * 2));
  const z = sims.reduce((a, b) => a + b, 0) || 1;
  const expectedOutcome = decisionHistory.reduce((s, d, i) => s + (sims[i] / z) * d.outcome, 0);
  const aligned = Math.sign(expectedOutcome) === Math.sign(currentSignal) && Math.sign(currentSignal) !== 0;
  if (aligned && Math.abs(expectedOutcome) > 1.5) return 1.05;
  if (aligned && Math.abs(expectedOutcome) > 0.5) return 1.02;
  if (!aligned && Math.abs(expectedOutcome) > 1.5) return 0.9;
  return 1;
}

// ─────────────── LLL: Causal Inference (do-Why lite via partial regression) ──
// Estimate causal effect of sentiment on outcome controlling for momentum.
type CausalSample = { sentiment: number; momentum: number; outcome: number };
const causalSamples: CausalSample[] = [];

export function recordCausalSampleLLL(sentiment: number, momentum: number, outcome: number): void {
  if (![sentiment, momentum, outcome].every(Number.isFinite)) return;
  causalSamples.push({ sentiment, momentum, outcome });
  if (causalSamples.length > 300) causalSamples.splice(0, causalSamples.length - 300);
}

export function causalInferenceMultiplierLLL(currentSentiment: number, dir: number): number {
  if (causalSamples.length < 30) return 1;
  // Frisch–Waugh: residualize sentiment & outcome on momentum, then correlate.
  const m = causalSamples.map((s) => s.momentum);
  const mm = mean(m);
  const mVar = variance(m) + 1e-9;
  // Regress sentiment on momentum: β = cov/var
  const sent = causalSamples.map((s) => s.sentiment);
  const out = causalSamples.map((s) => s.outcome);
  const sm = mean(sent), om = mean(out);
  let covSM = 0, covOM = 0;
  for (let i = 0; i < causalSamples.length; i++) {
    covSM += (sent[i] - sm) * (m[i] - mm);
    covOM += (out[i] - om) * (m[i] - mm);
  }
  covSM /= causalSamples.length; covOM /= causalSamples.length;
  const bSM = covSM / mVar, bOM = covOM / mVar;
  const sentRes: number[] = [], outRes: number[] = [];
  for (let i = 0; i < causalSamples.length; i++) {
    sentRes.push(sent[i] - sm - bSM * (m[i] - mm));
    outRes.push(out[i] - om - bOM * (m[i] - mm));
  }
  const srm = mean(sentRes), orm = mean(outRes);
  let num = 0, ds = 0, doo = 0;
  for (let i = 0; i < sentRes.length; i++) {
    const a = sentRes[i] - srm, b = outRes[i] - orm;
    num += a * b; ds += a * a; doo += b * b;
  }
  const denom = Math.sqrt(ds * doo) || 1;
  const causalCorr = num / denom;
  const aligned = Math.sign(currentSentiment) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && causalCorr > 0.3) return 1.05;
  if (aligned && causalCorr > 0.1) return 1.02;
  if (!aligned && causalCorr > 0.3) return 0.92;
  return 1;
}

// ─────────────── MMM: Adversarial Robustness ─────────────────────────────────
// Perturb each signal ±10% and check if decision sign flips. Robust → boost.
export function adversarialRobustnessMultiplierMMM(
  signals: Array<{ name: string; value: number; weight?: number }>,
): number {
  if (signals.length < 3) return 1;
  const score = (vals: number[]) =>
    vals.reduce((s, v, i) => s + v * (signals[i].weight ?? 1), 0);
  const base = score(signals.map((s) => s.value));
  if (Math.abs(base) < 1e-6) return 1;
  let flips = 0, total = 0;
  for (let i = 0; i < signals.length; i++) {
    for (const eps of [-0.1, 0.1]) {
      const perturbed = signals.map((s, j) => (i === j ? s.value * (1 + eps) : s.value));
      const p = score(perturbed);
      total += 1;
      if (Math.sign(p) !== Math.sign(base)) flips += 1;
    }
  }
  const flipRate = flips / total;
  if (flipRate < 0.05) return 1.05;   // very robust
  if (flipRate < 0.15) return 1.02;
  if (flipRate > 0.4) return 0.88;    // fragile
  if (flipRate > 0.25) return 0.95;
  return 1;
}

// ─────────────── NNN: Continual Learning (EWC-lite) ──────────────────────────
// Track "important" tier weights (high variance impact); penalize sudden changes.
const ewcFisher: Record<string, number> = {};
const ewcAnchor: Record<string, number> = {};

export function recordEWCSampleNNN(tierName: string, signal: number, gradient: number): void {
  if (!Number.isFinite(signal) || !Number.isFinite(gradient)) return;
  const fisher = ewcFisher[tierName] ?? 0;
  ewcFisher[tierName] = fisher * 0.99 + gradient * gradient * 0.01;
  if (!(tierName in ewcAnchor)) ewcAnchor[tierName] = signal;
  else ewcAnchor[tierName] = ewcAnchor[tierName] * 0.995 + signal * 0.005;
}

export function continualLearningMultiplierNNN(
  signals: Array<{ name: string; value: number }>,
): number {
  if (signals.length === 0) return 1;
  let drift = 0, n = 0;
  for (const s of signals) {
    const anchor = ewcAnchor[s.name];
    const fisher = ewcFisher[s.name];
    if (anchor === undefined || !fisher || fisher < 1e-6) continue;
    drift += fisher * (s.value - anchor) * (s.value - anchor);
    n += 1;
  }
  if (n < 3) return 1;
  const avgDrift = drift / n;
  // Heavy drift on important features → reduce confidence (catastrophic shift).
  if (avgDrift > 0.5) return 0.9;
  if (avgDrift > 0.2) return 0.96;
  return 1;
}

// ─────────────── OOO: Multi-Timeframe Hierarchical Fusion ────────────────────
// Accept per-timeframe signals (1m, 5m, 1h, 1d) → attention-weighted by reliability.
type TFSample = { sig1m: number; sig5m: number; sig1h: number; sig1d: number; outcome: number };
const tfHistory: TFSample[] = [];
const tfReliability = { m1: 0.5, m5: 0.5, h1: 0.5, d1: 0.5 };

export function recordTimeframeOutcomeOOO(s: Omit<TFSample, never>): void {
  if (![s.sig1m, s.sig5m, s.sig1h, s.sig1d, s.outcome].every(Number.isFinite)) return;
  tfHistory.push(s);
  if (tfHistory.length > 100) tfHistory.splice(0, tfHistory.length - 100);
  // Update reliability EMA: alignment of each TF with outcome.
  const out = Math.sign(s.outcome);
  if (out === 0) return;
  const lr = 0.05;
  tfReliability.m1 += lr * ((Math.sign(s.sig1m) === out ? 1 : 0) - tfReliability.m1);
  tfReliability.m5 += lr * ((Math.sign(s.sig5m) === out ? 1 : 0) - tfReliability.m5);
  tfReliability.h1 += lr * ((Math.sign(s.sig1h) === out ? 1 : 0) - tfReliability.h1);
  tfReliability.d1 += lr * ((Math.sign(s.sig1d) === out ? 1 : 0) - tfReliability.d1);
}

export function multiTimeframeFusionMultiplierOOO(
  tf: { sig1m?: number; sig5m?: number; sig1h?: number; sig1d?: number },
  dir: number,
): number {
  const r = tfReliability;
  const items = [
    { v: tf.sig1m ?? 0, w: r.m1 },
    { v: tf.sig5m ?? 0, w: r.m5 },
    { v: tf.sig1h ?? 0, w: r.h1 },
    { v: tf.sig1d ?? 0, w: r.d1 },
  ];
  const totalW = items.reduce((s, x) => s + x.w, 0) || 1;
  const fused = items.reduce((s, x) => s + x.v * x.w, 0) / totalW;
  const aligned = Math.sign(fused) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(fused) > 0.5) return 1.05;
  if (aligned && Math.abs(fused) > 0.2) return 1.02;
  if (!aligned && Math.abs(fused) > 0.5) return 0.9;
  return 1;
}

// ─────────────── PPP: Portfolio-Level Risk Parity & Concentration ────────────
// Track open positions; compute concentration (HHI) and correlated-risk penalty.
const portfolioPositions: Record<string, { weight: number; sector: string; vol: number }> = {};

export function updatePortfolioPositionPPP(
  symbol: string, weight: number, sector: string, vol: number,
): void {
  if (weight <= 0) { delete portfolioPositions[symbol]; return; }
  portfolioPositions[symbol] = { weight, sector, vol };
}

export function portfolioRiskParityMultiplierPPP(
  symbol: string, sector: string,
): number {
  const positions = Object.entries(portfolioPositions);
  if (positions.length < 2) return 1;
  const totalW = positions.reduce((s, [, p]) => s + p.weight, 0) || 1;
  // HHI concentration
  let hhi = 0;
  for (const [, p] of positions) {
    const w = p.weight / totalW;
    hhi += w * w;
  }
  // Sector exposure for THIS symbol's sector
  let sectorExp = 0;
  for (const [, p] of positions) if (p.sector === sector) sectorExp += p.weight / totalW;
  // Already holding this symbol?
  const already = !!portfolioPositions[symbol];
  let mult = 1;
  if (hhi > 0.5) mult *= 0.92;        // over-concentrated portfolio
  if (sectorExp > 0.4) mult *= 0.93;  // over-exposed to this sector
  if (already) mult *= 0.95;          // avoid doubling down
  if (positions.length >= 5 && hhi < 0.25) mult *= 1.03; // well-diversified
  return clamp(mult, 0.82, 1.05);
}

// ───────────────────────── Snapshot / Restore ────────────────────────────────
export function snapshotTierCCCPPPState(): unknown {
  return {
    bmaTable,
    conformalResiduals: conformalResiduals.slice(-500),
    shapAgg,
    microFFF,
    eventTable,
    kalmanState,
    garchState,
    centroids, centroidCounts, recentClusterIds: recentClusterIds.slice(-30),
    decisionHistory: decisionHistory.slice(-200),
    causalSamples: causalSamples.slice(-300),
    ewcFisher, ewcAnchor,
    tfHistory: tfHistory.slice(-100), tfReliability,
    portfolioPositions,
  };
}

export function restoreTierCCCPPPState(s: unknown): void {
  try {
    const d = s as Partial<{
      bmaTable: typeof bmaTable;
      conformalResiduals: number[];
      shapAgg: typeof shapAgg;
      microFFF: typeof microFFF;
      eventTable: typeof eventTable;
      kalmanState: typeof kalmanState;
      garchState: typeof garchState;
      centroids: number[][]; centroidCounts: number[]; recentClusterIds: number[];
      decisionHistory: DecisionEntry[];
      causalSamples: CausalSample[];
      ewcFisher: typeof ewcFisher; ewcAnchor: typeof ewcAnchor;
      tfHistory: TFSample[]; tfReliability: typeof tfReliability;
      portfolioPositions: typeof portfolioPositions;
    }>;
    if (d.bmaTable) Object.assign(bmaTable, d.bmaTable);
    if (Array.isArray(d.conformalResiduals)) { conformalResiduals.length = 0; conformalResiduals.push(...d.conformalResiduals); }
    if (d.shapAgg) Object.assign(shapAgg, d.shapAgg);
    if (d.microFFF) Object.assign(microFFF, d.microFFF);
    if (d.eventTable) Object.assign(eventTable, d.eventTable);
    if (d.kalmanState) Object.assign(kalmanState, d.kalmanState);
    if (d.garchState) Object.assign(garchState, d.garchState);
    if (Array.isArray(d.centroids)) centroids = d.centroids;
    if (Array.isArray(d.centroidCounts)) centroidCounts = d.centroidCounts;
    if (Array.isArray(d.recentClusterIds)) { recentClusterIds.length = 0; recentClusterIds.push(...d.recentClusterIds); }
    if (Array.isArray(d.decisionHistory)) { decisionHistory.length = 0; decisionHistory.push(...d.decisionHistory); }
    if (Array.isArray(d.causalSamples)) { causalSamples.length = 0; causalSamples.push(...d.causalSamples); }
    if (d.ewcFisher) Object.assign(ewcFisher, d.ewcFisher);
    if (d.ewcAnchor) Object.assign(ewcAnchor, d.ewcAnchor);
    if (Array.isArray(d.tfHistory)) { tfHistory.length = 0; tfHistory.push(...d.tfHistory); }
    if (d.tfReliability) Object.assign(tfReliability, d.tfReliability);
    if (d.portfolioPositions) Object.assign(portfolioPositions, d.portfolioPositions);
  } catch {}
}