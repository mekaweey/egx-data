import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTelegram } from "@/lib/notifications/telegram.server";
import { escapeHtml } from "@/lib/utils/html-escape";

/**
 * Trailing Stop Engine — runs hourly during market hours.
 * For each open recommendation, fetches latest close; if price moved
 * ≥ 50% of the way toward target, raises stop_loss to lock in gains
 * (breakeven + buffer). Sends one consolidated Telegram alert per run.
 */
export const Route = createFileRoute("/api/public/hooks/trailing-stop")({
  server: {
    handlers: {
      POST: async () => {
        try {
          // Open recs from last 14 days
          const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
          const { data: recs } = await supabaseAdmin
            .from("recommendations")
            .select("id, symbol, price_at_reco, target, stop_loss, confidence")
            .is("outcome", null)
            .eq("rejected_by_rules", false)
            .gte("created_at", cutoff);

          if (!recs || recs.length === 0) {
            return Response.json({ ok: true, updated: 0, reason: "no open recommendations" });
          }

          const symbols = [...new Set(recs.map((r) => String(r.symbol)))];
          const { data: snaps } = await supabaseAdmin
            .from("stock_snapshots")
            .select("symbol, close, atr14, rsi14, macd_hist, ema9, vol_ratio")
            .in("symbol", symbols)
            .order("snapshot_date", { ascending: false });

          // Take most-recent snapshot per symbol
          const priceMap = new Map<string, { close: number; atr: number; rsi: number | null; macdHist: number | null; ema9: number | null; volRatio: number | null }>();
          for (const s of snaps ?? []) {
            const sym = String(s.symbol);
            if (!priceMap.has(sym)) {
              priceMap.set(sym, {
                close: Number(s.close ?? 0),
                atr: Number(s.atr14 ?? 0),
                rsi: s.rsi14 != null ? Number(s.rsi14) : null,
                macdHist: s.macd_hist != null ? Number(s.macd_hist) : null,
                ema9: s.ema9 != null ? Number(s.ema9) : null,
                volRatio: s.vol_ratio != null ? Number(s.vol_ratio) : null,
              });
            }
          }

          const updates: string[] = [];
          let updatedCount = 0;

          for (const r of recs) {
            const sym = String(r.symbol);
            const px = priceMap.get(sym);
            if (!px || px.close <= 0) continue;

            const entry = Number(r.price_at_reco ?? 0);
            const target = Number(r.target ?? 0);
            const curStop = Number(r.stop_loss ?? 0);
            if (entry <= 0 || target <= 0) continue;

            const progress = (px.close - entry) / (target - entry);
            if (progress < 0.5) continue; // not enough gain yet

            // Adaptive trailing buffer: widen for strong momentum so big winners
            // (e.g. +10%+ movers like Mansoura) can keep running. Never tighter
            // than the default → no negative impact on regular trades.
            const strongMomentum =
              (px.rsi == null || px.rsi < 78) &&
              (px.macdHist == null || px.macdHist > 0) &&
              (px.ema9 == null || px.close > px.ema9) &&
              (px.volRatio == null || px.volRatio >= 1.2);
            // Tightened default trail distance to ~1% of price (shadow sim showed
            // this locks in profits much closer to peak with no win-rate hit).
            // Strong-momentum branch keeps the wider ATR×1.8 buffer so runners
            // (e.g. Mansoura-style +10% moves) are not whipsawed.
            const atrBase = px.atr > 0 ? px.atr : px.close * 0.015;
            const tightBuffer = Math.min(atrBase, px.close * 0.01);
            const buffer = strongMomentum ? atrBase * 1.8 : tightBuffer;
            const newStop = Math.max(entry * 1.005, px.close - buffer);

            if (newStop > curStop + 0.001) {
              const { error } = await supabaseAdmin
                .from("recommendations")
                .update({ stop_loss: Number(newStop.toFixed(2)) })
                .eq("id", r.id);
              if (!error) {
                updatedCount++;
                const gainPct = ((px.close - entry) / entry * 100).toFixed(1);
                const tag = strongMomentum ? " 🚀 زخم قوي" : "";
                updates.push(`🔒 ${escapeHtml(sym)}: وقف خسارة جديد ${newStop.toFixed(2)} (مكسب حالي +${gainPct}%)${tag}`);
              }
            }
          }

          if (updates.length > 0) {
            const msg = ["🛡️ <b>تحديث وقف الخسارة المتحرّك</b>", "", ...updates].join("\n");
            await sendTelegram(msg);
          }

          return Response.json({ ok: true, updated: updatedCount, checked: recs.length });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("trailing-stop failed:", msg);
          return Response.json({ ok: false, error: msg }, { status: 200 });
        }
      },
    },
  },
});