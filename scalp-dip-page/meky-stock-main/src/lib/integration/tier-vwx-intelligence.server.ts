/**
 * Tier V/W/X/Y/Z/AA/BB/CC/DD — advanced meta-learning, causal, robustness,
 * curriculum, imitation, hierarchical Bayes, risk-adjusted RL, multi-objective,
 * and explainability. Pure in-memory + snapshot/restore. No IO.
 */

type Num = number;
const clamp = (x: Num, lo: Num, hi: Num) => Math.max(lo, Math.min(hi, x));

// ───────────────────────── V: Meta-Learning Across Tiers ─────────────────────
// Per-regime per-tier logistic weight learned from outcomes (won/lost).
type RegimeKey = "trending_up" | "trending_down" | "high_vol" | "mean_reverting" | "calm";
const REGIMES: RegimeKey[] = ["trending_up", "trending_down", "high_vol", "mean_reverting", "calm"];
const metaWeights: Record<string, Record<string, { w: number; n: number }>> = {};
for (const r of REGIMES) metaWeights[r] = {};

export function recordTierMetaOutcomeV(
  regime: string,
  tierContribs: Array<{ name: string; signal: number }>,
  won: boolean,
): void {
  const r = (REGIMES as readonly string[]).includes(regime) ? regime : "calm";
  const bucket = metaWeights[r] ?? (metaWeights[r] = {});
  const y = won ? 1 : -1;
  const lr = 0.05;
  for (const c of tierContribs) {
    const cur = bucket[c.name] ?? { w: 0, n: 0 };
    // logistic-ish update: nudge weight toward sign of (signal * outcome)
    cur.w = clamp(cur.w + lr * Math.tanh(c.signal) * y, -2, 2);
    cur.n += 1;
    bucket[c.name] = cur;
  }
  // cap entries per regime
  const keys = Object.keys(bucket);
  if (keys.length > 200) {
    const sorted = keys.sort((a, b) => bucket[a].n - bucket[b].n);
    for (let i = 0; i < keys.length - 200; i++) delete bucket[sorted[i]];
  }
}

export function tierMetaMultiplierV(
  regime: string,
  tierContribs: Array<{ name: string; signal: number }>,
): number {
  const r = (REGIMES as readonly string[]).includes(regime) ? regime : "calm";
  const bucket = metaWeights[r] ?? {};
  let score = 0, n = 0;
  for (const c of tierContribs.slice(0, 10)) {
    const w = bucket[c.name]?.w ?? 0;
    if (Math.abs(w) > 0.05 && (bucket[c.name]?.n ?? 0) >= 5) {
      score += w * Math.tanh(c.signal);
      n++;
    }
  }
  if (n === 0) return 1;
  const avg = score / n;
  return clamp(1 + avg * 0.08, 0.88, 1.12);
}

// ───────────────────────── W: Causal Inference (PSM lite) ────────────────────
// Buckets of (feature high/low, outcome). Records propensity-style averages.
type CausalBucket = { sumOutcome: number; n: number };
const causalBuckets: Record<string, { high: CausalBucket; low: CausalBucket }> = {};

export function recordCausalSampleW(
  features: Record<string, number>,
  realisedPct: number,
): void {
  for (const [k, v] of Object.entries(features)) {
    if (!Number.isFinite(v)) continue;
    const b = causalBuckets[k] ?? (causalBuckets[k] = {
      high: { sumOutcome: 0, n: 0 },
      low: { sumOutcome: 0, n: 0 },
    });
    const slot = v > 0 ? b.high : b.low;
    slot.sumOutcome += realisedPct;
    slot.n += 1;
  }
  const keys = Object.keys(causalBuckets);
  if (keys.length > 100) {
    const trim = keys.slice(0, keys.length - 100);
    for (const k of trim) delete causalBuckets[k];
  }
}

export function causalLiftMultiplierW(features: Record<string, number>): number {
  let lift = 0, n = 0;
  for (const [k, v] of Object.entries(features)) {
    const b = causalBuckets[k];
    if (!b || b.high.n < 5 || b.low.n < 5) continue;
    const ate = b.high.sumOutcome / b.high.n - b.low.sumOutcome / b.low.n;
    if (!Number.isFinite(ate)) continue;
    lift += Math.tanh(ate * 0.5) * (v > 0 ? 1 : -1);
    n++;
  }
  if (n === 0) return 1;
  return clamp(1 + (lift / n) * 0.05, 0.92, 1.08);
}

// ───────────────────────── X: Adversarial Robustness ─────────────────────────
// Given a base score and per-feature sensitivities, compute robustness score.
export function adversarialRobustnessMultiplierX(
  baseScore: number,
  signals: Array<{ name: string; value: number; weight?: number }>,
  epsilon = 0.05,
): number {
  if (signals.length === 0) return 1;
  // Perturb each signal by ±epsilon, compute weighted-sum delta.
  let maxDelta = 0;
  let totalW = 0;
  for (const s of signals) totalW += Math.abs(s.weight ?? 1);
  if (totalW === 0) return 1;
  for (const s of signals) {
    const w = (s.weight ?? 1) / totalW;
    const delta = Math.abs(w * epsilon * 100);
    if (delta > maxDelta) maxDelta = delta;
  }
  // Normalize: maxDelta as fraction of baseScore
  const ratio = baseScore > 0 ? maxDelta / baseScore : 1;
  if (ratio < 0.02) return 1.05;  // very robust
  if (ratio < 0.05) return 1.02;
  if (ratio > 0.15) return 0.88;  // very fragile
  if (ratio > 0.10) return 0.94;
  return 1.0;
}

