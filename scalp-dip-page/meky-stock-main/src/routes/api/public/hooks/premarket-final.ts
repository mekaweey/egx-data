import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getMorningBrief } from "@/lib/scan/tomorrow.functions";
import { computeMarketBreadth } from "@/lib/market-data/breadth.server";
import { sendTelegram } from "@/lib/notifications/telegram.server";
import { escapeHtml } from "@/lib/utils/html-escape";

/**
 * 09:45 Cairo — build a final shortlist for today's open by combining the
 * scan's morning brief with the current breadth gate. Persists into
 * `premarket_shortlist` and notifies Telegram once per day.
 */
export const Route = createFileRoute("/api/public/hooks/premarket-final")({
  server: {
    handlers: {
      POST: async () => {
        const today = new Date().toISOString().slice(0, 10);

        const existing = await supabaseAdmin
          .from("premarket_shortlist")
          .select("pick_date,sent_at")
          .eq("pick_date", today)
          .maybeSingle();
        if (existing.data?.sent_at) {
          return Response.json({ ok: true, already_sent: true });
        }

        let breadth: number | null = null;
        try { breadth = await computeMarketBreadth(); } catch { /* ignore */ }

        const brief = await getMorningBrief().catch((e) => {
          console.error("[premarket-final] morning brief failed", e);
          return null;
        });

        const picks = brief?.picks ?? [];
        const symbols = picks.map((p) => p.symbol);
        const reasons = picks.map((p) => ({
          symbol: p.symbol,
          confidence: p.confidence,
          expected_pct: p.expected_next_day_pct,
          reasons: p.reasons_ar?.slice(0, 2) ?? [],
        }));

        const breadthOk = breadth == null ? true : breadth >= 40;
        const lines: string[] = [];
        lines.push("🎯 <b>المرشحون قبل الافتتاح</b>");
        lines.push(new Date().toLocaleString("ar-EG", { timeZone: "Africa/Cairo" }));
        lines.push(breadth == null
          ? `اتساع السوق: غير متاح`
          : `اتساع السوق: <b>${breadth.toFixed(1)}%</b> ${breadthOk ? "✅" : "⚠️ ضعيف"}`);
        lines.push("");

        if (!picks.length) {
          lines.push(brief?.reason ?? "لا توجد ترشيحات تستوفي الشروط الصارمة اليوم.");
        } else if (!breadthOk) {
          lines.push("⚠️ السوق ضعيف — الترشيحات معلّقة حتى تتحسّن الحالة.");
          lines.push("");
          for (const p of picks) {
            lines.push(`• <code>${escapeHtml(p.symbol)}</code> — ثقة ${p.confidence}%`);
          }
        } else {
          for (const p of picks) {
            const exp = p.expected_next_day_pct != null
              ? ` · متوقع +${Number(p.expected_next_day_pct).toFixed(1)}%`
              : "";
            lines.push(`⭐ <b>${escapeHtml(p.symbol)}</b> (${escapeHtml(p.name_ar)})`);
            lines.push(`  ثقة <b>${p.confidence}%</b>${exp}`);
            if (p.entry_min && p.target && p.stop_loss) {
              lines.push(`  دخول ${Number(p.entry_min).toFixed(2)} · هدف ${Number(p.target).toFixed(2)} · وقف ${Number(p.stop_loss).toFixed(2)}`);
            }
          }
        }
        lines.push("");
        lines.push("⏰ السوق يفتح 10:00 — هتوصلك إشارات لحظية لو طلع breakout.");

        const tg = await sendTelegram(lines.join("\n"), { skipBaladi: true });

        await supabaseAdmin.from("premarket_shortlist").upsert({
          pick_date: today,
          symbols,
          reasons: reasons as never,
          breadth_pct: breadth,
          notes: breadthOk ? "ok" : "weak_breadth",
          sent_at: new Date().toISOString(),
        }, { onConflict: "pick_date" });

        return Response.json({ ok: true, picks: picks.length, breadth, telegram: tg.ok });
      },
    },
  },
});