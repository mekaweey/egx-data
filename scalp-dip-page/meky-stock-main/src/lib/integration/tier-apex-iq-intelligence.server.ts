/**
 * Tier APEX-IQ — 16 new intelligence layers:
 *   OGB  onlineGradientBoostingMultiplier   (per-regime online learner)
 *   KEL  kellyCriterionMultiplier           (Kelly edge-based sizing)
 *   OFI  microstructureOFIMultiplier        (order-flow imbalance proxy)
 *   WFO  walkForwardOptThresholdMultiplier  (rolling optimal conf threshold)
 *   HMM  hmmRegimeMultiplier                (regime stability via transitions)
 *   CUS  changePointCUSUMMultiplier         (return CUSUM change-point)
 *   COI  cointegrationPairsMultiplier       (sector co-movement bonus)
 *   GAR  garchVolatilityMultiplier          (EWMA vol forecast)
 *   NSS  newsSentimentSentinelMultiplier    (fresh sentiment alignment)
 *   DCB  drawdownCircuitBreakerMultiplier   (rolling DD gate)
 *   TOD  timeOfDayBucketMultiplier          (hour-of-day win rate)
 *   TQS  tradeQualityScoreMultiplier        (Sharpe per signal type)
 *   ADW  adwinDriftDetectorMultiplier       (concept drift on hit rate)
 *   TSM  transformerSequenceMultiplier      (AR(3) of last realized pnls)
 *   TSB  thompsonSamplingBanditMultiplier   (Beta(α,β) tier-group bandit)
 *   SBA  syntheticBootstrapAugmentMultiplier(bootstrap variance check)
 * Pure JS, in-memory, snapshot/restore included.
 */

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

// ───────── 1) OGB ─────────
const ogbWeights: Record<string, { w: number; n: number }> = {};
export function recordOGBOutcome(regime: string, conf: number, realized: number): void {
  if (!Number.isFinite(conf) || !Number.isFinite(realized)) return;
  const k = regime ?? "calm";
  const s = ogbWeights[k] ?? (ogbWeights[k] = { w: 0, n: 0 });
  const target = realized > 0 ? 1 : -1;
  const pred = Math.tanh(s.w * (conf - 50) / 50);
  s.w += 0.02 * (target - pred) * (conf - 50) / 50;
  s.n += 1;
}
export function onlineGradientBoostingMultiplier(regime: string | undefined, conf: number): number {
  const s = ogbWeights[regime ?? "calm"];
  if (!s || s.n < 10) return 1;
  const pred = Math.tanh(s.w * (conf - 50) / 50);
  if (pred > 0.3) return 1.04;
  if (pred < -0.3) return 0.94;
  return 1;
}

// ───────── 2) KEL ─────────
const kelStats = { wins: 0, n: 0, sumWin: 0, sumLoss: 0 };
export function recordKellyOutcomeAPEX(won: boolean, realized: number): void {
  kelStats.n += 1;
  if (won) { kelStats.wins += 1; kelStats.sumWin += Math.abs(realized); }
  else kelStats.sumLoss += Math.abs(realized);
}
export function kellyCriterionMultiplier(): number {
  if (kelStats.n < 15) return 1;
  const p = kelStats.wins / kelStats.n;
  const avgW = kelStats.sumWin / Math.max(kelStats.wins, 1);
  const avgL = kelStats.sumLoss / Math.max(kelStats.n - kelStats.wins, 1);
  if (avgL <= 0) return 1;
  const b = avgW / avgL;
  const kelly = p - (1 - p) / b;
  if (kelly > 0.15) return 1.05;
  if (kelly < -0.05) return 0.92;
  return 1;
}

// ───────── 3) OFI (provided externally as a ratio) ─────────
export function microstructureOFIMultiplier(ofi: number | undefined): number {
  if (!Number.isFinite(ofi as number)) return 1;
  const x = ofi as number;
  if (x > 0.25) return 1.04;
  if (x < -0.25) return 0.95;
  return 1;
}

