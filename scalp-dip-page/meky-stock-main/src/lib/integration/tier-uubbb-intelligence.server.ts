/**
 * Tier UU/VV/WW/XX/YY/ZZ/AAA/BBB — LLM meta-analyst, walk-forward IC,
 * cross-asset correlation, options-flow proxy, narrative clustering,
 * execution-quality, meta-learner stacking (Ridge-lite), human feedback (RLHF).
 * Pure in-memory + snapshot/restore. No IO.
 */

type Num = number;
const clamp = (x: Num, lo: Num, hi: Num) => Math.max(lo, Math.min(hi, x));

// ───────────────── UU: LLM Meta-Analyst (cached vote) ────────────────────────
// External code calls setLlmMetaVoteUU() periodically (cron / batch).
// Reader returns cached multiplier; defaults to 1 if no fresh vote.
type LlmVote = { regime: string; bias: number; updatedAt: number };
let llmVote: LlmVote | null = null;
const LLM_TTL_MS = 60 * 60 * 1000; // 1h

export function setLlmMetaVoteUU(regime: string, bias: number): void {
  llmVote = { regime, bias: clamp(bias, -1, 1), updatedAt: Date.now() };
}

export function llmMetaAnalystMultiplierUU(currentRegime: string, dir: number): number {
  if (!llmVote) return 1;
  if (Date.now() - llmVote.updatedAt > LLM_TTL_MS) return 1;
  if (llmVote.regime !== currentRegime) return 1;
  // Alignment between LLM bias and current trade direction.
  const align = Math.sign(dir) === Math.sign(llmVote.bias) && Math.sign(dir) !== 0;
  if (align && Math.abs(llmVote.bias) > 0.5) return 1.06;
  if (align) return 1.02;
  if (!align && Math.abs(llmVote.bias) > 0.5) return 0.9;
  return 1;
}

// ───────────────── VV: Walk-Forward Information Coefficient ──────────────────
// Per-tier rolling IC; expose multiplier based on aggregate IC trend.
type ICStat = { recent: number[]; older: number[] };
const tierIC: Record<string, ICStat> = {};

export function recordTierICVV(tierName: string, tierSignal: number, realisedPct: number): void {
  if (!Number.isFinite(tierSignal)) return;
  const product = Math.tanh(tierSignal) * Math.tanh(realisedPct / 5);
  const s = tierIC[tierName] ?? (tierIC[tierName] = { recent: [], older: [] });
  s.recent.push(product);
  if (s.recent.length > 30) {
    s.older.push(...s.recent.splice(0, s.recent.length - 30));
    if (s.older.length > 90) s.older.splice(0, s.older.length - 90);
  }
}

export function walkForwardICMultiplierVV(): number {
  const keys = Object.keys(tierIC);
  if (keys.length < 5) return 1;
  let healthy = 0, dead = 0;
  for (const k of keys) {
    const s = tierIC[k];
    if (s.recent.length < 10) continue;
    const r = s.recent.reduce((a, b) => a + b, 0) / s.recent.length;
    if (r > 0.05) healthy++;
    else if (r < -0.02) dead++;
  }
  if (healthy + dead < 5) return 1;
  const ratio = healthy / (healthy + dead);
  if (ratio > 0.7) return 1.05;
  if (ratio > 0.55) return 1.02;
  if (ratio < 0.3) return 0.9;
  if (ratio < 0.45) return 0.96;
  return 1;
}

export function getTierICReportVV(): Array<{ tier: string; ic: number; n: number }> {
  return Object.entries(tierIC)
    .map(([tier, s]) => ({
      tier,
      n: s.recent.length + s.older.length,
      ic: s.recent.length
        ? s.recent.reduce((a, b) => a + b, 0) / s.recent.length
        : 0,
    }))
    .sort((a, b) => b.ic - a.ic);
}

// ───────────────── WW: Cross-Asset Correlation (in-memory) ───────────────────
// Track symbol return series + market return series. Compute Pearson correlation.
const retSeries: Record<string, number[]> = {};
const marketSeries: number[] = [];

export function recordReturnsWW(symbol: string, symRet: number, marketRet: number): void {
  if (!Number.isFinite(symRet) || !Number.isFinite(marketRet)) return;
  const s = retSeries[symbol] ?? (retSeries[symbol] = []);
  s.push(symRet);
  if (s.length > 60) s.splice(0, s.length - 60);
  marketSeries.push(marketRet);
  if (marketSeries.length > 60) marketSeries.splice(0, marketSeries.length - 60);
}

