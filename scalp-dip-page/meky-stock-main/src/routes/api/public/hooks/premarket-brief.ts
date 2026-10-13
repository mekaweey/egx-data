import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTelegram } from "@/lib/notifications/telegram.server";
import { escapeHtml } from "@/lib/utils/html-escape";

/**
 * Pre-Market Brief — يُرسل ملخصًا قبل فتح السوق بقليل (9:25 صباحًا توقيت القاهرة)
 * يجمع: آخر أخبار الليلة، أبرز ترشيحات اليوم، حالة السوق العامة، تذكير بالمراكز المفتوحة.
 * إضافي بالكامل ولا يؤثر على أي شيء قائم.
 */
export const Route = createFileRoute("/api/public/hooks/premarket-brief")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const since = new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(); // آخر 18 ساعة (الليلة)
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const todayISO = todayStart.toISOString();

          const [newsRes, picksRes, recsRes, positionsRes, marketRes] = await Promise.all([
            supabaseAdmin
              .from("news_sentiment")
              .select("symbol, headline, sentiment_score, sentiment, published_at")
              .gte("created_at", since)
              .order("sentiment_score", { ascending: false })
              .limit(6),
            supabaseAdmin
              .from("daily_picks")
              .select("symbol, confidence, target_pct, reasons, entry_price, target_price, stop_price")
              .gte("created_at", todayISO)
              .order("confidence", { ascending: false })
              .limit(5),
            supabaseAdmin
              .from("recommendations")
              .select("symbol, signal, confidence, expected_next_day_pct, entry_min, entry_max, target, stop_loss, reasons_ar, created_at")
              .gte("created_at", since)
              .in("signal", ["buy", "strong_buy"])
              .eq("rejected_by_rules", false)
              .order("confidence", { ascending: false })
              .limit(5),
            supabaseAdmin
              .from("positions")
              .select("symbol, entry_price, current_price, pnl_pct, status")
              .eq("status", "open")
              .limit(10),
            supabaseAdmin
              .from("market_snapshots")
              .select("index_symbol, date, close, change_pct, change_5d_pct, trend")
              .order("date", { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);

          const lines: string[] = [];
          lines.push("🌅 <b>ملخص ما قبل فتح السوق</b>");
          lines.push(new Date().toLocaleString("ar-EG", { timeZone: "Africa/Cairo" }));
          lines.push("");

          // حالة السوق العامة
          const m = marketRes.data as null | {
            index_symbol?: string | null; close?: number | null; change_pct?: number | null;
            change_5d_pct?: number | null; trend?: string | null;
          };
          if (m) {
            lines.push("📊 <b>حالة السوق:</b>");
            if (m.index_symbol) lines.push(`• المؤشر: <b>${escapeHtml(String(m.index_symbol))}</b>${m.close != null ? ` — ${Number(m.close).toFixed(2)}` : ""}`);
            if (m.trend) lines.push(`• الاتجاه: ${escapeHtml(String(m.trend))}`);
            if (m.change_pct != null) lines.push(`• تغير اليوم: ${Number(m.change_pct).toFixed(2)}%`);
            if (m.change_5d_pct != null) lines.push(`• تغير 5 أيام: ${Number(m.change_5d_pct).toFixed(2)}%`);
            lines.push("");
          }

          // ترشيحات اليوم
          const picks = (picksRes.data ?? []) as unknown as Array<{
            symbol: string; confidence: number; target_pct: number | null;
            reasons: unknown; entry_price: number | null; target_price: number | null; stop_price: number | null;
          }>;
          if (picks.length) {
            lines.push(`⭐ <b>ترشيحات اليوم (${picks.length}):</b>`);
            for (const p of picks) {
              const exp = p.target_pct != null ? ` · هدف +${Number(p.target_pct).toFixed(1)}%` : "";
              lines.push(`• <b>${escapeHtml(p.symbol)}</b> — ثقة ${p.confidence}%${exp}`);
              if (p.entry_price && p.target_price) {
                lines.push(`  دخول ${Number(p.entry_price).toFixed(2)} · هدف ${Number(p.target_price).toFixed(2)}${p.stop_price ? ` · وقف ${Number(p.stop_price).toFixed(2)}` : ""}`);
              }
              const reasons = Array.isArray(p.reasons) ? p.reasons.map(String).slice(0, 1) : [];
              for (const r of reasons) lines.push(`  - ${escapeHtml(r.slice(0, 110))}`);
            }
            lines.push("");
          } else {
            const recs = (recsRes.data ?? []) as Array<{
              symbol: string; confidence: number; expected_next_day_pct: number | null;
              entry_min: number | null; entry_max: number | null; target: number | null; stop_loss: number | null;
              reasons_ar: unknown;
            }>;
            if (recs.length) {
              lines.push(`🎯 <b>أبرز توصيات الشراء الحديثة:</b>`);
              for (const r of recs) {
                const exp = r.expected_next_day_pct != null ? ` · متوقع +${Number(r.expected_next_day_pct).toFixed(1)}%` : "";
                lines.push(`• <b>${escapeHtml(r.symbol)}</b> — ثقة ${r.confidence}%${exp}`);
              }
              lines.push("");
            }
          }

          // أخبار الليلة
          const news = (newsRes.data ?? []) as Array<{
            symbol: string; headline: string; sentiment_score: number; sentiment: string | null;
          }>;
          if (news.length) {
            lines.push("📰 <b>أبرز أخبار الليلة:</b>");
            for (const n of news.slice(0, 5)) {
              const emoji = (n.sentiment_score ?? 0) > 0.15 ? "📈" : (n.sentiment_score ?? 0) < -0.15 ? "📉" : "•";
              lines.push(`${emoji} ${escapeHtml(n.symbol)}: ${escapeHtml((n.headline ?? "").slice(0, 110))}`);
            }
            lines.push("");
          }

          // المراكز المفتوحة
          const positions = (positionsRes.data ?? []) as unknown as Array<{
            symbol: string; entry_price: number; current_price: number | null; pnl_pct: number | null;
          }>;
          if (positions.length) {
            lines.push(`💼 <b>المراكز المفتوحة (${positions.length}):</b>`);
            for (const p of positions.slice(0, 6)) {
              const pnl = p.pnl_pct != null ? `${Number(p.pnl_pct).toFixed(2)}%` : "—";
              const arrow = (p.pnl_pct ?? 0) >= 0 ? "🟢" : "🔴";
              lines.push(`${arrow} ${escapeHtml(p.symbol)} — PnL ${pnl}`);
            }
            lines.push("");
          }

          if (lines.length <= 4) {
            lines.push("لا توجد بيانات كافية للعرض هذا الصباح — سيتم التحديث بعد فتح السوق.");
          }

          lines.push("");
          lines.push("⚡ بالتوفيق في تداول اليوم");

          const tg = await sendTelegram(lines.join("\n"));
          return Response.json({
            ok: true,
            telegram: tg,
            news: news.length,
            picks: picks.length,
            positions: positions.length,
          });
        } catch (e) {
          console.error("[premarket-brief] error", e);
          return Response.json({ ok: false, error: (e as Error).message }, { status: 200 });
        }
      },
    },
  },
});