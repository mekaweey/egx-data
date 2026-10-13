import Firecrawl from "@mendable/firecrawl-js";
import { generateText } from "ai";
import { AI_MODEL, getAiGateway } from "@/lib/ai/gateway.server";
import { fetchRssHeadlinesForSymbol } from "./news-rss.server";

export type StockNews = {
  symbol: string;
  found: boolean;
  headlines: string[];
  sentiment_hint: "positive" | "negative" | "mixed" | "neutral";
  summary_ar: string;
  sentiment_score: number; // -1 (very negative) → +1 (very positive)
  reason_ar?: string;
};

/**
 * Use the AI gateway to score Arabic headlines on a -1..+1 scale.
 * This replaces the previous naive keyword matching which mis-classified
 * headlines like "تراجع الخسائر" (positive) as negative.
 */
async function aiScoreHeadlines(
  headlines: string[],
  nameAr: string,
): Promise<{ score: number; sentiment: StockNews["sentiment_hint"]; reason: string }> {
  const fallback = scoreHeadlinesHeuristically(headlines);
  try {
    const gateway = getAiGateway();
    const model = gateway(AI_MODEL);
    const { text } = await generateText({
      model,
      system: [
        "أنت محلل أخبار مالية للبورصة المصرية.",
        "قيّم تأثير العناوين على سعر السهم على مقياس من -1 (سلبي جداً) إلى +1 (إيجابي جداً).",
        "انتبه للسياق: 'تراجع الخسائر' = إيجابي. 'أرباح أقل من المتوقع' = سلبي. 'صفقة استحواذ' = إيجابي عادة.",
        "أجب بـ JSON فقط: {\"score\": رقم بين -1 و 1, \"reason\": \"سبب مختصر بالعربية\"}.",
      ].join("\n"),
      prompt: [
        `السهم: ${nameAr}`,
        "العناوين:",
        ...headlines.map((h, i) => `${i + 1}. ${h}`),
        "أعطني JSON فقط.",
      ].join("\n"),
      temperature: 0.1,
    });
    const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("no JSON");
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as { score?: number; reason?: string };
    const score = Math.max(-1, Math.min(1, Number(parsed.score) || 0));
    let sentiment: StockNews["sentiment_hint"] = "neutral";
    if (score > 0.3) sentiment = "positive";
    else if (score < -0.3) sentiment = "negative";
    else if (Math.abs(score) > 0.1) sentiment = "mixed";
    return { score: +score.toFixed(2), sentiment, reason: parsed.reason ?? "" };
  } catch {
    return fallback;
  }
}

function scoreHeadlinesHeuristically(
  headlines: string[],
): { score: number; sentiment: StockNews["sentiment_hint"]; reason: string } {
  const text = headlines.join(" ").toLowerCase();
  const positiveWords = ["زيادة رأس المال", "توزيع", "أرباح", "نمو", "ارتفاع", "استحواذ", "تعاقد", "حقوق", "اكتتاب", "تراجع الخسائر"];
  const negativeWords = ["خسائر", "تراجع الأرباح", "انخفاض", "غرامة", "إيقاف", "تحقيق", "مديونية", "هبوط"];
  let score = 0;
  for (const word of positiveWords) if (text.includes(word.toLowerCase())) score += 0.22;
  for (const word of negativeWords) if (text.includes(word.toLowerCase())) score -= 0.25;
  score = Math.max(-1, Math.min(1, score));
  const sentiment: StockNews["sentiment_hint"] = score > 0.3 ? "positive" : score < -0.3 ? "negative" : Math.abs(score) > 0.1 ? "mixed" : "neutral";
  return {
    score: +score.toFixed(2),
    sentiment,
    reason: score === 0 ? "تحليل احتياطي: الأخبار محايدة أو غير مؤثرة بوضوح" : "تحليل احتياطي بالكلمات المالية المهمة",
  };
}

function isUsefulNewsHeadline(title: string, symbol: string, nameAr: string): boolean {
  const t = title.trim();
  if (t.length < 12) return false;
  const lower = t.toLowerCase();
  const noise = [
    "سعر سهم",
    "مباشر",
    "البيانات التاريخية",
    "التحليل الفني",
    "إحصائيات تداول",
    "الرسم البياني",
    "منتدى",
    "ملخص مالي",
  ];
  if (noise.some((x) => lower.includes(x.toLowerCase()))) return false;
  const hasCompany = lower.includes(symbol.toLowerCase()) || lower.includes(nameAr.toLowerCase().slice(0, 8));
  const hasMarketEvent = /أرباح|خسائر|توزيع|كوبون|استحواذ|تعاقد|زيادة رأس المال|حقوق|اكتتاب|مجلس الإدارة|عمومية|نتائج أعمال|إفصاح|بورصة|سهم|شركة/.test(t);
  return hasCompany || hasMarketEvent;
}

/**
 * Fetch recent Arabic news for a single Egyptian-stock symbol via Firecrawl.
 * Then score sentiment via the AI gateway (not keyword matching).
 */
