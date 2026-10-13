/**
 * Tier MASTER-IQ — 11 advanced intelligence layers:
 *   MLB   metaLabelTripleBarrierMultiplier   (TP/SL/Time probability)
 *   PCV   purgedCVReliabilityMultiplier      (purged k-fold OOS accuracy)
 *   FID   featureImportanceDriftMultiplier   (drift-aware penalty)
 *   ICE   isotonicEnsembleCalibMultiplier    (bucket hit-rate calibration)
 *   HRP   hrpClusterRiskMultiplier           (sector/cluster co-movement)
 *   JDG   llmJudgeContradictionMultiplier    (rule-based contradiction gate)
 *   CDV   causalDiscoveryMultiplier          (partial-correlation pruning)
 *   RLP   rlPositionSizingMultiplier         (state-action value)
 *   SAB   shadowABNewLayerMultiplier         (shadow A/B vs production)
 *   DEC   confidenceDecompositionMultiplier  (explainability — always 1)
 *   FED   federatedSectorOutcomeMultiplier   (sector-level fast learning)
 * Pure JS, in-memory, snapshot/restore included.
 */

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

// ───────── 1) MLB: Meta-Labeling / Triple-Barrier ─────────
const mlbStats = { tp: 0, sl: 0, time: 0, n: 0 };
export function recordMetaLabelTripleBarrier(label: "tp" | "sl" | "time"): void {
  mlbStats[label] += 1; mlbStats.n += 1;
}
export function metaLabelTripleBarrierMultiplier(currentConf: number): number {
  if (mlbStats.n < 15) return 1;
  const pTP = mlbStats.tp / mlbStats.n;
  if (pTP > 0.55 && currentConf >= 65) return 1.04;
  if (pTP < 0.35) return 0.93;
  return 1;
}

// ───────── 2) PCV: Purged Cross-Validation reliability ─────────
const pcvFolds: { hits: number; n: number }[] = Array.from({ length: 5 }, () => ({ hits: 0, n: 0 }));
export function recordPurgedFoldOutcome(foldIdx: number, won: boolean): void {
  const i = Math.abs(foldIdx) % pcvFolds.length;
  pcvFolds[i].n += 1; if (won) pcvFolds[i].hits += 1;
}
export function purgedCVReliabilityMultiplier(): number {
  const valid = pcvFolds.filter((f) => f.n >= 5);
  if (valid.length < 3) return 1;
  const accs = valid.map((f) => f.hits / f.n);
  const mean = accs.reduce((a, b) => a + b, 0) / accs.length;
  const variance = accs.reduce((s, a) => s + (a - mean) ** 2, 0) / accs.length;
  const stable = variance < 0.02;
  if (stable && mean > 0.55) return 1.05;
  if (!stable || mean < 0.45) return 0.94;
  return 1;
}

// ───────── 3) FID: Feature Importance Drift ─────────
const fidRolling: Record<string, number[]> = {};
export function recordFeatureImportanceFID(name: string, importance: number): void {
  if (!name || !Number.isFinite(importance)) return;
  const arr = fidRolling[name] ?? (fidRolling[name] = []);
  arr.push(importance);
  if (arr.length > 50) arr.shift();
}
export function featureImportanceDriftMultiplier(activeFeatures: string[]): number {
  if (!activeFeatures || activeFeatures.length === 0) return 1;
  let driftSum = 0, checked = 0;
  for (const name of activeFeatures) {
    const arr = fidRolling[name];
    if (!arr || arr.length < 20) continue;
    const early = arr.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
    const late = arr.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const drift = Math.abs(late - early) / Math.max(Math.abs(early), 0.01);
    driftSum += drift; checked += 1;
  }
  if (checked < 2) return 1;
  const avgDrift = driftSum / checked;
  if (avgDrift > 0.5) return 0.93;
  if (avgDrift < 0.15) return 1.03;
  return 1;
}

// ───────── 4) ICE: Isotonic Ensemble Calibration ─────────
const iceBuckets: { hits: number; n: number }[] = Array.from({ length: 10 }, () => ({ hits: 0, n: 0 }));
export function recordIsotonicEnsembleOutcome(conf: number, won: boolean): void {
  const b = Math.max(0, Math.min(9, Math.floor(conf / 10)));
  iceBuckets[b].n += 1; if (won) iceBuckets[b].hits += 1;
}
export function isotonicEnsembleCalibMultiplier(currentConf: number): number {
  const b = Math.max(0, Math.min(9, Math.floor(currentConf / 10)));
  const bucket = iceBuckets[b];
  if (!bucket || bucket.n < 8) return 1;
  const actualRate = bucket.hits / bucket.n;
  const expectedRate = (b * 10 + 5) / 100;
  const gap = actualRate - expectedRate;
  if (gap > 0.1) return 1.04;   // under-confident
  if (gap < -0.1) return 0.94;  // over-confident
  return 1;
}

