/**
 * Meta-Learning (MAML - Model-Agnostic Meta-Learning)
 * Enables fast adaptation to new symbols with few examples.
 */

export interface MAMLTask {
  symbol: string;
  support: Array<{ features: number[]; label: number }>;
  query: Array<{ features: number[]; label: number }>;
}

export interface MAMLResult {
  adaptedWeights: number[];
  metaLoss: number;
  adaptationSteps: number;
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Inner loop: gradient descent on support set starting from meta-weights.
 */
function adapt(metaWeights: number[], support: MAMLTask["support"], lr: number, steps: number): number[] {
  const w = [...metaWeights];
  for (let step = 0; step < steps; step++) {
    const grad = new Array(w.length).fill(0);
    for (const ex of support) {
      const pred = sigmoid(dot(w, ex.features));
      const err = pred - ex.label;
      for (let i = 0; i < w.length; i++) grad[i] += err * ex.features[i];
    }
    for (let i = 0; i < w.length; i++) w[i] -= (lr * grad[i]) / Math.max(1, support.length);
  }
  return w;
}

/**
 * MAML training: meta-update across multiple tasks.
 */
export function trainMAML(
  tasks: MAMLTask[],
  opts: { metaLr?: number; innerLr?: number; innerSteps?: number; metaSteps?: number } = {},
): MAMLResult {
  const metaLr = opts.metaLr ?? 0.01;
  const innerLr = opts.innerLr ?? 0.05;
  const innerSteps = opts.innerSteps ?? 3;
  const metaSteps = opts.metaSteps ?? 50;

  if (tasks.length === 0) return { adaptedWeights: [], metaLoss: 0, adaptationSteps: 0 };
  const dim = tasks[0].support[0]?.features.length ?? 0;
  let metaW = new Array(dim).fill(0).map(() => (Math.random() - 0.5) * 0.1);
  let lastLoss = 0;

  for (let m = 0; m < metaSteps; m++) {
    const metaGrad = new Array(dim).fill(0);
    let totalLoss = 0;
    for (const task of tasks) {
      const adapted = adapt(metaW, task.support, innerLr, innerSteps);
      for (const ex of task.query) {
        const pred = sigmoid(dot(adapted, ex.features));
        const err = pred - ex.label;
        totalLoss += err * err;
        for (let i = 0; i < dim; i++) metaGrad[i] += err * ex.features[i];
      }
    }
    for (let i = 0; i < dim; i++) metaW[i] -= (metaLr * metaGrad[i]) / tasks.length;
    lastLoss = totalLoss / tasks.length;
  }

  return { adaptedWeights: metaW, metaLoss: lastLoss, adaptationSteps: innerSteps };
}

/**
 * Apply meta-learned weights to a new symbol with few examples.
 */
export function adaptToNewSymbol(metaWeights: number[], fewShotExamples: MAMLTask["support"]): number[] {
  return adapt(metaWeights, fewShotExamples, 0.05, 5);
}