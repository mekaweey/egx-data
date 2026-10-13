/**
 * #4 AutoML Pipeline: يجرب تركيبات features ويختار الأحسن حسب سكور.
 */
export interface FeatureCombo { name: string; features: string[]; score: number }

export function runAutoML(
  candidateFeatures: string[],
  evaluate: (combo: string[]) => number,
  maxCombos = 50,
  minSize = 2,
  maxSize = 5,
): FeatureCombo[] {
  const results: FeatureCombo[] = [];
  for (let i = 0; i < maxCombos; i++) {
    const size = minSize + Math.floor(Math.random() * (maxSize - minSize + 1));
    const shuffled = [...candidateFeatures].sort(() => Math.random() - 0.5);
    const combo = shuffled.slice(0, size);
    const score = evaluate(combo);
    results.push({ name: combo.join("+"), features: combo, score });
  }
  return results.sort((a, b) => b.score - a.score).slice(0, 5);
}