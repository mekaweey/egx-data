import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchOHLCV } from "@/lib/market-data/index.server";
import type { Database } from "@/integrations/supabase/types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(yahooSymbol: string, days: number) {
  // Up to 2 tries — Firecrawl handles upstream throttling internally.
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await fetchOHLCV(yahooSymbol, days);
    } catch (e) {
      lastErr = e;
      await sleep(1000);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/**
 * Backfill `daily_candles` with historical OHLCV for every active stock.
 * Sequential (not parallel) to avoid Yahoo rate limiting; falls back to
 * AlphaVantage / Synthetic providers automatically via fetchOHLCV.
 * Default 500 trading days (~2 years).
 */
export const backfillHistory = createServerFn({ method: "POST" })
  .inputValidator((data: { days?: number; offset?: number; limit?: number }) => ({
    days: Math.max(90, Math.min(1825, data.days ?? 500)),
    offset: Math.max(0, data.offset ?? 0),
    limit: Math.max(1, Math.min(50, data.limit ?? 8)),
  }))
  .handler(async ({ data }) => {
    const { days, offset, limit } = data;

    const { data: stocksData, error: stocksErr } = await supabaseAdmin
      .from("stocks")
      .select("symbol, yahoo_symbol")
      .eq("is_active", true);
    if (stocksErr || !stocksData?.length) {
      throw new Error(`no active stocks: ${stocksErr?.message ?? "empty"}`);
    }
    const allStocks = stocksData;
    const stocks = allStocks.slice(offset, offset + limit);

    const startedAt = Date.now();
    const failed: string[] = [];
    const providerCounts: Record<string, number> = {};
    const rows: Database["public"]["Tables"]["daily_candles"]["Insert"][] = [];

    // Process in parallel with a small concurrency cap so we don't blow worker
    // wall-time. Firecrawl typical scrape latency is 4-8s; with concurrency=5
    // we finish 30 symbols in ~60s.
    const CONCURRENCY = 5;
    let cursor = 0;
    async function worker() {
      while (cursor < stocks.length) {
        const s = stocks[cursor++];
        try {
          const result = await fetchWithRetry(s.yahoo_symbol, days);
          providerCounts[result.provider] = (providerCounts[result.provider] ?? 0) + 1;
          for (const c of result.candles) {
            rows.push({
              symbol: s.symbol.toUpperCase(),
              date: c.date.slice(0, 10),
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
              volume: Math.round(c.volume),
            });
          }
        } catch {
          failed.push(s.symbol);
        }
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, stocks.length) }, worker),
    );

    let candlesInserted = 0;
    const CHUNK = 500;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { error } = await supabaseAdmin
        .from("daily_candles")
        .upsert(rows.slice(i, i + CHUNK), { onConflict: "symbol,date" });
      if (error) throw new Error(`upsert failed at chunk ${i}: ${error.message}`);
      candlesInserted += rows.slice(i, i + CHUNK).length;
    }

    // Log to data_source_logs so future debug is easier.
    const providerSummary = Object.entries(providerCounts)
      .map(([p, n]) => `${p}:${n}`)
      .join(", ");
    await supabaseAdmin.from("data_source_logs").insert({
      provider: "yahoo-backfill",
      ok: failed.length < stocks.length,
      candles_count: candlesInserted,
      latency_ms: Date.now() - startedAt,
      error:
        (failed.length ? `failed for: ${failed.join(", ")}` : null) ??
        (providerSummary ? `providers: ${providerSummary}` : null),
    });

    const nextOffset = offset + stocks.length;
    return {
      symbolsTotal: allStocks.length,
      symbolsProcessed: stocks.length - failed.length,
      candlesInserted,
      failed,
      daysRequested: days,
      providerBreakdown: providerCounts,
      nextOffset,
      done: nextOffset >= allStocks.length,
    };
  });

/**
 * Quick stats for the UI to know whether backfill is needed.
 */
export const getCandlesStats = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin.rpc("candles_stats");
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return {
    totalCandles: Number(row?.total_candles ?? 0),
    distinctSymbols: Number(row?.distinct_symbols ?? 0),
    minDate: row?.min_date ?? null,
    maxDate: row?.max_date ?? null,
  };
});