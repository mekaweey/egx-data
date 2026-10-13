import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTelegram } from "@/lib/notifications/telegram.server";

/**
 * Drawdown Guard — حارس الانخفاض اليومي. للقراءة والإشعار فقط — لا يكتب أي بيانات.
 */
const THRESHOLD_PCT = -3;

export const Route = createFileRoute("/api/public/hooks/drawdown-guard")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const [recsRes, positionsRes] = await Promise.all([
            supabaseAdmin.from("recommendations")
              .select("realized_pct, outcome, created_at")
              .gte("created_at", since)
              .eq("rejected_by_rules", false)
              .neq("outcome", "pending")
              .not("realized_pct", "is", null),
            supabaseAdmin.from("positions")
              .select("pnl_pct, status, updated_at")
              .gte("updated_at", since)
              .eq("status", "closed")
              .not("pnl_pct", "is", null),
          ]);

          const recs = (recsRes.data ?? []) as Array<{ realized_pct: number | null }>;
          const pos = (positionsRes.data ?? []) as Array<{ pnl_pct: number | null }>;
          const allPct = [...recs.map((r) => Number(r.realized_pct)), ...pos.map((p) => Number(p.pnl_pct))]
            .filter((n) => Number.isFinite(n));
          const n = allPct.length;
          if (n < 3) return Response.json({ ok: true, skipped: "insufficient_data", samples: n });

          const avg = allPct.reduce((s, x) => s + x, 0) / n;
          const losses = allPct.filter((x) => x < 0).length;
          const losses_pct = (losses / n) * 100;

          if (avg > THRESHOLD_PCT) {
            return Response.json({ ok: true, healthy: true, avg, samples: n });
          }

          const lines: string[] = [];
          lines.push("⚠️ <b>تحذير: حارس الانخفاض مُفعَّل</b>");
          lines.push("");
          lines.push(`متوسط أداء آخر 7 أيام: <b>${avg.toFixed(2)}%</b> على ${n} صفقة`);
          lines.push(`نسبة الصفقات الخاسرة: <b>${losses_pct.toFixed(0)}%</b>`);
          lines.push("");
          lines.push("💡 <b>توصية:</b>");
          lines.push("• قلّل حجم المراكز الجديدة مؤقتًا (لـ 50% من المعتاد).");
          lines.push("• ركّز فقط على ترشيحات بثقة ≥ 75%.");
          lines.push("• راجع المراكز المفتوحة وفكّر في تشديد وقف الخسارة.");
          lines.push("• استنّى تأكيد اتجاه السوق قبل توسيع التعرّض.");

          const tg = await sendTelegram(lines.join("\n"));
          return Response.json({ ok: true, alert: true, avg, losses_pct, samples: n, telegram: tg });
        } catch (e) {
          console.error("[drawdown-guard] error", e);
          return Response.json({ ok: false, error: (e as Error).message }, { status: 200 });
        }
      },
    },
  },
});