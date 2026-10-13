/**
 * Do-Calculus engine (lightweight).
 * Given a causal DAG and observational data, estimates P(Y | do(X=x)) using
 * back-door adjustment.
 */
export interface CausalGraph {
  nodes: string[];
  edges: Array<[string, string]>; // [from, to]
}

export function backdoorAdjustmentSet(graph: CausalGraph, treatment: string, outcome: string): string[] {
  const parents = (n: string) =>
    graph.edges.filter(([, to]) => to === n).map(([from]) => from);
  const candidate = parents(treatment).filter((p) => p !== outcome);
  return candidate;
}

export interface Row {
  values: Record<string, number>;
}

/** Estimate E[Y | do(X=xValue)] via stratification over adjustment set Z. */
export function doEstimate(
  rows: Row[],
  graph: CausalGraph,
  treatment: string,
  outcome: string,
  xValue: number,
): number {
  const Z = backdoorAdjustmentSet(graph, treatment, outcome);
  if (Z.length === 0) {
    const matching = rows.filter((r) => r.values[treatment] === xValue);
    if (matching.length === 0) return 0;
    return matching.reduce((s, r) => s + r.values[outcome], 0) / matching.length;
  }
  const strataKey = (r: Row) => Z.map((z) => `${z}=${r.values[z]}`).join("|");
  const strata = new Map<string, Row[]>();
  for (const r of rows) {
    const k = strataKey(r);
    if (!strata.has(k)) strata.set(k, []);
    strata.get(k)!.push(r);
  }
  let total = 0;
  let weight = 0;
  for (const group of strata.values()) {
    const matching = group.filter((r) => r.values[treatment] === xValue);
    if (matching.length === 0) continue;
    const localMean = matching.reduce((s, r) => s + r.values[outcome], 0) / matching.length;
    const p = group.length / rows.length;
    total += localMean * p;
    weight += p;
  }
  return weight === 0 ? 0 : total / weight;
}