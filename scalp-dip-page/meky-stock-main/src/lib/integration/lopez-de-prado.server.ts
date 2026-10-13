/**
 * Tier-A advanced ML utilities (López de Prado-style).
 * --------------------------------------------------------------------------
 * Self-contained, fail-open, in-memory by default. State is snapshot/restored
 * via persistence layer through outcome-loop. Five pillars:
 *   1) Triple-Barrier Labeling
 *   2) Meta-Labeling (logistic gate on top of primary signal)
 *   3) Purged K-Fold Cross-Validation helper
 *   4) Bayesian Model Averaging (posterior over modules)
 *   5) Fractional Differentiation
 */

/* ------------------------------------------------------------------ */
/* 1) Triple-Barrier Labeling                                          */
/* ------------------------------------------------------------------ */
export interface TripleBarrierConfig {
  tpPct: number;     // e.g. 0.05 = +5% target
  slPct: number;     // e.g. 0.03 = -3% stop
  maxBars: number;   // time barrier
}
/** Returns +1 (target first), -1 (stop first), 0 (time barrier). */
export function tripleBarrierLabel(
  entry: number,
  futureCloses: number[],
  cfg: TripleBarrierConfig,
): -1 | 0 | 1 {
  if (!Number.isFinite(entry) || entry <= 0 || futureCloses.length === 0) return 0;
  const upper = entry * (1 + cfg.tpPct);
  const lower = entry * (1 - cfg.slPct);
  const horizon = Math.min(cfg.maxBars, futureCloses.length);
  for (let i = 0; i < horizon; i++) {
    const p = futureCloses[i];
    if (p >= upper) return 1;
    if (p <= lower) return -1;
  }
  return 0;
}

/* ------------------------------------------------------------------ */
/* 2) Meta-Labeling (logistic regression "bet or skip")                */
/* ------------------------------------------------------------------ */
interface MetaModel { w: number[]; b: number; n: number; }
const metaModel: MetaModel = { w: [0, 0, 0, 0, 0], b: 0, n: 0 };
const META_LR = 0.05;

function sigmoid(x: number): number { return 1 / (1 + Math.exp(-x)); }

/** Features: [primaryConfNorm, signalDir, conformalWidthNorm, regimeBull, regimeVol] */
export function metaProbability(features: number[]): number {
  const f = padOrTrim(features, 5);
  let z = metaModel.b;
  for (let i = 0; i < 5; i++) z += metaModel.w[i] * f[i];
  return sigmoid(z);
}

/** Train: y in {0,1} = whether primary bet would have been profitable. */
export function metaUpdate(features: number[], y: 0 | 1): void {
  const f = padOrTrim(features, 5);
  const p = metaProbability(f);
  const err = p - y;
  for (let i = 0; i < 5; i++) {
    metaModel.w[i] -= META_LR * err * f[i];
    if (!Number.isFinite(metaModel.w[i])) metaModel.w[i] = 0;
  }
  metaModel.b -= META_LR * err;
  metaModel.n++;
}

/** Multiplier: <1 dampens, >1 boosts; neutral until model has data. */
export function metaMultiplier(features: number[]): number {
  if (metaModel.n < 30) return 1;
  const p = metaProbability(features);
  // Map [0,1] → [0.7, 1.15] (asymmetric: stronger downside).
  return 0.7 + p * 0.45;
}

function padOrTrim(a: number[], n: number): number[] {
  const out = a.slice(0, n);
  while (out.length < n) out.push(0);
  return out.map((v) => Number.isFinite(v) ? Math.max(-3, Math.min(3, v)) : 0);
}

/* ------------------------------------------------------------------ */
/* 3) Purged K-Fold Cross-Validation                                   */
/* ------------------------------------------------------------------ */
export interface PurgedFold { trainIdx: number[]; testIdx: number[]; }
/**
 * Generate K folds where samples within `embargoBars` of any test sample
 * are *purged* from training to prevent leakage from overlapping labels.
 */
