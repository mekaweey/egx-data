/**
 * Web traffic & app downloads momentum — early indicator of revenue growth.
 */
export interface TrafficSnapshot {
  date: string;
  visits: number;
  uniqueVisitors: number;
  appDownloads?: number;
}

export interface TrafficMomentum {
  visitsMoM: number;
  visitorsMoM: number;
  downloadsMoM: number;
  zScore: number;
}

export function computeMomentum(snaps: TrafficSnapshot[]): TrafficMomentum {
  if (snaps.length < 2) return { visitsMoM: 0, visitorsMoM: 0, downloadsMoM: 0, zScore: 0 };
  const sorted = [...snaps].sort((a, b) => a.date.localeCompare(b.date));
  const last = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const pct = (a: number, b: number) => (b === 0 ? 0 : (a - b) / b);
  const visitsSeries = sorted.map((s) => s.visits);
  const mean = visitsSeries.reduce((s, v) => s + v, 0) / visitsSeries.length;
  const std =
    Math.sqrt(visitsSeries.reduce((s, v) => s + (v - mean) ** 2, 0) / visitsSeries.length) || 1;
  return {
    visitsMoM: pct(last.visits, prev.visits),
    visitorsMoM: pct(last.uniqueVisitors, prev.uniqueVisitors),
    downloadsMoM: pct(last.appDownloads ?? 0, prev.appDownloads ?? 0),
    zScore: (last.visits - mean) / std,
  };
}