import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchNewsBulk } from "@/lib/market-data/news.server";

/**
 * Daily job — يجلب أخبار كل الأسهم النشطة من مصادر متعددة عبر Firecrawl
 * (news + web)، يحلّلها بالذكاء الاصطناعي، ويخزّن النتيجة في news_sentiment
 * عشان تستخدمها استراتيجية الترشيح (positive boost / negative block).
 */
export const Route = createFileRoute("/api/public/hooks/fetch-news-all")({
  server: {
    handlers: {
      POST: async () => {
        const { data: stocks, error } = await supabaseAdmin
          .from("stocks")
          .select("symbol, name_ar")
          .eq("is_active", true);
        if (error) {
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }
        if (!stocks || stocks.length === 0) {
          return Response.json({ ok: true, processed: 0 });
        }

        const list = stocks.map((s) => ({
          symbol: s.symbol,
          nameAr: s.name_ar ?? s.symbol,
        }));

        const map = await fetchNewsBulk(list, 4);

        let saved = 0;
        const errors: string[] = [];
        for (const [symbol, news] of map.entries()) {
          if (!news.found || news.headlines.length === 0) continue;

          const score = Number(news.sentiment_score) || 0;
          const sentiment: "positive" | "negative" | "neutral" =
            score >= 0.3 ? "positive" : score <= -0.3 ? "negative" : "neutral";
          const abs = Math.abs(score);
          const impact_level: "high" | "medium" | "low" =
            abs >= 0.7 ? "high" : abs >= 0.4 ? "medium" : "low";

          const rows = news.headlines.slice(0, 3).map((h) => ({
            symbol,
            headline: h,
            summary_ar: news.summary_ar?.slice(0, 500) ?? null,
            source_name: "firecrawl",
            published_at: new Date().toISOString(),
            sentiment,
            sentiment_score: score,
            impact_level,
            ai_model: "gemini-2.5-flash",
          }));

          const { error: insErr } = await supabaseAdmin
            .from("news_sentiment")
            .insert(rows);
          if (insErr) errors.push(`${symbol}: ${insErr.message}`);
          else saved += rows.length;
        }

        return Response.json({
          ok: true,
          stocks: stocks.length,
          news_inserted: saved,
          errors: errors.slice(0, 10),
        });
      },
    },
  },
});