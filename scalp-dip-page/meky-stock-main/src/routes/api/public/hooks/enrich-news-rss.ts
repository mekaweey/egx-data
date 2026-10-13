import { createFileRoute } from "@tanstack/react-router";
import { enrichNewsFromRss } from "@/lib/news-enrich/rss-enrich.server";

/**
 * ADDITIVE hook — يكمّل تغطية الأخبار من RSS مجاناً عن طريق Groq.
 * بيكتب في نفس جدول news_sentiment اللي بتقرأ منه طبقة Elite،
 * من غير ما يلمس أي منطق في الاستراتيجية الحالية.
 *
 * شغّله يومياً (أو كل ساعة) من cron job. آمن للاستدعاء المتكرر بفضل
 * فحص الدبليكيت في آخر 7 أيام.
 */
export const Route = createFileRoute("/api/public/hooks/enrich-news-rss")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const result = await enrichNewsFromRss({ maxPerSymbol: 5 });
          return Response.json({ ok: true, ...result });
        } catch (e) {
          return Response.json(
            { ok: false, error: (e as Error).message },
            { status: 500 },
          );
        }
      },
      GET: async () => {
        // Allow GET too for easy cron pings
        try {
          const result = await enrichNewsFromRss({ maxPerSymbol: 5 });
          return Response.json({ ok: true, ...result });
        } catch (e) {
          return Response.json(
            { ok: false, error: (e as Error).message },
            { status: 500 },
          );
        }
      },
    },
  },
});