// ───────── 5) HRP: Hierarchical Risk Parity cluster ─────────
const hrpClusters: Record<string, { ret: number[]; n: number }> = {};
export function recordHRPClusterReturn(cluster: string, ret: number): void {
  if (!cluster || !Number.isFinite(ret)) return;
  const c = hrpClusters[cluster] ?? (hrpClusters[cluster] = { ret: [], n: 0 });
  c.ret.push(ret); c.n += 1;
  if (c.ret.length > 100) c.ret.shift();
}
export function hrpClusterRiskMultiplier(cluster: string | undefined): number {
  if (!cluster) return 1;
  const c = hrpClusters[cluster];
  if (!c || c.n < 10) return 1;
  const m = c.ret.reduce((a, b) => a + b, 0) / c.ret.length;
  const v = c.ret.reduce((s, r) => s + (r - m) ** 2, 0) / c.ret.length;
  const sharpe = m / Math.max(Math.sqrt(v), 0.01);
  if (sharpe > 0.5) return 1.04;
  if (sharpe < -0.5) return 0.93;
  return 1;
}

// ───────── 6) JDG: LLM-Judge (rule-based contradiction) ─────────
export function llmJudgeContradictionMultiplier(opts: {
  signal?: string; regime?: string; confidence: number;
}): number {
  const sig = (opts.signal ?? "").toLowerCase();
  const reg = (opts.regime ?? "").toLowerCase();
  const bullish = sig.includes("buy");
  const bearish = sig.includes("sell");
  const strongBear = reg.includes("down") || reg.includes("bear");
  const strongBull = reg.includes("up") || reg.includes("bull");
  // Hard contradiction
  if (bullish && strongBear && opts.confidence > 70) return 0.88;
  if (bearish && strongBull && opts.confidence > 70) return 0.88;
  // Alignment bonus
  if ((bullish && strongBull) || (bearish && strongBear)) return 1.03;
  return 1;
}

// ───────── 7) CDV: Causal Discovery (partial correlation) ─────────
const cdvLinks: Record<string, { sumXY: number; sumX: number; sumY: number; sumX2: number; sumY2: number; n: number }> = {};
export function recordCausalLinkCDV(feature: string, signal: number, realized: number): void {
  if (!feature || ![signal, realized].every(Number.isFinite)) return;
  const l = cdvLinks[feature] ?? (cdvLinks[feature] = { sumXY: 0, sumX: 0, sumY: 0, sumX2: 0, sumY2: 0, n: 0 });
  l.sumXY += signal * realized; l.sumX += signal; l.sumY += realized;
  l.sumX2 += signal * signal; l.sumY2 += realized * realized; l.n += 1;
}
function corr(l: typeof cdvLinks[string]): number {
  const n = l.n; if (n < 10) return 0;
  const num = n * l.sumXY - l.sumX * l.sumY;
  const den = Math.sqrt(Math.max(0, (n * l.sumX2 - l.sumX ** 2) * (n * l.sumY2 - l.sumY ** 2)));
  return den > 0 ? num / den : 0;
}
export function causalDiscoveryMultiplier(activeFeatures: string[]): number {
  if (!activeFeatures?.length) return 1;
  let causalCount = 0, totalCount = 0;
  for (const f of activeFeatures) {
    const l = cdvLinks[f]; if (!l || l.n < 10) continue;
    totalCount += 1;
    if (Math.abs(corr(l)) > 0.2) causalCount += 1;
  }
  if (totalCount < 3) return 1;
  const ratio = causalCount / totalCount;
  if (ratio > 0.6) return 1.04;
  if (ratio < 0.25) return 0.95;
  return 1;
}

// ───────── 8) RLP: RL Position Sizing ─────────
const rlpQ: Record<string, { value: number; n: number }> = {};
function rlpKey(regime: string, confBin: number): string { return `${regime}|${confBin}`; }
export function recordRLPositionOutcome(regime: string, conf: number, realized: number): void {
  if (!Number.isFinite(conf) || !Number.isFinite(realized)) return;
  const k = rlpKey(regime ?? "calm", Math.floor(conf / 10));
  const q = rlpQ[k] ?? (rlpQ[k] = { value: 0, n: 0 });
  q.value = (q.value * q.n + realized) / (q.n + 1); q.n += 1;
}
export function rlPositionSizingMultiplier(regime: string | undefined, conf: number): number {
  const k = rlpKey(regime ?? "calm", Math.floor(conf / 10));
  const q = rlpQ[k]; if (!q || q.n < 8) return 1;
  if (q.value > 1) return 1.04;
  if (q.value < -1) return 0.93;
  return 1;
}

