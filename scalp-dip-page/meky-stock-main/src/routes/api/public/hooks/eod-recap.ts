import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTelegram } from "@/lib/notifications/telegram.server";
import { escapeHtml } from "@/lib/utils/html-escape";

/**
 * End-of-Day Recap — ملخص نهاية اليوم (4 مساءً) — قراءة فقط، إضافي بالكامل.
 */
export const Route = createFileRoute("/api/public/hooks/eod-recap")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const todayISO = todayStart.toISOString();
          const today = todayISO.slice(0, 10);

          const [recsRes, picksRes, alertsRes, marketRes, positionsRes] = await Promise.all([
            supabaseAdmin.from("recommendations")
              .select("symbol, signal, confidence, outcome, realized_pct, created_at")
              .gte("created_at", todayISO)
              .in("signal", ["buy", "strong_buy"])
              .eq("rejected_by_rules", false)
              .order("confidence", { ascending: false }),
            supabaseAdmin.from("daily_picks")
              .select("symbol, status, pnl_pct, confidence, target_pct, pick_date")
              .eq("pick_date", today),
            supabaseAdmin.from("sell_alerts")
              .select("symbol, alert_type, created_at")
              .gte("created_at", todayISO),
            supabaseAdmin.from("market_snapshots")
              .select("index_symbol, close, change_pct, trend")
              .order("date", { ascending: false }).limit(1).maybeSingle(),
            supabaseAdmin.from("positions")
              .select("symbol, pnl_pct, status, exit_reason")
              .gte("updated_at", todayISO)
              .eq("status", "closed"),
          ]);

          const recs = (recsRes.data ?? []) as Array<{ symbol: string; signal: string; confidence: number; outcome: string; realized_pct: number | null }>;
          const picks = (picksRes.data ?? []) as Array<{ symbol: string; status: string; pnl_pct: number | null; confidence: number; target_pct: number | null }>;
          const alerts = (alertsRes.data ?? []) as Array<{ symbol: string; alert_type: string }>;
          const closed = (positionsRes.data ?? []) as unknown as Array<{ symbol: string; pnl_pct: number | null; status: string; exit_reason: string | null }>;
          const m = marketRes.data as null | { index_symbol?: string; close?: number; change_pct?: number; trend?: string };

          const resolved = recs.filter((r) => r.outcome !== "pending" && r.realized_pct != null);
          const wins = resolved.filter((r) => (r.realized_pct ?? 0) > 0).length;
          const accuracy = resolved.length ? (wins / resolved.length) * 100 : null;

          const lines: string[] = [];
          lines.push("🌇 <b>ملخص نهاية اليوم</b>");
          lines.push(new Date().toLocaleString("ar-EG", { timeZone: "Africa/Cairo" }));
          lines.push("");

          if (m) {
            const arrow = (m.change_pct ?? 0) >= 0 ? "🟢" : "🔴";
            lines.push(`${arrow} <b>${escapeHtml(m.index_symbol ?? "السوق")}:</b> ${Number(m.close ?? 0).toFixed(2)} (${Number(m.change_pct ?? 0).toFixed(2)}%) — ${escapeHtml(m.trend ?? "—")}`);
            lines.push("");
          }

          lines.push(`🎯 توصيات اليوم: <b>${recs.length}</b> · مكتملة: <b>${resolved.length}</b>${accuracy != null ? ` · دقة ${accuracy.toFixed(0)}%` : ""}`);
          lines.push(`⭐ ترشيحات اليوم: <b>${picks.length}</b>`);
          lines.push(`🚨 تنبيهات بيع: <b>${alerts.length}</b>`);

          if (closed.length) {
            lines.push(`💼 مراكز أُغلقت اليوم: <b>${closed.length}</b>`);
            for (const c of closed.slice(0, 5)) {
              const arrow = (c.pnl_pct ?? 0) >= 0 ? "🟢" : "🔴";
              lines.push(`${arrow} ${escapeHtml(c.symbol)} — ${c.pnl_pct?.toFixed(2) ?? "—"}% (${escapeHtml(c.exit_reason ?? c.status)})`);
            }
          }

          if (resolved.length) {
            const sorted = [...resolved].sort((a, b) => Number(b.realized_pct ?? 0) - Number(a.realized_pct ?? 0));
            const best = sorted[0];
            const worst = sorted[sorted.length - 1];
            lines.push("");
            lines.push("🏆 <b>أبرز نتائج اليوم:</b>");
            lines.push(`🟢 ${escapeHtml(best.symbol)} — ${Number(best.realized_pct).toFixed(2)}%`);
            if (best !== worst) lines.push(`🔴 ${escapeHtml(worst.symbol)} — ${Number(worst.realized_pct).toFixed(2)}%`);
          }

          if (picks.length) {
            lines.push("");
            lines.push("⭐ <b>ترشيحات اليوم (للمتابعة بكرا):</b>");
            for (const p of picks.slice(0, 5)) {
              lines.push(`• ${escapeHtml(p.symbol)} — ثقة ${p.confidence}% · هدف +${Number(p.target_pct ?? 0).toFixed(1)}%`);
            }
          }

          const tg = await sendTelegram(lines.join("\n"));
          return Response.json({ ok: true, telegram: tg, recs: recs.length, picks: picks.length, alerts: alerts.length });
        } catch (e) {
          console.error("[eod-recap] error", e);
          return Response.json({ ok: false, error: (e as Error).message }, { status: 200 });
        }
      },
    },
  },
});