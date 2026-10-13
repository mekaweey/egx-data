import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

type SnapshotRow = Database["public"]["Tables"]["stock_snapshots"]["Row"];
type RecommendationRow = Database["public"]["Tables"]["recommendations"]["Row"];

export type DashboardRow = {
  symbol: string;
  name_ar: string;
  sector_ar: string | null;
  close: number;
  change_pct: number | null;
  rsi14: number | null;
  composite_score: number;
  vol_ratio: number | null;
  signal: string | null;
  confidence: number | null;
  entry_min: number | null;
  entry_max: number | null;
  target: number | null;
  stop_loss: number | null;
  rr_ratio: number | null;
  position_size_pct: number | null;
  timeframe_days: number | null;
  entry_timing_ar: string | null;
  expected_gain_pct: number | null;
  expected_next_day_pct: number | null;
  market_trend: string | null;
  partial_exit_pct: number | null;
  max_hold_days: number | null;
  technical_score: number | null;
  fundamental_score: number | null;
  sentiment_score: number | null;
  macro_score: number | null;
  sector_score: number | null;
  ensemble_agreement: number | null;
  data_completeness: number | null;
};

export type DashboardPayload = {
  scanId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  status: string | null;
  errorMessage: string | null;
  stocksCount: number;
  aiCount: number;
  rows: DashboardRow[];
  topPicks: DashboardRow[];
  dataProvider: string | null;
  isSynthetic: boolean;
};

const STUCK_START_MS = 90 * 1000;
const STUCK_TOTAL_MS = 6 * 60 * 1000;

function staleScanMessage(scan: { started_at: string; stocks_count: number | null }) {
  const age = Date.now() - new Date(scan.started_at).getTime();
  if ((scan.stocks_count ?? 0) === 0 && age > STUCK_START_MS) {
    return "تم إيقاف مسح عالق تلقائياً: لم يبدأ جلب الأسهم خلال 90 ثانية";
  }
  if (age > STUCK_TOTAL_MS) {
    return "تم إيقاف مسح عالق تلقائياً بعد 6 دقائق";
  }
  return null;
}

