import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Automatic Active Learning.
 *
 * Identifies the most uncertain closed recommendations (confidence near 50),
 * fetches their realized outcomes, and writes them to `learning_labels`
 * as high-priority training samples — fully automatic, NO user prompts.
 *
 * The next training cycle (meta-learner / GA / regime models) consumes
 * these labels with extra weight via the label_weight column.
 */

type LabelInsert = {
  recommendation_id: string;
  symbol: string;
  label: "win" | "loss";
  realized_pct: number;
  confidence: number;
  uncertainty: number; // distance from 50 (smaller = more uncertain)
  label_weight: number;
  labeled_at: string;
};

const UNCERTAIN_BAND = 15; // confidence within 35..65 is "uncertain"
const BATCH_LIMIT = 200;

export async function autoLabelUncertain(): Promise<{ labeled: number; skipped: number }> {
  // Pull closed recs with realized outcome.
  const { data: recs } = await supabaseAdmin
    .from("recommendations")
    .select("id, symbol, confidence, outcome, realized_pct, outcome_at")
    .in("outcome", ["target_hit", "stop_hit", "expired"])
    .not("realized_pct", "is", null)
    .order("outcome_at", { ascending: false })
    .limit(BATCH_LIMIT);

  if (!recs || recs.length === 0) return { labeled: 0, skipped: 0 };

  // Filter to uncertain band
  const uncertain = recs.filter(
    (r) => r.confidence != null && Math.abs(Number(r.confidence) - 50) <= UNCERTAIN_BAND,
  );
  if (uncertain.length === 0) return { labeled: 0, skipped: recs.length };

  // Skip ones already labeled.
  const ids = uncertain.map((r) => r.id);
  const { data: existing } = await supabaseAdmin
    .from("learning_labels")
    .select("recommendation_id")
    .in("recommendation_id", ids);
  const have = new Set((existing ?? []).map((e) => e.recommendation_id));

  const rows: LabelInsert[] = [];
  for (const r of uncertain) {
    if (have.has(r.id)) continue;
    const conf = Number(r.confidence);
    const realized = Number(r.realized_pct);
    const uncertainty = Math.abs(conf - 50);
    rows.push({
      recommendation_id: r.id,
      symbol: r.symbol,
      label: realized > 0 ? "win" : "loss",
      realized_pct: realized,
      confidence: conf,
      uncertainty,
      // closer to 50 → higher weight (max 3x, min 1x)
      label_weight: +(1 + (UNCERTAIN_BAND - uncertainty) / UNCERTAIN_BAND * 2).toFixed(2),
      labeled_at: new Date().toISOString(),
    });
  }

  if (rows.length === 0) return { labeled: 0, skipped: uncertain.length };

  const { error } = await supabaseAdmin.from("learning_labels").insert(rows);
  if (error) {
    // Table may not exist yet — silently no-op so the scan still completes.
    return { labeled: 0, skipped: rows.length };
  }

  return { labeled: rows.length, skipped: uncertain.length - rows.length };
}