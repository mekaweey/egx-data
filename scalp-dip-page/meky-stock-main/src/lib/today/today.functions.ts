import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getNewsSentiment } from "./news-sentiment.server";
import { notifyNewPick } from "@/lib/notifications/pick-alerts.server";
import { evaluateNewsElite } from "@/lib/elite/news-elite.server";
import { computeIndicators } from "@/lib/analysis/indicators.server";
import { detectRegime } from "@/lib/analysis/regime.server";
import { decide } from "@/lib/backtest/strategy.server";
import { canonicalLevels } from "@/lib/risk/levels.server";
import { isBlocked } from "@/lib/scan/blocklist";
import { getMarketStatus } from "@/lib/market-hours";
import type { Candle } from "@/lib/market-data/types";

export type TodayPick = {
  date: string;
  symbol: string;
  name_ar: string | null;
  entry: number;
  target: number;
  stop: number;
  targetPct: number;
  stopPct: number;
  maxHoldDays: number;
  confidence: number; // 0..100
  kellyPct: number; // 0..1 of capital
  score: number;
  reasons: string[];
  status: "open" | "win" | "loss" | "expired" | "skipped";
  pnlPct?: number | null;
  newsScore?: number;
  newsHeadlines?: string[];
  isNewsElite?: boolean;
  newsEliteScore?: number | null;
  newsEliteReasons?: Array<{ kind: string; detail: string }> | null;
};

export type TodayResponse = {
  pick: TodayPick | null;
  circuitOpen: boolean; // true = trading paused
  recentStats: { trades: number; wins: number; accuracy: number; avgPnl: number };
  lastUpdated: string;
  recentPicks: TodayPick[];
  message: string;
};

function cairoDateString() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
}

