import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTelegram } from "@/lib/notifications/telegram.server";
import { escapeHtml } from "@/lib/utils/html-escape";

/**
 * Pre-market Gap Alert — runs daily ~9:15 AM Cairo, before market opens (10:00).
 * Scans overnight news (last 14h) joined with today's pending recommendations,
 * flags symbols with strong sentiment (≥0.6) and pushes a fast Telegram alert
 * so the user can pre-position on potential gap-ups.
 */
export const Route = createFileRoute("/api/public/hooks/premarket-gap-alert")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const since = new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString();

          // Get strong overnight news
          const { data: news } = await supabaseAdmin
            .from("news_sentiment")
            .select("symbol, headline, sentiment_score, published_at")
            .gte("published_at", since)
            .gte("sentiment_score", 0.6)
            .order("sentiment_score", { ascending: false })
            .limit(30);

          if (!news || news.length === 0) {
            return Response.json({ ok: true, alerts: 0, reason: "no strong overnight news" });
          }

          // Group by symbol — keep max sentiment headline per symbol
          const bySymbol = new Map<string, { headline: string; score: number }>();
          for (const n of news) {
            const s = String(n.symbol);
            const cur = bySymbol.get(s);
            const score = Number(n.sentiment_score ?? 0);
            if (!cur || score > cur.score) {
              bySymbol.set(s, { headline: String(n.headline ?? ""), score });
            }
          }

          const symbols = [...bySymbol.keys()];
          if (symbols.length === 0) {
            return Response.json({ ok: true, alerts: 0 });
          }

          // Cross-reference with today's recommendations (if any) for context
          const today = new Date(); today.setHours(0, 0, 0, 0);
          const { data: recs } = await supabaseAdmin
            .from("recommendations")
            .select("symbol, confidence, target, price_at_reco, expected_gain_pct")
            .in("symbol", symbols)
            .gte("created_at", today.toISOString());

          const recMap = new Map(recs?.map((r) => [String(r.symbol), r]) ?? []);

          // Get names
          const { data: stocks } = await supabaseAdmin
            .from("stocks")
            .select("symbol, name_ar")
            .in("symbol", symbols);
          const nameMap = new Map(stocks?.map((s) => [String(s.symbol), String(s.name_ar)]) ?? []);

          const lines: string[] = ["🌅 <b>تنبيه ما قبل الافتتاح — أخبار قوية بالليل</b>", ""];
          let count = 0;
          for (const sym of symbols.slice(0, 10)) {
            const info = bySymbol.get(sym)!;
            const rec = recMap.get(sym);
            const name = escapeHtml(nameMap.get(sym) || sym);
            const sentPct = (info.score * 100).toFixed(0);
            lines.push(`📈 <b>${name}</b> (${sym})`);
            lines.push(`   مشاعر: +${sentPct}%`);
            if (rec) {
              lines.push(`   ✅ موصى به النهارده — ثقة ${rec.confidence}%`);
            }
            const truncated = escapeHtml(info.headline.length > 80 ? info.headline.slice(0, 80) + "…" : info.headline);
            lines.push(`   "${truncated}"`);
            lines.push("");
            count++;
          }
          lines.push("⚠️ راقب الافتتاح — احتمال فجوة سعرية صاعدة");

          await sendTelegram(lines.join("\n"));
          return Response.json({ ok: true, alerts: count });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("premarket-gap-alert failed:", msg);
          return Response.json({ ok: false, error: msg }, { status: 200 });
        }
      },
    },
  },
});