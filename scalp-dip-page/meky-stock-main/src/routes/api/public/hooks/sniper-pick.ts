import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { computeTodayPick } from "@/lib/sniper/sniper-pick.server";
import { notifyNewPick } from "@/lib/notifications/pick-alerts.server";

function cairoDateString() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
}

/** Run pre-market (~09:00 Cairo) to select today's stock. */
export const Route = createFileRoute("/api/public/hooks/sniper-pick")({
  server: {
    handlers: {
      POST: async () => {
        const today = cairoDateString();
        const pick = await computeTodayPick();
        if (!pick) {
          return Response.json({ ok: true, pick: null, reason: "no candidate passed STACK filter" });
        }
        const entry = pick.prev_close;
        const target = +(entry * 1.04).toFixed(2);
        const stop = +(entry * 0.98).toFixed(2);

        await supabaseAdmin.from("sniper_picks").upsert({
          pick_date: today,
          symbol: pick.symbol,
          name_ar: pick.name_ar,
          v3_score: pick.score,
          reasons: pick.reasons,
          confidence: pick.confidence,
          negative_reasons: pick.negative_reasons,
          prev_close: pick.prev_close,
          entry_price: entry,
          target_price: target,
          stop_price: stop,
          status: "pending",
        }, { onConflict: "pick_date" });

        const { data: existingDaily } = await supabaseAdmin
          .from("daily_picks")
          .select("id,symbol")
          .eq("pick_date", today)
          .maybeSingle();

        if (!existingDaily) {
          await supabaseAdmin.from("daily_picks").insert({
            pick_date: today,
            symbol: pick.symbol,
            name_ar: pick.name_ar,
            entry_price: entry,
            target_price: target,
            stop_price: stop,
            target_pct: 4,
            stop_pct: 2,
            max_hold_days: 5,
            confidence: pick.confidence,
            kelly_pct: 0,
            score: pick.score,
            reasons: [...pick.reasons, ...pick.negative_reasons] as never,
            status: "open",
          });
        }

        await notifyNewPick({
          pick_date: today,
          symbol: pick.symbol,
          name_ar: pick.name_ar,
          entry,
          target,
          stop,
          confidence: pick.confidence,
          reasons: [...pick.reasons, ...pick.negative_reasons],
          source: "today",
        }).catch((e) => console.error("[sniper-pick] notify failed", e));

        return Response.json({ ok: true, pick });
      },
    },
  },
});