async function loadAllCandles() {
  const rows: any[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await supabaseAdmin
      .from("daily_candles")
      .select("symbol,date,open,high,low,close,volume")
      .order("date")
      .range(f, f + 999);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

/**
 * UNIFIED live pick — uses the exact same engine as the backtest:
 *   computeIndicators → detectRegime → decide → canonicalLevels.
 * This makes the backtest's PF/WR numbers directly applicable to live trades.
 * News sentiment is now a TAG only (not a blocker) — backtest baseline (no
 * news gate) outperforms the news-gated variant in recent windows.
 */
async function computeBestPick(): Promise<TodayPick | null> {
  const rows = await loadAllCandles();
  if (!rows.length) return null;

  const bySym = new Map<string, Candle[]>();
  for (const r of rows) {
    const a = bySym.get(r.symbol) ?? [];
    a.push({
      date: r.date,
      open: +r.open,
      high: +r.high,
      low: +r.low,
      close: +r.close,
      volume: +r.volume,
    });
    bySym.set(r.symbol, a);
  }
  for (const a of bySym.values()) a.sort((x, y) => x.date.localeCompare(y.date));

  // get symbol names
  const { data: stocks } = await supabaseAdmin.from("stocks").select("symbol, name_ar");
  const nameMap = new Map((stocks ?? []).map((s) => [s.symbol, s.name_ar]));

  // ---------- Detect today's market regime from aggregate (match backtest) ----------
  const dateUnion = new Set<string>();
  for (const arr of bySym.values()) for (const c of arr) dateUnion.add(c.date);
  const sortedDates = [...dateUnion].sort();
  const REGIME_WINDOW = 90;
  const recentDates = sortedDates.slice(-REGIME_WINDOW);
  const dateIdx = new Map(recentDates.map((d, i) => [d, i]));
  const agg = recentDates.map((d) => ({ date: d, open: 0, high: 0, low: 0, close: 0, volume: 0, n: 0 }));
  for (const arr of bySym.values()) {
    for (const c of arr) {
      const k = dateIdx.get(c.date);
      if (k === undefined) continue;
      const a = agg[k];
      a.open += c.open; a.high += c.high; a.low += c.low; a.close += c.close; a.volume += c.volume; a.n++;
    }
  }
  const marketCandles: Candle[] = agg.map((a) => {
    const k = Math.max(1, a.n);
    return { date: a.date, open: a.open / k, high: a.high / k, low: a.low / k, close: a.close / k, volume: a.volume };
  });
  const regime = detectRegime(marketCandles);

  // ---------- Run unified strategy per symbol ----------
  // Breakout-20D gates already do the filtering; confidence is a ranking signal.
  const MIN_CONF = 70;
  type Cand = {
    sym: string;
    entry: number;
    confidence: number;
    reasons: string[];
    stop: number;
    target: number;
    stopPct: number;
    targetPct: number;
    atr: number;
  };
  const cands: Cand[] = [];

  for (const [sym, arr] of bySym) {
    if (arr.length < 53) continue;
    if (isBlocked(sym)) continue;
    let ind;
    try {
      ind = computeIndicators(arr);
    } catch {
      continue;
    }
    const entry = ind.close;
    // Same hard filters as backtest engine
    if (entry < 2.0) continue;
    if (ind.atr14 != null && ind.atr14 / entry < 0.012) continue;

    const decision = decide(ind, regime);
    if (decision.signal !== "buy" && decision.signal !== "strong_buy") continue;
    if (decision.confidence < MIN_CONF) continue;

    const levels = canonicalLevels(ind, { priceOverride: entry });
    // Reverted to OLD preset (5% target / 2% stop / 6-day hold) — validated 43% WR
    // but only 5% same-day target+stop ambiguity, so the number is reliable.
    // The previous 1%/0.7% setup had 50% ambiguity → unverifiable.
    const target = +(entry * 1.05).toFixed(4);
    const stopLoss = +(entry * 0.98).toFixed(4);
    const targetPct = 5.0;
    const stopPct = 2.0;
    void levels;

    cands.push({
      sym,
      entry,
      confidence: decision.confidence,
      reasons: decision.reasons,
      stop: stopLoss,
      target,
      stopPct,
      targetPct,
      atr: ind.atr14 ?? 0,
    });
  }

  if (!cands.length) return computeBestIntradayFallback(nameMap);
  // Rank by confidence (decisive metric in the unified engine), tie-break by R:R
  cands.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return (b.target - b.entry) / (b.entry - b.stop) - (a.target - a.entry) / (a.entry - a.stop);
  });
  const pick = cands[0];

  // News as additive tag only — NOT a blocker (backtest baseline > news-gated)
  let newsScore = 0;
  let newsHeadlines: string[] = [];
  try {
    const n = await getNewsSentiment(pick.sym, nameMap.get(pick.sym) ?? null);
    newsScore = n.score;
    newsHeadlines = n.headlines;
    if (n.score >= 0.5) pick.reasons.push(`أخبار إيجابية (${n.score.toFixed(1)})`);
    else if (n.score <= -0.5) pick.reasons.push(`⚠️ أخبار سلبية (${n.score.toFixed(1)})`);
  } catch { /* news optional */ }

  // Isotonic calibration (optional passthrough)
  let confidence = pick.confidence;
  try {
    const { loadIsotonicCalibration, applyIsotonic } = await import("@/lib/scan/isotonic-calibration.server");
    const isoMap = await loadIsotonicCalibration();
    confidence = applyIsotonic(pick.confidence, isoMap);
  } catch { /* keep raw */ }

  // Kelly fractional
  const p = confidence / 100;
  const q = 1 - p;
  const b = pick.targetPct / pick.stopPct;
  const kelly = Math.max(0.05, Math.min(0.4, (p * b - q) / b));

  const today = cairoDateString();
  return {
    date: today,
    symbol: pick.sym,
    name_ar: nameMap.get(pick.sym) ?? pick.sym,
    entry: pick.entry,
    target: pick.target,
    stop: pick.stop,
    targetPct: pick.targetPct,
    stopPct: pick.stopPct,
    maxHoldDays: 6, // matches reliable backtest
    confidence,
    kellyPct: kelly,
    score: pick.confidence,
    reasons: pick.reasons,
    status: "open",
    newsScore,
    newsHeadlines,
  };
}

