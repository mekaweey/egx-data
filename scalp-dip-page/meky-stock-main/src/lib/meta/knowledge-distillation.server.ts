/**
 * Knowledge Distillation: train a small "student" model to mimic a large "teacher".
 */

export interface DistillationExample {
  features: number[];
  teacherProbs: number[]; // soft labels from teacher
  hardLabel?: number;
}

export interface StudentModel {
  weights: number[][];
  classes: number;
}

function softmax(logits: number[], temperature: number = 1): number[] {
  const scaled = logits.map((l) => l / temperature);
  const maxL = Math.max(...scaled);
  const exps = scaled.map((l) => Math.exp(l - maxL));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/**
 * KL divergence between teacher and student distributions.
 */
export function klDivergence(teacher: number[], student: number[]): number {
  let kl = 0;
  for (let i = 0; i < teacher.length; i++) {
    if (teacher[i] > 1e-10) {
      kl += teacher[i] * Math.log(teacher[i] / Math.max(student[i], 1e-10));
    }
  }
  return kl;
}

export function trainStudent(
  examples: DistillationExample[],
  opts: { dim: number; classes: number; temperature?: number; lr?: number; epochs?: number; alpha?: number } = {
    dim: 0,
    classes: 2,
  },
): StudentModel {
  const T = opts.temperature ?? 4;
  const lr = opts.lr ?? 0.01;
  const epochs = opts.epochs ?? 30;
  const alpha = opts.alpha ?? 0.7;

  const weights: number[][] = Array.from({ length: opts.classes }, () =>
    new Array(opts.dim).fill(0).map(() => (Math.random() - 0.5) * 0.1),
  );

  for (let e = 0; e < epochs; e++) {
    for (const ex of examples) {
      const logits = weights.map((w) => w.reduce((s, wi, i) => s + wi * ex.features[i], 0));
      const studentSoft = softmax(logits, T);
      const studentHard = softmax(logits, 1);

      for (let c = 0; c < opts.classes; c++) {
        const softGrad = (studentSoft[c] - ex.teacherProbs[c]) * T;
        const hardGrad =
          ex.hardLabel !== undefined ? studentHard[c] - (c === ex.hardLabel ? 1 : 0) : 0;
        const grad = alpha * softGrad + (1 - alpha) * hardGrad;
        for (let i = 0; i < opts.dim; i++) {
          weights[c][i] -= lr * grad * ex.features[i];
        }
      }
    }
  }

  return { weights, classes: opts.classes };
}

export function studentPredict(model: StudentModel, features: number[]): number[] {
  const logits = model.weights.map((w) => w.reduce((s, wi, i) => s + wi * features[i], 0));
  return softmax(logits, 1);
}