// ───────── 4) WFO ─────────
const wfoSamples: { conf: number; won: boolean }[] = [];
export function recordWFOSample(conf: number, won: boolean): void {
  wfoSamples.push({ conf, won });
  if (wfoSamples.length > 200) wfoSamples.shift();
}
export function walkForwardOptThresholdMultiplier(currentConf: number): number {
  if (wfoSamples.length < 30) return 1;
  let bestThr = 60, bestAcc = 0;
  for (let thr = 55; thr <= 80; thr += 5) {
    const above = wfoSamples.filter((s) => s.conf >= thr);
    if (above.length < 8) continue;
    const acc = above.filter((s) => s.won).length / above.length;
    if (acc > bestAcc) { bestAcc = acc; bestThr = thr; }
  }
  if (currentConf >= bestThr && bestAcc > 0.55) return 1.04;
  if (currentConf < bestThr - 10) return 0.95;
  return 1;
}

// ───────── 5) HMM (regime transitions) ─────────
const hmmTrans: Record<string, number> = {};
let hmmPrev: string | null = null;
export function recordHMMRegime(regime: string): void {
  if (!regime) return;
  if (hmmPrev) {
    const k = `${hmmPrev}->${regime}`;
    hmmTrans[k] = (hmmTrans[k] ?? 0) + 1;
  }
  hmmPrev = regime;
}
export function hmmRegimeMultiplier(regime: string | undefined): number {
  if (!regime || !hmmPrev) return 1;
  const stayKey = `${regime}->${regime}`;
  const stays = hmmTrans[stayKey] ?? 0;
  let total = 0;
  for (const k of Object.keys(hmmTrans)) if (k.startsWith(`${regime}->`)) total += hmmTrans[k];
  if (total < 8) return 1;
  const persistence = stays / total;
  if (persistence > 0.7) return 1.03;
  if (persistence < 0.3) return 0.95;
  return 1;
}

// ───────── 6) CUSUM change-point ─────────
const cusum = { pos: 0, neg: 0, n: 0 };
export function recordCUSUMReturn(ret: number): void {
  if (!Number.isFinite(ret)) return;
  const k = 0.5;
  cusum.pos = Math.max(0, cusum.pos + ret - k);
  cusum.neg = Math.min(0, cusum.neg + ret + k);
  cusum.n += 1;
}
export function changePointCUSUMMultiplier(): number {
  if (cusum.n < 10) return 1;
  if (cusum.pos > 5) return 1.03;
  if (cusum.neg < -5) return 0.93;
  return 1;
}

// ───────── 7) Cointegration / sector co-movement ─────────
const coiSector: Record<string, number[]> = {};
export function recordCointegrationReturn(sector: string, ret: number): void {
  if (!sector || !Number.isFinite(ret)) return;
  const a = coiSector[sector] ?? (coiSector[sector] = []);
  a.push(ret); if (a.length > 60) a.shift();
}
export function cointegrationPairsMultiplier(sector: string | undefined): number {
  if (!sector) return 1;
  const a = coiSector[sector];
  if (!a || a.length < 20) return 1;
  const mean = a.reduce((x, y) => x + y, 0) / a.length;
  const variance = a.reduce((s, r) => s + (r - mean) ** 2, 0) / a.length;
  const stable = variance < 4;
  if (stable && mean > 0.2) return 1.04;
  if (!stable && mean < -0.2) return 0.94;
  return 1;
}

// ───────── 8) GARCH-like EWMA volatility ─────────
let garchVar = 1;
export function recordGARCHReturn(ret: number): void {
  if (!Number.isFinite(ret)) return;
  garchVar = 0.94 * garchVar + 0.06 * ret * ret;
}
export function garchVolatilityMultiplier(): number {
  if (garchVar > 8) return 0.94; // high forecasted vol → de-risk
  if (garchVar < 1.5) return 1.03; // low vol → boost
  return 1;
}

// ───────── 9) News-sentiment sentinel ─────────
const nssBy: Record<string, { score: number; ts: number }> = {};
export function recordNewsSentinel(symbol: string, score: number): void {
  if (!symbol || !Number.isFinite(score)) return;
  nssBy[symbol] = { score, ts: Date.now() };
}
export function newsSentimentSentinelMultiplier(symbol: string | undefined, signal: string | undefined): number {
  if (!symbol) return 1;
  const r = nssBy[symbol];
  if (!r) return 1;
  const ageH = (Date.now() - r.ts) / 3600000;
  if (ageH > 24) return 1;
  const sig = (signal ?? "").toLowerCase();
  if (sig.includes("buy") && r.score > 0.3) return 1.04;
  if (sig.includes("buy") && r.score < -0.3) return 0.93;
  if (sig.includes("sell") && r.score < -0.3) return 1.04;
  if (sig.includes("sell") && r.score > 0.3) return 0.93;
  return 1;
}