export async function fetchStockNews(args: {
  symbol: string;
  nameAr: string;
}): Promise<StockNews> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return {
      symbol: args.symbol,
      found: false,
      headlines: [],
      sentiment_hint: "neutral",
      summary_ar: "لا توجد أخبار (Firecrawl غير مهيأ)",
      sentiment_score: 0,
    };
  }

  const client = new Firecrawl({ apiKey });
  // ✨ بنركّز على المصادر المصرية/العربية المالية لتغطية أعمق للأسهم الصغيرة
  const query = `أخبار سهم ${args.nameAr} ${args.symbol} البورصة المصرية (site:mubasher.info OR site:investing.com OR site:borsaat.com OR site:youm7.com OR site:ahram.org.eg OR site:masrawy.com)`;

  try {
    const res = await Promise.race([
      client.search(query, {
        limit: 5,
        sources: ["news", "web"],
        location: "Egypt",
        tbs: "qdr:w",
      }),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("news timeout")), 12000)),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = res as any;
    const items: Array<{ title?: string; description?: string }> = [
      ...(Array.isArray(r.news) ? r.news : []),
      ...(Array.isArray(r.web) ? r.web : []),
      ...(Array.isArray(r.data) ? r.data : []),
    ];

    const headlines = items
      .map((r) => (r.title ?? "").trim())
      .filter((t) => isUsefulNewsHeadline(t, args.symbol, args.nameAr))
      .slice(0, 5);

    if (headlines.length === 0) {
      // Additive RSS fallback — only runs when Firecrawl returned nothing.
      // Fully wrapped in try/catch + 8s timeout inside the helper; cannot
      // affect normal Firecrawl-success path.
      try {
        const rss = await fetchRssHeadlinesForSymbol({
          symbol: args.symbol,
          nameAr: args.nameAr,
          limit: 5,
        });
        const rssFiltered = rss.filter((t) =>
          isUsefulNewsHeadline(t, args.symbol, args.nameAr),
        );
        if (rssFiltered.length > 0) {
          const ai = await aiScoreHeadlines(rssFiltered, args.nameAr);
          return {
            symbol: args.symbol,
            found: true,
            headlines: rssFiltered,
            sentiment_hint: ai.sentiment,
            summary_ar: rssFiltered.slice(0, 3).join(" • "),
            sentiment_score: ai.score,
            reason_ar: `${ai.reason} (مصدر RSS احتياطي)`,
          };
        }
      } catch {
        // swallow — fall through to neutral response below
      }

      return {
        symbol: args.symbol,
        found: false,
        headlines: [],
        sentiment_hint: "neutral",
        summary_ar: "لا أخبار حديثة",
        sentiment_score: 0,
      };
    }

    const ai = await aiScoreHeadlines(headlines, args.nameAr);

    return {
      symbol: args.symbol,
      found: true,
      headlines,
      sentiment_hint: ai.sentiment,
      summary_ar: headlines.slice(0, 3).join(" • "),
      sentiment_score: ai.score,
      reason_ar: ai.reason,
    };
  } catch (e) {
    return {
      symbol: args.symbol,
      found: false,
      headlines: [],
      sentiment_hint: "neutral",
      summary_ar: `تعذّر جلب الأخبار: ${e instanceof Error ? e.message : String(e)}`,
      sentiment_score: 0,
    };
  }
}

/**
 * Fetch news for many symbols in parallel with concurrency cap.
 */
export async function fetchNewsBulk(
  stocks: Array<{ symbol: string; nameAr: string }>,
  concurrency = 4,
): Promise<Map<string, StockNews>> {
  const cached = await loadCachedNews(stocks.map((s) => s.symbol));
  if (cached.size > 0) return cached;

  const out = new Map<string, StockNews>();
  let i = 0;
  async function worker() {
    while (i < stocks.length) {
      const idx = i++;
      const s = stocks[idx];
      const news = await fetchStockNews(s);
      out.set(s.symbol.toUpperCase(), news);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, stocks.length) }, worker));

  // Tier-K.1 — fire-and-forget: store each headline as a vector for future RAG.
  // Failures are silent and never block the scan.
  try {
    const { ragStoreNews } = await import("@/lib/integration/tier-k-intelligence.server");
    const tasks: Array<Promise<void>> = [];
    for (const [sym, n] of out.entries()) {
      for (const h of (n.headlines ?? []).slice(0, 3)) {
        const headline = typeof h === "string" ? h : (h as { title?: string }).title ?? "";
        if (!headline) continue;
        tasks.push(
          ragStoreNews({
            symbol: sym,
            headline,
            sentimentScore: n.sentiment_score ?? 0,
            publishedAt: null,
          }).catch(() => {}),
        );
      }
    }
    // don't await — let it run in background
    void Promise.all(tasks);
  } catch {}

  return out;
}

async function loadCachedNews(symbols: string[]): Promise<Map<string, StockNews>> {
  const out = new Map<string, StockNews>();
  if (!symbols.length) return out;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabaseAdmin
      .from("news_sentiment")
      .select("symbol, headline, summary_ar, sentiment, sentiment_score, published_at, created_at")
      .in("symbol", symbols)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(80);
    for (const row of data ?? []) {
      const sym = String(row.symbol).toUpperCase();
      const prev = out.get(sym);
      const headline = String(row.headline ?? "").trim();
      const headlines = headline ? [...(prev?.headlines ?? []), headline].slice(0, 5) : (prev?.headlines ?? []);
      const score = Number(row.sentiment_score ?? 0);
      const sentiment_hint: StockNews["sentiment_hint"] = score > 0.3 ? "positive" : score < -0.3 ? "negative" : Math.abs(score) > 0.1 ? "mixed" : "neutral";
      out.set(sym, {
        symbol: sym,
        found: headlines.length > 0,
        headlines,
        sentiment_hint,
        summary_ar: String(row.summary_ar ?? (headlines.slice(0, 3).join(" • ") || "أخبار محفوظة محايدة")),
        sentiment_score: Number.isFinite(score) ? score : 0,
        reason_ar: "أخبار محفوظة من آخر 7 أيام لتسريع المسح",
      });
    }
  } catch {
    return new Map();
  }
  return out;
}