async function getDashboardPayload(): Promise<DashboardPayload> {
  let { data: scan } = await supabaseAdmin
    .from("scans")
    .select("id, started_at, finished_at, status, stocks_count, ai_count, error_message")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

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
      isSynthetic: false,
    };
  }

  if (scan.status === "running") {
    const staleMessage = staleScanMessage(scan);
    if (staleMessage) {
      const finishedAt = new Date().toISOString();
      await supabaseAdmin
        .from("scans")
        .update({ status: "failed", finished_at: finishedAt, error_message: staleMessage })
        .eq("id", scan.id);
      scan = { ...scan, status: "failed", finished_at: finishedAt, error_message: staleMessage };
    }
  }

  const { data: snaps } = await supabaseAdmin
    .from("stock_snapshots")
    .select(
      "symbol, close, change_pct, rsi14, composite_score, vol_ratio, data_provider, stocks(name_ar, sector_ar)",
    )
    .eq("scan_id", scan.id)
    .order("composite_score", { ascending: false });

  const { data: recos } = await supabaseAdmin
    .from("recommendations")
    .select(
      "symbol, signal, confidence, entry_min, entry_max, target, stop_loss, rr_ratio, position_size_pct, timeframe_days, entry_timing_ar, expected_gain_pct, expected_next_day_pct, market_trend, partial_exit_pct, max_hold_days, technical_score, fundamental_score, sentiment_score, macro_score, sector_score, ensemble_agreement, data_completeness",
    )
    .eq("scan_id", scan.id);

  const recoMap = new Map((recos ?? []).map((r) => [r.symbol, r]));

  const allRows: DashboardRow[] = (snaps ?? []).map((s) => {
    const stockJoin = s.stocks as { name_ar?: string; sector_ar?: string | null } | null;
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
      expected_next_day_pct:
        r?.expected_next_day_pct != null ? Number(r.expected_next_day_pct) : null,
      market_trend: r?.market_trend ?? null,
      partial_exit_pct: r?.partial_exit_pct != null ? Number(r.partial_exit_pct) : null,
      max_hold_days: r?.max_hold_days ?? null,
      technical_score: r?.technical_score != null ? Number(r.technical_score) : null,
      fundamental_score: r?.fundamental_score != null ? Number(r.fundamental_score) : null,
      sentiment_score: r?.sentiment_score != null ? Number(r.sentiment_score) : null,
      macro_score: r?.macro_score != null ? Number(r.macro_score) : null,
      sector_score: r?.sector_score != null ? Number(r.sector_score) : null,
      ensemble_agreement: r?.ensemble_agreement ?? null,
      data_completeness: r?.data_completeness ?? null,
    };
  });

  const dashboardRows = allRows;

  // Sort: bullish signals first (strong_buy > buy > neutral > sell > strong_sell),
  // then by expected_gain_pct desc, then composite_score desc.
  const SIGNAL_RANK: Record<string, number> = {
    strong_buy: 5,
    buy: 4,
    neutral: 3,
    sell: 2,
    strong_sell: 1,
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

  // Top 3 picks for TOMORROW: bullish only, ranked by expected next-day move × confidence.
  const topPicks = rows
    .filter((r) => r.signal === "strong_buy" || r.signal === "buy")
    .sort((a, b) => {
      const moveA = a.expected_next_day_pct ?? (a.expected_gain_pct ?? 0) / 3;
      const moveB = b.expected_next_day_pct ?? (b.expected_gain_pct ?? 0) / 3;
      const scoreA = moveA * ((a.confidence ?? 0) / 100);
      const scoreB = moveB * ((b.confidence ?? 0) / 100);
      return scoreB - scoreA;
    })
    .slice(0, 3);

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
    dataProvider: (snaps?.[0]?.data_provider as string | null) ?? null,
    isSynthetic: (snaps ?? []).some((s) => (s.data_provider ?? "").startsWith("synthetic")),
  };
}

export const getDashboard = createServerFn({ method: "GET" }).handler(getDashboardPayload);

export type StockDetailPayload = {
  symbol: string;
  name_ar: string;
  sector_ar: string | null;
  snapshot: SnapshotRow | null;
  recommendation: RecommendationRow | null;
  history: Array<{
    date: string;
    close: number;
    high: number;
    low: number;
    open: number;
    volume: number;
  }>;
};

export const getStockDetail = createServerFn({ method: "GET" })
  .inputValidator((data: { symbol: string }) => data)
  .handler(async ({ data }): Promise<StockDetailPayload | null> => {
    const { data: stock } = await supabaseAdmin
      .from("stocks")
      .select("symbol, name_ar, sector_ar, yahoo_symbol")
      .eq("symbol", data.symbol)
      .maybeSingle();
    if (!stock) return null;

    const { data: snap } = await supabaseAdmin
      .from("stock_snapshots")
      .select("*")
      .eq("symbol", data.symbol)
      .order("ts", { ascending: false })
      .limit(1)
      .maybeSingle();

    let reco: RecommendationRow | null = null;
    if (snap) {
      const { data: r } = await supabaseAdmin
        .from("recommendations")
        .select("*")
        .eq("scan_id", snap.scan_id)
        .eq("symbol", data.symbol)
        .maybeSingle();
      reco = r ?? null;
    }

    // Fetch fresh history for chart (last 90 candles)
    let history: StockDetailPayload["history"] = [];
    try {
      const { fetchOHLCV } = await import("@/lib/market-data/index.server");
      const ohlcv = await fetchOHLCV(stock.yahoo_symbol, 120);
      history = ohlcv.candles.slice(-90).map((c) => ({
        date: c.date.slice(0, 10),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
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
      history,
    };
  });
