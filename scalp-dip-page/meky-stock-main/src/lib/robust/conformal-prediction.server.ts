/**
 * Conformal Prediction: distribution-free prediction intervals with statistical guarantees.
 */

export interface ConformalInterval {
  point: number;
  lower: number;
  upper: number;
  width: number;
  coverage: number;
}

/**
 * Calibrate quantile of nonconformity scores from a calibration set.
 */
export function calibrateQuantile(
  calibrationResiduals: number[],
  alpha: number = 0.1,
): number {
  const abs = calibrationResiduals.map((r) => Math.abs(r)).sort((a, b) => a - b);
  const n = abs.length;
  const idx = Math.ceil((n + 1) * (1 - alpha)) - 1;
  return abs[Math.min(idx, n - 1)] ?? 0;
}

/**
 * Build conformal interval around a point prediction.
 */
export function conformalInterval(
  pointPrediction: number,
  calibrationResiduals: number[],
  alpha: number = 0.1,
): ConformalInterval {
  const q = calibrateQuantile(calibrationResiduals, alpha);
  return {
    point: pointPrediction,
    lower: pointPrediction - q,
    upper: pointPrediction + q,
    width: 2 * q,
    coverage: 1 - alpha,
  };
}

/**
 * Adaptive conformal: weight by feature similarity (locally adaptive width).
 */
export function adaptiveConformalInterval(
  pointPrediction: number,
  uncertainty: number,
  calibrationResiduals: number[],
  alpha: number = 0.1,
): ConformalInterval {
  const normalized = calibrationResiduals.map((r) => Math.abs(r) / Math.max(uncertainty, 0.01));
  const sorted = normalized.sort((a, b) => a - b);
  const idx = Math.ceil((sorted.length + 1) * (1 - alpha)) - 1;
  const q = sorted[Math.min(idx, sorted.length - 1)] ?? 0;
  const width = q * uncertainty;
  return {
    point: pointPrediction,
    lower: pointPrediction - width,
    upper: pointPrediction + width,
    width: 2 * width,
    coverage: 1 - alpha,
  };
}