import { createFileRoute } from "@tanstack/react-router";
import { enrichNewsFromMubasher } from "@/lib/news-enrich/mubasher-enrich.server";

/**
 * ADDITIVE hook — يكمّل تغطية الأخبار عبر Firecrawl على Mubasher per-symbol.
 * يكتب في نفس جدول news_sentiment، صفر تأثير على باقي المنطق.
 *
 * Query params (اختياري):
 *   ?max=8              عدد العناوين الأقصى لكل سهم
 *   ?symbols=COMI,HRHO  للاختبار على رموز محددة
 */
async function run(request: Request) {
  const url = new URL(request.url);
  const max = Number(url.searchParams.get("max") ?? "8");
  const symbolsParam = url.searchParams.get("symbols");
  const onlySymbols = symbolsParam
    ? symbolsParam.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)
    : undefined;

  try {
    const result = await enrichNewsFromMubasher({
      maxPerSymbol: Number.isFinite(max) && max > 0 ? max : 8,
      concurrency: 3,
      onlySymbols,
    });
    return Response.json({ ok: true, ...result });
  } catch (e) {
    return Response.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/public/hooks/enrich-news-mubasher")({
  server: {
    handlers: {
      GET: async ({ request }) => run(request),
      POST: async ({ request }) => run(request),
    },
  },
});