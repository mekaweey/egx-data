import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Bayesian confidence calibration.
 * Looks at historical recommendations grouped by confidence bucket and
 * computes the actual realized win rate. Then maps the model's raw
 * confidence to a calibrated confidence that reflects reality.
 *
 * Example: model says 80% confidence, but in reality only 60% of 80%-confidence
 * picks turned out positive → we report 60% instead of 80%.
 */

export type CalibrationMap = {
  buckets: Array<{ min: number; max: number; n: number; winRate: number }>;
  fitted: boolean;
  sampleSize: number;
};

const BUCKETS: Array<[number, number]> = [
  [0, 49],
  [50, 59],
  [60, 69],
  [70, 79],
  [80, 89],
  [90, 100],
];

export async function loadCalibration(): Promise<CalibrationMap> {
  const { data } = await supabaseAdmin
    .from("recommendations")
    .select("confidence, outcome, realized_pct")
    .in("outcome", ["target_hit", "stop_hit", "expired"])
    .in("signal", ["buy", "strong_buy"])
    .limit(2000);

  const rows = data ?? [];
  const buckets = BUCKETS.map(([min, max]) => {
    const subset = rows.filter((r) => r.confidence >= min && r.confidence <= max);
    const wins = subset.filter(
      (r) => r.outcome === "target_hit" || (r.realized_pct != null && Number(r.realized_pct) > 0),
    ).length;
    const n = subset.length;
    const winRate = n > 0 ? wins / n : (min + max) / 2 / 100; // prior = bucket midpoint
    return { min, max, n, winRate };
  });

  return {
    buckets,
    fitted: rows.length >= 30,
    sampleSize: rows.length,
  };
}

/**
 * Calibrate a raw confidence value (0-100) using the historical map.
 * Uses Laplace smoothing (prior strength = 5) so sparse buckets don't swing wildly.
 */
export function calibrateConfidence(raw: number, map: CalibrationMap): number {
  if (!map.fitted) return raw;
  const bucket = map.buckets.find((b) => raw >= b.min && raw <= b.max);
  if (!bucket || bucket.n < 3) return raw;
  const prior = raw / 100;
  const k = 5;
  const smoothed = (bucket.winRate * bucket.n + prior * k) / (bucket.n + k);
  const calibrated = Math.round(smoothed * 100);
  // Don't let calibration push beyond ±15 from raw (gradual influence)
  return Math.max(raw - 15, Math.min(raw + 15, calibrated));
}