/**
 * Platt scaling for confidence calibration.
 * --------------------------------------------------------------------------
 * Online logistic regression that maps raw `adjustedConfidence` (0–100) to
 * a calibrated probability. Trained incrementally from closed trade
 * outcomes (1 = profitable, 0 = loss). When 80% confidence really means
 * 80% hit rate, position sizing and trust both improve.
 */

interface PlattState {
  a: number; // slope
  b: number; // intercept
  n: number;
}

const state: PlattState = { a: 0.05, b: -2.5, n: 0 };
const LR = 0.01;

function sigmoid(z: number): number {
  if (z >= 0) {
    const e = Math.exp(-z);
    return 1 / (1 + e);
  }
  const e = Math.exp(z);
  return e / (1 + e);
}

/** Map raw 0-100 confidence to calibrated probability in [0, 1]. */
export function calibrate(rawConfidence: number): number {
  return sigmoid(state.a * rawConfidence + state.b);
}

/** Update with a closed trade. `rawConfidence` 0-100, `won` boolean. */
export function updateCalibration(rawConfidence: number, won: boolean) {
  const y = won ? 1 : 0;
  const p = calibrate(rawConfidence);
  const grad = p - y;
  state.a -= LR * grad * rawConfidence;
  state.b -= LR * grad;
  state.n++;
}

export function calibrationState() {
  return { ...state };
}

/** Convenience: convert calibrated probability back to a 0-100 display. */
export function calibratedConfidence(rawConfidence: number): number {
  // Only trust calibration after enough samples.
  if (state.n < 30) return rawConfidence;
  const p = calibrate(rawConfidence);
  // Blend 70% calibrated, 30% raw to avoid overshooting on small samples.
  const blended = 0.7 * p * 100 + 0.3 * rawConfidence;
  return Math.max(0, Math.min(100, blended));
}