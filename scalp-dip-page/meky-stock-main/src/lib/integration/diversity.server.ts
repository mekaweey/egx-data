/**
 * Ensemble diversity / disagreement penalty.
 * --------------------------------------------------------------------------
 * If all modules agree → high confidence. If they're split → reduce
 * confidence. Uses normalised entropy over the sign distribution of
 * signals weighted by their internal confidence.
 */
import type { ModuleSignal } from "./pipeline-integrator.server";

export interface DiversityResult {
  agreement: number;   // 0 = perfectly split, 1 = unanimous
  entropy: number;     // normalised entropy in [0, 1]
  bullWeight: number;
  bearWeight: number;
  neutralWeight: number;
  /** Multiplier in [0.6, 1.1] to apply to confidence delta. */
  multiplier: number;
}

export function diversity(signals: ModuleSignal[]): DiversityResult {
  let bull = 0, bear = 0, neutral = 0;
  for (const s of signals) {
    const w = s.confidence ?? 0.5;
    if (s.value > 0.05) bull += w;
    else if (s.value < -0.05) bear += w;
    else neutral += w;
  }
  const total = bull + bear + neutral || 1;
  const pB = bull / total, pS = bear / total, pN = neutral / total;
  const term = (p: number) => (p > 0 ? -p * Math.log(p) : 0);
  const H = term(pB) + term(pS) + term(pN);
  const maxH = Math.log(3);
  const entropy = H / maxH;
  // Agreement = how dominant the top class is.
  const agreement = Math.max(pB, pS, pN);
  // Multiplier: unanimous → 1.1, even split → 0.6
  const multiplier = 0.6 + 0.5 * agreement;
  return { agreement, entropy, bullWeight: pB, bearWeight: pS, neutralWeight: pN, multiplier };
}