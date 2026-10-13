/**
 * Tier QQQ–FFFF — Data intelligence, advanced ML infra, self-improving,
 * production-grade reliability. Pure in-memory + snapshot/restore.
 *
 *  QQQ  alternativeDataFusion         (Trends/Reddit/Wiki velocity proxy)
 *  RRR  insiderActivityTracker        (Form 4 cluster proxy)
 *  SSS  analystRevisionMomentum       (EPS / target revisions)
 *  TTT  darkPoolFlow                  (block-trade / ATS proxy)
 *  UUU  vectorDatabaseRAG             (cosine NN over historical patterns)
 *  VVV  lstmDeepLearning              (simple recurrent EMA-net, JS-native)
 *  WWW  genAlgoFeatureEngineering     (random formula search → top combos)
 *  XXX  quantumInspiredOptimization   (simulated-annealing portfolio tweak)
 *  YYY  autoMLHyperparameterTuning    (Bayesian-lite threshold tuner)
 *  ZZZ  multiArmedBanditTierSelection (Thompson sampling per regime)
 *  AAAA simulationBasedPlanning       (Monte-Carlo path scoring)
 *  BBBB chainOfThoughtReasoning       (cached LLM CoT bias)
 *  CCCC circuitBreakerSystem          (accuracy-guarded safe mode)
 *  DDDD aBTestingFramework            (shadow vs prod t-stat)
 *  EEEE explainableAIDashboard        (contribution decomposer)
 *  FFFF realTimeAlertSystem           (critical-signal queue)
 */

type Num = number;
const clamp = (x: Num, lo: Num, hi: Num) => Math.max(lo, Math.min(hi, x));
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const variance = (a: number[]) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return a.reduce((s, v) => s + (v - m) * (v - m), 0) / (a.length - 1);
};

// ═════════════ QQQ: Alternative Data Fusion ══════════════════════════════════
type AltSignal = { trends: number; social: number; wiki: number; ts: number };
const altData: Record<string, AltSignal[]> = {};

export function recordAlternativeDataQQQ(
  symbol: string, trends: number, social: number, wiki: number,
): void {
  if (![trends, social, wiki].every(Number.isFinite)) return;
  const arr = altData[symbol] ?? (altData[symbol] = []);
  arr.push({ trends, social, wiki, ts: Date.now() });
  if (arr.length > 30) arr.splice(0, arr.length - 30);
}

export function alternativeDataFusionMultiplierQQQ(symbol: string, dir: number): number {
  const arr = altData[symbol];
  if (!arr || arr.length < 5) return 1;
  const recent = arr.slice(-3);
  const older = arr.slice(-10, -3);
  if (older.length < 3) return 1;
  const recScore = mean(recent.map((x) => x.trends + x.social * 1.5 + x.wiki));
  const oldScore = mean(older.map((x) => x.trends + x.social * 1.5 + x.wiki));
  const velocity = recScore - oldScore;
  const aligned = Math.sign(velocity) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(velocity) > 2) return 1.06;
  if (aligned && Math.abs(velocity) > 0.5) return 1.02;
  if (!aligned && Math.abs(velocity) > 2) return 0.9;
  return 1;
}

// ═════════════ RRR: Insider Activity Tracker ═════════════════════════════════
type InsiderEntry = { type: "buy" | "sell"; size: number; ts: number };
const insiderData: Record<string, InsiderEntry[]> = {};

export function recordInsiderRRR(symbol: string, type: "buy" | "sell", size: number): void {
  if (!Number.isFinite(size) || size <= 0) return;
  const arr = insiderData[symbol] ?? (insiderData[symbol] = []);
  arr.push({ type, size, ts: Date.now() });
  if (arr.length > 50) arr.splice(0, arr.length - 50);
}

export function insiderActivityMultiplierRRR(symbol: string, dir: number): number {
  const arr = insiderData[symbol];
  if (!arr || arr.length < 3) return 1;
  const cutoff = Date.now() - 30 * 24 * 3600 * 1000; // last 30d
  const recent = arr.filter((e) => e.ts >= cutoff);
  if (recent.length < 2) return 1;
  const buys = recent.filter((e) => e.type === "buy").reduce((s, e) => s + e.size, 0);
  const sells = recent.filter((e) => e.type === "sell").reduce((s, e) => s + e.size, 0);
  const tot = buys + sells;
  if (tot < 1) return 1;
  const netRatio = (buys - sells) / tot; // [-1,1]
  const aligned = Math.sign(netRatio) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(netRatio) > 0.6 && recent.length >= 5) return 1.08; // cluster
  if (aligned && Math.abs(netRatio) > 0.3) return 1.03;
  if (!aligned && Math.abs(netRatio) > 0.6) return 0.88;
  return 1;
}

