/**
 * Firecrawl → Mubasher per-symbol news enrichment.
 *
 * ADDITIVE & ZERO-IMPACT:
 *  - Reads Mubasher news page per active stock via Firecrawl.
 *  - Sends headlines to Groq/Gemini for sentiment scoring.
 *  - Writes to news_sentiment with source_name='mubasher-firecrawl'.
 *  - Dedup against existing rows (last 14 days) by headline.
 *  - Skips weak scores (|score| < 0.15).
 *  - All per-symbol errors swallowed.
 */

import Firecrawl from "@mendable/firecrawl-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { chatWithFallback } from "@/lib/ai/chat-fallback.server";

type Sentiment = "positive" | "negative" | "neutral";
type Impact = "high" | "medium" | "low";

interface Headline {
  title: string;
  url: string | null;
}

function classify(score: number): { sentiment: Sentiment; impact_level: Impact } {
  const sentiment: Sentiment =
    score >= 0.3 ? "positive" : score <= -0.3 ? "negative" : "neutral";
  const abs = Math.abs(score);
  const impact_level: Impact = abs >= 0.7 ? "high" : abs >= 0.4 ? "medium" : "low";
  return { sentiment, impact_level };
}

/**
 * Pull markdown links from Mubasher symbol news page and filter to /news/ items.
 * Mubasher headline links look like:
 *   https://www.mubasher.info/news/<id>/<arabic-slug>/
 */
function extractHeadlines(markdown: string, limit: number): Headline[] {
  const out: Headline[] = [];
  const seen = new Set<string>();
  // Markdown link: [text](url)
  const re = /\[([^\]]+)\]\((https?:\/\/www\.mubasher\.info\/news\/[^\s)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    const title = m[1].trim().replace(/\s+/g, " ");
    const url = m[2].trim();
    if (title.length < 10) continue;
    if (seen.has(title)) continue;
    seen.add(title);
    out.push({ title, url });
    if (out.length >= limit) break;
  }
  return out;
}

async function scrapeMubasher(symbol: string): Promise<string | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return null;
  const client = new Firecrawl({ apiKey });
  const url = `https://www.mubasher.info/markets/EGX/stocks/${symbol}/news/`;
  try {
    const res = await client.scrape(url, {
      formats: ["markdown"],
      onlyMainContent: true,
    });
    const md =
      (res as { markdown?: string }).markdown ??
      (res as { data?: { markdown?: string } }).data?.markdown ??
      null;
    return typeof md === "string" ? md : null;
  } catch {
    return null;
  }
}

async function analyzeBatch(
  symbol: string,
  nameAr: string,
  headlines: string[],
): Promise<number[]> {
  if (headlines.length === 0) return [];
  const prompt = `أنت محلل أخبار مالية لسهم ${symbol} (${nameAr}) في البورصة المصرية.
لكل عنوان، أعطِ score من -1 (سلبي جداً) إلى +1 (إيجابي جداً) من منظور تأثيره المتوقع على سعر السهم خلال 5 أيام.
ركّز على: أرباح، صفقات، توسع، عقود، توزيعات، تخفيضات، خسائر، تحقيقات، تخفيض تصنيف.
تجاهل العناوين العامة أو غير المتعلقة بالسهم تحديداً (أعطها 0).

أعد JSON فقط:
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
    timeoutMs: 15000,
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
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
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

export interface MubasherEnrichResult {
  stocks_scanned: number;
  stocks_with_page: number;
  stocks_with_matches: number;
  headlines_found: number;
  headlines_analyzed: number;
  rows_inserted: number;
  errors: string[];
}

export async function enrichNewsFromMubasher(opts?: {
  maxPerSymbol?: number;
  concurrency?: number;
  onlySymbols?: string[];
}): Promise<MubasherEnrichResult> {
  const maxPerSymbol = opts?.maxPerSymbol ?? 8;
  const concurrency = opts?.concurrency ?? 3;
  const result: MubasherEnrichResult = {
    stocks_scanned: 0,
    stocks_with_page: 0,
    stocks_with_matches: 0,
    headlines_found: 0,
    headlines_analyzed: 0,
    rows_inserted: 0,
    errors: [],
  };

  let query = supabaseAdmin
    .from("stocks")
    .select("symbol, name_ar")
    .eq("is_active", true);
  if (opts?.onlySymbols && opts.onlySymbols.length > 0) {
    query = query.in("symbol", opts.onlySymbols);
  }
  const { data: stocks, error } = await query;
  if (error) {
    result.errors.push(`stocks: ${error.message}`);
    return result;
  }
  if (!stocks || stocks.length === 0) return result;
  result.stocks_scanned = stocks.length;

  for (let i = 0; i < stocks.length; i += concurrency) {
    const slice = stocks.slice(i, i + concurrency);
    await Promise.all(
      slice.map(async (s) => {
        try {
          const md = await scrapeMubasher(s.symbol);
          if (!md) return;
          result.stocks_with_page += 1;

          const items = extractHeadlines(md, maxPerSymbol);
          if (items.length === 0) return;
          result.headlines_found += items.length;

          const existing = await existingHeadlines(s.symbol);
          const toAnalyze = items.filter(
            (it) => !existing.has(it.title.trim()),
          );
          if (toAnalyze.length === 0) return;

          const scores = await analyzeBatch(
            s.symbol,
            s.name_ar ?? s.symbol,
            toAnalyze.map((it) => it.title),
          );
          result.headlines_analyzed += toAnalyze.length;

          const rows: Array<{
            symbol: string;
            headline: string;
            source_url: string | null;
            source_name: string;
            published_at: string;
            sentiment: Sentiment;
            sentiment_score: number;
            impact_level: Impact;
            ai_model: string;
          }> = [];

          for (let j = 0; j < toAnalyze.length; j++) {
            const it = toAnalyze[j];
            const sc = scores[j] ?? 0;
            if (Math.abs(sc) < 0.15) continue;
            const { sentiment, impact_level } = classify(sc);
            rows.push({
              symbol: s.symbol,
              headline: it.title.trim(),
              source_url: it.url,
              source_name: "mubasher-firecrawl",
              published_at: new Date().toISOString(),
              sentiment,
              sentiment_score: sc,
              impact_level,
              ai_model: "gemini-2.5-flash",
            });
          }
          if (rows.length === 0) return;

          result.stocks_with_matches += 1;
          const { error: insErr } = await supabaseAdmin
            .from("news_sentiment")
            .insert(rows);
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