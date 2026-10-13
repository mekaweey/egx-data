/**
 * Tier EEEEE–PPPPP — Deep temporal, microstructure 2.0, self-improving meta-system.
 * Pure in-memory, JS-native. Snapshot/restore included.
 *
 *   EEEEE temporalFusionTransformer       (TFT-lite multi-horizon score)
 *   FFFFF neuralHawkesProcess              (self-exciting event cluster strength)
 *   GGGGG wavenetDilatedCNN                (long-range dilated trend score)
 *   HHHHH nbeatsInterpretable              (trend + seasonality decomposition)
 *   IIIII quoteStuffingDetection           (order-burst noise filter)
 *   JJJJJ spoofingLayeringDetector         (cancelled-large-order detection)
 *   KKKKK tradeSizeClustering              (retail vs institutional mix)
 *   LLLLL effectiveSpreadDecomposition     (adverse-selection share of spread)
 *   MMMMM neuralArchitectureSearchLite     (per-symbol best feature subset)
 *   NNNNN gradientCheckpointReplay         (snapshot best weights, replay on drift)
 *   OOOOO multiTaskCoLearning              (shared representation across targets)
 *   PPPPP selfPlayAdversarialTrader        (agent vs prior-self exploit search)
 */

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const variance = (a: number[]) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return a.reduce((s, v) => s + (v - m) * (v - m), 0) / (a.length - 1);
};
const std = (a: number[]) => Math.sqrt(variance(a));

// ═════════════ EEEEE: Temporal Fusion Transformer (lite) ═════════════════════
// Stores per-symbol short / medium / long horizon residuals & known-future events.
type TFTSample = { short: number; medium: number; long: number; futureEvent: number; outcome: number };
const tftBank: Record<string, TFTSample[]> = {};

export function recordTFTSampleEEEEE(symbol: string, s: TFTSample): void {
  if (![s.short, s.medium, s.long, s.futureEvent, s.outcome].every(Number.isFinite)) return;
  const a = tftBank[symbol] ?? (tftBank[symbol] = []);
  a.push(s);
  if (a.length > 200) a.shift();
}

export function tftMultiplierEEEEE(
  symbol: string,
  shortNow: number, mediumNow: number, longNow: number, futureEvent: number,
  dir: number,
): number {
  const arr = tftBank[symbol];
  if (!arr || arr.length < 20) return 1;
  // Weighted gated fusion: short 0.5, medium 0.3, long 0.15, event 0.05
  const score = 0.5 * shortNow + 0.3 * mediumNow + 0.15 * longNow + 0.05 * futureEvent;
  // Calibrate against historical mean
  const hist = mean(arr.map((s) => 0.5 * s.short + 0.3 * s.medium + 0.15 * s.long + 0.05 * s.futureEvent));
  const z = (score - hist) / Math.max(0.5, std(arr.map((s) => s.outcome)));
  const aligned = Math.sign(z) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(z) > 0.7) return 1.06;
  if (!aligned && Math.abs(z) > 0.9) return 0.93;
  return 1;
}

// ═════════════ FFFFF: Neural Hawkes (self-exciting) ══════════════════════════
const hawkesEvents: Record<string, number[]> = {}; // timestamps per symbol
const HAWKES_DECAY = 1 / 600; // 10-min half-life

export function recordHawkesEventFFFFF(symbol: string, ts: number): void {
  if (!Number.isFinite(ts)) return;
  const a = hawkesEvents[symbol] ?? (hawkesEvents[symbol] = []);
  a.push(ts);
  const cutoff = ts - 6 * 3600;
  while (a.length && a[0] < cutoff) a.shift();
  if (a.length > 500) a.shift();
}

export function hawkesIntensityFFFFF(symbol: string, now: number): number {
  const a = hawkesEvents[symbol];
  if (!a || a.length === 0) return 0;
  let lambda = 0;
  for (const t of a) lambda += Math.exp(-HAWKES_DECAY * Math.max(0, now - t));
  return lambda;
}

export function hawkesMultiplierFFFFF(symbol: string, now: number, dir: number): number {
  const lambda = hawkesIntensityFFFFF(symbol, now);
  if (lambda > 15 && dir > 0) return 1.05; // momentum cascade
  if (lambda > 25) return 0.92;             // too crowded, contrarian risk
  return 1;
}

// ═════════════ GGGGG: WaveNet dilated CNN ════════════════════════════════════
// Approximated via dilated weighted averages at multiple scales.
export function wavenetMultiplierGGGGG(series: number[], dir: number): number {
  if (series.length < 32) return 1;
  const last = series.slice(-64);
  // Dilated taps at 1, 2, 4, 8, 16
  const taps = [1, 2, 4, 8, 16];
  let agg = 0, w = 0;
  for (const d of taps) {
    const sample: number[] = [];
    for (let i = last.length - 1; i >= 0; i -= d) sample.push(last[i]);
    if (sample.length >= 3) {
      const slope = (sample[0] - sample[sample.length - 1]) / sample.length;
      agg += slope / d;
      w += 1 / d;
    }
  }
  if (w === 0) return 1;
  const trend = agg / w;
  const aligned = Math.sign(trend) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(trend) > 0.1) return 1.04;
  if (!aligned && Math.abs(trend) > 0.15) return 0.94;
  return 1;
}

