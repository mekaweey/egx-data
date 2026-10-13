/**
 * Tier C + D + E — adaptive intelligence layers
 * ----------------------------------------------------------------------------
 * Implements 9 lightweight, fail-open learners that sit ON TOP of the existing
 * pipeline. Every function is pure-JS, persists via snapshot/restore, and
 * defaults to neutral (1.0) when starved of data.
 *
 *  Tier C — deep learning / self-adaptation
 *   1) Contextual Bandits (LinUCB-lite) — picks best (regime, confBucket) arm.
 *   2) Hierarchical Risk Parity (HRP) — cluster-aware weight allocator.
 *   3) Kalman beta — dynamic stock-vs-index beta tracker.
 *
 *  Tier D — new signal sources (derived from existing data only)
 *   4) Order-Flow Imbalance proxy (VPIN-lite, tick-rule).
 *   5) News-embedding similarity (lexical hash proxy until embeddings wired).
 *   6) Sector rotation detector — relative-strength of sectors.
 *
 *  Tier E — meta-learning / self-improvement
 *   7) Bayesian hyper-parameter tuning (1-D Gaussian-Process-lite per knob).
 *   8) Counterfactual analysis — “what if confidence were +Δ?”.
 *   9) ADWIN concept-drift detector — structural change alarm.
 */

/* ─────────────────────────────  state  ───────────────────────────── */
type Bandit = { n: number; mean: number };
const bandits: Record<string, Bandit> = {};

type SymRet = { ret: number; ts: number };
const symRet: Record<string, SymRet[]> = {};
const symKalman: Record<string, { beta: number; p: number }> = {};

const ofiHist: Record<string, number[]> = {};
const newsHash: { hash: number; impact: number }[] = [];
const sectorRet: Record<string, number[]> = {};

type Knob = { samples: { x: number; y: number }[]; best: number };
const knobs: Record<string, Knob> = {};

const cfBuckets: Record<string, { n: number; sum: number }> = {};

type Adwin = { window: number[]; mean: number };
const adwin: Record<string, Adwin> = {};

/* ─────────────────────────────  1) Contextual Bandits  ───────────────────────────── */
function armKey(regime: string, confBucket: number, module: string) {
  return `${regime}|${confBucket}|${module}`;
}
export function banditMultiplier(regime: string, confidence: number, modules: string[]): number {
  const bucket = Math.floor(confidence / 10);
  let bonus = 0, n = 0;
  for (const m of modules) {
    const k = armKey(regime, bucket, m);
    const b = bandits[k];
    if (!b || b.n < 3) continue;
    // UCB upper bound
    const ucb = b.mean + Math.sqrt((2 * Math.log(Math.max(1, totalPulls()))) / b.n);
    bonus += Math.tanh(ucb * 4);
    n++;
  }
  if (n === 0) return 1.0;
  const avg = bonus / n;
  return Math.max(0.85, Math.min(1.20, 1 + avg * 0.15));
}
let _pulls = 0;
function totalPulls() { return Math.max(1, _pulls); }
export function banditUpdate(regime: string, confidence: number, modules: string[], realisedPct: number): void {
  const bucket = Math.floor(confidence / 10);
  const reward = Math.tanh(realisedPct * 8); // squash
  for (const m of modules) {
    const k = armKey(regime, bucket, m);
    const b = bandits[k] ?? (bandits[k] = { n: 0, mean: 0 });
    b.n += 1; _pulls += 1;
    b.mean += (reward - b.mean) / b.n;
  }
}

