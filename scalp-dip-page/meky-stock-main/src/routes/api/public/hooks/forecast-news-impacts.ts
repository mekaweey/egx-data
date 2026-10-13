import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTelegram } from "@/lib/notifications/telegram.server";
import { escapeHtml } from "@/lib/utils/html-escape";
import { forecastAndPersistNews } from "@/lib/notifications/news-impact-forecast.server";
import { describeImpactWindowAr } from "@/lib/notifications/egx-calendar.server";

/**
 * Forecast News Impacts — يمشي على آخر 24 ساعة أخبار، يتنبأ بالأفق الزمني
 * (قصير/متوسط/طويل) و يوم التأثير المتوقع (مع تخطّي الجمعة/السبت)، يخزّنها
 * كذاكرة طويلة المدى، و يبعت تنبيه تليجرام مختصر بالأخبار المهمة و خاصة
 * أخبار حقوق الاكتتاب.
 *
 * Additive entirely — ما بيأثرش على أي pipeline قائم.
 */
export const Route = createFileRoute("/api/public/hooks/forecast-news-impacts")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { data: news } = await supabaseAdmin
            .from("news_sentiment")
            .select("id, symbol, headline, sentiment_score, published_at, created_at")
            .gte("created_at", since)
            .order("created_at", { ascending: false })
            .limit(80);

          if (!news || news.length === 0) {
            return Response.json({ ok: true, processed: 0 });
          }

          const results: Array<{
            symbol: string; headline: string; horizon: string; category: string;
            isRights: boolean; impactStart: Date; publishedAt: Date;
            direction: string; magnitude: number | null; confidence: number;
            explanation: string; baladi: string;
          }> = [];

          // Process with light concurrency to respect LLM quota
          const BATCH = 3;
          for (let i = 0; i < news.length; i += BATCH) {
            const slice = news.slice(i, i + BATCH);
            const out = await Promise.all(slice.map(async (n) => {
              const fc = await forecastAndPersistNews({
                symbol: n.symbol,
                headline: n.headline,
                newsId: n.id,
                publishedAt: n.published_at ? new Date(n.published_at) : new Date(n.created_at as string),
                sentimentScore: n.sentiment_score,
              });
              if (!fc) return null;
              return {
                symbol: fc.symbol, headline: fc.headline, horizon: fc.horizon,
                category: fc.category, isRights: fc.isRightsRelated,
                impactStart: fc.impactStart, publishedAt: fc.publishedAt,
                direction: fc.direction, magnitude: fc.magnitudePct,
                confidence: fc.confidence, explanation: fc.explanationAr,
                baladi: fc.baladiSummary,
              };
            }));
            for (const o of out) if (o) results.push(o);
          }

          // Build digest — prioritize rights + high-confidence + medium/long horizon
          const rights = results.filter((r) => r.isRights);
          const strong = results
            .filter((r) => !r.isRights && r.confidence >= 65)
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 8);

          const lines: string[] = [];
          lines.push("🧠 <b>تنبؤات تأثير الأخبار</b>");
          lines.push("");

          if (rights.length) {
            lines.push("📜 <b>حقوق اكتتاب / زيادة رأس مال:</b>");
            for (const r of rights.slice(0, 10)) {
              const dirEmoji = r.direction === "up" ? "🟢" : r.direction === "down" ? "🔴" : "⚪";
              const mag = r.magnitude != null ? ` ${r.magnitude > 0 ? "+" : ""}${Number(r.magnitude).toFixed(1)}%` : "";
              lines.push(`${dirEmoji} <b>${escapeHtml(r.symbol)}</b> — ${escapeHtml(r.headline.slice(0, 90))}`);
              lines.push(`  ${describeImpactWindowAr(r.publishedAt, r.impactStart, r.horizon as "short" | "medium" | "long")}`);
              lines.push(`  ثقة ${r.confidence}%${mag} · ${escapeHtml(r.explanation.slice(0, 140))}`);
              if (r.baladi) lines.push(`  🗣️ ${escapeHtml(r.baladi.slice(0, 140))}`);
            }
            lines.push("");
          }

          if (strong.length) {
            lines.push("⚡ <b>أخبار ذات تأثير قوي:</b>");
            for (const r of strong) {
              const dirEmoji = r.direction === "up" ? "🟢" : r.direction === "down" ? "🔴" : "⚪";
              const mag = r.magnitude != null ? ` ${r.magnitude > 0 ? "+" : ""}${Number(r.magnitude).toFixed(1)}%` : "";
              lines.push(`${dirEmoji} <b>${escapeHtml(r.symbol)}</b> [${r.category}] — ${escapeHtml(r.headline.slice(0, 90))}`);
              lines.push(`  ${describeImpactWindowAr(r.publishedAt, r.impactStart, r.horizon as "short" | "medium" | "long")}`);
              lines.push(`  ثقة ${r.confidence}%${mag}`);
              if (r.baladi) lines.push(`  🗣️ ${escapeHtml(r.baladi.slice(0, 130))}`);
            }
            lines.push("");
          }

          let telegram: { ok: boolean; error?: string } | null = null;
          if (rights.length || strong.length) {
            lines.push(`<i>📊 تم تحليل ${results.length} خبر و حفظ التأثير المتوقع للرجوع له لاحقاً.</i>`);
            telegram = await sendTelegram(lines.join("\n"));
          }

          return Response.json({
            ok: true,
            processed: results.length,
            rights: rights.length,
            strong: strong.length,
            telegram,
          });
        } catch (e) {
          console.error("[forecast-news-impacts] error", e);
          return Response.json({ ok: false, error: (e as Error).message }, { status: 200 });
        }
      },
    },
  },
});