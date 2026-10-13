/**
 * Tier-B advanced layers — contextual intelligence.
 * --------------------------------------------------------------------------
 * Fail-open, in-memory state snapshot/restored via outcome-loop persistence.
 *   1) Regime-Conditional Models (4 SGD per regime)
 *   2) Cross-Asset Correlation Graph (lead/lag predictions)
 *   3) Microstructure features (Amihud, Kyle, Roll)
 *   4) Adversarial Validation (distribution drift detector)
 *   5) Event Study Engine (CAR around events)
 */

/* ============================================================== */
/* 1) Regime-Conditional SGD                                       */
/* ============================================================== */
type Regime = "bull" | "bear" | "range" | "crisis";
interface RegimeModel { w: number[]; b: number; n: number; }
const regimeModels: Record<Regime, RegimeModel> = {
  bull:   { w: [0, 0, 0, 0], b: 0, n: 0 },
  bear:   { w: [0, 0, 0, 0], b: 0, n: 0 },
  range:  { w: [0, 0, 0, 0], b: 0, n: 0 },
  crisis: { w: [0, 0, 0, 0], b: 0, n: 0 },
};
const REG_LR = 0.03;

export function regimeFromContext(reg: string | undefined): Regime {
  if (reg === "trending_up") return "bull";
  if (reg === "trending_down") return "bear";
  if (reg === "high_vol") return "crisis";
  return "range";
}

export function regimePredict(regime: Regime, x: number[]): number {
  const m = regimeModels[regime];
  const f = pad(x, 4);
  let z = m.b;
  for (let i = 0; i < 4; i++) z += m.w[i] * f[i];
  return Math.tanh(z); // [-1, 1]
}

export function regimeUpdate(regime: Regime, x: number[], y: number): void {
  const m = regimeModels[regime];
  const f = pad(x, 4);
  const yhat = regimePredict(regime, f);
  const err = yhat - Math.sign(y);
  for (let i = 0; i < 4; i++) {
    m.w[i] -= REG_LR * err * f[i];
    if (!Number.isFinite(m.w[i])) m.w[i] = 0;
  }
  m.b -= REG_LR * err;
  m.n++;
}

export function regimeMultiplier(regime: Regime, x: number[]): number {
  if (regimeModels[regime].n < 20) return 1;
  const p = regimePredict(regime, x);
  return 1 + Math.max(-1, Math.min(1, p)) * 0.12;
}

/* ============================================================== */
/* 2) Cross-Asset Correlation Graph                                */
/* ============================================================== */
interface SymbolMove { ts: number; ret: number; }
const moveHistory = new Map<string, SymbolMove[]>();
const correlations = new Map<string, Map<string, number>>(); // sym -> neighbor -> corr
const HISTORY = 60;

export function recordSymbolMove(symbol: string, ret: number): void {
  if (!Number.isFinite(ret)) return;
  const sym = symbol.toUpperCase();
  const arr = moveHistory.get(sym) ?? [];
  arr.push({ ts: Date.now(), ret });
  if (arr.length > HISTORY) arr.shift();
  moveHistory.set(sym, arr);
}

export function recomputeCorrelations(minOverlap = 20): void {
  const syms = Array.from(moveHistory.keys());
  for (const a of syms) {
    const ra = moveHistory.get(a)!.map((m) => m.ret);
    const m: Map<string, number> = new Map();
    for (const b of syms) {
      if (a === b) continue;
      const rb = moveHistory.get(b)!.map((m) => m.ret);
      const n = Math.min(ra.length, rb.length);
      if (n < minOverlap) continue;
      const aSlice = ra.slice(-n), bSlice = rb.slice(-n);
      const c = pearson(aSlice, bSlice);
      if (Math.abs(c) > 0.4) m.set(b, c);
    }
    correlations.set(a, m);
  }
}

/** Predict directional pull from highly-correlated neighbors' recent moves. */
export function neighborPull(symbol: string): number {
  const sym = symbol.toUpperCase();
  const corrs = correlations.get(sym);
  if (!corrs || corrs.size === 0) return 0;
  let sum = 0, wsum = 0;
  for (const [neighbor, c] of corrs) {
    const hist = moveHistory.get(neighbor);
    if (!hist || hist.length < 2) continue;
    const recent = hist[hist.length - 1].ret;
    sum += c * recent;
    wsum += Math.abs(c);
  }
  return wsum > 0 ? sum / wsum : 0;
}