// ───────────────────────── Y: Curriculum Learning ────────────────────────────
// Track per-sample difficulty; expose easy/hard ratio for weighted training.
const difficultyBuf: Array<{ difficulty: number; correct: boolean }> = [];

export function recordCurriculumSampleY(
  predictedConfidence: number,
  realisedPct: number,
  marketVol: number,
): void {
  // difficulty: high vol + small absolute return → harder
  const difficulty = clamp(
    marketVol * 2 - Math.abs(realisedPct) * 0.1,
    0, 1,
  );
  const correct = (predictedConfidence > 60 && realisedPct > 0)
    || (predictedConfidence < 40 && realisedPct < 0);
  difficultyBuf.push({ difficulty, correct });
  if (difficultyBuf.length > 1000) difficultyBuf.splice(0, difficultyBuf.length - 500);
}

export function curriculumMultiplierY(currentVol: number): number {
  if (difficultyBuf.length < 30) return 1;
  // hardness of current regime
  const hardSamples = difficultyBuf.filter((s) => s.difficulty > 0.5);
  if (hardSamples.length < 10) return 1;
  const hardAcc = hardSamples.filter((s) => s.correct).length / hardSamples.length;
  // if current vol is high and we're bad at hard samples → distrust
  if (currentVol > 0.03 && hardAcc < 0.45) return 0.9;
  if (currentVol > 0.03 && hardAcc > 0.6) return 1.05;
  return 1;
}

// ───────────────────────── Z: Active Imitation Learning ──────────────────────
// Memory of high-performer feature patterns.
const winnerPatterns: Array<{ features: Record<string, number>; realised: number }> = [];

export function recordWinnerPatternZ(
  features: Record<string, number>,
  realisedPct: number,
): void {
  if (realisedPct < 5) return;  // only top performers
  winnerPatterns.push({ features: { ...features }, realised: realisedPct });
  if (winnerPatterns.length > 200) winnerPatterns.splice(0, winnerPatterns.length - 150);
}

export function imitationMultiplierZ(features: Record<string, number>): number {
  if (winnerPatterns.length < 5) return 1;
  const keys = Object.keys(features);
  if (keys.length === 0) return 1;
  let bestSim = 0;
  for (const w of winnerPatterns) {
    let dot = 0, na = 0, nb = 0;
    for (const k of keys) {
      const a = features[k] ?? 0;
      const b = w.features[k] ?? 0;
      dot += a * b; na += a * a; nb += b * b;
    }
    const sim = (na && nb) ? dot / Math.sqrt(na * nb) : 0;
    if (sim > bestSim) bestSim = sim;
  }
  if (bestSim > 0.85) return 1.08;
  if (bestSim > 0.7) return 1.04;
  return 1;
}

// ───────────────────────── AA: Hierarchical Bayesian Pooling ─────────────────
// Sector-level and symbol-level outcome means with shrinkage.
const sectorStats: Record<string, { sum: number; n: number }> = {};
const symbolStats: Record<string, { sum: number; n: number; sector: string }> = {};
let globalSum = 0, globalN = 0;

export function recordHierarchicalOutcomeAA(
  symbol: string,
  sector: string,
  realisedPct: number,
): void {
  const sec = sectorStats[sector] ?? (sectorStats[sector] = { sum: 0, n: 0 });
  sec.sum += realisedPct; sec.n += 1;
  const sym = symbolStats[symbol] ?? (symbolStats[symbol] = { sum: 0, n: 0, sector });
  sym.sum += realisedPct; sym.n += 1; sym.sector = sector;
  globalSum += realisedPct; globalN += 1;
}

export function hierarchicalShrinkageMultiplierAA(
  symbol: string,
  sector: string,
): number {
  const sym = symbolStats[symbol];
  const sec = sectorStats[sector];
  if (globalN < 10) return 1;
  const globalMean = globalSum / globalN;
  const secMean = sec && sec.n >= 3 ? sec.sum / sec.n : globalMean;
  const symMean = sym && sym.n >= 2 ? sym.sum / sym.n : secMean;
  // shrunk: weighted blend symbol → sector → global
  const symW = sym ? sym.n / (sym.n + 5) : 0;
  const secW = sec ? sec.n / (sec.n + 10) : 0;
  const shrunk = symW * symMean + (1 - symW) * (secW * secMean + (1 - secW) * globalMean);
  // small nudge
  return clamp(1 + Math.tanh(shrunk * 0.1) * 0.05, 0.93, 1.07);
}

// ───────────────────────── BB: Risk-Adjusted RL Rewards ──────────────────────
const returnHistoryBB: number[] = [];

