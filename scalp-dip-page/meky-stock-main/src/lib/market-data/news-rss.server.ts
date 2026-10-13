/**
 * Additive RSS news backup for Arabic financial sources.
 *
 * Used ONLY as a fallback when Firecrawl returns zero useful headlines for a
 * symbol — so when Firecrawl is working normally this code never runs and has
 * zero impact on cost, latency, or behavior of the main pipeline.
 *
 * Design rules:
 *  - No new npm dependency (plain fetch + tiny regex XML parse).
 *  - Hard 8s timeout per feed.
 *  - In-memory cache per Worker instance (15 min TTL) to avoid repeated fetches.
 *  - All errors swallowed — never throws to caller.
 */

type RssItem = { title: string; description: string; link: string; pubDate: string };

const FEEDS = [
  "https://arabic.investing.com/rss/news_25.rss", // أسواق الأسهم
  "https://arabic.investing.com/rss/news_285.rss", // أخبار الشركات
  "https://arabic.investing.com/rss/news.rss", // عام
];

const CACHE_TTL_MS = 15 * 60 * 1000;
let cache: { ts: number; items: RssItem[] } | null = null;
let inflight: Promise<RssItem[]> | null = null;

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function pickTag(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decodeEntities(m[1]) : "";
}

function parseRssXml(xml: string): RssItem[] {
  const out: RssItem[] = [];
  const itemRegex = /<item[\s>][\s\S]*?<\/item>/gi;
  const matches = xml.match(itemRegex) ?? [];
  for (const block of matches) {
    const title = pickTag(block, "title");
    if (!title) continue;
    out.push({
      title,
      description: pickTag(block, "description"),
      link: pickTag(block, "link"),
      pubDate: pickTag(block, "pubDate"),
    });
  }
  return out;
}

async function fetchOneFeed(url: string): Promise<RssItem[]> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 MekyStockBot/1.0" },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssXml(xml);
  } catch {
    return [];
  }
}

async function loadAllFeeds(): Promise<RssItem[]> {
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) return cache.items;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const all = (await Promise.all(FEEDS.map(fetchOneFeed))).flat();
      // de-dupe by title
      const seen = new Set<string>();
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

/**
 * Returns up to `limit` recent Arabic headlines that mention the symbol or
 * company name. Safe to call from any path — never throws.
 */
export async function fetchRssHeadlinesForSymbol(args: {
  symbol: string;
  nameAr: string;
  limit?: number;
}): Promise<string[]> {
  try {
    const items = await loadAllFeeds();
    if (items.length === 0) return [];
    const sym = args.symbol.toLowerCase();
    const name = (args.nameAr || "").toLowerCase();
    const nameStem = name.length >= 6 ? name.slice(0, 8) : name;
    const matches = items.filter((it) => {
      const hay = `${it.title} ${it.description}`.toLowerCase();
      return (sym && hay.includes(sym)) || (nameStem && hay.includes(nameStem));
    });
    return matches.slice(0, args.limit ?? 5).map((m) => m.title);
  } catch {
    return [];
  }
}

/** For diagnostics / pulse messages. */
export function getRssCacheStats() {
  return {
    cached_items: cache?.items.length ?? 0,
    cached_ts: cache?.ts ?? null,
    feeds: FEEDS.length,
  };
}

/**
 * Returns matching RSS items (with pubDate + link) for a symbol.
 * Additive — used by the enrich-news-rss hook. Never throws.
 */
export async function fetchRssItemsForSymbol(args: {
  symbol: string;
  nameAr: string;
  limit?: number;
}): Promise<Array<{ title: string; description: string; link: string; pubDate: string }>> {
  try {
    const items = await loadAllFeeds();
    if (items.length === 0) return [];
    const sym = args.symbol.toLowerCase();
    const name = (args.nameAr || "").toLowerCase();
    const nameStem = name.length >= 6 ? name.slice(0, 8) : name;
    const matches = items.filter((it) => {
      const hay = `${it.title} ${it.description}`.toLowerCase();
      return (sym && hay.includes(sym)) || (nameStem && hay.includes(nameStem));
    });
    return matches.slice(0, args.limit ?? 5);
  } catch {
    return [];
  }
}