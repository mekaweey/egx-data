/**
 * #23 Ensemble of Ensembles: meta-meta learner يجمع كل الموديلات السابقة.
 */
export interface EnsembleVote { name: string; signal: "BUY" | "SELL" | "HOLD"; confidence: number; weight: number }

export function metaEnsemble(votes: EnsembleVote[]): { signal: "BUY" | "SELL" | "HOLD"; confidence: number; agreement: number } {
  const totalWeight = votes.reduce((s, v) => s + v.weight, 0);
  const scores: Record<string, number> = { BUY: 0, SELL: 0, HOLD: 0 };
  for (const v of votes) scores[v.signal] += (v.confidence * v.weight) / Math.max(totalWeight, 1);
  const winner = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0]) as [string, number];
  const sameVotes = votes.filter((v) => v.signal === winner[0]).length;
  return {
    signal: winner[0] as "BUY" | "SELL" | "HOLD",
    confidence: Math.round(winner[1]),
    agreement: Math.round((sameVotes / votes.length) * 100),
  };
}