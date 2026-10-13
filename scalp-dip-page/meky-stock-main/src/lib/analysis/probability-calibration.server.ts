import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Reliability-style probability calibration.
 *
 * Computes Brier score + reliability diagram, then maps a raw confidence
 * (0-100) to a calibrated probability of profit using a monotonic
 * (isotonic-like) regression over historical buckets.
 *
 * Output is a TRUE probability ("60% means 6/10 picks profit historically"),
 * not a model self-belief score.
 */

export type ReliabilityMap = {
  pairs: Array<{ predicted: number; actual: number; n: number }>;
  brier: number;
  fitted: boolean;
  sampleSize: number;
};

const BUCKETS: Array<[number, number]> = [
  [30, 49], [50, 59], [60, 69], [70, 79], [80, 89], [90, 100],
];

export async function loadReliability(): Promise<ReliabilityMap> {
  const { data } = await supabaseAdmin
    .from("recommendations")
    .select("confidence, outcome, realized_pct")
    .in("outcome", ["target_hit", "stop_hit", "expired"])
    .in("signal", ["buy", "strong_buy"])
    .limit(3000);

  const rows = data ?? [];
  if (rows.length < 30) return { pairs: [], brier: 0, fitted: false, sampleSize: rows.length };

  let brierSum = 0;
  for (const r of rows) {
    const p = Number(r.confidence) / 100;
    const y = r.outcome === "target_hit" || (r.realized_pct != null && Number(r.realized_pct) > 0) ? 1 : 0;
    brierSum += (p - y) ** 2;
  }
  const brier = +(brierSum / rows.length).toFixed(4);

  // Bucketed predicted vs actual
  const rawPairs = BUCKETS.map(([lo, hi]) => {
    const subset = rows.filter((r) => r.confidence >= lo && r.confidence <= hi);
    const n = subset.length;
    const wins = subset.filter(
      (r) => r.outcome === "target_hit" || (r.realized_pct != null && Number(r.realized_pct) > 0),
    ).length;
    return { predicted: (lo + hi) / 2, actual: n > 0 ? +(wins / n).toFixed(3) : (lo + hi) / 200, n };
  });

  // Enforce monotonic non-decreasing actuals (pool-adjacent-violators, simple pass)
  const pairs = [...rawPairs];
  for (let i = 1; i < pairs.length; i++) {
    if (pairs[i].n > 0 && pairs[i].actual < pairs[i - 1].actual) {
      const totalN = pairs[i].n + pairs[i - 1].n;
      const pooled = (pairs[i].actual * pairs[i].n + pairs[i - 1].actual * pairs[i - 1].n) / totalN;
      pairs[i].actual = +pooled.toFixed(3);
      pairs[i - 1].actual = +pooled.toFixed(3);
    }
  }

  return { pairs, brier, fitted: true, sampleSize: rows.length };
}

/**
 * Map raw confidence (0-100) → true probability of profit (0-100).
 * Linear interpolation between the two nearest reliability points.
 */
export function calibrateProbability(raw: number, map: ReliabilityMap): number {
  if (!map.fitted || map.pairs.length < 2) return raw;
  const pts = map.pairs.filter((p) => p.n >= 3);
  if (pts.length < 2) return raw;

  if (raw <= pts[0].predicted) return Math.round(pts[0].actual * 100);
  if (raw >= pts[pts.length - 1].predicted) return Math.round(pts[pts.length - 1].actual * 100);

  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if (raw >= a.predicted && raw <= b.predicted) {
      const t = (raw - a.predicted) / (b.predicted - a.predicted || 1);
      const interp = a.actual + t * (b.actual - a.actual);
      return Math.round(interp * 100);
    }
  }
  return raw;
}