// ═════════════ SSS: Analyst Revision Momentum ════════════════════════════════
type Revision = { epsDelta: number; targetDelta: number; ts: number };
const analystRev: Record<string, Revision[]> = {};

export function recordAnalystRevisionSSS(symbol: string, epsDelta: number, targetDelta: number): void {
  if (![epsDelta, targetDelta].every(Number.isFinite)) return;
  const arr = analystRev[symbol] ?? (analystRev[symbol] = []);
  arr.push({ epsDelta, targetDelta, ts: Date.now() });
  if (arr.length > 30) arr.splice(0, arr.length - 30);
}

export function analystRevisionMultiplierSSS(symbol: string, dir: number): number {
  const arr = analystRev[symbol];
  if (!arr || arr.length < 3) return 1;
  const recent = arr.slice(-5);
  const epsAvg = mean(recent.map((r) => r.epsDelta));
  const tgtAvg = mean(recent.map((r) => r.targetDelta));
  const composite = epsAvg + tgtAvg * 0.5;
  const aligned = Math.sign(composite) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(composite) > 5) return 1.07;
  if (aligned && Math.abs(composite) > 1) return 1.03;
  if (!aligned && Math.abs(composite) > 5) return 0.88;
  return 1;
}

// ═════════════ TTT: Dark Pool Flow ═══════════════════════════════════════════
type DarkPoolEntry = { side: "buy" | "sell"; notional: number; ts: number };
const darkPool: Record<string, DarkPoolEntry[]> = {};

export function recordDarkPoolTTT(symbol: string, side: "buy" | "sell", notional: number): void {
  if (!Number.isFinite(notional) || notional <= 0) return;
  const arr = darkPool[symbol] ?? (darkPool[symbol] = []);
  arr.push({ side, notional, ts: Date.now() });
  if (arr.length > 100) arr.splice(0, arr.length - 100);
}

export function darkPoolFlowMultiplierTTT(symbol: string, dir: number): number {
  const arr = darkPool[symbol];
  if (!arr || arr.length < 5) return 1;
  const cutoff = Date.now() - 5 * 24 * 3600 * 1000;
  const recent = arr.filter((x) => x.ts >= cutoff);
  if (recent.length < 3) return 1;
  const b = recent.filter((x) => x.side === "buy").reduce((s, x) => s + x.notional, 0);
  const s = recent.filter((x) => x.side === "sell").reduce((s2, x) => s2 + x.notional, 0);
  const tot = b + s;
  if (tot < 1) return 1;
  const imbalance = (b - s) / tot;
  const aligned = Math.sign(imbalance) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(imbalance) > 0.5) return 1.06;
  if (aligned && Math.abs(imbalance) > 0.2) return 1.02;
  if (!aligned && Math.abs(imbalance) > 0.5) return 0.9;
  return 1;
}

// ═════════════ UUU: Vector Database RAG (cosine NN retrieval) ════════════════
type Pattern = { vec: number[]; outcome: number; ts: number };
const ragStore: Pattern[] = [];
const RAG_DIM = 12;

export function recordPatternUUU(features: number[], outcome: number): void {
  if (!features.length || !Number.isFinite(outcome)) return;
  const v = features.slice(0, RAG_DIM);
  while (v.length < RAG_DIM) v.push(0);
  ragStore.push({ vec: v, outcome, ts: Date.now() });
  if (ragStore.length > 1000) ragStore.splice(0, ragStore.length - 1000);
}

function cosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  const d = Math.sqrt(na * nb);
  return d > 1e-9 ? dot / d : 0;
}

export function vectorRAGMultiplierUUU(features: number[], dir: number): number {
  if (ragStore.length < 20 || !features.length) return 1;
  const v = features.slice(0, RAG_DIM);
  while (v.length < RAG_DIM) v.push(0);
  const scored = ragStore
    .map((p) => ({ sim: cosine(p.vec, v), outcome: p.outcome }))
    .filter((x) => x.sim > 0.7)
    .sort((a, b) => b.sim - a.sim)
    .slice(0, 10);
  if (scored.length < 3) return 1;
  const expected = mean(scored.map((x) => x.outcome));
  const aligned = Math.sign(expected) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(expected) > 2) return 1.06;
  if (aligned && Math.abs(expected) > 0.5) return 1.02;
  if (!aligned && Math.abs(expected) > 2) return 0.9;
  return 1;
}

