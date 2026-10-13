// SMOTE-lite: synthetic minority oversampling for class imbalance
export type LabeledSample = { features: number[]; label: 0 | 1; weight?: number };

export function smoteAugment(samples: LabeledSample[], k = 5): LabeledSample[] {
  const minority = samples.filter(s => s.label === 1);
  const majority = samples.filter(s => s.label === 0);
  if (minority.length === 0 || minority.length >= majority.length) return samples;
  const needed = majority.length - minority.length;
  const synthetic: LabeledSample[] = [];
  for (let i = 0; i < needed; i++) {
    const base = minority[Math.floor(Math.random() * minority.length)];
    // Find k nearest in minority class
    const distances = minority
      .filter(s => s !== base)
      .map(s => ({ s, d: Math.sqrt(s.features.reduce((sum, f, j) => sum + (f - base.features[j]) ** 2, 0)) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, k);
    if (distances.length === 0) break;
    const neighbor = distances[Math.floor(Math.random() * distances.length)].s;
    const alpha = Math.random();
    const features = base.features.map((f, j) => f + alpha * (neighbor.features[j] - f));
    synthetic.push({ features, label: 1, weight: 0.7 });
  }
  return [...samples, ...synthetic];
}

export function removeOutliers(samples: LabeledSample[], stdDevThreshold = 3): LabeledSample[] {
  if (samples.length < 10) return samples;
  const dims = samples[0].features.length;
  const means = Array(dims).fill(0);
  const stds = Array(dims).fill(0);
  for (const s of samples) for (let i = 0; i < dims; i++) means[i] += s.features[i];
  for (let i = 0; i < dims; i++) means[i] /= samples.length;
  for (const s of samples) for (let i = 0; i < dims; i++) stds[i] += (s.features[i] - means[i]) ** 2;
  for (let i = 0; i < dims; i++) stds[i] = Math.sqrt(stds[i] / samples.length);
  return samples.filter(s =>
    s.features.every((f, i) => stds[i] === 0 || Math.abs(f - means[i]) <= stdDevThreshold * stds[i])
  );
}

export function classWeights(samples: LabeledSample[]): { pos: number; neg: number } {
  const pos = samples.filter(s => s.label === 1).length || 1;
  const neg = samples.filter(s => s.label === 0).length || 1;
  const total = pos + neg;
  return { pos: total / (2 * pos), neg: total / (2 * neg) };
}