function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 8) return 0;
  const ma = a.slice(-n).reduce((x, y) => x + y, 0) / n;
  const mb = b.slice(-n).reduce((x, y) => x + y, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const x = a[a.length - n + i] - ma;
    const y = b[b.length - n + i] - mb;
    num += x * y; da += x * x; db += y * y;
  }
  const denom = Math.sqrt(da * db);
  return denom > 1e-9 ? num / denom : 0;
}

export function crossAssetCorrelationMultiplierWW(symbol: string): number {
  const s = retSeries[symbol];
  if (!s || s.length < 12 || marketSeries.length < 12) return 1;
  const corr = pearson(s, marketSeries);
  // Decoupled in a positive way (symbol up while market mixed) → boost.
  // High positive correlation in a bull regime → mild boost.
  // Strong negative correlation → likely safe-haven flow during stress → mild boost.
  if (Math.abs(corr) < 0.2) return 1.04; // decoupled → idiosyncratic alpha
  if (corr > 0.8) return 1.02;
  if (corr < -0.6) return 1.03;
  return 1;
}

// ───────────────── XX: Options-Flow Proxy (without options data) ─────────────
// Proxy via realised volatility skew: compare upward vs downward range expansion.
const upMoves: Record<string, number[]> = {};
const downMoves: Record<string, number[]> = {};

export function recordRangeXX(symbol: string, dailyRangePct: number, dir: number): void {
  if (!Number.isFinite(dailyRangePct)) return;
  const arr = dir >= 0 ? (upMoves[symbol] ?? (upMoves[symbol] = []))
                       : (downMoves[symbol] ?? (downMoves[symbol] = []));
  arr.push(Math.abs(dailyRangePct));
  if (arr.length > 30) arr.splice(0, arr.length - 30);
}

export function optionsFlowMultiplierXX(symbol: string): number {
  const u = upMoves[symbol], d = downMoves[symbol];
  if (!u || !d || u.length < 6 || d.length < 6) return 1;
  const mu = u.reduce((a, b) => a + b, 0) / u.length;
  const md = d.reduce((a, b) => a + b, 0) / d.length;
  if (mu < 1e-6 || md < 1e-6) return 1;
  const skew = mu / md;            // >1 → upside expansion dominates (call-skew proxy)
  if (skew > 1.4) return 1.05;
  if (skew > 1.15) return 1.02;
  if (skew < 0.7) return 0.9;
  if (skew < 0.85) return 0.96;
  return 1;
}

// ───────────────── YY: Narrative Clustering (sentiment momentum cluster) ─────
// Group recent sentiment by sector/regime bucket; compute cluster momentum.
const clusterSent: Record<string, number[]> = {};

export function recordClusterSentimentYY(clusterKey: string, sent: number): void {
  if (!clusterKey || !Number.isFinite(sent)) return;
  const s = clusterSent[clusterKey] ?? (clusterSent[clusterKey] = []);
  s.push(sent);
  if (s.length > 40) s.splice(0, s.length - 40);
}

export function narrativeClusteringMultiplierYY(clusterKey: string): number {
  const s = clusterSent[clusterKey];
  if (!s || s.length < 8) return 1;
  const recent = s.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const older = s.slice(-15, -5);
  if (older.length < 5) return 1;
  const om = older.reduce((a, b) => a + b, 0) / older.length;
  const momentum = recent - om;
  if (momentum > 0.25 && recent > 0.2) return 1.06;
  if (momentum > 0.1) return 1.02;
  if (momentum < -0.25 && recent < -0.2) return 0.9;
  if (momentum < -0.1) return 0.96;
  return 1;
}

// ───────────────── ZZ: Execution Quality (slippage tracking) ─────────────────
// Track (realised - expected) drift; if consistently negative → reduce trust.
const execGap: number[] = [];

export function recordExecutionGapZZ(realised: number, expected: number): void {
  if (!Number.isFinite(realised) || !Number.isFinite(expected)) return;
  execGap.push(realised - expected);
  if (execGap.length > 80) execGap.splice(0, execGap.length - 80);
}

export function executionQualityMultiplierZZ(): number {
  if (execGap.length < 15) return 1;
  const mean = execGap.reduce((a, b) => a + b, 0) / execGap.length;
  // Persistent shortfall vs expected → cut position sizing.
  if (mean < -1.5) return 0.85;
  if (mean < -0.5) return 0.93;
  if (mean > 0.5) return 1.04;
  return 1;
}

