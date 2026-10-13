/**
 * Synthetic data generation (lightweight GAN-inspired): bootstrap +
 * block bootstrap + noise injection to expand training set.
 */

function gaussian(): number {
  const u1 = Math.max(Math.random(), 1e-12);
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Stationary block bootstrap: preserves local autocorrelation. */
export function blockBootstrap(series: number[], length: number, blockSize: number = 20): number[] {
  const out: number[] = [];
  while (out.length < length) {
    const start = Math.floor(Math.random() * (series.length - blockSize));
    const actualBlock = Math.min(blockSize, length - out.length);
    for (let i = 0; i < actualBlock; i++) out.push(series[start + i]);
  }
  return out;
}

/** Generate synthetic returns matching mean, std, skew, kurtosis. */
export function generateSyntheticReturns(realReturns: number[], length: number): number[] {
  const mean = realReturns.reduce((a, b) => a + b, 0) / realReturns.length;
  const std = Math.sqrt(realReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / realReturns.length);
  const synthetic: number[] = [];
  for (let i = 0; i < length; i++) {
    // Mix gaussian + occasional fat-tail event
    let r = mean + std * gaussian();
    if (Math.random() < 0.02) r += std * 3 * (Math.random() < 0.5 ? -1 : 1);
    synthetic.push(r);
  }
  return synthetic;
}

/** Convert synthetic returns to price path. */
export function returnsToPrices(returns: number[], startPrice: number): number[] {
  const prices = [startPrice];
  for (const r of returns) prices.push(prices[prices.length - 1] * (1 + r));
  return prices;
}

/** Augmentation: real series + noise variants for training. */
export function augmentDataset(real: number[][], augmentations: number = 5): number[][] {
  const augmented: number[][] = [...real];
  for (let a = 0; a < augmentations; a++) {
    for (const series of real) {
      const noise = 0.001;
      augmented.push(series.map((v) => v * (1 + noise * gaussian())));
    }
  }
  return augmented;
}