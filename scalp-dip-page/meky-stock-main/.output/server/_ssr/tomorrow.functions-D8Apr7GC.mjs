import { c as createServerRpc } from "./createServerRpc-BEwYw6bn.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
import { l as loadAutoThreshold, a as loadTargetCalibration } from "./self-calibration.server-DafiNwz-.mjs";
import { l as loadSymbolMemory } from "./pattern-memory.server-BKGG6vXj.mjs";
import { isBlocked } from "./blocklist-BkSBV-pn.mjs";
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
function kellyFractional(winRate, avgWinPct, avgLossPct, fraction = 0.25) {
  if (winRate <= 0 || winRate >= 1 || avgWinPct <= 0 || avgLossPct <= 0) return 0;
  const b = avgWinPct / avgLossPct;
  const fullKelly = (winRate * (b + 1) - 1) / b;
  const sized = Math.max(0, fullKelly * fraction);
  return Math.min(0.25, sized);
}
function kellySizingMultiplier(winRate, avgWin, avgLoss) {
  const k = kellyFractional(winRate, avgWin, avgLoss);
  return Math.max(0.2, Math.min(2, k / 0.05));
}
const DEFAULT_MIN_CONFIDENCE = 70;
const DEFAULT_FALLBACK = 55;
const FALLBACK_MAX_PICKS = 3;
const getTomorrowPicks_createServerFn_handler = createServerRpc({
  id: "f4e1b8d86e3dc919d0d13545238ddd73f65bc20ae606e8f86ed153a5520a9e7f",
  name: "getTomorrowPicks",
  filename: "src/lib/scan/tomorrow.functions.ts"
}, (opts) => getTomorrowPicks.__executeServer(opts));
const getTomorrowPicks = createServerFn({
  method: "GET"
}).handler(getTomorrowPicks_createServerFn_handler, async () => {
  const auto = await loadAutoThreshold().catch(() => null);
  const MIN_CONFIDENCE = auto?.gold ?? DEFAULT_MIN_CONFIDENCE;
  const FALLBACK_MIN_CONFIDENCE = auto?.silver ?? DEFAULT_FALLBACK;
  const {
    data: scan
  } = await supabaseAdmin.from("scans").select("id, started_at, finished_at, status").order("started_at", {
    ascending: false
  }).limit(1).maybeSingle();
  if (!scan) {
    return {
      scanId: null,
      startedAt: null,
      finishedAt: null,
      picks: [],
      totalCandidates: 0,
      minConfidence: MIN_CONFIDENCE,
      fallbackUsed: false
    };
  }
  const selectCols = "symbol, signal, confidence, expected_next_day_pct, expected_gain_pct, entry_min, entry_max, target, stop_loss, ensemble_agreement, technical_score, entry_timing_ar, reasons_ar, price_at_reco, created_at, rejected_by_rules";
  const {
    data: goldRecos
  } = await supabaseAdmin.from("recommendations").select(selectCols).eq("scan_id", scan.id).in("signal", ["buy", "strong_buy"]).eq("rejected_by_rules", false).gte("confidence", MIN_CONFIDENCE).gt("expected_next_day_pct", 0);
  let list = goldRecos ?? [];
  let fallbackUsed = false;
  if (list.length === 0) {
    const {
      data: silverRecos
    } = await supabaseAdmin.from("recommendations").select(selectCols).eq("scan_id", scan.id).in("signal", ["buy", "strong_buy"]).eq("rejected_by_rules", false).gte("confidence", FALLBACK_MIN_CONFIDENCE).gt("expected_next_day_pct", 0).order("confidence", {
      ascending: false
    }).limit(FALLBACK_MAX_PICKS);
    list = silverRecos ?? [];
    fallbackUsed = list.length > 0;
  }
  const symbols = Array.from(new Set(list.map((r) => r.symbol)));
  const stocksMap = /* @__PURE__ */ new Map();
  if (symbols.length) {
    const {
      data: stocks
    } = await supabaseAdmin.from("stocks").select("symbol, name_ar, sector_ar").in("symbol", symbols);
    for (const s of stocks ?? []) stocksMap.set(s.symbol, {
      name_ar: s.name_ar,
      sector_ar: s.sector_ar
    });
  }
  const picks = list.map((r) => {
    const expNext = Number(r.expected_next_day_pct ?? 0);
    const conf = Number(r.confidence ?? 0);
    const agree = Number(r.ensemble_agreement ?? 0);
    const score = conf * 0.5 + expNext * 30 + agree * 5;
    const info = stocksMap.get(r.symbol);
    const reasons = Array.isArray(r.reasons_ar) ? r.reasons_ar.filter((x) => typeof x === "string") : [];
    return {
      symbol: r.symbol,
      name_ar: info?.name_ar ?? r.symbol,
      sector_ar: info?.sector_ar ?? null,
      close: Number(r.price_at_reco ?? 0),
      signal: r.signal,
      confidence: conf,
      expected_next_day_pct: r.expected_next_day_pct == null ? null : Number(r.expected_next_day_pct),
      expected_gain_pct: r.expected_gain_pct == null ? null : Number(r.expected_gain_pct),
      entry_min: r.entry_min == null ? null : Number(r.entry_min),
      entry_max: r.entry_max == null ? null : Number(r.entry_max),
      target: r.target == null ? null : Number(r.target),
      stop_loss: r.stop_loss == null ? null : Number(r.stop_loss),
      ensemble_agreement: r.ensemble_agreement == null ? null : Number(r.ensemble_agreement),
      technical_score: r.technical_score == null ? null : Number(r.technical_score),
      entry_timing_ar: r.entry_timing_ar,
      reasons_ar: reasons,
      created_at: r.created_at,
      score,
      tier: conf >= MIN_CONFIDENCE ? "gold" : "silver"
    };
  });
  picks.sort((a, b) => b.score - a.score);
  return {
    scanId: scan.id,
    startedAt: scan.started_at,
    finishedAt: scan.finished_at,
    picks,
    totalCandidates: picks.length,
    minConfidence: MIN_CONFIDENCE,
    fallbackUsed
  };
});
const getMorningBrief_createServerFn_handler = createServerRpc({
  id: "78159f80cdceda5ade8c338a0fe7b1373266ef4a13c2d6e93c51c370da643936",
  name: "getMorningBrief",
  filename: "src/lib/scan/tomorrow.functions.ts"
}, (opts) => getMorningBrief.__executeServer(opts));
const getMorningBrief = createServerFn({
  method: "GET"
}).handler(getMorningBrief_createServerFn_handler, async () => {
  const auto = await loadAutoThreshold().catch(() => null);
  const STRICT_MIN = Math.max(75, auto?.gold ?? 75);
  const {
    data: scan
  } = await supabaseAdmin.from("scans").select("id, started_at, finished_at").order("started_at", {
    ascending: false
  }).limit(1).maybeSingle();
  if (!scan) {
    return {
      scanId: null,
      startedAt: null,
      finishedAt: null,
      picks: [],
      noTrade: true,
      reason: "لم يتم تشغيل مسح بعد",
      minConfidenceUsed: STRICT_MIN,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  const cols = "symbol, signal, confidence, expected_next_day_pct, expected_gain_pct, entry_min, entry_max, target, stop_loss, ensemble_agreement, technical_score, entry_timing_ar, reasons_ar, price_at_reco, created_at, verifier_approved, rejected_by_rules";
  const {
    data: recos
  } = await supabaseAdmin.from("recommendations").select(cols).eq("scan_id", scan.id).in("signal", ["buy", "strong_buy"]).eq("rejected_by_rules", false).gte("confidence", STRICT_MIN).gt("expected_next_day_pct", 0).order("confidence", {
    ascending: false
  });
  const list = recos ?? [];
  const memory = await loadSymbolMemory().catch(() => /* @__PURE__ */ new Map());
  await loadTargetCalibration().catch(() => ({
    normal: 1,
    momentum: 1,
    explosive: 1
  }));
  const passed = [];
  for (const r of list) {
    const agree = Number(r.ensemble_agreement ?? 0);
    if (agree < 4) continue;
    if (r.verifier_approved === false) continue;
    const mem = memory.get(r.symbol);
    if (mem && mem.total >= 5 && mem.winRate < 0.35) continue;
    passed.push(r);
    if (passed.length >= 3) break;
  }
  if (passed.length === 0) {
    return {
      scanId: scan.id,
      startedAt: scan.started_at,
      finishedAt: scan.finished_at,
      picks: [],
      noTrade: true,
      reason: "لا توجد صفقة تستوفي شروط الـ conviction اليوم — الأفضل عدم الدخول",
      minConfidenceUsed: STRICT_MIN,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  const symbols = Array.from(new Set(passed.map((r) => r.symbol)));
  const {
    data: stocks
  } = await supabaseAdmin.from("stocks").select("symbol, name_ar, sector_ar").in("symbol", symbols);
  const stocksMap = new Map(stocks?.map((s) => [s.symbol, s]) ?? []);
  const picks = passed.map((r) => {
    const conf = Number(r.confidence ?? 0);
    const expNext = Number(r.expected_next_day_pct ?? 0);
    const agree = Number(r.ensemble_agreement ?? 0);
    const info = stocksMap.get(r.symbol);
    const mem = memory.get(r.symbol);
    const reasons = Array.isArray(r.reasons_ar) ? r.reasons_ar.filter((x) => typeof x === "string") : [];
    return {
      symbol: r.symbol,
      name_ar: info?.name_ar ?? r.symbol,
      sector_ar: info?.sector_ar ?? null,
      close: Number(r.price_at_reco ?? 0),
      signal: r.signal,
      confidence: conf,
      expected_next_day_pct: expNext,
      expected_gain_pct: r.expected_gain_pct == null ? null : Number(r.expected_gain_pct),
      entry_min: r.entry_min == null ? null : Number(r.entry_min),
      entry_max: r.entry_max == null ? null : Number(r.entry_max),
      target: r.target == null ? null : Number(r.target),
      stop_loss: r.stop_loss == null ? null : Number(r.stop_loss),
      ensemble_agreement: agree,
      technical_score: r.technical_score == null ? null : Number(r.technical_score),
      entry_timing_ar: r.entry_timing_ar,
      reasons_ar: reasons,
      created_at: r.created_at,
      score: conf * 0.5 + expNext * 30 + agree * 5,
      tier: "gold",
      symbol_win_rate: mem ? mem.winRate : null,
      symbol_history_n: mem ? mem.total : 0,
      verifier_approved: r.verifier_approved === true
    };
  });
  return {
    scanId: scan.id,
    startedAt: scan.started_at,
    finishedAt: scan.finished_at,
    picks,
    noTrade: false,
    reason: null,
    minConfidenceUsed: STRICT_MIN,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
});
const getDailyOnePercent_createServerFn_handler = createServerRpc({
  id: "0229551c3b9b04f9624a7aff779ff652107849eafe40f39ce7f0e2f5933047eb",
  name: "getDailyOnePercent",
  filename: "src/lib/scan/tomorrow.functions.ts"
}, (opts) => getDailyOnePercent.__executeServer(opts));
const getDailyOnePercent = createServerFn({
  method: "GET"
}).handler(getDailyOnePercent_createServerFn_handler, async () => {
  const empty = (reason, scanId = null) => ({
    scanId,
    pick: null,
    alternatives: [],
    portfolio: [],
    total_exposure_pct: 0,
    cash_pct: 100,
    market_regime: "unknown",
    market_ok: false,
    news_warnings: [],
    noTrade: true,
    reason,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  const {
    data: scan
  } = await supabaseAdmin.from("scans").select("id").order("started_at", {
    ascending: false
  }).limit(1).maybeSingle();
  if (!scan) return empty("لم يتم تشغيل مسح بعد");
  const {
    data: mkt
  } = await supabaseAdmin.from("market_snapshots").select("close, ema20, change_5d_pct, trend, date").eq("index_symbol", "EGX30").order("date", {
    ascending: false
  }).limit(1).maybeSingle();
  let regime = "unknown";
  let marketOk = true;
  if (mkt) {
    const close = Number(mkt.close ?? 0);
    const ema = Number(mkt.ema20 ?? 0);
    const ch5 = Number(mkt.change_5d_pct ?? 0);
    if (close > 0 && ema > 0) {
      if (close > ema && ch5 > 0) regime = "bullish";
      else if (close < ema && ch5 < -2) {
        regime = "bearish";
        marketOk = false;
      } else regime = "neutral";
    }
  }
  if (!marketOk) {
    return {
      ...empty("السوق في حالة هبوط (تحت EMA20 وأداء -2% آخر 5 أيام) — لا تداول اليوم", scan.id),
      market_regime: regime,
      market_ok: false
    };
  }
  const {
    data: recosRaw
  } = await supabaseAdmin.from("recommendations").select("symbol, signal, confidence, ensemble_agreement, price_at_reco, reasons_ar, rejected_by_rules").eq("scan_id", scan.id).in("signal", ["buy", "strong_buy"]).eq("rejected_by_rules", false).gte("confidence", 55);
  const recos = (recosRaw ?? []).filter((r) => !isBlocked(r.symbol));
  if (!recos || recos.length === 0) {
    const fb = await buildRuleBasedCandidates(scan.id, regime);
    if (fb.length === 0) {
      return {
        ...empty("مفيش فرصة شراء آمنة كفاية دلوقتي — هنعيد التقييم مع كل تحديث لحظي اليوم", scan.id),
        market_regime: regime,
        market_ok: true
      };
    }
    return finalizePortfolio(fb, scan.id, regime, []);
  }
  const symbols = recos.map((r) => r.symbol);
  const {
    data: snaps
  } = await supabaseAdmin.from("stock_snapshots").select("symbol, atr14, close, vol_ratio, rsi14, resistance").eq("scan_id", scan.id).in("symbol", symbols);
  const snapMap = new Map(snaps?.map((s) => [s.symbol, s]) ?? []);
  const {
    data: stocks
  } = await supabaseAdmin.from("stocks").select("symbol, name_ar, sector_ar").in("symbol", symbols);
  const stockMap = new Map(stocks?.map((s) => [s.symbol, s]) ?? []);
  const memory = await loadSymbolMemory().catch(() => /* @__PURE__ */ new Map());
  const calibration = await loadTargetCalibration().catch(() => ({
    normal: 1,
    momentum: 1,
    explosive: 1
  }));
  const since = new Date(Date.now() - 24 * 3600 * 1e3).toISOString();
  const {
    data: badNews
  } = await supabaseAdmin.from("news_sentiment").select("symbol, headline, sentiment, impact_level, sentiment_score").in("symbol", symbols).eq("sentiment", "negative").in("impact_level", ["high", "medium"]).gte("published_at", since);
  const blockedNews = /* @__PURE__ */ new Map();
  for (const n of badNews ?? []) {
    blockedNews.set(n.symbol, n.headline ?? "خبر سلبي مؤثر");
  }
  const newsWarnings = Array.from(blockedNews.entries()).map(([symbol, reason]) => ({
    symbol,
    reason
  }));
  const since48 = new Date(Date.now() - 48 * 3600 * 1e3).toISOString();
  const {
    data: goodNews
  } = await supabaseAdmin.from("news_sentiment").select("symbol, sentiment_score, impact_level").in("symbol", symbols).eq("sentiment", "positive").gte("published_at", since48);
  const positiveScore = /* @__PURE__ */ new Map();
  for (const n of goodNews ?? []) {
    const s = Math.max(positiveScore.get(n.symbol) ?? 0, Number(n.sentiment_score) || 0);
    positiveScore.set(n.symbol, s);
  }
  const candidates = [];
  for (const r of recos) {
    if (blockedNews.has(r.symbol)) continue;
    const snap = snapMap.get(r.symbol);
    const entry = Number(r.price_at_reco ?? snap?.close ?? 0);
    if (entry <= 0) continue;
    const atr = Number(snap?.atr14 ?? 0);
    const swing = entry > 0 ? atr / entry * 100 : 0;
    if (swing < 0.45) continue;
    const agree = Number(r.ensemble_agreement ?? 0);
    if (agree < 2) continue;
    const mem = memory.get(r.symbol);
    if (mem && mem.total >= 5 && mem.winRate < 0.45) continue;
    const conf = Number(r.confidence);
    const volRatio = Number(snap?.vol_ratio ?? 1);
    const rsi = Number(snap?.rsi14 ?? 50);
    const volBoost = Math.min(1.5, volRatio);
    const memBoost = mem ? 1 + (mem.winRate - 0.5) * 0.5 : 1;
    const regimeBoost = regime === "bullish" ? 1.15 : regime === "neutral" ? 1 : 0.9;
    const isMomentum = swing >= 2 && volRatio >= 1.5 && conf >= 72 && agree >= 4 && rsi >= 50 && rsi <= 72;
    const momentumBoost = isMomentum ? 1.4 : 1;
    const resistance = Number(snap?.resistance ?? 0);
    const close = Number(snap?.close ?? entry);
    const breakout = resistance > 0 && close >= resistance * 0.985;
    const isExplosive = volRatio >= 2 && conf >= 75 && rsi >= 55 && rsi <= 70 && breakout && regime !== "bearish";
    const explosiveBoost = isExplosive ? 2.2 : 1;
    const posNews = positiveScore.get(r.symbol) ?? 0;
    const newsBoost = posNews >= 0.7 ? 1.2 : posNews >= 0.4 ? 1.1 : 1;
    const score = swing * conf * volBoost * memBoost * regimeBoost * momentumBoost * explosiveBoost * newsBoost;
    const qTech = conf >= 72 && agree >= 4 ? 1 : 0;
    const qVol = volRatio >= 1.5 ? 1 : 0;
    const qNews = posNews >= 0.4 ? 1 : 0;
    const qMem = mem && mem.winRate >= 0.55 && mem.total >= 5 ? 1 : 0;
    const qualitySignals = qTech + qVol + qNews + qMem;
    const tier = qualitySignals >= 3 ? "premium" : qualitySignals === 2 ? "strong" : "standard";
    let targetPct;
    if (isExplosive && posNews >= 0.7) {
      targetPct = Math.min(12, Math.max(5, swing * 1.8));
    } else if (isExplosive) {
      targetPct = Math.min(8, Math.max(3.5, swing * 1.3));
    } else if (isMomentum && posNews >= 0.4) {
      targetPct = Math.min(7, Math.max(2.5, swing * 0.95));
    } else if (isMomentum) {
      targetPct = Math.min(6, Math.max(2, swing * 0.75));
    } else {
      targetPct = Math.min(2, Math.max(1, swing * 0.55));
    }
    const calibTier = isExplosive ? "explosive" : isMomentum ? "momentum" : "normal";
    const calibMult = calibration[calibTier] ?? 1;
    targetPct = Math.max(1, Math.min(14, targetPct * calibMult));
    const stopPct = isMomentum ? Math.min(2.5, Math.max(1.2, swing * 0.5)) : Math.min(1.8, Math.max(1, swing * 0.45));
    const reasons = Array.isArray(r.reasons_ar) ? r.reasons_ar.filter((x) => typeof x === "string") : [];
    const info = stockMap.get(r.symbol);
    candidates.push({
      symbol: r.symbol,
      name_ar: info?.name_ar ?? r.symbol,
      sector_ar: info?.sector_ar ?? null,
      entry: +entry.toFixed(2),
      target: +(entry * (1 + targetPct / 100)).toFixed(2),
      stop: +(entry * (1 - stopPct / 100)).toFixed(2),
      target_pct: +targetPct.toFixed(2),
      stop_pct: +stopPct.toFixed(2),
      // (4) Trailing — حرّك الستوب لـ break-even عند نصف الهدف
      trail_to_be_at: +(entry * (1 + targetPct / 2 / 100)).toFixed(2),
      expected_swing_pct: +swing.toFixed(2),
      confidence: conf,
      ensemble_agreement: agree,
      reasons_ar: reasons.slice(0, 3),
      symbol_win_rate: mem ? mem.winRate : null,
      symbol_history_n: mem ? mem.total : 0,
      rank_score: +score.toFixed(1),
      position_size_pct: 0,
      // يتحدد بعد الترتيب
      quality_signals: qualitySignals,
      tier
    });
  }
  candidates.sort((a, b) => b.rank_score - a.rank_score);
  if (candidates.length === 0) {
    const fb = await buildRuleBasedCandidates(scan.id, regime, blockedNews);
    if (fb.length === 0) {
      return {
        ...empty("مفيش فرصة شراء آمنة كفاية دلوقتي — هنعيد التقييم مع كل تحديث لحظي اليوم", scan.id),
        market_regime: regime,
        market_ok: true,
        news_warnings: newsWarnings
      };
    }
    return finalizePortfolio(fb, scan.id, regime, newsWarnings);
  }
  const top = candidates.slice(0, 3);
  const primaryConf = top[0].confidence;
  let weights;
  if (primaryConf >= 80) weights = [50, 30, 20];
  else if (primaryConf >= 72) weights = [40, 25, 15];
  else weights = [25, 15, 10];
  for (let i = 0; i < top.length; i++) {
    top[i].position_size_pct = weights[i] ?? 0;
  }
  top.reduce((s, p) => s + p.position_size_pct, 0);
  return finalizePortfolio(candidates, scan.id, regime, newsWarnings);
});
async function buildRuleBasedCandidates(scanId, regime, blockedNews) {
  const {
    data: snaps
  } = await supabaseAdmin.from("stock_snapshots").select("symbol, close, atr14, vol_ratio, rsi14, macd, macd_signal, ema9, ema21, sma50, support, resistance, composite_score, change_pct, volume").eq("scan_id", scanId);
  if (!snaps || snaps.length === 0) return [];
  const symbols = snaps.map((s) => s.symbol);
  const {
    data: stocks
  } = await supabaseAdmin.from("stocks").select("symbol, name_ar, sector_ar, is_active").in("symbol", symbols);
  const stockMap = new Map(stocks?.map((s) => [s.symbol, s]) ?? []);
  const memory = await loadSymbolMemory().catch(() => /* @__PURE__ */ new Map());
  let blocked = blockedNews;
  if (!blocked) {
    blocked = /* @__PURE__ */ new Map();
    const since = new Date(Date.now() - 24 * 3600 * 1e3).toISOString();
    const {
      data: bad
    } = await supabaseAdmin.from("news_sentiment").select("symbol, headline").in("symbol", symbols).eq("sentiment", "negative").in("impact_level", ["high", "medium"]).gte("published_at", since);
    for (const n of bad ?? []) blocked.set(n.symbol, n.headline ?? "خبر سلبي");
  }
  const cands = [];
  for (const s of snaps) {
    if (isBlocked(s.symbol)) continue;
    if (blocked.has(s.symbol)) continue;
    const info = stockMap.get(s.symbol);
    if (!info || !info.is_active) continue;
    const entry = Number(s.close ?? 0);
    const atr = Number(s.atr14 ?? 0);
    if (entry <= 0 || atr <= 0) continue;
    const swing = atr / entry * 100;
    if (swing < 0.45) continue;
    const rsi = Number(s.rsi14 ?? 50);
    if (rsi < 35 || rsi > 82) continue;
    const volRatio = Number(s.vol_ratio ?? 1);
    if (volRatio < 0.35) continue;
    const ema9 = Number(s.ema9 ?? 0);
    const ema21 = Number(s.ema21 ?? 0);
    const macd = Number(s.macd ?? 0);
    const macdSig = Number(s.macd_signal ?? 0);
    const trendOk = ema9 > 0 && ema21 > 0 && ema9 >= ema21;
    const momentumOk = macd >= macdSig;
    const positiveTape = Number(s.change_pct ?? 0) >= 0 || Number(s.composite_score ?? 0) >= 45;
    if (!trendOk && !momentumOk && !positiveTape) continue;
    const mem = memory.get(s.symbol);
    if (mem && mem.total >= 5 && mem.winRate < 0.45) continue;
    const resistance = Number(s.resistance ?? 0);
    const support = Number(s.support ?? 0);
    const distToResPct = resistance > entry ? (resistance - entry) / entry * 100 : 0;
    const distFromSupPct = support > 0 && support < entry ? (entry - support) / entry * 100 : 99;
    if (distToResPct > 0 && distToResPct < 0.8) continue;
    if (distFromSupPct < 0.5) continue;
    const compScore = Number(s.composite_score ?? 0);
    const volBoost = Math.min(1.5, volRatio);
    const memBoost = mem ? 1 + (mem.winRate - 0.5) * 0.5 : 1;
    const regimeBoost = regime === "bullish" ? 1.15 : regime === "neutral" ? 1 : 0.9;
    const trendBoost = trendOk && momentumOk ? 1.2 : 1;
    const rank = swing * (50 + compScore) * volBoost * memBoost * regimeBoost * trendBoost;
    let confidence = 55;
    if (trendOk) confidence += 6;
    if (momentumOk) confidence += 5;
    if (volRatio >= 1.5) confidence += 5;
    if (rsi >= 50 && rsi <= 65) confidence += 4;
    if (compScore >= 60) confidence += 6;
    if (mem && mem.winRate >= 0.6 && mem.total >= 5) confidence += 5;
    if (regime === "bullish") confidence += 4;
    confidence = Math.min(85, Math.max(50, confidence));
    const isMomentum = swing >= 2 && volRatio >= 1.5 && trendOk && momentumOk;
    const resistance2 = Number(s.resistance ?? 0);
    const close2 = Number(s.close ?? entry);
    const breakout2 = resistance2 > 0 && close2 >= resistance2 * 0.985;
    const isExplosive2 = volRatio >= 2 && rsi >= 55 && rsi <= 70 && breakout2 && regime !== "bearish";
    let targetPct;
    if (isExplosive2) {
      targetPct = Math.min(9, Math.max(3.5, swing * 1.4));
    } else if (isMomentum) {
      targetPct = Math.min(6, Math.max(2, swing * 0.8));
    } else {
      targetPct = Math.min(2, Math.max(1, swing * 0.55));
    }
    const stopPct = isMomentum ? Math.min(2.5, Math.max(1.2, swing * 0.5)) : Math.min(1.8, Math.max(1, swing * 0.45));
    const reasons = [];
    if (trendOk) reasons.push("اتجاه قصير صاعد (EMA9 ≥ EMA21)");
    if (momentumOk) reasons.push("MACD فوق خط الإشارة");
    if (volRatio >= 1.5) reasons.push(`حجم تداول ${volRatio.toFixed(1)}× المتوسط`);
    if (compScore >= 60) reasons.push(`Score فني ${compScore.toFixed(0)}/100`);
    if (mem && mem.winRate >= 0.55) reasons.push(`تاريخ السهم ${Math.round(mem.winRate * 100)}% نجاح`);
    cands.push({
      symbol: s.symbol,
      name_ar: info.name_ar ?? s.symbol,
      sector_ar: info.sector_ar ?? null,
      entry: +entry.toFixed(2),
      target: +(entry * (1 + targetPct / 100)).toFixed(2),
      stop: +(entry * (1 - stopPct / 100)).toFixed(2),
      target_pct: +targetPct.toFixed(2),
      stop_pct: +stopPct.toFixed(2),
      trail_to_be_at: +(entry * (1 + targetPct / 2 / 100)).toFixed(2),
      expected_swing_pct: +swing.toFixed(2),
      confidence,
      ensemble_agreement: null,
      reasons_ar: reasons.slice(0, 3),
      symbol_win_rate: mem ? mem.winRate : null,
      symbol_history_n: mem ? mem.total : 0,
      rank_score: +rank.toFixed(1),
      position_size_pct: 0,
      quality_signals: (trendOk && momentumOk ? 1 : 0) + (volRatio >= 1.5 ? 1 : 0) + (compScore >= 60 ? 1 : 0) + (mem && mem.winRate >= 0.55 && mem.total >= 5 ? 1 : 0),
      tier: "standard"
    });
  }
  cands.sort((a, b) => b.rank_score - a.rank_score);
  return cands;
}
function finalizePortfolio(candidates, scanId, regime, newsWarnings) {
  const sectorCount = /* @__PURE__ */ new Map();
  for (const c of candidates) {
    if (!c.sector_ar) continue;
    sectorCount.set(c.sector_ar, (sectorCount.get(c.sector_ar) ?? 0) + 1);
  }
  for (const c of candidates) {
    if (c.sector_ar && (sectorCount.get(c.sector_ar) ?? 0) >= 2) {
      c.rank_score = +(c.rank_score * 1.15).toFixed(1);
    }
  }
  candidates.sort((a, b) => b.rank_score - a.rank_score);
  const top = [];
  const sectorTaken = /* @__PURE__ */ new Map();
  const overflow = [];
  for (const c of candidates) {
    if (top.length >= 3) break;
    const sec = c.sector_ar || "_unknown";
    const used = sectorTaken.get(sec) ?? 0;
    if (used >= 2) {
      overflow.push(c);
      continue;
    }
    top.push(c);
    sectorTaken.set(sec, used + 1);
  }
  for (const c of overflow) {
    if (top.length >= 3) break;
    top.push(c);
  }
  if (top.length === 0) {
    return {
      scanId,
      pick: candidates[0],
      alternatives: [],
      portfolio: [],
      total_exposure_pct: 0,
      cash_pct: 100,
      market_regime: regime,
      market_ok: true,
      news_warnings: newsWarnings,
      noTrade: true,
      reason: "no candidates after diversity filter",
      generatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  const primaryConf = top[0].confidence;
  const baseWeights = primaryConf >= 80 ? [40, 25, 15] : primaryConf >= 72 ? [32, 20, 12] : [22, 14, 9];
  for (let i = 0; i < top.length; i++) {
    const base = baseWeights[i] ?? 0;
    const wr = top[i].symbol_win_rate;
    const n = top[i].symbol_history_n;
    let mult = 1;
    if (wr != null && n >= 5) {
      const approxWin = Math.max(1, top[i].target_pct);
      const approxLoss = Math.max(1, top[i].stop_pct);
      mult = kellySizingMultiplier(wr, approxWin, approxLoss);
    }
    if (top[i].tier === "premium") mult *= 1.15;
    else if (top[i].tier === "standard") mult *= 0.85;
    const aprilMonth = (/* @__PURE__ */ new Date()).getUTCMonth() + 1;
    if (aprilMonth === 4) mult *= 0.5;
    top[i].position_size_pct = +Math.max(3, Math.min(45, base * mult)).toFixed(1);
  }
  const totalExposure = +top.reduce((s, p) => s + p.position_size_pct, 0).toFixed(1);
  return {
    scanId,
    pick: top[0],
    alternatives: top.slice(1),
    portfolio: top,
    total_exposure_pct: totalExposure,
    cash_pct: Math.max(0, 100 - totalExposure),
    market_regime: regime,
    market_ok: true,
    news_warnings: newsWarnings,
    noTrade: false,
    reason: null,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
export {
  getDailyOnePercent_createServerFn_handler,
  getMorningBrief_createServerFn_handler,
  getTomorrowPicks_createServerFn_handler
};
