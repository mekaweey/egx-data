/**
 * Macro indicators — USD/EGP, gold, oil, S&P 500.
 * Uses TradingView scanner for all (no auth needed).
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SCANNER_URL = "https://scanner.tradingview.com/global/scan";
const MACRO_TIMEOUT_MS = 5_000;

type TickerSpec = { tv: string; key: "usd_egp" | "gold_usd" | "brent_oil_usd" | "sp500_close" | "msci_em_close" };

const MACRO_TICKERS: TickerSpec[] = [
  { tv: "FX_IDC:USDEGP", key: "usd_egp" },
  { tv: "TVC:GOLD", key: "gold_usd" },
  { tv: "TVC:UKOIL", key: "brent_oil_usd" },
  { tv: "SP:SPX", key: "sp500_close" },
  { tv: "MSCI:EMXC", key: "msci_em_close" },
];

export type MacroSnapshot = {
  as_of: string;
  usd_egp: number | null;
  gold_usd: number | null;
  brent_oil_usd: number | null;
  sp500_close: number | null;
  sp500_change_pct: number | null;
  msci_em_close: number | null;
};

export async function fetchMacroSnapshot(): Promise<MacroSnapshot | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MACRO_TIMEOUT_MS);
  const body = {
    symbols: { tickers: MACRO_TICKERS.map((t) => t.tv) },
    columns: ["close", "change"],
  };
  try {
    const res = await fetch(SCANNER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Origin: "https://www.tradingview.com",
        Referer: "https://www.tradingview.com/",
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify(body),
    }).finally(() => clearTimeout(timeout));
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: Array<{ s: string; d: unknown[] }> };
    const snap: MacroSnapshot = {
      as_of: new Date().toISOString().slice(0, 10),
      usd_egp: null,
      gold_usd: null,
      brent_oil_usd: null,
      sp500_close: null,
      sp500_change_pct: null,
      msci_em_close: null,
    };
    for (const row of json.data ?? []) {
      const spec = MACRO_TICKERS.find((t) => t.tv === row.s);
      if (!spec) continue;
      const close = Number(row.d?.[0]);
      const change = Number(row.d?.[1]);
      if (Number.isFinite(close)) snap[spec.key] = close;
      if (spec.key === "sp500_close" && Number.isFinite(change)) snap.sp500_change_pct = +change.toFixed(2);
    }
    return snap;
  } catch {
    return null;
  }
}

export async function saveMacro(snap: MacroSnapshot): Promise<void> {
  await supabaseAdmin.from("macro_indicators").upsert(snap, { onConflict: "as_of" });
}

/**
 * Macro context score 0-100 for EGX stocks.
 * Strong USD + falling SP500 + falling oil = headwind for EGX.
 */
export function scoreMacro(snap: MacroSnapshot | null): number {
  if (!snap) return 50;
  let score = 50;
  // SP500 up = global risk-on = good for EM
  if (snap.sp500_change_pct != null) {
    if (snap.sp500_change_pct > 0.5) score += 10;
    else if (snap.sp500_change_pct > 0) score += 5;
    else if (snap.sp500_change_pct < -1) score -= 10;
    else if (snap.sp500_change_pct < 0) score -= 5;
  }
  return Math.max(0, Math.min(100, score));
}