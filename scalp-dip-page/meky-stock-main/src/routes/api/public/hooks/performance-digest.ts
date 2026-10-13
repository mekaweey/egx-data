import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTelegram } from "@/lib/notifications/telegram.server";
import { escapeHtml } from "@/lib/utils/html-escape";

/**
 * Weekly Performance Digest — ملخص أداء أسبوعي (يصدر مساء السبت)
 * يجمع نتائج التوصيات والترشيحات خلال آخر 7 أيام: عدد، دقة، أفضل/أسوأ، متوسط ربح.
 * إضافي بالكامل ولا يؤثر على أي شيء قائم.
 */
export const Route = createFileRoute("/api/public/hooks/performance-digest")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

          const [recsRes, picksRes, alertsRes] = await Promise.all([
            supabaseAdmin
              .from("recommendations")
              .select("symbol, signal, confidence, outcome, realized_pct, created_at")
              .gte("created_at", since)
              .in("signal", ["buy", "strong_buy"])
              .eq("rejected_by_rules", false),
            supabaseAdmin
              .from("daily_picks")
              .select("symbol, confidence, status, pnl_pct, pick_date")
              .gte("pick_date", since.slice(0, 10)),
            supabaseAdmin
              .from("sell_alerts")
              .select("symbol, alert_type, created_at")
              .gte("created_at", since),
          ]);

          const recs = (recsRes.data ?? []) as Array<{
            symbol: string; confidence: number; outcome: string; realized_pct: number | null;
          }>;
          const picks = (picksRes.data ?? []) as Array<{
            symbol: string; confidence: number; status: string; pnl_pct: number | null;
          }>;
          const alerts = (alertsRes.data ?? []) as Array<{ symbol: string; alert_type: string }>;

          // Stats — recommendations
          const recsResolved = recs.filter((r) => r.outcome && r.outcome !== "pending" && r.realized_pct != null);
          const recsWin = recsResolved.filter((r) => (r.realized_pct ?? 0) > 0).length;
          const recsLoss = recsResolved.filter((r) => (r.realized_pct ?? 0) <= 0).length;
          const recsAvg = recsResolved.length
            ? recsResolved.reduce((s, r) => s + Number(r.realized_pct ?? 0), 0) / recsResolved.length
            : 0;
          const recsAccuracy = recsResolved.length ? (recsWin / recsResolved.length) * 100 : 0;

          // Best / worst
          const sortedRecs = [...recsResolved].sort((a, b) => Number(b.realized_pct ?? 0) - Number(a.realized_pct ?? 0));
          const best = sortedRecs[0];
          const worst = sortedRecs[sortedRecs.length - 1];

          // Picks
          const picksClosed = picks.filter((p) => p.status === "closed" && p.pnl_pct != null);
          const picksWin = picksClosed.filter((p) => (p.pnl_pct ?? 0) > 0).length;
          const picksAvg = picksClosed.length
            ? picksClosed.reduce((s, p) => s + Number(p.pnl_pct ?? 0), 0) / picksClosed.length
            : 0;

          const lines: string[] = [];
          lines.push("📈 <b>الملخص الأسبوعي للأداء</b>");
          lines.push(`الفترة: آخر 7 أيام`);
          lines.push("");
          lines.push("🎯 <b>التوصيات:</b>");
          lines.push(`• إجمالي: <b>${recs.length}</b> · مكتملة: <b>${recsResolved.length}</b>`);
          if (recsResolved.length) {
            lines.push(`• ناجحة: <b>${recsWin}</b> · خاسرة: <b>${recsLoss}</b>`);
            lines.push(`• الدقة: <b>${recsAccuracy.toFixed(1)}%</b>`);
            lines.push(`• متوسط العائد: <b>${recsAvg.toFixed(2)}%</b>`);
          } else {
            lines.push("• لا توصيات مكتملة بعد خلال الأسبوع.");
          }

          if (best && worst && best !== worst) {
            lines.push("");
            lines.push("🏆 <b>الأفضل/الأسوأ:</b>");
            lines.push(`🟢 ${escapeHtml(best.symbol)} — ${Number(best.realized_pct).toFixed(2)}%`);
            lines.push(`🔴 ${escapeHtml(worst.symbol)} — ${Number(worst.realized_pct).toFixed(2)}%`);
          }

          if (picks.length) {
            lines.push("");
            lines.push("⭐ <b>الترشيحات اليومية:</b>");
            lines.push(`• إجمالي: <b>${picks.length}</b> · مغلقة: <b>${picksClosed.length}</b>`);
            if (picksClosed.length) {
              lines.push(`• ناجحة: <b>${picksWin}</b> · متوسط العائد: <b>${picksAvg.toFixed(2)}%</b>`);
            }
          }

          if (alerts.length) {
            lines.push("");
            lines.push(`🚨 تنبيهات البيع المُرسلة: <b>${alerts.length}</b>`);
          }

          lines.push("");
          lines.push("📊 النظام يتعلم تلقائيًا من نتائج الأسبوع لتحسين دقة الترشيحات القادمة.");

          const tg = await sendTelegram(lines.join("\n"));
          return Response.json({
            ok: true,
            telegram: tg,
            recs: recs.length,
            recs_resolved: recsResolved.length,
            accuracy: recsAccuracy,
            avg_pct: recsAvg,
            picks: picks.length,
          });
        } catch (e) {
          console.error("[performance-digest] error", e);
          return Response.json({ ok: false, error: (e as Error).message }, { status: 200 });
        }
      },
    },
  },
});