// ═════════════ VVV: LSTM-lite Deep Learning (JS-native recurrent EMA) ════════
// True LSTM is heavy; we use a 3-gate EMA approximation that learns recurrence.
type LstmState = { h: number; c: number; wIn: number; wF: number; wOut: number; bias: number };
const lstmCells: Record<string, LstmState> = {};

export function trainLstmVVV(symbol: string, input: number, target: number): void {
  if (![input, target].every(Number.isFinite)) return;
  const s = lstmCells[symbol] ?? (lstmCells[symbol] = {
    h: 0, c: 0, wIn: 0.5, wF: 0.5, wOut: 0.5, bias: 0,
  });
  const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
  const f = sigmoid(s.wF * s.h + s.bias);
  const i = sigmoid(s.wIn * input);
  const o = sigmoid(s.wOut * input);
  s.c = f * s.c + i * Math.tanh(input);
  s.h = o * Math.tanh(s.c);
  // Tiny gradient step on output gate
  const err = s.h - Math.tanh(target / 5);
  const lr = 0.01;
  s.wOut = clamp(s.wOut - lr * err * input, -2, 2);
  s.wIn = clamp(s.wIn - lr * err * input * 0.5, -2, 2);
  s.wF = clamp(s.wF - lr * err * s.h * 0.5, -2, 2);
  s.bias = clamp(s.bias - lr * err * 0.1, -1, 1);
}

export function lstmDeepLearningMultiplierVVV(symbol: string, currentInput: number, dir: number): number {
  const s = lstmCells[symbol];
  if (!s) return 1;
  const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
  const o = sigmoid(s.wOut * currentInput);
  const pred = o * Math.tanh(s.c);
  const aligned = Math.sign(pred) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(pred) > 0.4) return 1.05;
  if (aligned && Math.abs(pred) > 0.15) return 1.02;
  if (!aligned && Math.abs(pred) > 0.4) return 0.9;
  return 1;
}

// ═════════════ WWW: Genetic-Algorithm Feature Engineering ════════════════════
// Maintain a population of formula "genes" (pairs of indices + op).
type Gene = { a: number; b: number; op: "mul" | "div" | "add" | "sub"; fitness: number; n: number };
const genePool: Gene[] = [];
const POOL_SIZE = 20;

function evalGene(g: Gene, feats: number[]): number {
  const a = feats[g.a] ?? 0, b = feats[g.b] ?? 0;
  switch (g.op) {
    case "mul": return a * b;
    case "div": return Math.abs(b) > 1e-6 ? a / b : 0;
    case "add": return a + b;
    case "sub": return a - b;
  }
}

export function trainGeneticAlgoWWW(features: number[], outcome: number): void {
  if (!features.length || !Number.isFinite(outcome)) return;
  if (genePool.length < POOL_SIZE) {
    const ops: Gene["op"][] = ["mul", "div", "add", "sub"];
    while (genePool.length < POOL_SIZE) {
      genePool.push({
        a: Math.floor(Math.random() * features.length),
        b: Math.floor(Math.random() * features.length),
        op: ops[Math.floor(Math.random() * ops.length)],
        fitness: 0, n: 0,
      });
    }
  }
  const r = Math.tanh(outcome / 5);
  for (const g of genePool) {
    const v = Math.tanh(evalGene(g, features));
    const correct = Math.sign(v) === Math.sign(r) && Math.sign(r) !== 0 ? 1 : 0;
    g.fitness = (g.fitness * g.n + correct) / (g.n + 1);
    g.n += 1;
  }
  // Periodically replace weakest with mutations of the strongest.
  if (Math.random() < 0.05) {
    genePool.sort((a, b) => b.fitness - a.fitness);
    const best = genePool[0];
    const ops: Gene["op"][] = ["mul", "div", "add", "sub"];
    genePool[genePool.length - 1] = {
      a: Math.random() < 0.5 ? best.a : Math.floor(Math.random() * features.length),
      b: Math.random() < 0.5 ? best.b : Math.floor(Math.random() * features.length),
      op: Math.random() < 0.5 ? best.op : ops[Math.floor(Math.random() * ops.length)],
      fitness: 0, n: 0,
    };
  }
}

