/**
 * Synthetic Control Method — build a weighted combination of donor units
 * that mimics the treated unit's pre-event trajectory.
 */
export interface UnitSeries {
  name: string;
  series: number[];
}

function l2(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

/** Returns weights summing to 1 minimizing pre-event distance (greedy simplex). */
export function fitSyntheticControl(
  treated: UnitSeries,
  donors: UnitSeries[],
  preEventLength: number,
  iterations: number = 200,
): Record<string, number> {
  const n = donors.length;
  let weights = new Array(n).fill(1 / n);
  const treatPre = treated.series.slice(0, preEventLength);
  const donorsPre = donors.map((d) => d.series.slice(0, preEventLength));

  const combined = () =>
    treatPre.map((_, t) => weights.reduce((s, w, i) => s + w * donorsPre[i][t], 0));
  let bestLoss = l2(treatPre, combined());

  for (let it = 0; it < iterations; it++) {
    const i = Math.floor(Math.random() * n);
    const j = Math.floor(Math.random() * n);
    if (i === j) continue;
    const delta = 0.05;
    if (weights[i] < delta) continue;
    weights[i] -= delta;
    weights[j] += delta;
    const loss = l2(treatPre, combined());
    if (loss < bestLoss) {
      bestLoss = loss;
    } else {
      weights[i] += delta;
      weights[j] -= delta;
    }
  }
  const out: Record<string, number> = {};
  donors.forEach((d, i) => (out[d.name] = weights[i]));
  return out;
}

export function syntheticPath(weights: Record<string, number>, donors: UnitSeries[]): number[] {
  const T = donors[0].series.length;
  const path: number[] = [];
  for (let t = 0; t < T; t++) {
    let v = 0;
    for (const d of donors) v += (weights[d.name] ?? 0) * d.series[t];
    path.push(v);
  }
  return path;
}