/* ─────────────────────────────  2) Hierarchical Risk Parity (HRP)  ───────────────────────────── */
function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 5) return 0;
  let sa = 0, sb = 0;
  for (let i = 0; i < n; i++) { sa += a[i]; sb += b[i]; }
  const ma = sa / n, mb = sb / n;
  let num = 0, va = 0, vb = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - ma, db = b[i] - mb;
    num += da * db; va += da * da; vb += db * db;
  }
  const d = Math.sqrt(va * vb);
  return d > 0 ? num / d : 0;
}
export function hrpWeights(returnsBySymbol: Record<string, number[]>): Record<string, number> {
  const syms = Object.keys(returnsBySymbol);
  if (syms.length === 0) return {};
  if (syms.length === 1) return { [syms[0]]: 1 };
  // 1) inverse-variance seed
  const inv: Record<string, number> = {};
  let total = 0;
  for (const s of syms) {
    const r = returnsBySymbol[s];
    const m = r.reduce((x, y) => x + y, 0) / Math.max(1, r.length);
    const v = r.reduce((x, y) => x + (y - m) * (y - m), 0) / Math.max(1, r.length);
    const w = 1 / Math.max(1e-6, v);
    inv[s] = w; total += w;
  }
  // 2) cluster-aware shrink: down-weight highly-correlated pairs
  const out: Record<string, number> = {};
  for (const s of syms) {
    let corrPenalty = 0, k = 0;
    for (const t of syms) {
      if (t === s) continue;
      const c = Math.abs(pearson(returnsBySymbol[s], returnsBySymbol[t]));
      corrPenalty += c; k++;
    }
    const avgCorr = k > 0 ? corrPenalty / k : 0;
    out[s] = (inv[s] / total) * (1 - 0.4 * avgCorr);
  }
  // renorm
  const sum = Object.values(out).reduce((x, y) => x + y, 0);
  if (sum > 0) for (const s of syms) out[s] /= sum;
  return out;
}
/** Multiplier ≤1 if symbol is over-concentrated relative to HRP suggestion. */
export function hrpConcentrationMultiplier(symbol: string, currentWeight: number,
  returnsBySymbol: Record<string, number[]>): number {
  const w = hrpWeights(returnsBySymbol)[symbol];
  if (w == null) return 1.0;
  if (currentWeight <= w * 1.2) return 1.0;
  const over = currentWeight / w;
  return Math.max(0.7, 1 - 0.1 * Math.min(3, over - 1));
}

/* ─────────────────────────────  3) Kalman dynamic beta  ───────────────────────────── */
export function kalmanBetaUpdate(symbol: string, stockRet: number, indexRet: number): number {
  const st = symKalman[symbol] ?? (symKalman[symbol] = { beta: 1, p: 1 });
  const q = 1e-4, r = 1e-2;
  st.p += q;
  const k = (st.p * indexRet) / (indexRet * st.p * indexRet + r);
  st.beta += k * (stockRet - st.beta * indexRet);
  st.p = (1 - k * indexRet) * st.p;
  return st.beta;
}
/** Decoupling boost: beta dropping fast = idiosyncratic move. */
export function kalmanDecoupleMultiplier(symbol: string): number {
  const st = symKalman[symbol];
  if (!st) return 1.0;
  // 0.6–1.4 range; far-from-1 beta = stronger signal
  return Math.max(0.9, Math.min(1.15, 1 + (Math.abs(st.beta - 1) - 0.3) * 0.1));
}

/* ─────────────────────────────  4) Order-Flow Imbalance proxy  ───────────────────────────── */
export function ofiProxy(symbol: string, closes: number[], volumes: number[]): number {
  const n = Math.min(closes.length, volumes.length);
  if (n < 10) return 0;
  let buy = 0, sell = 0;
  for (let i = 1; i < n; i++) {
    const dir = Math.sign(closes[i] - closes[i - 1]);
    if (dir > 0) buy += volumes[i];
    else if (dir < 0) sell += volumes[i];
  }
  const imb = (buy - sell) / Math.max(1, buy + sell);
  const hist = ofiHist[symbol] ?? (ofiHist[symbol] = []);
  hist.push(imb); if (hist.length > 50) hist.shift();
  return imb;
}
export function ofiMultiplier(symbol: string, sigDir: 1 | -1 | 0): number {
  const hist = ofiHist[symbol];
  if (!hist || hist.length < 5 || sigDir === 0) return 1.0;
  const last = hist[hist.length - 1];
  // smart-money pressure aligned with signal
  const align = last * sigDir;
  return Math.max(0.9, Math.min(1.12, 1 + align * 0.2));
}

