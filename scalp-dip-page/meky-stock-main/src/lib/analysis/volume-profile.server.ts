// Volume Profile / VWAP-based support & resistance
export type VolumeProfileLevels = {
  poc: number;       // Point of Control - highest volume price
  vah: number;       // Value Area High
  val: number;       // Value Area Low
  vwap: number;
  isAtSupport: boolean;
  isAtResistance: boolean;
  confidenceDelta: number;
};

export function calculateVolumeProfile(
  highs: number[], lows: number[], closes: number[], volumes: number[],
  bins = 20
): VolumeProfileLevels | null {
  const n = closes.length;
  if (n < 20) return null;
  const lookback = Math.min(60, n);
  const h = highs.slice(-lookback), l = lows.slice(-lookback), c = closes.slice(-lookback), v = volumes.slice(-lookback);
  const maxP = Math.max(...h), minP = Math.min(...l);
  const binSize = (maxP - minP) / bins;
  if (binSize <= 0) return null;
  const volByBin = new Array(bins).fill(0);
  for (let i = 0; i < c.length; i++) {
    const bin = Math.min(bins - 1, Math.floor((c[i] - minP) / binSize));
    volByBin[bin] += v[i];
  }
  const pocBin = volByBin.indexOf(Math.max(...volByBin));
  const poc = minP + (pocBin + 0.5) * binSize;
  // Value area: 70% of volume around POC
  const totalVol = volByBin.reduce((s, x) => s + x, 0);
  let vaVol = volByBin[pocBin], vaLow = pocBin, vaHigh = pocBin;
  while (vaVol < totalVol * 0.7 && (vaLow > 0 || vaHigh < bins - 1)) {
    const down = vaLow > 0 ? volByBin[vaLow - 1] : 0;
    const up = vaHigh < bins - 1 ? volByBin[vaHigh + 1] : 0;
    if (down >= up && vaLow > 0) { vaLow--; vaVol += down; }
    else if (vaHigh < bins - 1) { vaHigh++; vaVol += up; }
    else break;
  }
  const val = minP + vaLow * binSize;
  const vah = minP + (vaHigh + 1) * binSize;
  const vwap = c.reduce((s, x, i) => s + x * v[i], 0) / v.reduce((s, x) => s + x, 0);
  const current = c[c.length - 1];
  const atSupport = current <= val * 1.02 && current >= val * 0.98;
  const atResistance = current <= vah * 1.02 && current >= vah * 0.98;
  let delta = 0;
  if (atSupport) delta += 5;
  if (atResistance) delta -= 5;
  if (current > vwap) delta += 2; else delta -= 2;
  return { poc: +poc.toFixed(2), vah: +vah.toFixed(2), val: +val.toFixed(2), vwap: +vwap.toFixed(2), isAtSupport: atSupport, isAtResistance: atResistance, confidenceDelta: delta };
}
