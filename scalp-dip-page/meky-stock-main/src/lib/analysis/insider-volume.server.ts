// Detect unusual volume that may indicate smart money / insider activity
export type InsiderSignal = {
  unusualVolume: boolean;
  volumeRatio: number;
  daysAccumulating: number;
  signalStrength: 'none' | 'weak' | 'moderate' | 'strong';
  confidenceDelta: number;
};

export function detectInsiderActivity(volumes: number[], closes: number[]): InsiderSignal {
  if (volumes.length < 25) return { unusualVolume: false, volumeRatio: 1, daysAccumulating: 0, signalStrength: 'none', confidenceDelta: 0 };
  const recent5 = volumes.slice(-5);
  const baseline20 = volumes.slice(-25, -5);
  const avgRecent = recent5.reduce((s, x) => s + x, 0) / 5;
  const avgBaseline = baseline20.reduce((s, x) => s + x, 0) / 20;
  const ratio = avgBaseline > 0 ? avgRecent / avgBaseline : 1;
  let daysAccumulating = 0;
  for (let i = volumes.length - 1; i >= Math.max(0, volumes.length - 10); i--) {
    if (volumes[i] > avgBaseline * 1.3 && closes[i] >= closes[i - 1]) daysAccumulating++;
    else break;
  }
  let strength: InsiderSignal['signalStrength'] = 'none';
  let delta = 0;
  if (ratio >= 3) { strength = 'strong'; delta = 7; }
  else if (ratio >= 2) { strength = 'moderate'; delta = 5; }
  else if (ratio >= 1.5) { strength = 'weak'; delta = 2; }
  if (daysAccumulating >= 3) delta += 3;
  return {
    unusualVolume: ratio >= 1.5,
    volumeRatio: +ratio.toFixed(2),
    daysAccumulating,
    signalStrength: strength,
    confidenceDelta: delta
  };
}