// ───────── 9) SAB: Shadow A/B for newly added layers ─────────
const sabStats = { primary: { hits: 0, n: 0 }, shadow: { hits: 0, n: 0 } };
export function recordShadowABOutcome(primaryWon: boolean, shadowWon: boolean): void {
  sabStats.primary.n += 1; if (primaryWon) sabStats.primary.hits += 1;
  sabStats.shadow.n += 1; if (shadowWon) sabStats.shadow.hits += 1;
}
export function shadowABNewLayerMultiplier(): number {
  const p = sabStats.primary, s = sabStats.shadow;
  if (p.n < 20 || s.n < 20) return 1;
  const pAcc = p.hits / p.n, sAcc = s.hits / s.n;
  // Shadow significantly better → trust the new layers more
  if (sAcc - pAcc > 0.05) return 1.03;
  if (pAcc - sAcc > 0.05) return 0.97;
  return 1;
}

// ───────── 10) DEC: Confidence Decomposition (logging) ─────────
const decLog: { ts: number; symbol: string; contributions: Record<string, number> }[] = [];
export function recordConfidenceDecomposition(symbol: string, contributions: Record<string, number>): void {
  decLog.push({ ts: Date.now(), symbol, contributions });
  if (decLog.length > 500) decLog.shift();
}
export function getConfidenceDecompositionLog(): typeof decLog { return decLog; }
export function confidenceDecompositionMultiplier(): number { return 1; }

// ───────── 11) FED: Federated Sector Outcome ─────────
const fedSectors: Record<string, { sum: number; n: number }> = {};
export function recordFederatedSectorOutcome(sector: string, realized: number): void {
  if (!sector || !Number.isFinite(realized)) return;
  const s = fedSectors[sector] ?? (fedSectors[sector] = { sum: 0, n: 0 });
  s.sum += realized; s.n += 1;
}
export function federatedSectorOutcomeMultiplier(sector: string | undefined): number {
  if (!sector) return 1;
  const s = fedSectors[sector]; if (!s || s.n < 5) return 1;
  const avg = s.sum / s.n;
  if (avg > 1.5) return 1.04;
  if (avg < -1.5) return 0.94;
  return 1;
}

// ───────── Snapshot / Restore ─────────
export function snapshotTierMasterIQState(): unknown {
  return {
    mlbStats: { ...mlbStats },
    pcvFolds: pcvFolds.map((f) => ({ ...f })),
    fidRolling,
    iceBuckets: iceBuckets.map((b) => ({ ...b })),
    hrpClusters,
    cdvLinks,
    rlpQ,
    sabStats: { primary: { ...sabStats.primary }, shadow: { ...sabStats.shadow } },
    fedSectors,
  };
}
export function restoreTierMasterIQState(s: unknown): void {
  try {
    const d = s as Partial<{
      mlbStats: typeof mlbStats;
      pcvFolds: typeof pcvFolds;
      fidRolling: typeof fidRolling;
      iceBuckets: typeof iceBuckets;
      hrpClusters: typeof hrpClusters;
      cdvLinks: typeof cdvLinks;
      rlpQ: typeof rlpQ;
      sabStats: typeof sabStats;
      fedSectors: typeof fedSectors;
    }>;
    if (d.mlbStats) Object.assign(mlbStats, d.mlbStats);
    if (Array.isArray(d.pcvFolds)) d.pcvFolds.forEach((f, i) => { if (pcvFolds[i]) Object.assign(pcvFolds[i], f); });
    if (d.fidRolling) Object.assign(fidRolling, d.fidRolling);
    if (Array.isArray(d.iceBuckets)) d.iceBuckets.forEach((b, i) => { if (iceBuckets[i]) Object.assign(iceBuckets[i], b); });
    if (d.hrpClusters) Object.assign(hrpClusters, d.hrpClusters);
    if (d.cdvLinks) Object.assign(cdvLinks, d.cdvLinks);
    if (d.rlpQ) Object.assign(rlpQ, d.rlpQ);
    if (d.sabStats) {
      Object.assign(sabStats.primary, d.sabStats.primary);
      Object.assign(sabStats.shadow, d.sabStats.shadow);
    }
    if (d.fedSectors) Object.assign(fedSectors, d.fedSectors);
  } catch { /* noop */ }
}