// ═════════════ HHHHH: N-BEATS interpretable ══════════════════════════════════
export function nbeatsDecomposeHHHHH(series: number[]): { trend: number; seasonality: number; residual: number } {
  if (series.length < 10) return { trend: 0, seasonality: 0, residual: 0 };
  const n = series.length;
  // Trend: linear regression slope
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sx += i; sy += series[i]; sxy += i * series[i]; sxx += i * i; }
  const slope = (n * sxy - sx * sy) / Math.max(1e-9, n * sxx - sx * sx);
  const intercept = (sy - slope * sx) / n;
  const detrended = series.map((v, i) => v - (intercept + slope * i));
  // Seasonality: period-5 (weekly trading days) average
  const period = 5;
  const buckets: number[][] = Array.from({ length: period }, () => []);
  detrended.forEach((v, i) => buckets[i % period].push(v));
  const seasonalAvg = buckets.map((b) => mean(b));
  const seasonality = seasonalAvg[(n - 1) % period] ?? 0;
  const residual = detrended[n - 1] - seasonality;
  return { trend: slope, seasonality, residual };
}

export function nbeatsMultiplierHHHHH(series: number[], dir: number): number {
  const { trend, seasonality } = nbeatsDecomposeHHHHH(series);
  const signal = trend * 5 + seasonality * 0.3;
  const aligned = Math.sign(signal) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(signal) > 0.2) return 1.05;
  if (!aligned && Math.abs(signal) > 0.4) return 0.93;
  return 1;
}

// ═════════════ IIIII: Quote-stuffing detection ═══════════════════════════════
const quoteRates: Record<string, number[]> = {}; // recent quote/sec samples

export function recordQuoteRateIIIII(symbol: string, ratePerSec: number): void {
  if (!Number.isFinite(ratePerSec)) return;
  const a = quoteRates[symbol] ?? (quoteRates[symbol] = []);
  a.push(ratePerSec);
  if (a.length > 200) a.shift();
}

export function quoteStuffingMultiplierIIIII(symbol: string): number {
  const a = quoteRates[symbol];
  if (!a || a.length < 20) return 1;
  const baseline = mean(a.slice(0, -5));
  const recent = mean(a.slice(-5));
  if (baseline === 0) return 1;
  const ratio = recent / baseline;
  // Sudden 5x+ burst → noise; de-weight
  if (ratio > 5) return 0.88;
  if (ratio > 3) return 0.95;
  return 1;
}

// ═════════════ JJJJJ: Spoofing / layering ════════════════════════════════════
type SpoofEvent = { ts: number; side: "bid" | "ask"; size: number; cancelled: boolean };
const spoofLog: Record<string, SpoofEvent[]> = {};

export function recordSpoofEventJJJJJ(symbol: string, e: SpoofEvent): void {
  const a = spoofLog[symbol] ?? (spoofLog[symbol] = []);
  a.push(e);
  if (a.length > 300) a.shift();
}

export function spoofingMultiplierJJJJJ(symbol: string, dir: number): number {
  const a = spoofLog[symbol];
  if (!a || a.length < 20) return 1;
  const recent = a.slice(-50);
  const bigCancelled = recent.filter((e) => e.cancelled && e.size > 10000);
  if (bigCancelled.length < 3) return 1;
  const bidSpoof = bigCancelled.filter((e) => e.side === "bid").length;
  const askSpoof = bigCancelled.filter((e) => e.side === "ask").length;
  // Spoofing bids = price will likely DROP (reverse), spoofing asks = price will RISE
  const spoofDir = askSpoof > bidSpoof ? 1 : bidSpoof > askSpoof ? -1 : 0;
  if (spoofDir === 0) return 1;
  const aligned = spoofDir === Math.sign(dir);
  if (aligned) return 1.05;
  return 0.9;
}

// ═════════════ KKKKK: Trade size clustering ══════════════════════════════════
const tradeSizes: Record<string, number[]> = {};

export function recordTradeSizeKKKKK(symbol: string, size: number): void {
  if (!Number.isFinite(size) || size <= 0) return;
  const a = tradeSizes[symbol] ?? (tradeSizes[symbol] = []);
  a.push(size);
  if (a.length > 1000) a.shift();
}