export function neighborMultiplier(symbol: string, ownSignal: number): number {
  const pull = neighborPull(symbol);
  // If neighbors and own signal agree → boost; disagree → dampen.
  const agreement = Math.sign(pull) === Math.sign(ownSignal) ? 1 : -1;
  return 1 + agreement * Math.min(0.1, Math.abs(pull) * 2);
}

function pearson(a: number[], b: number[]): number {
  const n = a.length;
  if (n < 2) return 0;
  const ma = mean(a), mb = mean(b);
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const xa = a[i] - ma, xb = b[i] - mb;
    num += xa * xb; da += xa * xa; db += xb * xb;
  }
  const denom = Math.sqrt(da * db);
  return denom > 0 ? num / denom : 0;
}

/* ============================================================== */
/* 3) Microstructure features (OHLCV-derived)                      */
/* ============================================================== */
export interface MicroFeatures {
  amihud: number;   // illiquidity: |ret|/volume × 1e6
  kyleLambda: number; // price impact slope
  rollSpread: number; // implied spread
}

export function microstructure(
  candles: { close: number; high: number; low: number; volume: number }[],
): MicroFeatures {
  if (candles.length < 5) return { amihud: 0, kyleLambda: 0, rollSpread: 0 };
  const rets: number[] = [];
  const signedFlow: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const r = (candles[i].close - candles[i - 1].close) / candles[i - 1].close;
    rets.push(r);
    signedFlow.push(Math.sign(r) * candles[i].volume);
  }
  // Amihud illiquidity (avg)
  let amihud = 0, an = 0;
  for (let i = 0; i < rets.length; i++) {
    const v = candles[i + 1].volume;
    if (v > 0) { amihud += Math.abs(rets[i]) / v; an++; }
  }
  amihud = an > 0 ? (amihud / an) * 1e6 : 0;

  // Kyle's lambda: slope of return ~ signed volume (simple regression)
  const kyleLambda = simpleSlope(signedFlow, rets);

  // Roll's spread: 2 * sqrt(-cov(Δp_t, Δp_{t-1})) when cov < 0
  const dp: number[] = [];
  for (let i = 1; i < candles.length; i++) dp.push(candles[i].close - candles[i - 1].close);
  let cov = 0;
  for (let i = 1; i < dp.length; i++) cov += dp[i] * dp[i - 1];
  cov /= Math.max(1, dp.length - 1);
  const rollSpread = cov < 0 ? 2 * Math.sqrt(-cov) : 0;

  return { amihud, kyleLambda, rollSpread };
}

export function microMultiplier(mf: MicroFeatures, signal: number): number {
  // High Amihud → low liquidity → less trustworthy moves.
  let mult = 1;
  if (mf.amihud > 50) mult *= 0.9;
  // Positive Kyle aligned with signal → smart money pushing → boost.
  if (Math.sign(mf.kyleLambda) === Math.sign(signal) && Math.abs(mf.kyleLambda) > 1e-9) {
    mult *= 1.05;
  }
  // Wide implied spread → noisy → dampen.
  if (mf.rollSpread > 0.02) mult *= 0.95;
  return mult;
}

function simpleSlope(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  const mx = mean(x.slice(0, n)), my = mean(y.slice(0, n));
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    den += (x[i] - mx) ** 2;
  }
  return den > 0 ? num / den : 0;
}

/* ============================================================== */
/* 4) Adversarial Validation (drift detector)                      */
/* ============================================================== */
interface DistSnapshot { mean: number; std: number; n: number; }
const trainDist = new Map<string, DistSnapshot>();
const recentBuf = new Map<string, number[]>();
const RECENT_MAX = 100;

export function recordTrainSample(feature: string, value: number): void {
  if (!Number.isFinite(value)) return;
  const d = trainDist.get(feature) ?? { mean: 0, std: 0, n: 0 };
  const nNew = d.n + 1;
  const meanNew = d.mean + (value - d.mean) / nNew;
  const varAcc = d.std * d.std * d.n + (value - d.mean) * (value - meanNew);
  trainDist.set(feature, { mean: meanNew, std: Math.sqrt(varAcc / nNew), n: nNew });
}

export function recordRecentSample(feature: string, value: number): void {
  if (!Number.isFinite(value)) return;
  const arr = recentBuf.get(feature) ?? [];
  arr.push(value);
  if (arr.length > RECENT_MAX) arr.shift();
  recentBuf.set(feature, arr);
}

/** Returns drift score [0..1+]. >0.3 = meaningful shift, >0.6 = severe. */
export function driftScore(feature: string): number {
  const d = trainDist.get(feature);
  const r = recentBuf.get(feature);
  if (!d || !r || d.n < 30 || r.length < 20 || d.std === 0) return 0;
  const rMean = mean(r);
  return Math.abs(rMean - d.mean) / d.std;
}

