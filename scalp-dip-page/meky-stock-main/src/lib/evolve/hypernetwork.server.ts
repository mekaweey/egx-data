/**
 * Hypernetwork — generates weights of a small target network conditioned on
 * a market-regime embedding.
 */
export interface HyperConfig {
  embeddingDim: number;
  targetInputDim: number;
  targetOutputDim: number;
}

export interface HyperWeights {
  W: number[][]; // [embeddingDim x (targetInputDim*targetOutputDim)]
  b: number[];
}

function rand(): number {
  return (Math.random() - 0.5) * 0.1;
}

export function initHyper(cfg: HyperConfig): HyperWeights {
  const outSize = cfg.targetInputDim * cfg.targetOutputDim;
  const W = Array.from({ length: cfg.embeddingDim }, () =>
    Array.from({ length: outSize }, rand),
  );
  const b = Array.from({ length: outSize }, rand);
  return { W, b };
}

export function generateTargetWeights(
  hyper: HyperWeights,
  embedding: number[],
  inDim: number,
  outDim: number,
): number[][] {
  const flat: number[] = hyper.b.map((bi, i) => {
    let s = bi;
    for (let e = 0; e < embedding.length; e++) s += embedding[e] * hyper.W[e][i];
    return s;
  });
  const W: number[][] = [];
  for (let i = 0; i < inDim; i++) {
    W.push(flat.slice(i * outDim, (i + 1) * outDim));
  }
  return W;
}