// ───────── 10) Drawdown circuit breaker ─────────
const ddSeries: number[] = [];
let ddEquity = 100, ddPeak = 100;
export function recordDrawdownReturn(realized: number): void {
  if (!Number.isFinite(realized)) return;
  ddEquity *= 1 + realized / 100;
  ddPeak = Math.max(ddPeak, ddEquity);
  ddSeries.push((ddEquity - ddPeak) / ddPeak);
  if (ddSeries.length > 50) ddSeries.shift();
}
export function drawdownCircuitBreakerMultiplier(): number {
  if (ddSeries.length < 10) return 1;
  const current = ddSeries[ddSeries.length - 1];
  if (current < -0.15) return 0.85; // severe DD → strongly reduce
  if (current < -0.08) return 0.93;
  if (current > -0.02) return 1.02;
  return 1;
}

// ───────── 11) Time-of-day bucket ─────────
const todBuckets: Record<number, { hits: number; n: number }> = {};
export function recordTimeOfDayOutcome(hour: number, won: boolean): void {
  const h = Math.max(0, Math.min(23, Math.floor(hour)));
  const b = todBuckets[h] ?? (todBuckets[h] = { hits: 0, n: 0 });
  b.n += 1; if (won) b.hits += 1;
}
export function timeOfDayBucketMultiplier(hour: number | undefined): number {
  if (!Number.isFinite(hour as number)) return 1;
  const b = todBuckets[Math.max(0, Math.min(23, Math.floor(hour as number)))];
  if (!b || b.n < 8) return 1;
  const rate = b.hits / b.n;
  if (rate > 0.6) return 1.04;
  if (rate < 0.4) return 0.94;
  return 1;
}

// ───────── 12) Trade quality (Sharpe per signal type) ─────────
const tqsBy: Record<string, { rets: number[] }> = {};
export function recordTradeQuality(signalType: string, realized: number): void {
  if (!signalType || !Number.isFinite(realized)) return;
  const s = tqsBy[signalType] ?? (tqsBy[signalType] = { rets: [] });
  s.rets.push(realized); if (s.rets.length > 80) s.rets.shift();
}
export function tradeQualityScoreMultiplier(signalType: string | undefined): number {
  if (!signalType) return 1;
  const s = tqsBy[signalType];
  if (!s || s.rets.length < 10) return 1;
  const m = s.rets.reduce((a, b) => a + b, 0) / s.rets.length;
  const v = s.rets.reduce((acc, r) => acc + (r - m) ** 2, 0) / s.rets.length;
  const sharpe = m / Math.max(Math.sqrt(v), 0.01);
  if (sharpe > 0.4) return 1.04;
  if (sharpe < -0.4) return 0.93;
  return 1;
}

// ───────── 13) ADWIN-like drift on hit rate ─────────
const adwinWin: boolean[] = [];
export function recordADWINOutcome(won: boolean): void {
  adwinWin.push(won); if (adwinWin.length > 200) adwinWin.shift();
}
export function adwinDriftDetectorMultiplier(): number {
  if (adwinWin.length < 40) return 1;
  const half = Math.floor(adwinWin.length / 2);
  const early = adwinWin.slice(0, half).filter(Boolean).length / half;
  const late = adwinWin.slice(half).filter(Boolean).length / (adwinWin.length - half);
  const delta = late - early;
  if (delta > 0.1) return 1.04;  // improving
  if (delta < -0.1) return 0.92; // degrading
  return 1;
}

// ───────── 14) Transformer-ish AR(3) on last realized ─────────
const tsmRets: number[] = [];
export function recordTSMReturn(ret: number): void {
  if (!Number.isFinite(ret)) return;
  tsmRets.push(ret); if (tsmRets.length > 50) tsmRets.shift();
}
export function transformerSequenceMultiplier(): number {
  const n = tsmRets.length;
  if (n < 8) return 1;
  const last3 = tsmRets.slice(-3);
  const pred = 0.5 * last3[2] + 0.3 * last3[1] + 0.2 * last3[0];
  if (pred > 1) return 1.04;
  if (pred < -1) return 0.94;
  return 1;
}

