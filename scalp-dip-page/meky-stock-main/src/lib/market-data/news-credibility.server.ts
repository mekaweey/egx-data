/**
 * News source credibility weights for sentiment scoring.
 * Reuters / Bloomberg / official exchange = trusted (full weight).
 * Bloggy or unknown sources = down-weighted.
 */
const WEIGHTS: Array<{ pattern: RegExp; weight: number; label: string }> = [
  { pattern: /reuters|bloomberg|financial.?times|wall.?street|wsj/i, weight: 1.0, label: "tier-1" },
  { pattern: /almal|hapijournal|mubasher|argaam|enterprise/i, weight: 0.9, label: "tier-1-ar" },
  { pattern: /youm7|masrawy|elwatannews|shorouknews|ahram/i, weight: 0.75, label: "tier-2" },
  { pattern: /investing\.com|tradingview/i, weight: 0.7, label: "data-aggregator" },
  { pattern: /facebook|twitter|telegram|x\.com/i, weight: 0.3, label: "social" },
];

export function credibilityWeight(sourceName?: string | null, sourceUrl?: string | null): { weight: number; tier: string } {
  const text = `${sourceName ?? ""} ${sourceUrl ?? ""}`.toLowerCase();
  for (const w of WEIGHTS) {
    if (w.pattern.test(text)) return { weight: w.weight, tier: w.label };
  }
  return { weight: 0.6, tier: "unknown" };
}

/**
 * Apply credibility weighting to a raw sentiment score (-1..+1).
 * Returns the adjusted score (closer to 0 when credibility is low).
 */
export function weightSentiment(rawScore: number, sourceName?: string | null, sourceUrl?: string | null): number {
  const { weight } = credibilityWeight(sourceName, sourceUrl);
  return +(rawScore * weight).toFixed(3);
}
