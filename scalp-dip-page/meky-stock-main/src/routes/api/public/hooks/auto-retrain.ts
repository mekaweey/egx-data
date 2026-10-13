import { createFileRoute } from "@tanstack/react-router";
import { runWalkForward } from "@/lib/backtest/walk-forward.functions";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Tier-L.1 — Auto-Retraining (cron-friendly).
 *
 * Runs walk-forward at several `minConfidence` thresholds over the last
 * 180 trading days, scores each by (accuracy_pct × top_pick_win_rate),
 * and persists the best config to `model_state` so the UI / orchestrator
 * can surface it as a recommended threshold.
 *
 * Fail-open: any error is logged, response is always 200 JSON so pg_cron
 * never marks the job as failed.
 */
export const Route = createFileRoute("/api/public/hooks/auto-retrain")({
  server: {
    handlers: {
      POST: async () => runRetrain(),
      GET: async () => runRetrain(),
    },
  },
});

async function runRetrain() {
  try {
    const days = 180;
    const picksPerDay = 3;
    const candidates = [75, 80, 82, 85, 88];
    const trials: Array<{
      minConfidence: number;
      accuracy_pct: number;
      top_pick_win_rate: number;
      avg_next_day_return_pct: number;
      score: number;
    }> = [];

    for (const minConfidence of candidates) {
      try {
        const r = (await runWalkForward({
          data: { days, minConfidence, picksPerDay },
        })) as {
          accuracy_pct?: number;
          top_pick_win_rate?: number;
          avg_next_day_return_pct?: number;
        };
        const acc = Number(r.accuracy_pct ?? 0);
        const wr = Number(r.top_pick_win_rate ?? 0);
        const ret = Number(r.avg_next_day_return_pct ?? 0);
        trials.push({
          minConfidence,
          accuracy_pct: acc,
          top_pick_win_rate: wr,
          avg_next_day_return_pct: ret,
          score: acc * wr + ret * 100,
        });
      } catch (e) {
        console.warn(`[auto-retrain] trial ${minConfidence} failed:`, e);
      }
    }

    if (trials.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "no trials succeeded" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    trials.sort((a, b) => b.score - a.score);
    const best = trials[0];

    await supabaseAdmin.from("model_state").upsert({
      key: "auto_retrain_best",
      data: {
        best,
        trials,
        evaluated_at: new Date().toISOString(),
        window_days: days,
        picks_per_day: picksPerDay,
      },
      updated_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ success: true, best, trials }, null, 2),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[auto-retrain] fatal:", msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { headers: { "Content-Type": "application/json" } },
    );
  }
}