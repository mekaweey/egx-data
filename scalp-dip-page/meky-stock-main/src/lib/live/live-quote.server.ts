import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { mubasherScraper } from "./mubasher.server";
import { investingScraper } from "./investing.server";
import { egxScraper } from "./egx.server";
import { extractPriceWithAI } from "./ai-parser.server";
import type { LiveTick, LiveScraper } from "./types";

const SCRAPERS: LiveScraper[] = [mubasherScraper, investingScraper, egxScraper];

async function lastTick(symbol: string): Promise<LiveTick | null> {
  // Pull the last ~10 ticks (any source) and reject outliers vs the median.
  // Why: Thunder's Firebase feed occasionally leaks non-trade fields
  // (bid/ask/prev close) into the price stream — e.g. AJWA briefly logged 143
  // and 173.5 between 176.2 ticks. Returning the raw "latest" row would feed
  // the scalp strategy a phantom entry price. A 5% median guard is enough to
  // drop those without slowing real moves (EGX intraday rarely jumps that fast).
  const { data } = await supabaseAdmin
    .from("live_ticks")
    .select("symbol,price,volume,source,ts")
    .eq("symbol", symbol)
    .order("ts", { ascending: false })
    .limit(10);
  const rows = (data ?? []).filter((r) => Number.isFinite(+r.price) && +r.price > 0);
  if (!rows.length) return null;
  const sorted = [...rows.map((r) => +r.price)].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const within5 = (p: number) => Math.abs(p - median) / median <= 0.05;
  const clean = rows.find((r) => within5(+r.price)) ?? rows[0];
  return { symbol: clean.symbol, price: +clean.price, volume: clean.volume, source: clean.source as LiveTick["source"], ts: clean.ts };
}

function isPlausible(price: number, last: LiveTick | null): boolean {
  if (!(price > 0 && price < 100000)) return false;
  if (!last) return true;
  const diff = Math.abs(price - last.price) / last.price;
  return diff < 0.20;
}

/**
 * Try ONE scraper (round-robin index) for this symbol. On parse-fail, retry
 * via AI self-healing. Persists tick to live_ticks. Returns the tick or null.
 */
export async function fetchLiveTick(
  symbol: string,
  yahooSymbol: string,
  investingSlug: string | null | undefined,
  preferredIdx: number,
): Promise<LiveTick | null> {
  const last = await lastTick(symbol);
  const order = [
    SCRAPERS[preferredIdx % SCRAPERS.length],
    ...SCRAPERS.filter((_, i) => i !== preferredIdx % SCRAPERS.length),
  ];

  for (const scraper of order) {
    try {
      const tick = await scraper.fetchTick(symbol, yahooSymbol, investingSlug);
      if (!isPlausible(tick.price, last)) {
        continue;
      }
      await supabaseAdmin.from("live_ticks").insert({
        symbol, price: tick.price, volume: tick.volume ?? null,
        source: tick.source, ts: tick.ts,
        meta: (tick.meta ?? null) as never,
      });
      return tick;
    } catch (e) {
      const html = (e as Error & { html?: string }).html;
      if (html) {
        const aiPrice = await extractPriceWithAI(symbol, html);
        if (aiPrice && isPlausible(aiPrice, last)) {
          const tick: LiveTick = {
            symbol, price: aiPrice, source: "ai-fallback",
            ts: new Date().toISOString(),
            meta: { recovered_from: scraper.name },
          };
          await supabaseAdmin.from("live_ticks").insert({
            symbol, price: tick.price, source: tick.source, ts: tick.ts,
            meta: tick.meta as never,
          });
          return tick;
        }
      }
    }
  }
  return null;
}

/** Get the most recent tick for a symbol (read-only). */
export async function getLatestTick(symbol: string): Promise<LiveTick | null> {
  return lastTick(symbol);
}

/** Get all ticks for a symbol within the ORB window (10:00-10:30 Cairo). */
export async function getTicksBetween(symbol: string, fromIso: string, toIso: string): Promise<LiveTick[]> {
  const { data } = await supabaseAdmin
    .from("live_ticks")
    .select("symbol,price,volume,source,ts")
    .eq("symbol", symbol)
    .gte("ts", fromIso)
    .lte("ts", toIso)
    .order("ts", { ascending: true });
  return (data ?? []).map((r) => ({
    symbol: r.symbol, price: +r.price, volume: r.volume,
    source: r.source as LiveTick["source"], ts: r.ts,
  }));
}