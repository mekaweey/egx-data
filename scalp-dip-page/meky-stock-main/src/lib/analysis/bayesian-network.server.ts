/**
 * #10 Bayesian Network للأحداث: احتمالات شرطية.
 * مثال: P(BankStocksDown | InterestRateUp) = ?
 */
export interface BayesNode { name: string; probabilities: Record<string, number> }
export interface BayesEdge { from: string; to: string; conditional: Record<string, Record<string, number>> }

export class BayesianNetwork {
  private nodes = new Map<string, BayesNode>();
  private edges: BayesEdge[] = [];

  addNode(node: BayesNode) { this.nodes.set(node.name, node) }
  addEdge(edge: BayesEdge) { this.edges.push(edge) }

  // P(target=state | evidence)
  query(target: string, targetState: string, evidence: Record<string, string>): number {
    const node = this.nodes.get(target);
    if (!node) return 0;
    let prob = node.probabilities[targetState] ?? 0;
    for (const [evNode, evState] of Object.entries(evidence)) {
      const edge = this.edges.find((e) => e.from === evNode && e.to === target);
      if (edge) {
        const cond = edge.conditional[evState]?.[targetState];
        if (cond !== undefined) prob = (prob + cond) / 2;
      }
    }
    return prob;
  }
}