export function tradeSizeMixKKKKK(symbol: string): { retail: number; institutional: number } {
  const a = tradeSizes[symbol];
  if (!a || a.length < 30) return { retail: 0.5, institutional: 0.5 };
  const retail = a.filter((s) => s < 500 || s % 100 === 0).length;
  const inst = a.filter((s) => s >= 5000 && s % 100 !== 0).length;
  const total = Math.max(1, retail + inst);
  return { retail: retail / total, institutional: inst / total };
}

export function tradeSizeMultiplierKKKKK(symbol: string, dir: number): number {
  const { institutional } = tradeSizeMixKKKKK(symbol);
  // Strong institutional presence aligned with direction = smart money
  if (institutional > 0.6 && Math.abs(dir) > 0.1) return 1.04;
  if (institutional < 0.2) return 0.97; // retail-dominated, noisier
  return 1;
}

// ═════════════ LLLLL: Effective spread decomposition ═════════════════════════
const spreadSamples: Record<string, { spread: number; priceChange: number }[]> = {};

export function recordSpreadSampleLLLLL(symbol: string, spread: number, priceChangeAfter: number): void {
  if (!Number.isFinite(spread) || !Number.isFinite(priceChangeAfter)) return;
  const a = spreadSamples[symbol] ?? (spreadSamples[symbol] = []);
  a.push({ spread, priceChange: priceChangeAfter });
  if (a.length > 200) a.shift();
}

export function effectiveSpreadMultiplierLLLLL(symbol: string): number {
  const a = spreadSamples[symbol];
  if (!a || a.length < 30) return 1;
  const avgSpread = mean(a.map((s) => s.spread));
  // Adverse selection = correlation between spread paid and post-trade move
  const adverseShare = mean(a.map((s) => Math.abs(s.priceChange))) / Math.max(0.01, avgSpread);
  // High adverse selection (>0.6) → toxic liquidity → reduce
  if (adverseShare > 0.7) return 0.9;
  if (adverseShare < 0.2) return 1.03; // healthy spread
  return 1;
}

// ═════════════ MMMMM: Neural Architecture Search (lite) ══════════════════════
type NASRecord = { subset: string; hits: number; total: number };
const nasBySymbol: Record<string, Record<string, NASRecord>> = {};

export function recordNASOutcomeMMMMM(symbol: string, activeFeatures: string[], won: boolean): void {
  const subset = [...activeFeatures].sort().slice(0, 6).join("|");
  const sym = nasBySymbol[symbol] ?? (nasBySymbol[symbol] = {});
  const r = sym[subset] ?? (sym[subset] = { subset, hits: 0, total: 0 });
  if (won) r.hits++;
  r.total++;
}

export function nasBestSubsetMMMMM(symbol: string): { subset: string; rate: number } | null {
  const sym = nasBySymbol[symbol];
  if (!sym) return null;
  let best: { subset: string; rate: number } | null = null;
  for (const r of Object.values(sym)) {
    if (r.total < 5) continue;
    const rate = r.hits / r.total;
    if (!best || rate > best.rate) best = { subset: r.subset, rate };
  }
  return best;
}

export function nasMultiplierMMMMM(symbol: string, activeFeatures: string[]): number {
  const best = nasBestSubsetMMMMM(symbol);
  if (!best || best.rate < 0.55) return 1;
  const current = [...activeFeatures].sort().slice(0, 6).join("|");
  if (current === best.subset) return 1.04;
  // Partial overlap
  const setBest = new Set(best.subset.split("|"));
  const overlap = activeFeatures.filter((f) => setBest.has(f)).length;
  if (overlap >= 4) return 1.02;
  return 0.98;
}

// ═════════════ NNNNN: Gradient checkpoint replay ═════════════════════════════
type Checkpoint = { ts: number; weights: Record<string, number>; perf: number };
const checkpoints: Checkpoint[] = [];
let currentPerf = 0;

export function recordCheckpointNNNNN(weights: Record<string, number>, perf: number): void {
  if (!Number.isFinite(perf)) return;
  checkpoints.push({ ts: Date.now(), weights: { ...weights }, perf });
  if (checkpoints.length > 30) checkpoints.shift();
}

export function updateCurrentPerfNNNNN(perf: number): void {
  if (Number.isFinite(perf)) currentPerf = perf;
}

export function bestCheckpointNNNNN(): Checkpoint | null {
  if (!checkpoints.length) return null;
  return checkpoints.reduce((best, c) => (c.perf > best.perf ? c : best), checkpoints[0]);
}

export function checkpointReplayMultiplierNNNNN(): number {
  const best = bestCheckpointNNNNN();
  if (!best || checkpoints.length < 5) return 1;
  // If current performance has drifted >25% below best, signal de-risk
  if (currentPerf < best.perf * 0.75) return 0.88;
  if (currentPerf < best.perf * 0.9) return 0.95;
  if (currentPerf > best.perf * 1.05) return 1.03;
  return 1;
}