async function computeBestIntradayFallback(nameMap: Map<string, string | null>): Promise<TodayPick | null> {
  const today = cairoDateString();
  const { data: scan } = await supabaseAdmin
    .from("scans")
    .select("id")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!scan) return null;

  const { data: snaps } = await supabaseAdmin
    .from("stock_snapshots")
    .select("symbol, close, atr14, vol_ratio, rsi14, macd, macd_signal, ema9, ema21, composite_score, change_pct")
    .eq("scan_id", scan.id);
  if (!snaps?.length) return null;

  const symbols = snaps.map((s) => s.symbol).filter((s) => !isBlocked(s));
  const { data: recos } = symbols.length
    ? await supabaseAdmin
        .from("recommendations")
        .select("symbol, signal, confidence, reasons_ar, target, stop_loss")
        .eq("scan_id", scan.id)
        .in("symbol", symbols)
    : { data: [] };
  const recoMap = new Map((recos ?? []).map((r) => [r.symbol, r]));

  type Cand = TodayPick & { rank: number };
  const cands: Cand[] = [];
  for (const s of snaps) {
    if (isBlocked(s.symbol)) continue;
    const entry = Number(s.close ?? 0);
    const atr = Number(s.atr14 ?? 0);
    if (!(entry > 0) || !(atr > 0)) continue;
    const swing = (atr / entry) * 100;
    if (swing < 0.45) continue;
    const rsi = Number(s.rsi14 ?? 50);
    if (rsi < 35 || rsi > 82) continue;
    const ema9 = Number(s.ema9 ?? 0);
    const ema21 = Number(s.ema21 ?? 0);
    const macd = Number(s.macd ?? 0);
    const macdSignal = Number(s.macd_signal ?? 0);
    const trendOk = ema9 > 0 && ema21 > 0 && ema9 >= ema21;
    const momentumOk = macd >= macdSignal;
    const changePct = Number(s.change_pct ?? 0);
    const comp = Number(s.composite_score ?? 0);
    if (!trendOk && !momentumOk && changePct < 0 && comp < 45) continue;

    const reco = recoMap.get(s.symbol);
    const recoSignalOk = reco?.signal === "buy" || reco?.signal === "strong_buy";
    const confidence = Math.round(Math.max(
      58,
      Math.min(82, Number(reco?.confidence ?? 0) || 54 + comp * 0.32 + (trendOk ? 6 : 0) + (momentumOk ? 5 : 0) + Math.max(0, changePct) * 2),
    ));
    const targetPct = Math.max(0.9, Math.min(1.8, swing * 0.6));
    const stopPct = Math.max(0.8, Math.min(1.4, swing * 0.45));
    const reasons = Array.isArray(reco?.reasons_ar)
      ? (reco.reasons_ar as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 2)
      : [];
    if (trendOk) reasons.unshift("اتجاه لحظي/قصير صاعد");
    if (momentumOk) reasons.unshift("زخم MACD إيجابي");
    if (recoSignalOk) reasons.unshift("توصية الشراء موجودة في آخر مسح اليوم");

    const rank = comp + confidence * 0.6 + Math.max(0, changePct) * 8 + (trendOk ? 8 : 0) + (momentumOk ? 6 : 0);
    cands.push({
      date: today,
      symbol: s.symbol,
      name_ar: nameMap.get(s.symbol) ?? s.symbol,
      entry,
      target: +(entry * (1 + targetPct / 100)).toFixed(4),
      stop: +(entry * (1 - stopPct / 100)).toFixed(4),
      targetPct: +targetPct.toFixed(2),
      stopPct: +stopPct.toFixed(2),
      maxHoldDays: 1,
      confidence,
      kellyPct: Math.max(0.08, Math.min(0.25, confidence / 400)),
      score: rank,
      reasons: reasons.length ? reasons.slice(0, 3) : ["أفضل فرصة متاحة لليوم من آخر بيانات السوق", `Score فني ${comp.toFixed(0)}/100`],
      status: "open",
      rank,
    });
  }

  cands.sort((a, b) => b.rank - a.rank);
  return cands[0] ?? null;
}

/** Circuit breaker: pause if last 3 closed picks all lost AND last loss within 5 days */
async function isCircuitOpen(): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("daily_picks")
    .select("status, exit_date")
    .in("status", ["win", "loss", "expired"])
    .order("pick_date", { ascending: false })
    .limit(3);
  if (!data || data.length < 3) return false;
  if (!data.every((p) => p.status === "loss")) return false;
  // Auto-reset: if last loss was more than 5 days ago, resume trading
  const lastLoss = data[0]?.exit_date ? new Date(data[0].exit_date) : new Date();
  const daysSince = (Date.now() - lastLoss.getTime()) / (24 * 3600 * 1000);
  return daysSince <= 5;
}

/** Feedback stats from closed picks */
async function getStats() {
  const { data } = await supabaseAdmin
    .from("daily_picks")
    .select("status, pnl_pct")
    .in("status", ["win", "loss", "expired"])
    .order("pick_date", { ascending: false })
    .limit(30);
  const trades = data?.length ?? 0;
  const wins = (data ?? []).filter((p) => (p.pnl_pct ?? 0) > 0).length;
  const avg = trades > 0 ? (data ?? []).reduce((s, p) => s + (Number(p.pnl_pct) || 0), 0) / trades : 0;
  return { trades, wins, accuracy: trades > 0 ? (wins / trades) * 100 : 0, avgPnl: avg };
}