export function globalDriftMultiplier(): number {
  const features = Array.from(trainDist.keys());
  if (features.length === 0) return 1;
  let sum = 0, n = 0;
  for (const f of features) { sum += driftScore(f); n++; }
  const avg = n > 0 ? sum / n : 0;
  if (avg > 0.6) return 0.75;
  if (avg > 0.3) return 0.9;
  return 1;
}

/* ============================================================== */
/* 5) Event Study Engine                                           */
/* ============================================================== */
interface EventRecord { symbol: string; type: string; eventDate: number; car: number[]; }
const eventHistory: EventRecord[] = [];
const EVENT_HISTORY_MAX = 500;

export function recordEvent(
  symbol: string, type: string, eventDate: Date,
  pricesAroundEvent: number[], marketPricesAroundEvent: number[],
): void {
  if (pricesAroundEvent.length < 3) return;
  // CAR = cumulative (asset return - market return) per day
  const car: number[] = [];
  let cum = 0;
  for (let i = 1; i < pricesAroundEvent.length; i++) {
    const ar = (pricesAroundEvent[i] - pricesAroundEvent[i - 1]) / pricesAroundEvent[i - 1];
    const mr = marketPricesAroundEvent[i] && marketPricesAroundEvent[i - 1]
      ? (marketPricesAroundEvent[i] - marketPricesAroundEvent[i - 1]) / marketPricesAroundEvent[i - 1]
      : 0;
    cum += (ar - mr);
    car.push(cum);
  }
  eventHistory.push({ symbol: symbol.toUpperCase(), type, eventDate: eventDate.getTime(), car });
  if (eventHistory.length > EVENT_HISTORY_MAX) eventHistory.shift();
}

/** Expected CAR for an upcoming event of `type`, based on history. */
export function expectedEventCAR(type: string, horizonDays = 5): number {
  const matches = eventHistory.filter((e) => e.type === type && e.car.length >= horizonDays);
  if (matches.length < 5) return 0;
  const vals = matches.map((e) => e.car[Math.min(horizonDays - 1, e.car.length - 1)]);
  return mean(vals);
}

export function eventMultiplier(type: string | null, signal: number): number {
  if (!type) return 1;
  const expected = expectedEventCAR(type);
  if (Math.abs(expected) < 0.005) return 1;
  // Signal aligned with historical event drift → boost.
  return 1 + (Math.sign(expected) === Math.sign(signal) ? 1 : -1) * Math.min(0.08, Math.abs(expected) * 2);
}

/* ============================================================== */
/* Helpers + snapshot/restore                                      */
/* ============================================================== */
function pad(a: number[], n: number): number[] {
  const out = a.slice(0, n).map((v) => Number.isFinite(v) ? Math.max(-3, Math.min(3, v)) : 0);
  while (out.length < n) out.push(0);
  return out;
}
function mean(a: number[]): number {
  if (a.length === 0) return 0;
  let s = 0; for (const v of a) s += v;
  return s / a.length;
}

export function snapshotTierBState() {
  return {
    regimeModels,
    correlations: Array.from(correlations.entries()).map(([k, m]) => [k, Array.from(m.entries())]),
    trainDist: Array.from(trainDist.entries()),
    eventHistory: eventHistory.slice(-200),
  };
}
export function restoreTierBState(s: unknown): void {
  try {
    const obj = s as {
      regimeModels?: typeof regimeModels;
      correlations?: [string, [string, number][]][];
      trainDist?: [string, DistSnapshot][];
      eventHistory?: EventRecord[];
    };
    if (obj?.regimeModels) {
      for (const k of Object.keys(regimeModels) as Regime[]) {
        const m = obj.regimeModels[k];
        if (m && Array.isArray(m.w)) {
          regimeModels[k].w = m.w.slice(0, 4);
          while (regimeModels[k].w.length < 4) regimeModels[k].w.push(0);
          regimeModels[k].b = Number(m.b ?? 0);
          regimeModels[k].n = Number(m.n ?? 0);
        }
      }
    }
    if (Array.isArray(obj?.correlations)) {
      for (const [k, entries] of obj.correlations) {
        correlations.set(k, new Map(entries));
      }
    }
    if (Array.isArray(obj?.trainDist)) {
      for (const [k, v] of obj.trainDist) trainDist.set(k, v);
    }
    if (Array.isArray(obj?.eventHistory)) {
      eventHistory.push(...obj.eventHistory);
    }
  } catch {}
}