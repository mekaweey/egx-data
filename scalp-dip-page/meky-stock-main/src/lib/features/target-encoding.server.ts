/**
 * Target encoding for categorical features (with smoothing to prevent leakage).
 */

export interface TargetEncoder {
  mapping: Map<string, number>;
  globalMean: number;
  smoothing: number;
}

export function fitTargetEncoder(
  categories: string[],
  target: number[],
  smoothing: number = 10,
): TargetEncoder {
  const globalMean = target.reduce((a, b) => a + b, 0) / Math.max(target.length, 1);
  const groups = new Map<string, { sum: number; count: number }>();

  for (let i = 0; i < categories.length; i++) {
    const c = categories[i];
    const g = groups.get(c) ?? { sum: 0, count: 0 };
    g.sum += target[i];
    g.count += 1;
    groups.set(c, g);
  }

  const mapping = new Map<string, number>();
  for (const [cat, { sum, count }] of groups) {
    const local = sum / count;
    // Bayesian smoothing toward global mean
    const smoothed = (count * local + smoothing * globalMean) / (count + smoothing);
    mapping.set(cat, smoothed);
  }

  return { mapping, globalMean, smoothing };
}

export function transformTargetEncoder(encoder: TargetEncoder, categories: string[]): number[] {
  return categories.map((c) => encoder.mapping.get(c) ?? encoder.globalMean);
}

/** K-fold target encoding to prevent train-set leakage. */
export function kFoldTargetEncode(
  categories: string[],
  target: number[],
  k: number = 5,
  smoothing: number = 10,
): number[] {
  const n = categories.length;
  const encoded = new Array(n).fill(0);
  const foldSize = Math.ceil(n / k);

  for (let fold = 0; fold < k; fold++) {
    const valStart = fold * foldSize;
    const valEnd = Math.min(valStart + foldSize, n);
    const trainCats: string[] = [];
    const trainTgt: number[] = [];
    for (let i = 0; i < n; i++) {
      if (i < valStart || i >= valEnd) {
        trainCats.push(categories[i]);
        trainTgt.push(target[i]);
      }
    }
    const enc = fitTargetEncoder(trainCats, trainTgt, smoothing);
    for (let i = valStart; i < valEnd; i++) {
      encoded[i] = enc.mapping.get(categories[i]) ?? enc.globalMean;
    }
  }
  return encoded;
}