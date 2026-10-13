/**
 * Fundamentals fetcher — uses TradingView scanner extended columns
 * to grab P/E, P/B, dividend yield, market cap for EGX stocks in a
 * single bulk request. Free, no API key, same source as our price data.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SCANNER_URL = "https://scanner.tradingview.com/egypt/scan";
const FUNDAMENTALS_TIMEOUT_MS = 5_000;

const FUND_COLUMNS = [
  "price_earnings_ttm",
  "price_book_fq",
  "return_on_equity",
  "debt_to_equity",
  "market_cap_basic",
  "dividend_yield_recent",
  "earnings_per_share_basic_ttm",
  "earnings_release_next_date",
] as const;

export type Fundamentals = {
  symbol: string;
  pe_ratio: number | null;
  pb_ratio: number | null;
  roe: number | null;
  debt_to_equity: number | null;
  market_cap_egp: number | null;
  dividend_yield: number | null;
  earnings_per_share: number | null;
  next_earnings_date: string | null;
};

function n(v: unknown): number | null {
  if (v == null) return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}

export async function fetchFundamentals(symbols: string[]): Promise<Map<string, Fundamentals>> {
  if (symbols.length === 0) return new Map();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FUNDAMENTALS_TIMEOUT_MS);
  const body = {
    symbols: { tickers: symbols.map((s) => `EGX:${s.toUpperCase()}`) },
    columns: [...FUND_COLUMNS],
  };
  const out = new Map<string, Fundamentals>();
  try {
    const res = await fetch(SCANNER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Origin: "https://www.tradingview.com",
        Referer: "https://www.tradingview.com/",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
      body: JSON.stringify(body),
    }).finally(() => clearTimeout(timeout));
    if (!res.ok) return out;
    const json = (await res.json()) as { data?: Array<{ s: string; d: unknown[] }> };
    for (const row of json.data ?? []) {
      const sym = row.s.split(":").pop()!.toUpperCase();
      const d = row.d;
      out.set(sym, {
        symbol: sym,
        pe_ratio: n(d[0]),
        pb_ratio: n(d[1]),
        roe: n(d[2]),
        debt_to_equity: n(d[3]),
        market_cap_egp: n(d[4]),
        dividend_yield: n(d[5]),
        earnings_per_share: n(d[6]),
        next_earnings_date: d[7] ? new Date(Number(d[7]) * 1000).toISOString().slice(0, 10) : null,
      });
    }
  } catch {
    // silent fail — scan continues without fundamentals
  }
  return out;
}

/** Persist today's fundamentals snapshot for the universe. */
export async function saveFundamentals(map: Map<string, Fundamentals>): Promise<void> {
  if (map.size === 0) return;
  const today = new Date().toISOString().slice(0, 10);
  const rows = Array.from(map.values()).map((f) => ({
    symbol: f.symbol,
    as_of: today,
    pe_ratio: f.pe_ratio,
    pb_ratio: f.pb_ratio,
    roe: f.roe,
    debt_to_equity: f.debt_to_equity,
    market_cap_egp: f.market_cap_egp,
    dividend_yield: f.dividend_yield,
    earnings_per_share: f.earnings_per_share,
    next_earnings_date: f.next_earnings_date,
    source: "tradingview",
  }));
  await supabaseAdmin.from("fundamentals").upsert(rows, { onConflict: "symbol,as_of" });
}

/**
 * Score fundamentals 0-100 based on standard value/quality factors.
 * Returns null if no data available.
 */
export function scoreFundamentals(f: Fundamentals | undefined | null): number | null {
  if (!f) return null;
  let score = 50; // neutral baseline
  let signals = 0;

  // P/E: 5-15 great, 15-25 ok, 25+ expensive, negative = losing money
  if (f.pe_ratio != null) {
    signals++;
    if (f.pe_ratio < 0) score -= 15;
    else if (f.pe_ratio < 10) score += 15;
    else if (f.pe_ratio < 18) score += 8;
    else if (f.pe_ratio < 28) score += 0;
    else score -= 8;
  }
  // P/B: <1 cheap, 1-3 fair, >3 expensive
  if (f.pb_ratio != null) {
    signals++;
    if (f.pb_ratio < 1) score += 10;
    else if (f.pb_ratio < 2.5) score += 5;
    else if (f.pb_ratio < 5) score += 0;
    else score -= 5;
  }
  // ROE: >20 great, 10-20 ok, <5 weak
  if (f.roe != null) {
    signals++;
    if (f.roe > 20) score += 12;
    else if (f.roe > 10) score += 6;
    else if (f.roe > 0) score += 0;
    else score -= 10;
  }
  // D/E: <50% healthy, 50-100 ok, >150 risky
  if (f.debt_to_equity != null) {
    signals++;
    if (f.debt_to_equity < 50) score += 5;
    else if (f.debt_to_equity < 100) score += 0;
    else if (f.debt_to_equity < 150) score -= 3;
    else score -= 8;
  }
  // Dividend yield bonus
  if (f.dividend_yield != null && f.dividend_yield > 3) score += 3;

  if (signals === 0) return null;
  return Math.max(0, Math.min(100, score));
}

/**
 * Hard block: avoid buying within 3 days of earnings announcement
 * (post-earnings moves are unpredictable).
 */
export function isEarningsBlackout(f: Fundamentals | undefined | null): boolean {
  if (!f?.next_earnings_date) return false;
  const days = Math.ceil(
    (new Date(f.next_earnings_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  return days >= 0 && days <= 3;
}