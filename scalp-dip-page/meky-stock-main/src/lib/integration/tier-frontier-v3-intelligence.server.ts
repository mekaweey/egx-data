/**
 * Tier FRONTIER-V3 — 8 next-gen smarter-system layers:
 *   BMA      bayesianModelAveragingMultiplier  (per-tier Brier-weighted vote)
 *   CFM      conformalQualityMultiplier        (interval coverage quality)
 *   CFR      counterfactualReplayMultiplier    (what-if threshold accuracy)
 *   RAT      regimeAwareActivationMultiplier   (per-regime hit-rate gating)
 *   FAST     distillationFastMultiplier        (linear-distilled ensemble)
 *   ACT      activeLearningUncertaintyMultiplier (penalty in uncertain band)
 *   ADV      adversarialStressMultiplier       (stress-sample drawdown)
 *   GKT      graphKnowledgeTransferMultiplier  (sector-neighbor outcomes)
 * Pure JS, in-memory, snapshot/restore included.
 */

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

// ───────── BMA: per-source Brier-weighted average ─────────
const bmaStats: Record<string, { brier: number; n: number }> = {};
export function recordBMASourceOutcome(source: string, conf: number, won: boolean): void {
  if (!source || !Number.isFinite(conf)) return;
  const p = clamp(conf / 100, 0, 1);
  const b = (p - (won ? 1 : 0)) ** 2;
  const s = bmaStats[source] ?? (bmaStats[source] = { brier: 0, n: 0 });
  s.brier = (s.brier * s.n + b) / (s.n + 1);
  s.n += 1;
}
export function bayesianModelAveragingMultiplier(sources: Record<string, number>): number {
  const entries = Object.entries(sources || {}).filter(([, v]) => Number.isFinite(v));
  if (entries.length === 0) return 1;
  let totalW = 0, weighted = 0, knownAny = false;
  for (const [name, val] of entries) {
    const s = bmaStats[name];
    if (!s || s.n < 5) continue;
    knownAny = true;
    const w = clamp(1 - s.brier * 4, 0.05, 1); // brier in [0,0.25] → w in [0,1]
    totalW += w; weighted += w * (val - 50);
  }
  if (!knownAny || totalW === 0) return 1;
  const adj = weighted / totalW; // ≈ same-scale signal
  if (adj > 8) return 1.04;
  if (adj < -8) return 0.95;
  return 1;
}

// ───────── CFM: conformal interval quality ─────────
const conformalCoverage: { covered: number; total: number } = { covered: 0, total: 0 };
export function recordConformalCoverage(lower: number, upper: number, realized: number): void {
  if (![lower, upper, realized].every(Number.isFinite)) return;
  conformalCoverage.total += 1;
  if (realized >= lower && realized <= upper) conformalCoverage.covered += 1;
}
export function conformalQualityMultiplier(): number {
  if (conformalCoverage.total < 20) return 1;
  const cov = conformalCoverage.covered / conformalCoverage.total;
  if (cov >= 0.85 && cov <= 0.95) return 1.04; // well-calibrated 90% interval
  if (cov < 0.7 || cov > 0.99) return 0.94;
  return 1;
}

// ───────── CFR: counterfactual replay (alt-threshold accuracy) ─────────
const cfrStats = { aboveStrict: { hits: 0, n: 0 }, aboveLoose: { hits: 0, n: 0 } };
export function recordCounterfactualReplay(conf: number, won: boolean): void {
  if (!Number.isFinite(conf)) return;
  if (conf >= 75) { cfrStats.aboveStrict.n += 1; if (won) cfrStats.aboveStrict.hits += 1; }
  if (conf >= 60) { cfrStats.aboveLoose.n += 1; if (won) cfrStats.aboveLoose.hits += 1; }
}
export function counterfactualReplayMultiplier(currentConf: number): number {
  const s = cfrStats.aboveStrict, l = cfrStats.aboveLoose;
  if (s.n < 10 || l.n < 10) return 1;
  const strictAcc = s.hits / s.n;
  const looseAcc  = l.hits / l.n;
  // If strict picks beat loose picks meaningfully → boost confident calls, penalize borderline.
  const lift = strictAcc - looseAcc;
  if (lift > 0.05 && currentConf >= 75) return 1.04;
  if (lift > 0.05 && currentConf < 65)  return 0.96;
  if (lift < -0.05) return 0.97;
  return 1;
}

// ───────── RAT: per-regime hit-rate gating ─────────
const regimeHits: Record<string, { hits: number; n: number }> = {};
export function recordRegimeOutcomeRAT(regime: string, won: boolean): void {
  if (!regime) return;
  const r = regimeHits[regime] ?? (regimeHits[regime] = { hits: 0, n: 0 });
  r.n += 1; if (won) r.hits += 1;
}
export function regimeAwareActivationMultiplier(regime: string | undefined): number {
  if (!regime) return 1;
  const r = regimeHits[regime];
  if (!r || r.n < 10) return 1;
  const acc = r.hits / r.n;
  if (acc > 0.6) return 1.05;
  if (acc < 0.4) return 0.92;
  return 1;
}

