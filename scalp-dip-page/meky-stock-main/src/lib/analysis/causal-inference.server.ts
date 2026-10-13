/**
 * #9 Causal Inference: يفرق بين correlation و causation عبر Granger-like test مبسط.
 * H0: تغيرات X لا تتنبأ بتغيرات Y. لو error(Y|X,Y_lag) << error(Y|Y_lag) => X يسبب Y.
 */
export interface CausalResult { causal: boolean; strength: number; pValue: number }

function variance(arr: number[]): number {
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length;
}

export function grangerCausality(x: number[], y: number[], lag = 3): CausalResult {
  if (x.length !== y.length || x.length < lag + 5) return { causal: false, strength: 0, pValue: 1 };
  const yReturns = y.slice(1).map((v, i) => v - y[i]);
  const baseVar = variance(yReturns.slice(lag));
  let restrictedErr = 0;
  for (let i = lag; i < yReturns.length; i++) {
    const pred = yReturns.slice(i - lag, i).reduce((a, b) => a + b, 0) / lag;
    restrictedErr += (yReturns[i] - pred) ** 2;
  }
  let unrestrictedErr = 0;
  const xReturns = x.slice(1).map((v, i) => v - x[i]);
  for (let i = lag; i < yReturns.length; i++) {
    const yPred = yReturns.slice(i - lag, i).reduce((a, b) => a + b, 0) / lag;
    const xPred = xReturns.slice(i - lag, i).reduce((a, b) => a + b, 0) / lag;
    unrestrictedErr += (yReturns[i] - (yPred * 0.5 + xPred * 0.5)) ** 2;
  }
  const strength = Math.max(0, (restrictedErr - unrestrictedErr) / Math.max(restrictedErr, 0.0001));
  const pValue = Math.exp(-strength * 10);
  return { causal: pValue < 0.05 && strength > 0.1, strength, pValue };
}