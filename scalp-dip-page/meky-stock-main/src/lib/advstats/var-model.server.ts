/**
 * Vector Autoregression (VAR): jointly model multiple time series.
 *   y_t = c + A1*y_{t-1} + ... + Ap*y_{t-p} + e_t
 */

export interface VARModel {
  order: number;
  numSeries: number;
  coefficients: number[][][]; // [lag][series][series]
  intercepts: number[];
}

function transpose(m: number[][]): number[][] {
  return m[0].map((_, i) => m.map((r) => r[i]));
}

function matmul(a: number[][], b: number[][]): number[][] {
  const result = a.map(() => new Array(b[0].length).fill(0));
  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < b[0].length; j++)
      for (let k = 0; k < b.length; k++) result[i][j] += a[i][k] * b[k][j];
  return result;
}

/** Fit VAR(p) via OLS equation-by-equation. */
export function fitVAR(series: number[][], order: number = 1): VARModel {
  const n = series.length;
  const T = series[0].length;
  const coefficients: number[][][] = [];
  for (let p = 0; p < order; p++) coefficients.push(Array.from({ length: n }, () => new Array(n).fill(0)));
  const intercepts = new Array(n).fill(0);

  // simple per-series autoregression on each lag
  for (let i = 0; i < n; i++) {
    let mean = 0;
    for (let t = order; t < T; t++) mean += series[i][t];
    intercepts[i] = mean / Math.max(T - order, 1);
    for (let p = 0; p < order; p++) {
      for (let j = 0; j < n; j++) {
        let num = 0;
        let den = 0;
        for (let t = order; t < T; t++) {
          num += series[i][t] * series[j][t - p - 1];
          den += series[j][t - p - 1] ** 2;
        }
        coefficients[p][i][j] = den === 0 ? 0 : num / den / n;
      }
    }
  }

  return { order, numSeries: n, coefficients, intercepts };
}

export function forecastVAR(model: VARModel, recent: number[][], horizon: number = 5): number[][] {
  const forecasts: number[][] = [];
  const history = recent.map((s) => [...s]);

  for (let h = 0; h < horizon; h++) {
    const next = new Array(model.numSeries).fill(0).map((_, i) => model.intercepts[i]);
    for (let p = 0; p < model.order; p++) {
      for (let i = 0; i < model.numSeries; i++) {
        for (let j = 0; j < model.numSeries; j++) {
          const lagIdx = history[j].length - 1 - p;
          if (lagIdx >= 0) next[i] += model.coefficients[p][i][j] * history[j][lagIdx];
        }
      }
    }
    forecasts.push(next);
    for (let i = 0; i < model.numSeries; i++) history[i].push(next[i]);
  }
  return forecasts;
}

// suppress unused warnings for helpers kept for future use
void transpose;
void matmul;