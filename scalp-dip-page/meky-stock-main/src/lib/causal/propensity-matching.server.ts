/**
 * Propensity Score Matching — match treated and control units by similarity
 * in covariates, then estimate average treatment effect on the treated.
 */
export interface PSMRow {
  treated: boolean;
  covariates: number[];
  outcome: number;
}

function distance(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

/** Returns Average Treatment Effect on Treated (ATT). */
export function estimateATT(rows: PSMRow[]): number {
  const treated = rows.filter((r) => r.treated);
  const controls = rows.filter((r) => !r.treated);
  if (treated.length === 0 || controls.length === 0) return 0;
  let total = 0;
  for (const t of treated) {
    let best = controls[0];
    let bestDist = distance(t.covariates, controls[0].covariates);
    for (let i = 1; i < controls.length; i++) {
      const d = distance(t.covariates, controls[i].covariates);
      if (d < bestDist) {
        bestDist = d;
        best = controls[i];
      }
    }
    total += t.outcome - best.outcome;
  }
  return total / treated.length;
}