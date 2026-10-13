import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchMarketSnapshot } from "@/lib/market-data/market-index.server";
import { computeMarketBreadth } from "@/lib/market-data/breadth.server";
import { sendTelegram } from "@/lib/notifications/telegram.server";

/**
 * 09:30 Cairo — warm caches, take a fresh market snapshot, compute breadth,
 * and ping Telegram that the system is awake and ready for the 10:00 open.
 * Idempotent: safe to call multiple times.
 */
export const Route = createFileRoute("/api/public/hooks/premarket-warmup")({
  server: {
    handlers: {
      POST: async () => {
        const startedAt = new Date().toISOString();
        const out: Record<string, unknown> = { startedAt };

        try {
          const snap = await fetchMarketSnapshot();
          if (snap) {
            out.market = { close: snap.close, trend: snap.trend, regime: snap.regime };
            await supabaseAdmin.from("market_snapshots").upsert(snap as never, {
              onConflict: "index_symbol,date",
            });
          }
        } catch (e) {
          out.market_error = (e as Error).message;
        }

        try {
          out.breadth_pct = await computeMarketBreadth();
        } catch (e) {
          out.breadth_error = (e as Error).message;
        }

        try {
          const { count } = await supabaseAdmin
            .from("stocks")
            .select("*", { count: "exact", head: true })
            .eq("is_sharia", true)
            .eq("is_active", true);
          out.sharia_universe = count ?? 0;
        } catch {/* ignore */}

        const breadth = typeof out.breadth_pct === "number" ? out.breadth_pct : null;
        const breadthLine = breadth == null
          ? "اتساع السوق: غير متاح"
          : `اتساع السوق: <b>${breadth.toFixed(1)}%</b> ${breadth >= 40 ? "✅" : "⚠️"}`;
        const market = out.market as { close?: number; trend?: string } | undefined;
        const marketLine = market?.close
          ? `EGX30: <b>${Number(market.close).toFixed(2)}</b> · ${market.trend ?? "—"}`
          : "EGX30: بيانات غير متاحة";

        await sendTelegram(
          `🌅 <b>النظام صحي و جاهز للافتتاح</b>\n` +
            `الوقت: ${new Date().toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })}\n` +
            `${marketLine}\n${breadthLine}\n` +
            `أسهم شرعية نشطة: <b>${out.sharia_universe ?? "—"}</b>`,
          { skipBaladi: true },
        ).catch(() => undefined);

        return Response.json({ ok: true, ...out });
      },
    },
  },
});