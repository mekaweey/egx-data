import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getTodayPick } from "@/lib/today/today.functions";
import { getMorningBrief } from "@/lib/scan/tomorrow.functions";
import { evaluatePositions } from "@/lib/positions/positions.functions";
import {
  notifyNewPick,
  notifyNewsShocksForActive,
} from "@/lib/notifications/pick-alerts.server";

/**
 * Background watcher — hit by pg_cron every ~10 min during the trading day.
 * Sends Telegram alerts for:
 *   - new daily pick / morning brief recommendations (once each)
 *   - news shocks affecting active picks or open positions
 *   - target/stop alerts via evaluatePositions (sendTelegram inside)
 */
export const Route = createFileRoute("/api/public/hooks/monitor")({
  server: {
    handlers: {
      POST: async () => {
        const summary: Record<string, unknown> = {};

        try {
          const today = await getTodayPick();
          summary.today_pick = today?.pick?.symbol ?? null;
        } catch (e) {
          summary.today_error = (e as Error).message;
        }

        try {
          const brief = await getMorningBrief();
          const date = new Date().toISOString().slice(0, 10);
          for (const p of brief.picks ?? []) {
            await notifyNewPick({
              pick_date: date,
              symbol: p.symbol,
              name_ar: p.name_ar,
              entry: Number(p.close),
              target: Number(p.target ?? p.close),
              stop: Number(p.stop_loss ?? p.close),
              confidence: Number(p.confidence),
              reasons: p.reasons_ar ?? [],
              source: "morning_brief",
            });
          }
          summary.morning_brief = brief.picks?.length ?? 0;
        } catch (e) {
          summary.brief_error = (e as Error).message;
        }

        try {
          const news = await notifyNewsShocksForActive();
          summary.news_alerts = news.alerts;
        } catch (e) {
          summary.news_error = (e as Error).message;
        }

        try {
          const ev = await evaluatePositions();
          summary.positions = ev;
        } catch (e) {
          summary.positions_error = (e as Error).message;
        }

        return new Response(JSON.stringify({ ok: true, ...summary }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});