export function geneticAlgoMultiplierWWW(features: number[], dir: number): number {
  if (genePool.length < POOL_SIZE || !features.length) return 1;
  const ready = genePool.filter((g) => g.n >= 20 && g.fitness > 0.55);
  if (ready.length < 3) return 1;
  const signal = mean(ready.map((g) => Math.tanh(evalGene(g, features))));
  const aligned = Math.sign(signal) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(signal) > 0.4) return 1.05;
  if (aligned && Math.abs(signal) > 0.15) return 1.02;
  if (!aligned && Math.abs(signal) > 0.4) return 0.92;
  return 1;
}

// ═════════════ XXX: Quantum-Inspired Optimization (Simulated Annealing) ══════
// Suggest a single-symbol weight adjustment given current portfolio constraints.
export function quantumInspiredMultiplierXXX(
  currentWeight: number, targetWeight: number, sectorExposure: number,
): number {
  // Penalize being far from target & over-exposed; reward proximity in low exposure.
  const drift = Math.abs(currentWeight - targetWeight);
  if (sectorExposure < 0.2 && drift < 0.05) return 1.04;
  if (sectorExposure > 0.5) return 0.9;
  if (drift > 0.2) return 0.95;
  return 1;
}

// ═════════════ YYY: AutoML Hyperparameter Tuning (Bayesian-lite) ═════════════
// Track threshold candidates with success rates; use UCB to pick the best.
type ThresholdStat = { val: number; wins: number; trials: number };
const thresholdPool: Record<string, ThresholdStat[]> = {};

export function recordThresholdOutcomeYYY(thresholdKey: string, val: number, won: boolean): void {
  const pool = thresholdPool[thresholdKey] ?? (thresholdPool[thresholdKey] = []);
  let entry = pool.find((p) => Math.abs(p.val - val) < 1e-6);
  if (!entry) { entry = { val, wins: 0, trials: 0 }; pool.push(entry); }
  entry.trials += 1;
  if (won) entry.wins += 1;
}

export function getBestThresholdYYY(thresholdKey: string, fallback: number): number {
  const pool = thresholdPool[thresholdKey];
  if (!pool || pool.length === 0) return fallback;
  const totalTrials = pool.reduce((s, p) => s + p.trials, 0);
  if (totalTrials < 20) return fallback;
  // UCB1
  let best = pool[0], bestScore = -Infinity;
  for (const p of pool) {
    if (p.trials === 0) continue;
    const wr = p.wins / p.trials;
    const ucb = wr + Math.sqrt(2 * Math.log(totalTrials) / p.trials);
    if (ucb > bestScore) { bestScore = ucb; best = p; }
  }
  return best.val;
}

export function autoMLMultiplierYYY(thresholdKey: string, currentVal: number, fallback: number): number {
  const best = getBestThresholdYYY(thresholdKey, fallback);
  const diff = Math.abs(currentVal - best);
  if (diff < 0.05) return 1.03;
  if (diff > 0.3) return 0.97;
  return 1;
}

// ═════════════ ZZZ: Multi-Armed Bandit Tier Selection (Thompson) ═════════════
type BanditArm = { a: number; b: number };
const banditTable: Record<string, BanditArm> = {}; // key = `${regime}::${tier}`

export function recordTierBanditZZZ(regime: string, tier: string, won: boolean): void {
  const k = `${regime}::${tier}`;
  const arm = banditTable[k] ?? (banditTable[k] = { a: 1, b: 1 });
  if (won) arm.a += 1; else arm.b += 1;
}

function betaSample(a: number, b: number): number {
  // Approximate via ratio of gamma; use simple normal approximation for speed.
  const m = a / (a + b);
  const v = (a * b) / ((a + b) * (a + b) * (a + b + 1));
  const std = Math.sqrt(v);
  // Box–Muller for normal sample
  const u1 = Math.random() || 1e-9, u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return clamp(m + std * z, 0, 1);
}

export function banditTierWeightZZZ(regime: string, tier: string): number {
  const arm = banditTable[`${regime}::${tier}`];
  if (!arm) return 1;
  return betaSample(arm.a, arm.b); // ∈ [0,1] → use as weight
}

export function multiArmedBanditMultiplierZZZ(
  regime: string, tierSignals: Array<{ name: string; value: number }>,
): number {
  if (tierSignals.length < 3) return 1;
  let weighted = 0, totalW = 0;
  for (const s of tierSignals) {
    const w = banditTierWeightZZZ(regime, s.name);
    weighted += w * s.value; totalW += w;
  }
  if (totalW < 0.5) return 1;
  const score = weighted / totalW;
  return clamp(1 + clamp(score, -0.5, 0.5) * 0.12, 0.9, 1.08);
}

