import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Cairo-local YYYY-MM-DD (used to scope "already recommended today" checks).
 */
function cairoTodayISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
}

/**
 * Returns the set of symbols that already have a pending BUY/STRONG_BUY
 * recommendation today. Used to enforce "one recommendation per symbol per day"
 * — prevents the system from re-issuing ATQA/ACGC/EFID multiple times after
 * they already lost (real-data audit from 2026-06-07).
 */
async function getSymbolsBoughtToday(symbols: string[]): Promise<Set<string>> {
  if (!symbols.length) return new Set();
  const today = cairoTodayISO();
  const { data } = await supabaseAdmin
    .from("recommendations")
    .select("symbol")
    .in("symbol", symbols)
    .in("signal", ["buy", "strong_buy"])
    .gte("created_at", `${today}T00:00:00.000Z`)
    .lt("created_at", `${today}T23:59:59.999Z`);
  return new Set((data ?? []).map((r) => r.symbol));
}
import { fetchEgxSnapshots, type TvSnapshot } from "@/lib/market-data/tradingview.server";
import type { Indicators, PatternHit } from "@/lib/analysis/indicators.server";
import { computeIndicators } from "@/lib/analysis/indicators.server";
import { computeScore, suggestLevels } from "@/lib/analysis/score.server";
import { fetchHistoryBulk } from "@/lib/market-data/history.server";
import { fetchMarketSnapshot, type MarketSnapshot } from "@/lib/market-data/market-index.server";
import type { Candle } from "@/lib/market-data/types";
import { analyzeStock } from "@/lib/ai/analyze.server";
import { AI_MODEL } from "@/lib/ai/gateway.server";
import { applyRuleGate } from "@/lib/scan/rule-gate.server";
import { verifyPick } from "@/lib/scan/verifier.server";
import { getRecentPerformance } from "@/lib/scan/historical-performance.server";
import { getActiveFailurePatterns } from "@/lib/scan/adaptive-learning.server";
import { computeWeeklyContext, type WeeklyContext } from "@/lib/analysis/multi-timeframe.server";
import { computeSectorMomentum, type SectorContext } from "@/lib/analysis/sector-momentum.server";
import { fetchNewsBulk, type StockNews } from "@/lib/market-data/news.server";
import { canonicalLevels } from "@/lib/risk/levels.server";
import { fetchFundamentals, saveFundamentals, isEarningsBlackout, type Fundamentals } from "@/lib/market-data/fundamentals.server";
import { fetchMacroSnapshot, saveMacro, type MacroSnapshot } from "@/lib/market-data/macro.server";
import { computeFiveDimScores } from "@/lib/analysis/five-dim-score.server";
import { ensembleVote } from "@/lib/ai/ensemble.server";
import { computeAdvancedTechnical } from "@/lib/analysis/advanced-patterns.server";
import { detectAnomalies } from "@/lib/analysis/anomaly-detection.server";
import { kellyMultiplier, correlationMultiplier, combinedRiskMultiplier } from "@/lib/risk/smart-risk.server";
import { detectRegime } from "@/lib/analysis/regime-detection.server";
import { monteCarloProject } from "@/lib/analysis/monte-carlo.server";
import { buildExplainability } from "@/lib/analysis/explainability.server";
import { loadCalibration, calibrateConfidence } from "@/lib/analysis/bayesian-calibration.server";
import { computeConfluence } from "@/lib/analysis/confluence.server";
import { buildTrailingStop } from "@/lib/risk/trailing-stop.server";
import { detectVPD } from "@/lib/analysis/volume-price-divergence.server";
import { loadSymbolMemory } from "@/lib/scan/pattern-memory.server";
import { detectSectorRotation } from "@/lib/analysis/sector-rotation.server";
import { computeMarketBreadth } from "@/lib/analysis/market-breadth.server";
import { assessLiquidity } from "@/lib/analysis/liquidity.server";
import { computeDisagreement } from "@/lib/analysis/ensemble-disagreement.server";
import { detectContrarian } from "@/lib/analysis/contrarian.server";
import { computeCrossAsset } from "@/lib/analysis/cross-asset.server";
import { trainMetaLearner, metaPredict } from "@/lib/analysis/meta-learner.server";
import { optimizeWeightsGA } from "@/lib/analysis/genetic-optimizer.server";
import { trainRegimeSpecificMeta } from "@/lib/analysis/regime-specific-meta.server";
import { autoLabelUncertain } from "@/lib/scan/auto-active-learning.server";
import { shapExplain } from "@/lib/analysis/shap-importance.server";
import { wilsonCI } from "@/lib/analysis/confidence-interval.server";
import { atrLevels, blendWithAi } from "@/lib/risk/atr-targets.server";
import { loadSentimentVelocity } from "@/lib/analysis/sentiment-velocity.server";
import { detectBlockTrade } from "@/lib/analysis/block-trade.server";
import { multiHorizonForecast } from "@/lib/analysis/multi-horizon.server";
import { applyPortfolioFilter, type Pick as PFPick } from "@/lib/scan/portfolio-filter.server";
import { loadEarningsSurprise } from "@/lib/analysis/earnings-surprise.server";
import { detectAnomalyAlert } from "@/lib/analysis/anomaly-alerts.server";
import { autoDisablePatterns } from "@/lib/scan/pattern-auto-disable.server";
import { loadReliability, calibrateProbability } from "@/lib/analysis/probability-calibration.server";
import { detectDrift } from "@/lib/scan/drift-detection.server";
import { computeRelativeStrength } from "@/lib/analysis/relative-strength.server";
import { detectSeasonality } from "@/lib/analysis/seasonality.server";
import { sequenceForecast } from "@/lib/analysis/lstm-lite.server";
import { stackingEnsemble } from "@/lib/analysis/stacking-ensemble.server";
import { bayesianUpdate } from "@/lib/analysis/bayesian-update.server";
import { runBandit } from "@/lib/scan/rl-bandit.server";
import { runABTest } from "@/lib/scan/ab-testing.server";
import { detectDivergence } from "@/lib/analysis/divergence.server";
import { calculateFibLevels } from "@/lib/analysis/fibonacci.server";
import { calculateIchimoku } from "@/lib/analysis/ichimoku.server";
import { detectCandlestickPatterns, patternsConfidenceDelta } from "@/lib/analysis/candlestick-patterns.server";
import { calculateVolumeProfile } from "@/lib/analysis/volume-profile.server";
import { detectInsiderActivity } from "@/lib/analysis/insider-volume.server";
import { analyzeNewsText, aggregateNewsAnalyses } from "@/lib/analysis/news-entity-extraction.server";
import { checkEarningsProximity } from "@/lib/data/earnings-calendar.server";
import { getRecentMacroContext, geopoliticalRiskScore } from "@/lib/data/economic-calendar.server";
import { kellySizingMultiplier } from "@/lib/risk/kelly-fractional.server";
import { regimeStopMultiplier } from "@/lib/risk/regime-stop-loss.server";
import { checkCircuitBreaker } from "@/lib/portfolio/circuit-breaker.server";
import { decomposeConfidence } from "@/lib/analysis/confidence-decomposition.server";
import { emitHighConvictionAlert } from "@/lib/alerts/alert-system.server";
import { runAutoModules } from "@/lib/integration/auto-orchestrator.server";
import { portfolioCorrelationPenalty } from "@/lib/integration/tier-i-intelligence.server";
import { resetClusterTracking } from "@/lib/integration/intelligence-layer.server";
import { loadIsotonicCalibration, applyIsotonic, type IsotonicMap } from "@/lib/scan/isotonic-calibration.server";
import { similarSetupBoost } from "@/lib/scan/similar-setup-boost.server";
import { sanityCheck as llmSanityCheck } from "@/lib/integration/llm-reasoning.server";
import type { Database } from "@/integrations/supabase/types";

type SnapshotInsert = Database["public"]["Tables"]["stock_snapshots"]["Insert"];
type SnapshotRow = Database["public"]["Tables"]["stock_snapshots"]["Row"];

const AI_DELAY_MS = 250;
const FAST_AI_MAX = 20;
const FAST_ENSEMBLE_MAX = 0;
const FAST_VERIFIER_MAX = 0;
const BULK_MARKET_TIMEOUT_MS = 60_000;
const AI_ANALYSIS_TIMEOUT_MS = 12_000;
const AI_ENSEMBLE_TIMEOUT_MS = 7_000;
const AI_VERIFIER_TIMEOUT_MS = 7_000;
const DB_STEP_TIMEOUT_MS = 3_000;
const AUTO_MODULES_TIMEOUT_MS = 2_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeout!: ReturnType<typeof setTimeout>;
  const timer = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`${label} بعد ${Math.round(ms / 1000)} ثانية`)), ms);
  });
  return Promise.race([promise, timer]).finally(() => clearTimeout(timeout));
}

export type RunScanResult = {
  scanId: string;
  stocks: number;
  ai: number;
  fetched: number;
  cached: number;
  errors: string[];
  warnings: string[];
};

export async function runScan(): Promise<RunScanResult> {
  // Reset per-scan cluster crowding counter so correlation penalties start fresh.
  resetClusterTracking();
  const { data: scanRow, error: scanErr } = await supabaseAdmin
    .from("scans")
    .insert({ status: "running" })
    .select("id")
    .single();
  if (scanErr || !scanRow) throw new Error(`scan insert failed: ${scanErr?.message}`);
  const scanId = scanRow.id;
  return runScanForId(scanId);
}

