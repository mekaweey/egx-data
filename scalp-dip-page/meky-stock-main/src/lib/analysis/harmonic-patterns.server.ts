// Harmonic patterns: Gartley, Butterfly, Bat, Crab
export type HarmonicPattern = {
  name: 'gartley' | 'butterfly' | 'bat' | 'crab' | null;
  bullish: boolean;
  prz: number; // potential reversal zone
  confidenceDelta: number;
};

const ratio = (a: number, b: number) => Math.abs(a / b);
const inRange = (v: number, target: number, tol = 0.08) => Math.abs(v - target) <= tol;

export function detectHarmonic(swings: { price: number; isHigh: boolean }[]): HarmonicPattern {
  if (swings.length < 5) return { name: null, bullish: false, prz: 0, confidenceDelta: 0 };
  const [X, A, B, C, D] = swings.slice(-5);
  const XA = A.price - X.price;
  const AB = B.price - A.price;
  const BC = C.price - B.price;
  const CD = D.price - C.price;
  const XD = D.price - X.price;
  const abXa = ratio(AB, XA);
  const bcAb = ratio(BC, AB);
  const cdBc = ratio(CD, BC);
  const adXa = ratio(XD, XA);
  const bullish = X.isHigh === false;
  // Gartley
  if (inRange(abXa, 0.618) && inRange(bcAb, 0.5, 0.3) && inRange(cdBc, 1.27, 0.4) && inRange(adXa, 0.786))
    return { name: 'gartley', bullish, prz: D.price, confidenceDelta: bullish ? 7 : -7 };
  // Butterfly
  if (inRange(abXa, 0.786) && inRange(bcAb, 0.5, 0.4) && inRange(cdBc, 1.618, 0.4) && inRange(adXa, 1.27, 0.2))
    return { name: 'butterfly', bullish, prz: D.price, confidenceDelta: bullish ? 8 : -8 };
  // Bat
  if (inRange(abXa, 0.5, 0.15) && inRange(bcAb, 0.5, 0.4) && inRange(cdBc, 1.618, 0.5) && inRange(adXa, 0.886))
    return { name: 'bat', bullish, prz: D.price, confidenceDelta: bullish ? 7 : -7 };
  // Crab
  if (inRange(abXa, 0.382, 0.2) && inRange(bcAb, 0.5, 0.4) && inRange(cdBc, 2.618, 0.6) && inRange(adXa, 1.618, 0.3))
    return { name: 'crab', bullish, prz: D.price, confidenceDelta: bullish ? 9 : -9 };
  return { name: null, bullish: false, prz: 0, confidenceDelta: 0 };
}
