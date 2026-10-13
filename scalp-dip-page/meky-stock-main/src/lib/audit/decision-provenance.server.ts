/**
 * Decision Provenance / Audit Trail.
 */
export interface DecisionRecord {
  id: string;
  ts: string;
  symbol: string;
  action: "buy" | "sell" | "hold";
  baseConfidence: number;
  adjustedConfidence: number;
  features: Record<string, number>;
  contributingModules: Array<{ name: string; weight: number; signal: number }>;
  rationale: string;
  modelVersion: string;
  marketRegime?: string;
}

export function newDecisionId(): string {
  return `dec_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function buildRecord(args: Omit<DecisionRecord, "id" | "ts">): DecisionRecord {
  return { id: newDecisionId(), ts: new Date().toISOString(), ...args };
}

export function summarize(r: DecisionRecord): string {
  const top = [...r.contributingModules]
    .sort((a, b) => Math.abs(b.weight * b.signal) - Math.abs(a.weight * a.signal))
    .slice(0, 3)
    .map((m) => `${m.name}(${(m.weight * m.signal).toFixed(2)})`)
    .join(", ");
  return `[${r.ts}] ${r.symbol} ${r.action.toUpperCase()} conf=${r.adjustedConfidence.toFixed(1)} (base ${r.baseConfidence.toFixed(1)}) regime=${r.marketRegime ?? "n/a"} top=${top}`;
}