// ───────── 15) Thompson Sampling bandit (Beta) over tier groups ─────────
const tsbArms: Record<string, { a: number; b: number }> = {};
export function recordThompsonOutcome(arm: string, won: boolean): void {
  const x = tsbArms[arm] ?? (tsbArms[arm] = { a: 1, b: 1 });
  if (won) x.a += 1; else x.b += 1;
}
function betaMean(a: number, b: number): number { return a / (a + b); }
export function thompsonSamplingBanditMultiplier(arm: string | undefined): number {
  if (!arm) return 1;
  const x = tsbArms[arm];
  if (!x || x.a + x.b < 6) return 1;
  const m = betaMean(x.a, x.b);
  if (m > 0.6) return 1.04;
  if (m < 0.4) return 0.94;
  return 1;
}

// ───────── 16) Synthetic bootstrap augmentation variance check ─────────
const sbaRets: number[] = [];
export function recordSBAReturn(ret: number): void {
  if (!Number.isFinite(ret)) return;
  sbaRets.push(ret); if (sbaRets.length > 100) sbaRets.shift();
}
export function syntheticBootstrapAugmentMultiplier(): number {
  const n = sbaRets.length;
  if (n < 25) return 1;
  // 100 bootstrap means
  const means: number[] = [];
  for (let i = 0; i < 100; i++) {
    let s = 0;
    for (let j = 0; j < n; j++) s += sbaRets[Math.floor(Math.random() * n)];
    means.push(s / n);
  }
  means.sort((a, b) => a - b);
  const lo = means[2], hi = means[97];
  if (lo > 0.3) return 1.04;   // robust positive
  if (hi < -0.3) return 0.92;  // robust negative
  if (hi - lo > 4) return 0.96; // unstable
  return 1;
}

// ───────── Snapshot / Restore ─────────
export function snapshotTierApexIQState(): unknown {
  return {
    ogbWeights, kelStats: { ...kelStats }, wfoSamples,
    hmmTrans, hmmPrev, cusum: { ...cusum }, coiSector,
    garchVar, nssBy, ddSeries, ddEquity, ddPeak,
    todBuckets, tqsBy, adwinWin, tsmRets, tsbArms, sbaRets,
  };
}
export function restoreTierApexIQState(s: unknown): void {
  try {
    const d = s as Record<string, unknown>;
    if (d.ogbWeights) Object.assign(ogbWeights, d.ogbWeights);
    if (d.kelStats) Object.assign(kelStats, d.kelStats);
    if (Array.isArray(d.wfoSamples)) { wfoSamples.length = 0; wfoSamples.push(...(d.wfoSamples as typeof wfoSamples)); }
    if (d.hmmTrans) Object.assign(hmmTrans, d.hmmTrans);
    if (typeof d.hmmPrev === "string" || d.hmmPrev === null) hmmPrev = d.hmmPrev as string | null;
    if (d.cusum) Object.assign(cusum, d.cusum);
    if (d.coiSector) Object.assign(coiSector, d.coiSector);
    if (typeof d.garchVar === "number") garchVar = d.garchVar;
    if (d.nssBy) Object.assign(nssBy, d.nssBy);
    if (Array.isArray(d.ddSeries)) { ddSeries.length = 0; ddSeries.push(...(d.ddSeries as number[])); }
    if (typeof d.ddEquity === "number") ddEquity = d.ddEquity;
    if (typeof d.ddPeak === "number") ddPeak = d.ddPeak;
    if (d.todBuckets) Object.assign(todBuckets, d.todBuckets);
    if (d.tqsBy) Object.assign(tqsBy, d.tqsBy);
    if (Array.isArray(d.adwinWin)) { adwinWin.length = 0; adwinWin.push(...(d.adwinWin as boolean[])); }
    if (Array.isArray(d.tsmRets)) { tsmRets.length = 0; tsmRets.push(...(d.tsmRets as number[])); }
    if (d.tsbArms) Object.assign(tsbArms, d.tsbArms);
    if (Array.isArray(d.sbaRets)) { sbaRets.length = 0; sbaRets.push(...(d.sbaRets as number[])); }
  } catch { /* noop */ }
}

export { clamp as _apexClamp };