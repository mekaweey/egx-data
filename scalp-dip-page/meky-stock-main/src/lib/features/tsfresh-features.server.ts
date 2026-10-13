/**
 * tsfresh-style time series features (700+ inspired, subset implemented).
 */

function mean(x: number[]): number {
  return x.reduce((a, b) => a + b, 0) / Math.max(x.length, 1);
}
function std(x: number[]): number {
  const m = mean(x);
  return Math.sqrt(x.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(x.length, 1));
}

/** Discrete cosine transform — proxy for FFT magnitude features. */
function dctCoefficients(x: number[], k: number = 5): number[] {
  const n = x.length;
  const result: number[] = [];
  for (let i = 0; i < k; i++) {
    let sum = 0;
    for (let t = 0; t < n; t++) sum += x[t] * Math.cos((Math.PI * i * (t + 0.5)) / n);
    result.push(sum);
  }
  return result;
}

function autocorrelation(x: number[], lag: number): number {
  if (x.length <= lag) return 0;
  const m = mean(x);
  let num = 0;
  let den = 0;
  for (let i = 0; i < x.length - lag; i++) num += (x[i] - m) * (x[i + lag] - m);
  for (let i = 0; i < x.length; i++) den += (x[i] - m) ** 2;
  return den === 0 ? 0 : num / den;
}

function numberPeaks(x: number[], support: number = 1): number {
  let count = 0;
  for (let i = support; i < x.length - support; i++) {
    let isPeak = true;
    for (let j = 1; j <= support; j++) {
      if (x[i] <= x[i - j] || x[i] <= x[i + j]) {
        isPeak = false;
        break;
      }
    }
    if (isPeak) count++;
  }
  return count;
}

function longestStrike(x: number[], aboveMean: boolean): number {
  const m = mean(x);
  let longest = 0;
  let current = 0;
  for (const v of x) {
    if ((aboveMean && v > m) || (!aboveMean && v < m)) current++;
    else {
      longest = Math.max(longest, current);
      current = 0;
    }
  }
  return Math.max(longest, current);
}

export function tsfreshFeatures(x: number[]): Record<string, number> {
  if (x.length < 5) return {};
  const m = mean(x);
  const s = std(x);
  const sorted = [...x].sort((a, b) => a - b);
  const f: Record<string, number> = {
    mean: m,
    std: s,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: sorted[Math.floor(sorted.length / 2)],
    sum: x.reduce((a, b) => a + b, 0),
    abs_sum: x.reduce((a, b) => a + Math.abs(b), 0),
    abs_energy: x.reduce((a, b) => a + b * b, 0),
    cv: s / Math.max(Math.abs(m), 1e-9),
    range: sorted[sorted.length - 1] - sorted[0],
    above_mean: x.filter((v) => v > m).length / x.length,
    below_mean: x.filter((v) => v < m).length / x.length,
    zero_crossings: x.slice(1).filter((v, i) => (v - m) * (x[i] - m) < 0).length,
    longest_above_mean: longestStrike(x, true),
    longest_below_mean: longestStrike(x, false),
    num_peaks: numberPeaks(x, 1),
    num_peaks_3: numberPeaks(x, 3),
    first_loc_max: x.indexOf(sorted[sorted.length - 1]) / x.length,
    first_loc_min: x.indexOf(sorted[0]) / x.length,
  };

  for (const lag of [1, 2, 5, 10, 20]) f[`autocorr_${lag}`] = autocorrelation(x, lag);
  const dct = dctCoefficients(x, 5);
  dct.forEach((c, i) => (f[`dct_${i}`] = c));

  return f;
}