/* ─────────────────────────────  5) News-embedding similarity (proxy)  ───────────────────────────── */
function lexicalHash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return h;
}
export function recordNewsOutcome(headline: string, realisedImpact: number): void {
  newsHash.push({ hash: lexicalHash(headline.toLowerCase().slice(0, 200)), impact: realisedImpact });
  if (newsHash.length > 500) newsHash.shift();
}
export function newsSimilarityMultiplier(headline: string | null | undefined, sigDir: 1 | -1 | 0): number {
  if (!headline || sigDir === 0 || newsHash.length < 5) return 1.0;
  const h = lexicalHash(headline.toLowerCase().slice(0, 200));
  // crude similarity = bits-in-common ratio
  let best = 0, impact = 0;
  for (const n of newsHash) {
    const common = 32 - popcount(h ^ n.hash);
    const sim = common / 32;
    if (sim > best) { best = sim; impact = n.impact; }
  }
  if (best < 0.6) return 1.0;
  const align = Math.sign(impact) === sigDir ? 1 : -1;
  return Math.max(0.9, Math.min(1.15, 1 + align * Math.min(0.15, Math.abs(impact))));
}
function popcount(x: number): number {
  x = x - ((x >> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
  return (((x + (x >> 4)) & 0x0f0f0f0f) * 0x01010101) >> 24;
}

/* ─────────────────────────────  6) Sector rotation  ───────────────────────────── */
export function recordSectorReturn(sector: string | null, ret: number): void {
  if (!sector) return;
  const arr = sectorRet[sector] ?? (sectorRet[sector] = []);
  arr.push(ret); if (arr.length > 60) arr.shift();
}
export function sectorRotationMultiplier(sector: string | null, sigDir: 1 | -1 | 0): number {
  if (!sector || sigDir === 0) return 1.0;
  const own = sectorRet[sector];
  if (!own || own.length < 10) return 1.0;
  const ownAvg = own.slice(-20).reduce((s, x) => s + x, 0) / Math.min(20, own.length);
  let market = 0, k = 0;
  for (const s of Object.keys(sectorRet)) {
    const v = sectorRet[s];
    if (v.length < 5) continue;
    market += v.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, v.length); k++;
  }
  if (k === 0) return 1.0;
  const rel = ownAvg - market / k;
  const align = Math.sign(rel) === sigDir ? 1 : -1;
  return Math.max(0.9, Math.min(1.12, 1 + align * Math.min(0.12, Math.abs(rel) * 20)));
}

/* ─────────────────────────────  7) Bayesian hyper-param tuning (1-D)  ───────────────────────────── */
export function recordKnob(name: string, value: number, reward: number): void {
  const k = knobs[name] ?? (knobs[name] = { samples: [], best: value });
  k.samples.push({ x: value, y: reward });
  if (k.samples.length > 200) k.samples.shift();
  // pick best by simple EMA per bucket
  const buckets = new Map<number, { n: number; sum: number }>();
  for (const s of k.samples) {
    const bk = Math.round(s.x * 10) / 10;
    const b = buckets.get(bk) ?? { n: 0, sum: 0 };
    b.n++; b.sum += s.y; buckets.set(bk, b);
  }
  let bestVal = k.best, bestScore = -Infinity;
  for (const [bk, b] of buckets) {
    if (b.n < 3) continue;
    const score = b.sum / b.n;
    if (score > bestScore) { bestScore = score; bestVal = bk; }
  }
  k.best = bestVal;
}
export function suggestKnob(name: string, fallback: number): number {
  return knobs[name]?.best ?? fallback;
}

/* ─────────────────────────────  8) Counterfactual analysis  ───────────────────────────── */
export function recordCounterfactualBucket(confidence: number, realisedPct: number): void {
  const bk = `b${Math.floor(confidence / 5) * 5}`;
  const b = cfBuckets[bk] ?? (cfBuckets[bk] = { n: 0, sum: 0 });
  b.n += 1; b.sum += realisedPct;
}
export function counterfactualLiftAt(confidence: number): number {
  const bk = `b${Math.floor(confidence / 5) * 5}`;
  const here = cfBuckets[bk];
  const upBk = `b${Math.floor(confidence / 5) * 5 + 5}`;
  const up = cfBuckets[upBk];
  if (!here || !up || here.n < 5 || up.n < 5) return 0;
  return up.sum / up.n - here.sum / here.n;
}

/* ─────────────────────────────  9) ADWIN concept-drift detector  ───────────────────────────── */
export function adwinUpdate(name: string, value: number): boolean {
  const a = adwin[name] ?? (adwin[name] = { window: [], mean: 0 });
  a.window.push(value);
  if (a.window.length > 200) a.window.shift();
  if (a.window.length < 30) return false;
  const half = Math.floor(a.window.length / 2);
  const left = a.window.slice(0, half);
  const right = a.window.slice(half);
  const ml = left.reduce((s, x) => s + x, 0) / left.length;
  const mr = right.reduce((s, x) => s + x, 0) / right.length;
  const sd = Math.sqrt(a.window.reduce((s, x) => s + (x - a.mean) ** 2, 0) / a.window.length);
  a.mean = (ml + mr) / 2;
  const drift = Math.abs(mr - ml) > 2 * Math.max(1e-6, sd) / Math.sqrt(half);
  if (drift) a.window = right.slice(); // drop stale half
  return drift;
}
export function driftSeverity(name: string): number {
  const a = adwin[name];
  if (!a || a.window.length < 20) return 0;
  const half = Math.floor(a.window.length / 2);
  const ml = a.window.slice(0, half).reduce((s, x) => s + x, 0) / half;
  const mr = a.window.slice(half).reduce((s, x) => s + x, 0) / (a.window.length - half);
  return Math.abs(mr - ml);
}
export function adwinMultiplier(name: string): number {
  const sev = driftSeverity(name);
  if (sev === 0) return 1.0;
  return Math.max(0.8, 1 - Math.min(0.2, sev));
}

/* ─────────────────────────────  helpers for outcome loop  ───────────────────────────── */
export function pushSymbolReturn(symbol: string, ret: number): void {
  const arr = symRet[symbol] ?? (symRet[symbol] = []);
  arr.push({ ret, ts: Date.now() });
  if (arr.length > 120) arr.shift();
}
export function getReturnsMap(): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  for (const s of Object.keys(symRet)) out[s] = symRet[s].map((x) => x.ret);
  return out;
}