export const getTodayPick = createServerFn({ method: "GET" }).handler(async (): Promise<TodayResponse> => {
  const today = cairoDateString();
  const marketStatus = getMarketStatus();

  // 1. Try cached pick for today. Multiple rows are allowed because every
  // intraday replacement is preserved as a separate audited pick.
  const { data: todaysRows } = await supabaseAdmin
    .from("daily_picks")
    .select("*")
    .eq("pick_date", today)
    .order("created_at", { ascending: false });
  const existing = (todaysRows ?? []).find((p) => p.status === "open") ?? todaysRows?.[0] ?? null;

  const circuitOpen = await isCircuitOpen();
  const recentStats = await getStats();

  const { data: recent } = await supabaseAdmin
    .from("daily_picks")
    .select("*")
    .order("pick_date", { ascending: false })
    .limit(10);

  const recentPicks: TodayPick[] = (recent ?? []).map((r) => ({
    date: r.pick_date,
    symbol: r.symbol,
    name_ar: r.name_ar,
    entry: Number(r.entry_price),
    target: Number(r.target_price),
    stop: Number(r.stop_price),
    targetPct: Number(r.target_pct),
    stopPct: Number(r.stop_pct),
    maxHoldDays: r.max_hold_days,
    confidence: Number(r.confidence),
    kellyPct: Number(r.kelly_pct),
    score: Number(r.score),
    reasons: (r.reasons as string[]) ?? [],
    status: r.status as TodayPick["status"],
    pnlPct: r.pnl_pct != null ? Number(r.pnl_pct) : null,
    isNewsElite: (r as any).is_news_elite ?? false,
    newsEliteScore: (r as any).news_elite_score != null ? Number((r as any).news_elite_score) : null,
    newsEliteReasons: ((r as any).news_elite_reasons as any) ?? null,
  }));

  if (existing && existing.status !== "open") {
    return {
      pick: null,
      circuitOpen,
      recentStats,
      recentPicks,
      lastUpdated: existing.updated_at,
      message: !marketStatus.isOpen
        ? "السوق مغلق — الصفقة اتقفلت ومفيش بديل حي إلا مع الجلسة القادمة"
        : existing.status === "win"
        ? "الصفقة الحالية حققت هدفها — النظام بيدور على بديل حي أفضل"
        : "الصفقة الحالية اتقفلت — النظام بيدور على بديل حي أفضل",
    };
  }

  if (existing) {
    const pick: TodayPick = {
      date: existing.pick_date,
      symbol: existing.symbol,
      name_ar: existing.name_ar,
      entry: Number(existing.entry_price),
      target: Number(existing.target_price),
      stop: Number(existing.stop_price),
      targetPct: Number(existing.target_pct),
      stopPct: Number(existing.stop_pct),
      maxHoldDays: existing.max_hold_days,
      confidence: Number(existing.confidence),
      kellyPct: Number(existing.kelly_pct),
      score: Number(existing.score),
      reasons: (existing.reasons as string[]) ?? [],
      status: existing.status as TodayPick["status"],
      pnlPct: existing.pnl_pct != null ? Number(existing.pnl_pct) : null,
      isNewsElite: (existing as any).is_news_elite ?? false,
      newsEliteScore: (existing as any).news_elite_score != null ? Number((existing as any).news_elite_score) : null,
      newsEliteReasons: ((existing as any).news_elite_reasons as any) ?? null,
    };
    return {
      pick,
      circuitOpen,
      recentStats,
      recentPicks,
      lastUpdated: existing.updated_at,
      message: circuitOpen ? "النظام في وضع الحماية (3 خسائر متتالية) — لا تنفذ الصفقة" : "الصفقة جاهزة",
    };
  }

  if (circuitOpen) {
    return {
      pick: null,
      circuitOpen: true,
      recentStats,
      recentPicks,
      lastUpdated: new Date().toISOString(),
      message: "🛡️ النظام في وضع الحماية بعد 3 خسائر متتالية. مفيش صفقات النهارده — راجع الأخطاء.",
    };
  }

  if (!marketStatus.isOpen) {
    return {
      pick: null,
      circuitOpen: false,
      recentStats,
      recentPicks,
      lastUpdated: new Date().toISOString(),
      message: "السوق مغلق حالياً — لن يتم إنشاء صفقة يومية جديدة إلا أثناء جلسة التداول.",
    };
  }

  // 2. Compute fresh pick — fast path from today's latest scan first.
  // The old historical engine can be slow; the user needs a same-day decision now.
  const { data: stocksForFastPick } = await supabaseAdmin.from("stocks").select("symbol, name_ar");
  const fastNameMap = new Map((stocksForFastPick ?? []).map((s) => [s.symbol, s.name_ar]));
  const pick = await computeBestIntradayFallback(fastNameMap) ?? await computeBestPick();
  if (!pick) {
    return {
      pick: null,
      circuitOpen: false,
      recentStats,
      recentPicks,
      lastUpdated: new Date().toISOString(),
      message: "مفيش فرصة شراء آمنة كفاية دلوقتي — هنعيد التقييم مع كل تحديث لحظي اليوم.",
    };
  }

  // 3. Persist
  // News-Elite tagging (additive only — never blocks or alters the pick).
  const elite = await evaluateNewsElite(pick.symbol, pick.date, pick.confidence).catch(() => null);
  await supabaseAdmin.from("daily_picks").insert({
    pick_date: pick.date,
    symbol: pick.symbol,
    name_ar: pick.name_ar,
    entry_price: pick.entry,
    target_price: pick.target,
    stop_price: pick.stop,
    target_pct: pick.targetPct,
    stop_pct: pick.stopPct,
    max_hold_days: pick.maxHoldDays,
    confidence: pick.confidence,
    kelly_pct: pick.kellyPct,
    score: pick.score,
    reasons: pick.reasons,
    status: "open",
    is_news_elite: elite?.is_elite ?? false,
    news_elite_score: elite?.score ?? null,
    news_elite_reasons: elite?.reasons ?? null,
  });

  // 🔔 Telegram alert (dedup'd via pick_notifications)
  void notifyNewPick({
    pick_date: pick.date,
    symbol: pick.symbol,
    name_ar: pick.name_ar,
    entry: pick.entry,
    target: pick.target,
    stop: pick.stop,
    confidence: pick.confidence,
    reasons: pick.reasons,
    newsScore: pick.newsScore,
    source: "today",
  });

  return {
    pick,
    circuitOpen: false,
    recentStats,
    recentPicks: [pick, ...recentPicks],
    lastUpdated: new Date().toISOString(),
    message: "🎯 السهم اللي يستحق الشراء النهارده",
  };
});

