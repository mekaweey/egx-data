/**
 * Mixture Density Network — distribution over future returns.
 */
export interface MixtureComponent {
  pi: number;
  mu: number;
  sigma: number;
}

function softmax(xs: number[]): number[] {
  const m = Math.max(...xs);
  const exps = xs.map((x) => Math.exp(x - m));
  const s = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / s);
}

export function buildMixture(rawPi: number[], mus: number[], sigmas: number[]): MixtureComponent[] {
  const pis = softmax(rawPi);
  return pis.map((pi, i) => ({ pi, mu: mus[i], sigma: Math.max(1e-4, sigmas[i]) }));
}

export function pdf(comps: MixtureComponent[], x: number): number {
  return comps.reduce((s, c) => {
    const z = (x - c.mu) / c.sigma;
    return s + c.pi * (Math.exp(-0.5 * z * z) / (c.sigma * Math.sqrt(2 * Math.PI)));
  }, 0);
}

export function expectedValue(comps: MixtureComponent[]): number {
  return comps.reduce((s, c) => s + c.pi * c.mu, 0);
}

export function variance(comps: MixtureComponent[]): number {
  const ev = expectedValue(comps);
  return comps.reduce((s, c) => s + c.pi * (c.sigma * c.sigma + (c.mu - ev) ** 2), 0);
}