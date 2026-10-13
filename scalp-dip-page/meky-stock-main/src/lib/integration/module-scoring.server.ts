/**
 * Per-module accuracy scoring + auto-tune weights.
 * --------------------------------------------------------------------------
 * Tracks Brier score for each module's signal vs realised outcome and turns
 * that into a multiplicative weight that the orchestrator feeds into
 * `integrateSignals`. A module that consistently predicts the right
 * direction gets up-weighted; one that's no better than random drifts
 * toward weight 0.
 */

export interface ModuleScore {
  /** Sum of (signal - actual)^2 over recent observations. Lower = better. */
  brierSum: number;
  /** Number of observations. */
  n: number;
  /** EWMA hit rate (sign agreement). */
  hitRate: number;
  /** Computed weight multiplier in [0.1, 2.0]. */
  weight: number;
}

const scores = new Map<string, ModuleScore>();
const HALF_LIFE = 50; // observations
const ALPHA = 1 - Math.pow(0.5, 1 / HALF_LIFE);

/** Per-(module,symbol) and per-(module,sector) scores for finer weighting. */
const symbolScores = new Map<string, ModuleScore>();
const sectorScores = new Map<string, ModuleScore>();
/** Time-decay half-life in days (default 14d). */
const TIME_DECAY_DAYS = 14;

function timeWeight(ageMs: number): number {
  const days = ageMs / 86_400_000;
  return Math.pow(0.5, days / TIME_DECAY_DAYS);
}

function updateScore(map: Map<string, ModuleScore>, key: string, signal: number, actualReturn: number, ageMs: number) {
  const s = map.get(key) ?? { brierSum: 0, n: 0, hitRate: 0.5, weight: 1.0 };
  const sigCapped = Math.max(-1, Math.min(1, signal));
  const actCapped = Math.max(-1, Math.min(1, actualReturn * 20));
  const err = (sigCapped - actCapped) ** 2;
  const w = timeWeight(ageMs);
  const a = ALPHA * w;
  s.brierSum = s.brierSum * (1 - a) + err * a;
  s.n = Math.min(s.n + 1, 10_000);
  const hit = Math.sign(sigCapped) === Math.sign(actCapped) ? 1 : 0;
  s.hitRate = s.hitRate * (1 - a) + hit * a;
  s.weight = Math.max(0.1, Math.min(2.0, 0.2 + 1.6 * Math.max(0, s.hitRate - 0.4) / 0.4));
  map.set(key, s);
}

/**
 * Record an observation. `signal` is the module's value in [-1, 1] at the
 * time the recommendation was made. `actualReturn` is the realised return
 * (e.g. realized_pct / 100). Both are mapped to [-1, 1] for Brier.
 */
export function recordOutcome(
  moduleName: string,
  signal: number,
  actualReturn: number,
  meta: { symbol?: string; sector?: string | null; ageMs?: number } = {},
) {
  const ageMs = meta.ageMs ?? 0;
  updateScore(scores, moduleName, signal, actualReturn, ageMs);
  if (meta.symbol) updateScore(symbolScores, `${moduleName}|${meta.symbol}`, signal, actualReturn, ageMs);
  if (meta.sector) updateScore(sectorScores, `${moduleName}|${meta.sector}`, signal, actualReturn, ageMs);
}

export function getWeightMultipliers(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of scores) {
    if (v.n >= 5) out[k] = v.weight;
  }
  return out;
}

/**
 * Per-symbol weight overlay: if we have enough samples for module X on
 * symbol Y, blend that specific weight on top of the global one.
 */
export function getSymbolWeightOverlay(symbol: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of symbolScores) {
    if (!k.endsWith(`|${symbol}`)) continue;
    if (v.n < 8) continue;
    const name = k.split("|")[0];
    // Blend: 70% per-symbol, capped near 1.
    out[name] = 0.3 + 0.7 * v.weight;
  }
  return out;
}

export function getSectorWeightOverlay(sector?: string | null): Record<string, number> {
  if (!sector) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of sectorScores) {
    if (!k.endsWith(`|${sector}`)) continue;
    if (v.n < 8) continue;
    const name = k.split("|")[0];
    out[name] = 0.4 + 0.6 * v.weight;
  }
  return out;
}

export function getAllScores(): Array<{ name: string } & ModuleScore> {
  return Array.from(scores.entries()).map(([name, s]) => ({ name, ...s }));
}

export function resetScores() {
  scores.clear();
  symbolScores.clear();
  sectorScores.clear();
}