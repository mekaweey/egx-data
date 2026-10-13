/**
 * Bayesian confidence updater — combines a prior probability with new
 * evidence (each piece weighted by reliability). Uses log-odds form for stability.
 */
export type Evidence = {
  label: string;
  probability: number;   // 0-100 — probability that the bullish thesis is correct given this evidence
  reliability: number;   // 0-1 — how trustworthy this evidence is
};

export type BayesianResult = {
  priorPct: number;
  posteriorPct: number;
  deltaPct: number;
  appliedEvidence: number;
  label_ar: string;
};

function clamp(x: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, x)); }

function logOdds(p: number) {
  const safe = clamp(p / 100, 0.01, 0.99);
  return Math.log(safe / (1 - safe));
}

function fromLogOdds(lo: number) {
  return (1 / (1 + Math.exp(-lo))) * 100;
}

export function bayesianUpdate(priorPct: number, evidence: Evidence[]): BayesianResult {
  let lo = logOdds(priorPct);
  let applied = 0;
  for (const e of evidence) {
    if (e.reliability <= 0) continue;
    const evidenceLo = logOdds(e.probability);
    const priorBaselineLo = logOdds(50);
    // log-likelihood ratio = how much this evidence shifts from baseline
    const llr = (evidenceLo - priorBaselineLo) * clamp(e.reliability, 0, 1);
    lo += llr;
    applied++;
  }
  const posteriorPct = Math.round(fromLogOdds(lo));
  const deltaPct = posteriorPct - Math.round(priorPct);
  const label_ar = applied > 0
    ? `تحديث Bayesian: ${Math.round(priorPct)}% → ${posteriorPct}% (${applied} دليل)`
    : "";
  return { priorPct: Math.round(priorPct), posteriorPct, deltaPct, appliedEvidence: applied, label_ar };
}