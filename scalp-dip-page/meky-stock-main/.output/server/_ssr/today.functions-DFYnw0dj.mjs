import { c as createServerRpc } from "./createServerRpc-BEwYw6bn.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
import { g as getMarketStatus, n as notifyNewPick, a as getNewsSentiment } from "./market-hours-CyHCW23Z.mjs";
import { d as detectRegime, c as computeIndicators, a as canonicalLevels } from "./levels.server-DPpGzyqT.mjs";
import { d as decide } from "./strategy.server-BM-ZfGqV.mjs";
import { isBlocked } from "./blocklist-BkSBV-pn.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "../_libs/mendable__firecrawl-js.mjs";
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
import "./telegram.server-D6g8flro.mjs";
import "./chat-fallback.server-HMcdWJQs.mjs";
import "../_libs/technicalindicators.mjs";
import "../_libs/axios.mjs";
import "../_libs/form-data.mjs";
import "../_libs/combined-stream.mjs";
import "../_libs/delayed-stream.mjs";
import "path";
import "http";
import "https";
import "url";
import "fs";
import "../_libs/mime-types.mjs";
import "../_libs/mime-db.mjs";
import "../_libs/asynckit.mjs";
import "../_libs/es-set-tostringtag.mjs";
import "../_libs/get-intrinsic.mjs";
import "../_libs/es-object-atoms.mjs";
import "../_libs/es-errors.mjs";
import "../_libs/math-intrinsics.mjs";
import "../_libs/gopd.mjs";
import "../_libs/es-define-property.mjs";
import "../_libs/has-symbols.mjs";
import "../_libs/get-proto.mjs";
import "../_libs/dunder-proto.mjs";
import "../_libs/call-bind-apply-helpers.mjs";
import "../_libs/function-bind.mjs";
import "../_libs/hasown.mjs";
import "../_libs/has-tostringtag.mjs";
import "../_libs/proxy-from-env.mjs";
import "http2";
import "../_libs/follow-redirects.mjs";
import "assert";
import "../_libs/debug.mjs";
import "../_libs/ms.mjs";
import "tty";
import "../_libs/supports-color.mjs";
import "os";
import "../_libs/has-flag.mjs";
import "zlib";
import "events";
import "../_libs/zod-to-json-schema.mjs";
import "../_libs/zod.mjs";
async function evaluateNewsElite(symbol, signalDate, confidence) {
  const end = new Date(signalDate);
  const start = new Date(end);
  start.setDate(start.getDate() - 3);
  const { data, error } = await supabaseAdmin.from("news_sentiment").select("sentiment, sentiment_score, impact_level, headline").eq("symbol", symbol).gte("published_at", start.toISOString()).lte("published_at", end.toISOString() + "T23:59:59");
  if (error || !data) {
    return { is_elite: false, score: 0, reasons: [], positive_count: 0, negative_count: 0, max_sentiment: 0 };
  }
  let pos = 0;
  let neg = 0;
  let maxScore = 0;
  const positiveHeadlines = [];
  for (const n of data) {
    if (n.sentiment === "positive") {
      pos++;
      if (n.headline) positiveHeadlines.push(String(n.headline));
    }
    if (n.sentiment === "negative") neg++;
    const s = Number(n.sentiment_score ?? 0);
    if (s > maxScore) maxScore = s;
  }
  const reasons = [];
  let score = 0;
  const meetsBaseConfidence = confidence >= 80;
  const hasTwoPositive = pos >= 2;
  const noNegative = neg === 0;
  if (meetsBaseConfidence) score += 20;
  if (hasTwoPositive) {
    score += 40;
    reasons.push({ kind: "news_count", detail: `${pos} أخبار إيجابية في آخر 3 أيام` });
  } else if (pos >= 1) {
    score += 20;
    reasons.push({ kind: "news_count", detail: `خبر إيجابي حديث` });
  }
  if (noNegative && pos > 0) {
    score += 15;
    reasons.push({ kind: "clean", detail: "لا توجد أخبار سلبية" });
  }
  if (maxScore >= 0.7) {
    score += 15;
    reasons.push({ kind: "strong_sentiment", detail: `قوة المشاعر ${(maxScore * 100).toFixed(0)}%` });
  }
  if (neg > 0) score -= 30;
  if (positiveHeadlines.length > 0) {
    reasons.push({ kind: "headline", detail: positiveHeadlines[0].slice(0, 140) });
  }
  const is_elite = meetsBaseConfidence && hasTwoPositive && noNegative;
  return {
    is_elite,
    score: Math.max(0, Math.min(100, score)),
    reasons,
    positive_count: pos,
    negative_count: neg,
    max_sentiment: maxScore
  };
}
function cairoDateString() {
  return (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA", {
    timeZone: "Africa/Cairo"
  });
}
async function loadAllCandles() {
  const rows = [];
  for (let f = 0; ; f += 1e3) {
    const {
      data
    } = await supabaseAdmin.from("daily_candles").select("symbol,date,open,high,low,close,volume").order("date").range(f, f + 999);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1e3) break;
  }
  return rows;
}
async function computeBestPick() {
  const rows = await loadAllCandles();
  if (!rows.length) return null;
  const bySym = /* @__PURE__ */ new Map();
  for (const r of rows) {
    const a = bySym.get(r.symbol) ?? [];
    a.push({
      date: r.date,
      open: +r.open,
      high: +r.high,
      low: +r.low,
      close: +r.close,
      volume: +r.volume
    });
    bySym.set(r.symbol, a);
  }
  for (const a of bySym.values()) a.sort((x, y) => x.date.localeCompare(y.date));
  const {
    data: stocks
  } = await supabaseAdmin.from("stocks").select("symbol, name_ar");
  const nameMap = new Map((stocks ?? []).map((s) => [s.symbol, s.name_ar]));
  const dateUnion = /* @__PURE__ */ new Set();
  for (const arr of bySym.values()) for (const c of arr) dateUnion.add(c.date);
  const sortedDates = [...dateUnion].sort();
  const recentDates = sortedDates.slice(-90);
  const dateIdx = new Map(recentDates.map((d, i) => [d, i]));
  const agg = recentDates.map((d) => ({
    date: d,
    open: 0,
    high: 0,
    low: 0,
    close: 0,
    volume: 0,
    n: 0
  }));
  for (const arr of bySym.values()) {
    for (const c of arr) {
      const k = dateIdx.get(c.date);
      if (k === void 0) continue;
      const a = agg[k];
      a.open += c.open;
      a.high += c.high;
      a.low += c.low;
      a.close += c.close;
      a.volume += c.volume;
      a.n++;
    }
  }
  const marketCandles = agg.map((a) => {
    const k = Math.max(1, a.n);
    return {
      date: a.date,
      open: a.open / k,
      high: a.high / k,
      low: a.low / k,
      close: a.close / k,
      volume: a.volume
    };
  });
  const regime = detectRegime(marketCandles);
  const MIN_CONF = 70;
  const cands = [];
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
    if (entry < 2) continue;
    if (ind.atr14 != null && ind.atr14 / entry < 0.012) continue;
    const decision = decide(ind, regime);
    if (decision.signal !== "buy" && decision.signal !== "strong_buy") continue;
    if (decision.confidence < MIN_CONF) continue;
    canonicalLevels(ind, {
      priceOverride: entry
    });
    const target = +(entry * 1.05).toFixed(4);
    const stopLoss = +(entry * 0.98).toFixed(4);
    const targetPct = 5;
    const stopPct = 2;
    cands.push({
      sym,
      entry,
      confidence: decision.confidence,
      reasons: decision.reasons,
      stop: stopLoss,
      target,
      stopPct,
      targetPct,
      atr: ind.atr14 ?? 0
    });
  }
  if (!cands.length) return computeBestIntradayFallback(nameMap);
  cands.sort((a, b2) => {
    if (b2.confidence !== a.confidence) return b2.confidence - a.confidence;
    return (b2.target - b2.entry) / (b2.entry - b2.stop) - (a.target - a.entry) / (a.entry - a.stop);
  });
  const pick = cands[0];
  let newsScore = 0;
  let newsHeadlines = [];
  try {
    const n = await getNewsSentiment(pick.sym, nameMap.get(pick.sym) ?? null);
    newsScore = n.score;
    newsHeadlines = n.headlines;
    if (n.score >= 0.5) pick.reasons.push(`أخبار إيجابية (${n.score.toFixed(1)})`);
    else if (n.score <= -0.5) pick.reasons.push(`⚠️ أخبار سلبية (${n.score.toFixed(1)})`);
  } catch {
  }
  let confidence = pick.confidence;
  try {
    const {
      loadIsotonicCalibration,
      applyIsotonic
    } = await import("./isotonic-calibration.server-CgJbsL0r.mjs");
    const isoMap = await loadIsotonicCalibration();
    confidence = applyIsotonic(pick.confidence, isoMap);
  } catch {
  }
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
    maxHoldDays: 6,
    // matches reliable backtest
    confidence,
    kellyPct: kelly,
    score: pick.confidence,
    reasons: pick.reasons,
    status: "open",
    newsScore,
    newsHeadlines
  };
}
async function computeBestIntradayFallback(nameMap) {
  const today = cairoDateString();
  const {
    data: scan
  } = await supabaseAdmin.from("scans").select("id").order("started_at", {
    ascending: false
  }).limit(1).maybeSingle();
  if (!scan) return null;
  const {
    data: snaps
  } = await supabaseAdmin.from("stock_snapshots").select("symbol, close, atr14, vol_ratio, rsi14, macd, macd_signal, ema9, ema21, composite_score, change_pct").eq("scan_id", scan.id);
  if (!snaps?.length) return null;
  const symbols = snaps.map((s) => s.symbol).filter((s) => !isBlocked(s));
  const {
    data: recos
  } = symbols.length ? await supabaseAdmin.from("recommendations").select("symbol, signal, confidence, reasons_ar, target, stop_loss").eq("scan_id", scan.id).in("symbol", symbols) : {
    data: []
  };
  const recoMap = new Map((recos ?? []).map((r) => [r.symbol, r]));
  const cands = [];
  for (const s of snaps) {
    if (isBlocked(s.symbol)) continue;
    const entry = Number(s.close ?? 0);
    const atr = Number(s.atr14 ?? 0);
    if (!(entry > 0) || !(atr > 0)) continue;
    const swing = atr / entry * 100;
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
    const confidence = Math.round(Math.max(58, Math.min(82, Number(reco?.confidence ?? 0) || 54 + comp * 0.32 + (trendOk ? 6 : 0) + (momentumOk ? 5 : 0) + Math.max(0, changePct) * 2)));
    const targetPct = Math.max(0.9, Math.min(1.8, swing * 0.6));
    const stopPct = Math.max(0.8, Math.min(1.4, swing * 0.45));
    const reasons = Array.isArray(reco?.reasons_ar) ? reco.reasons_ar.filter((x) => typeof x === "string").slice(0, 2) : [];
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
      rank
    });
  }
  cands.sort((a, b) => b.rank - a.rank);
  return cands[0] ?? null;
}
async function isCircuitOpen() {
  const {
    data
  } = await supabaseAdmin.from("daily_picks").select("status, exit_date").in("status", ["win", "loss", "expired"]).order("pick_date", {
    ascending: false
  }).limit(3);
  if (!data || data.length < 3) return false;
  if (!data.every((p) => p.status === "loss")) return false;
  const lastLoss = data[0]?.exit_date ? new Date(data[0].exit_date) : /* @__PURE__ */ new Date();
  const daysSince = (Date.now() - lastLoss.getTime()) / (24 * 3600 * 1e3);
  return daysSince <= 5;
}
async function getStats() {
  const {
    data
  } = await supabaseAdmin.from("daily_picks").select("status, pnl_pct").in("status", ["win", "loss", "expired"]).order("pick_date", {
    ascending: false
  }).limit(30);
  const trades = data?.length ?? 0;
  const wins = (data ?? []).filter((p) => (p.pnl_pct ?? 0) > 0).length;
  const avg = trades > 0 ? (data ?? []).reduce((s, p) => s + (Number(p.pnl_pct) || 0), 0) / trades : 0;
  return {
    trades,
    wins,
    accuracy: trades > 0 ? wins / trades * 100 : 0,
    avgPnl: avg
  };
}
const getTodayPick_createServerFn_handler = createServerRpc({
  id: "5039be14fc45716c0f391862fc42d4f2a18007e206f74220a1076c71af0a9032",
  name: "getTodayPick",
  filename: "src/lib/today/today.functions.ts"
}, (opts) => getTodayPick.__executeServer(opts));
const getTodayPick = createServerFn({
  method: "GET"
}).handler(getTodayPick_createServerFn_handler, async () => {
  const today = cairoDateString();
  const marketStatus = getMarketStatus();
  const {
    data: todaysRows
  } = await supabaseAdmin.from("daily_picks").select("*").eq("pick_date", today).order("created_at", {
    ascending: false
  });
  const existing = (todaysRows ?? []).find((p) => p.status === "open") ?? todaysRows?.[0] ?? null;
  const circuitOpen = await isCircuitOpen();
  const recentStats = await getStats();
  const {
    data: recent
  } = await supabaseAdmin.from("daily_picks").select("*").order("pick_date", {
    ascending: false
  }).limit(10);
  const recentPicks = (recent ?? []).map((r) => ({
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
    reasons: r.reasons ?? [],
    status: r.status,
    pnlPct: r.pnl_pct != null ? Number(r.pnl_pct) : null,
    isNewsElite: r.is_news_elite ?? false,
    newsEliteScore: r.news_elite_score != null ? Number(r.news_elite_score) : null,
    newsEliteReasons: r.news_elite_reasons ?? null
  }));
  if (existing && existing.status !== "open") {
    return {
      pick: null,
      circuitOpen,
      recentStats,
      recentPicks,
      lastUpdated: existing.updated_at,
      message: !marketStatus.isOpen ? "السوق مغلق — الصفقة اتقفلت ومفيش بديل حي إلا مع الجلسة القادمة" : existing.status === "win" ? "الصفقة الحالية حققت هدفها — النظام بيدور على بديل حي أفضل" : "الصفقة الحالية اتقفلت — النظام بيدور على بديل حي أفضل"
    };
  }
  if (existing) {
    const pick2 = {
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
      reasons: existing.reasons ?? [],
      status: existing.status,
      pnlPct: existing.pnl_pct != null ? Number(existing.pnl_pct) : null,
      isNewsElite: existing.is_news_elite ?? false,
      newsEliteScore: existing.news_elite_score != null ? Number(existing.news_elite_score) : null,
      newsEliteReasons: existing.news_elite_reasons ?? null
    };
    return {
      pick: pick2,
      circuitOpen,
      recentStats,
      recentPicks,
      lastUpdated: existing.updated_at,
      message: circuitOpen ? "النظام في وضع الحماية (3 خسائر متتالية) — لا تنفذ الصفقة" : "الصفقة جاهزة"
    };
  }
  if (circuitOpen) {
    return {
      pick: null,
      circuitOpen: true,
      recentStats,
      recentPicks,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
      message: "🛡️ النظام في وضع الحماية بعد 3 خسائر متتالية. مفيش صفقات النهارده — راجع الأخطاء."
    };
  }
  if (!marketStatus.isOpen) {
    return {
      pick: null,
      circuitOpen: false,
      recentStats,
      recentPicks,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
      message: "السوق مغلق حالياً — لن يتم إنشاء صفقة يومية جديدة إلا أثناء جلسة التداول."
    };
  }
  const {
    data: stocksForFastPick
  } = await supabaseAdmin.from("stocks").select("symbol, name_ar");
  const fastNameMap = new Map((stocksForFastPick ?? []).map((s) => [s.symbol, s.name_ar]));
  const pick = await computeBestIntradayFallback(fastNameMap) ?? await computeBestPick();
  if (!pick) {
    return {
      pick: null,
      circuitOpen: false,
      recentStats,
      recentPicks,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
      message: "مفيش فرصة شراء آمنة كفاية دلوقتي — هنعيد التقييم مع كل تحديث لحظي اليوم."
    };
  }
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
    news_elite_reasons: elite?.reasons ?? null
  });
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
    source: "today"
  });
  return {
    pick,
    circuitOpen: false,
    recentStats,
    recentPicks: [pick, ...recentPicks],
    lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
    message: "🎯 السهم اللي يستحق الشراء النهارده"
  };
});
const updatePickOutcomes_createServerFn_handler = createServerRpc({
  id: "3876fd19709c38e36f32c45f780ffca4010403cb698457f9bf9a27189db96cb7",
  name: "updatePickOutcomes",
  filename: "src/lib/today/today.functions.ts"
}, (opts) => updatePickOutcomes.__executeServer(opts));
const updatePickOutcomes = createServerFn({
  method: "POST"
}).handler(updatePickOutcomes_createServerFn_handler, async () => {
  const {
    data: openPicks
  } = await supabaseAdmin.from("daily_picks").select("*").eq("status", "open");
  if (!openPicks?.length) return {
    updated: 0
  };
  let updated = 0;
  for (const p of openPicks) {
    const entryDate = new Date(p.pick_date);
    const endDate = new Date(entryDate);
    endDate.setDate(endDate.getDate() + p.max_hold_days + 1);
    const {
      data: candles
    } = await supabaseAdmin.from("daily_candles").select("date,open,high,low,close").eq("symbol", p.symbol).gt("date", p.pick_date).lte("date", endDate.toISOString().slice(0, 10)).order("date");
    if (!candles?.length) continue;
    const entry = Number(p.entry_price);
    const tgt = Number(p.target_price);
    const stp = Number(p.stop_price);
    let status = null;
    let exitPrice = 0;
    let exitDate = "";
    for (const c of candles) {
      if (+c.high >= tgt) {
        status = "win";
        exitPrice = tgt;
        exitDate = c.date;
        break;
      }
      if (+c.low <= stp) {
        status = "loss";
        exitPrice = stp;
        exitDate = c.date;
        break;
      }
    }
    if (!status && candles.length >= p.max_hold_days) {
      const last = candles[Math.min(candles.length - 1, p.max_hold_days - 1)];
      exitPrice = +last.close;
      exitDate = last.date;
      status = exitPrice > entry ? "win" : exitPrice < entry ? "loss" : "expired";
    }
    if (status) {
      const pnlPct = (exitPrice / entry - 1) * 100;
      await supabaseAdmin.from("daily_picks").update({
        status,
        exit_price: exitPrice,
        exit_date: exitDate,
        pnl_pct: pnlPct
      }).eq("id", p.id);
      updated++;
    }
  }
  return {
    updated
  };
});
export {
  getTodayPick_createServerFn_handler,
  updatePickOutcomes_createServerFn_handler
};
