import type { Candle, MarketDataProvider } from "./types";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Synthetic OHLCV provider — last-resort fallback so the analysis pipeline
 * always has enough data to compute indicators and run AI. Generates a
 * deterministic-but-realistic random walk seeded by the symbol around a
 * known recent EGX30 anchor price.
 */

// Last-known real anchor closing prices (EGP) — updated May 2026 from
// real Yahoo data. Only used if DB has no cached real snapshot for the
// symbol yet.
const ANCHOR_PRICES: Record<string, number> = {
  COMI: 133.51, HRHO: 26.92, EKHO: 0.67, EKHOA: 24.13, SWDY: 88.51,
  ETEL: 95.75, EAST: 40.0, TMGH: 98.99, PHDC: 13.69, HELI: 6.52,
  ORAS: 71.05, ORWE: 22.05, JUFO: 27.94, EFIH: 21.75,
  FWRY: 19.43, CIEB: 23.82, ADIB: 47.5, FAIT: 38.3, HDBK: 143.47,
  SKPC: 17.69, AMOC: 8.7, ABUK: 88.99, MFPC: 44.51,
  OCDI: 21.48, EGCH: 14.32, CCAP: 5.34, ISPH: 11.8,
};

async function getDbAnchor(base: string): Promise<number | null> {
  try {
    const { data } = await supabaseAdmin
      .from("stock_snapshots")
      .select("close, data_provider, ts")
      .eq("symbol", base)
      .in("data_provider", ["yahoo", "cached:yahoo", "alphavantage"])
      .order("ts", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data && data.close != null) return Number(data.close);
  } catch {
    // ignore — fall back to hardcoded anchor
  }
  return null;
}

function seededRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function hashSymbol(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const syntheticProvider: MarketDataProvider = {
  name: "synthetic",
  async fetchOHLCV(yahooSymbol: string, days: number): Promise<Candle[]> {
    const base = yahooSymbol.replace(/\.CA$/i, "").toUpperCase();
    const dbAnchor = await getDbAnchor(base);
    const anchor = dbAnchor ?? ANCHOR_PRICES[base] ?? 20;
    const rnd = seededRng(hashSymbol(base));

    const total = Math.max(days, 120);
    // Mild drift + ~1.8% daily volatility, mean-reverting toward anchor.
    const volatility = 0.018;
    const meanReversion = 0.04;

    let price = anchor * (0.9 + rnd() * 0.2);
    const candles: Candle[] = [];
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    for (let i = total - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() - i);
      // skip Fri/Sat (EGX weekend)
      const dow = date.getUTCDay();
      if (dow === 5 || dow === 6) continue;

      const shock = (rnd() - 0.5) * 2 * volatility;
      const pull = (anchor - price) / anchor * meanReversion;
      const ret = shock + pull;
      const open = price;
      const close = Math.max(0.01, price * (1 + ret));
      const high = Math.max(open, close) * (1 + rnd() * 0.008);
      const low = Math.min(open, close) * (1 - rnd() * 0.008);
      const volume = Math.round((500_000 + rnd() * 4_000_000));

      candles.push({
        date: date.toISOString(),
        open: round(open),
        high: round(high),
        low: round(low),
        close: round(close),
        volume,
      });
      price = close;
    }
    return candles;
  },
};

function round(n: number) {
  return Math.round(n * 100) / 100;
}