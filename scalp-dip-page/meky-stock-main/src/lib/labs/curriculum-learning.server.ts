/**
 * Curriculum Learning — sort training samples from easiest to hardest.
 */
export interface TrainingSample<T = unknown> {
  features: number[];
  label: number;
  difficulty?: number;
  meta?: T;
}

export function rankByDifficulty<T>(
  samples: TrainingSample<T>[],
  scorer: (s: TrainingSample<T>) => number,
): TrainingSample<T>[] {
  return [...samples]
    .map((s) => ({ ...s, difficulty: scorer(s) }))
    .sort((a, b) => (a.difficulty ?? 0) - (b.difficulty ?? 0));
}

export function curriculumStages<T>(samples: TrainingSample<T>[], numStages: number = 4): TrainingSample<T>[][] {
  const sorted = [...samples].sort((a, b) => (a.difficulty ?? 0) - (b.difficulty ?? 0));
  const stages: TrainingSample<T>[][] = [];
  for (let i = 1; i <= numStages; i++) {
    const cut = Math.floor((sorted.length * i) / numStages);
    stages.push(sorted.slice(0, cut));
  }
  return stages;
}