// ───────── FAST: distilled linear ensemble ─────────
const distillWeights: Record<string, { w: number; n: number }> = {};
export function updateDistillation(source: string, signal: number, realized: number): void {
  if (!source || !Number.isFinite(signal) || !Number.isFinite(realized)) return;
  const lr = 0.02;
  const e = distillWeights[source] ?? (distillWeights[source] = { w: 0, n: 0 });
  const pred = e.w * signal;
  const err = pred - realized;
  e.w -= lr * err * signal;
  e.n += 1;
}
export function distillationFastMultiplier(sources: Record<string, number>): number {
  let sum = 0, count = 0;
  for (const [name, val] of Object.entries(sources || {})) {
    const e = distillWeights[name];
    if (!e || e.n < 5) continue;
    sum += e.w * (val - 50);
    count += 1;
  }
  if (count === 0) return 1;
  if (sum > 3) return 1.03;
  if (sum < -3) return 0.96;
  return 1;
}

// ───────── ACT: active-learning uncertainty band ─────────
const uncertaintyBand = { hits: 0, n: 0 };
export function recordUncertaintyOutcome(conf: number, won: boolean): void {
  if (!Number.isFinite(conf)) return;
  if (conf >= 55 && conf <= 65) { uncertaintyBand.n += 1; if (won) uncertaintyBand.hits += 1; }
}
export function activeLearningUncertaintyMultiplier(currentConf: number): number {
  if (uncertaintyBand.n < 10) return 1;
  const acc = uncertaintyBand.hits / uncertaintyBand.n;
  // If borderline picks historically fail, penalize current borderline.
  if (currentConf >= 55 && currentConf <= 65 && acc < 0.45) return 0.93;
  if (currentConf >= 55 && currentConf <= 65 && acc > 0.6)  return 1.03;
  return 1;
}

// ───────── ADV: adversarial / stress drawdown ─────────
const stressDrawdowns: number[] = []; // realized_pct under stressed conditions
export function recordStressOutcome(realizedPct: number, isStress: boolean): void {
  if (!isStress || !Number.isFinite(realizedPct)) return;
  stressDrawdowns.push(realizedPct);
  if (stressDrawdowns.length > 200) stressDrawdowns.shift();
}
export function adversarialStressMultiplier(): number {
  if (stressDrawdowns.length < 10) return 1;
  const m = mean(stressDrawdowns);
  if (m < -2) return 0.92; // historically loses in stress regimes
  if (m > 2)  return 1.03;
  return 1;
}

// ───────── GKT: sector-neighbor knowledge transfer ─────────
const sectorOutcomes: Record<string, { hits: number; n: number }> = {};
export function recordSectorOutcomeGKT(sector: string, won: boolean): void {
  if (!sector) return;
  const s = sectorOutcomes[sector] ?? (sectorOutcomes[sector] = { hits: 0, n: 0 });
  s.n += 1; if (won) s.hits += 1;
}
export function graphKnowledgeTransferMultiplier(sector: string | undefined): number {
  if (!sector) return 1;
  const s = sectorOutcomes[sector];
  if (!s || s.n < 10) return 1;
  const acc = s.hits / s.n;
  if (acc > 0.6) return 1.04;
  if (acc < 0.4) return 0.94;
  return 1;
}

// ───────── Snapshot / Restore ─────────
export function snapshotTierFrontierV3State(): unknown {
  return {
    bmaStats,
    conformalCoverage: { ...conformalCoverage },
    cfrStats: {
      aboveStrict: { ...cfrStats.aboveStrict },
      aboveLoose:  { ...cfrStats.aboveLoose },
    },
    regimeHits,
    distillWeights,
    uncertaintyBand: { ...uncertaintyBand },
    stressDrawdowns: stressDrawdowns.slice(-200),
    sectorOutcomes,
  };
}
export function restoreTierFrontierV3State(s: unknown): void {
  try {
    const d = s as Partial<{
      bmaStats: typeof bmaStats;
      conformalCoverage: { covered: number; total: number };
      cfrStats: typeof cfrStats;
      regimeHits: typeof regimeHits;
      distillWeights: typeof distillWeights;
      uncertaintyBand: { hits: number; n: number };
      stressDrawdowns: number[];
      sectorOutcomes: typeof sectorOutcomes;
    }>;
    if (d.bmaStats) Object.assign(bmaStats, d.bmaStats);
    if (d.conformalCoverage) {
      conformalCoverage.covered = d.conformalCoverage.covered;
      conformalCoverage.total = d.conformalCoverage.total;
    }
    if (d.cfrStats) {
      Object.assign(cfrStats.aboveStrict, d.cfrStats.aboveStrict);
      Object.assign(cfrStats.aboveLoose,  d.cfrStats.aboveLoose);
    }
    if (d.regimeHits) Object.assign(regimeHits, d.regimeHits);
    if (d.distillWeights) Object.assign(distillWeights, d.distillWeights);
    if (d.uncertaintyBand) {
      uncertaintyBand.hits = d.uncertaintyBand.hits;
      uncertaintyBand.n = d.uncertaintyBand.n;
    }
    if (Array.isArray(d.stressDrawdowns)) {
      stressDrawdowns.length = 0;
      stressDrawdowns.push(...d.stressDrawdowns);
    }
    if (d.sectorOutcomes) Object.assign(sectorOutcomes, d.sectorOutcomes);
  } catch { /* noop */ }
}