/* ─────────────────────────────  persistence  ───────────────────────────── */
export function snapshotTierCDEState(): Record<string, unknown> {
  return { bandits, _pulls, symKalman, ofiHist, newsHash, sectorRet, knobs, cfBuckets, adwin, symRet };
}
export function restoreTierCDEState(s: unknown): void {
  if (!s || typeof s !== "object") return;
  const obj = s as Record<string, unknown>;
  try {
    if (obj.bandits) Object.assign(bandits, obj.bandits);
    if (typeof obj._pulls === "number") _pulls = obj._pulls;
    if (obj.symKalman) Object.assign(symKalman, obj.symKalman);
    if (obj.ofiHist) Object.assign(ofiHist, obj.ofiHist);
    if (Array.isArray(obj.newsHash)) { newsHash.length = 0; newsHash.push(...(obj.newsHash as typeof newsHash)); }
    if (obj.sectorRet) Object.assign(sectorRet, obj.sectorRet);
    if (obj.knobs) Object.assign(knobs, obj.knobs);
    if (obj.cfBuckets) Object.assign(cfBuckets, obj.cfBuckets);
    if (obj.adwin) Object.assign(adwin, obj.adwin);
    if (obj.symRet) Object.assign(symRet, obj.symRet);
  } catch { /* fail-open */ }
}