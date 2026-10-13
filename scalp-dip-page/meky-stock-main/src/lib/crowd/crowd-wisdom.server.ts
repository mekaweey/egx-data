/**
 * Crowd Wisdom Aggregator — weight retail/pro predictions by past accuracy.
 */
export interface CrowdSource {
  name: string;
  prediction: number; // direction or expected return
  historicalAccuracy: number; // 0..1
  sampleSize: number;
}

export function aggregate(sources: CrowdSource[]): { weighted: number; confidence: number } {
  if (sources.length === 0) return { weighted: 0, confidence: 0 };
  let num = 0;
  let den = 0;
  for (const s of sources) {
    const w = Math.max(0, s.historicalAccuracy - 0.5) * Math.log10(s.sampleSize + 10);
    num += w * s.prediction;
    den += w;
  }
  const weighted = den === 0 ? 0 : num / den;
  const confidence = Math.min(1, den / sources.length);
  return { weighted, confidence };
}