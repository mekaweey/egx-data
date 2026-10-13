/**
 * MCMC (Metropolis-Hastings) for Bayesian inference of model parameters.
 */

export interface MCMCResult {
  samples: number[][];
  acceptanceRate: number;
  mean: number[];
  std: number[];
}

export function metropolisHastings(
  logPosterior: (params: number[]) => number,
  initial: number[],
  opts: { iterations?: number; stepSize?: number; burnIn?: number } = {},
): MCMCResult {
  const iterations = opts.iterations ?? 2000;
  const stepSize = opts.stepSize ?? 0.1;
  const burnIn = opts.burnIn ?? Math.floor(iterations / 4);

  let current = [...initial];
  let currentLP = logPosterior(current);
  const samples: number[][] = [];
  let accepts = 0;

  for (let i = 0; i < iterations; i++) {
    const proposal = current.map((c) => c + (Math.random() - 0.5) * 2 * stepSize);
    const propLP = logPosterior(proposal);
    const accept = Math.log(Math.random()) < propLP - currentLP;
    if (accept) {
      current = proposal;
      currentLP = propLP;
      accepts++;
    }
    if (i >= burnIn) samples.push([...current]);
  }

  const dim = initial.length;
  const mean = new Array(dim).fill(0);
  for (const s of samples) for (let d = 0; d < dim; d++) mean[d] += s[d] / samples.length;
  const std = new Array(dim).fill(0);
  for (const s of samples) for (let d = 0; d < dim; d++) std[d] += (s[d] - mean[d]) ** 2 / samples.length;
  for (let d = 0; d < dim; d++) std[d] = Math.sqrt(std[d]);

  return { samples, acceptanceRate: accepts / iterations, mean, std };
}