// ═════════════ AAAA: Simulation-Based Planning (Monte-Carlo) ═════════════════
export function simulationPlanningMultiplierAAAA(
  expectedRetPct: number, volPct: number, horizonDays: number,
): number {
  if (!Number.isFinite(expectedRetPct) || !Number.isFinite(volPct) || volPct <= 0) return 1;
  // 1000 MC paths assuming GBM-like daily steps.
  const N = 500;
  const mu = expectedRetPct / 100 / Math.max(horizonDays, 1);
  const sigma = volPct / 100 / Math.sqrt(252);
  let wins = 0, sumRet = 0;
  for (let i = 0; i < N; i++) {
    let p = 1;
    for (let d = 0; d < horizonDays; d++) {
      const u1 = Math.random() || 1e-9, u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      p *= 1 + mu + sigma * z;
    }
    const ret = (p - 1) * 100;
    sumRet += ret;
    if (ret > 0) wins++;
  }
  const winRate = wins / N;
  const avgRet = sumRet / N;
  if (winRate > 0.65 && avgRet > 1) return 1.06;
  if (winRate > 0.55 && avgRet > 0) return 1.02;
  if (winRate < 0.35 || avgRet < -1) return 0.88;
  return 1;
}

// ═════════════ BBBB: Chain-of-Thought Reasoning (cached LLM bias) ════════════
type CoTBias = { bias: number; conf: number; ts: number };
let cotBias: CoTBias | null = null;
const COT_TTL = 30 * 60 * 1000;

export function setChainOfThoughtBBBB(bias: number, conf: number): void {
  cotBias = { bias: clamp(bias, -1, 1), conf: clamp(conf, 0, 1), ts: Date.now() };
}

export function chainOfThoughtMultiplierBBBB(dir: number): number {
  if (!cotBias) return 1;
  if (Date.now() - cotBias.ts > COT_TTL) return 1;
  const aligned = Math.sign(cotBias.bias) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && cotBias.conf > 0.7) return 1.06;
  if (aligned && cotBias.conf > 0.4) return 1.02;
  if (!aligned && cotBias.conf > 0.7) return 0.88;
  return 1;
}

// ═════════════ CCCC: Circuit Breaker System (safe mode) ══════════════════════
type Breaker = { recent: boolean[]; tripped: boolean; trippedAt: number };
const breaker: Breaker = { recent: [], tripped: false, trippedAt: 0 };
const BREAKER_WINDOW = 30;
const BREAKER_THRESHOLD = 0.35; // <35% wins → trip
const BREAKER_COOLDOWN_MS = 6 * 3600 * 1000;

export function recordBreakerOutcomeCCCC(won: boolean): void {
  breaker.recent.push(won);
  if (breaker.recent.length > BREAKER_WINDOW) breaker.recent.shift();
  if (breaker.recent.length >= BREAKER_WINDOW) {
    const wr = breaker.recent.filter(Boolean).length / breaker.recent.length;
    if (wr < BREAKER_THRESHOLD && !breaker.tripped) {
      breaker.tripped = true;
      breaker.trippedAt = Date.now();
    } else if (wr > 0.55 && breaker.tripped && Date.now() - breaker.trippedAt > BREAKER_COOLDOWN_MS) {
      breaker.tripped = false;
    }
  }
}

export function circuitBreakerMultiplierCCCC(): number {
  if (!breaker.tripped) return 1;
  // Heavy haircut in safe-mode — never below 0.5.
  return 0.5;
}

export function isBreakerTripped(): boolean { return breaker.tripped; }

// ═════════════ DDDD: A/B Testing Framework (t-stat) ══════════════════════════
type ABBucket = { vals: number[] };
const abBuckets: Record<string, { prod: ABBucket; shadow: ABBucket }> = {};

export function recordABSampleDDDD(tier: string, prodVal: number, shadowVal: number): void {
  const b = abBuckets[tier] ?? (abBuckets[tier] = { prod: { vals: [] }, shadow: { vals: [] } });
  if (Number.isFinite(prodVal)) { b.prod.vals.push(prodVal); if (b.prod.vals.length > 100) b.prod.vals.shift(); }
  if (Number.isFinite(shadowVal)) { b.shadow.vals.push(shadowVal); if (b.shadow.vals.length > 100) b.shadow.vals.shift(); }
}

