import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type RightsPick = {
  symbol: string;
  base_symbol: string;
  description: string | null;
  close: number;
  change_pct: number | null;
  volume: number | null;
  is_sharia: boolean;
  base_name_ar: string | null;
  base_sector_ar: string | null;
  recommendation: "شراء قوي" | "شراء" | "مراقبة" | "تجنّب";
  reason_ar: string;
};

const SCANNER_URL = "https://scanner.tradingview.com/egypt/scan";

function n(v: unknown): number | null {
  if (v == null) return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}

/** Strip common rights suffixes to get the parent stock symbol. */
function baseSymbol(sym: string): string {
  return sym
    .toUpperCase()
    .replace(/\.R$/i, "")
    .replace(/-R$/i, "")
    .replace(/_R$/i, "")
    .replace(/R$/i, "")
    .trim();
}

async function fetchRights(): Promise<
  Array<{ symbol: string; description: string | null; close: number; change_pct: number | null; volume: number | null }>
> {
  const body = {
    filter: [{ left: "type", operation: "in_range", right: ["right"] }],
    columns: ["name", "description", "close", "change", "volume", "type"],
    range: [0, 200],
    sort: { sortBy: "change", sortOrder: "desc" },
  };
  try {
    const res = await fetch(SCANNER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://www.tradingview.com",
        Referer: "https://www.tradingview.com/",
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: Array<{ s: string; d: unknown[] }> };
    return (json.data ?? []).map((row) => {
      const sym = (row.d[0] as string | undefined) ?? row.s.split(":").pop() ?? "";
      return {
        symbol: String(sym).toUpperCase(),
        description: (row.d[1] as string | null) ?? null,
        close: Number(row.d[2] ?? 0),
        change_pct: n(row.d[3]),
        volume: n(row.d[4]),
      };
    });
  } catch {
    return [];
  }
}

export const getRightsOpportunities = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ generatedAt: string; sharia: RightsPick[]; others: RightsPick[] }> => {
    const rights = await fetchRights();

    const { data: stocks } = await supabaseAdmin
      .from("stocks")
      .select("symbol, name_ar, sector_ar, is_sharia");
    const stockMap = new Map(
      (stocks ?? []).map((s) => [s.symbol.toUpperCase(), s]),
    );

    const picks: RightsPick[] = rights.map((r) => {
      const base = baseSymbol(r.symbol);
      const parent = stockMap.get(base) ?? stockMap.get(r.symbol);
      const change = r.change_pct ?? 0;
      const liquid = (r.volume ?? 0) > 1000;

      let recommendation: RightsPick["recommendation"];
      let reason: string;
      if (change >= 20 && liquid) {
        recommendation = "شراء قوي";
        reason = `زخم قوي جداً (+${change.toFixed(1)}%) مع سيولة جيدة`;
      } else if (change >= 5 && liquid) {
        recommendation = "شراء";
        reason = `اتجاه إيجابي (+${change.toFixed(1)}%) مع تداول نشط`;
      } else if (change >= -5) {
        recommendation = "مراقبة";
        reason = `حركة محايدة (${change.toFixed(1)}%) — انتظر إشارة أوضح`;
      } else {
        recommendation = "تجنّب";
        reason = `ضغط بيع (${change.toFixed(1)}%)`;
      }
      if (!liquid) reason += " • سيولة منخفضة، خطر تنفيذ";

      return {
        symbol: r.symbol,
        base_symbol: base,
        description: r.description,
        close: r.close,
        change_pct: r.change_pct,
        volume: r.volume,
        is_sharia: parent?.is_sharia ?? false,
        base_name_ar: parent?.name_ar ?? null,
        base_sector_ar: parent?.sector_ar ?? null,
        recommendation,
        reason_ar: reason,
      };
    });

    picks.sort((a, b) => (b.change_pct ?? -999) - (a.change_pct ?? -999));
    return {
      generatedAt: new Date().toISOString(),
      sharia: picks.filter((p) => p.is_sharia),
      others: picks.filter((p) => !p.is_sharia),
    };
  },
);