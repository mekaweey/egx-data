// Optuna-style random search for hyperparameter tuning
export type HyperParams = {
  minConfidence: number;
  stopAtrMultiplier: number;
  targetAtrMultiplier: number;
  maxHoldDays: number;
  patternWeight: number;
  sentimentWeight: number;
};

export type TuningResult = {
  bestParams: HyperParams;
  bestScore: number;
  trialsRun: number;
  improvement: number;
};

function randomParams(): HyperParams {
  return {
    minConfidence: 55 + Math.floor(Math.random() * 25),
    stopAtrMultiplier: 1.5 + Math.random() * 2,
    targetAtrMultiplier: 2 + Math.random() * 3,
    maxHoldDays: 5 + Math.floor(Math.random() * 25),
    patternWeight: 0.5 + Math.random() * 1.5,
    sentimentWeight: 0.3 + Math.random() * 1.2
  };
}

export function tuneHyperparameters(
  evaluator: (params: HyperParams) => number,
  baselineParams: HyperParams,
  trials = 30
): TuningResult {
  let bestParams = baselineParams;
  let bestScore = evaluator(baselineParams);
  const baseline = bestScore;
  for (let i = 0; i < trials; i++) {
    const p = randomParams();
    const s = evaluator(p);
    if (s > bestScore) { bestScore = s; bestParams = p; }
  }
  return { bestParams, bestScore, trialsRun: trials, improvement: bestScore - baseline };
}