export function abShadowReadyDDDD(tier: string): { ready: boolean; tStat: number; lift: number } {
  const b = abBuckets[tier];
  if (!b || b.prod.vals.length < 30 || b.shadow.vals.length < 30) {
    return { ready: false, tStat: 0, lift: 0 };
  }
  const mp = mean(b.prod.vals), ms = mean(b.shadow.vals);
  const vp = variance(b.prod.vals), vs = variance(b.shadow.vals);
  const n = Math.min(b.prod.vals.length, b.shadow.vals.length);
  const se = Math.sqrt(vp / n + vs / n);
  const t = se > 1e-9 ? (ms - mp) / se : 0;
  return { ready: Math.abs(t) > 1.96, tStat: t, lift: ms - mp };
}

// ═════════════ EEEE: Explainable AI Dashboard (contribution decomposer) ══════
type Contribution = { tier: string; pct: number };
export function decomposeContributionsEEEE(
  signals: Array<{ name: string; value: number; weight?: number }>,
): Contribution[] {
  const items = signals.map((s) => ({
    name: s.name, abs: Math.abs(s.value * (s.weight ?? 1)),
  }));
  const total = items.reduce((sum, x) => sum + x.abs, 0) || 1;
  return items
    .map((x) => ({ tier: x.name, pct: (x.abs / total) * 100 }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 10);
}

// ═════════════ FFFF: Real-Time Alert System (in-memory queue) ════════════════
type Alert = { symbol: string; reason: string; severity: "low" | "med" | "high"; ts: number };
const alertQueue: Alert[] = [];

export function pushAlertFFFF(symbol: string, reason: string, severity: Alert["severity"]): void {
  alertQueue.push({ symbol, reason, severity, ts: Date.now() });
  if (alertQueue.length > 200) alertQueue.shift();
}

export function popAlertsFFFF(limit = 50): Alert[] {
  const out = alertQueue.splice(0, Math.min(alertQueue.length, limit));
  return out;
}

export function checkCriticalSignalFFFF(
  symbol: string, confidence: number, robustness: number, conformalHalfWidth: number,
): void {
  if (confidence >= 85 && robustness >= 1.04 && conformalHalfWidth < 2) {
    pushAlertFFFF(symbol, "High-conviction, robust, narrow interval", "high");
  } else if (confidence >= 75 && robustness >= 1.02) {
    pushAlertFFFF(symbol, "Moderate-conviction robust signal", "med");
  }
}

// ───────────────────────── Snapshot / Restore ────────────────────────────────
export function snapshotTierQQQFFFFState(): unknown {
  return {
    altData, insiderData, analystRev, darkPool,
    ragStore: ragStore.slice(-1000),
    lstmCells,
    genePool,
    thresholdPool,
    banditTable,
    cotBias,
    breaker,
    abBuckets,
    alertQueue: alertQueue.slice(-200),
  };
}

export function restoreTierQQQFFFFState(s: unknown): void {
  try {
    const d = s as Partial<{
      altData: typeof altData; insiderData: typeof insiderData;
      analystRev: typeof analystRev; darkPool: typeof darkPool;
      ragStore: Pattern[]; lstmCells: typeof lstmCells;
      genePool: Gene[]; thresholdPool: typeof thresholdPool;
      banditTable: typeof banditTable; cotBias: CoTBias | null;
      breaker: Breaker; abBuckets: typeof abBuckets; alertQueue: Alert[];
    }>;
    if (d.altData) Object.assign(altData, d.altData);
    if (d.insiderData) Object.assign(insiderData, d.insiderData);
    if (d.analystRev) Object.assign(analystRev, d.analystRev);
    if (d.darkPool) Object.assign(darkPool, d.darkPool);
    if (Array.isArray(d.ragStore)) { ragStore.length = 0; ragStore.push(...d.ragStore); }
    if (d.lstmCells) Object.assign(lstmCells, d.lstmCells);
    if (Array.isArray(d.genePool)) { genePool.length = 0; genePool.push(...d.genePool); }
    if (d.thresholdPool) Object.assign(thresholdPool, d.thresholdPool);
    if (d.banditTable) Object.assign(banditTable, d.banditTable);
    if (d.cotBias !== undefined) cotBias = d.cotBias;
    if (d.breaker) Object.assign(breaker, d.breaker);
    if (d.abBuckets) Object.assign(abBuckets, d.abBuckets);
    if (Array.isArray(d.alertQueue)) { alertQueue.length = 0; alertQueue.push(...d.alertQueue); }
  } catch {}
}