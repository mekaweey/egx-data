/**
 * VIX Term Structure: analyze volatility curve to infer market expectations.
 */

export interface VIXTermPoint {
  daysToExpiry: number;
  impliedVol: number;
}

export interface VIXTermSignal {
  state: "contango" | "backwardation" | "flat";
  slope: number;
  curvature: number;
  signal: "risk_on" | "risk_off" | "neutral";
  stressLevel: number;
}

export function analyzeVIXTerm(curve: VIXTermPoint[]): VIXTermSignal {
  if (curve.length < 2) {
    return { state: "flat", slope: 0, curvature: 0, signal: "neutral", stressLevel: 0 };
  }
  const sorted = [...curve].sort((a, b) => a.daysToExpiry - b.daysToExpiry);
  const front = sorted[0];
  const back = sorted[sorted.length - 1];
  const slope = (back.impliedVol - front.impliedVol) / (back.daysToExpiry - front.daysToExpiry);

  let curvature = 0;
  if (sorted.length >= 3) {
    const mid = sorted[Math.floor(sorted.length / 2)];
    const linear = front.impliedVol + slope * (mid.daysToExpiry - front.daysToExpiry);
    curvature = mid.impliedVol - linear;
  }

  let state: VIXTermSignal["state"] = "flat";
  if (slope > 0.01) state = "contango";
  else if (slope < -0.01) state = "backwardation";

  // Contango = normal market (risk-on); Backwardation = stress (risk-off)
  const signal: VIXTermSignal["signal"] =
    state === "contango" ? "risk_on" : state === "backwardation" ? "risk_off" : "neutral";

  const stressLevel = Math.max(0, Math.min(1, (front.impliedVol - 15) / 35));

  return { state, slope, curvature, signal, stressLevel };
}