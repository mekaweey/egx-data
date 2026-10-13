import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type TargetCalibration = {
  // Multiplier applied to predicted targetPct so future predictions match reality.
  // Values > 1 → we were under-shooting (extend targets). < 1 → over-shooting.
  normal: number;
  momentum: number;
  explosive: number;
  sample_size: number;
  hit_rate: number; // overall target_hit / total
  computed_at: string;
};

const DEFAULT_CALIB: TargetCalibration = {
  normal: 1,
  momentum: 1,
  explosive: 1,
  sample_size: 0,
  hit_rate: 0,
  computed_at: new Date(0).toISOString(),
};

function tierOf(predicted: number): "normal" | "momentum" | "explosive" {
  if (predicted >= 5) return "explosive";
  if (predicted >= 2.5) return "momentum";
  return "normal";
}

/**
 * Compares predicted target % vs realized % across last 30 days of closed
 * recommendations and learns a per-tier multiplier so future targets become
 * more accurate automatically.
 */
export async function runSelfCalibration(): Promise<TargetCalibration> {
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("recommendations")
    .select("expected_gain_pct, realized_pct, outcome")
    .gte("created_at", since)
    .not("realized_pct", "is", null)
    .in("signal", ["buy", "strong_buy"])
    .in("outcome", ["target_hit", "stop_hit", "expired"]);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Array<{
    expected_gain_pct: number | null;
    realized_pct: number | null;
    outcome: string | null;
  }>;

  type Acc = { sumPred: number; sumReal: number; n: number };
  const buckets: Record<"normal" | "momentum" | "explosive", Acc> = {
    normal: { sumPred: 0, sumReal: 0, n: 0 },
    momentum: { sumPred: 0, sumReal: 0, n: 0 },
    explosive: { sumPred: 0, sumReal: 0, n: 0 },
  };
  let hits = 0;
  for (const r of rows) {
    const pred = Math.abs(Number(r.expected_gain_pct ?? 0));
    const real = Number(r.realized_pct ?? 0);
    if (pred <= 0) continue;
    if (r.outcome === "target_hit") hits++;
    const b = buckets[tierOf(pred)];
    b.sumPred += pred;
    b.sumReal += Math.max(0, real); // ignore losses for target sizing
    b.n += 1;
  }

  const clamp = (x: number) => Math.max(0.6, Math.min(1.8, x || 1));
  const calib: TargetCalibration = {
    normal:
      buckets.normal.n >= 10
        ? clamp(buckets.normal.sumReal / Math.max(0.01, buckets.normal.sumPred))
        : 1,
    momentum:
      buckets.momentum.n >= 10
        ? clamp(buckets.momentum.sumReal / Math.max(0.01, buckets.momentum.sumPred))
        : 1,
    explosive:
      buckets.explosive.n >= 5
        ? clamp(buckets.explosive.sumReal / Math.max(0.01, buckets.explosive.sumPred))
        : 1,
    sample_size: rows.length,
    hit_rate: rows.length > 0 ? hits / rows.length : 0,
    computed_at: new Date().toISOString(),
  };

  await supabaseAdmin.from("model_state").upsert({
    key: "target_calibration",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: calib as any,
    updated_at: new Date().toISOString(),
  });

  return calib;
}

export async function loadTargetCalibration(): Promise<TargetCalibration> {
  try {
    const { data } = await supabaseAdmin
      .from("model_state")
      .select("data")
      .eq("key", "target_calibration")
      .maybeSingle();
    if (!data?.data) return DEFAULT_CALIB;
    return { ...DEFAULT_CALIB, ...(data.data as Partial<TargetCalibration>) };
  } catch {
    return DEFAULT_CALIB;
  }
}