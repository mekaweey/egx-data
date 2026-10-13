import { c as createServerRpc } from "./createServerRpc-BEwYw6bn.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:http";
import "node:stream";
import "node:stream/promises";
import "node:https";
import "node:http2";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
const SCANNER_URL = "https://scanner.tradingview.com/egypt/scan";
function n(v) {
  if (v == null) return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}
function baseSymbol(sym) {
  return sym.toUpperCase().replace(/\.R$/i, "").replace(/-R$/i, "").replace(/_R$/i, "").replace(/R$/i, "").trim();
}
async function fetchRights() {
  const body = {
    filter: [{
      left: "type",
      operation: "in_range",
      right: ["right"]
    }],
    columns: ["name", "description", "close", "change", "volume", "type"],
    range: [0, 200],
    sort: {
      sortBy: "change",
      sortOrder: "desc"
    }
  };
  try {
    const res = await fetch(SCANNER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://www.tradingview.com",
        Referer: "https://www.tradingview.com/",
        "User-Agent": "Mozilla/5.0"
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data ?? []).map((row) => {
      const sym = row.d[0] ?? row.s.split(":").pop() ?? "";
      return {
        symbol: String(sym).toUpperCase(),
        description: row.d[1] ?? null,
        close: Number(row.d[2] ?? 0),
        change_pct: n(row.d[3]),
        volume: n(row.d[4])
      };
    });
  } catch {
    return [];
  }
}
const getRightsOpportunities_createServerFn_handler = createServerRpc({
  id: "df57b0716da4007094d7413b8e05c61cff4396d2332b800ea65cf26502ddc4f7",
  name: "getRightsOpportunities",
  filename: "src/lib/rights/rights-scan.functions.ts"
}, (opts) => getRightsOpportunities.__executeServer(opts));
const getRightsOpportunities = createServerFn({
  method: "GET"
}).handler(getRightsOpportunities_createServerFn_handler, async () => {
  const rights = await fetchRights();
  const {
    data: stocks
  } = await supabaseAdmin.from("stocks").select("symbol, name_ar, sector_ar, is_sharia");
  const stockMap = new Map((stocks ?? []).map((s) => [s.symbol.toUpperCase(), s]));
  const picks = rights.map((r) => {
    const base = baseSymbol(r.symbol);
    const parent = stockMap.get(base) ?? stockMap.get(r.symbol);
    const change = r.change_pct ?? 0;
    const liquid = (r.volume ?? 0) > 1e3;
    let recommendation;
    let reason;
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
      reason_ar: reason
    };
  });
  picks.sort((a, b) => (b.change_pct ?? -999) - (a.change_pct ?? -999));
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    sharia: picks.filter((p) => p.is_sharia),
    others: picks.filter((p) => !p.is_sharia)
  };
});
export {
  getRightsOpportunities_createServerFn_handler
};