// ───────────────── AAA: Meta-Learner Stacking (Ridge-lite SGD) ───────────────
// Per-tier learned weight; multiplier blends current signals via learned weights.
const tierWeights: Record<string, number> = {};
let intercept = 0;
const LR = 0.02;
const L2 = 0.001;

export function trainStackingAAA(
  signals: Array<{ name: string; value: number }>, realisedPct: number,
): void {
  // Linear model: predicted = intercept + Σ w_i * signal_i ; target = tanh(realised/5).
  const target = Math.tanh(realisedPct / 5);
  let pred = intercept;
  for (const s of signals) {
    const w = tierWeights[s.name] ?? 0;
    pred += w * s.value;
  }
  const err = pred - target;
  intercept -= LR * err;
  for (const s of signals) {
    const w = tierWeights[s.name] ?? 0;
    const grad = err * s.value + L2 * w;
    tierWeights[s.name] = clamp(w - LR * grad, -1.5, 1.5);
  }
}

export function metaLearnerStackingMultiplierAAA(
  signals: Array<{ name: string; value: number }>,
): number {
  if (Object.keys(tierWeights).length < 8) return 1;
  let pred = intercept;
  for (const s of signals) {
    const w = tierWeights[s.name];
    if (typeof w === "number") pred += w * s.value;
  }
  // pred ∈ (-1,1)-ish; convert into a multiplier in [0.88, 1.08].
  const m = 1 + clamp(pred, -0.5, 0.5) * 0.16;
  return clamp(m, 0.88, 1.08);
}

export function getStackingWeightsAAA(): Record<string, number> {
  return { ...tierWeights };
}

// ───────────────── BBB: Human Feedback Loop (RLHF-lite) ──────────────────────
// External UI calls recordHumanFeedbackBBB('symbol', +1 / -1).
type HumanStat = { up: number; down: number };
const humanStats: Record<string, HumanStat> = {};

export function recordHumanFeedbackBBB(symbol: string, vote: 1 | -1): void {
  const s = humanStats[symbol] ?? (humanStats[symbol] = { up: 0, down: 0 });
  if (vote > 0) s.up++; else s.down++;
}

export function humanFeedbackMultiplierBBB(symbol: string): number {
  const s = humanStats[symbol];
  if (!s || s.up + s.down < 3) return 1;
  const ratio = s.up / (s.up + s.down);
  if (ratio > 0.75) return 1.05;
  if (ratio > 0.6) return 1.02;
  if (ratio < 0.25) return 0.9;
  if (ratio < 0.4) return 0.96;
  return 1;
}

export function getHumanFeedbackStatsBBB(): Record<string, HumanStat> {
  return { ...humanStats };
}

// ───────────────────────── Snapshot / Restore ────────────────────────────────
export function snapshotTierUUBBBState(): unknown {
  return {
    llmVote,
    tierIC,
    retSeries, marketSeries: marketSeries.slice(-60),
    upMoves, downMoves,
    clusterSent,
    execGap: execGap.slice(-80),
    tierWeights, intercept,
    humanStats,
  };
}

export function restoreTierUUBBBState(s: unknown): void {
  try {
    const d = s as Partial<{
      llmVote: LlmVote | null;
      tierIC: typeof tierIC;
      retSeries: typeof retSeries; marketSeries: number[];
      upMoves: typeof upMoves; downMoves: typeof downMoves;
      clusterSent: typeof clusterSent;
      execGap: number[];
      tierWeights: typeof tierWeights; intercept: number;
      humanStats: typeof humanStats;
    }>;
    if (d.llmVote !== undefined) llmVote = d.llmVote;
    if (d.tierIC) Object.assign(tierIC, d.tierIC);
    if (d.retSeries) Object.assign(retSeries, d.retSeries);
    if (Array.isArray(d.marketSeries)) {
      marketSeries.length = 0; marketSeries.push(...d.marketSeries);
    }
    if (d.upMoves) Object.assign(upMoves, d.upMoves);
    if (d.downMoves) Object.assign(downMoves, d.downMoves);
    if (d.clusterSent) Object.assign(clusterSent, d.clusterSent);
    if (Array.isArray(d.execGap)) { execGap.length = 0; execGap.push(...d.execGap); }
    if (d.tierWeights) Object.assign(tierWeights, d.tierWeights);
    if (typeof d.intercept === "number") intercept = d.intercept;
    if (d.humanStats) Object.assign(humanStats, d.humanStats);
  } catch {}
}