export async function createPendingScan(): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("scans")
    .insert({ status: "running" })
    .select("id")
    .single();
  if (error || !data) throw new Error(`scan insert failed: ${error?.message}`);
  return data.id;
}

export async function runScanForId(scanId: string): Promise<RunScanResult> {
  resetClusterTracking();

  const isScanStillRunning = async () => {
    const { data } = await supabaseAdmin
      .from("scans")
      .select("status")
      .eq("id", scanId)
      .maybeSingle();
    return data?.status === "running";
  };

  const { data: stocksRaw, error: stocksErr } = await supabaseAdmin
    .from("stocks")
    .select("symbol, name_ar, yahoo_symbol, sector_ar")
    .eq("is_active", true)
    .eq("is_sharia", true);
  if (stocksErr || !stocksRaw) {
    await supabaseAdmin
      .from("scans")
      .update({ status: "failed", error_message: stocksErr?.message ?? "no stocks" })
      .eq("id", scanId);
    throw new Error(stocksErr?.message ?? "no stocks");
  }
  const { isBlocked } = await import("@/lib/scan/blocklist");
  const stocks = stocksRaw.filter((s) => !isBlocked(s.symbol));

  // Surface real progress immediately. Previously the UI stayed at 5% while
  // external market/history calls were still running, which looked frozen.
  await supabaseAdmin
    .from("scans")
    .update({ stocks_count: stocks.length, ai_count: 0 })
    .eq("id", scanId);

  const { data: cachedRows } = await supabaseAdmin
    .from("stock_snapshots")
    .select("*")
    .order("ts", { ascending: false })
    .limit(1000);
  const cachedBySymbol = new Map<string, SnapshotRow>();
  for (const row of cachedRows ?? []) {
    if (!cachedBySymbol.has(row.symbol)) cachedBySymbol.set(row.symbol, row);
  }

  const { data: liveRows } = await supabaseAdmin
    .from("live_ticks")
    .select("symbol, price, volume, ts, source")
    .in("symbol", stocks.map((s) => s.symbol))
    .order("ts", { ascending: false })
    .limit(500);
  const liveBySymbol = new Map<string, NonNullable<typeof liveRows>[number]>();
  for (const row of liveRows ?? []) {
    const key = row.symbol.toUpperCase();
    if (!liveBySymbol.has(key) && Number(row.price) > 0) liveBySymbol.set(key, row);
  }

  type Computed = {
    symbol: string;
    nameAr: string;
    ts: string;
    snapshot: SnapshotInsert;
    score: number;
    indicators: Indicators;
    suggested: ReturnType<typeof suggestLevels>;
    provider: string;
  };

  const computed: Computed[] = [];
  let primaryProvider = "tradingview";
  let fetchedCount = 0;
  let cachedCount = 0;
  const dataErrors: string[] = [];
  const saveErrors: string[] = [];
  const aiErrors: string[] = [];
  const warnings: string[] = [];

  // Bulk fetch in parallel: live TradingView snapshot + Yahoo daily history + EGX30 index.
  let tvData: Map<string, TvSnapshot> = new Map();
  let historyData: Map<string, Candle[]> = new Map();
  let market: MarketSnapshot | null = null;
  const [tvRes, histRes, marketRes, perfRes, fundRes, macroRes] = await Promise.allSettled([
    withTimeout(fetchEgxSnapshots(stocks.map((s) => s.symbol)), BULK_MARKET_TIMEOUT_MS, "انتهت مهلة TradingView"),
    withTimeout(fetchHistoryBulk(stocks, 90, 24), BULK_MARKET_TIMEOUT_MS, "انتهت مهلة Yahoo"),
    withTimeout(fetchMarketSnapshot(), BULK_MARKET_TIMEOUT_MS, "انتهت مهلة مؤشر السوق"),
    withTimeout(getRecentPerformance(40), DB_STEP_TIMEOUT_MS, "انتهت مهلة أداء التوصيات"),
    withTimeout(fetchFundamentals(stocks.map((s) => s.symbol)), BULK_MARKET_TIMEOUT_MS, "انتهت مهلة الأساسيات"),
    withTimeout(fetchMacroSnapshot(), BULK_MARKET_TIMEOUT_MS, "انتهت مهلة بيانات الاقتصاد"),
  ]);
  if (tvRes.status === "fulfilled") tvData = tvRes.value;
  else dataErrors.push(`TradingView bulk fetch failed: ${tvRes.reason instanceof Error ? tvRes.reason.message : String(tvRes.reason)}`);
  if (histRes.status === "fulfilled") historyData = histRes.value;
  else warnings.push(`فشل جلب التاريخ من Yahoo: ${histRes.reason instanceof Error ? histRes.reason.message : String(histRes.reason)}`);
  if (marketRes.status === "fulfilled") market = marketRes.value;
  const performance = perfRes.status === "fulfilled" ? perfRes.value : null;
  const fundamentalsMap: Map<string, Fundamentals> = fundRes.status === "fulfilled" ? fundRes.value : new Map();
  const macroSnap: MacroSnapshot | null = macroRes.status === "fulfilled" ? macroRes.value : null;

  // Load learned failure patterns (from weekly adaptive-learning) once per scan.
  // These are used by the rule-gate to actively avoid historically-losing setups.
  let activeFailures = new Set<string>();
  try { activeFailures = await getActiveFailurePatterns(); } catch {}

  // Build Kelly input from recent performance (used for position-size sizing).
  const kellyInput = performance && performance.total >= 10
    ? {
        winRate: performance.winRate / 100,
        avgWinPct: Math.max(0.1, performance.avgWin),
        avgLossPct: Math.max(0.1, Math.abs(performance.avgLoss)),
      }
    : null;
  const kellyMult = kellyMultiplier(kellyInput);

  // Track accepted picks so we can penalise highly-correlated subsequent picks.
  const acceptedPicks: Array<{ symbol: string; candles: Candle[] | undefined }> = [];
  // Track sector of accepted picks for Tier-I portfolio correlation guard.
  const acceptedSectors: Array<{ symbol: string; sector: string | null; confidence: number }> = [];

  // Persist fundamentals + macro snapshots (best-effort)
  if (fundamentalsMap.size > 0) {
    try { await saveFundamentals(fundamentalsMap); } catch {}
  }
  if (macroSnap) {
    try { await saveMacro(macroSnap); } catch {}
  }

  // Compute sector momentum across the whole universe (cheap, in-memory).
  const sectorCtx: SectorContext = computeSectorMomentum(stocks, historyData);

  // Regime detection — applies a market-wide confidence multiplier to all picks.
  const regime = detectRegime(market, historyData.get("EGX30"));

  // Load adaptive learning artefacts in parallel: confidence calibration + per-symbol memory.
  const [calibration, symbolMemory, reliability, metaWeights, drift, isotonic] = await Promise.all([
    loadCalibration().catch(() => ({ buckets: [], fitted: false, sampleSize: 0 })),
    loadSymbolMemory().catch(() => new Map()),
    loadReliability().catch(() => ({ pairs: [], brier: 0, fitted: false, sampleSize: 0 })),
    trainMetaLearner().catch(() => ({ w: [0.25, 0.15, 0.2, 0.15, 0.25] as [number,number,number,number,number], b: 0, fitted: false, sampleSize: 0, accuracy: 0 })),
    detectDrift().catch(() => ({ recentWinRate: 0, baselineWinRate: 0, delta: 0, drift: "none" as const, confidencePenalty: 0, label_ar: "", recentN: 0, baselineN: 0 })),
    loadIsotonicCalibration().catch((): IsotonicMap => ({ fitted: false, sampleSize: 0, bins: [] })),
  ]);

  // Auto active-learning: silently label uncertain past picks (no user prompt).
  // Fire-and-forget so a failure does not block the scan.
  autoLabelUncertain().catch(() => ({ labeled: 0, skipped: 0 }));

  // Auto-disable failing patterns (and re-enable recovered ones) — silent.
  autoDisablePatterns().catch(() => ({ disabled: 0, reenabled: 0 }));

  // Regime-specific meta-learner takes precedence when fitted for the active regime.
  // Then refine with genetic algorithm. Both run automatically.
  let activeMeta = metaWeights;
  try {
    const regimeMeta = await trainRegimeSpecificMeta(regime.regime);
    if (regimeMeta.active.fitted) activeMeta = regimeMeta.active;
  } catch { /* keep global meta */ }
  try {
    activeMeta = await optimizeWeightsGA(activeMeta);
  } catch { /* keep current meta */ }

  if (drift.drift !== "none") {
    warnings.push(drift.label_ar);
  }

  // Detect sector rotation (leaders/laggards) — used as confidence boost/penalty per sector.
  const rotation = detectSectorRotation(sectorCtx);

  // Market breadth — measures overall participation in the move.
  const breadth = computeMarketBreadth(historyData);

  // Cross-asset macro tilt (USD/oil/gold/S&P) — same for whole scan.
  const crossAssetGlobal = computeCrossAsset(macroSnap);

  // Persist market snapshot for the day (idempotent via upsert on (index_symbol, date))
  if (market) {
    await supabaseAdmin
      .from("market_snapshots")
      .upsert(
        {
          index_symbol: market.index_symbol,
          date: market.date,
          close: market.close,
          change_pct: market.change_pct,
          change_5d_pct: market.change_5d_pct,
          rsi14: market.rsi14,
          ema20: market.ema20,
          trend: market.trend,
        },
        { onConflict: "index_symbol,date" },
      );
  }

  // Persist daily candles for each symbol (upsert on (symbol, date))
  if (historyData.size > 0) {
    const candleRows: Database["public"]["Tables"]["daily_candles"]["Insert"][] = [];
    for (const [sym, candles] of historyData.entries()) {
      for (const c of candles) {
        candleRows.push({
          symbol: sym,
          date: c.date.slice(0, 10),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: Math.round(c.volume),
        });
      }
    }
    if (candleRows.length > 0) {
      // chunk to avoid payload size issues
      const CHUNK = 500;
      for (let i = 0; i < candleRows.length; i += CHUNK) {
        await supabaseAdmin
          .from("daily_candles")
          .upsert(candleRows.slice(i, i + CHUNK), { onConflict: "symbol,date" });
      }
    }
  }

  for (const s of stocks) {
    const tv = tvData.get(s.symbol.toUpperCase());
    const candles = historyData.get(s.symbol.toUpperCase());
    if (tv) {
      // Prefer fresh, locally-computed indicators from candles (gives accurate
      // pattern detection + supports series-aware analysis). Fall back to the
      // TradingView precomputed values if we have <50 candles.
      let ind: Indicators;
      if (candles && candles.length >= 50) {
        try {
          const local = computeIndicators(candles);
          // Keep live TradingView close (intraday) for accuracy on running days
          ind = { ...local, close: tv.close, prevClose: local.close, changePct: tv.change_pct };
        } catch {
          ind = indicatorsFromTv(tv);
        }
      } else {
        ind = indicatorsFromTv(tv);
      }
      const score = computeScore(ind);
      const suggested = suggestLevels(ind);
      const ts = new Date().toISOString();
      computed.push({
        symbol: s.symbol,
        nameAr: s.name_ar,
        ts,
        indicators: ind,
        suggested,
        score,
        provider: "tradingview",
        snapshot: {
          scan_id: scanId,
          symbol: s.symbol,
          ts,
          open: tv.open,
          high: tv.high,
          low: tv.low,
          close: ind.close,
          prev_close: ind.prevClose,
          change_pct: ind.changePct,
          volume: tv.volume,
          rsi14: ind.rsi14,
          macd: ind.macd,
          macd_signal: ind.macdSignal,
          macd_hist: ind.macdHist,
          ema9: ind.ema9,
          ema21: ind.ema21,
          sma50: ind.sma50,
          bb_upper: ind.bbUpper,
          bb_mid: ind.bbMid,
          bb_lower: ind.bbLower,
          atr14: ind.atr14,
          vol_avg20: ind.volAvg20,
          vol_ratio: ind.volRatio,
          support: ind.support,
          resistance: ind.resistance,
          patterns: ind.patterns,
          composite_score: score,
          data_provider: "tradingview",
        },
      });
      fetchedCount++;
      continue;
    }

    // No TradingView data — build from real daily candles first. This keeps
    // every covered symbol in the scan even when the live snapshot provider
    // misses it, without inventing data or changing strategy rules.
    if (candles && candles.length >= 50) {
      try {
        const ind = computeIndicators(candles);
        const suggested = suggestLevels(ind);
        const last = candles[candles.length - 1];
        const ts = new Date(`${last.date.slice(0, 10)}T12:00:00.000Z`).toISOString();
        computed.push({
          symbol: s.symbol,
          nameAr: s.name_ar,
          ts,
          indicators: ind,
          suggested,
          score: computeScore(ind),
          provider: "yahoo-history",
          snapshot: snapshotFromCandles(scanId, s.symbol, candles, ind, ts),
        });
        cachedCount++;
        warnings.push(`${s.symbol}: غير متاح من المصدر اللحظي؛ تم استخدام التاريخ اليومي الحقيقي.`);
        continue;
      } catch {
        // fall through to cached snapshot fallback
      }
    }

    // No TradingView/history data — use the latest real cached snapshot and refresh its
    // price from live_ticks when available. This guarantees every active symbol
    // still receives a snapshot instead of being skipped when one provider stalls.
    const cached = cachedBySymbol.get(s.symbol);
    if (cached) {
      const live = liveBySymbol.get(s.symbol.toUpperCase());
      const ind = live ? indicatorsWithLiveTick(indicatorsFromSnapshot(cached), live) : indicatorsFromSnapshot(cached);
      const suggested = suggestLevels(ind);
      const provider = live ? `live_tick:${live.source}` : `cached:${cached.data_provider ?? "snapshot"}`;
      computed.push({
        symbol: s.symbol,
        nameAr: s.name_ar,
        ts: live?.ts ?? cached.ts,
        indicators: ind,
        suggested,
        score: computeScore(ind),
        provider,
        snapshot: snapshotFromCached(scanId, cached, provider, ind, live),
      });
      cachedCount++;
      warnings.push(`${s.symbol}: غير متاح من المصدر الأساسي؛ تم استخدام بيانات محفوظة/لحظية حقيقية.`);
      continue;
    }

    // Truly no data — skip the symbol; the user will see it missing.
    dataErrors.push(`${s.symbol}: لا توجد بيانات حقيقية متاحة (غير موجود في TradingView ولا في الكاش).`);
  }

  if (computed.length === 0) {
    const errorMessage = summarizeFailures("فشل جلب بيانات الأسهم من TradingView ولا توجد بيانات محفوظة بديلة", dataErrors);
    await supabaseAdmin
      .from("scans")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: errorMessage,
        stocks_count: 0,
        ai_count: 0,
      })
      .eq("id", scanId);
    throw new Error(errorMessage);
  }

  if (computed.length > 0) {
    const snapshots = computed.map((c) => c.snapshot);
    const { error: snapErr } = await supabaseAdmin.from("stock_snapshots").insert(snapshots);
    if (snapErr) {
      const errorMessage = `فشل حفظ بيانات الأسهم في قاعدة البيانات: ${snapErr.message}`;
      saveErrors.push(errorMessage);
      console.error("snapshot insert:", snapErr.message);
      await supabaseAdmin
        .from("scans")
        .update({ status: "failed", finished_at: new Date().toISOString(), error_message: errorMessage })
        .eq("id", scanId);
      throw new Error(errorMessage);
    }
  }

  // Live progress: surface stocks_count immediately so the UI shows "X من Y" while AI runs.
  await supabaseAdmin
    .from("scans")
    .update({ stocks_count: computed.length, ai_count: 0 })
    .eq("id", scanId);

  // AI only for the strongest candidates. The rest still get deterministic
  // rule-based recommendations, so refresh finishes quickly instead of waiting
  // minutes on model/network retries.
  const sorted = [...computed].sort((a, b) => b.score - a.score);
  let aiCount = 0;

  const buildFallbackRecommendation = (c: Computed, fallbackIndex: number) => {
    const ind = c.indicators;
    const atr = ind.atr14 && ind.atr14 > 0 ? ind.atr14 : Math.max(ind.close * 0.018, 0.01);
    const swingPct = ind.close > 0 ? (atr / ind.close) * 100 : 1;
    const volRatio = ind.volRatio ?? 1;
    const rsi = ind.rsi14 ?? 50;
    const trendOk = !!(ind.ema9 && ind.ema21 && ind.ema9 >= ind.ema21);
    const momentumOk = ind.macd == null || ind.macdSignal == null ? true : ind.macd >= ind.macdSignal;
    // Market-regime gate: never emit a fallback BUY in a bearish market.
    const marketBearish = market?.trend === "down";
    // ATR-window gate: avoid both dead-quiet (<1.5%) and overly-volatile (>5%) names.
    const atrInWindow = swingPct >= 1.5 && swingPct <= 5;
    const strong =
      !marketBearish && atrInWindow &&
      c.score >= 75 && volRatio >= 1.4 && trendOk && momentumOk && rsi <= 68;
    const rankedFallbackBuy =
      !marketBearish && atrInWindow &&
      fallbackIndex < 2 && c.score >= 72 && volRatio >= 1.3 &&
      trendOk && momentumOk && rsi <= 68;
    const targetPct = strong ? Math.min(5, Math.max(1.8, swingPct * 0.75)) : Math.min(2.5, Math.max(1.1, swingPct * 0.6));
    // ATR-based stop: floor at 2%, cap at 3.5%, sized to 1.2× ATR to avoid false stop-outs.
    const stopPct = Math.min(3.5, Math.max(2, swingPct * 1.2));
    const entryMin = +(ind.close - atr * 0.15).toFixed(2);
    const entryMax = +(ind.close + atr * 0.15).toFixed(2);
    const target = +(ind.close * (1 + targetPct / 100)).toFixed(2);
    const stopLoss = +(ind.close * (1 - stopPct / 100)).toFixed(2);
    const risk = ind.close - stopLoss;
    const reward = target - ind.close;
    const confidence = Math.round(Math.max(58, Math.min(84, 52 + c.score * 0.28 + Math.min(10, volRatio * 3) + (trendOk ? 5 : 0) + (momentumOk ? 4 : 0))));
    const reasons = [
      `اختيار احتياطي ذكي بعد تعذر تحليل AI: Score فني ${c.score.toFixed(0)}/100`,
      trendOk ? "الاتجاه القصير صاعد" : "ترتيب قوي مقارنة بباقي الأسهم المتاحة",
      volRatio >= 1.2 ? `حجم التداول أعلى من المتوسط ×${volRatio.toFixed(1)}` : `حركة يومية متوقعة ${swingPct.toFixed(1)}%`,
    ];

    // Confidence floor (78) applies to every fallback BUY — matches the
    // AI-path verifier rule. Without this, fallback rows slip through with
    // confidence 58-77 and dominate the day's recommendations (the exact
    // pattern audited on 2026-06-07 with ATQA conf=44/50).
    const fallbackSignal: "buy" | "neutral" =
      (strong || rankedFallbackBuy) && confidence >= 78 ? "buy" : "neutral";
    return {
      scan_id: scanId,
      symbol: c.symbol,
      signal: fallbackSignal,
      confidence,
      reasons_ar: reasons,
      entry_min: entryMin,
      entry_max: entryMax,
      target,
      stop_loss: stopLoss,
      timeframe_days: 1,
      risk_note_ar: "توصية احتياطية مبنية على القواعد الفنية عند عدم توفر رصيد AI؛ الالتزام بوقف الخسارة ضروري.",
      price_at_reco: ind.close,
      rr_ratio: risk > 0 ? +(reward / risk).toFixed(2) : null,
      position_size_pct: fallbackIndex === 0 ? 25 : 15,
      ai_model: "rule-based-fallback",
      entry_timing_ar: "دخول تدريجي قرب سعر الإغلاق مع تأكيد أول نصف ساعة",
      partial_exit_pct: 1,
      max_hold_days: 1,
      expected_gain_pct: +targetPct.toFixed(2),
      expected_next_day_pct: +Math.min(targetPct, Math.max(1, swingPct * 0.55)).toFixed(2),
      market_trend: market?.trend ?? null,
      rejected_by_rules: false,
      rejection_reason: null,
      verifier_approved: null,
      verifier_reason: "تم استخدام فلتر قواعد احتياطي بسبب فشل بوابة AI.",
      original_signal: "rule_based",
      technical_score: c.score,
      fundamental_score: null,
      sentiment_score: null,
      macro_score: null,
      sector_score: null,
      ensemble_agreement: null,
      data_completeness: 70,
      raw_ai_response: { fallback: true, reason: "AI unavailable", swingPct, volRatio, rsi, trendOk, momentumOk },
    };
  };

  // Fetch fresh Arabic news in parallel for the top 15 candidates BEFORE AI runs
  // (cheap, ~4-12s total). Skips silently if Firecrawl key is missing.
  const newsTargets = sorted.slice(0, 15).map((c) => ({ symbol: c.symbol, nameAr: c.nameAr }));
  let newsMap: Map<string, StockNews> = new Map();
  try {
    if (process.env.FIRECRAWL_API_KEY) {
      newsMap = await fetchNewsBulk(newsTargets, 4);
    }
  } catch (e) {
    warnings.push(`فشل جلب الأخبار: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Pre-compute weekly context once per symbol from the same daily candles
  const weeklyBySymbol = new Map<string, WeeklyContext>();
  for (const c of computed) {
    const candles = historyData.get(c.symbol.toUpperCase());
    weeklyBySymbol.set(c.symbol.toUpperCase(), computeWeeklyContext(candles));
  }

  // Bulk per-symbol intelligence loads (sentiment velocity + earnings surprise streak).
  const symbolUppers = computed.map((c) => c.symbol.toUpperCase());
  const [sentVelMap, earnSurpMap] = await Promise.all([
    loadSentimentVelocity(symbolUppers).catch(() => new Map()),
    loadEarningsSurprise(symbolUppers).catch(() => new Map()),
  ]);

  // Once-per-scan: RL bandit (best confidence threshold) + A/B test.
  // These are informational summaries persisted on every recommendation.
  const [banditRes, abRes] = await Promise.all([
    runBandit().catch(() => null),
    runABTest().catch(() => null),
  ]);
  const marketCandles = historyData.get("EGX30");

  const aiSlice = sorted.slice(0, FAST_AI_MAX);
  for (const [index, c] of aiSlice.entries()) {
    if (!(await isScanStillRunning())) {
      throw new Error("scan cancelled");
    }
    if (index > 0) await delay(AI_DELAY_MS);
    const symKey = c.symbol.toUpperCase();
    const weekly = weeklyBySymbol.get(symKey) ?? null;
    const sector = sectorCtx.bySymbol.get(symKey) ?? null;
    const news = newsMap.get(symKey) ?? null;
    try {
      const ai = await analyzeStock({
        symbol: c.symbol,
        nameAr: c.nameAr,
        ind: c.indicators,
        suggested: c.suggested,
        history: historyData.get(c.symbol.toUpperCase()),
        market,
        performance,
        weekly,
        sector,
        news,
        timeoutMs: AI_ANALYSIS_TIMEOUT_MS,
      });

      // Phase 1.5: 5-dimensional score gate (computed first so rule-gate can use it)
      const fundamentals = fundamentalsMap.get(c.symbol.toUpperCase()) ?? null;
      const fiveDim = computeFiveDimScores({
        ind: c.indicators,
        market,
        sector,
        news,
        fundamentals,
        macro: macroSnap,
      });

      // Phase 1: hard rule gate (now learning-aware via signal_failures)
      const gate = applyRuleGate(
        ai,
        c.indicators,
        market,
        weekly,
        sector,
        news,
        activeFailures,
        { technical: fiveDim.technical, sentiment: fiveDim.sentiment, sector: fiveDim.sector },
        null,
      );
      let finalSignal = gate.signal;
      let rejectedByRules = gate.rejected;
      let rejectionReason = gate.reason;
      let verifierApproved: boolean | null = null;
      let verifierReason: string | null = null;
      let finalConfidence = Math.max(0, ai.confidence - gate.confidencePenalty);

      // Earnings blackout — never buy within 3 days of earnings
      if (isEarningsBlackout(fundamentals) && (finalSignal === "buy" || finalSignal === "strong_buy")) {
        finalSignal = "neutral";
        rejectedByRules = true;
        rejectionReason = `(${rejectionReason ?? ""}) قرب موعد إعلان الأرباح — انتظر بعد الإعلان`.trim();
      }

      // 5-dim hard gate
      if (!fiveDim.passes && (finalSignal === "buy" || finalSignal === "strong_buy")) {
        finalSignal = "neutral";
        rejectedByRules = true;
        rejectionReason = `فشل التصفية متعددة الأبعاد: ${fiveDim.failures.join(" • ")}`;
      }

      // Phase 1.7: Advanced technical (VWAP + Volume Profile + strong patterns)
      const adv = computeAdvancedTechnical(historyData.get(c.symbol.toUpperCase()), c.indicators.close);
      // If advanced score is very weak on a bullish pick, demote
      if (adv.bullishScore < 35 && (finalSignal === "buy" || finalSignal === "strong_buy")) {
        if (finalSignal === "strong_buy") finalSignal = "buy";
        finalConfidence = Math.max(40, finalConfidence - 10);
      } else if (adv.bullishScore >= 70 && finalSignal === "buy") {
        // Strong tech confirmation slightly boosts confidence
        finalConfidence = Math.min(95, finalConfidence + 4);
      }

      // Phase 1.8: Anomaly detection — unusual volume/price action
      const anomalyReport = detectAnomalies(historyData.get(c.symbol.toUpperCase()), c.indicators);
      if ((finalSignal === "buy" || finalSignal === "strong_buy") && anomalyReport.anomalies.length > 0) {
        finalConfidence = Math.max(30, Math.min(95, finalConfidence + anomalyReport.netDelta));
        // Extreme bearish anomaly (gap down + exhaustion) → demote
        if (anomalyReport.netDelta <= -12) {
          if (finalSignal === "strong_buy") finalSignal = "buy";
          else {
            finalSignal = "neutral";
            rejectedByRules = true;
            rejectionReason = `حركة غير طبيعية سلبية: ${anomalyReport.anomalies.map((a) => a.description_ar).join(" • ")}`;
          }
        }
      }

      // Phase 1.6: ensemble vote (second AI) for bullish picks
      let ensembleAgreement: number | null = null;
      if (!rejectedByRules && index < FAST_ENSEMBLE_MAX && (finalSignal === "buy" || finalSignal === "strong_buy")) {
        try {
          const ens = await withTimeout(
            ensembleVote({
              symbol: c.symbol,
              nameAr: c.nameAr,
              ind: c.indicators,
              primary: ai,
              scores: fiveDim,
              scanId,
            }),
            AI_ENSEMBLE_TIMEOUT_MS,
            `${c.symbol}: انتهت مهلة نموذج التأكيد`,
          );
          ensembleAgreement = ens.agreementScore;
          finalSignal = ens.finalSignal;
          finalConfidence = ens.finalConfidence;
          if (ens.agreement === "conflict") {
            rejectedByRules = true;
            rejectionReason = `النموذجان غير متفقين: الأساسي=${ai.signal} والثاني=${ens.secondary?.vote}`;
          }
        } catch {
          // ensemble failure → continue with primary only, mild confidence cut
          finalConfidence = Math.max(40, finalConfidence - 8);
        }
      }

      // Phase 2: AI verifier for top 10 bullish picks that passed the gate
      const isTopBullish =
        !rejectedByRules &&
        (finalSignal === "buy" || finalSignal === "strong_buy") &&
          index < FAST_VERIFIER_MAX;
      if (isTopBullish) {
        try {
          const v = await withTimeout(
            verifyPick({
              symbol: c.symbol,
              nameAr: c.nameAr,
              signal: finalSignal as "buy" | "strong_buy",
              primaryConfidence: ai.confidence,
              ind: c.indicators,
              history: historyData.get(c.symbol.toUpperCase()),
              market,
              expectedNextDayPct: ai.expected_next_day_pct,
            }),
            AI_VERIFIER_TIMEOUT_MS,
            `${c.symbol}: انتهت مهلة المحكّم`,
          );
          verifierApproved = v.approved;
          verifierReason = v.reason_ar;
          if (!v.approved) {
            // Demote one step instead of nuking to neutral:
            // strong_buy → buy (with confidence cut); buy → neutral.
            if (finalSignal === "strong_buy") {
              finalSignal = "buy";
              finalConfidence = Math.max(40, finalConfidence - 15);
              verifierReason = `خفّض المحكّم إلى شراء عادي: ${v.reason_ar}`;
            } else {
              finalSignal = "neutral";
              rejectedByRules = true;
              rejectionReason = `المحكّم الثاني رفض: ${v.reason_ar}`;
            }
          } else if (v.adjusted_confidence != null) {
            finalConfidence = Math.min(finalConfidence, v.adjusted_confidence);
          }
        } catch (e) {
          // verifier failure shouldn't kill the recommendation
          verifierReason = `فشل المحكّم: ${e instanceof Error ? e.message : String(e)}`;
        }
      }

      // ============================================================
      // FINAL QUALITY GATES (applied to AI picks before persistence)
      //   1) Market-regime gate: no BUY when EGX30 trend is "down".
      //   2) Confidence floor: BUY must clear 78 (strong_buy 82).
      // ============================================================
      if ((finalSignal === "buy" || finalSignal === "strong_buy") && market?.trend === "down") {
        finalSignal = "neutral";
        rejectedByRules = true;
        rejectionReason = `اتجاه السوق العام هابط (EGX30) — ممنوع شراء جديد`;
      }
      if (finalSignal === "strong_buy" && finalConfidence < 82) {
        finalSignal = "buy";
      }
      if (finalSignal === "buy" && finalConfidence < 78) {
        finalSignal = "neutral";
        rejectedByRules = true;
        rejectionReason = `الثقة النهائية ${finalConfidence.toFixed(0)}% أقل من الحد الأدنى 78%`;
      }

      const risk = c.indicators.close - ai.stop_loss;
      const reward = ai.target - c.indicators.close;
      const rrRatio = risk > 0 ? +(reward / risk).toFixed(2) : 0;

      // ============================================================
      // ATR-BASED LEVELS & FIXED-FRACTIONAL POSITION SIZING
      // Override the AI's suggested entry/stop/target with deterministic
      // ATR-based levels (1.5× ATR stop, 3× ATR target → R:R = 2:1).
      // Then size the position so a stop-loss hit risks exactly ~1% of equity.
      // ============================================================
      const lvl = canonicalLevels(c.indicators);
      const useCanonical = lvl.source === "atr" && (finalSignal === "buy" || finalSignal === "strong_buy");
      const finalEntryMin = useCanonical ? lvl.entryMin : ai.entry_min;
      const finalEntryMax = useCanonical ? lvl.entryMax : ai.entry_max;
      const finalTarget = useCanonical ? lvl.target : ai.target;
      const finalStop = useCanonical ? lvl.stopLoss : ai.stop_loss;
      const finalRr = useCanonical
        ? lvl.rrRatio
        : (finalStop > 0 && c.indicators.close > finalStop
            ? +(((finalTarget - c.indicators.close) / (c.indicators.close - finalStop))).toFixed(2)
            : rrRatio);

      // Position sizing: risk 1% of equity per trade, adjusted by Kelly + correlation.
      const stopDistPct = c.indicators.close > 0
        ? ((c.indicators.close - finalStop) / c.indicators.close) * 100
        : 2;

      // Correlation against already-accepted picks
      const corr = correlationMultiplier({
        candidate: historyData.get(c.symbol.toUpperCase()),
        accepted: acceptedPicks,
      });
      const riskMult = combinedRiskMultiplier({ kelly: kellyMult, correlation: corr.multiplier });

      const positionPct = (finalSignal === "buy" || finalSignal === "strong_buy")
        ? (() => {
            const risk = 1.0; // 1% portfolio risk per trade
            if (stopDistPct <= 0) return 1;
            const base = risk / (stopDistPct / 100);
            const scaler = Math.min(1.5, Math.max(0.5, finalConfidence / 70));
            return +Math.min(10, Math.max(0.5, base * scaler * riskMult)).toFixed(2);
          })()
        : 0.5;

      if (finalSignal === "buy" || finalSignal === "strong_buy") {
        acceptedPicks.push({ symbol: c.symbol, candles: historyData.get(c.symbol.toUpperCase()) });
        acceptedSectors.push({
          symbol: c.symbol,
          sector: (stocks.find((s) => s.symbol.toUpperCase() === c.symbol.toUpperCase())?.sector_ar) ?? null,
          confidence: finalConfidence,
        });
      }

      // Phase 1.9: Apply regime confidence multiplier (market-wide context).
      if (finalSignal === "buy" || finalSignal === "strong_buy") {
        finalConfidence = Math.round(
          Math.max(30, Math.min(95, finalConfidence * regime.confidence_multiplier)),
        );
      }

      // Phase 2.0: Monte Carlo probabilistic projection (only for bullish picks).
      const mc = (finalSignal === "buy" || finalSignal === "strong_buy")
        ? monteCarloProject({
            candles: historyData.get(c.symbol.toUpperCase()),
            currentPrice: c.indicators.close,
            target: finalTarget,
            stopLoss: finalStop,
            horizonDays: ai.timeframe_days ?? 30,
          })
        : null;

      // If Monte Carlo says profit probability is very low → demote.
      if (mc && mc.prob_profit < 35 && (finalSignal === "buy" || finalSignal === "strong_buy")) {
        if (finalSignal === "strong_buy") finalSignal = "buy";
        finalConfidence = Math.max(35, finalConfidence - 10);
      }

      // Phase 2.05: Multi-timeframe confluence — daily + weekly + market.
      const confluence = computeConfluence(c.indicators, weekly, market);
      if ((finalSignal === "buy" || finalSignal === "strong_buy")) {
        if (confluence.aligned && confluence.bullishVotes >= 2) {
          finalConfidence = Math.min(95, finalConfidence + 6);
        } else if (confluence.conflict) {
          finalConfidence = Math.max(35, finalConfidence - 8);
        }
      }

      // Phase 2.06: Volume/Price divergence — bearish divergence on a buy → demote.
      const vpd = detectVPD(historyData.get(c.symbol.toUpperCase()));
      if (vpd.detected && vpd.type === "bearish_divergence"
          && (finalSignal === "buy" || finalSignal === "strong_buy")) {
        if (finalSignal === "strong_buy") finalSignal = "buy";
        finalConfidence = Math.max(35, finalConfidence - Math.min(12, Math.round(vpd.strength / 8)));
      }

      // Phase 2.07: Sector rotation — boost leaders, penalise laggards.
      const sectorName = sector?.sector ?? null;
      const rotationDelta = sectorName ? (rotation.sectorBoost.get(sectorName) ?? 0) : 0;
      if (rotationDelta !== 0 && (finalSignal === "buy" || finalSignal === "strong_buy")) {
        finalConfidence = Math.max(30, Math.min(95, finalConfidence + rotationDelta));
      }

      // Phase 2.08: Per-symbol pattern memory — historical performance prior.
      const mem = symbolMemory.get(c.symbol);
      if (mem && (finalSignal === "buy" || finalSignal === "strong_buy")) {
        finalConfidence = Math.max(30, Math.min(95, finalConfidence + mem.confidenceDelta));
      }

      // Phase 2.09: Bayesian confidence calibration — last step before persistence.
      // First apply remaining intelligence modules:
      //  - Liquidity (cap position & penalise illiquid)
      //  - Ensemble disagreement across 5 dims
      //  - Contrarian (over-consensus haircut)
      //  - Market breadth (healthy market boosts, weak market penalises)
      //  - Cross-asset macro tilt
      const liquidity = assessLiquidity(c.indicators);
      const disagreement = computeDisagreement({
        technical: fiveDim.technical,
        fundamental: fiveDim.fundamental,
        sentiment: fiveDim.sentiment,
        macro: fiveDim.macro,
        sector: fiveDim.sector,
      });
      const contrarian = detectContrarian({
        ind: c.indicators,
        news,
        ensembleAgreement,
        changePct5d: market?.change_5d_pct ?? undefined,
      });
      const crossAsset = computeCrossAsset(macroSnap, historyData.get(c.symbol.toUpperCase()));

      if (finalSignal === "buy" || finalSignal === "strong_buy") {
        finalConfidence = Math.max(
          30,
          Math.min(95,
            finalConfidence
              + liquidity.confidenceDelta
              + disagreement.confidenceDelta
              + contrarian.confidenceDelta
              + breadth.confidenceDelta
              + crossAsset.confidenceDelta,
          ),
        );
        // Demote illiquid bullish picks outright
        if (liquidity.tier === "illiquid") {
          finalSignal = "neutral";
          rejectedByRules = true;
          rejectionReason = (rejectionReason ? rejectionReason + " • " : "") + "سيولة غير كافية للتنفيذ";
        }
      }

      // ============================================================
      // New intelligence layers (per-pick): block trade, anomaly alert,
      // sentiment velocity, earnings streak, multi-horizon, ATR target check.
      // ============================================================
      const candlesForSym = historyData.get(c.symbol.toUpperCase());
      const blockTrade = detectBlockTrade(c.indicators, candlesForSym);
      const anomalyAlert = detectAnomalyAlert(c.indicators, candlesForSym, news ?? undefined);
      const sentVel = sentVelMap.get(c.symbol.toUpperCase()) ?? {
        velocity: 0, trend: "stable" as const, label_ar: "", confidenceDelta: 0, sampleSize: 0, symbol: c.symbol,
      };
      const earnSurp = earnSurpMap.get(c.symbol.toUpperCase()) ?? {
        streak: 0, label_ar: "", confidenceDelta: 0, symbol: c.symbol,
      };
      const horizons = multiHorizonForecast(c.indicators, candlesForSym);
      const atrSuggested = atrLevels(c.indicators.close, c.indicators);

      // ============================================================
      // New advanced layers: relative strength, seasonality, sequence
      // forecast, stacking ensemble, Bayesian update.
      // ============================================================
      const relStrength = computeRelativeStrength(candlesForSym, marketCandles);
      const seasonality = detectSeasonality(candlesForSym);
      const seqForecast = sequenceForecast(candlesForSym);
      const stacking = stackingEnsemble(fiveDim);

      if (finalSignal === "buy" || finalSignal === "strong_buy") {
        finalConfidence = Math.max(
          30,
          Math.min(95,
            finalConfidence
              + blockTrade.confidenceDelta
              + anomalyAlert.confidenceDelta
              + sentVel.confidenceDelta
              + earnSurp.confidenceDelta
              + relStrength.confidenceDelta
              + seasonality.confidenceDelta
              + seqForecast.confidenceDelta
              + stacking.confidenceDelta,
          ),
        );
      }

      const rawConfidence = Math.round(finalConfidence);
      const calibratedConfidence = calibrateConfidence(rawConfidence, calibration);

      // Meta-learner: blends 5-dim scores using learned weights → probability of profit.
      const metaProb = metaPredict(
        {
          technical: fiveDim.technical,
          fundamental: fiveDim.fundamental,
          sentiment: fiveDim.sentiment,
          macro: fiveDim.macro,
          sector: fiveDim.sector,
        },
        activeMeta,
      );
      // Blend: 60% rule-based calibrated confidence, 40% meta-learner probability (when fitted).
      const blended = activeMeta.fitted
        ? Math.round(calibratedConfidence * 0.6 + metaProb * 0.4)
        : calibratedConfidence;

      // Probability calibration (reliability-based isotonic mapping) → true probability.
      const probTrue = calibrateProbability(blended, reliability);

      // Bayesian dynamic update — combine blended prior with new evidence pieces.
      const bayesianRes = bayesianUpdate(blended, [
        { label: "stacking", probability: stacking.stackedProb, reliability: 0.5 },
        { label: "sequence", probability: seqForecast.direction === "up" ? 65 : seqForecast.direction === "down" ? 35 : 50, reliability: 0.4 },
        { label: "relative_strength", probability: relStrength.isLeader ? 65 : relStrength.isLaggard ? 35 : 50, reliability: 0.45 },
        { label: "seasonality", probability: seasonality.bias === "bullish" ? 60 : seasonality.bias === "bearish" ? 40 : 50, reliability: 0.25 },
      ]);

      // Confidence interval around probTrue — wider = less certain → smaller size.
      const ci = wilsonCI(probTrue, Math.max(20, activeMeta.sampleSize));

      // Drift penalty applied last to every pick.
      // Use Bayesian posterior as the new blended baseline.
      finalConfidence = Math.max(30, Math.min(95, bayesianRes.posteriorPct - drift.confidencePenalty));

      // ── Intelligence Boost Layer ─────────────────────────────────────────
      // 1) Similar Setup Boost: لو إعدادات تاريخية مشابهة نجحت بنسبة عالية
      //    بنرفع الثقة. لو فشلت بنخفضها. شفافية كاملة من البيانات الفعلية.
      // 2) LLM Sanity-Check: تحكيم نموذج Pro مستقل (endorse=+12%, reject=-35%).
      // 3) Isotonic Calibration: تعديل نهائي يحوّل الـ confidence الخام
      //    إلى ما يطابق فعلياً تاريخ أداء النظام.
      let setupBoost = 0;
      let setupLabel = "";
      let setupWinRate = 0;
      let setupSampleSize = 0;
      let llmVerdict: "endorse" | "neutral" | "reject" = "neutral";
      let llmReason = "";
      try {
        if (index < FAST_VERIFIER_MAX && (finalSignal === "buy" || finalSignal === "strong_buy")) {
          const sim = await similarSetupBoost({
            signal: finalSignal,
            rsi: c.indicators.rsi14,
            macdHist: c.indicators.macdHist,
          });
          setupBoost = sim.confidenceDelta;
          setupLabel = sim.label_ar;
          setupWinRate = sim.winRate;
          setupSampleSize = sim.sampleSize;
          finalConfidence = Math.max(30, Math.min(95, finalConfidence + setupBoost));
        }
      } catch { /* never break the scan */ }

      try {
        if (finalSignal === "buy" || finalSignal === "strong_buy") {
          const verdict = await withTimeout(
            llmSanityCheck({
              symbol: c.symbol,
              signal: finalSignal,
              confidence: finalConfidence,
              regime: regime.regime,
              signals: [
                { name: "technical", value: Number(fiveDim.technical ?? 50), confidence: 0.7 },
                { name: "fundamental", value: Number(fiveDim.fundamental ?? 50), confidence: 0.6 },
                { name: "sentiment", value: Number(fiveDim.sentiment ?? 50), confidence: 0.5 },
                { name: "macro", value: Number(fiveDim.macro ?? 50), confidence: 0.6 },
                { name: "sector", value: Number(fiveDim.sector ?? 50), confidence: 0.5 },
              ],
            }),
            AI_VERIFIER_TIMEOUT_MS,
            `${c.symbol}: انتهت مهلة فحص سلامة LLM`,
          );
          llmVerdict = verdict.verdict;
          llmReason = verdict.reason;
          finalConfidence = Math.max(30, Math.min(95, finalConfidence * verdict.multiplier));
        }
      } catch { /* never break the scan */ }

      // Isotonic recalibration — applied last, lifts confidence to match
      // actual historical win-rate for that confidence bucket.
      const preIsotonic = Math.round(finalConfidence);
      finalConfidence = applyIsotonic(preIsotonic, isotonic);

      // Market-trend tailwind: لو الاتجاه العام للسوق صاعد وإشارتنا شراء،
      // نضيف +3 ثقة (لا نخفّض أبداً — العقوبات بتيجي من طبقات تانية).
      try {
        const mt = market?.trend as string | undefined;
        if (
          (finalSignal === "buy" || finalSignal === "strong_buy") &&
          (mt === "up" || mt === "strong_up")
        ) {
          finalConfidence = Math.min(95, finalConfidence + 3);
        }
      } catch {}

      // ── Auto Orchestrator ────────────────────────────────────────────────
      // Runs every standalone module (VPIN, realized vol, mamba-SSM, mixture
      // density, diffusion paths, OOD detection, memory recall, …) and blends
      // their signals into finalConfidence. New modules added via
      // auto-orchestrator.server.ts are picked up automatically — no further
      // wiring is needed inside run-scan.
      try {
          const auto = await withTimeout(
            runAutoModules({
              symbol: c.symbol,
              indicators: c.indicators,
              candles: historyData.get(c.symbol.toUpperCase()),
              baseConfidence: finalConfidence,
              signal: finalSignal,
              sector: (stocks.find((s) => s.symbol.toUpperCase() === c.symbol.toUpperCase())?.sector_ar) ?? null,
            }),
            AUTO_MODULES_TIMEOUT_MS,
            `${c.symbol}: انتهت مهلة التحليل الداخلي`,
          );
        if (finalSignal === "buy" || finalSignal === "strong_buy" || finalSignal === "sell") {
          finalConfidence = Math.max(30, Math.min(95, auto.adjustedConfidence));
        }
      } catch {
        // Orchestrator must never break the scan.
      }

      // ── Tier-I: Portfolio correlation guard ─────────────────────────────
      // Damp confidence if too many already-accepted picks share this sector.
      try {
        if (finalSignal === "buy" || finalSignal === "strong_buy") {
          const candidateSector =
            (stocks.find((s) => s.symbol.toUpperCase() === c.symbol.toUpperCase())?.sector_ar) ?? null;
          const penalty = portfolioCorrelationPenalty(
            { sector: candidateSector },
            acceptedSectors,
            2,
          );
          if (penalty < 1) {
            finalConfidence = Math.max(30, Math.min(95, finalConfidence * penalty));
          }
        }
      } catch {}

      // Phase 2.10: Trailing stop plan (informational, attached to UI).
      const trailingPlan = (finalSignal === "buy" || finalSignal === "strong_buy")
        ? buildTrailingStop(c.indicators.close, c.indicators)
        : null;

      // Cap position size by liquidity tier
      const cappedPositionPct = +Math.min(
        positionPct * ci.sizeMultiplier,
        liquidity.positionCapPct,
      ).toFixed(2);

      // Phase 2.1: Explainability — top factors driving this pick.
      const topFactors = buildExplainability({
        ind: c.indicators,
        fiveDim,
        ensembleAgreement,
        regimeMult: regime.confidence_multiplier,
        monteCarloProbProfit: mc?.prob_profit ?? null,
      });

      // Fix A: skip if this symbol already has a BUY today (no duplicates).
      if (finalSignal === "buy" || finalSignal === "strong_buy") {
        const dupSet = await withTimeout(
          getSymbolsBoughtToday([c.symbol]),
          DB_STEP_TIMEOUT_MS,
          `${c.symbol}: انتهت مهلة فحص التكرار`,
        ).catch(() => new Set<string>());
        if (dupSet.has(c.symbol)) {
          finalSignal = "neutral";
        }
      }
      const { data: recoInserted, error: recoErr } = await withTimeout(Promise.resolve(supabaseAdmin.from("recommendations").insert({
        scan_id: scanId,
        symbol: c.symbol,
        signal: finalSignal,
        confidence: Math.round(finalConfidence),
        reasons_ar: ai.reasons_ar,
        entry_min: finalEntryMin,
        entry_max: finalEntryMax,
        target: finalTarget,
        stop_loss: finalStop,
        timeframe_days: ai.timeframe_days,
        risk_note_ar: ai.risk_note_ar,
        price_at_reco: c.indicators.close,
        rr_ratio: finalRr,
        position_size_pct: cappedPositionPct,
        ai_model: AI_MODEL,
        entry_timing_ar: ai.entry_timing_ar,
        partial_exit_pct: ai.partial_exit_pct,
        max_hold_days: ai.max_hold_days,
        expected_gain_pct: +(((finalTarget - (finalEntryMin + finalEntryMax) / 2) / ((finalEntryMin + finalEntryMax) / 2)) * 100).toFixed(2),
        expected_next_day_pct: +ai.expected_next_day_pct.toFixed(2),
        market_trend: market?.trend ?? null,
        rejected_by_rules: rejectedByRules,
        rejection_reason: rejectionReason,
        verifier_approved: verifierApproved,
        verifier_reason: verifierReason,
        original_signal: gate.originalSignal,
        technical_score: fiveDim.technical,
        fundamental_score: fiveDim.fundamental,
        sentiment_score: fiveDim.sentiment,
        macro_score: fiveDim.macro,
        sector_score: fiveDim.sector,
        ensemble_agreement: ensembleAgreement,
        data_completeness: fiveDim.dataCompleteness,
        raw_ai_response: {
          ...ai,
          monte_carlo: mc,
          regime: { name: regime.regime, label_ar: regime.label_ar, description_ar: regime.description_ar, multiplier: regime.confidence_multiplier },
          top_factors: topFactors,
          confluence,
          volume_price_divergence: vpd,
          sector_rotation: {
            sector: sectorName,
            delta: rotationDelta,
            leaders: rotation.leaders,
            laggards: rotation.laggards,
          },
          symbol_memory: mem ?? null,
          calibration: {
            raw_confidence: rawConfidence,
            calibrated_confidence: calibratedConfidence,
            fitted: calibration.fitted,
            sample_size: calibration.sampleSize,
          },
          meta_learner: {
            weights: activeMeta.w,
            bias: activeMeta.b,
            fitted: activeMeta.fitted,
            sample_size: activeMeta.sampleSize,
            train_accuracy: activeMeta.accuracy,
            predicted_prob: metaProb,
            shap: shapExplain(
              {
                technical: fiveDim.technical,
                fundamental: fiveDim.fundamental,
                sentiment: fiveDim.sentiment,
                macro: fiveDim.macro,
                sector: fiveDim.sector,
              },
              activeMeta,
            ),
          },
          probability: {
            true_probability_pct: probTrue,
            brier_score: reliability.brier,
            reliability_fitted: reliability.fitted,
            reliability_sample_size: reliability.sampleSize,
          },
          drift: drift,
          trailing_stop: trailingPlan,
          liquidity,
          disagreement,
          contrarian,
          breadth,
          cross_asset: crossAsset,
          cross_asset_global: crossAssetGlobal,
          intelligence: {
            confidence_interval: ci,
            block_trade: blockTrade,
            anomaly_alert: anomalyAlert,
            sentiment_velocity: sentVel,
            earnings_surprise: earnSurp,
            multi_horizon: horizons,
            atr_levels: atrSuggested,
          },
          advanced: {
            relative_strength: relStrength,
            seasonality,
            sequence_forecast: seqForecast,
            stacking_ensemble: stacking,
            bayesian_update: bayesianRes,
            bandit: banditRes,
            ab_test: abRes,
          },
          intelligence_boost: {
            similar_setup: {
              win_rate: setupWinRate,
              sample_size: setupSampleSize,
              confidence_delta: setupBoost,
              label_ar: setupLabel,
            },
            llm_sanity: {
              verdict: llmVerdict,
              reason: llmReason,
            },
            isotonic: {
              pre: preIsotonic,
              post: Math.round(finalConfidence),
              fitted: isotonic.fitted,
              sample_size: isotonic.sampleSize,
            },
          },
        },
      }).select("id").maybeSingle()), DB_STEP_TIMEOUT_MS, `${c.symbol}: انتهت مهلة حفظ التوصية`);
      // Backfill recommendation_id on ensemble_votes for this (scan_id, symbol)
      // so the meta-learner can link each model's vote to the realized outcome.
      if (recoInserted?.id) {
        try {
          await supabaseAdmin
            .from("ensemble_votes")
            .update({ recommendation_id: recoInserted.id })
            .eq("scan_id", scanId)
            .eq("symbol", c.symbol)
            .is("recommendation_id", null);
        } catch (linkErr) {
          console.warn(`[ensemble-link] ${c.symbol}:`, linkErr instanceof Error ? linkErr.message : linkErr);
        }
      }
      if (recoErr) {
        const msg = `${c.symbol}: فشل حفظ توصية AI: ${recoErr.message}`;
        aiErrors.push(msg);
        console.error("reco insert:", recoErr.message);
      }
      else aiCount++;
    } catch (e) {
      const msg = `${c.symbol}: ${e instanceof Error ? e.message : String(e)}`;
      console.warn(`AI fallback ${c.symbol}:`, e instanceof Error ? e.message : e);
      // Per-stock fallback: when AI fails (rate limit / credit exhausted / parse error),
      // still produce a rule-based recommendation so the user never loses coverage.
      let fallbackSaved = false;
      try {
        if (c.indicators.close > 0) {
          const fallbackRow = buildFallbackRecommendation(c, aiCount);
          const { error: fbErr } = await withTimeout(
            Promise.resolve(supabaseAdmin.from("recommendations").insert(fallbackRow)),
            DB_STEP_TIMEOUT_MS,
            `${c.symbol}: انتهت مهلة حفظ التوصية الاحتياطية`,
          );
          if (!fbErr) {
            aiCount++;
            fallbackSaved = true;
          } else {
            aiErrors.push(`${c.symbol}: فشل حفظ التوصية الاحتياطية: ${fbErr.message}`);
          }
        }
      } catch (fbE) {
        aiErrors.push(`${c.symbol}: خطأ في النظام الاحتياطي: ${fbE instanceof Error ? fbE.message : String(fbE)}`);
      }
      if (fallbackSaved) warnings.push(`${c.symbol}: تم استخدام تحليل احتياطي بدل AI بدون تعطيل المسح`);
      else aiErrors.push(msg);
    }
    // Live update so the dashboard polling sees progress.
    await withTimeout(
      Promise.resolve(supabaseAdmin.from("scans").update({ ai_count: aiCount }).eq("id", scanId)),
      DB_STEP_TIMEOUT_MS,
      `${c.symbol}: انتهت مهلة تحديث تقدم المسح`,
    ).catch(() => undefined);
  }

  const quickCandidates = sorted
    .slice(aiSlice.length, 24)
    .filter((c) => c.indicators.close > 0)
    .filter((c) => market?.trend !== "down")
    .filter((c) => (c.indicators.rsi14 ?? 50) <= 68)
    .filter((c) => (c.indicators.volRatio ?? 1) >= 1.3)
    .filter((c) => {
      const atr = c.indicators.atr14;
      if (atr == null || c.indicators.close <= 0) return false;
      const pct = (atr / c.indicators.close) * 100;
      return pct >= 1.5 && pct <= 5;
    })
    .filter((c) => c.score >= 72);

  // Fix A: drop any candidate whose symbol already has a BUY today (AI or fallback).
  const quickDupSet = await getSymbolsBoughtToday(quickCandidates.map((c) => c.symbol));
  const quickFallbackRows = quickCandidates
    .filter((c) => !quickDupSet.has(c.symbol))
    .map((c, i) => buildFallbackRecommendation(c, aiCount + i + 1))
    // Belt-and-suspenders: drop rows that the fallback builder downgraded to neutral
    // — they aren't actionable picks and shouldn't pollute the recommendations table.
    .filter((r) => r.signal === "buy");

  if (quickFallbackRows.length > 0) {
    const { error: quickErr } = await supabaseAdmin.from("recommendations").insert(quickFallbackRows);
    if (quickErr) {
      aiErrors.push(`فشل حفظ التغطية السريعة: ${quickErr.message}`);
    } else {
      aiCount += quickFallbackRows.length;
      await supabaseAdmin.from("scans").update({ ai_count: aiCount }).eq("id", scanId);
    }
  }

  if (aiCount === 0) {
    const zeroAiCandidates = sorted
      .filter((c) => c.indicators.close > 0)
      .filter((c) => market?.trend !== "down")
      .filter((c) => (c.indicators.rsi14 ?? 50) <= 68)
      .filter((c) => (c.indicators.volRatio ?? 1) >= 1.3)
      .filter((c) => {
        const atr = c.indicators.atr14;
        if (atr == null || c.indicators.close <= 0) return false;
        const pct = (atr / c.indicators.close) * 100;
        return pct >= 1.5 && pct <= 5;
      })
      .filter((c) => c.score >= 72)
      .slice(0, 6);

    // Fix A: dedupe vs today's existing BUYs.
    const zeroDupSet = await getSymbolsBoughtToday(zeroAiCandidates.map((c) => c.symbol));
    const fallbackRows = zeroAiCandidates
      .filter((c) => !zeroDupSet.has(c.symbol))
      .map((c, i) => buildFallbackRecommendation(c, i))
      .filter((r) => r.signal === "buy")
      .slice(0, 3);

    if (fallbackRows.length > 0) {
      const { error: fallbackErr } = await supabaseAdmin.from("recommendations").insert(fallbackRows);
      if (fallbackErr) {
        const msg = `فشل حفظ توصيات النظام الاحتياطي: ${fallbackErr.message}`;
        aiErrors.push(msg);
        console.error("fallback reco insert:", fallbackErr.message);
      } else {
        aiCount = fallbackRows.length;
        warnings.push("تم استخدام نظام توصيات احتياطي ذكي لأن تحليل AI لم يُنتج توصيات.");
      }
    }
  }

  const allErrors = [...saveErrors, ...aiErrors];
  const errorMessage = allErrors.length > 0 || warnings.length > 0
    ? summarizeFailures("اكتمل المسح مع تنبيهات", [...warnings, ...allErrors])
    : null;

  // ============================================================
  // Portfolio Correlation Filter — cap picks per sector across the
  // whole scan, so the user never gets 5 picks from one sector.
  // ============================================================
  try {
    const { data: scanRecs } = await supabaseAdmin
      .from("recommendations")
      .select("id, symbol, signal, confidence, rejected_by_rules, rejection_reason")
      .eq("scan_id", scanId)
      .in("signal", ["buy", "strong_buy"]);

    if (scanRecs && scanRecs.length > 0) {
      const sectorBySymbol = new Map(stocks.map((s) => [s.symbol.toUpperCase(), s.sector_ar ?? null]));
      const picks: (PFPick & { id: string })[] = scanRecs.map((r) => ({
        id: r.id,
        symbol: r.symbol,
        sector: sectorBySymbol.get(r.symbol.toUpperCase()) ?? null,
        signal: r.signal as string,
        confidence: r.confidence,
        rejected_by_rules: r.rejected_by_rules,
        rejection_reason: r.rejection_reason,
      }));
      const { picks: filtered, demoted } = applyPortfolioFilter(picks);
      for (const p of filtered) {
        if (p.rejected_by_rules && p.signal === "neutral" && p.rejection_reason?.includes("تنويع المحفظة")) {
          await supabaseAdmin
            .from("recommendations")
            .update({
              signal: "neutral",
              rejected_by_rules: true,
              rejection_reason: p.rejection_reason,
            })
            .eq("id", p.id);
        }
      }
      if (demoted > 0) warnings.push(`تنويع المحفظة: تم تأجيل ${demoted} توصية لتجنب تركز قطاعي`);
    }
  } catch (e) {
    warnings.push(`فشل فلتر تنويع المحفظة: ${e instanceof Error ? e.message : String(e)}`);
  }

  await supabaseAdmin
    .from("scans")
    .update({
      status: "completed",
      finished_at: new Date().toISOString(),
      source_provider: primaryProvider,
      stocks_count: computed.length,
      ai_count: aiCount,
      error_message: errorMessage,
    })
    .eq("id", scanId);

  return {
    scanId,
    stocks: computed.length,
    ai: aiCount,
    fetched: fetchedCount,
    cached: cachedCount,
    errors: allErrors,
    warnings,
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function indicatorsFromTv(tv: TvSnapshot): Indicators {
  const prevClose = tv.close - tv.change_abs;
  const volAvg = tv.volAvg20 ?? 0;
  const volRatio = volAvg > 0 ? tv.volume / volAvg : 0;
  // Use 3-month low/high as support/resistance (TradingView precomputed).
  const support = tv.low3m ?? tv.low;
  const resistance = tv.high3m ?? tv.high;
  return {
    close: tv.close,
    prevClose,
    changePct: tv.change_pct,
    rsi14: tv.rsi14,
    macd: tv.macd,
    macdSignal: tv.macdSignal,
    macdHist: tv.macdHist,
    ema9: tv.ema9,
    ema21: tv.ema21,
    sma50: tv.sma50,
    sma200: null,
    bbUpper: tv.bbUpper,
    bbMid: tv.bbMid,
    bbLower: tv.bbLower,
    atr14: tv.atr14,
    volAvg20: volAvg,
    volRatio: +volRatio.toFixed(2),
    support,
    resistance,
    priorHigh20: resistance,
    patterns: [],
  };
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function nullableNum(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizePatterns(value: unknown): PatternHit[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const p = item as Partial<PatternHit>;
    return [{
      name: String(p.name ?? "pattern"),
      name_ar: String(p.name_ar ?? "نمط فني"),
      bullish: Boolean(p.bullish),
    }];
  });
}

function indicatorsFromSnapshot(row: SnapshotRow): Indicators {
  return {
    close: num(row.close),
    prevClose: num(row.prev_close, num(row.close)),
    changePct: num(row.change_pct),
    rsi14: nullableNum(row.rsi14),
    macd: nullableNum(row.macd),
    macdSignal: nullableNum(row.macd_signal),
    macdHist: nullableNum(row.macd_hist),
    ema9: nullableNum(row.ema9),
    ema21: nullableNum(row.ema21),
    sma50: nullableNum(row.sma50),
    sma200: null,
    bbUpper: nullableNum(row.bb_upper),
    bbMid: nullableNum(row.bb_mid),
    bbLower: nullableNum(row.bb_lower),
    atr14: nullableNum(row.atr14),
    volAvg20: num(row.vol_avg20),
    volRatio: num(row.vol_ratio),
    support: num(row.support, num(row.close)),
    resistance: num(row.resistance, num(row.close)),
    priorHigh20: num(row.resistance, num(row.close)),
    patterns: normalizePatterns(row.patterns),
  };
}

function indicatorsWithLiveTick(
  base: Indicators,
  live: { price: number | string; volume: number | null; ts: string; source: string },
): Indicators {
  const close = num(live.price, base.close);
  const prevClose = base.prevClose > 0 ? base.prevClose : base.close;
  const volume = live.volume ?? 0;
  const volRatio = base.volAvg20 > 0 && volume > 0 ? +(volume / base.volAvg20).toFixed(2) : base.volRatio;
  return {
    ...base,
    close,
    prevClose,
    changePct: prevClose > 0 ? +(((close - prevClose) / prevClose) * 100).toFixed(2) : base.changePct,
    volRatio,
    support: Math.min(base.support, close),
    resistance: Math.max(base.resistance, close),
    priorHigh20: Math.max(base.priorHigh20, close),
  };
}

function snapshotFromCached(
  scanId: string,
  row: SnapshotRow,
  provider: string,
  ind = indicatorsFromSnapshot(row),
  live?: { price: number | string; volume: number | null; ts: string; source: string },
): SnapshotInsert {
  return {
    scan_id: scanId,
    symbol: row.symbol,
    ts: live?.ts ?? row.ts,
    open: nullableNum(row.open),
    high: nullableNum(row.high),
    low: nullableNum(row.low),
    close: ind.close,
    prev_close: ind.prevClose,
    change_pct: ind.changePct,
    volume: live?.volume ?? row.volume,
    rsi14: ind.rsi14,
    macd: ind.macd,
    macd_signal: ind.macdSignal,
    macd_hist: ind.macdHist,
    ema9: ind.ema9,
    ema21: ind.ema21,
    sma50: ind.sma50,
    bb_upper: ind.bbUpper,
    bb_mid: ind.bbMid,
    bb_lower: ind.bbLower,
    atr14: ind.atr14,
    vol_avg20: ind.volAvg20,
    vol_ratio: ind.volRatio,
    support: ind.support,
    resistance: ind.resistance,
    patterns: ind.patterns,
    composite_score: computeScore(ind),
    data_provider: provider,
  };
}

function snapshotFromCandles(
  scanId: string,
  symbol: string,
  candles: Candle[],
  ind: Indicators,
  ts: string,
): SnapshotInsert {
  const last = candles[candles.length - 1];
  return {
    scan_id: scanId,
    symbol,
    ts,
    open: last.open,
    high: last.high,
    low: last.low,
    close: ind.close,
    prev_close: ind.prevClose,
    change_pct: ind.changePct,
    volume: Math.round(last.volume),
    rsi14: ind.rsi14,
    macd: ind.macd,
    macd_signal: ind.macdSignal,
    macd_hist: ind.macdHist,
    ema9: ind.ema9,
    ema21: ind.ema21,
    sma50: ind.sma50,
    bb_upper: ind.bbUpper,
    bb_mid: ind.bbMid,
    bb_lower: ind.bbLower,
    atr14: ind.atr14,
    vol_avg20: ind.volAvg20,
    vol_ratio: ind.volRatio,
    support: ind.support,
    resistance: ind.resistance,
    patterns: ind.patterns,
    composite_score: computeScore(ind),
    data_provider: "yahoo-history",
  };
}

function summarizeFailures(prefix: string, lines: string[]) {
  const cleaned = lines.map((line) => line.replace(/\s+/g, " ").trim());
  const sample = cleaned.slice(0, 8).join(" | ");
  const suffix = cleaned.length > 8 ? ` | +${cleaned.length - 8} أخرى` : "";
  return `${prefix}${sample ? `: ${sample}${suffix}` : ""}`;
}