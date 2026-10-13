/**
 * RSS → Groq → news_sentiment enrichment.
 *
 * ADDITIVE & ZERO-IMPACT:
 *  - Reads only public RSS feeds + writes to news_sentiment.
 *  - Does NOT touch strategy.server, rule-gate, daily-picks logic, or any
 *    other code. Just enriches the same table that Firecrawl writes to.
 *  - Dedupe against existing rows in the last 7 days.
 *  - All errors swallowed per-symbol; one bad stock never blocks the rest.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchRssItemsForSymbol } from "@/lib/market-data/news-rss.server";
import { chatWithFallback } from "@/lib/ai/chat-fallback.server";

type Sentiment = "positive" | "negative" | "neutral";

interface AnalyzedHeadline {
  headline: string;
  score: number; // -1..1
  sentiment: Sentiment;
  impact_level: "high" | "medium" | "low";
  pubDate: string | null;
}

function classify(score: number): { sentiment: Sentiment; impact_level: "high" | "medium" | "low" } {
  const sentiment: Sentiment = score >= 0.3 ? "positive" : score <= -0.3 ? "negative" : "neutral";
  const abs = Math.abs(score);
  const impact_level = abs >= 0.7 ? "high" : abs >= 0.4 ? "medium" : "low";
  return { sentiment, impact_level };
}

function parseDate(s: string): string | null {
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Send a batch of headlines (for one symbol) to Groq/Gemini and get
 * { sentiment_score: -1..1 } per headline in JSON.
 */
async function analyzeBatch(symbol: string, nameAr: string, headlines: string[]): Promise<number[]> {
  if (headlines.length === 0) return [];
  const prompt = `أنت محلل أخبار مالية لسهم ${symbol} (${nameAr}) في البورصة المصرية.
لكل عنوان، أعطِ score من -1 (سلبي جداً) إلى +1 (إيجابي جداً) من منظور تأثيره المتوقع على سعر السهم خلال 5 أيام.
ركّز على: أرباح، صفقات، توسع، عقود، توزيعات، تخفيضات، خسائر، تحقيقات، تخفيض تصنيف.
تجاهل العناوين العامة أو غير المتعلقة بالسهم تحديداً (أعطها 0).

أعد JSON فقط بهذا الشكل:
{"scores":[0.5,-0.3,...]}
(نفس ترتيب العناوين، نفس العدد)

العناوين:
${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}`;

  const raw = await chatWithFallback({
    messages: [
      { role: "system", content: "Return strict JSON only. No markdown." },
      { role: "user", content: prompt },
    ],
    temperature: 0,
    timeoutMs: 12000,
  });
  if (!raw) return headlines.map(() => 0);

  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return headlines.map(() => 0);
    const parsed = JSON.parse(m[0]) as { scores?: unknown };
    const arr = Array.isArray(parsed.scores) ? parsed.scores : [];
    return headlines.map((_, i) => {
      const v = Number(arr[i]);
      if (!Number.isFinite(v)) return 0;
      return Math.max(-1, Math.min(1, v));
    });
  } catch {
    return headlines.map(() => 0);
  }
}

async function existingHeadlines(symbol: string): Promise<Set<string>> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabaseAdmin
    .from("news_sentiment")
    .select("headline")
    .eq("symbol", symbol)
    .gte("published_at", since);
  const set = new Set<string>();
  for (const r of data ?? []) {
    if (r.headline) set.add(String(r.headline).trim());
  }
  return set;
}

export interface EnrichResult {
  stocks_scanned: number;
  stocks_with_matches: number;
  headlines_analyzed: number;
  rows_inserted: number;
  errors: string[];
}

export async function enrichNewsFromRss(opts?: { maxPerSymbol?: number }): Promise<EnrichResult> {
  const maxPerSymbol = opts?.maxPerSymbol ?? 5;
  const result: EnrichResult = {
    stocks_scanned: 0,
    stocks_with_matches: 0,
    headlines_analyzed: 0,
    rows_inserted: 0,
    errors: [],
  };

  const { data: stocks, error } = await supabaseAdmin
    .from("stocks")
    .select("symbol, name_ar")
    .eq("is_active", true);
  if (error) {
    result.errors.push(`stocks: ${error.message}`);
    return result;
  }
  if (!stocks || stocks.length === 0) return result;
  result.stocks_scanned = stocks.length;

  // Process in small batches to keep concurrency low (Worker friendly)
  const CONCURRENCY = 4;
  for (let i = 0; i < stocks.length; i += CONCURRENCY) {
    const slice = stocks.slice(i, i + CONCURRENCY);
    await Promise.all(
      slice.map(async (s) => {
        try {
          const items = await fetchRssItemsForSymbol({
            symbol: s.symbol,
            nameAr: s.name_ar ?? s.symbol,
            limit: maxPerSymbol,
          });
          if (items.length === 0) return;

          const existing = await existingHeadlines(s.symbol);
          const fresh: AnalyzedHeadline[] = [];
          const toAnalyze = items.filter((it) => !existing.has(it.title.trim()));
          if (toAnalyze.length === 0) return;

          const scores = await analyzeBatch(
            s.symbol,
            s.name_ar ?? s.symbol,
            toAnalyze.map((it) => it.title),
          );
          result.headlines_analyzed += toAnalyze.length;

          for (let j = 0; j < toAnalyze.length; j++) {
            const it = toAnalyze[j];
            const sc = scores[j] ?? 0;
            // Skip near-zero noise to keep table clean
            if (Math.abs(sc) < 0.15) continue;
            const { sentiment, impact_level } = classify(sc);
            fresh.push({
              headline: it.title.trim(),
              score: sc,
              sentiment,
              impact_level,
              pubDate: parseDate(it.pubDate),
            });
          }
          if (fresh.length === 0) return;

          result.stocks_with_matches += 1;
          const rows = fresh.map((f) => ({
            symbol: s.symbol,
            headline: f.headline,
            source_name: "rss-groq",
            published_at: f.pubDate ?? new Date().toISOString(),
            sentiment: f.sentiment,
            sentiment_score: f.score,
            impact_level: f.impact_level,
            ai_model: "llama-3.3-70b-versatile",
          }));

          const { error: insErr } = await supabaseAdmin.from("news_sentiment").insert(rows);
          if (insErr) {
            result.errors.push(`${s.symbol}: ${insErr.message}`);
          } else {
            result.rows_inserted += rows.length;
          }
        } catch (e) {
          result.errors.push(`${s.symbol}: ${(e as Error).message}`);
        }
      }),
    );
  }

  return result;
}