/**
 * Diffusion-style price path generator (simplified DDPM).
 */
function randn(): number {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export interface DiffusionConfig {
  steps: number;
  horizon: number;
  drift: number;
  vol: number;
}

export function generatePaths(startPrice: number, config: DiffusionConfig, numPaths: number = 50): number[][] {
  const paths: number[][] = [];
  for (let p = 0; p < numPaths; p++) {
    const path = [startPrice];
    for (let t = 1; t <= config.horizon; t++) {
      const noise = randn() * config.vol;
      const denoised = path[t - 1] * (1 + config.drift) + noise * path[t - 1];
      path.push(Math.max(0.01, denoised));
    }
    paths.push(path);
  }
  return paths;
}

export function pathStats(paths: number[][]) {
  const T = paths[0]?.length ?? 0;
  const mean: number[] = [];
  const p10: number[] = [];
  const p90: number[] = [];
  for (let t = 0; t < T; t++) {
    const col = paths.map((p) => p[t]).sort((a, b) => a - b);
    mean.push(col.reduce((s, v) => s + v, 0) / col.length);
    p10.push(col[Math.floor(col.length * 0.1)]);
    p90.push(col[Math.floor(col.length * 0.9)]);
  }
  return { mean, p10, p90 };
}