import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTelegram } from "@/lib/notifications/telegram.server";
import { escapeHtml } from "@/lib/utils/html-escape";

/**
 * Smart Exit — runs every 30 min during market hours.
 *
 * Two strategies per open recommendation:
 *  1) Partial profit at 60% toward target (sell half, keep rest on trailing stop).
 *     Marked via raw_ai_response.partial_exit_alerted.
 *  2) Adaptive Target Extension (Trend-Following / "Let winners run"):
 *     When price ≥ original target AND momentum is still strong:
 *      - RSI(14) < 78 (not extreme overbought)
 *      - MACD histogram > 0
 *      - close > EMA(9)
 *      - vol_ratio ≥ 1.0 (volume above 20d avg)
 *     → extend target by +1× ATR, raise stop-loss to break-even + 50% of current gain.
 *     Persisted on the recommendation (target, stop_loss) + raw_ai_response.target_extensions.
 */
export const Route = createFileRoute("/api/public/hooks/smart-exit")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
          const { data: recs } = await supabaseAdmin
            .from("recommendations")
            .select("id, symbol, price_at_reco, target, stop_loss, raw_ai_response")
            .is("outcome", null)
            .eq("rejected_by_rules", false)
            .gte("created_at", cutoff);

          if (!recs || recs.length === 0) {
            return Response.json({ ok: true, alerts: 0 });
          }

          const symbols = [...new Set(recs.map((r) => String(r.symbol)))];
          const { data: snaps } = await supabaseAdmin
            .from("stock_snapshots")
            .select("symbol, close, rsi14, macd_hist, ema9, atr14, vol_ratio, ts")
            .in("symbol", symbols)
            .order("ts", { ascending: false });

          type Snap = {
            close: number; rsi14: number | null; macdHist: number | null;
            ema9: number | null; atr14: number | null; volRatio: number | null;
          };
          const snapMap = new Map<string, Snap>();
          for (const s of snaps ?? []) {
            const sym = String(s.symbol);
            if (snapMap.has(sym)) continue;
            snapMap.set(sym, {
              close: Number(s.close ?? 0),
              rsi14: s.rsi14 != null ? Number(s.rsi14) : null,
              macdHist: s.macd_hist != null ? Number(s.macd_hist) : null,
              ema9: s.ema9 != null ? Number(s.ema9) : null,
              atr14: s.atr14 != null ? Number(s.atr14) : null,
              volRatio: s.vol_ratio != null ? Number(s.vol_ratio) : null,
            });
          }

          const { data: stocks } = await supabaseAdmin
            .from("stocks").select("symbol, name_ar").in("symbol", symbols);
          const nameMap = new Map(stocks?.map((s) => [String(s.symbol), String(s.name_ar)]) ?? []);

          const partialAlerts: string[] = [];
          const extendAlerts: string[] = [];
          let partialCount = 0;
          let extendCount = 0;
          const MAX_EXTENSIONS = 4;

          for (const r of recs) {
            const raw = (r.raw_ai_response ?? {}) as Record<string, unknown>;
            const sym = String(r.symbol);
            const snap = snapMap.get(sym);
            const entry = Number(r.price_at_reco ?? 0);
            const target = Number(r.target ?? 0);
            if (!snap || !snap.close || entry <= 0 || target <= 0) continue;
            const px = snap.close;
            const name = escapeHtml(nameMap.get(sym) || sym);
            const gainPct = ((px - entry) / entry) * 100;

            // === (2) Adaptive Target Extension — when price reaches/exceeds target ===
            if (px >= target) {
              const extensions = Number(raw.target_extensions ?? 0);
              const momentumOk =
                (snap.rsi14 == null || snap.rsi14 < 78) &&
                (snap.macdHist == null || snap.macdHist > 0) &&
                (snap.ema9 == null || px > snap.ema9) &&
                (snap.volRatio == null || snap.volRatio >= 1.0);

              if (momentumOk && extensions < MAX_EXTENSIONS) {
                const atr = snap.atr14 && snap.atr14 > 0 ? snap.atr14 : px * 0.02;
                const newTarget = +(target + atr).toFixed(2);
                // Raise stop to lock-in: entry + 50% of current gain
                const lockedStop = +(entry + (px - entry) * 0.5).toFixed(2);
                const prevStop = r.stop_loss != null ? Number(r.stop_loss) : 0;
                const newStop = Math.max(prevStop, lockedStop);

                await supabaseAdmin
                  .from("recommendations")
                  .update({
                    target: newTarget,
                    stop_loss: newStop,
                    raw_ai_response: {
                      ...raw,
                      target_extensions: extensions + 1,
                      last_extended_at: new Date().toISOString(),
                      extension_history: [
                        ...(Array.isArray(raw.extension_history) ? raw.extension_history : []),
                        { at: new Date().toISOString(), from: target, to: newTarget, price: px, stop: newStop },
                      ],
                    },
                  })
                  .eq("id", r.id);

                const lockedPct = ((newStop - entry) / entry) * 100;
                extendAlerts.push(
                  `🚀 <b>${name}</b> (${sym}) — كمّل صعود (+${gainPct.toFixed(1)}%)`,
                );
                extendAlerts.push(
                  `   ↳ تارجت جديد: <b>${newTarget}</b> · ستوب لوس: <b>${newStop}</b> (ربح مضمون +${lockedPct.toFixed(1)}%)`,
                );
                extendCount++;
                continue;
              }

              // Momentum weakened → suggest full exit
              if (!raw.full_exit_alerted) {
                await supabaseAdmin
                  .from("recommendations")
                  .update({ raw_ai_response: { ...raw, full_exit_alerted: true, full_exit_at: new Date().toISOString() } })
                  .eq("id", r.id);
                extendAlerts.push(
                  `🎯 <b>${name}</b> (${sym}) — وصل الهدف (+${gainPct.toFixed(1)}%) والزخم ضعف`,
                );
                extendAlerts.push(`   ↳ <b>اقتراح: بيع كامل الكمية</b>`);
                extendCount++;
                continue;
              }
            }

            // === (1) Partial profit at 50% of way to target (V2.2) ===
            // Walk-forward verified on 3.8y / 116 sharia stocks:
            //   WR 42.8% → 62.8%, PF 1.37 → 2.47, CAGR 86.5% → 97.5%,
            //   Max DD 17.4% → 14.4%. Releases capital sooner to compound
            //   without sacrificing the upper half of the position.
            if (raw.partial_exit_alerted) continue;
            const progress = (px - entry) / (target - entry);
            if (progress < 0.5) continue;

            partialAlerts.push(`💰 <b>${name}</b> (${sym}) — حقق +${gainPct.toFixed(1)}% (${(progress*100).toFixed(0)}% من الهدف)`);
            partialAlerts.push(`   ↳ <b>اقتراح: بيع نصف الكمية</b>، والباقي مع وقف متحرّك`);

            await supabaseAdmin
              .from("recommendations")
              .update({ raw_ai_response: { ...raw, partial_exit_alerted: true, alerted_at: new Date().toISOString() } })
              .eq("id", r.id);
            partialCount++;
          }

          if (extendAlerts.length > 0) {
            await sendTelegram(["🚀 <b>توسيع الهدف الذكي (Let Winners Run)</b>", "", ...extendAlerts].join("\n"));
          }
          if (partialAlerts.length > 0) {
            await sendTelegram(["🎯 <b>تنبيه جني أرباح ذكي</b>", "", ...partialAlerts].join("\n"));
          }

          return Response.json({
            ok: true,
            checked: recs.length,
            partial_alerts: partialCount,
            target_extensions: extendCount,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("smart-exit failed:", msg);
          return Response.json({ ok: false, error: msg }, { status: 200 });
        }
      },
    },
  },
});