export function recordReturnBB(realisedPct: number): void {
  returnHistoryBB.push(realisedPct);
  if (returnHistoryBB.length > 500) returnHistoryBB.splice(0, returnHistoryBB.length - 300);
}

export function sortinoMultiplierBB(): number {
  if (returnHistoryBB.length < 20) return 1;
  const mean = returnHistoryBB.reduce((a, b) => a + b, 0) / returnHistoryBB.length;
  const downside = returnHistoryBB.filter((r) => r < 0);
  if (downside.length < 3) return 1.05;
  const dvar = downside.reduce((a, b) => a + b * b, 0) / downside.length;
  const dstd = Math.sqrt(dvar);
  if (dstd < 1e-6) return 1;
  const sortino = mean / dstd;
  // sortino > 0.5 great; < -0.3 bad
  if (sortino > 0.5) return 1.06;
  if (sortino > 0.2) return 1.02;
  if (sortino < -0.3) return 0.9;
  if (sortino < 0) return 0.96;
  return 1;
}

// ───────────────────────── CC: Multi-Objective Pareto ────────────────────────
// Track (return, risk, frequency) per candidate; expose blended score.
type ParetoPoint = { ret: number; risk: number; freq: number };
const paretoBuf: ParetoPoint[] = [];

export function recordParetoPointCC(point: ParetoPoint): void {
  paretoBuf.push(point);
  if (paretoBuf.length > 500) paretoBuf.splice(0, paretoBuf.length - 300);
}

export function paretoMultiplierCC(
  currentRisk: number,  // 0..1 (e.g. ATR-normalized)
  currentFreq: number,  // 0..1 (recent pick rate)
): number {
  if (paretoBuf.length < 20) return 1;
  // Reward picks that are in the Pareto-efficient zone:
  // low risk + moderate frequency favored.
  const riskScore = 1 - clamp(currentRisk, 0, 1);
  const freqScore = 1 - Math.abs(currentFreq - 0.3) * 2;  // sweet spot ~30%
  const blended = (riskScore + freqScore) / 2;
  return clamp(0.94 + blended * 0.12, 0.94, 1.06);
}

// ───────────────────────── DD: Explainability Score ──────────────────────────
export function explainabilityMultiplierDD(
  contributions: Array<{ name: string; contribution: number }>,
): number {
  if (contributions.length === 0) return 1;
  // Compute Gini-like concentration on absolute contributions.
  const abs = contributions.map((c) => Math.abs(c.contribution));
  const total = abs.reduce((a, b) => a + b, 0);
  if (total < 1e-9) return 1;
  const shares = abs.map((a) => a / total).sort((a, b) => b - a);
  // Top-1 share: if dominated by one feature, mark as fragile.
  const top1 = shares[0];
  const top3 = shares.slice(0, 3).reduce((a, b) => a + b, 0);
  if (top1 > 0.7) return 0.9;        // single feature dominance
  if (top1 > 0.5) return 0.95;
  if (top3 < 0.6 && shares.length >= 5) return 1.05;  // well distributed
  return 1;
}

// ───────────────────────── Snapshot / Restore ────────────────────────────────
export function snapshotTierVWXState(): unknown {
  return {
    metaWeights,
    causalBuckets,
    difficultyBuf: difficultyBuf.slice(-300),
    winnerPatterns: winnerPatterns.slice(-100),
    sectorStats,
    symbolStats,
    globalSum, globalN,
    returnHistoryBB: returnHistoryBB.slice(-200),
    paretoBuf: paretoBuf.slice(-200),
  };
}

export function restoreTierVWXState(s: unknown): void {
  try {
    const d = s as Partial<{
      metaWeights: typeof metaWeights;
      causalBuckets: typeof causalBuckets;
      difficultyBuf: typeof difficultyBuf;
      winnerPatterns: typeof winnerPatterns;
      sectorStats: typeof sectorStats;
      symbolStats: typeof symbolStats;
      globalSum: number; globalN: number;
      returnHistoryBB: typeof returnHistoryBB;
      paretoBuf: typeof paretoBuf;
    }>;
    if (d.metaWeights) for (const r of REGIMES) Object.assign(metaWeights[r], d.metaWeights[r] ?? {});
    if (d.causalBuckets) Object.assign(causalBuckets, d.causalBuckets);
    if (Array.isArray(d.difficultyBuf)) { difficultyBuf.length = 0; difficultyBuf.push(...d.difficultyBuf); }
    if (Array.isArray(d.winnerPatterns)) { winnerPatterns.length = 0; winnerPatterns.push(...d.winnerPatterns); }
    if (d.sectorStats) Object.assign(sectorStats, d.sectorStats);
    if (d.symbolStats) Object.assign(symbolStats, d.symbolStats);
    if (typeof d.globalSum === "number") globalSum = d.globalSum;
    if (typeof d.globalN === "number") globalN = d.globalN;
    if (Array.isArray(d.returnHistoryBB)) { returnHistoryBB.length = 0; returnHistoryBB.push(...d.returnHistoryBB); }
    if (Array.isArray(d.paretoBuf)) { paretoBuf.length = 0; paretoBuf.push(...d.paretoBuf); }
  } catch {}
}