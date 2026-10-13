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
const STUCK_START_MS = 90 * 1e3;
const STUCK_TOTAL_MS = 6 * 60 * 1e3;
function staleScanMessage(scan) {
  const age = Date.now() - new Date(scan.started_at).getTime();
  if ((scan.stocks_count ?? 0) === 0 && age > STUCK_START_MS) {
    return "تم إيقاف مسح عالق تلقائياً: لم يبدأ جلب الأسهم خلال 90 ثانية";
  }
  if (age > STUCK_TOTAL_MS) {
    return "تم إيقاف مسح عالق تلقائياً بعد 6 دقائق";
  }
  return null;
}
async function getDashboardPayload() {
  let {
    data: scan
  } = await supabaseAdmin.from("scans").select("id, started_at, finished_at, status, stocks_count, ai_count, error_message").order("started_at", {
    ascending: false
  }).limit(1).maybeSingle();
  if (!scan) {
    return {
      scanId: null,
      startedAt: null,
      finishedAt: null,
      status: null,
      errorMessage: null,
      stocksCount: 0,
      aiCount: 0,
      rows: [],
      topPicks: [],
      dataProvider: null,
      isSynthetic: false
    };
  }
  if (scan.status === "running") {
    const staleMessage = staleScanMessage(scan);
    if (staleMessage) {
      const finishedAt = (/* @__PURE__ */ new Date()).toISOString();
      await supabaseAdmin.from("scans").update({
        status: "failed",
        finished_at: finishedAt,
        error_message: staleMessage
      }).eq("id", scan.id);
      scan = {
        ...scan,
        status: "failed",
        finished_at: finishedAt,
        error_message: staleMessage
      };
    }
  }
  const {
    data: snaps
  } = await supabaseAdmin.from("stock_snapshots").select("symbol, close, change_pct, rsi14, composite_score, vol_ratio, data_provider, stocks(name_ar, sector_ar)").eq("scan_id", scan.id).order("composite_score", {
    ascending: false
  });
  const {
    data: recos
  } = await supabaseAdmin.from("recommendations").select("symbol, signal, confidence, entry_min, entry_max, target, stop_loss, rr_ratio, position_size_pct, timeframe_days, entry_timing_ar, expected_gain_pct, expected_next_day_pct, market_trend, partial_exit_pct, max_hold_days, technical_score, fundamental_score, sentiment_score, macro_score, sector_score, ensemble_agreement, data_completeness").eq("scan_id", scan.id);
  const recoMap = new Map((recos ?? []).map((r) => [r.symbol, r]));
  const allRows = (snaps ?? []).map((s) => {
    const stockJoin = s.stocks;
    const r = recoMap.get(s.symbol);
    return {
      symbol: s.symbol,
      name_ar: stockJoin?.name_ar ?? s.symbol,
      sector_ar: stockJoin?.sector_ar ?? null,
      close: Number(s.close),
      change_pct: s.change_pct != null ? Number(s.change_pct) : null,
      rsi14: s.rsi14 != null ? Number(s.rsi14) : null,
      composite_score: Number(s.composite_score),
      vol_ratio: s.vol_ratio != null ? Number(s.vol_ratio) : null,
      signal: r?.signal ?? null,
      confidence: r?.confidence ?? null,
      entry_min: r?.entry_min != null ? Number(r.entry_min) : null,
      entry_max: r?.entry_max != null ? Number(r.entry_max) : null,
      target: r?.target != null ? Number(r.target) : null,
      stop_loss: r?.stop_loss != null ? Number(r.stop_loss) : null,
      rr_ratio: r?.rr_ratio != null ? Number(r.rr_ratio) : null,
      position_size_pct: r?.position_size_pct != null ? Number(r.position_size_pct) : null,
      timeframe_days: r?.timeframe_days ?? null,
      entry_timing_ar: r?.entry_timing_ar ?? null,
      expected_gain_pct: r?.expected_gain_pct != null ? Number(r.expected_gain_pct) : null,
      expected_next_day_pct: r?.expected_next_day_pct != null ? Number(r.expected_next_day_pct) : null,
      market_trend: r?.market_trend ?? null,
      partial_exit_pct: r?.partial_exit_pct != null ? Number(r.partial_exit_pct) : null,
      max_hold_days: r?.max_hold_days ?? null,
      technical_score: r?.technical_score != null ? Number(r.technical_score) : null,
      fundamental_score: r?.fundamental_score != null ? Number(r.fundamental_score) : null,
      sentiment_score: r?.sentiment_score != null ? Number(r.sentiment_score) : null,
      macro_score: r?.macro_score != null ? Number(r.macro_score) : null,
      sector_score: r?.sector_score != null ? Number(r.sector_score) : null,
      ensemble_agreement: r?.ensemble_agreement ?? null,
      data_completeness: r?.data_completeness ?? null
    };
  });
  const dashboardRows = allRows;
  const SIGNAL_RANK = {
    strong_buy: 5,
    buy: 4,
    neutral: 3,
    sell: 2,
    strong_sell: 1
  };
  const rows = [...dashboardRows].sort((a, b) => {
    const ra = SIGNAL_RANK[a.signal ?? "neutral"] ?? 0;
    const rb = SIGNAL_RANK[b.signal ?? "neutral"] ?? 0;
    if (rb !== ra) return rb - ra;
    const na = a.expected_next_day_pct ?? a.expected_gain_pct ?? -999;
    const nb = b.expected_next_day_pct ?? b.expected_gain_pct ?? -999;
    if (nb !== na) return nb - na;
    return b.composite_score - a.composite_score;
  });
  const topPicks = rows.filter((r) => r.signal === "strong_buy" || r.signal === "buy").sort((a, b) => {
    const moveA = a.expected_next_day_pct ?? (a.expected_gain_pct ?? 0) / 3;
    const moveB = b.expected_next_day_pct ?? (b.expected_gain_pct ?? 0) / 3;
    const scoreA = moveA * ((a.confidence ?? 0) / 100);
    const scoreB = moveB * ((b.confidence ?? 0) / 100);
    return scoreB - scoreA;
  }).slice(0, 3);
  return {
    scanId: scan.id,
    startedAt: scan.started_at,
    finishedAt: scan.finished_at,
    status: scan.status,
    errorMessage: scan.error_message,
    stocksCount: scan.stocks_count,
    aiCount: scan.ai_count,
    rows,
    topPicks,
    dataProvider: snaps?.[0]?.data_provider ?? null,
    isSynthetic: (snaps ?? []).some((s) => (s.data_provider ?? "").startsWith("synthetic"))
  };
}
const getDashboard_createServerFn_handler = createServerRpc({
  id: "39b0b075ab72fa74a7030092cbdda75deb8601a34a82200ba1e2e0f71556d80e",
  name: "getDashboard",
  filename: "src/lib/scan/dashboard.functions.ts"
}, (opts) => getDashboard.__executeServer(opts));
const getDashboard = createServerFn({
  method: "GET"
}).handler(getDashboard_createServerFn_handler, getDashboardPayload);
const getStockDetail_createServerFn_handler = createServerRpc({
  id: "7985742ccb6734d9e76fbb476aa655f32c1a06b7b710d0ca5d2c7e6746fc0570",
  name: "getStockDetail",
  filename: "src/lib/scan/dashboard.functions.ts"
}, (opts) => getStockDetail.__executeServer(opts));
const getStockDetail = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(getStockDetail_createServerFn_handler, async ({
  data
}) => {
  const {
    data: stock
  } = await supabaseAdmin.from("stocks").select("symbol, name_ar, sector_ar, yahoo_symbol").eq("symbol", data.symbol).maybeSingle();
  if (!stock) return null;
  const {
    data: snap
  } = await supabaseAdmin.from("stock_snapshots").select("*").eq("symbol", data.symbol).order("ts", {
    ascending: false
  }).limit(1).maybeSingle();
  let reco = null;
  if (snap) {
    const {
      data: r
    } = await supabaseAdmin.from("recommendations").select("*").eq("scan_id", snap.scan_id).eq("symbol", data.symbol).maybeSingle();
    reco = r ?? null;
  }
  let history = [];
  try {
    const {
      fetchOHLCV
    } = await import("./index.server-dCC-yXdp.mjs");
    const ohlcv = await fetchOHLCV(stock.yahoo_symbol, 120);
    history = ohlcv.candles.slice(-90).map((c) => ({
      date: c.date.slice(0, 10),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume
    }));
  } catch (e) {
    console.error("history fetch failed:", e);
  }
  return {
    symbol: stock.symbol,
    name_ar: stock.name_ar,
    sector_ar: stock.sector_ar,
    snapshot: snap ?? null,
    recommendation: reco,
    history
  };
});
export {
  getDashboard_createServerFn_handler,
  getStockDetail_createServerFn_handler
};
