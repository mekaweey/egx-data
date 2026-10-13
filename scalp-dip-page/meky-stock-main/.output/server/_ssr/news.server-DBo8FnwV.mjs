import { i as index_default } from "../_libs/mendable__firecrawl-js.mjs";
import { g as generateText } from "../_libs/ai.mjs";
import { c as createOpenAICompatible } from "../_libs/ai-sdk__openai-compatible.mjs";
function pickProvider() {
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.LOVABLE_API_KEY) return "lovable";
  return "lovable";
}
function getAiGateway(providerOverride) {
  const provider = providerOverride ?? pickProvider();
  if (provider === "gemini") {
    return createOpenAICompatible({
      name: "gemini",
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
      headers: { Authorization: `Bearer ${process.env.GEMINI_API_KEY}` }
    });
  }
  if (provider === "groq") {
    return createOpenAICompatible({
      name: "groq",
      baseURL: "https://api.groq.com/openai/v1",
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }
    });
  }
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("No AI provider key configured");
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk"
    }
  });
}
function getAiModel(provider) {
  return provider === "lovable" ? "google/gemini-3-flash-preview" : provider === "groq" ? "llama-3.3-70b-versatile" : "gemini-2.5-flash";
}
function getAiProviderPlan(options = {}) {
  const plan = [];
  if (process.env.GROQ_API_KEY) plan.push("groq");
  if (process.env.GEMINI_API_KEY) plan.push("gemini");
  if (process.env.LOVABLE_API_KEY && (options.allowPaidFallback || plan.length === 0)) plan.push("lovable");
  return plan.map((provider) => ({ provider, model: getAiModel(provider) }));
}
const AI_MODEL = getAiModel(pickProvider());
const FEEDS = [
  "https://arabic.investing.com/rss/news_25.rss",
  // أسواق الأسهم
  "https://arabic.investing.com/rss/news_285.rss",
  // أخبار الشركات
  "https://arabic.investing.com/rss/news.rss"
  // عام
];
const CACHE_TTL_MS = 15 * 60 * 1e3;
let cache = null;
let inflight = null;
function decodeEntities(s) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/<[^>]+>/g, "").trim();
}
function pickTag(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decodeEntities(m[1]) : "";
}
function parseRssXml(xml) {
  const out = [];
  const itemRegex = /<item[\s>][\s\S]*?<\/item>/gi;
  const matches = xml.match(itemRegex) ?? [];
  for (const block of matches) {
    const title = pickTag(block, "title");
    if (!title) continue;
    out.push({
      title,
      description: pickTag(block, "description"),
      link: pickTag(block, "link"),
      pubDate: pickTag(block, "pubDate")
    });
  }
  return out;
}
async function fetchOneFeed(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8e3);
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 MekyStockBot/1.0" },
      signal: ctrl.signal
    });
    clearTimeout(t);
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssXml(xml);
  } catch {
    return [];
  }
}
async function loadAllFeeds() {
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) return cache.items;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const all = (await Promise.all(FEEDS.map(fetchOneFeed))).flat();
      const seen = /* @__PURE__ */ new Set();
      const items = all.filter((it) => {
        const k = it.title.trim();
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      cache = { ts: Date.now(), items };
      return items;
    } catch {
      return [];
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
async function fetchRssHeadlinesForSymbol(args) {
  try {
    const items = await loadAllFeeds();
    if (items.length === 0) return [];
    const sym = args.symbol.toLowerCase();
    const name = (args.nameAr || "").toLowerCase();
    const nameStem = name.length >= 6 ? name.slice(0, 8) : name;
    const matches = items.filter((it) => {
      const hay = `${it.title} ${it.description}`.toLowerCase();
      return sym && hay.includes(sym) || nameStem && hay.includes(nameStem);
    });
    return matches.slice(0, args.limit ?? 5).map((m) => m.title);
  } catch {
    return [];
  }
}
async function fetchRssItemsForSymbol(args) {
  try {
    const items = await loadAllFeeds();
    if (items.length === 0) return [];
    const sym = args.symbol.toLowerCase();
    const name = (args.nameAr || "").toLowerCase();
    const nameStem = name.length >= 6 ? name.slice(0, 8) : name;
    const matches = items.filter((it) => {
      const hay = `${it.title} ${it.description}`.toLowerCase();
      return sym && hay.includes(sym) || nameStem && hay.includes(nameStem);
    });
    return matches.slice(0, args.limit ?? 5);
  } catch {
    return [];
  }
}
async function aiScoreHeadlines(headlines, nameAr) {
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
        'أجب بـ JSON فقط: {"score": رقم بين -1 و 1, "reason": "سبب مختصر بالعربية"}.'
      ].join("\n"),
      prompt: [
        `السهم: ${nameAr}`,
        "العناوين:",
        ...headlines.map((h, i) => `${i + 1}. ${h}`),
        "أعطني JSON فقط."
      ].join("\n"),
      temperature: 0.1
    });
    const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("no JSON");
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    const score = Math.max(-1, Math.min(1, Number(parsed.score) || 0));
    let sentiment = "neutral";
    if (score > 0.3) sentiment = "positive";
    else if (score < -0.3) sentiment = "negative";
    else if (Math.abs(score) > 0.1) sentiment = "mixed";
    return { score: +score.toFixed(2), sentiment, reason: parsed.reason ?? "" };
  } catch {
    return fallback;
  }
}
function scoreHeadlinesHeuristically(headlines) {
  const text = headlines.join(" ").toLowerCase();
  const positiveWords = ["زيادة رأس المال", "توزيع", "أرباح", "نمو", "ارتفاع", "استحواذ", "تعاقد", "حقوق", "اكتتاب", "تراجع الخسائر"];
  const negativeWords = ["خسائر", "تراجع الأرباح", "انخفاض", "غرامة", "إيقاف", "تحقيق", "مديونية", "هبوط"];
  let score = 0;
  for (const word of positiveWords) if (text.includes(word.toLowerCase())) score += 0.22;
  for (const word of negativeWords) if (text.includes(word.toLowerCase())) score -= 0.25;
  score = Math.max(-1, Math.min(1, score));
  const sentiment = score > 0.3 ? "positive" : score < -0.3 ? "negative" : Math.abs(score) > 0.1 ? "mixed" : "neutral";
  return {
    score: +score.toFixed(2),
    sentiment,
    reason: score === 0 ? "تحليل احتياطي: الأخبار محايدة أو غير مؤثرة بوضوح" : "تحليل احتياطي بالكلمات المالية المهمة"
  };
}
function isUsefulNewsHeadline(title, symbol, nameAr) {
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
    "ملخص مالي"
  ];
  if (noise.some((x) => lower.includes(x.toLowerCase()))) return false;
  const hasCompany = lower.includes(symbol.toLowerCase()) || lower.includes(nameAr.toLowerCase().slice(0, 8));
  const hasMarketEvent = /أرباح|خسائر|توزيع|كوبون|استحواذ|تعاقد|زيادة رأس المال|حقوق|اكتتاب|مجلس الإدارة|عمومية|نتائج أعمال|إفصاح|بورصة|سهم|شركة/.test(t);
  return hasCompany || hasMarketEvent;
}
async function fetchStockNews(args) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return {
      symbol: args.symbol,
      found: false,
      headlines: [],
      sentiment_hint: "neutral",
      summary_ar: "لا توجد أخبار (Firecrawl غير مهيأ)",
      sentiment_score: 0
    };
  }
  const client = new index_default({ apiKey });
  const query = `أخبار سهم ${args.nameAr} ${args.symbol} البورصة المصرية (site:mubasher.info OR site:investing.com OR site:borsaat.com OR site:youm7.com OR site:ahram.org.eg OR site:masrawy.com)`;
  try {
    const res = await Promise.race([
      client.search(query, {
        limit: 5,
        sources: ["news", "web"],
        location: "Egypt",
        tbs: "qdr:w"
      }),
      new Promise((_, rej) => setTimeout(() => rej(new Error("news timeout")), 12e3))
    ]);
    const r = res;
    const items = [
      ...Array.isArray(r.news) ? r.news : [],
      ...Array.isArray(r.web) ? r.web : [],
      ...Array.isArray(r.data) ? r.data : []
    ];
    const headlines = items.map((r2) => (r2.title ?? "").trim()).filter((t) => isUsefulNewsHeadline(t, args.symbol, args.nameAr)).slice(0, 5);
    if (headlines.length === 0) {
      try {
        const rss = await fetchRssHeadlinesForSymbol({
          symbol: args.symbol,
          nameAr: args.nameAr,
          limit: 5
        });
        const rssFiltered = rss.filter(
          (t) => isUsefulNewsHeadline(t, args.symbol, args.nameAr)
        );
        if (rssFiltered.length > 0) {
          const ai2 = await aiScoreHeadlines(rssFiltered, args.nameAr);
          return {
            symbol: args.symbol,
            found: true,
            headlines: rssFiltered,
            sentiment_hint: ai2.sentiment,
            summary_ar: rssFiltered.slice(0, 3).join(" • "),
            sentiment_score: ai2.score,
            reason_ar: `${ai2.reason} (مصدر RSS احتياطي)`
          };
        }
      } catch {
      }
      return {
        symbol: args.symbol,
        found: false,
        headlines: [],
        sentiment_hint: "neutral",
        summary_ar: "لا أخبار حديثة",
        sentiment_score: 0
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
      reason_ar: ai.reason
    };
  } catch (e) {
    return {
      symbol: args.symbol,
      found: false,
      headlines: [],
      sentiment_hint: "neutral",
      summary_ar: `تعذّر جلب الأخبار: ${e instanceof Error ? e.message : String(e)}`,
      sentiment_score: 0
    };
  }
}
async function fetchNewsBulk(stocks, concurrency = 4) {
  const cached = await loadCachedNews(stocks.map((s) => s.symbol));
  if (cached.size > 0) return cached;
  const out = /* @__PURE__ */ new Map();
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
  try {
    const { ragStoreNews } = await import("./tier-k-intelligence.server-IqAM99dH.mjs");
    const tasks = [];
    for (const [sym, n] of out.entries()) {
      for (const h of (n.headlines ?? []).slice(0, 3)) {
        const headline = typeof h === "string" ? h : h.title ?? "";
        if (!headline) continue;
        tasks.push(
          ragStoreNews({
            symbol: sym,
            headline,
            sentimentScore: n.sentiment_score ?? 0,
            publishedAt: null
          }).catch(() => {
          })
        );
      }
    }
    void Promise.all(tasks);
  } catch {
  }
  return out;
}
async function loadCachedNews(symbols) {
  const out = /* @__PURE__ */ new Map();
  if (!symbols.length) return out;
  try {
    const { supabaseAdmin } = await import("./client.server-D5ro3rAQ.mjs");
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3).toISOString();
    const { data } = await supabaseAdmin.from("news_sentiment").select("symbol, headline, summary_ar, sentiment, sentiment_score, published_at, created_at").in("symbol", symbols).gte("created_at", since).order("created_at", { ascending: false }).limit(80);
    for (const row of data ?? []) {
      const sym = String(row.symbol).toUpperCase();
      const prev = out.get(sym);
      const headline = String(row.headline ?? "").trim();
      const headlines = headline ? [...prev?.headlines ?? [], headline].slice(0, 5) : prev?.headlines ?? [];
      const score = Number(row.sentiment_score ?? 0);
      const sentiment_hint = score > 0.3 ? "positive" : score < -0.3 ? "negative" : Math.abs(score) > 0.1 ? "mixed" : "neutral";
      out.set(sym, {
        symbol: sym,
        found: headlines.length > 0,
        headlines,
        sentiment_hint,
        summary_ar: String(row.summary_ar ?? (headlines.slice(0, 3).join(" • ") || "أخبار محفوظة محايدة")),
        sentiment_score: Number.isFinite(score) ? score : 0,
        reason_ar: "أخبار محفوظة من آخر 7 أيام لتسريع المسح"
      });
    }
  } catch {
    return /* @__PURE__ */ new Map();
  }
  return out;
}
export {
  AI_MODEL as A,
  getAiProviderPlan as a,
  fetchRssItemsForSymbol as b,
  fetchNewsBulk as f,
  getAiGateway as g
};
