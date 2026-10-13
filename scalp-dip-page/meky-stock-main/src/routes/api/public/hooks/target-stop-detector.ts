import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTelegram } from "@/lib/notifications/telegram.server";
import { escapeHtml } from "@/lib/utils/html-escape";

/**
 * Target/Stop Hit Detector — كل نصف ساعة
 * إشعار فقط، لا يكتب على أي جدول.
 */
export const Route = createFileRoute("/api/public/hooks/target-stop-detector")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const { data: positions } = await supabaseAdmin
            .from("positions")
            .select("id, symbol, entry_price, current_price, target_price, stop_loss, status")
            .eq("status", "open");

          const rows = (positions ?? []) as Array<{
            id: string; symbol: string; entry_price: number; current_price: number | null;
            target_price: number | null; stop_loss: number | null;
          }>;

          const targetHits: string[] = [];
          const stopHits: string[] = [];
          for (const p of rows) {
            const px = p.current_price;
            if (px == null) continue;
            if (p.target_price && Number(px) >= Number(p.target_price)) {
              const pct = ((Number(px) - Number(p.entry_price)) / Number(p.entry_price)) * 100;
              targetHits.push(`🎯 <b>${escapeHtml(p.symbol)}</b> وصل/تجاوز الهدف (${Number(p.target_price).toFixed(2)}) — سعر ${Number(px).toFixed(2)} (+${pct.toFixed(2)}%)`);
            } else if (p.stop_loss && Number(px) <= Number(p.stop_loss)) {
              const pct = ((Number(px) - Number(p.entry_price)) / Number(p.entry_price)) * 100;
              stopHits.push(`🛑 <b>${escapeHtml(p.symbol)}</b> لمس وقف الخسارة (${Number(p.stop_loss).toFixed(2)}) — سعر ${Number(px).toFixed(2)} (${pct.toFixed(2)}%)`);
            }
          }

          if (!targetHits.length && !stopHits.length) {
            return Response.json({ ok: true, hits: 0, checked: rows.length });
          }

          const lines: string[] = [];
          lines.push("⚡ <b>تنبيه وصول الهدف / وقف الخسارة</b>");
          if (targetHits.length) { lines.push(""); lines.push(...targetHits); }
          if (stopHits.length) { lines.push(""); lines.push(...stopHits); }

          const tg = await sendTelegram(lines.join("\n"));
          return Response.json({ ok: true, targets: targetHits.length, stops: stopHits.length, telegram: tg });
        } catch (e) {
          console.error("[target-stop-detector] error", e);
          return Response.json({ ok: false, error: (e as Error).message }, { status: 200 });
        }
      },
    },
  },
});