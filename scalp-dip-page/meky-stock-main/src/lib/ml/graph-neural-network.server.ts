/**
 * #2 Graph Neural Network للقطاعات (تقريب message-passing).
 * كل سهم = عقدة، الحواف = correlation > threshold.
 * نمرر إشارات السعر بين العقد عبر iterations لمعرفة تأثير الجيران.
 */
export interface GraphNode { symbol: string; signal: number; sector?: string }
export interface GraphEdge { from: string; to: string; weight: number }

export function buildGraph(nodes: GraphNode[], correlations: Map<string, Map<string, number>>, threshold = 0.5): GraphEdge[] {
  const edges: GraphEdge[] = [];
  for (const a of nodes) {
    const row = correlations.get(a.symbol);
    if (!row) continue;
    for (const b of nodes) {
      if (a.symbol === b.symbol) continue;
      const w = row.get(b.symbol);
      if (w !== undefined && Math.abs(w) >= threshold) edges.push({ from: a.symbol, to: b.symbol, weight: w });
    }
  }
  return edges;
}

export function propagateSignals(nodes: GraphNode[], edges: GraphEdge[], iterations = 2, alpha = 0.3): Map<string, number> {
  const state = new Map(nodes.map((n) => [n.symbol, n.signal]));
  for (let i = 0; i < iterations; i++) {
    const next = new Map(state);
    for (const n of nodes) {
      const neighbors = edges.filter((e) => e.from === n.symbol);
      if (!neighbors.length) continue;
      const agg = neighbors.reduce((s, e) => s + (state.get(e.to) ?? 0) * e.weight, 0) / neighbors.length;
      next.set(n.symbol, (1 - alpha) * (state.get(n.symbol) ?? 0) + alpha * agg);
    }
    state.clear();
    next.forEach((v, k) => state.set(k, v));
  }
  return state;
}