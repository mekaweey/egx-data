/**
 * Shipping / trade data: proxy for economic activity (Baltic Dry Index style).
 */

export interface ShippingDataPoint {
  date: string;
  bdi: number; // Baltic Dry Index
  containerVolume: number; // TEU
  portCongestion: number; // days
  oilTankerRates: number;
}

export interface ShippingSignal {
  globalTradeMomentum: number;
  congestionStress: "high" | "moderate" | "low";
  signal: "global_expansion" | "stable" | "contraction";
  inflationPressure: number; // 0-1
}

export function analyzeShipping(series: ShippingDataPoint[]): ShippingSignal {
  if (series.length < 30) {
    return { globalTradeMomentum: 0, congestionStress: "low", signal: "stable", inflationPressure: 0 };
  }

  const recent = series.slice(-7);
  const older = series.slice(-30, -7);

  const recentBDI = recent.reduce((s, p) => s + p.bdi, 0) / recent.length;
  const olderBDI = older.reduce((s, p) => s + p.bdi, 0) / older.length;
  const bdiGrowth = olderBDI === 0 ? 0 : (recentBDI - olderBDI) / olderBDI;

  const recentVol = recent.reduce((s, p) => s + p.containerVolume, 0) / recent.length;
  const olderVol = older.reduce((s, p) => s + p.containerVolume, 0) / older.length;
  const volGrowth = olderVol === 0 ? 0 : (recentVol - olderVol) / olderVol;

  const avgCongestion = recent.reduce((s, p) => s + p.portCongestion, 0) / recent.length;
  const congestionStress: ShippingSignal["congestionStress"] =
    avgCongestion > 7 ? "high" : avgCongestion > 3 ? "moderate" : "low";

  const momentum = (bdiGrowth + volGrowth) / 2;
  let signal: ShippingSignal["signal"] = "stable";
  if (momentum > 0.1) signal = "global_expansion";
  else if (momentum < -0.1) signal = "contraction";

  // Congestion + high BDI = inflation pressure
  const inflationPressure = Math.min(1, Math.max(0, (avgCongestion / 14) * 0.5 + Math.max(bdiGrowth, 0) * 0.5));

  return { globalTradeMomentum: momentum, congestionStress, signal, inflationPressure };
}