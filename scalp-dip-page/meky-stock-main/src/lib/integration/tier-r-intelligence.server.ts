/**
 * Tier-R intelligence layer.
 * --------------------------------------------------------------------------
 * Eight learners that compound on top of Tier-Q:
 *   R.1  Thompson Sampling (Beta posterior per strategy/regime arm)
 *   R.2  Causal IPW edge per confidence bucket (treatment effect)
 *   R.3  Sector momentum rank multiplier
 *   R.4  Calendar / earnings proximity penalty
 *   R.5  Anchored VWAP deviation (vs N-day swing-low VWAP)
 *   R.6  Sentiment velocity (Δ sentiment over 24/48h)
 *   R.7  Volume Profile POC / VAH / VAL bands
 *   R.8  Ensemble disagreement (variance across tier multipliers)
 *
 * Pure in-memory state with bounded capacity; no external IO.
 */

// ───────────────────────── R.1 Thompson Sampling ─────────────────────────
const arms = new Map<string, { alpha: number; beta: number }>();
function gammaSample(k: number): number {
  // Marsaglia–Tsang approximation; k>=1
  if (k < 1) return gammaSample(k + 1) * Math.pow(Math.random(), 1 / k);
  const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
  while (true) {
    let x: number, v: number;
    do {
      const u1 = Math.random(), u2 = Math.random();
      x = Math.sqrt(-2 * Math.log(u1 || 1e-9)) * Math.cos(2 * Math.PI * u2);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = Math.random();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}
function betaSample(a: number, b: number): number {
  const x = gammaSample(Math.max(1, a));
  const y = gammaSample(Math.max(1, b));
  return x / (x + y || 1);
}
export function thompsonSampleR(arm: string): number {
  const s = arms.get(arm) ?? { alpha: 1, beta: 1 };
  return betaSample(s.alpha, s.beta);
}
export function recordArmOutcomeR(arm: string, won: boolean): void {
  const s = arms.get(arm) ?? { alpha: 1, beta: 1 };
  if (won) s.alpha++; else s.beta++;
  arms.set(arm, s);
}
export function thompsonMultiplierR(arm: string): number {
  const s = arms.get(arm);
  if (!s || s.alpha + s.beta < 6) return 1.0;
  const p = thompsonSampleR(arm);
  return Math.max(0.85, Math.min(1.15, 0.85 + (p - 0.4) * 0.75));
}

// ───────────────────────── R.2 Causal IPW edge ───────────────────────────
type IpwBucket = { n: number; sumW: number; sumWY: number };
const ipwBuckets = new Map<number, IpwBucket>(); // confidence bucket 0..9
function bucket(conf: number): number {
  return Math.max(0, Math.min(9, Math.floor(conf / 10)));
}
export function recordIpwR(confidence: number, propensity: number, realisedPct: number): void {
  const b = bucket(confidence);
  const w = 1 / Math.max(0.05, Math.min(0.95, propensity));
  const s = ipwBuckets.get(b) ?? { n: 0, sumW: 0, sumWY: 0 };
  s.n++; s.sumW += w; s.sumWY += w * realisedPct;
  ipwBuckets.set(b, s);
}
export function ipwMultiplierR(confidence: number): number {
  const s = ipwBuckets.get(bucket(confidence));
  if (!s || s.n < 8) return 1.0;
  const ate = s.sumWY / (s.sumW || 1); // estimated avg %
  // ATE in [-5..+5] %% → multiplier in [0.9..1.1]
  return Math.max(0.9, Math.min(1.1, 1 + ate / 50));
}

// ───────────────────────── R.3 Sector momentum ───────────────────────────
const sectorRet = new Map<string, number[]>();
export function recordSectorReturnR(sector: string | null, realisedPct: number): void {
  if (!sector) return;
  const a = sectorRet.get(sector) ?? [];
  a.push(realisedPct);
  if (a.length > 200) a.splice(0, a.length - 200);
  sectorRet.set(sector, a);
}
export function sectorMomentumMultiplierR(sector: string | null): number {
  if (!sector) return 1.0;
  const a = sectorRet.get(sector);
  if (!a || a.length < 10) return 1.0;
  const recent = a.slice(-20);
  const mean = recent.reduce((x, y) => x + y, 0) / recent.length;
  // mean in % units; clip to ±5% → multiplier ±10%.
  return Math.max(0.9, Math.min(1.1, 1 + Math.max(-5, Math.min(5, mean)) / 50));
}

// ───────────────────────── R.4 Earnings proximity ────────────────────────
/** Returns multiplier that penalises trades right before earnings. */
export function earningsProximityMultiplierR(nextEarningsDate: string | null | undefined): number {
  if (!nextEarningsDate) return 1.0;
  const days = (new Date(nextEarningsDate).getTime() - Date.now()) / 86400000;
  if (days < 0 || days > 14) return 1.0;
  if (days <= 1) return 0.80;
  if (days <= 3) return 0.88;
  if (days <= 7) return 0.94;
  return 0.97;
}

// ───────────────────────── R.5 Anchored VWAP ─────────────────────────────
export function anchoredVwapDevR(
  candles: Array<{ close: number; high: number; low: number; volume: number }>,
  lookback = 30,
): { vwap: number; deviationPct: number } | null {
  if (!candles || candles.length < 5) return null;
  const tail = candles.slice(-lookback);
  // Anchor to swing low within window.
  let anchor = 0;
  for (let i = 1; i < tail.length; i++) {
    if (tail[i].low < tail[anchor].low) anchor = i;
  }
  const seg = tail.slice(anchor);
  let pv = 0, vv = 0;
  for (const c of seg) {
    const tp = (c.high + c.low + c.close) / 3;
    pv += tp * c.volume;
    vv += c.volume;
  }
  if (vv <= 0) return null;
  const vwap = pv / vv;
  const last = seg[seg.length - 1].close;
  return { vwap, deviationPct: ((last - vwap) / vwap) * 100 };
}
export function anchoredVwapMultiplierR(dev: number | null): number {
  if (dev == null) return 1.0;
  // Above VWAP by >5% → extended; below by >5% → mean-revert chance.
  if (dev > 8) return 0.92;
  if (dev > 5) return 0.96;
  if (dev < -8) return 1.05;
  if (dev < -5) return 1.03;
  return 1.0;
}

// ───────────────────────── R.6 Sentiment velocity ────────────────────────
type SentSample = { ts: number; score: number };
const sentHistory = new Map<string, SentSample[]>();
export function recordSentimentR(symbol: string, score: number): void {
  const a = sentHistory.get(symbol) ?? [];
  a.push({ ts: Date.now(), score });
  // Drop samples older than 5 days.
  const cutoff = Date.now() - 5 * 86400000;
  while (a.length && a[0].ts < cutoff) a.shift();
  sentHistory.set(symbol, a);
}
export function sentimentVelocityR(symbol: string): number {
  const a = sentHistory.get(symbol);
  if (!a || a.length < 2) return 0;
  const now = Date.now();
  const recent = a.filter((s) => now - s.ts <= 24 * 3600 * 1000);
  const prior = a.filter((s) => now - s.ts > 24 * 3600 * 1000 && now - s.ts <= 48 * 3600 * 1000);
  if (!recent.length || !prior.length) return 0;
  const r = recent.reduce((x, s) => x + s.score, 0) / recent.length;
  const p = prior.reduce((x, s) => x + s.score, 0) / prior.length;
  return r - p; // Δ in score units.
}
export function sentimentVelocityMultiplierR(symbol: string): number {
  const v = sentimentVelocityR(symbol);
  if (!v) return 1.0;
  return Math.max(0.92, Math.min(1.08, 1 + Math.max(-0.5, Math.min(0.5, v)) * 0.16));
}

// ───────────────────────── R.7 Volume Profile ────────────────────────────
export function volumeProfileR(
  candles: Array<{ high: number; low: number; close: number; volume: number }>,
  bins = 24,
): { poc: number; vah: number; val: number } | null {
  if (!candles || candles.length < 10) return null;
  let lo = Infinity, hi = -Infinity;
  for (const c of candles) { if (c.low < lo) lo = c.low; if (c.high > hi) hi = c.high; }
  if (!isFinite(lo) || !isFinite(hi) || hi <= lo) return null;
  const step = (hi - lo) / bins;
  const vols = new Array(bins).fill(0);
  let total = 0;
  for (const c of candles) {
    const tp = (c.high + c.low + c.close) / 3;
    const b = Math.max(0, Math.min(bins - 1, Math.floor((tp - lo) / step)));
    vols[b] += c.volume;
    total += c.volume;
  }
  let pocIdx = 0;
  for (let i = 1; i < bins; i++) if (vols[i] > vols[pocIdx]) pocIdx = i;
  const target = total * 0.7;
  let acc = vols[pocIdx], lo2 = pocIdx, hi2 = pocIdx;
  while (acc < target && (lo2 > 0 || hi2 < bins - 1)) {
    const lv = lo2 > 0 ? vols[lo2 - 1] : -1;
    const hv = hi2 < bins - 1 ? vols[hi2 + 1] : -1;
    if (hv >= lv) { hi2++; acc += vols[hi2]; } else { lo2--; acc += vols[lo2]; }
  }
  return {
    poc: lo + (pocIdx + 0.5) * step,
    vah: lo + (hi2 + 1) * step,
    val: lo + lo2 * step,
  };
}
export function volumeProfileMultiplierR(price: number, vp: { poc: number; vah: number; val: number } | null): number {
  if (!vp) return 1.0;
  // Buying near VAL → favourable; chasing above VAH → unfavourable.
  if (price <= vp.val) return 1.05;
  if (price >= vp.vah) return 0.95;
  return 1.0;
}

// ───────────────────────── R.8 Ensemble disagreement ─────────────────────
export function ensembleDisagreementR(multipliers: number[]): number {
  const m = multipliers.filter((x) => isFinite(x));
  if (m.length < 3) return 1.0;
  const mean = m.reduce((a, b) => a + b, 0) / m.length;
  const variance = m.reduce((a, b) => a + (b - mean) ** 2, 0) / m.length;
  const std = Math.sqrt(variance);
  // Low std → agreement boost; high std → penalty.
  if (std < 0.03) return 1.08;
  if (std < 0.06) return 1.03;
  if (std > 0.15) return 0.88;
  if (std > 0.10) return 0.94;
  return 1.0;
}

// ─────────────────── State snapshot/restore for persistence ──────────────
export function snapshotTierRState(): unknown {
  return {
    arms: Array.from(arms.entries()),
    ipw: Array.from(ipwBuckets.entries()),
    sectorRet: Array.from(sectorRet.entries()),
  };
}
export function restoreTierRState(s: unknown): void {
  const o = s as Partial<{
    arms: Array<[string, { alpha: number; beta: number }]>;
    ipw: Array<[number, IpwBucket]>;
    sectorRet: Array<[string, number[]]>;
  }>;
  if (!o) return;
  if (o.arms) for (const [k, v] of o.arms) arms.set(k, v);
  if (o.ipw) for (const [k, v] of o.ipw) ipwBuckets.set(k, v);
  if (o.sectorRet) for (const [k, v] of o.sectorRet) sectorRet.set(k, v.slice(-200));
}