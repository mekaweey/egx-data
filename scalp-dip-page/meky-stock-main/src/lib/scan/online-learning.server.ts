import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

type Json = Database["public"]["Tables"]["signal_failures"]["Row"]["rule_json"];

/**
 * Online (incremental) learning — nudges the calibration map after every
 * closed recommendation. Unlike the weekly batch learner, this runs after
 * each outcome update so the model adapts continuously.
 *
 * Stored in `signal_failures` as a special pattern row: `__online_calibration__`
 * with a rule_json blob = { bucket: number, n: number, wins: number }[]
 */

const KEY = "__online_calibration__";

type Bucket = { min: number; max: number; n: number; wins: number };
const DEFAULT_BUCKETS: Bucket[] = [
  { min: 0, max: 49, n: 0, wins: 0 },
  { min: 50, max: 59, n: 0, wins: 0 },
  { min: 60, max: 69, n: 0, wins: 0 },
  { min: 70, max: 79, n: 0, wins: 0 },
  { min: 80, max: 89, n: 0, wins: 0 },
  { min: 90, max: 100, n: 0, wins: 0 },
];

function cloneBuckets() {
  return DEFAULT_BUCKETS.map((b) => ({ ...b }));
}

export async function nudgeCalibration(confidence: number, won: boolean) {
  const { data } = await supabaseAdmin
    .from("signal_failures")
    .select("id, rule_json, total_count, win_count, win_rate")
    .eq("pattern_name", KEY)
    .maybeSingle();

  const savedBuckets = (data?.rule_json as { buckets?: Bucket[] } | null)?.buckets;
  const buckets: Bucket[] = Array.isArray(savedBuckets)
    ? savedBuckets.map((b) => ({ ...b, n: Number(b.n ?? 0), wins: Number(b.wins ?? 0) }))
    : cloneBuckets();

  const b = buckets.find((x) => confidence >= x.min && confidence <= x.max);
  if (b) {
    b.n += 1;
    if (won) b.wins += 1;
  }

  const total = buckets.reduce((s, x) => s + x.n, 0);
  const wins = buckets.reduce((s, x) => s + x.wins, 0);
  if (data?.id) {
    await supabaseAdmin.from("signal_failures").update({
      rule_json: { buckets } as unknown as Json,
      total_count: total,
      win_count: wins,
      failure_count: total - wins,
      last_updated: new Date().toISOString(),
    }).eq("id", data.id);
  } else {
    await supabaseAdmin.from("signal_failures").insert({
      pattern_name: KEY,
      description_ar: "تعلّم تدريجي للمعايرة بعد كل توصية مغلقة",
      rule_json: { buckets } as unknown as Json,
      total_count: total,
      win_count: wins,
      failure_count: total - wins,
      is_active: false, // not used as a hard rule
    });
  }
}

/**
 * Bootstrap the online calibration row from closed recommendations + backtest
 * trades. Useful when the system is fresh and the row doesn't exist yet, or to
 * resync after a backfill. Safe to re-run — it overwrites the row each time.
 */
export async function bootstrapOnlineCalibration(): Promise<{ rows: number; total: number; wins: number }> {
  const buckets: Bucket[] = cloneBuckets();

  const { data: recs } = await supabaseAdmin
    .from("recommendations")
    .select("confidence, outcome, realized_pct")
    .neq("outcome", "pending")
    .limit(3000);

  const samples: { confidence: number; won: boolean }[] = [];
  for (const r of recs ?? []) {
    const c = Number(r.confidence);
    if (!Number.isFinite(c)) continue;
    const won = r.outcome === "target_hit" || (typeof r.realized_pct === "number" && Number(r.realized_pct) > 0);
    samples.push({ confidence: c, won });
  }

  if (samples.length < 300) {
    const { data: bt } = await supabaseAdmin
      .from("backtest_trades")
      .select("confidence, pnl_pct, exit_reason")
      .not("exit_reason", "is", null)
      .limit(5000);
    for (const r of bt ?? []) {
      const c = Number(r.confidence);
      if (!Number.isFinite(c)) continue;
      samples.push({ confidence: c, won: Number(r.pnl_pct ?? 0) > 0 });
    }
  }

  for (const s of samples) {
    const b = buckets.find((x) => s.confidence >= x.min && s.confidence <= x.max);
    if (b) { b.n += 1; if (s.won) b.wins += 1; }
  }

  const total = buckets.reduce((s, x) => s + x.n, 0);
  const wins = buckets.reduce((s, x) => s + x.wins, 0);
  const { data: existing } = await supabaseAdmin
    .from("signal_failures")
    .select("id")
    .eq("pattern_name", KEY)
    .maybeSingle();

  if (existing?.id) {
    await supabaseAdmin.from("signal_failures").update({
      rule_json: { buckets } as unknown as Json,
      total_count: total,
      win_count: wins,
      failure_count: total - wins,
      last_updated: new Date().toISOString(),
    }).eq("id", existing.id);
  } else {
    await supabaseAdmin.from("signal_failures").insert({
      pattern_name: KEY,
      description_ar: "تعلّم تدريجي للمعايرة بعد كل توصية مغلقة",
      rule_json: { buckets } as unknown as Json,
      total_count: total,
      win_count: wins,
      failure_count: total - wins,
      is_active: false,
    });
  }

  return { rows: samples.length, total, wins };
}
