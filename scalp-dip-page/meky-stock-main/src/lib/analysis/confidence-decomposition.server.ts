// Decompose final confidence into per-factor contributions
export type ConfidenceFactor = { name: string; nameAr: string; contribution: number; weight: number };

export function decomposeConfidence(factors: { name: string; nameAr: string; value: number; weight: number }[]): {
  total: number;
  breakdown: ConfidenceFactor[];
  topDriver: string;
} {
  const breakdown = factors.map(f => ({
    name: f.name, nameAr: f.nameAr,
    contribution: +(f.value * f.weight).toFixed(2),
    weight: f.weight
  }));
  const total = breakdown.reduce((s, x) => s + x.contribution, 0);
  const top = [...breakdown].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))[0];
  return { total: +total.toFixed(2), breakdown, topDriver: top?.nameAr || 'N/A' };
}