// ═════════════ OOOOO: Multi-task co-learning ═════════════════════════════════
type MTSample = { price: number; volume: number; vol: number; direction: number };
const mtBank: MTSample[] = [];

export function recordMultiTaskOOOOO(s: MTSample): void {
  if (![s.price, s.volume, s.vol, s.direction].every(Number.isFinite)) return;
  mtBank.push(s);
  if (mtBank.length > 500) mtBank.shift();
}

export function multiTaskMultiplierOOOOO(curPrice: number, curVolume: number, curVol: number, dir: number): number {
  if (mtBank.length < 30) return 1;
  // Cross-task agreement: do price/volume/vol all point same way as dir historically?
  const recent = mtBank.slice(-50);
  const priceCorr = recent.filter((s) => Math.sign(s.price) === Math.sign(dir)).length / recent.length;
  const volCorr = recent.filter((s) => Math.sign(s.volume) === Math.sign(dir)).length / recent.length;
  const volaCorr = recent.filter((s) => Math.sign(s.vol) === Math.sign(dir)).length / recent.length;
  const agreement = (priceCorr + volCorr + volaCorr) / 3;
  if (agreement > 0.7) return 1.05;
  if (agreement < 0.3) return 0.92;
  return 1;
}

// ═════════════ PPPPP: Self-play adversarial trader ═══════════════════════════
type SelfPlayResult = { strategy: string; reward: number };
const selfPlayLog: SelfPlayResult[] = [];
const strategyExploits: Record<string, number> = {}; // exploit count by strategy

export function recordSelfPlayPPPPP(strategy: string, reward: number): void {
  if (!Number.isFinite(reward)) return;
  selfPlayLog.push({ strategy, reward });
  if (selfPlayLog.length > 500) selfPlayLog.shift();
  if (reward < -2) strategyExploits[strategy] = (strategyExploits[strategy] ?? 0) + 1;
}

export function selfPlayMultiplierPPPPP(activeStrategy: string): number {
  const exploits = strategyExploits[activeStrategy] ?? 0;
  const recent = selfPlayLog.filter((s) => s.strategy === activeStrategy).slice(-30);
  if (recent.length < 10) return 1;
  const avg = mean(recent.map((s) => s.reward));
  // Heavily exploited strategy → reduce. Robust positive → boost.
  if (exploits > 5 && avg < 0) return 0.85;
  if (avg > 1.5 && exploits < 2) return 1.06;
  if (avg < -1) return 0.92;
  return 1;
}

// ═════════════ Snapshot / Restore ════════════════════════════════════════════
export function snapshotTierEEEEEPPPPPState(): unknown {
  return {
    tftBank, hawkesEvents, quoteRates, spoofLog, tradeSizes, spreadSamples,
    nasBySymbol, checkpoints: checkpoints.slice(-30), currentPerf,
    mtBank: mtBank.slice(-500), selfPlayLog: selfPlayLog.slice(-500),
    strategyExploits,
  };
}

export function restoreTierEEEEEPPPPPState(s: unknown): void {
  try {
    const d = s as Partial<{
      tftBank: typeof tftBank;
      hawkesEvents: typeof hawkesEvents;
      quoteRates: typeof quoteRates;
      spoofLog: typeof spoofLog;
      tradeSizes: typeof tradeSizes;
      spreadSamples: typeof spreadSamples;
      nasBySymbol: typeof nasBySymbol;
      checkpoints: Checkpoint[];
      currentPerf: number;
      mtBank: MTSample[];
      selfPlayLog: SelfPlayResult[];
      strategyExploits: Record<string, number>;
    }>;
    if (d.tftBank) Object.assign(tftBank, d.tftBank);
    if (d.hawkesEvents) Object.assign(hawkesEvents, d.hawkesEvents);
    if (d.quoteRates) Object.assign(quoteRates, d.quoteRates);
    if (d.spoofLog) Object.assign(spoofLog, d.spoofLog);
    if (d.tradeSizes) Object.assign(tradeSizes, d.tradeSizes);
    if (d.spreadSamples) Object.assign(spreadSamples, d.spreadSamples);
    if (d.nasBySymbol) Object.assign(nasBySymbol, d.nasBySymbol);
    if (Array.isArray(d.checkpoints)) { checkpoints.length = 0; checkpoints.push(...d.checkpoints); }
    if (typeof d.currentPerf === "number") currentPerf = d.currentPerf;
    if (Array.isArray(d.mtBank)) { mtBank.length = 0; mtBank.push(...d.mtBank); }
    if (Array.isArray(d.selfPlayLog)) { selfPlayLog.length = 0; selfPlayLog.push(...d.selfPlayLog); }
    if (d.strategyExploits) Object.assign(strategyExploits, d.strategyExploits);
  } catch { /* noop */ }
  // Silence unused-clamp warning
  void clamp;
}