export function purgedKFold(
  n: number, k: number, embargoBars: number,
): PurgedFold[] {
  if (n <= k || k < 2) return [];
  const foldSize = Math.floor(n / k);
  const folds: PurgedFold[] = [];
  for (let i = 0; i < k; i++) {
    const testStart = i * foldSize;
    const testEnd = i === k - 1 ? n : testStart + foldSize;
    const testIdx: number[] = [];
    for (let j = testStart; j < testEnd; j++) testIdx.push(j);
    const trainIdx: number[] = [];
    for (let j = 0; j < n; j++) {
      if (j >= testStart - embargoBars && j < testEnd + embargoBars) continue;
      trainIdx.push(j);
    }
    folds.push({ trainIdx, testIdx });
  }
  return folds;
}

/* ------------------------------------------------------------------ */
/* 4) Bayesian Model Averaging                                         */
/* ------------------------------------------------------------------ */
interface BMAState {
  // log-likelihood accumulator per module
  ll: Record<string, number>;
  n: Record<string, number>;
}
const bmaState: BMAState = { ll: {}, n: {} };

/**
 * Update posterior: for each module, accumulate log-likelihood of the
 * realised outcome given its signal direction (Bernoulli with mapped prob).
 */
export function bmaUpdate(
  modules: { name: string; value: number }[], won: boolean,
): void {
  for (const m of modules) {
    const p = sigmoid(m.value * 2); // signal → prob
    const lik = won ? p : (1 - p);
    const ll = Math.log(Math.max(1e-6, lik));
    bmaState.ll[m.name] = (bmaState.ll[m.name] ?? 0) + ll;
    bmaState.n[m.name] = (bmaState.n[m.name] ?? 0) + 1;
  }
}

/**
 * Return posterior-weighted blended signal (vs simple mean / stacking).
 * Multiplier centered at 1; >1 when modules with strong posterior agree.
 */
export function bmaMultiplier(modules: { name: string; value: number }[]): number {
  if (modules.length === 0) return 1;
  // Softmax over normalized average log-likelihood per module.
  const scores = modules.map((m) => {
    const n = bmaState.n[m.name] ?? 0;
    if (n < 10) return 0;
    return (bmaState.ll[m.name] ?? 0) / n; // avg log-lik
  });
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  const weights = exps.map((e) => e / sum);
  let blended = 0;
  for (let i = 0; i < modules.length; i++) blended += weights[i] * modules[i].value;
  // Map blended in ~[-1,1] → multiplier [0.85, 1.15].
  return 1 + Math.max(-1, Math.min(1, blended)) * 0.15;
}

/* ------------------------------------------------------------------ */
/* 5) Fractional Differentiation                                       */
/* ------------------------------------------------------------------ */
/**
 * Fixed-window fractional differentiation. Returns transformed series
 * preserving memory while approaching stationarity. d in (0,1).
 */
export function fracDiff(series: number[], d = 0.4, thresh = 1e-4): number[] {
  if (series.length < 4 || d <= 0 || d >= 1) return series.slice();
  // Build weights until they fall below threshold.
  const w: number[] = [1];
  let k = 1;
  while (k < series.length) {
    const next = -w[k - 1] * (d - k + 1) / k;
    if (Math.abs(next) < thresh) break;
    w.push(next);
    k++;
  }
  const width = w.length;
  const out: number[] = [];
  for (let i = width - 1; i < series.length; i++) {
    let acc = 0;
    for (let j = 0; j < width; j++) acc += w[j] * series[i - j];
    out.push(acc);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* State snapshot/restore (for persistence)                            */
/* ------------------------------------------------------------------ */
export function snapshotLDPState() {
  return { meta: metaModel, bma: bmaState };
}
export function restoreLDPState(s: unknown): void {
  try {
    const obj = s as { meta?: MetaModel; bma?: BMAState };
    if (obj?.meta && Array.isArray(obj.meta.w)) {
      metaModel.w = obj.meta.w.slice(0, 5);
      while (metaModel.w.length < 5) metaModel.w.push(0);
      metaModel.b = Number(obj.meta.b ?? 0);
      metaModel.n = Number(obj.meta.n ?? 0);
    }
    if (obj?.bma && obj.bma.ll && obj.bma.n) {
      Object.assign(bmaState.ll, obj.bma.ll);
      Object.assign(bmaState.n, obj.bma.n);
    }
  } catch {}
}