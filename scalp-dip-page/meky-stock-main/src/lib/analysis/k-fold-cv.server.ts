// K-Fold cross validation
export type CVResult = {
  meanAccuracy: number;
  stdAccuracy: number;
  foldScores: number[];
  reliable: boolean;
};

export function kFoldCV<T>(
  samples: T[],
  k: number,
  evaluator: (train: T[], test: T[]) => number
): CVResult {
  if (samples.length < k * 2) return { meanAccuracy: 0, stdAccuracy: 0, foldScores: [], reliable: false };
  const shuffled = [...samples].sort(() => Math.random() - 0.5);
  const foldSize = Math.floor(shuffled.length / k);
  const scores: number[] = [];
  for (let i = 0; i < k; i++) {
    const test = shuffled.slice(i * foldSize, (i + 1) * foldSize);
    const train = [...shuffled.slice(0, i * foldSize), ...shuffled.slice((i + 1) * foldSize)];
    scores.push(evaluator(train, test));
  }
  const mean = scores.reduce((s, x) => s + x, 0) / scores.length;
  const std = Math.sqrt(scores.reduce((s, x) => s + (x - mean) ** 2, 0) / scores.length);
  return { meanAccuracy: +mean.toFixed(3), stdAccuracy: +std.toFixed(3), foldScores: scores, reliable: std < 0.15 };
}