/** Update outcomes for all open picks - called by daily cron */
export const updatePickOutcomes = createServerFn({ method: "POST" }).handler(async () => {
  const { data: openPicks } = await supabaseAdmin
    .from("daily_picks")
    .select("*")
    .eq("status", "open");

  if (!openPicks?.length) return { updated: 0 };

  let updated = 0;
  for (const p of openPicks) {
    const entryDate = new Date(p.pick_date);
    const endDate = new Date(entryDate);
    endDate.setDate(endDate.getDate() + p.max_hold_days + 1);

    const { data: candles } = await supabaseAdmin
      .from("daily_candles")
      .select("date,open,high,low,close")
      .eq("symbol", p.symbol)
      .gt("date", p.pick_date)
      .lte("date", endDate.toISOString().slice(0, 10))
      .order("date");

    if (!candles?.length) continue;

    const entry = Number(p.entry_price);
    const tgt = Number(p.target_price);
    const stp = Number(p.stop_price);
    let status: string | null = null;
    let exitPrice = 0;
    let exitDate = "";

    for (const c of candles) {
      if (+c.high >= tgt) { status = "win"; exitPrice = tgt; exitDate = c.date; break; }
      if (+c.low <= stp) { status = "loss"; exitPrice = stp; exitDate = c.date; break; }
    }
    if (!status && candles.length >= p.max_hold_days) {
      const last = candles[Math.min(candles.length - 1, p.max_hold_days - 1)];
      exitPrice = +last.close;
      exitDate = last.date;
      status = exitPrice > entry ? "win" : exitPrice < entry ? "loss" : "expired";
    }

    if (status) {
      const pnlPct = (exitPrice / entry - 1) * 100;
      await supabaseAdmin
        .from("daily_picks")
        .update({
          status,
          exit_price: exitPrice,
          exit_date: exitDate,
          pnl_pct: pnlPct,
        })
        .eq("id", p.id);
      updated++;
    }
  }

  return { updated };
});