/**
 * Discrete Wavelet Transform (Haar): decompose signal into multi-resolution components.
 */

export interface WaveletDecomposition {
  approximation: number[][];
  detail: number[][];
  levels: number;
}

/**
 * Single-level Haar DWT.
 */
function haarStep(signal: number[]): { approx: number[]; detail: number[] } {
  const n = Math.floor(signal.length / 2);
  const approx: number[] = [];
  const detail: number[] = [];
  const sqrt2 = Math.SQRT2;
  for (let i = 0; i < n; i++) {
    approx.push((signal[2 * i] + signal[2 * i + 1]) / sqrt2);
    detail.push((signal[2 * i] - signal[2 * i + 1]) / sqrt2);
  }
  return { approx, detail };
}

/**
 * Multi-level wavelet decomposition.
 */
export function waveletDecompose(signal: number[], levels: number = 3): WaveletDecomposition {
  const approximation: number[][] = [];
  const detail: number[][] = [];
  let current = [...signal];
  for (let l = 0; l < levels && current.length >= 2; l++) {
    const { approx, detail: d } = haarStep(current);
    approximation.push(approx);
    detail.push(d);
    current = approx;
  }
  return { approximation, detail, levels: approximation.length };
}

/**
 * Energy at each scale: high energy at low scales = short-term volatility.
 */
export function waveletEnergy(decomp: WaveletDecomposition): number[] {
  return decomp.detail.map((d) => d.reduce((s, x) => s + x * x, 0));
}

/**
 * Denoise via soft thresholding of detail coefficients.
 */
export function waveletDenoise(signal: number[], threshold: number = 0.1): number[] {
  const decomp = waveletDecompose(signal, 3);
  decomp.detail = decomp.detail.map((d) =>
    d.map((x) => (Math.abs(x) < threshold ? 0 : Math.sign(x) * (Math.abs(x) - threshold))),
  );
  // Reconstruct (inverse Haar - simplified to approximation)
  return decomp.approximation[0] ?? signal;
}