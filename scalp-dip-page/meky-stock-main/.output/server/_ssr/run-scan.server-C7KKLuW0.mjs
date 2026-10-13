import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
import { f as fetchEgxSnapshots } from "./tradingview.server-ASbxwkih.mjs";
import { d as detectRegime$1, c as computeIndicators, a as canonicalLevels } from "./levels.server-DPpGzyqT.mjs";
import { y as yahooProvider } from "./yahoo.server-Coiq-pQ8.mjs";
import { g as generateText } from "../_libs/ai.mjs";
import { f as fetchNewsBulk, A as AI_MODEL, a as getAiProviderPlan, g as getAiGateway } from "./news.server-DBo8FnwV.mjs";
import { l as loadSymbolMemory } from "./pattern-memory.server-BKGG6vXj.mjs";
import { d as resetClusterTracking, e as sanityCheck, f as runAutoModules } from "./auto-orchestrator.server-Cobs3ZBw.mjs";
import { p as portfolioCorrelationPenalty } from "./tier-i-intelligence.server-Ddugl3s6.mjs";
import { loadIsotonicCalibration, applyIsotonic } from "./isotonic-calibration.server-CgJbsL0r.mjs";
import { R as RSI, E as EMA } from "../_libs/technicalindicators.mjs";
import { o as object, m as number, b as string, p as preprocess, c as array, _ as _enum, f as boolean } from "../_libs/zod.mjs";
function computeScore(ind) {
  let technical = 50;
  if (ind.rsi14 != null) {
    if (ind.rsi14 < 30) technical += 15;
    else if (ind.rsi14 < 45) technical += 8;
    else if (ind.rsi14 > 70) technical -= 15;
    else if (ind.rsi14 > 55) technical -= 4;
  }
  if (ind.macdHist != null) {
    if (ind.macdHist > 0) technical += 10;
    else technical -= 10;
  }
  if (ind.ema9 && ind.ema21 && ind.sma50) {
    if (ind.ema9 > ind.ema21 && ind.ema21 > ind.sma50) technical += 10;
    else if (ind.ema9 < ind.ema21 && ind.ema21 < ind.sma50) technical -= 10;
  }
  if (ind.bbLower && ind.bbUpper) {
    if (ind.close <= ind.bbLower) technical += 8;
    else if (ind.close >= ind.bbUpper) technical -= 8;
  }
  technical = Math.max(0, Math.min(100, technical));
  let volume = 50;
  if (ind.volRatio > 2) volume = 95;
  else if (ind.volRatio > 1.5) volume = 80;
  else if (ind.volRatio > 1) volume = 65;
  else if (ind.volRatio > 0.5) volume = 45;
  else volume = 25;
  let trend = 50;
  if (ind.ema21 && ind.sma50) {
    const above21 = ind.close > ind.ema21;
    const above50 = ind.close > ind.sma50;
    if (above21 && above50) trend = 80;
    else if (!above21 && !above50) trend = 25;
    else trend = 50;
  }
  let rr = 50;
  if (ind.atr14 && ind.atr14 > 0) {
    const reward = Math.max(0, ind.resistance - ind.close);
    const risk = ind.atr14;
    const ratio = reward / risk;
    if (ratio >= 3) rr = 90;
    else if (ratio >= 2) rr = 75;
    else if (ratio >= 1.5) rr = 60;
    else if (ratio >= 1) rr = 45;
    else rr = 25;
  }
  const composite = technical * 0.4 + volume * 0.2 + trend * 0.2 + rr * 0.2;
  return Math.round(composite * 100) / 100;
}
function suggestLevels(ind) {
  const atr = ind.atr14 ?? ind.close * 0.02;
  const entryMin = +(ind.close - atr * 0.3).toFixed(2);
  const entryMax = +(ind.close + atr * 0.3).toFixed(2);
  const target = +(ind.close + atr * 2).toFixed(2);
  const stopLoss = +(ind.close - atr * 1.2).toFixed(2);
  const risk = ind.close - stopLoss;
  const reward = target - ind.close;
  const rrRatio = risk > 0 ? +(reward / risk).toFixed(2) : 0;
  return { entryMin, entryMax, target, stopLoss, rrRatio };
}
async function fetchHistoryBulk(stocks, days = 90, concurrency = 24) {
  const out = /* @__PURE__ */ new Map();
  let i = 0;
  async function worker() {
    while (i < stocks.length) {
      const idx = i++;
      const s = stocks[idx];
      try {
        const candles = await yahooProvider.fetchOHLCV(s.yahoo_symbol, days);
        if (candles.length > 0) out.set(s.symbol.toUpperCase(), candles);
      } catch {
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, stocks.length) }, worker));
  const missing = stocks.filter((s) => !out.has(s.symbol.toUpperCase()));
  if (missing.length > 0) {
    let j = 0;
    async function retryWorker() {
      while (j < missing.length) {
        const idx = j++;
        const s = missing[idx];
        try {
          const candles = await yahooProvider.fetchOHLCV(s.yahoo_symbol, days);
          if (candles.length > 0) out.set(s.symbol.toUpperCase(), candles);
        } catch {
        }
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(8, missing.length) }, retryWorker)
    );
  }
  return out;
}
let cache = null;
const TTL_MS = 30 * 60 * 1e3;
async function computeMarketBreadth$1() {
  if (cache && Date.now() - cache.ts < TTL_MS) return cache.pct;
  try {
    const { data: stocks } = await supabaseAdmin.from("stocks").select("symbol").eq("is_active", true).eq("is_sharia", true);
    const symbols = stocks?.map((s) => s.symbol) ?? [];
    if (!symbols.length) return null;
    const rows = [];
    for (let f = 0; ; f += 1e3) {
      const { data } = await supabaseAdmin.from("daily_candles").select("symbol,date,close").in("symbol", symbols).gte("date", new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10)).order("symbol").order("date").range(f, f + 999);
      if (!data?.length) break;
      rows.push(...data.map((r) => ({ symbol: r.symbol, date: r.date.slice(0, 10), close: +r.close })));
      if (data.length < 1e3) break;
    }
    const bySym = /* @__PURE__ */ new Map();
    for (const r of rows) {
      const a = bySym.get(r.symbol) ?? [];
      a.push({ date: r.date, close: r.close });
      bySym.set(r.symbol, a);
    }
    let total = 0, above = 0;
    for (const a of bySym.values()) {
      a.sort((x, y) => x.date.localeCompare(y.date));
      if (a.length < 50) continue;
      const last = a[a.length - 1];
      let sum = 0;
      for (let i = a.length - 50; i < a.length; i++) sum += a[i].close;
      const sma50 = sum / 50;
      total++;
      if (last.close > sma50) above++;
    }
    if (total === 0) return null;
    const pct = above / total * 100;
    cache = { ts: Date.now(), pct };
    return pct;
  } catch {
    return null;
  }
}
async function fetchMarketSnapshot() {
  try {
    let candles = [];
    try {
      candles = await yahooProvider.fetchOHLCV("^CASE30", 90);
    } catch {
      candles = [];
    }
    if (candles.length < 25) {
      const tv = await fetchEgxSnapshots(["EGX30"]).catch(() => /* @__PURE__ */ new Map());
      const snap = tv.get("EGX30");
      if (!snap) return null;
      const trend2 = snap.change_pct > 0.3 ? "up" : snap.change_pct < -0.3 ? "down" : "flat";
      const breadth2 = await computeMarketBreadth$1().catch(() => null);
      return {
        index_symbol: "EGX30",
        date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
        close: snap.close,
        change_pct: +snap.change_pct.toFixed(2),
        change_5d_pct: 0,
        rsi14: snap.rsi14,
        ema20: snap.ema21 ?? null,
        trend: trend2,
        regime: "unknown",
        regime_description_ar: "بيانات محدودة من المؤشر — تحليل تقريبي.",
        breadth_pct_above_sma50: breadth2
      };
    }
    const close = candles.map((c) => c.close);
    const last = close[close.length - 1];
    const prev = close[close.length - 2] ?? last;
    const fiveAgo = close[close.length - 6] ?? last;
    const rsiArr = RSI.calculate({ period: 14, values: close });
    const emaArr = EMA.calculate({ period: 20, values: close });
    const rsi14 = rsiArr[rsiArr.length - 1] ?? null;
    const ema20 = emaArr[emaArr.length - 1] ?? null;
    const change_pct = prev ? (last - prev) / prev * 100 : 0;
    const change_5d_pct = fiveAgo ? (last - fiveAgo) / fiveAgo * 100 : 0;
    let trend = "flat";
    const aboveEma = ema20 != null && last > ema20;
    if (aboveEma && change_5d_pct > 0.5) trend = "up";
    else if (!aboveEma && change_5d_pct < -0.5) trend = "down";
    const regime = detectRegime$1(candles);
    const breadth = await computeMarketBreadth$1().catch(() => null);
    return {
      index_symbol: "EGX30",
      date: candles[candles.length - 1].date.slice(0, 10),
      close: last,
      change_pct: +change_pct.toFixed(2),
      change_5d_pct: +change_5d_pct.toFixed(2),
      rsi14: rsi14 != null ? +rsi14.toFixed(2) : null,
      ema20: ema20 != null ? +ema20.toFixed(2) : null,
      trend,
      regime: regime.regime,
      regime_description_ar: regime.description_ar,
      breadth_pct_above_sma50: breadth
    };
  } catch {
    return null;
  }
}
const SignalEnum = _enum(["strong_buy", "buy", "neutral", "sell", "strong_sell"]);
const AiSchema = object({
  signal: SignalEnum,
  confidence: number().min(0).max(100),
  reasons_ar: preprocess(
    (v) => {
      const flat = Array.isArray(v) ? v.flat(3) : [v];
      const strs = flat.map((x) => {
        if (x == null) return "";
        if (typeof x === "string") return x;
        if (typeof x === "number" || typeof x === "boolean") return String(x);
        try {
          return JSON.stringify(x);
        } catch {
          return "";
        }
      }).flatMap((s) => s.split(/\r?\n|•|·/)).map((s) => s.trim()).filter((s) => s.length > 0);
      return strs.slice(0, 3);
    },
    array(string().min(1)).min(1).max(3)
  ),
  entry_min: number().positive(),
  entry_max: number().positive(),
  target: number().positive(),
  stop_loss: number().positive(),
  timeframe_days: number().int().min(1).max(5),
  risk_note_ar: string().min(5),
  entry_timing_ar: string().min(2).max(80),
  partial_exit_pct: number().min(0.5).max(20),
  max_hold_days: number().int().min(1).max(10),
  expected_next_day_pct: number().min(-15).max(15)
});
async function analyzeStock(args) {
  const { symbol, nameAr, ind, suggested, history, market, performance, weekly, sector, news, timeoutMs } = args;
  const providers = getAiProviderPlan({ allowPaidFallback: false });
  const compact = {
    price: ind.close,
    change_pct: +ind.changePct.toFixed(2),
    rsi14: ind.rsi14 != null ? +ind.rsi14.toFixed(2) : null,
    macd: ind.macd != null ? +ind.macd.toFixed(4) : null,
    macd_signal: ind.macdSignal != null ? +ind.macdSignal.toFixed(4) : null,
    macd_hist: ind.macdHist != null ? +ind.macdHist.toFixed(4) : null,
    ema9: ind.ema9,
    ema21: ind.ema21,
    sma50: ind.sma50,
    bb_upper: ind.bbUpper,
    bb_mid: ind.bbMid,
    bb_lower: ind.bbLower,
    atr14: ind.atr14,
    volume_ratio_vs_20d: +ind.volRatio.toFixed(2),
    support: ind.support,
    resistance: ind.resistance,
    patterns: ind.patterns.map((p) => p.name),
    suggested_levels: suggested
  };
  const series = (history ?? []).slice(-25).map((c) => ({
    d: c.date.slice(5, 10),
    o: +c.open.toFixed(2),
    h: +c.high.toFixed(2),
    l: +c.low.toFixed(2),
    c: +c.close.toFixed(2),
    v: c.volume
  }));
  const marketCtx = market ? {
    egx30_trend: market.trend,
    egx30_change_pct: market.change_pct,
    egx30_change_5d_pct: market.change_5d_pct,
    egx30_rsi14: market.rsi14
  } : { egx30_trend: "unknown" };
  const weeklyCtx = weekly && weekly.weeks >= 6 ? {
    trend_w: weekly.trend,
    change_4w_pct: weekly.change_4w_pct,
    rsi14_w: weekly.rsi14_w != null ? +weekly.rsi14_w.toFixed(1) : null
  } : null;
  const sectorCtx = sector ? {
    sector: sector.sector,
    sector_change_5d_pct: sector.change_5d_pct,
    sector_change_20d_pct: sector.change_20d_pct,
    sector_trend: sector.trend
  } : null;
  const system = [
    "أنت محلل فني محترف في البورصة المصرية تبحث عن فرص قصيرة المدى (1-3 أيام).",
    "اكتب جميع الردود النصية بالعربية الفصحى المختصرة.",
    "ادرس **سلسلة آخر 25 يوم تداول** (OHLCV) قبل أي شيء — اكتشف الـ momentum, الـ trend shifts, الـ volume spikes, و انكسارات الـ support/resistance.",
    "خذ بعين الاعتبار **اتجاه السوق العام (EGX30)**:",
    "- إذا السوق up: يمكن قبول buy/strong_buy بشروط معتدلة.",
    "- إذا السوق down: ارفع الشرط — لا تعطي strong_buy إلا لإشارة استثنائية، وقلّل عدد توصيات buy.",
    "- إذا flat: محايد ما لم تكن إشارة السهم قوية ومستقلة.",
    "**الإطار الأسبوعي**: إذا الترند الأسبوعي up، فهذا يدعم الشراء. إذا down، تجنّب strong_buy حتى لو اليومي يبدو جيداً.",
    "**سياق القطاع**: إذا القطاع نازل بقوة (-3% آخر 5 أيام)، خفّض الثقة. إذا القطاع رائد (+3%)، يمكن رفع الثقة قليلاً.",
    "**الأخبار الحديثة**: إذا وُجدت أخبار سلبية، لا تعطي buy. إذا إيجابية + إشارة فنية متوافقة، يمكن تعزيز الثقة.",
    "قواعد تحديد الإشارة:",
    "- strong_buy: سلسلة 5 أيام صاعدة بحجم متزايد، MACD hist موجب وصاعد، RSI 40-65، السعر فوق ema21 و ema21 > sma50، قرب كسر مقاومة أو ارتداد قوي من دعم. الثقة 70-90.",
    "- buy: زخم قصير إيجابي (3-4 من 5 شموع خضراء أو إغلاق فوق فتح اليوم بحجم > 1× المتوسط)، MACD hist موجب، RSI < 68، اتجاه فوق ema21. الثقة 55-72.",
    "- neutral: السهم في تذبذب جانبي، حجم ضعيف، إشارات متضاربة. **لا تستخدمها كخيار افتراضي** — قرر بوضوح.",
    "- sell: 3 شموع حمراء متتالية أو كسر ema21 لأسفل، MACD hist سالب ومتسع، حجم بيع > 1× المتوسط. الثقة 55-75.",
    "- strong_sell: انهيار تحت sma50 بحجم كبير، MACD hist سالب وهابط، RSI < 40 وينخفض. الثقة 70-90.",
    "**expected_next_day_pct (مهم جداً للترتيب)**: تقدير حركة السهم خلال جلسة اليوم/أقرب جلسة تداول فقط بالنسبة المئوية. استخدم ATR والزخم الحالي:",
    "- strong_buy: عادة بين +1.5 و +5.",
    "- buy: عادة بين +0.5 و +2.5.",
    "- neutral: بين -0.5 و +0.5.",
    "- sell: بين -2.5 و -0.5.",
    "- strong_sell: بين -5 و -1.5.",
    "كن **محافظاً وواقعياً** — حركة 5%+ في يوم نادرة. لا تبالغ.",
    "أسعار الدخول والهدف ووقف الخسارة يجب أن تكون قريبة من السعر الحالي وواقعية بناءً على ATR (الهدف عادة 1.5-3× ATR فوق السعر، وقف الخسارة 1-1.5× ATR تحته).",
    "entry_timing_ar: جملة قصيرة جداً (2-5 كلمات) تحدد توقيت الدخول اليوم، مثل: 'اشترِ الآن تدريجياً'، 'اليوم بعد تأكيد أول ساعة'، 'انتظر كسر 12.50'، 'بعد ارتداد من الدعم'.",
    "partial_exit_pct: نسبة الربح من سعر الدخول التي يُنصح فيها ببيع نصف المركز (عادة بين 2 و 6). إذا sell أو strong_sell ضع 1.",
    "max_hold_days: أقصى عدد أيام للاحتفاظ بالسهم قبل الخروج إذا لم يتحقق الهدف (بين 2 و 5 عادة).",
    "reasons_ar: 2-3 أسباب فقط (لا أكثر) تشرح القرار بأرقام ملموسة من السلسلة الزمنية أو المؤشرات.",
    "أضف دائماً تحذير مخاطرة قصير في risk_note_ar.",
    "أجب فقط بكائن JSON صالح بدون أي نص إضافي أو علامات code fence.",
    "الحقول المطلوبة: signal, confidence, reasons_ar, entry_min, entry_max, target, stop_loss, timeframe_days, risk_note_ar, entry_timing_ar, partial_exit_pct, max_hold_days, expected_next_day_pct."
  ].join("\n");
  const prompt = [
    `السهم: ${nameAr} (${symbol})`,
    "حالة السوق العام (EGX30):",
    JSON.stringify(marketCtx),
    weeklyCtx ? `الإطار الأسبوعي: ${JSON.stringify(weeklyCtx)}` : "",
    sectorCtx ? `سياق القطاع: ${JSON.stringify(sectorCtx)}` : "",
    news && news.found ? `أخبار آخر أسبوع (${news.sentiment_hint}): ${news.summary_ar}` : "",
    performance && performance.total >= 5 ? `أداء آخر ${performance.total} توصية شراء: نجاح ${performance.winRate}% (${performance.profit} ربح / ${performance.loss} خسارة، ${performance.pending} معلّق)، متوسط الربح المحقق ${performance.avgWin}%، متوسط الخسارة ${performance.avgLoss}%. تعلّم من النتائج وكن أكثر تحفظاً إذا نسبة النجاح < 55%.` : "",
    series.length > 0 ? `سلسلة آخر ${series.length} جلسة (d=تاريخ، o/h/l/c=أسعار، v=حجم):` : "لا توجد سلسلة تاريخية متاحة.",
    series.length > 0 ? JSON.stringify(series) : "",
    "البيانات الفنية:",
    JSON.stringify(compact, null, 2),
    "أعد JSON فقط بهذا الشكل:",
    `{"signal":"buy","confidence":65,"reasons_ar":["..."],"entry_min":${ind.close},"entry_max":${ind.close},"target":${suggested.target},"stop_loss":${suggested.stopLoss},"timeframe_days":1,"risk_note_ar":"...","entry_timing_ar":"اليوم بعد تأكيد أول ساعة","partial_exit_pct":3,"max_hold_days":2,"expected_next_day_pct":1.2}`
  ].filter(Boolean).join("\n");
  for (const p of providers) {
    try {
      const gateway = getAiGateway(p.provider);
      const { text } = await generateWithBackoff({
        model: gateway(p.model),
        system,
        prompt,
        temperature: 0.3,
        maxRetries: 0
      }, 1, timeoutMs);
      const parsed = extractJson$1(text);
      return AiSchema.parse(parsed);
    } catch (e) {
    }
  }
  return buildFreeQuantAnalysis({ ind, suggested, history, market, weekly, sector, news, performance });
}
function buildFreeQuantAnalysis(args) {
  const { ind, suggested, history, market, performance, weekly, sector, news } = args;
  const closes = (history ?? []).slice(-6).map((c) => c.close);
  const greenDays = (history ?? []).slice(-5).filter((c) => c.close >= c.open).length;
  const rsi = ind.rsi14 ?? 50;
  const macdOk = ind.macdHist == null ? ind.macd == null || ind.macdSignal == null || ind.macd >= ind.macdSignal : ind.macdHist >= 0;
  const trendOk = !!(ind.ema9 && ind.ema21 && ind.ema9 >= ind.ema21 && (!ind.sma50 || ind.ema21 >= ind.sma50 * 0.985));
  const priceAboveTrend = !!(ind.ema21 && ind.close >= ind.ema21);
  const volOk = (ind.volRatio ?? 1) >= 1.15;
  const threeDayUp = closes.length >= 3 && closes[closes.length - 1] > closes[closes.length - 2] && closes[closes.length - 2] > closes[closes.length - 3];
  const marketBad = market?.trend === "down";
  const weeklyBad = weekly?.trend === "down";
  const sectorBad = sector != null && sector.change_5d_pct <= -3;
  const negativeNews = news?.found && news.sentiment_hint === "negative";
  const weakHistory = performance != null && performance.total >= 8 && performance.winRate < 50;
  let score = 50;
  if (threeDayUp) score += 12;
  else if (greenDays >= 3) score += 7;
  if (trendOk) score += 10;
  else if (priceAboveTrend) score += 5;
  if (macdOk) score += 8;
  if (volOk) score += Math.min(10, Math.round((ind.volRatio ?? 1) * 3));
  if (rsi >= 40 && rsi <= 65) score += 8;
  if (rsi > 72) score -= 14;
  if (market?.trend === "up") score += 4;
  if (weekly?.trend === "up") score += 4;
  if (sector?.trend === "up") score += 3;
  if (marketBad) score -= 14;
  if (weeklyBad) score -= 8;
  if (sectorBad) score -= 7;
  if (negativeNews) score -= 18;
  if (weakHistory) score -= 6;
  score = Math.max(20, Math.min(90, score));
  const signal = score >= 78 && !marketBad && !negativeNews ? "strong_buy" : score >= 64 && !marketBad && !negativeNews ? "buy" : score <= 34 ? "sell" : "neutral";
  const atr = ind.atr14 && ind.atr14 > 0 ? ind.atr14 : Math.max(ind.close * 0.018, 0.01);
  const targetPct = signal === "strong_buy" ? 3.2 : signal === "buy" ? 2.2 : signal === "sell" ? 0.8 : 1.2;
  const expectedNext = signal === "strong_buy" ? Math.min(3.8, Math.max(1.5, atr / ind.close * 80)) : signal === "buy" ? Math.min(2.4, Math.max(0.6, atr / ind.close * 55)) : signal === "sell" ? -Math.min(2.2, Math.max(0.6, Math.abs(ind.changePct) * 0.5)) : Math.max(-0.4, Math.min(0.4, ind.changePct * 0.12));
  const reasons = [
    trendOk ? "الاتجاه القصير أعلى من المتوسطات" : `النتيجة الكمية ${score.toFixed(0)}/100`,
    macdOk ? "MACD لا يعارض الصعود" : "الزخم يحتاج تأكيد إضافي",
    volOk ? `الحجم النسبي ${ind.volRatio.toFixed(1)}×` : `RSI عند ${rsi.toFixed(1)}`
  ];
  return AiSchema.parse({
    signal,
    confidence: Math.round(score),
    reasons_ar: reasons,
    entry_min: suggested.entryMin,
    entry_max: suggested.entryMax,
    target: signal === "neutral" || signal === "sell" ? suggested.target : +(ind.close * (1 + targetPct / 100)).toFixed(2),
    stop_loss: suggested.stopLoss,
    timeframe_days: signal === "strong_buy" ? 2 : 1,
    risk_note_ar: "تحليل كمي مجاني من البيانات الحقيقية؛ الالتزام بوقف الخسارة ضروري.",
    entry_timing_ar: signal === "buy" || signal === "strong_buy" ? "بعد تأكيد أول ساعة" : "انتظر تأكيد جديد",
    partial_exit_pct: signal === "strong_buy" ? 3.5 : signal === "buy" ? 2.5 : 1,
    max_hold_days: signal === "strong_buy" ? 3 : 2,
    expected_next_day_pct: +expectedNext.toFixed(2)
  });
}
async function generateWithBackoff(opts, maxAttempts = 3, perAttemptTimeoutMs = 12e3) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await generateText({
        ...opts,
        abortSignal: AbortSignal.timeout(perAttemptTimeoutMs)
      });
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      const isRate = /429|too many|rate.?limit|overload|unavailable|503/i.test(msg);
      if (!isRate || attempt === maxAttempts) throw e;
      const waitMs = attempt === 1 ? 6e3 : 12e3;
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw lastErr;
}
function extractJson$1(raw) {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) s = fence[1].trim();
  if (!s.startsWith("{")) {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error(`no JSON object in AI response: ${raw.slice(0, 200)}`);
    s = s.slice(start, end + 1);
  }
  try {
    return JSON.parse(s);
  } catch {
    const repaired = s.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]").replace(/[\x00-\x1F\x7F]/g, "");
    return JSON.parse(repaired);
  }
}
function applyRuleGate(ai, ind, market, weekly, sector, news, learnedFailures, fiveDim, ensembleAgreement) {
  const original = ai.signal;
  if (original !== "buy" && original !== "strong_buy") {
    return { signal: original, rejected: false, reason: null, originalSignal: original, confidencePenalty: 0, softWarnings: [] };
  }
  const hard = [];
  const medium = [];
  const soft = [];
  if (ind.bbUpper != null && ind.close > ind.bbUpper * 1.04) {
    hard.push(`السعر فوق الحد العلوي لبولينجر بأكثر من 4% — تشبع شديد`);
  } else if (ind.bbUpper != null && ind.close > ind.bbUpper * 1.015) {
    medium.push(`السعر فوق Bollinger العلوي بـ ${((ind.close / ind.bbUpper - 1) * 100).toFixed(1)}%`);
  }
  if (ind.rsi14 != null) {
    if (ind.rsi14 > 90) hard.push(`RSI متطرف (${ind.rsi14.toFixed(1)} > 90) — تشبع شرائي حاد`);
    else if (ind.rsi14 > 82) soft.push(`RSI مرتفع (${ind.rsi14.toFixed(1)})`);
    if (ind.rsi14 < 25) hard.push(`RSI منهار (${ind.rsi14.toFixed(1)} < 25) — اتجاه ضعيف`);
    else if (ind.rsi14 < 35) soft.push(`RSI منخفض (${ind.rsi14.toFixed(1)})`);
  }
  if (ind.volRatio > 0 && ind.volRatio < 0.4) {
    medium.push(`حجم تداول ضعيف جداً (${ind.volRatio.toFixed(2)}× المتوسط)`);
  } else if (ind.volRatio > 0 && ind.volRatio < 0.7) {
    soft.push(`حجم تداول أقل من المتوسط (${ind.volRatio.toFixed(2)}×)`);
  }
  if (market?.trend === "down") {
    if (original === "strong_buy" || ai.confidence < 75) {
      hard.push(`السوق العام هابط (EGX30 ${market.change_5d_pct.toFixed(1)}%) — لا شراء ضد الاتجاه`);
    } else {
      medium.push(`السوق العام هابط — مخاطرة أعلى`);
    }
  } else if (market?.trend === "flat" && original === "strong_buy") {
    medium.push(`السوق جانبي — لا يدعم شراء قوي`);
  }
  if (market?.breadth_pct_above_sma50 != null && market.breadth_pct_above_sma50 < 40) {
    hard.push(
      `اتساع السوق ضعيف (${market.breadth_pct_above_sma50.toFixed(0)}% فقط من الأسهم فوق SMA-50) — معظم السوق هابط`
    );
  }
  if (ind.atr14 != null && ind.atr14 > 0) {
    const stopDistance = ind.close - ai.stop_loss;
    if (stopDistance > ind.atr14 * 3.5) {
      hard.push(`وقف الخسارة بعيد جداً (>3.5× ATR) — مخاطرة عالية`);
    } else if (stopDistance > ind.atr14 * 2.5) {
      medium.push(`وقف الخسارة بعيد (${(stopDistance / ind.atr14).toFixed(1)}× ATR)`);
    }
  }
  if (ind.ema21 != null && ind.close < ind.ema21 * 0.97) {
    soft.push(`السعر تحت EMA21 بـ ${((ind.ema21 - ind.close) / ind.ema21 * 100).toFixed(1)}%`);
  }
  if (ind.macdHist != null && ind.macdHist < 0 && original === "strong_buy") {
    medium.push(`MACD histogram سالب (${ind.macdHist.toFixed(3)})`);
  }
  if (ind.volAvg20 > 0 && ind.volAvg20 < 2e4) {
    hard.push(`سيولة منخفضة جداً (متوسط ${Math.round(ind.volAvg20).toLocaleString("ar-EG")})`);
  } else if (ind.volAvg20 > 0 && ind.volAvg20 < 75e3) {
    soft.push(`سيولة متوسطة`);
  }
  if (ind.atr14 != null && ind.close > 0 && ind.atr14 / ind.close > 0.12) {
    hard.push(`تذبذب مفرط (ATR/السعر ${(ind.atr14 / ind.close * 100).toFixed(1)}%)`);
  } else if (ind.atr14 != null && ind.close > 0 && ind.atr14 / ind.close > 0.07) {
    soft.push(`تذبذب مرتفع`);
  }
  if (weekly && weekly.weeks >= 6) {
    if (original === "strong_buy" && weekly.trend === "down") {
      medium.push(`الإطار الأسبوعي هابط (4 أسابيع ${weekly.change_4w_pct}%)`);
    }
    if (weekly.rsi14_w != null && weekly.rsi14_w > 75 && original === "strong_buy") {
      medium.push(`RSI الأسبوعي مرتفع (${weekly.rsi14_w.toFixed(1)})`);
    }
  }
  if (ind.sma200 != null && ind.close <= ind.sma200) {
    medium.push(`السعر تحت SMA-200 — اتجاه طويل المدى ليس صاعد`);
  }
  if (sector && sector.change_5d_pct < -4) {
    if (original === "strong_buy") medium.push(`القطاع (${sector.sector}) نازل ${sector.change_5d_pct}%`);
    else soft.push(`القطاع هابط (${sector.change_5d_pct}%)`);
  }
  if (news && news.found && news.sentiment_hint === "negative") {
    hard.push(`أخبار سلبية حديثة: ${news.summary_ar}`);
  }
  if (learnedFailures && learnedFailures.size > 0) {
    const matched = [];
    if (learnedFailures.has("bearish_market_buy") && market?.trend === "down") {
      matched.push("نمط فاشل: شراء أثناء سوق هابط");
    }
    if (learnedFailures.has("low_ensemble_agreement") && ensembleAgreement != null) ;
    if (learnedFailures.has("weak_technical") && fiveDim && fiveDim.technical < 55) {
      matched.push(`نمط فاشل: تحليل فني ضعيف (${fiveDim.technical})`);
    }
    if (learnedFailures.has("weak_sector") && fiveDim && fiveDim.sector < 50) {
      matched.push(`نمط فاشل: قطاع ضعيف (${fiveDim.sector})`);
    }
    if (learnedFailures.has("negative_sentiment") && fiveDim && fiveDim.sentiment < 40) {
      matched.push(`نمط فاشل: مشاعر سلبية (${fiveDim.sentiment})`);
    }
    if (learnedFailures.has("low_confidence") && ai.confidence < 60) {
      matched.push(`نمط فاشل: ثقة منخفضة (${ai.confidence})`);
    }
    for (const m of matched) medium.push(m);
  }
  let finalSignal = original;
  let rejected = false;
  if (hard.length > 0) {
    finalSignal = "neutral";
    rejected = true;
  } else if (medium.length >= 2) {
    finalSignal = "neutral";
    rejected = true;
  } else if (medium.length === 1 && original === "strong_buy") {
    finalSignal = "buy";
  }
  const allReasons = [...hard, ...medium, ...soft];
  const penalty = hard.length * 25 + medium.length * 10 + soft.length * 3;
  if (allReasons.length === 0) {
    return { signal: original, rejected: false, reason: null, originalSignal: original, confidencePenalty: 0, softWarnings: [] };
  }
  return {
    signal: finalSignal,
    rejected,
    reason: rejected ? allReasons.join(" • ") : null,
    originalSignal: original,
    confidencePenalty: penalty,
    softWarnings: soft.concat(medium)
  };
}
const VerifierSchema = object({
  approved: boolean(),
  reason_ar: string().min(3).max(200),
  adjusted_confidence: number().min(0).max(100).optional()
});
async function verifyPick(args) {
  const { symbol, nameAr, signal, primaryConfidence, ind, history, market, expectedNextDayPct } = args;
  const gateway = getAiGateway();
  const model = gateway(AI_MODEL);
  const series = (history ?? []).slice(-7).map((c) => ({
    d: c.date.slice(5, 10),
    c: +c.close.toFixed(2),
    v: c.volume
  }));
  const system = [
    "أنت محكِّم ثاني لقرارات تحليل فني في البورصة المصرية. ابحث عن نقاط الضعف الواضحة.",
    "ارفض فقط إذا في دليل قاطع ضد الشراء (RSI>80، أنماط هبوطية واضحة، حجم منهار، انهيار سعر مفاجئ).",
    "في الحالات الرمادية وافق مع تخفيض الثقة. لا ترفض لمجرد عدم اليقين.",
    'أجب JSON فقط: {"approved": bool, "reason_ar": "...", "adjusted_confidence": رقم اختياري 0-100}.',
    "reason_ar مختصرة (3-15 كلمة) — سبب واضح بأرقام."
  ].join("\n");
  const prompt = [
    `السهم: ${nameAr} (${symbol})`,
    `قرار المحلل الأول: ${signal} بثقة ${primaryConfidence}%`,
    `توقع حركة الغد: ${expectedNextDayPct}%`,
    `السوق: ${market?.trend ?? "unknown"} (آخر 5 أيام ${market?.change_5d_pct ?? 0}%)`,
    `RSI=${ind.rsi14?.toFixed(1) ?? "?"} • MACD_hist=${ind.macdHist?.toFixed(3) ?? "?"} • السعر/EMA21=${ind.ema21 ? (ind.close / ind.ema21).toFixed(3) : "?"} • حجم=${ind.volRatio.toFixed(2)}×`,
    `BB: ${ind.bbLower?.toFixed(2)} - ${ind.bbUpper?.toFixed(2)} • السعر=${ind.close.toFixed(2)}`,
    series.length > 0 ? `آخر 7 جلسات: ${JSON.stringify(series)}` : "",
    "هل توافق على الشراء؟ JSON فقط."
  ].filter(Boolean).join("\n");
  const { text } = await generateText({
    model,
    system,
    prompt,
    temperature: 0.1,
    maxRetries: 0,
    abortSignal: AbortSignal.timeout(6e3)
  });
  const parsed = extractJson(text);
  return VerifierSchema.parse(parsed);
}
function extractJson(raw) {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) s = fence[1].trim();
  if (!s.startsWith("{")) {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error(`no JSON in verifier response`);
    s = s.slice(start, end + 1);
  }
  try {
    return JSON.parse(s);
  } catch {
    return JSON.parse(s.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]").replace(/[\x00-\x1F\x7F]/g, ""));
  }
}
async function getRecentPerformance(limit = 40) {
  const { data } = await supabaseAdmin.from("recommendations").select("outcome, realized_pct, signal").in("signal", ["buy", "strong_buy"]).order("created_at", { ascending: false }).limit(limit);
  if (!data || data.length === 0) return null;
  const closed = data.filter(
    (r) => r.outcome === "target_hit" || r.outcome === "stop_hit" || r.outcome === "expired" || r.outcome === "manual_close"
  );
  const pending = data.length - closed.length;
  const profit = closed.filter((r) => Number(r.realized_pct ?? 0) > 0).length;
  const loss = closed.length - profit;
  const wins = closed.filter((r) => Number(r.realized_pct ?? 0) > 0);
  const losses = closed.filter((r) => Number(r.realized_pct ?? 0) <= 0);
  const avg = (arr) => arr.length === 0 ? 0 : arr.reduce((s, r) => s + Number(r.realized_pct ?? 0), 0) / arr.length;
  return {
    total: data.length,
    profit,
    loss,
    pending,
    winRate: closed.length > 0 ? +(profit / closed.length * 100).toFixed(1) : 0,
    avgRealizedPct: +avg(closed).toFixed(2),
    avgWin: +avg(wins).toFixed(2),
    avgLoss: +avg(losses).toFixed(2)
  };
}
async function runAdaptiveLearning() {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1e3).toISOString();
  const { data, error } = await supabaseAdmin.from("recommendations").select("symbol,confidence,outcome,realized_pct,market_trend,technical_score,sentiment_score,sector_score,ensemble_agreement,rr_ratio").in("signal", ["buy", "strong_buy"]).in("outcome", ["target_hit", "stop_hit", "expired"]).gte("created_at", since);
  if (error || !data || data.length < 20) {
    return { patterns: [], saved: 0 };
  }
  const recos = data;
  const patterns = [];
  bucket(recos, "bearish_market_buy", "شراء أثناء سوق هابط", (r) => r.market_trend === "down", patterns);
  bucket(recos, "low_ensemble_agreement", "إجماع منخفض بين النماذج (<70)", (r) => (r.ensemble_agreement ?? 100) < 70, patterns);
  bucket(recos, "weak_technical", "تحليل فني ضعيف (<55)", (r) => (r.technical_score ?? 100) < 55, patterns);
  bucket(recos, "weak_sector", "قطاع ضعيف (<50)", (r) => (r.sector_score ?? 100) < 50, patterns);
  bucket(recos, "negative_sentiment", "مشاعر سلبية (<40)", (r) => (r.sentiment_score ?? 100) < 40, patterns);
  bucket(recos, "low_confidence", "ثقة منخفضة (<60)", (r) => r.confidence < 60, patterns);
  let saved = 0;
  for (const p of patterns) {
    const winRate2 = p.total_count > 0 ? p.win_count / p.total_count * 100 : 0;
    if (p.total_count >= 10 && winRate2 < 40) {
      const { error: upErr } = await supabaseAdmin.from("signal_failures").upsert(
        {
          pattern_name: p.pattern_name,
          description_ar: p.description_ar,
          rule_json: p.rule_json,
          win_count: p.win_count,
          failure_count: p.failure_count,
          total_count: p.total_count,
          is_active: true,
          last_updated: (/* @__PURE__ */ new Date()).toISOString()
        },
        { onConflict: "pattern_name" }
      );
      if (!upErr) saved++;
    }
  }
  return { patterns, saved };
}
function bucket(recos, name, descAr, filter, acc) {
  const matching = recos.filter(filter);
  if (matching.length === 0) return;
  const wins = matching.filter((r) => r.outcome === "target_hit").length;
  const losses = matching.filter((r) => r.outcome === "stop_hit").length;
  acc.push({
    pattern_name: name,
    description_ar: descAr,
    rule_json: { filter: name },
    win_count: wins,
    failure_count: losses,
    total_count: matching.length
  });
}
async function getActiveFailurePatterns() {
  const { data } = await supabaseAdmin.from("signal_failures").select("pattern_name").eq("is_active", true);
  return new Set((data ?? []).map((r) => r.pattern_name));
}
function computeWeeklyContext(daily) {
  const empty = {
    weeks: 0,
    rsi14_w: null,
    ema9_w: null,
    ema21_w: null,
    change_4w_pct: null,
    trend: "unknown"
  };
  if (!daily || daily.length < 20) return empty;
  const byWeek = /* @__PURE__ */ new Map();
  for (const c of daily) {
    const d = new Date(c.date);
    const key = isoYearWeek(d);
    const arr = byWeek.get(key) ?? [];
    arr.push(c);
    byWeek.set(key, arr);
  }
  const keys = [...byWeek.keys()].sort();
  const closes = [];
  for (const k of keys) {
    const week = byWeek.get(k);
    week.sort((a, b) => a.date.localeCompare(b.date));
    closes.push(week[week.length - 1].close);
  }
  if (closes.length < 6) return empty;
  const rsi = RSI.calculate({ period: 14, values: closes });
  const ema9 = EMA.calculate({ period: 9, values: closes });
  const ema21 = EMA.calculate({ period: 21, values: closes });
  const lastClose = closes[closes.length - 1];
  const fourWeeksAgo = closes[closes.length - 5] ?? closes[0];
  const change4w = fourWeeksAgo ? (lastClose - fourWeeksAgo) / fourWeeksAgo * 100 : null;
  const ema9Last = ema9[ema9.length - 1] ?? null;
  const ema21Last = ema21[ema21.length - 1] ?? null;
  let trend = "flat";
  if (ema9Last != null && ema21Last != null) {
    if (ema9Last > ema21Last && lastClose > ema21Last) trend = "up";
    else if (ema9Last < ema21Last && lastClose < ema21Last) trend = "down";
  }
  return {
    weeks: closes.length,
    rsi14_w: rsi[rsi.length - 1] ?? null,
    ema9_w: ema9Last,
    ema21_w: ema21Last,
    change_4w_pct: change4w != null ? +change4w.toFixed(2) : null,
    trend
  };
}
function isoYearWeek(d) {
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 864e5 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
function computeSectorMomentum(stocks, history) {
  const sectorChanges = /* @__PURE__ */ new Map();
  const symbolSector = /* @__PURE__ */ new Map();
  for (const s of stocks) {
    const sector = s.sector_ar?.trim() || "غير محدد";
    symbolSector.set(s.symbol.toUpperCase(), sector);
    const candles = history.get(s.symbol.toUpperCase());
    if (!candles || candles.length < 21) continue;
    const last = candles[candles.length - 1].close;
    const c5 = candles[candles.length - 6]?.close;
    const c20 = candles[candles.length - 21]?.close;
    const acc = sectorChanges.get(sector) ?? { c5: [], c20: [] };
    if (c5) acc.c5.push((last - c5) / c5 * 100);
    if (c20) acc.c20.push((last - c20) / c20 * 100);
    sectorChanges.set(sector, acc);
  }
  const bySector = /* @__PURE__ */ new Map();
  for (const [sector, agg] of sectorChanges.entries()) {
    const avg5 = agg.c5.length ? agg.c5.reduce((a, b) => a + b, 0) / agg.c5.length : 0;
    const avg20 = agg.c20.length ? agg.c20.reduce((a, b) => a + b, 0) / agg.c20.length : 0;
    let trend = "flat";
    if (avg5 > 1.5) trend = "up";
    else if (avg5 < -1.5) trend = "down";
    bySector.set(sector, {
      sector,
      count: agg.c5.length,
      change_5d_pct: +avg5.toFixed(2),
      change_20d_pct: +avg20.toFixed(2),
      trend
    });
  }
  const bySymbol = /* @__PURE__ */ new Map();
  for (const [sym, sector] of symbolSector.entries()) {
    const stats = bySector.get(sector);
    if (stats) bySymbol.set(sym, stats);
  }
  return { bySymbol, bySector };
}
const SCANNER_URL$1 = "https://scanner.tradingview.com/egypt/scan";
const FUNDAMENTALS_TIMEOUT_MS = 5e3;
const FUND_COLUMNS = [
  "price_earnings_ttm",
  "price_book_fq",
  "return_on_equity",
  "debt_to_equity",
  "market_cap_basic",
  "dividend_yield_recent",
  "earnings_per_share_basic_ttm",
  "earnings_release_next_date"
];
function n(v) {
  if (v == null) return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}
async function fetchFundamentals(symbols) {
  if (symbols.length === 0) return /* @__PURE__ */ new Map();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FUNDAMENTALS_TIMEOUT_MS);
  const body = {
    symbols: { tickers: symbols.map((s) => `EGX:${s.toUpperCase()}`) },
    columns: [...FUND_COLUMNS]
  };
  const out = /* @__PURE__ */ new Map();
  try {
    const res = await fetch(SCANNER_URL$1, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Origin: "https://www.tradingview.com",
        Referer: "https://www.tradingview.com/",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
      },
      body: JSON.stringify(body)
    }).finally(() => clearTimeout(timeout));
    if (!res.ok) return out;
    const json = await res.json();
    for (const row of json.data ?? []) {
      const sym = row.s.split(":").pop().toUpperCase();
      const d = row.d;
      out.set(sym, {
        symbol: sym,
        pe_ratio: n(d[0]),
        pb_ratio: n(d[1]),
        roe: n(d[2]),
        debt_to_equity: n(d[3]),
        market_cap_egp: n(d[4]),
        dividend_yield: n(d[5]),
        earnings_per_share: n(d[6]),
        next_earnings_date: d[7] ? new Date(Number(d[7]) * 1e3).toISOString().slice(0, 10) : null
      });
    }
  } catch {
  }
  return out;
}
async function saveFundamentals(map) {
  if (map.size === 0) return;
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const rows = Array.from(map.values()).map((f) => ({
    symbol: f.symbol,
    as_of: today,
    pe_ratio: f.pe_ratio,
    pb_ratio: f.pb_ratio,
    roe: f.roe,
    debt_to_equity: f.debt_to_equity,
    market_cap_egp: f.market_cap_egp,
    dividend_yield: f.dividend_yield,
    earnings_per_share: f.earnings_per_share,
    next_earnings_date: f.next_earnings_date,
    source: "tradingview"
  }));
  await supabaseAdmin.from("fundamentals").upsert(rows, { onConflict: "symbol,as_of" });
}
function scoreFundamentals(f) {
  if (!f) return null;
  let score = 50;
  let signals = 0;
  if (f.pe_ratio != null) {
    signals++;
    if (f.pe_ratio < 0) score -= 15;
    else if (f.pe_ratio < 10) score += 15;
    else if (f.pe_ratio < 18) score += 8;
    else if (f.pe_ratio < 28) score += 0;
    else score -= 8;
  }
  if (f.pb_ratio != null) {
    signals++;
    if (f.pb_ratio < 1) score += 10;
    else if (f.pb_ratio < 2.5) score += 5;
    else if (f.pb_ratio < 5) score += 0;
    else score -= 5;
  }
  if (f.roe != null) {
    signals++;
    if (f.roe > 20) score += 12;
    else if (f.roe > 10) score += 6;
    else if (f.roe > 0) score += 0;
    else score -= 10;
  }
  if (f.debt_to_equity != null) {
    signals++;
    if (f.debt_to_equity < 50) score += 5;
    else if (f.debt_to_equity < 100) score += 0;
    else if (f.debt_to_equity < 150) score -= 3;
    else score -= 8;
  }
  if (f.dividend_yield != null && f.dividend_yield > 3) score += 3;
  if (signals === 0) return null;
  return Math.max(0, Math.min(100, score));
}
function isEarningsBlackout(f) {
  if (!f?.next_earnings_date) return false;
  const days = Math.ceil(
    (new Date(f.next_earnings_date).getTime() - Date.now()) / (1e3 * 60 * 60 * 24)
  );
  return days >= 0 && days <= 3;
}
const SCANNER_URL = "https://scanner.tradingview.com/global/scan";
const MACRO_TIMEOUT_MS = 5e3;
const MACRO_TICKERS = [
  { tv: "FX_IDC:USDEGP", key: "usd_egp" },
  { tv: "TVC:GOLD", key: "gold_usd" },
  { tv: "TVC:UKOIL", key: "brent_oil_usd" },
  { tv: "SP:SPX", key: "sp500_close" },
  { tv: "MSCI:EMXC", key: "msci_em_close" }
];
async function fetchMacroSnapshot() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MACRO_TIMEOUT_MS);
  const body = {
    symbols: { tickers: MACRO_TICKERS.map((t) => t.tv) },
    columns: ["close", "change"]
  };
  try {
    const res = await fetch(SCANNER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Origin: "https://www.tradingview.com",
        Referer: "https://www.tradingview.com/",
        "User-Agent": "Mozilla/5.0"
      },
      body: JSON.stringify(body)
    }).finally(() => clearTimeout(timeout));
    if (!res.ok) return null;
    const json = await res.json();
    const snap = {
      as_of: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      usd_egp: null,
      gold_usd: null,
      brent_oil_usd: null,
      sp500_close: null,
      sp500_change_pct: null,
      msci_em_close: null
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
async function saveMacro(snap) {
  await supabaseAdmin.from("macro_indicators").upsert(snap, { onConflict: "as_of" });
}
function scoreMacro(snap) {
  if (!snap) return 50;
  let score = 50;
  if (snap.sp500_change_pct != null) {
    if (snap.sp500_change_pct > 0.5) score += 10;
    else if (snap.sp500_change_pct > 0) score += 5;
    else if (snap.sp500_change_pct < -1) score -= 10;
    else if (snap.sp500_change_pct < 0) score -= 5;
  }
  return Math.max(0, Math.min(100, score));
}
function computeFiveDimScores(args) {
  const { ind, market, sector, news, fundamentals, macro } = args;
  let technical = 50;
  if (ind.rsi14 != null) {
    if (ind.rsi14 > 50 && ind.rsi14 < 70) technical += 10;
    else if (ind.rsi14 >= 70) technical -= 5;
    else if (ind.rsi14 < 35) technical -= 10;
  }
  if (ind.macdHist != null && ind.macdHist > 0) technical += 10;
  if (ind.ema9 != null && ind.ema21 != null && ind.ema9 > ind.ema21) technical += 8;
  if (ind.ema21 != null && ind.sma50 != null && ind.ema21 > ind.sma50) technical += 5;
  if (ind.close > 0 && ind.ema21 != null && ind.close > ind.ema21) technical += 5;
  if (ind.volRatio > 1.2) technical += 7;
  else if (ind.volRatio < 0.7) technical -= 5;
  if (ind.patterns.some((p) => /bullish|breakout|hammer/i.test(p.name))) technical += 5;
  if (ind.patterns.some((p) => /bearish|breakdown|shooting/i.test(p.name))) technical -= 10;
  technical = Math.max(0, Math.min(100, technical));
  const fundamental = scoreFundamentals(fundamentals);
  let sentiment = 50;
  if (news?.found) {
    if (news.sentiment_hint === "positive") sentiment = 75;
    else if (news.sentiment_hint === "negative") sentiment = 20;
    else sentiment = 50;
  }
  const macroScore = scoreMacro(macro);
  let sectorScore = 50;
  if (sector) {
    if (sector.change_5d_pct > 3) sectorScore += 15;
    else if (sector.change_5d_pct > 0) sectorScore += 7;
    else if (sector.change_5d_pct < -3) sectorScore -= 15;
    else if (sector.change_5d_pct < 0) sectorScore -= 7;
    if (sector.trend === "up") sectorScore += 5;
    else if (sector.trend === "down") sectorScore -= 5;
  }
  sectorScore = Math.max(0, Math.min(100, sectorScore));
  if (market?.trend === "down") sectorScore = Math.max(0, sectorScore - 10);
  else if (market?.trend === "up") sectorScore = Math.min(100, sectorScore + 5);
  const weights = {
    technical: 0.35,
    fundamental: 0.15,
    sentiment: 0.15,
    macro: 0.1,
    sector: 0.25
  };
  let totalWeight = weights.technical + weights.sentiment + weights.macro + weights.sector;
  let weighted = technical * weights.technical + sentiment * weights.sentiment + macroScore * weights.macro + sectorScore * weights.sector;
  if (fundamental != null) {
    weighted += fundamental * weights.fundamental;
    totalWeight += weights.fundamental;
  }
  const composite = Math.round(weighted / totalWeight);
  const dims = [true, fundamental != null, news?.found ?? false, macro != null, sector != null];
  const dataCompleteness = Math.round(dims.filter(Boolean).length / dims.length * 100);
  const failures = [];
  if (technical < 55) failures.push(`الفني ضعيف (${technical})`);
  if (sectorScore < 50) failures.push(`القطاع ضعيف (${sectorScore})`);
  if (sentiment < 35) failures.push(`المشاعر سلبية (${sentiment})`);
  if (fundamental != null && fundamental < 35) failures.push(`الأساسي ضعيف (${fundamental})`);
  const passes = failures.length === 0;
  return {
    technical,
    fundamental,
    sentiment,
    macro: macroScore,
    sector: sectorScore,
    composite,
    dataCompleteness,
    passes,
    failures
  };
}
const BASE_SECONDARY_WEIGHT = 1;
let _metaWeightsCache = null;
const META_TTL = 10 * 60 * 1e3;
async function loadMetaWeights() {
  if (_metaWeightsCache && Date.now() - _metaWeightsCache.at < META_TTL) {
    return _metaWeightsCache.v;
  }
  try {
    const { data } = await supabaseAdmin.from("model_state").select("data").eq("key", "ensemble_meta_weights_v1").maybeSingle();
    const w = data?.data?.weights ?? {};
    _metaWeightsCache = { v: w, at: Date.now() };
    return w;
  } catch {
    return {};
  }
}
async function getSecondaryModels() {
  const meta = await loadMetaWeights();
  return getAiProviderPlan({ allowPaidFallback: false }).map((p) => ({
    provider: p.provider,
    id: p.model,
    weight: +(BASE_SECONDARY_WEIGHT * (meta[p.model] ?? 1)).toFixed(2)
  }));
}
const VoteSchema = object({
  vote: _enum(["strong_buy", "buy", "neutral", "sell", "strong_sell"]),
  confidence: number().min(0).max(100),
  reasoning_ar: string().min(5).max(300)
});
function isBullishSignal(s) {
  return s === "buy" || s === "strong_buy";
}
function isBearishSignal(s) {
  return s === "sell" || s === "strong_sell";
}
function judgeEnsemble(primary, votes) {
  const all = [
    { signal: primary.signal, weight: 1.2 },
    ...votes.map((v) => ({ signal: v.vote.vote, weight: v.weight }))
  ];
  const totalW = all.reduce((s, v) => s + v.weight, 0);
  let bullW = 0, bearW = 0, neutW = 0;
  for (const v of all) {
    if (isBullishSignal(v.signal)) bullW += v.weight;
    else if (isBearishSignal(v.signal)) bearW += v.weight;
    else neutW += v.weight;
  }
  const bullPct = bullW / totalW;
  const bearPct = bearW / totalW;
  if (bullPct >= 0.9 || bearPct >= 0.9) return { kind: "full", score: 100 };
  if (bullPct >= 0.3 && bearPct >= 0.3) return { kind: "conflict", score: 0 };
  const lead = Math.max(bullPct, bearPct);
  const score = Math.round(40 + (lead - 0.5) * 120);
  return { kind: "partial", score: Math.max(30, Math.min(85, score)) };
}
async function ensembleVote(args) {
  const { symbol, nameAr, ind, primary, scores, scanId } = args;
  const isBullish = primary.signal === "buy" || primary.signal === "strong_buy";
  if (!isBullish) {
    return {
      primary,
      secondary: null,
      votes: [],
      agreement: "no-second",
      agreementScore: 0,
      finalSignal: primary.signal,
      finalConfidence: primary.confidence
    };
  }
  const promptCommon = [
    `السهم: ${nameAr} (${symbol})`,
    `السعر: ${ind.close}`,
    `RSI14: ${ind.rsi14}, MACD hist: ${ind.macdHist}`,
    `EMA9/21/SMA50: ${ind.ema9}/${ind.ema21}/${ind.sma50}`,
    `حجم نسبي: ${ind.volRatio.toFixed(2)}×`,
    `الدعم/المقاومة: ${ind.support}/${ind.resistance}`,
    `أنماط: ${ind.patterns.map((p) => p.name).join(", ") || "لا شيء"}`,
    `النتائج: فني=${scores.technical} قطاع=${scores.sector} مشاعر=${scores.sentiment} ماكرو=${scores.macro}`,
    "هل توصي بشراء لمدة 1-3 أيام؟ أعد JSON فقط."
  ].join("\n");
  const system = 'أنت محلل مستقل تماماً. قُيِّم السهم بحياد دون التأثر بأي توصية سابقة. أعد JSON فقط: {"vote":"strong_buy|buy|neutral|sell|strong_sell","confidence":0-100,"reasoning_ar":"..."}';
  const SECONDARY_MODELS = await getSecondaryModels();
  const results = await Promise.allSettled(
    SECONDARY_MODELS.map(async ({ provider, id, weight }) => {
      const gateway = getAiGateway(provider);
      const { text } = await generateText({
        model: gateway(id),
        system,
        prompt: promptCommon,
        temperature: 0.4,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(6e3)
      });
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("no JSON");
      return { model: id, vote: VoteSchema.parse(JSON.parse(match[0])), weight };
    })
  );
  const votes = [];
  for (const r of results) if (r.status === "fulfilled") votes.push(r.value);
  const secondary = votes.length > 0 ? votes.slice().sort((a, b) => b.weight - a.weight)[0].vote : null;
  try {
    const rows = [
      { scan_id: scanId, symbol, model_name: "primary", vote: primary.signal, confidence: primary.confidence, reasoning_ar: primary.reasons_ar.join(" • ") }
    ];
    for (const v of votes) {
      rows.push({
        scan_id: scanId,
        symbol,
        model_name: v.model,
        vote: v.vote.vote,
        confidence: v.vote.confidence,
        reasoning_ar: v.vote.reasoning_ar
      });
    }
    await supabaseAdmin.from("ensemble_votes").insert(rows);
  } catch {
  }
  if (votes.length === 0) {
    return {
      primary,
      secondary: null,
      votes: [],
      agreement: "no-second",
      agreementScore: 50,
      finalSignal: primary.signal,
      finalConfidence: Math.max(40, primary.confidence - 10)
    };
  }
  const judgment = judgeEnsemble(primary, votes);
  let finalSignal = primary.signal;
  let finalConfidence = primary.confidence;
  const avgSecondaryConf = Math.round(
    votes.reduce((s, v) => s + v.vote.confidence * v.weight, 0) / votes.reduce((s, v) => s + v.weight, 0)
  );
  if (judgment.kind === "conflict") {
    finalSignal = "neutral";
    finalConfidence = Math.min(primary.confidence, avgSecondaryConf, 50);
  } else if (judgment.kind === "partial") {
    if (primary.signal === "strong_buy") finalSignal = "buy";
    finalConfidence = Math.round((primary.confidence + avgSecondaryConf) / 2) - 5;
  } else {
    let boost = 4 + Math.min(10, Math.round(votes.length * 2.5));
    const allAgreed = votes.length >= SECONDARY_MODELS.length;
    if (allAgreed && avgSecondaryConf >= 75 && primary.confidence >= 70) {
      boost += 5;
    }
    finalConfidence = Math.min(95, Math.round((primary.confidence + avgSecondaryConf) / 2) + boost);
  }
  return {
    primary,
    secondary,
    votes,
    agreement: judgment.kind,
    agreementScore: judgment.score,
    finalSignal,
    finalConfidence
  };
}
function safe(n2) {
  return Number.isFinite(n2) ? n2 : 0;
}
function vwap(candles, n2 = 20) {
  const slice = candles.slice(-n2);
  if (slice.length < 5) return null;
  let pv = 0, v = 0;
  for (const c of slice) {
    const tp = (c.high + c.low + c.close) / 3;
    pv += tp * c.volume;
    v += c.volume;
  }
  return v > 0 ? +(pv / v).toFixed(3) : null;
}
function volumeProfile(candles, lookback = 30) {
  const slice = candles.slice(-lookback);
  if (slice.length < 10) return { poc: null, vaLow: null, vaHigh: null };
  const hi = Math.max(...slice.map((c) => c.high));
  const lo = Math.min(...slice.map((c) => c.low));
  if (hi <= lo) return { poc: null, vaLow: null, vaHigh: null };
  const BINS = 20;
  const step = (hi - lo) / BINS;
  const bins = new Array(BINS).fill(0);
  for (const c of slice) {
    const cLo = Math.max(lo, c.low);
    const cHi = Math.min(hi, c.high);
    const startIdx = Math.min(BINS - 1, Math.floor((cLo - lo) / step));
    const endIdx = Math.min(BINS - 1, Math.floor((cHi - lo) / step));
    const span = Math.max(1, endIdx - startIdx + 1);
    const each = c.volume / span;
    for (let i = startIdx; i <= endIdx; i++) bins[i] += each;
  }
  let pocIdx = 0;
  for (let i = 1; i < BINS; i++) if (bins[i] > bins[pocIdx]) pocIdx = i;
  const total = bins.reduce((s, b) => s + b, 0);
  const target = total * 0.7;
  let acc = bins[pocIdx];
  let lowIdx = pocIdx, highIdx = pocIdx;
  while (acc < target && (lowIdx > 0 || highIdx < BINS - 1)) {
    const next = highIdx < BINS - 1 ? bins[highIdx + 1] : -1;
    const prev = lowIdx > 0 ? bins[lowIdx - 1] : -1;
    if (next >= prev) {
      highIdx++;
      acc += next;
    } else {
      lowIdx--;
      acc += prev;
    }
  }
  return {
    poc: +(lo + (pocIdx + 0.5) * step).toFixed(3),
    vaLow: +(lo + lowIdx * step).toFixed(3),
    vaHigh: +(lo + (highIdx + 1) * step).toFixed(3)
  };
}
function detectStrongPatterns(candles) {
  if (candles.length < 5) return [];
  const hits = [];
  const last3 = candles.slice(-3);
  const [c1, c2, c3] = last3;
  if (c2 && c3 && c2.close < c2.open && c3.close > c3.open && c3.close > c2.open && c3.open < c2.close) {
    hits.push("bullish_engulfing");
  }
  if (c3) {
    const body = Math.abs(c3.close - c3.open);
    const lowerWick = Math.min(c3.open, c3.close) - c3.low;
    const upperWick = c3.high - Math.max(c3.open, c3.close);
    if (body > 0 && lowerWick >= 2 * body && upperWick <= body * 0.5) {
      hits.push("hammer");
    }
  }
  if (c1 && c2 && c3 && c1.close < c1.open && // red
  Math.abs(c2.close - c2.open) < (c1.open - c1.close) * 0.4 && // small body
  c3.close > c3.open && // green
  c3.close > (c1.open + c1.close) / 2) {
    hits.push("morning_star");
  }
  const last11 = candles.slice(-11);
  if (last11.length === 11 && c3) {
    const avg10 = last11.slice(0, 10).reduce((s, c) => s + c.volume, 0) / 10;
    const range = c3.high - c3.low;
    const closeInTop = range > 0 && (c3.close - c3.low) / range >= 0.66;
    if (avg10 > 0 && c3.volume >= 2 * avg10 && closeInTop) {
      hits.push("volume_breakout");
    }
  }
  return hits;
}
function computeAdvancedTechnical(candles, close) {
  const empty = {
    vwap20: null,
    vwapDistPct: null,
    pocPrice: null,
    valueAreaLow: null,
    valueAreaHigh: null,
    inValueArea: false,
    strongPatterns: [],
    bullishScore: 50
  };
  if (!candles || candles.length < 10) return empty;
  const v = vwap(candles, 20);
  const vp = volumeProfile(candles, 30);
  const patterns = detectStrongPatterns(candles);
  const vwapDist = v && v > 0 ? +((close - v) / v * 100).toFixed(2) : null;
  const inVA = vp.vaLow != null && vp.vaHigh != null && close >= vp.vaLow && close <= vp.vaHigh;
  let score = 50;
  if (vwapDist != null) {
    if (vwapDist > 0 && vwapDist < 4) score += 10;
    else if (vwapDist >= 4 && vwapDist < 8) score += 4;
    else if (vwapDist >= 8) score -= 5;
    else if (vwapDist < -3) score -= 8;
  }
  if (inVA && vp.poc != null && close >= vp.poc) score += 8;
  if (vp.poc != null && close < vp.poc * 0.97) score -= 5;
  for (const p of patterns) {
    if (p === "volume_breakout") score += 12;
    else if (p === "bullish_engulfing") score += 8;
    else if (p === "morning_star") score += 10;
    else if (p === "hammer") score += 5;
  }
  score = Math.max(0, Math.min(100, score));
  return {
    vwap20: v,
    vwapDistPct: vwapDist,
    pocPrice: vp.poc,
    valueAreaLow: vp.vaLow,
    valueAreaHigh: vp.vaHigh,
    inValueArea: inVA,
    strongPatterns: patterns,
    bullishScore: safe(score)
  };
}
function detectAnomalies(candles, ind) {
  if (!candles || candles.length < 20) {
    return { anomalies: [], netDelta: 0, score: 0 };
  }
  const anomalies = [];
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const recent = candles.slice(-20);
  const avgVol = recent.reduce((s, c) => s + c.volume, 0) / recent.length;
  const avgRange = recent.reduce((s, c) => s + (c.high - c.low), 0) / recent.length;
  if (avgVol > 0 && last.volume > avgVol * 3) {
    const isUp = last.close > last.open;
    const isExhaustion = isUp && ind.rsi14 != null && ind.rsi14 > 70 && ind.close > (ind.bbUpper ?? Infinity);
    if (isExhaustion) {
      anomalies.push({
        kind: "exhaustion_spike",
        severity: "strong",
        description_ar: `حجم ضخم (${(last.volume / avgVol).toFixed(1)}× المتوسط) مع تشبع شرائي — احتمال انعكاس`,
        bullish_delta: -10
      });
    } else if (isUp) {
      anomalies.push({
        kind: "volume_spike",
        severity: last.volume > avgVol * 5 ? "extreme" : "strong",
        description_ar: `موجة شراء قوية (حجم ${(last.volume / avgVol).toFixed(1)}× المتوسط)`,
        bullish_delta: 6
      });
    } else {
      anomalies.push({
        kind: "volume_spike",
        severity: "strong",
        description_ar: `حجم ضخم على شمعة حمراء — ضغط بيع`,
        bullish_delta: -8
      });
    }
  }
  if (avgVol > 0 && last.volume < avgVol * 0.4 && ind.changePct > 0) {
    anomalies.push({
      kind: "volume_dryup",
      severity: "mild",
      description_ar: `صعود بدون حجم (${(last.volume / avgVol).toFixed(2)}× المتوسط) — ضعف في القوة الشرائية`,
      bullish_delta: -5
    });
  }
  const gapPct = (last.open - prev.close) / prev.close * 100;
  if (gapPct > 3) {
    anomalies.push({
      kind: "price_gap_up",
      severity: gapPct > 6 ? "extreme" : "strong",
      description_ar: `فجوة صاعدة ${gapPct.toFixed(1)}% — احتمال FOMO`,
      bullish_delta: gapPct > 6 ? -8 : 3
    });
  } else if (gapPct < -3) {
    anomalies.push({
      kind: "price_gap_down",
      severity: gapPct < -6 ? "extreme" : "strong",
      description_ar: `فجوة هابطة ${gapPct.toFixed(1)}% — ضغط بيع مفاجئ`,
      bullish_delta: -10
    });
  }
  const range = last.high - last.low;
  if (avgRange > 0 && range > avgRange * 2.5) {
    const closeNearHigh = (last.close - last.low) / range > 0.7;
    anomalies.push({
      kind: "wide_range_bar",
      severity: range > avgRange * 4 ? "extreme" : "strong",
      description_ar: closeNearHigh ? `شمعة عريضة بإغلاق قوي — استمرار محتمل` : `شمعة عريضة بإغلاق ضعيف — تذبذب عالي`,
      bullish_delta: closeNearHigh ? 4 : -6
    });
  }
  if (recent.length >= 5) {
    const last5 = recent.slice(-5);
    const highVolDays = last5.filter((c) => c.volume > avgVol * 1.3).length;
    const totalMove = Math.abs(
      (last5[last5.length - 1].close - last5[0].open) / last5[0].open * 100
    );
    if (highVolDays >= 3 && totalMove < 2) {
      anomalies.push({
        kind: "stealth_accumulation",
        severity: "strong",
        description_ar: `تجميع صامت: حجم مرتفع ${highVolDays}/5 أيام بدون حركة سعرية — مؤسسات تبني مركز`,
        bullish_delta: 8
      });
    }
  }
  const netDelta = Math.max(
    -15,
    Math.min(15, anomalies.reduce((s, a) => s + a.bullish_delta, 0))
  );
  const score = Math.min(
    100,
    anomalies.reduce(
      (s, a) => s + (a.severity === "extreme" ? 40 : a.severity === "strong" ? 25 : 10),
      0
    )
  );
  return { anomalies, netDelta, score };
}
function kellyFraction(input) {
  const { winRate: winRate2, avgWinPct, avgLossPct } = input;
  if (winRate2 <= 0 || winRate2 >= 1) return 0;
  if (avgLossPct <= 0 || avgWinPct <= 0) return 0;
  const b = avgWinPct / avgLossPct;
  const p = winRate2;
  const q = 1 - p;
  const full = (b * p - q) / b;
  if (full <= 0) return 0;
  return Math.min(0.05, full * 0.5);
}
function kellyMultiplier(history) {
  if (!history || history.winRate <= 0 || history.avgWinPct <= 0) return 1;
  const k = kellyFraction(history);
  if (k <= 0) return 0.3;
  const m = 0.5 + k / 0.05;
  return +Math.max(0.3, Math.min(1.5, m)).toFixed(2);
}
function correlation(a, b) {
  const n2 = Math.min(a.length, b.length);
  if (n2 < 5) return 0;
  const ax = a.slice(-n2), bx = b.slice(-n2);
  const mA = ax.reduce((s, x) => s + x, 0) / n2;
  const mB = bx.reduce((s, x) => s + x, 0) / n2;
  let num2 = 0, dA = 0, dB = 0;
  for (let i = 0; i < n2; i++) {
    const da = ax[i] - mA;
    const db = bx[i] - mB;
    num2 += da * db;
    dA += da * da;
    dB += db * db;
  }
  const den = Math.sqrt(dA * dB);
  return den > 0 ? num2 / den : 0;
}
function dailyReturns(candles) {
  const out = [];
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1].close;
    if (prev > 0) out.push((candles[i].close - prev) / prev);
  }
  return out;
}
function correlationMultiplier(args) {
  if (!args.candidate || args.candidate.length < 20 || args.accepted.length === 0) {
    return { multiplier: 1, maxCorr: 0, conflictWith: null };
  }
  const candR = dailyReturns(args.candidate.slice(-40));
  let maxCorr = 0;
  let conflictWith = null;
  for (const a of args.accepted) {
    if (!a.candles || a.candles.length < 20) continue;
    const accR = dailyReturns(a.candles.slice(-40));
    const c = Math.abs(correlation(candR, accR));
    if (c > maxCorr) {
      maxCorr = c;
      conflictWith = a.symbol;
    }
  }
  let mult = 1;
  if (maxCorr >= 0.9) mult = 0.4;
  else if (maxCorr >= 0.7) mult = 0.7;
  else if (maxCorr >= 0.5) mult = 0.85;
  return { multiplier: mult, maxCorr: +maxCorr.toFixed(2), conflictWith };
}
function combinedRiskMultiplier(args) {
  const m = args.kelly * args.correlation;
  return +Math.max(0.2, Math.min(1.5, m)).toFixed(2);
}
function detectRegime(market, indexCandles) {
  if (!market) {
    return {
      regime: "ranging",
      label_ar: "غير محدد",
      volatility_pct: 0,
      trend_strength: 0,
      confidence_multiplier: 1,
      description_ar: "لا توجد بيانات كافية للسوق"
    };
  }
  let volatilityPct = 0;
  if (indexCandles && indexCandles.length >= 20) {
    const tail = indexCandles.slice(-20);
    const returns = [];
    for (let i = 1; i < tail.length; i++) {
      const r = (tail[i].close - tail[i - 1].close) / tail[i - 1].close;
      returns.push(r);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
    volatilityPct = Math.sqrt(variance) * Math.sqrt(252) * 100;
  } else {
    volatilityPct = Math.abs(market.change_5d_pct ?? 0) * 3;
  }
  const change5d = market.change_5d_pct ?? 0;
  const trendStrength = Math.max(-100, Math.min(100, change5d * 10));
  let regime = "ranging";
  let label = "متذبذب";
  let mult = 1;
  let desc = "السوق في نطاق محدود، فرص محدودة";
  if (volatilityPct >= 35) {
    regime = "high_volatility";
    label = "تقلبات عالية";
    mult = 0.75;
    desc = `تقلبات عالية (${volatilityPct.toFixed(1)}%) — قلل المراكز وارفع الـ stop loss`;
  } else if (volatilityPct < 12 && Math.abs(change5d) < 1) {
    regime = "low_volatility";
    label = "تقلبات منخفضة";
    mult = 1.05;
    desc = "سوق هادئ — فرص تجميع مناسبة";
  } else if (market.trend === "up" && change5d > 1.5) {
    regime = "bull_trending";
    label = "اتجاه صاعد";
    mult = 1.15;
    desc = `سوق صاعد قوي (+${change5d.toFixed(1)}% خلال 5 أيام)`;
  } else if (market.trend === "down" && change5d < -1.5) {
    regime = "bear_trending";
    label = "اتجاه هابط";
    mult = 0.7;
    desc = `سوق هابط (${change5d.toFixed(1)}% خلال 5 أيام) — تجنب الشراء`;
  }
  return {
    regime,
    label_ar: label,
    volatility_pct: +volatilityPct.toFixed(2),
    trend_strength: +trendStrength.toFixed(1),
    confidence_multiplier: mult,
    description_ar: desc
  };
}
function monteCarloProject(params) {
  const { candles, currentPrice, target, stopLoss, horizonDays } = params;
  const sims = params.simulations ?? 2e3;
  if (!candles || candles.length < 30 || currentPrice <= 0) return null;
  const tail = candles.slice(-60);
  const returns = [];
  for (let i = 1; i < tail.length; i++) {
    if (tail[i - 1].close > 0 && tail[i].close > 0) {
      returns.push(Math.log(tail[i].close / tail[i - 1].close));
    }
  }
  if (returns.length < 20) return null;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
  const stdev = Math.sqrt(variance);
  const finalReturns = [];
  let hitTarget = 0;
  let hitStop = 0;
  let profitable = 0;
  for (let s = 0; s < sims; s++) {
    let price = currentPrice;
    let hadTarget = false;
    let hadStop = false;
    for (let d = 0; d < horizonDays; d++) {
      const z2 = boxMuller();
      const dailyReturn = mean + stdev * z2;
      price *= Math.exp(dailyReturn);
      if (!hadTarget && target > 0 && price >= target) hadTarget = true;
      if (!hadStop && stopLoss > 0 && price <= stopLoss) hadStop = true;
    }
    const pct = (price - currentPrice) / currentPrice * 100;
    finalReturns.push(pct);
    if (pct > 0) profitable++;
    if (hadTarget) hitTarget++;
    if (hadStop) hitStop++;
  }
  finalReturns.sort((a, b) => a - b);
  const expected = finalReturns.reduce((a, b) => a + b, 0) / finalReturns.length;
  const p10 = finalReturns[Math.floor(sims * 0.1)];
  const p90 = finalReturns[Math.floor(sims * 0.9)];
  return {
    expected_pct: +expected.toFixed(2),
    prob_profit: +(profitable / sims * 100).toFixed(1),
    ci_low_pct: +p10.toFixed(2),
    ci_high_pct: +p90.toFixed(2),
    prob_hit_target: +(hitTarget / sims * 100).toFixed(1),
    prob_hit_stop: +(hitStop / sims * 100).toFixed(1),
    description_ar: `احتمال الربح ${(profitable / sims * 100).toFixed(0)}% • المدى المتوقع بين ${p10.toFixed(1)}% و ${p90.toFixed(1)}%`
  };
}
function boxMuller() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function buildExplainability(params) {
  const { ind, fiveDim, ensembleAgreement, regimeMult, monteCarloProbProfit } = params;
  const factors = [];
  factors.push({
    name_ar: "التحليل الفني",
    value: `${fiveDim.technical.toFixed(0)}/100`,
    impact: fiveDim.technical >= 60 ? "positive" : fiveDim.technical <= 40 ? "negative" : "neutral",
    weight: 30
  });
  if (ind.rsi14 != null) {
    factors.push({
      name_ar: "مؤشر القوة النسبية RSI",
      value: ind.rsi14.toFixed(1),
      impact: ind.rsi14 < 35 ? "positive" : ind.rsi14 > 70 ? "negative" : "neutral",
      weight: 15
    });
  }
  if (ind.volRatio > 0) {
    factors.push({
      name_ar: "نسبة الحجم",
      value: `${ind.volRatio.toFixed(2)}x`,
      impact: ind.volRatio >= 1.5 ? "positive" : ind.volRatio < 0.7 ? "negative" : "neutral",
      weight: 12
    });
  }
  factors.push({
    name_ar: "الأخبار والمعنويات",
    value: `${fiveDim.sentiment.toFixed(0)}/100`,
    impact: fiveDim.sentiment >= 60 ? "positive" : fiveDim.sentiment <= 40 ? "negative" : "neutral",
    weight: 20
  });
  factors.push({
    name_ar: "قوة القطاع",
    value: `${fiveDim.sector.toFixed(0)}/100`,
    impact: fiveDim.sector >= 60 ? "positive" : fiveDim.sector <= 40 ? "negative" : "neutral",
    weight: 15
  });
  factors.push({
    name_ar: "الاقتصاد الكلي",
    value: `${fiveDim.macro.toFixed(0)}/100`,
    impact: fiveDim.macro >= 55 ? "positive" : fiveDim.macro <= 45 ? "negative" : "neutral",
    weight: 10
  });
  if (ensembleAgreement != null) {
    factors.push({
      name_ar: "اتفاق نماذج الذكاء",
      value: `${ensembleAgreement}%`,
      impact: ensembleAgreement >= 70 ? "positive" : ensembleAgreement < 50 ? "negative" : "neutral",
      weight: 18
    });
  }
  factors.push({
    name_ar: "حالة السوق",
    value: regimeMult >= 1.1 ? "صاعد" : regimeMult <= 0.8 ? "هابط/متقلب" : "محايد",
    impact: regimeMult >= 1.1 ? "positive" : regimeMult <= 0.8 ? "negative" : "neutral",
    weight: 14
  });
  if (monteCarloProbProfit != null) {
    factors.push({
      name_ar: "احتمال الربح (محاكاة)",
      value: `${monteCarloProbProfit.toFixed(0)}%`,
      impact: monteCarloProbProfit >= 60 ? "positive" : monteCarloProbProfit < 45 ? "negative" : "neutral",
      weight: 16
    });
  }
  return factors.sort((a, b) => b.weight - a.weight).slice(0, 6);
}
const BUCKETS$1 = [
  [0, 49],
  [50, 59],
  [60, 69],
  [70, 79],
  [80, 89],
  [90, 100]
];
async function loadCalibration() {
  const { data } = await supabaseAdmin.from("recommendations").select("confidence, outcome, realized_pct").in("outcome", ["target_hit", "stop_hit", "expired"]).in("signal", ["buy", "strong_buy"]).limit(2e3);
  const rows = data ?? [];
  const buckets = BUCKETS$1.map(([min, max]) => {
    const subset = rows.filter((r) => r.confidence >= min && r.confidence <= max);
    const wins = subset.filter(
      (r) => r.outcome === "target_hit" || r.realized_pct != null && Number(r.realized_pct) > 0
    ).length;
    const n2 = subset.length;
    const winRate2 = n2 > 0 ? wins / n2 : (min + max) / 2 / 100;
    return { min, max, n: n2, winRate: winRate2 };
  });
  return {
    buckets,
    fitted: rows.length >= 30,
    sampleSize: rows.length
  };
}
function calibrateConfidence(raw, map) {
  if (!map.fitted) return raw;
  const bucket2 = map.buckets.find((b) => raw >= b.min && raw <= b.max);
  if (!bucket2 || bucket2.n < 3) return raw;
  const prior = raw / 100;
  const k = 5;
  const smoothed = (bucket2.winRate * bucket2.n + prior * k) / (bucket2.n + k);
  const calibrated = Math.round(smoothed * 100);
  return Math.max(raw - 15, Math.min(raw + 15, calibrated));
}
function computeConfluence(ind, weekly, market) {
  const votes = [];
  const notes = [];
  const ema9 = ind.ema9 ?? 0;
  const ema21 = ind.ema21 ?? 0;
  const rsi = ind.rsi14 ?? 50;
  if (ema9 > 0 && ema21 > 0) {
    if (ema9 > ema21 && rsi > 50) {
      votes.push({ tf: "daily", dir: "bull" });
      notes.push("اليومي: صاعد (EMA9>EMA21, RSI>50)");
    } else if (ema9 < ema21 && rsi < 50) {
      votes.push({ tf: "daily", dir: "bear" });
      notes.push("اليومي: هابط");
    } else {
      votes.push({ tf: "daily", dir: "flat" });
    }
  }
  if (weekly && weekly.trend !== "unknown") {
    if (weekly.trend === "up") {
      votes.push({ tf: "weekly", dir: "bull" });
      notes.push("الأسبوعي: اتجاه صاعد");
    } else if (weekly.trend === "down") {
      votes.push({ tf: "weekly", dir: "bear" });
      notes.push("الأسبوعي: اتجاه هابط");
    } else {
      votes.push({ tf: "weekly", dir: "flat" });
    }
  }
  if (market?.trend) {
    if (market.trend === "up") {
      votes.push({ tf: "market", dir: "bull" });
      notes.push("السوق العام: صاعد");
    } else if (market.trend === "down") {
      votes.push({ tf: "market", dir: "bear" });
      notes.push("السوق العام: هابط");
    } else {
      votes.push({ tf: "market", dir: "flat" });
    }
  }
  const bull = votes.filter((v) => v.dir === "bull").length;
  const bear = votes.filter((v) => v.dir === "bear").length;
  const total = votes.length;
  const dominant = Math.max(bull, bear);
  const score = total > 0 ? Math.round(dominant / total * 100) : 50;
  const aligned = total >= 2 && dominant / total >= 0.75;
  const conflict = bull >= 1 && bear >= 1 && Math.abs(bull - bear) <= 0;
  return { score, bullishVotes: bull, bearishVotes: bear, total, aligned, conflict, notes_ar: notes };
}
function buildTrailingStop(entryPrice, ind) {
  const atr = ind.atr14 ?? entryPrice * 0.02;
  const initialStop = +(entryPrice - 1.5 * atr).toFixed(2);
  const activation = +(entryPrice + 1 * atr).toFixed(2);
  const stepPct = +(atr / entryPrice * 100).toFixed(2);
  return {
    initial_stop: initialStop,
    trail_atr_mult: 2,
    activation_price: activation,
    step_pct: stepPct,
    description_ar: `وقف ديناميكي: ابدأ بـ ${initialStop}. بعد وصول السعر لـ ${activation}، حرّك الوقف خلف أعلى سعر بمسافة ${(2 * atr).toFixed(2)} (≈${(stepPct * 2).toFixed(1)}%) لحماية الأرباح.`
  };
}
function detectVPD(candles) {
  if (!candles || candles.length < 20) {
    return { detected: false, type: "none", strength: 0, description_ar: "" };
  }
  const last10 = candles.slice(-10);
  const prev10 = candles.slice(-20, -10);
  const priceHighRecent = Math.max(...last10.map((c) => c.high));
  const priceHighPrev = Math.max(...prev10.map((c) => c.high));
  const priceLowRecent = Math.min(...last10.map((c) => c.low));
  const priceLowPrev = Math.min(...prev10.map((c) => c.low));
  const volRecent = last10.reduce((a, b) => a + b.volume, 0) / 10;
  const volPrev = prev10.reduce((a, b) => a + b.volume, 0) / 10;
  if (priceHighRecent > priceHighPrev * 1.01 && volRecent < volPrev * 0.85) {
    const strength = Math.min(100, Math.round((volPrev - volRecent) / volPrev * 200));
    return {
      detected: true,
      type: "bearish_divergence",
      strength,
      description_ar: `تباعد سلبي: السعر يصنع قمماً أعلى لكن الحجم يتراجع (${strength}% قوة) — ضعف في الصعود.`
    };
  }
  if (priceLowRecent < priceLowPrev * 0.99 && volRecent < volPrev * 0.8) {
    const strength = Math.min(100, Math.round((volPrev - volRecent) / volPrev * 150));
    return {
      detected: true,
      type: "bullish_divergence",
      strength,
      description_ar: `تباعد إيجابي: السعر يصنع قيعاناً أقل لكن البائعين منهكون (حجم منخفض) — احتمال انعكاس.`
    };
  }
  return { detected: false, type: "none", strength: 0, description_ar: "" };
}
function detectSectorRotation(ctx) {
  const sectors = Array.from(ctx.bySector.entries()).map(([name, info]) => ({
    name,
    momentum: info.change_5d_pct ?? 0
  }));
  sectors.sort((a, b) => b.momentum - a.momentum);
  const leaders = sectors.slice(0, 3).map((s) => s.name);
  const laggards = sectors.slice(-3).map((s) => s.name);
  const spread = sectors.length > 0 ? Math.abs((sectors[0]?.momentum ?? 0) - (sectors[sectors.length - 1]?.momentum ?? 0)) : 0;
  const rotationStrength = Math.min(100, Math.round(spread * 10));
  const boost = /* @__PURE__ */ new Map();
  sectors.forEach((s, i) => {
    if (i < 3) boost.set(s.name, 6 - i * 2);
    else if (i >= sectors.length - 3) boost.set(s.name, -(6 - (sectors.length - 1 - i) * 2));
  });
  return { leaders, laggards, rotationStrength, sectorBoost: boost };
}
function sma(values) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
function computeMarketBreadth(histories) {
  let aboveSma = 0;
  let total = 0;
  let advances = 0;
  let declines = 0;
  let newHighs = 0;
  let newLows = 0;
  for (const candles of histories.values()) {
    if (!candles || candles.length < 50) continue;
    total++;
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    const closes = candles.slice(-50).map((c) => c.close);
    const sma50 = sma(closes);
    if (last.close > sma50) aboveSma++;
    if (prev && last.close > prev.close) advances++;
    else if (prev && last.close < prev.close) declines++;
    const last20 = candles.slice(-20);
    const max20 = Math.max(...last20.map((c) => c.high));
    const min20 = Math.min(...last20.map((c) => c.low));
    if (last.high >= max20) newHighs++;
    if (last.low <= min20) newLows++;
  }
  const pctAboveSma50 = total > 0 ? +(aboveSma / total * 100).toFixed(1) : 50;
  const advanceDeclineRatio = declines > 0 ? +(advances / declines).toFixed(2) : advances;
  const newHighsMinusLows = newHighs - newLows;
  let breadthScore = 50;
  if (pctAboveSma50 > 60) breadthScore += 15;
  else if (pctAboveSma50 < 35) breadthScore -= 20;
  if (advanceDeclineRatio > 1.5) breadthScore += 10;
  else if (advanceDeclineRatio < 0.7) breadthScore -= 15;
  if (newHighsMinusLows > 3) breadthScore += 10;
  else if (newHighsMinusLows < -3) breadthScore -= 15;
  breadthScore = Math.max(0, Math.min(100, breadthScore));
  let confidenceDelta = 0;
  let label_ar = "اتساع متوازن";
  if (breadthScore >= 70) {
    confidenceDelta = 6;
    label_ar = "اتساع قوي — معظم الأسهم صاعدة";
  } else if (breadthScore >= 60) {
    confidenceDelta = 3;
    label_ar = "اتساع إيجابي";
  } else if (breadthScore <= 30) {
    confidenceDelta = -6;
    label_ar = "اتساع ضعيف — السوق هش";
  } else if (breadthScore <= 40) {
    confidenceDelta = -3;
    label_ar = "اتساع متراجع";
  }
  return { pctAboveSma50, advanceDeclineRatio, newHighsMinusLows, breadthScore, confidenceDelta, label_ar };
}
function assessLiquidity(ind) {
  const turnover = (ind.volAvg20 ?? 0) * ind.close;
  if (turnover >= 2e7) {
    return { turnoverEgp: turnover, tier: "deep", label_ar: "سيولة عميقة", confidenceDelta: 2, positionCapPct: 10, estimatedSlippagePct: 0.1 };
  }
  if (turnover >= 5e6) {
    return { turnoverEgp: turnover, tier: "normal", label_ar: "سيولة طبيعية", confidenceDelta: 0, positionCapPct: 7, estimatedSlippagePct: 0.3 };
  }
  if (turnover >= 1e6) {
    return { turnoverEgp: turnover, tier: "thin", label_ar: "سيولة ضعيفة — حذر من الانزلاق", confidenceDelta: -5, positionCapPct: 3, estimatedSlippagePct: 0.8 };
  }
  return { turnoverEgp: turnover, tier: "illiquid", label_ar: "سيولة منعدمة — تجنّب", confidenceDelta: -15, positionCapPct: 1, estimatedSlippagePct: 2 };
}
function computeDisagreement(scores) {
  const vals = [
    scores.technical,
    scores.fundamental ?? scores.technical,
    scores.sentiment,
    scores.macro,
    scores.sector
  ];
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
  const stdDev = +Math.sqrt(variance).toFixed(1);
  const range = Math.max(...vals) - Math.min(...vals);
  if (stdDev < 8) return { stdDev, range, agreement: "high", confidenceDelta: 5, label_ar: "إجماع قوي بين كل الأبعاد" };
  if (stdDev < 18) return { stdDev, range, agreement: "medium", confidenceDelta: 0, label_ar: "اتفاق متوسط" };
  return { stdDev, range, agreement: "low", confidenceDelta: -8, label_ar: "تشتت كبير بين النماذج — يقين منخفض" };
}
function detectContrarian(args) {
  let flags = 0;
  const reasons = [];
  if (args.ind.rsi14 != null && args.ind.rsi14 > 78) {
    flags++;
    reasons.push(`RSI متطرف ${args.ind.rsi14.toFixed(0)}`);
  }
  if (args.news?.sentiment_score != null && args.news.sentiment_score > 0.8) {
    flags++;
    reasons.push("أخبار إيجابية بشكل مفرط");
  }
  if (args.ensembleAgreement != null && args.ensembleAgreement >= 95) {
    flags++;
    reasons.push("إجماع نموذجي 100%");
  }
  if (args.changePct5d != null && args.changePct5d > 15) {
    flags++;
    reasons.push(`ارتفاع +${args.changePct5d.toFixed(1)}% في 5 أيام`);
  }
  if (flags >= 3) {
    return { triggered: true, confidenceDelta: -7, reason_ar: `إشارة عكسية: ${reasons.join(" • ")}` };
  }
  if (flags >= 2) {
    return { triggered: true, confidenceDelta: -3, reason_ar: `حذر — تشبع: ${reasons.join(" • ")}` };
  }
  return { triggered: false, confidenceDelta: 0, reason_ar: null };
}
function computeCrossAsset(macro, candles) {
  const reasons = [];
  let delta = 0;
  if (!macro) return { riskOn: true, confidenceDelta: 0, reasons_ar: [] };
  if (macro.sp500_change_pct != null) {
    if (macro.sp500_change_pct < -1.5) {
      delta -= 4;
      reasons.push("S&P 500 هبوط قوي — بيع في الأسواق الناشئة");
    } else if (macro.sp500_change_pct > 1) {
      delta += 2;
      reasons.push("S&P 500 إيجابي — شهية مخاطرة");
    }
  }
  if (macro.brent_oil_usd != null && candles && candles.length >= 20) {
    const c20 = candles.slice(-20);
    const ret = (c20[c20.length - 1].close - c20[0].close) / c20[0].close;
    if (macro.brent_oil_usd > 90 && ret < 0) {
      delta -= 2;
      reasons.push("نفط مرتفع + ضغط على السهم");
    }
  }
  if (macro.usd_egp != null && macro.usd_egp >= 55) {
    delta -= 2;
    reasons.push(`الدولار مرتفع (${macro.usd_egp.toFixed(2)} EGP) — ضغط على المستوردين`);
  }
  if (macro.gold_usd != null && macro.gold_usd >= 2700) {
    delta -= 1;
    reasons.push("ذهب مرتفع — مزاج تجنب مخاطرة");
  }
  return { riskOn: delta >= 0, confidenceDelta: Math.max(-6, Math.min(6, delta)), reasons_ar: reasons };
}
const TRAINING_WINDOW_DAYS = 90;
function windowStartISO(days = TRAINING_WINDOW_DAYS) {
  const d = /* @__PURE__ */ new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}
function symbolWeight(rowSymbol, focusSymbol) {
  if (!focusSymbol) return 1;
  return rowSymbol === focusSymbol ? 2 : 1;
}
const DEFAULT$1 = {
  w: [0.25, 0.15, 0.2, 0.15, 0.25],
  b: 0,
  fitted: false,
  sampleSize: 0,
  accuracy: 0
};
function sigmoid$3(z2) {
  return 1 / (1 + Math.exp(-z2));
}
async function trainMetaLearner(focusSymbol = null) {
  const { data } = await supabaseAdmin.from("recommendations").select("technical_score, fundamental_score, sentiment_score, macro_score, sector_score, outcome, realized_pct, symbol, created_at").in("outcome", ["target_hit", "stop_hit", "expired"]).in("signal", ["buy", "strong_buy"]).gte("created_at", windowStartISO()).limit(3e3);
  const rows = (data ?? []).filter(
    (r) => r.technical_score != null && r.sentiment_score != null && r.macro_score != null && r.sector_score != null
  );
  if (rows.length < 50) return DEFAULT$1;
  const X = rows.map((r) => [
    Number(r.technical_score) / 100,
    Number(r.fundamental_score ?? r.technical_score) / 100,
    Number(r.sentiment_score) / 100,
    Number(r.macro_score) / 100,
    Number(r.sector_score) / 100
  ]);
  const y = rows.map(
    (r) => r.outcome === "target_hit" || r.realized_pct != null && Number(r.realized_pct) > 0 ? 1 : 0
  );
  const weights = rows.map((r) => symbolWeight(r.symbol, focusSymbol));
  const idx = X.map((_, i) => i);
  const cutoff = Math.floor(idx.length * 0.8);
  const trainIdx = idx.slice(0, cutoff);
  const testIdx = idx.slice(cutoff);
  let w = [...DEFAULT$1.w];
  let b = 0;
  const lr = 0.05;
  const epochs = 200;
  for (let e = 0; e < epochs; e++) {
    for (const i of trainIdx) {
      const z2 = X[i].reduce((s, v, k) => s + v * w[k], b);
      const p = sigmoid$3(z2);
      const err = (p - y[i]) * weights[i];
      for (let k = 0; k < 5; k++) w[k] -= lr * err * X[i][k];
      b -= lr * err;
    }
  }
  const sumAbs = w.reduce((s, v) => s + Math.max(0, v), 0) || 1;
  const wNorm = w.map((v) => +(Math.max(0, v) / sumAbs).toFixed(4));
  let correct = 0;
  for (const i of trainIdx) {
    const z2 = X[i].reduce((s, v, k) => s + v * w[k], b);
    const pred = sigmoid$3(z2) >= 0.5 ? 1 : 0;
    if (pred === y[i]) correct++;
  }
  let cvCorrect = 0;
  for (const i of testIdx) {
    const z2 = X[i].reduce((s, v, k) => s + v * w[k], b);
    const pred = sigmoid$3(z2) >= 0.5 ? 1 : 0;
    if (pred === y[i]) cvCorrect++;
  }
  return {
    w: wNorm,
    b: +b.toFixed(4),
    fitted: true,
    sampleSize: rows.length,
    accuracy: +(correct / Math.max(1, trainIdx.length)).toFixed(3),
    cvAccuracy: testIdx.length > 0 ? +(cvCorrect / testIdx.length).toFixed(3) : void 0
  };
}
function metaPredict(scores, m) {
  const x = [
    scores.technical / 100,
    (scores.fundamental ?? scores.technical) / 100,
    scores.sentiment / 100,
    scores.macro / 100,
    scores.sector / 100
  ];
  const z2 = x.reduce((s, v, k) => s + v * m.w[k], m.b);
  return Math.round(sigmoid$3(z2) * 100);
}
const POP = 30;
const GENERATIONS = 40;
const MUT_RATE = 0.15;
const MUT_STD = 0.08;
const ELITE = 4;
function sigmoid$2(z2) {
  return 1 / (1 + Math.exp(-z2));
}
function logLoss(ind, X, y) {
  let s = 0;
  for (let i = 0; i < X.length; i++) {
    const z2 = X[i].reduce((acc, v, k) => acc + v * ind.w[k], ind.b);
    const p = Math.max(1e-6, Math.min(1 - 1e-6, sigmoid$2(z2)));
    s += -(y[i] * Math.log(p) + (1 - y[i]) * Math.log(1 - p));
  }
  return s / Math.max(1, X.length);
}
function rand(mean, std) {
  const u = Math.max(1e-9, Math.random());
  const v = Math.max(1e-9, Math.random());
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function mutate(ind) {
  const w = ind.w.map((v) => Math.random() < MUT_RATE ? v + rand(0, MUT_STD) : v);
  const b = Math.random() < MUT_RATE ? ind.b + rand(0, MUT_STD) : ind.b;
  return { w, b };
}
function crossover(a, b) {
  const w = a.w.map((v, k) => Math.random() < 0.5 ? v : b.w[k]);
  const bias = Math.random() < 0.5 ? a.b : b.b;
  return { w, b: bias };
}
function normalize(ind) {
  const sumPos = ind.w.reduce((s, v) => s + Math.max(0, v), 0) || 1;
  const w = ind.w.map((v) => +(Math.max(0, v) / sumPos).toFixed(4));
  return { w, b: +ind.b.toFixed(4) };
}
async function optimizeWeightsGA(seed) {
  const { data } = await supabaseAdmin.from("recommendations").select("technical_score, fundamental_score, sentiment_score, macro_score, sector_score, outcome, realized_pct").in("outcome", ["target_hit", "stop_hit", "expired"]).in("signal", ["buy", "strong_buy"]).gte("created_at", windowStartISO()).limit(3e3);
  const rows = (data ?? []).filter(
    (r) => r.technical_score != null && r.sentiment_score != null && r.macro_score != null && r.sector_score != null
  );
  if (rows.length < 80) return seed;
  const X = rows.map((r) => [
    Number(r.technical_score) / 100,
    Number(r.fundamental_score ?? r.technical_score) / 100,
    Number(r.sentiment_score) / 100,
    Number(r.macro_score) / 100,
    Number(r.sector_score) / 100
  ]);
  const y = rows.map(
    (r) => r.outcome === "target_hit" || r.realized_pct != null && Number(r.realized_pct) > 0 ? 1 : 0
  );
  let pop = [{ w: [...seed.w], b: seed.b }];
  for (let i = 1; i < POP; i++) {
    pop.push(mutate({ w: [...seed.w], b: seed.b }));
  }
  let bestEver = pop[0];
  let bestLoss = logLoss(bestEver, X, y);
  for (let g = 0; g < GENERATIONS; g++) {
    const scored = pop.map((ind) => ({ ind, loss: logLoss(ind, X, y) })).sort((a, b) => a.loss - b.loss);
    if (scored[0].loss < bestLoss) {
      bestLoss = scored[0].loss;
      bestEver = scored[0].ind;
    }
    const elites = scored.slice(0, ELITE).map((s) => s.ind);
    const next = [...elites];
    while (next.length < POP) {
      const a = elites[Math.floor(Math.random() * elites.length)];
      const b = scored[Math.floor(Math.random() * Math.min(scored.length, 10))].ind;
      next.push(mutate(crossover(a, b)));
    }
    pop = next;
  }
  const seedLoss = logLoss({ w: [...seed.w], b: seed.b }, X, y);
  if (bestLoss >= seedLoss) return seed;
  const best = normalize(bestEver);
  let correct = 0;
  for (let i = 0; i < X.length; i++) {
    const z2 = X[i].reduce((s, v, k) => s + v * best.w[k], best.b);
    if ((sigmoid$2(z2) >= 0.5 ? 1 : 0) === y[i]) correct++;
  }
  return {
    w: best.w,
    b: best.b,
    fitted: true,
    sampleSize: rows.length,
    accuracy: +(correct / rows.length).toFixed(3)
  };
}
const DEFAULT = {
  w: [0.25, 0.15, 0.2, 0.15, 0.25],
  b: 0,
  fitted: false,
  sampleSize: 0,
  accuracy: 0
};
const MIN_SAMPLES = 40;
function sigmoid$1(z2) {
  return 1 / (1 + Math.exp(-z2));
}
function regimeBucket(r) {
  if (r === "bull_trending") return "bull";
  if (r === "bear_trending") return "bear";
  if (r === "high_volatility") return "volatile";
  return "neutral";
}
function trendBucket(trend) {
  if (trend === "up") return "bull";
  if (trend === "down") return "bear";
  return "neutral";
}
function trainOn(rows) {
  if (rows.length < MIN_SAMPLES) return DEFAULT;
  let w = [...DEFAULT.w];
  let b = 0;
  const lr = 0.05;
  const epochs = 200;
  for (let e = 0; e < epochs; e++) {
    for (const r of rows) {
      const z2 = r.x.reduce((s, v, k) => s + v * w[k], b);
      const err = sigmoid$1(z2) - r.y;
      for (let k = 0; k < 5; k++) w[k] -= lr * err * r.x[k];
      b -= lr * err;
    }
  }
  const sumPos = w.reduce((s, v) => s + Math.max(0, v), 0) || 1;
  const wNorm = w.map((v) => +(Math.max(0, v) / sumPos).toFixed(4));
  let correct = 0;
  for (const r of rows) {
    const z2 = r.x.reduce((s, v, k) => s + v * w[k], b);
    if ((sigmoid$1(z2) >= 0.5 ? 1 : 0) === r.y) correct++;
  }
  return {
    w: wNorm,
    b: +b.toFixed(4),
    fitted: true,
    sampleSize: rows.length,
    accuracy: +(correct / rows.length).toFixed(3)
  };
}
async function trainRegimeSpecificMeta(activeRegime) {
  const { data } = await supabaseAdmin.from("recommendations").select(
    "technical_score, fundamental_score, sentiment_score, macro_score, sector_score, outcome, realized_pct, market_trend"
  ).in("outcome", ["target_hit", "stop_hit", "expired"]).in("signal", ["buy", "strong_buy"]).gte("created_at", windowStartISO()).limit(5e3);
  const buckets = {
    bull: [],
    bear: [],
    neutral: [],
    volatile: []
  };
  for (const r of data ?? []) {
    if (r.technical_score == null || r.sentiment_score == null || r.macro_score == null || r.sector_score == null) continue;
    const b = trendBucket(r.market_trend);
    buckets[b].push({
      x: [
        Number(r.technical_score) / 100,
        Number(r.fundamental_score ?? r.technical_score) / 100,
        Number(r.sentiment_score) / 100,
        Number(r.macro_score) / 100,
        Number(r.sector_score) / 100
      ],
      y: r.outcome === "target_hit" || r.realized_pct != null && Number(r.realized_pct) > 0 ? 1 : 0
    });
  }
  const perRegime = {
    bull: trainOn(buckets.bull),
    bear: trainOn(buckets.bear),
    neutral: trainOn(buckets.neutral),
    volatile: trainOn(buckets.volatile)
  };
  const bucket2 = regimeBucket(activeRegime);
  const active = perRegime[bucket2].fitted ? perRegime[bucket2] : DEFAULT;
  return { active, bucket: bucket2, perRegime };
}
const UNCERTAIN_BAND = 15;
const BATCH_LIMIT = 200;
async function autoLabelUncertain() {
  const { data: recs } = await supabaseAdmin.from("recommendations").select("id, symbol, confidence, outcome, realized_pct, outcome_at").in("outcome", ["target_hit", "stop_hit", "expired"]).not("realized_pct", "is", null).order("outcome_at", { ascending: false }).limit(BATCH_LIMIT);
  if (!recs || recs.length === 0) return { labeled: 0, skipped: 0 };
  const uncertain = recs.filter(
    (r) => r.confidence != null && Math.abs(Number(r.confidence) - 50) <= UNCERTAIN_BAND
  );
  if (uncertain.length === 0) return { labeled: 0, skipped: recs.length };
  const ids = uncertain.map((r) => r.id);
  const { data: existing } = await supabaseAdmin.from("learning_labels").select("recommendation_id").in("recommendation_id", ids);
  const have = new Set((existing ?? []).map((e) => e.recommendation_id));
  const rows = [];
  for (const r of uncertain) {
    if (have.has(r.id)) continue;
    const conf = Number(r.confidence);
    const realized = Number(r.realized_pct);
    const uncertainty = Math.abs(conf - 50);
    rows.push({
      recommendation_id: r.id,
      symbol: r.symbol,
      label: realized > 0 ? "win" : "loss",
      realized_pct: realized,
      confidence: conf,
      uncertainty,
      // closer to 50 → higher weight (max 3x, min 1x)
      label_weight: +(1 + (UNCERTAIN_BAND - uncertainty) / UNCERTAIN_BAND * 2).toFixed(2),
      labeled_at: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  if (rows.length === 0) return { labeled: 0, skipped: uncertain.length };
  const { error } = await supabaseAdmin.from("learning_labels").insert(rows);
  if (error) {
    return { labeled: 0, skipped: rows.length };
  }
  return { labeled: rows.length, skipped: uncertain.length - rows.length };
}
const NAMES_AR = {
  technical: "التحليل الفني",
  fundamental: "التحليل المالي",
  sentiment: "الأخبار والمشاعر",
  macro: "البيئة الاقتصادية",
  sector: "أداء القطاع"
};
function shapExplain(scores, m) {
  const feats = ["technical", "fundamental", "sentiment", "macro", "sector"];
  const x = [
    scores.technical / 100,
    (scores.fundamental ?? scores.technical) / 100,
    scores.sentiment / 100,
    scores.macro / 100,
    scores.sector / 100
  ];
  const raw = [
    scores.technical,
    scores.fundamental ?? scores.technical,
    scores.sentiment,
    scores.macro,
    scores.sector
  ];
  const baseline = 0.5;
  const contribs = x.map((v, k) => m.w[k] * (v - baseline));
  const maxAbs = Math.max(...contribs.map((c) => Math.abs(c)), 1e-6);
  return feats.map((f, k) => {
    const c = contribs[k];
    return {
      feature: f,
      name_ar: NAMES_AR[f],
      raw: +raw[k].toFixed(1),
      contribution: +c.toFixed(4),
      impact: c > 0.01 ? "positive" : c < -0.01 ? "negative" : "neutral",
      weight: Math.round(Math.abs(c) / maxAbs * 100)
    };
  }).sort((a, b) => b.weight - a.weight);
}
const Z = 1.96;
function wilsonCI(probPct, sampleSize) {
  const n2 = Math.max(1, sampleSize);
  const p = Math.max(0, Math.min(1, probPct / 100));
  const denom = 1 + Z * Z / n2;
  const center = (p + Z * Z / (2 * n2)) / denom;
  const margin = Z * Math.sqrt((p * (1 - p) + Z * Z / (4 * n2)) / n2) / denom;
  const lower = Math.max(0, +(100 * (center - margin)).toFixed(1));
  const upper = Math.min(100, +(100 * (center + margin)).toFixed(1));
  const width = +(upper - lower).toFixed(1);
  const sizeMultiplier = +Math.max(0.5, Math.min(1, 1 - width / 120)).toFixed(2);
  return { point: +probPct.toFixed(1), lower, upper, width, sizeMultiplier };
}
function atrLevels(entry, ind, opts = {}) {
  const atr = ind.atr14 ?? null;
  if (!atr || atr <= 0 || entry <= 0) {
    return { entry, stop: entry * 0.95, target: entry * 1.08, rr: 1.6, used: false };
  }
  const stopMult = opts.stopMult ?? 1.5;
  const targetMult = opts.targetMult ?? 2.5;
  const stop = +Math.max(0.01, entry - stopMult * atr).toFixed(3);
  const target = +(entry + targetMult * atr).toFixed(3);
  const rr = +((target - entry) / Math.max(1e-3, entry - stop)).toFixed(2);
  return { entry, stop, target, rr, used: true };
}
const NEUTRAL$1 = {
  velocity: 0,
  trend: "stable",
  label_ar: "المشاعر مستقرة",
  confidenceDelta: 0,
  sampleSize: 0
};
function isoDaysAgo(days) {
  const d = /* @__PURE__ */ new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}
async function loadSentimentVelocity(symbols) {
  const out = /* @__PURE__ */ new Map();
  if (symbols.length === 0) return out;
  const { data } = await supabaseAdmin.from("news_sentiment").select("symbol, sentiment_score, published_at, created_at").in("symbol", symbols).gte("created_at", isoDaysAgo(5)).order("created_at", { ascending: true });
  const bySymbol = /* @__PURE__ */ new Map();
  for (const r of data ?? []) {
    const t = new Date(r.published_at ?? r.created_at).getTime();
    const s = Number(r.sentiment_score);
    if (!isFinite(t) || !isFinite(s)) continue;
    const arr = bySymbol.get(r.symbol) ?? [];
    arr.push({ t, s });
    bySymbol.set(r.symbol, arr);
  }
  for (const sym of symbols) {
    const pts = bySymbol.get(sym);
    if (!pts || pts.length < 2) {
      out.set(sym, { symbol: sym, ...NEUTRAL$1 });
      continue;
    }
    const n2 = pts.length;
    const tMin = pts[0].t;
    const xs = pts.map((p) => (p.t - tMin) / (1e3 * 60 * 60 * 24));
    const ys = pts.map((p) => p.s);
    const mx = xs.reduce((a, b) => a + b, 0) / n2;
    const my = ys.reduce((a, b) => a + b, 0) / n2;
    const num2 = xs.reduce((acc, x, i) => acc + (x - mx) * (ys[i] - my), 0);
    const den = xs.reduce((acc, x) => acc + (x - mx) ** 2, 0);
    const slope = den === 0 ? 0 : num2 / den;
    const velocity = Math.max(-1, Math.min(1, slope * 2));
    const trend = velocity > 0.15 ? "improving" : velocity < -0.15 ? "deteriorating" : "stable";
    const label_ar = trend === "improving" ? "مشاعر متحسنة بسرعة" : trend === "deteriorating" ? "مشاعر متدهورة" : "مشاعر مستقرة";
    out.set(sym, {
      symbol: sym,
      velocity: +velocity.toFixed(3),
      trend,
      label_ar,
      confidenceDelta: Math.round(velocity * 8),
      sampleSize: n2
    });
  }
  return out;
}
function detectBlockTrade(ind, candles) {
  const ratio = ind.volRatio ?? null;
  if (!ratio || !candles || candles.length === 0) {
    return { detected: false, kind: "none", volumeRatio: ratio ?? 0, label_ar: "", confidenceDelta: 0 };
  }
  const last = candles[candles.length - 1];
  const range = Math.max(1e-4, last.high - last.low);
  const position = (last.close - last.low) / range;
  if (ratio >= 3 && position >= 0.66) {
    return {
      detected: true,
      kind: "accumulation",
      volumeRatio: +ratio.toFixed(2),
      label_ar: `صفقة كبيرة (تجميع) — حجم ${ratio.toFixed(1)}× المتوسط`,
      confidenceDelta: 6
    };
  }
  if (ratio >= 3 && position <= 0.33) {
    return {
      detected: true,
      kind: "distribution",
      volumeRatio: +ratio.toFixed(2),
      label_ar: `صفقة كبيرة (توزيع) — حجم ${ratio.toFixed(1)}× المتوسط`,
      confidenceDelta: -8
    };
  }
  return { detected: false, kind: "none", volumeRatio: +ratio.toFixed(2), label_ar: "", confidenceDelta: 0 };
}
function dailyVolatility(candles) {
  if (candles.length < 20) return 0.02;
  const rets = [];
  for (let i = 1; i < candles.length; i++) {
    const r = (candles[i].close - candles[i - 1].close) / Math.max(1e-3, candles[i - 1].close);
    if (isFinite(r)) rets.push(r);
  }
  const m = rets.reduce((a, b) => a + b, 0) / Math.max(1, rets.length);
  const v = rets.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, rets.length - 1);
  return Math.sqrt(v);
}
function trendDrift(ind) {
  let drift = 0;
  if (ind.macdHist != null) drift += Math.tanh(ind.macdHist / Math.max(0.01, ind.close * 5e-3)) * 2e-3;
  if (ind.rsi14 != null) drift += (ind.rsi14 - 50) / 50 * 1e-3;
  return Math.max(-5e-3, Math.min(5e-3, drift));
}
function normCdf(z2) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z2));
  const d = 0.39894228 * Math.exp(-z2 * z2 / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z2 >= 0 ? 1 - p : p;
}
function multiHorizonForecast(ind, candles) {
  const sigma = dailyVolatility(candles ?? []);
  const drift = trendDrift(ind);
  const horizons = [3, 10, 30];
  return horizons.map((h) => {
    const er = drift * h;
    const sg = sigma * Math.sqrt(h);
    const z2 = sg === 0 ? 0 : er / sg;
    const prob = Math.round(normCdf(z2) * 100);
    const conf = Math.round(Math.max(40, 95 - h * 1.5));
    const label = h === 3 ? "قصير المدى (3 أيام)" : h === 10 ? "متوسط (10 أيام)" : "ممتد (30 يوم)";
    return {
      horizonDays: h,
      expectedReturnPct: +(er * 100).toFixed(2),
      sigmaPct: +(sg * 100).toFixed(2),
      probUpside: prob,
      confidence: conf,
      label_ar: label
    };
  });
}
const MAX_PER_SECTOR = 2;
function applyPortfolioFilter(picks) {
  const sorted = [...picks].sort((a, b) => b.confidence - a.confidence);
  const sectorCount = /* @__PURE__ */ new Map();
  let demoted = 0;
  for (const p of sorted) {
    if (p.rejected_by_rules) continue;
    if (p.signal !== "buy" && p.signal !== "strong_buy") continue;
    const sec = p.sector ?? "غير محدد";
    const cnt = sectorCount.get(sec) ?? 0;
    if (cnt >= MAX_PER_SECTOR) {
      p.signal = "neutral";
      p.rejected_by_rules = true;
      p.rejection_reason = (p.rejection_reason ? p.rejection_reason + " • " : "") + `تنويع المحفظة: تم بالفعل اختيار ${MAX_PER_SECTOR} من قطاع ${sec}`;
      demoted++;
    } else {
      sectorCount.set(sec, cnt + 1);
    }
  }
  return { picks: sorted, demoted };
}
async function loadEarningsSurprise(symbols) {
  const out = /* @__PURE__ */ new Map();
  if (symbols.length === 0) return out;
  const { data } = await supabaseAdmin.from("fundamentals").select("symbol, as_of, earnings_per_share").in("symbol", symbols).not("earnings_per_share", "is", null).order("as_of", { ascending: false }).limit(symbols.length * 6);
  const bySymbol = /* @__PURE__ */ new Map();
  for (const r of data ?? []) {
    const arr = bySymbol.get(r.symbol) ?? [];
    if (arr.length < 4) arr.push(Number(r.earnings_per_share));
    bySymbol.set(r.symbol, arr);
  }
  for (const sym of symbols) {
    const eps = bySymbol.get(sym);
    if (!eps || eps.length < 2) {
      out.set(sym, { symbol: sym, streak: 0, label_ar: "", confidenceDelta: 0 });
      continue;
    }
    let streak = 0;
    for (let i = 0; i < eps.length - 1; i++) {
      const cur = eps[i];
      const prev = eps[i + 1];
      if (prev === 0) break;
      const growth = (cur - prev) / Math.abs(prev);
      if (growth > 0.05) streak += 1;
      else if (growth < -0.05) streak -= 1;
      else break;
    }
    streak = Math.max(-3, Math.min(3, streak));
    const label = streak >= 2 ? `نمو أرباح متسارع ${streak} فترات متتالية` : streak <= -2 ? `تراجع أرباح متتالي ${Math.abs(streak)} فترات` : "";
    out.set(sym, {
      symbol: sym,
      streak,
      label_ar: label,
      confidenceDelta: streak * 3
    });
  }
  return out;
}
function detectAnomalyAlert(ind, candles, news) {
  if (!candles || candles.length < 30 || ind.changePct == null) {
    return { flagged: false, zScore: 0, hasNews: !!news?.found, label_ar: "", confidenceDelta: 0 };
  }
  const rets = [];
  for (let i = 1; i < candles.length; i++) {
    const r = (candles[i].close - candles[i - 1].close) / Math.max(1e-3, candles[i - 1].close);
    if (isFinite(r)) rets.push(r * 100);
  }
  const m = rets.reduce((a, b) => a + b, 0) / rets.length;
  const sd = Math.sqrt(rets.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, rets.length - 1));
  const z2 = sd === 0 ? 0 : (ind.changePct - m) / sd;
  const hasNews = !!news?.found && (news.headlines?.length ?? 0) > 0;
  if (Math.abs(z2) >= 3 && !hasNews) {
    return {
      flagged: true,
      zScore: +z2.toFixed(2),
      hasNews,
      label_ar: `حركة شاذة ${z2.toFixed(1)}σ بدون أخبار — احذر`,
      confidenceDelta: -10
    };
  }
  return { flagged: false, zScore: +z2.toFixed(2), hasNews, label_ar: "", confidenceDelta: 0 };
}
async function autoDisablePatterns() {
  const { data } = await supabaseAdmin.from("signal_failures").select("id, pattern_name, win_rate, total_count, is_active");
  let disabled = 0;
  let reenabled = 0;
  for (const p of data ?? []) {
    const wr = p.win_rate == null ? null : Number(p.win_rate);
    const total = Number(p.total_count ?? 0);
    if (total < 5 || wr == null) continue;
    if (p.is_active && wr < 0.3) {
      await supabaseAdmin.from("signal_failures").update({ is_active: false, last_updated: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", p.id);
      disabled++;
    } else if (!p.is_active && wr > 0.45) {
      await supabaseAdmin.from("signal_failures").update({ is_active: true, last_updated: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", p.id);
      reenabled++;
    }
  }
  return { disabled, reenabled };
}
const BUCKETS = [
  [30, 49],
  [50, 59],
  [60, 69],
  [70, 79],
  [80, 89],
  [90, 100]
];
async function loadReliability() {
  const { data } = await supabaseAdmin.from("recommendations").select("confidence, outcome, realized_pct").in("outcome", ["target_hit", "stop_hit", "expired"]).in("signal", ["buy", "strong_buy"]).limit(3e3);
  const rows = data ?? [];
  if (rows.length < 30) return { pairs: [], brier: 0, fitted: false, sampleSize: rows.length };
  let brierSum = 0;
  for (const r of rows) {
    const p = Number(r.confidence) / 100;
    const y = r.outcome === "target_hit" || r.realized_pct != null && Number(r.realized_pct) > 0 ? 1 : 0;
    brierSum += (p - y) ** 2;
  }
  const brier = +(brierSum / rows.length).toFixed(4);
  const rawPairs = BUCKETS.map(([lo, hi]) => {
    const subset = rows.filter((r) => r.confidence >= lo && r.confidence <= hi);
    const n2 = subset.length;
    const wins = subset.filter(
      (r) => r.outcome === "target_hit" || r.realized_pct != null && Number(r.realized_pct) > 0
    ).length;
    return { predicted: (lo + hi) / 2, actual: n2 > 0 ? +(wins / n2).toFixed(3) : (lo + hi) / 200, n: n2 };
  });
  const pairs = [...rawPairs];
  for (let i = 1; i < pairs.length; i++) {
    if (pairs[i].n > 0 && pairs[i].actual < pairs[i - 1].actual) {
      const totalN = pairs[i].n + pairs[i - 1].n;
      const pooled = (pairs[i].actual * pairs[i].n + pairs[i - 1].actual * pairs[i - 1].n) / totalN;
      pairs[i].actual = +pooled.toFixed(3);
      pairs[i - 1].actual = +pooled.toFixed(3);
    }
  }
  return { pairs, brier, fitted: true, sampleSize: rows.length };
}
function calibrateProbability(raw, map) {
  if (!map.fitted || map.pairs.length < 2) return raw;
  const pts = map.pairs.filter((p) => p.n >= 3);
  if (pts.length < 2) return raw;
  if (raw <= pts[0].predicted) return Math.round(pts[0].actual * 100);
  if (raw >= pts[pts.length - 1].predicted) return Math.round(pts[pts.length - 1].actual * 100);
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if (raw >= a.predicted && raw <= b.predicted) {
      const t = (raw - a.predicted) / (b.predicted - a.predicted || 1);
      const interp = a.actual + t * (b.actual - a.actual);
      return Math.round(interp * 100);
    }
  }
  return raw;
}
async function winRate(daysBack) {
  const since = new Date(Date.now() - daysBack * 864e5).toISOString();
  const { data } = await supabaseAdmin.from("recommendations").select("outcome, realized_pct, outcome_at").in("outcome", ["target_hit", "stop_hit", "expired"]).in("signal", ["buy", "strong_buy"]).gte("outcome_at", since).limit(2e3);
  const rows = data ?? [];
  if (rows.length === 0) return { rate: 0, n: 0 };
  const wins = rows.filter(
    (r) => r.outcome === "target_hit" || r.realized_pct != null && Number(r.realized_pct) > 0
  ).length;
  return { rate: +(wins / rows.length).toFixed(3), n: rows.length };
}
async function detectDrift() {
  const [recent, baseline] = await Promise.all([winRate(14), winRate(90)]);
  if (recent.n < 10 || baseline.n < 30) {
    return {
      recentWinRate: recent.rate,
      baselineWinRate: baseline.rate,
      delta: 0,
      drift: "none",
      confidencePenalty: 0,
      label_ar: "بيانات غير كافية لقياس الانحراف",
      recentN: recent.n,
      baselineN: baseline.n
    };
  }
  const delta = +((recent.rate - baseline.rate) * 100).toFixed(1);
  if (delta <= -15) {
    return {
      recentWinRate: recent.rate,
      baselineWinRate: baseline.rate,
      delta,
      drift: "severe",
      confidencePenalty: 10,
      label_ar: `انحراف خطير في النموذج (${delta}%) — تخفيض الثقة بـ 10 نقاط لكل توصية`,
      recentN: recent.n,
      baselineN: baseline.n
    };
  }
  if (delta <= -7) {
    return {
      recentWinRate: recent.rate,
      baselineWinRate: baseline.rate,
      delta,
      drift: "mild",
      confidencePenalty: 4,
      label_ar: `انحراف طفيف في النموذج (${delta}%)`,
      recentN: recent.n,
      baselineN: baseline.n
    };
  }
  return {
    recentWinRate: recent.rate,
    baselineWinRate: baseline.rate,
    delta,
    drift: "none",
    confidencePenalty: 0,
    label_ar: `الأداء مستقر (${delta >= 0 ? "+" : ""}${delta}%)`,
    recentN: recent.n,
    baselineN: baseline.n
  };
}
function pctReturn(candles, days) {
  if (!candles || candles.length < days + 1) return null;
  const recent = candles.slice(-days - 1);
  const start = recent[0].close;
  const end = recent[recent.length - 1].close;
  if (!start) return null;
  return (end - start) / start * 100;
}
function computeRelativeStrength(stockCandles, marketCandles) {
  const empty = {
    rs20: 0,
    rs60: 0,
    isLeader: false,
    isLaggard: false,
    label_ar: "",
    confidenceDelta: 0
  };
  if (!stockCandles || !marketCandles) return empty;
  const s20 = pctReturn(stockCandles, 20);
  const m20 = pctReturn(marketCandles, 20);
  const s60 = pctReturn(stockCandles, 60);
  const m60 = pctReturn(marketCandles, 60);
  const rs20 = s20 != null && m20 != null ? +(s20 - m20).toFixed(2) : 0;
  const rs60 = s60 != null && m60 != null ? +(s60 - m60).toFixed(2) : 0;
  const combined = rs20 * 0.6 + rs60 * 0.4;
  const isLeader = combined > 5;
  const isLaggard = combined < -5;
  let confidenceDelta = 0;
  let label_ar = "";
  if (isLeader) {
    confidenceDelta = Math.min(8, Math.round(combined / 2));
    label_ar = `قوة نسبية قوية مقابل المؤشر (+${combined.toFixed(1)}%)`;
  } else if (isLaggard) {
    confidenceDelta = Math.max(-8, Math.round(combined / 2));
    label_ar = `ضعف نسبي مقابل المؤشر (${combined.toFixed(1)}%)`;
  }
  return { rs20, rs60, isLeader, isLaggard, label_ar, confidenceDelta };
}
function detectSeasonality(candles) {
  const empty = {
    currentMonth: (/* @__PURE__ */ new Date()).getMonth() + 1,
    avgMonthReturn: 0,
    positiveRate: 0,
    sampleYears: 0,
    bias: "neutral",
    label_ar: "",
    confidenceDelta: 0
  };
  if (!candles || candles.length < 60) return empty;
  const currentMonth = (/* @__PURE__ */ new Date()).getMonth() + 1;
  const monthly = /* @__PURE__ */ new Map();
  for (const c of candles) {
    const d = new Date(c.date);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const ex = monthly.get(key);
    if (!ex) monthly.set(key, { first: c.close, last: c.close });
    else monthly.set(key, { first: ex.first, last: c.close });
  }
  const sameMonthReturns = [];
  for (const [key, { first, last }] of monthly) {
    const m = Number(key.split("-")[1]);
    if (m === currentMonth && first > 0) {
      sameMonthReturns.push((last - first) / first * 100);
    }
  }
  if (sameMonthReturns.length < 2) return empty;
  const avg = sameMonthReturns.reduce((a, b) => a + b, 0) / sameMonthReturns.length;
  const positiveRate = sameMonthReturns.filter((r) => r > 0).length / sameMonthReturns.length * 100;
  let bias = "neutral";
  let confidenceDelta = 0;
  let label_ar = "";
  if (avg > 1.5 && positiveRate >= 60) {
    bias = "bullish";
    confidenceDelta = Math.min(5, Math.round(avg));
    label_ar = `موسمية إيجابية: متوسط الشهر +${avg.toFixed(1)}% (${positiveRate.toFixed(0)}% احتمالية صعود)`;
  } else if (avg < -1.5 && positiveRate <= 40) {
    bias = "bearish";
    confidenceDelta = Math.max(-5, Math.round(avg));
    label_ar = `موسمية سلبية: متوسط الشهر ${avg.toFixed(1)}% (${(100 - positiveRate).toFixed(0)}% احتمالية هبوط)`;
  }
  return {
    currentMonth,
    avgMonthReturn: +avg.toFixed(2),
    positiveRate: +positiveRate.toFixed(1),
    sampleYears: sameMonthReturns.length,
    bias,
    label_ar,
    confidenceDelta
  };
}
function sequenceForecast(candles) {
  const empty = {
    expectedReturnPct: 0,
    direction: "flat",
    confidence: 0,
    momentum: 0,
    meanReversion: 0,
    label_ar: "",
    confidenceDelta: 0
  };
  if (!candles || candles.length < 30) return empty;
  const returns = [];
  for (let i = 1; i < candles.length; i++) {
    const r = (candles[i].close - candles[i - 1].close) / candles[i - 1].close;
    returns.push(r);
  }
  const lambda = 0.94;
  let weightSum = 0;
  let weightedReturn = 0;
  for (let i = returns.length - 1; i >= 0; i--) {
    const age = returns.length - 1 - i;
    const w = Math.pow(lambda, age);
    weightedReturn += returns[i] * w;
    weightSum += w;
    if (age > 30) break;
  }
  const momentum = weightSum > 0 ? weightedReturn / weightSum * 100 : 0;
  const last20 = candles.slice(-20).map((c) => c.close);
  const avg = last20.reduce((a, b) => a + b, 0) / last20.length;
  const std = Math.sqrt(last20.map((c) => (c - avg) ** 2).reduce((a, b) => a + b, 0) / last20.length);
  const lastClose = candles[candles.length - 1].close;
  const zScore = std > 0 ? (lastClose - avg) / std : 0;
  const meanReversion = -zScore * 0.3;
  const expectedReturnPct = +(momentum * 0.7 + meanReversion).toFixed(2);
  const absExp = Math.abs(expectedReturnPct);
  const confidence = Math.min(85, 40 + Math.round(absExp * 8));
  const direction = expectedReturnPct > 0.3 ? "up" : expectedReturnPct < -0.3 ? "down" : "flat";
  let confidenceDelta = 0;
  let label_ar = "";
  if (direction === "up" && absExp > 0.5) {
    confidenceDelta = Math.min(6, Math.round(absExp * 2));
    label_ar = `نموذج التسلسل يتوقع صعود +${expectedReturnPct}%`;
  } else if (direction === "down" && absExp > 0.5) {
    confidenceDelta = Math.max(-6, -Math.round(absExp * 2));
    label_ar = `نموذج التسلسل يتوقع هبوط ${expectedReturnPct}%`;
  }
  return {
    expectedReturnPct,
    direction,
    confidence,
    momentum: +momentum.toFixed(3),
    meanReversion: +meanReversion.toFixed(3),
    label_ar,
    confidenceDelta
  };
}
function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}
function linearModel(s) {
  const fund = s.fundamental ?? 50;
  const raw = 0.35 * s.technical + 0.15 * fund + 0.2 * s.sentiment + 0.15 * s.macro + 0.15 * s.sector;
  return Math.max(0, Math.min(100, raw));
}
function treeModel(s) {
  const fund = s.fundamental ?? 50;
  let prob = 50;
  if (s.technical >= 70 && s.sentiment >= 60) prob += 15;
  else if (s.technical >= 60) prob += 5;
  else if (s.technical < 40) prob -= 12;
  if (fund >= 70) prob += 8;
  else if (fund < 35) prob -= 10;
  if (s.macro >= 60 && s.sector >= 60) prob += 8;
  if (s.macro < 35 || s.sector < 35) prob -= 8;
  return Math.max(5, Math.min(95, prob));
}
function neuralModel(s) {
  const norm = (x) => (x - 50) / 25;
  const t = norm(s.technical), f = norm(s.fundamental ?? 50), se = norm(s.sentiment), m = norm(s.macro), sc = norm(s.sector);
  const h1 = Math.tanh(0.6 * t + 0.3 * se + 0.2 * sc + 0.1 * m);
  const h2 = Math.tanh(0.5 * f + 0.4 * m + 0.3 * sc - 0.2 * t);
  const out = sigmoid(1.2 * h1 + 0.8 * h2);
  return Math.round(out * 100);
}
function stackingEnsemble(scores) {
  const linearProb = Math.round(linearModel(scores));
  const treeProb = Math.round(treeModel(scores));
  const neuralProb = Math.round(neuralModel(scores));
  const probs = [linearProb, treeProb, neuralProb];
  const stackedProb = Math.round(linearProb * 0.3 + treeProb * 0.3 + neuralProb * 0.4);
  const max = Math.max(...probs), min = Math.min(...probs);
  const spread = max - min;
  const agreement = Math.max(0, 100 - spread * 2);
  let confidenceDelta = 0;
  let label_ar = "";
  if (agreement >= 80 && stackedProb >= 65) {
    confidenceDelta = 6;
    label_ar = `النماذج الثلاثة متفقة على إيجابية (${stackedProb}%)`;
  } else if (agreement >= 80 && stackedProb <= 35) {
    confidenceDelta = -6;
    label_ar = `النماذج الثلاثة متفقة على سلبية (${stackedProb}%)`;
  } else if (agreement < 50) {
    confidenceDelta = -4;
    label_ar = `النماذج غير متفقة (تشتت ${spread}%)`;
  }
  return { linearProb, treeProb, neuralProb, stackedProb, agreement, label_ar, confidenceDelta };
}
function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}
function logOdds(p) {
  const safe2 = clamp(p / 100, 0.01, 0.99);
  return Math.log(safe2 / (1 - safe2));
}
function fromLogOdds(lo) {
  return 1 / (1 + Math.exp(-lo)) * 100;
}
function bayesianUpdate(priorPct, evidence) {
  let lo = logOdds(priorPct);
  let applied = 0;
  for (const e of evidence) {
    if (e.reliability <= 0) continue;
    const evidenceLo = logOdds(e.probability);
    const priorBaselineLo = logOdds(50);
    const llr = (evidenceLo - priorBaselineLo) * clamp(e.reliability, 0, 1);
    lo += llr;
    applied++;
  }
  const posteriorPct = Math.round(fromLogOdds(lo));
  const deltaPct = posteriorPct - Math.round(priorPct);
  const label_ar = applied > 0 ? `تحديث Bayesian: ${Math.round(priorPct)}% → ${posteriorPct}% (${applied} دليل)` : "";
  return { priorPct: Math.round(priorPct), posteriorPct, deltaPct, appliedEvidence: applied, label_ar };
}
function betaSample(alpha, beta) {
  const sampleGamma = (shape) => {
    if (shape < 1) return sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    while (true) {
      let x2, v;
      do {
        x2 = randomNormal();
        v = 1 + c * x2;
      } while (v <= 0);
      v = v * v * v;
      const u = Math.random();
      if (u < 1 - 0.0331 * Math.pow(x2, 4)) return d * v;
      if (Math.log(u) < 0.5 * x2 * x2 + d * (1 - v + Math.log(v))) return d * v;
    }
  };
  const x = sampleGamma(alpha);
  const y = sampleGamma(beta);
  return x / (x + y);
}
function randomNormal() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
async function runBandit() {
  const { data } = await supabaseAdmin.from("recommendations").select("confidence, realized_pct, outcome").neq("outcome", "pending").not("realized_pct", "is", null).order("created_at", { ascending: false }).limit(500);
  const buckets = {
    "60-70": { wins: 0, losses: 0, totalReturn: 0 },
    "70-80": { wins: 0, losses: 0, totalReturn: 0 },
    "80-95": { wins: 0, losses: 0, totalReturn: 0 }
  };
  for (const r of data ?? []) {
    const c = Number(r.confidence);
    const ret = Number(r.realized_pct);
    if (!Number.isFinite(c) || !Number.isFinite(ret)) continue;
    const key = c < 70 ? "60-70" : c < 80 ? "70-80" : "80-95";
    if (ret > 0) buckets[key].wins++;
    else buckets[key].losses++;
    buckets[key].totalReturn += ret;
  }
  const arms = Object.entries(buckets).map(([bucket2, b]) => {
    const n2 = b.wins + b.losses;
    const posteriorMean = n2 > 0 ? b.wins / n2 : 0.5;
    const sample = betaSample(b.wins + 1, b.losses + 1);
    return { bucket: bucket2, wins: b.wins, losses: b.losses, totalReturn: +b.totalReturn.toFixed(2), posteriorMean: +posteriorMean.toFixed(3), sample: +sample.toFixed(3) };
  });
  const best = arms.reduce((a, b) => b.sample > a.sample ? b : a, arms[0]);
  const recommendedThreshold = best?.bucket === "80-95" ? 80 : best?.bucket === "70-80" ? 70 : 60;
  const label_ar = best ? `أفضل عتبة ثقة بناءً على الأداء: ${recommendedThreshold}+ (نسبة الفوز ${(best.posteriorMean * 100).toFixed(0)}%)` : "بيانات غير كافية";
  return { arms, bestArm: best?.bucket ?? null, recommendedThreshold, label_ar };
}
function bucketOf(uuid) {
  const c = uuid.charCodeAt(0);
  return c % 2 === 0 ? "A" : "B";
}
function normalCdf(z2) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z2));
  const d = 0.3989423 * Math.exp(-z2 * z2 / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z2 > 0 ? 1 - p : p;
}
async function runABTest() {
  const { data } = await supabaseAdmin.from("recommendations").select("id, realized_pct, outcome").neq("outcome", "pending").not("realized_pct", "is", null).order("created_at", { ascending: false }).limit(500);
  const a = { wins: 0, n: 0, totalReturn: 0 };
  const b = { wins: 0, n: 0, totalReturn: 0 };
  for (const r of data ?? []) {
    const ret = Number(r.realized_pct);
    if (!Number.isFinite(ret)) continue;
    const bucket2 = bucketOf(String(r.id));
    const target = bucket2 === "A" ? a : b;
    target.n++;
    target.totalReturn += ret;
    if (ret > 0) target.wins++;
  }
  const pA = a.n > 0 ? a.wins / a.n : 0;
  const pB = b.n > 0 ? b.wins / b.n : 0;
  const pPool = (a.wins + b.wins) / Math.max(1, a.n + b.n);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / Math.max(1, a.n) + 1 / Math.max(1, b.n)));
  const zScore = se > 0 ? (pA - pB) / se : 0;
  const pValue = +(2 * (1 - normalCdf(Math.abs(zScore)))).toFixed(4);
  const significant = pValue < 0.05 && a.n >= 30 && b.n >= 30;
  const winner = !significant ? "tie" : pA > pB ? "A" : "B";
  const label_ar = a.n + b.n < 30 ? "اختبار A/B: بيانات غير كافية بعد" : significant ? `الفائز إحصائيًا: المتغير ${winner} (p=${pValue})` : `لا فرق إحصائي بين المتغيرات (p=${pValue})`;
  return {
    variantA: { name: "A", n: a.n, winRate: +(pA * 100).toFixed(1), avgReturn: a.n > 0 ? +(a.totalReturn / a.n).toFixed(2) : 0 },
    variantB: { name: "B", n: b.n, winRate: +(pB * 100).toFixed(1), avgReturn: b.n > 0 ? +(b.totalReturn / b.n).toFixed(2) : 0 },
    zScore: +zScore.toFixed(3),
    pValue,
    winner,
    significant,
    label_ar
  };
}
const NEUTRAL = {
  sampleSize: 0,
  winRate: 0,
  confidenceDelta: 0,
  label_ar: ""
};
async function similarSetupBoost(args) {
  if (!args.signal || args.signal !== "buy" && args.signal !== "strong_buy") return NEUTRAL;
  if (typeof args.rsi !== "number") return NEUTRAL;
  const macdDir = (args.macdHist ?? 0) >= 0 ? "pos" : "neg";
  const rsiLow = Math.max(0, args.rsi - 12);
  const rsiHigh = Math.min(100, args.rsi + 12);
  const { data } = await supabaseAdmin.from("recommendations").select("outcome, realized_pct, raw_ai_response").in("signal", ["buy", "strong_buy"]).neq("outcome", "pending").order("created_at", { ascending: false }).limit(500);
  if (!data || data.length === 0) return NEUTRAL;
  const similar = data.filter((r) => {
    const raw = r.raw_ai_response;
    if (!raw) return false;
    const rsi = extractNum(raw, ["rsi14", "rsi"]);
    const mh = extractNum(raw, ["macdHist", "macd_hist", "macd_histogram"]);
    if (rsi == null) return false;
    if (rsi < rsiLow || rsi > rsiHigh) return false;
    if (mh != null && args.macdHist != null) {
      const dir = mh >= 0 ? "pos" : "neg";
      if (dir !== macdDir) return false;
    }
    return true;
  });
  if (similar.length < 6) return { ...NEUTRAL, sampleSize: similar.length };
  const wins = similar.filter(
    (r) => r.outcome === "target_hit" || typeof r.realized_pct === "number" && Number(r.realized_pct) > 0
  ).length;
  const winRate2 = wins / similar.length * 100;
  let confidenceDelta = 0;
  let label_ar = "";
  if (winRate2 >= 65) {
    confidenceDelta = Math.min(12, Math.round((winRate2 - 60) / 2.5));
    label_ar = `إعدادات مشابهة نجحت ${winRate2.toFixed(0)}% (${similar.length} حالة)`;
  } else if (winRate2 <= 35) {
    confidenceDelta = -8;
    label_ar = `إعدادات مشابهة فشلت تاريخياً (${winRate2.toFixed(0)}%)`;
  } else {
    label_ar = `أداء تاريخي محايد (${winRate2.toFixed(0)}%)`;
  }
  return { sampleSize: similar.length, winRate: winRate2, confidenceDelta, label_ar };
}
function extractNum(obj, keys) {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const found = extractNum(v, keys);
      if (found != null) return found;
    }
  }
  return null;
}
function cairoTodayISO() {
  return (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
}
async function getSymbolsBoughtToday(symbols) {
  if (!symbols.length) return /* @__PURE__ */ new Set();
  const today = cairoTodayISO();
  const { data } = await supabaseAdmin.from("recommendations").select("symbol").in("symbol", symbols).in("signal", ["buy", "strong_buy"]).gte("created_at", `${today}T00:00:00.000Z`).lt("created_at", `${today}T23:59:59.999Z`);
  return new Set((data ?? []).map((r) => r.symbol));
}
const AI_DELAY_MS = 250;
const FAST_AI_MAX = 20;
const FAST_ENSEMBLE_MAX = 0;
const FAST_VERIFIER_MAX = 0;
const BULK_MARKET_TIMEOUT_MS = 6e4;
const AI_ANALYSIS_TIMEOUT_MS = 12e3;
const AI_ENSEMBLE_TIMEOUT_MS = 7e3;
const AI_VERIFIER_TIMEOUT_MS = 7e3;
const DB_STEP_TIMEOUT_MS = 3e3;
const AUTO_MODULES_TIMEOUT_MS = 2e3;
function withTimeout(promise, ms, label) {
  let timeout;
  const timer = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`${label} بعد ${Math.round(ms / 1e3)} ثانية`)), ms);
  });
  return Promise.race([promise, timer]).finally(() => clearTimeout(timeout));
}
async function createPendingScan() {
  const { data, error } = await supabaseAdmin.from("scans").insert({ status: "running" }).select("id").single();
  if (error || !data) throw new Error(`scan insert failed: ${error?.message}`);
  return data.id;
}
async function runScanForId(scanId) {
  resetClusterTracking();
  const isScanStillRunning = async () => {
    const { data } = await supabaseAdmin.from("scans").select("status").eq("id", scanId).maybeSingle();
    return data?.status === "running";
  };
  const { data: stocksRaw, error: stocksErr } = await supabaseAdmin.from("stocks").select("symbol, name_ar, yahoo_symbol, sector_ar").eq("is_active", true).eq("is_sharia", true);
  if (stocksErr || !stocksRaw) {
    await supabaseAdmin.from("scans").update({ status: "failed", error_message: stocksErr?.message ?? "no stocks" }).eq("id", scanId);
    throw new Error(stocksErr?.message ?? "no stocks");
  }
  const { isBlocked } = await import("./blocklist-BkSBV-pn.mjs");
  const stocks = stocksRaw.filter((s) => !isBlocked(s.symbol));
  await supabaseAdmin.from("scans").update({ stocks_count: stocks.length, ai_count: 0 }).eq("id", scanId);
  const { data: cachedRows } = await supabaseAdmin.from("stock_snapshots").select("*").order("ts", { ascending: false }).limit(1e3);
  const cachedBySymbol = /* @__PURE__ */ new Map();
  for (const row of cachedRows ?? []) {
    if (!cachedBySymbol.has(row.symbol)) cachedBySymbol.set(row.symbol, row);
  }
  const { data: liveRows } = await supabaseAdmin.from("live_ticks").select("symbol, price, volume, ts, source").in("symbol", stocks.map((s) => s.symbol)).order("ts", { ascending: false }).limit(500);
  const liveBySymbol = /* @__PURE__ */ new Map();
  for (const row of liveRows ?? []) {
    const key = row.symbol.toUpperCase();
    if (!liveBySymbol.has(key) && Number(row.price) > 0) liveBySymbol.set(key, row);
  }
  const computed = [];
  let primaryProvider = "tradingview";
  let fetchedCount = 0;
  let cachedCount = 0;
  const dataErrors = [];
  const saveErrors = [];
  const aiErrors = [];
  const warnings = [];
  let tvData = /* @__PURE__ */ new Map();
  let historyData = /* @__PURE__ */ new Map();
  let market = null;
  const [tvRes, histRes, marketRes, perfRes, fundRes, macroRes] = await Promise.allSettled([
    withTimeout(fetchEgxSnapshots(stocks.map((s) => s.symbol)), BULK_MARKET_TIMEOUT_MS, "انتهت مهلة TradingView"),
    withTimeout(fetchHistoryBulk(stocks, 90, 24), BULK_MARKET_TIMEOUT_MS, "انتهت مهلة Yahoo"),
    withTimeout(fetchMarketSnapshot(), BULK_MARKET_TIMEOUT_MS, "انتهت مهلة مؤشر السوق"),
    withTimeout(getRecentPerformance(40), DB_STEP_TIMEOUT_MS, "انتهت مهلة أداء التوصيات"),
    withTimeout(fetchFundamentals(stocks.map((s) => s.symbol)), BULK_MARKET_TIMEOUT_MS, "انتهت مهلة الأساسيات"),
    withTimeout(fetchMacroSnapshot(), BULK_MARKET_TIMEOUT_MS, "انتهت مهلة بيانات الاقتصاد")
  ]);
  if (tvRes.status === "fulfilled") tvData = tvRes.value;
  else dataErrors.push(`TradingView bulk fetch failed: ${tvRes.reason instanceof Error ? tvRes.reason.message : String(tvRes.reason)}`);
  if (histRes.status === "fulfilled") historyData = histRes.value;
  else warnings.push(`فشل جلب التاريخ من Yahoo: ${histRes.reason instanceof Error ? histRes.reason.message : String(histRes.reason)}`);
  if (marketRes.status === "fulfilled") market = marketRes.value;
  const performance = perfRes.status === "fulfilled" ? perfRes.value : null;
  const fundamentalsMap = fundRes.status === "fulfilled" ? fundRes.value : /* @__PURE__ */ new Map();
  const macroSnap = macroRes.status === "fulfilled" ? macroRes.value : null;
  let activeFailures = /* @__PURE__ */ new Set();
  try {
    activeFailures = await getActiveFailurePatterns();
  } catch {
  }
  const kellyInput = performance && performance.total >= 10 ? {
    winRate: performance.winRate / 100,
    avgWinPct: Math.max(0.1, performance.avgWin),
    avgLossPct: Math.max(0.1, Math.abs(performance.avgLoss))
  } : null;
  const kellyMult = kellyMultiplier(kellyInput);
  const acceptedPicks = [];
  const acceptedSectors = [];
  if (fundamentalsMap.size > 0) {
    try {
      await saveFundamentals(fundamentalsMap);
    } catch {
    }
  }
  if (macroSnap) {
    try {
      await saveMacro(macroSnap);
    } catch {
    }
  }
  const sectorCtx = computeSectorMomentum(stocks, historyData);
  const regime = detectRegime(market, historyData.get("EGX30"));
  const [calibration, symbolMemory, reliability, metaWeights, drift, isotonic] = await Promise.all([
    loadCalibration().catch(() => ({ buckets: [], fitted: false, sampleSize: 0 })),
    loadSymbolMemory().catch(() => /* @__PURE__ */ new Map()),
    loadReliability().catch(() => ({ pairs: [], brier: 0, fitted: false, sampleSize: 0 })),
    trainMetaLearner().catch(() => ({ w: [0.25, 0.15, 0.2, 0.15, 0.25], b: 0, fitted: false, sampleSize: 0, accuracy: 0 })),
    detectDrift().catch(() => ({ recentWinRate: 0, baselineWinRate: 0, delta: 0, drift: "none", confidencePenalty: 0, label_ar: "", recentN: 0, baselineN: 0 })),
    loadIsotonicCalibration().catch(() => ({ fitted: false, sampleSize: 0, bins: [] }))
  ]);
  autoLabelUncertain().catch(() => ({ labeled: 0, skipped: 0 }));
  autoDisablePatterns().catch(() => ({ disabled: 0, reenabled: 0 }));
  let activeMeta = metaWeights;
  try {
    const regimeMeta = await trainRegimeSpecificMeta(regime.regime);
    if (regimeMeta.active.fitted) activeMeta = regimeMeta.active;
  } catch {
  }
  try {
    activeMeta = await optimizeWeightsGA(activeMeta);
  } catch {
  }
  if (drift.drift !== "none") {
    warnings.push(drift.label_ar);
  }
  const rotation = detectSectorRotation(sectorCtx);
  const breadth = computeMarketBreadth(historyData);
  const crossAssetGlobal = computeCrossAsset(macroSnap);
  if (market) {
    await supabaseAdmin.from("market_snapshots").upsert(
      {
        index_symbol: market.index_symbol,
        date: market.date,
        close: market.close,
        change_pct: market.change_pct,
        change_5d_pct: market.change_5d_pct,
        rsi14: market.rsi14,
        ema20: market.ema20,
        trend: market.trend
      },
      { onConflict: "index_symbol,date" }
    );
  }
  if (historyData.size > 0) {
    const candleRows = [];
    for (const [sym, candles] of historyData.entries()) {
      for (const c of candles) {
        candleRows.push({
          symbol: sym,
          date: c.date.slice(0, 10),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: Math.round(c.volume)
        });
      }
    }
    if (candleRows.length > 0) {
      const CHUNK = 500;
      for (let i = 0; i < candleRows.length; i += CHUNK) {
        await supabaseAdmin.from("daily_candles").upsert(candleRows.slice(i, i + CHUNK), { onConflict: "symbol,date" });
      }
    }
  }
  for (const s of stocks) {
    const tv = tvData.get(s.symbol.toUpperCase());
    const candles = historyData.get(s.symbol.toUpperCase());
    if (tv) {
      let ind;
      if (candles && candles.length >= 50) {
        try {
          const local = computeIndicators(candles);
          ind = { ...local, close: tv.close, prevClose: local.close, changePct: tv.change_pct };
        } catch {
          ind = indicatorsFromTv(tv);
        }
      } else {
        ind = indicatorsFromTv(tv);
      }
      const score = computeScore(ind);
      const suggested = suggestLevels(ind);
      const ts = (/* @__PURE__ */ new Date()).toISOString();
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
          data_provider: "tradingview"
        }
      });
      fetchedCount++;
      continue;
    }
    if (candles && candles.length >= 50) {
      try {
        const ind = computeIndicators(candles);
        const suggested = suggestLevels(ind);
        const last = candles[candles.length - 1];
        const ts = (/* @__PURE__ */ new Date(`${last.date.slice(0, 10)}T12:00:00.000Z`)).toISOString();
        computed.push({
          symbol: s.symbol,
          nameAr: s.name_ar,
          ts,
          indicators: ind,
          suggested,
          score: computeScore(ind),
          provider: "yahoo-history",
          snapshot: snapshotFromCandles(scanId, s.symbol, candles, ind, ts)
        });
        cachedCount++;
        warnings.push(`${s.symbol}: غير متاح من المصدر اللحظي؛ تم استخدام التاريخ اليومي الحقيقي.`);
        continue;
      } catch {
      }
    }
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
        snapshot: snapshotFromCached(scanId, cached, provider, ind, live)
      });
      cachedCount++;
      warnings.push(`${s.symbol}: غير متاح من المصدر الأساسي؛ تم استخدام بيانات محفوظة/لحظية حقيقية.`);
      continue;
    }
    dataErrors.push(`${s.symbol}: لا توجد بيانات حقيقية متاحة (غير موجود في TradingView ولا في الكاش).`);
  }
  if (computed.length === 0) {
    const errorMessage2 = summarizeFailures("فشل جلب بيانات الأسهم من TradingView ولا توجد بيانات محفوظة بديلة", dataErrors);
    await supabaseAdmin.from("scans").update({
      status: "failed",
      finished_at: (/* @__PURE__ */ new Date()).toISOString(),
      error_message: errorMessage2,
      stocks_count: 0,
      ai_count: 0
    }).eq("id", scanId);
    throw new Error(errorMessage2);
  }
  if (computed.length > 0) {
    const snapshots = computed.map((c) => c.snapshot);
    const { error: snapErr } = await supabaseAdmin.from("stock_snapshots").insert(snapshots);
    if (snapErr) {
      const errorMessage2 = `فشل حفظ بيانات الأسهم في قاعدة البيانات: ${snapErr.message}`;
      saveErrors.push(errorMessage2);
      console.error("snapshot insert:", snapErr.message);
      await supabaseAdmin.from("scans").update({ status: "failed", finished_at: (/* @__PURE__ */ new Date()).toISOString(), error_message: errorMessage2 }).eq("id", scanId);
      throw new Error(errorMessage2);
    }
  }
  await supabaseAdmin.from("scans").update({ stocks_count: computed.length, ai_count: 0 }).eq("id", scanId);
  const sorted = [...computed].sort((a, b) => b.score - a.score);
  let aiCount = 0;
  const buildFallbackRecommendation = (c, fallbackIndex) => {
    const ind = c.indicators;
    const atr = ind.atr14 && ind.atr14 > 0 ? ind.atr14 : Math.max(ind.close * 0.018, 0.01);
    const swingPct = ind.close > 0 ? atr / ind.close * 100 : 1;
    const volRatio = ind.volRatio ?? 1;
    const rsi = ind.rsi14 ?? 50;
    const trendOk = !!(ind.ema9 && ind.ema21 && ind.ema9 >= ind.ema21);
    const momentumOk = ind.macd == null || ind.macdSignal == null ? true : ind.macd >= ind.macdSignal;
    const marketBearish = market?.trend === "down";
    const atrInWindow = swingPct >= 1.5 && swingPct <= 5;
    const strong = !marketBearish && atrInWindow && c.score >= 75 && volRatio >= 1.4 && trendOk && momentumOk && rsi <= 68;
    const rankedFallbackBuy = !marketBearish && atrInWindow && fallbackIndex < 2 && c.score >= 72 && volRatio >= 1.3 && trendOk && momentumOk && rsi <= 68;
    const targetPct = strong ? Math.min(5, Math.max(1.8, swingPct * 0.75)) : Math.min(2.5, Math.max(1.1, swingPct * 0.6));
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
      volRatio >= 1.2 ? `حجم التداول أعلى من المتوسط ×${volRatio.toFixed(1)}` : `حركة يومية متوقعة ${swingPct.toFixed(1)}%`
    ];
    const fallbackSignal = (strong || rankedFallbackBuy) && confidence >= 78 ? "buy" : "neutral";
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
      raw_ai_response: { fallback: true, reason: "AI unavailable", swingPct, volRatio, rsi, trendOk, momentumOk }
    };
  };
  const newsTargets = sorted.slice(0, 15).map((c) => ({ symbol: c.symbol, nameAr: c.nameAr }));
  let newsMap = /* @__PURE__ */ new Map();
  try {
    if (process.env.FIRECRAWL_API_KEY) {
      newsMap = await fetchNewsBulk(newsTargets, 4);
    }
  } catch (e) {
    warnings.push(`فشل جلب الأخبار: ${e instanceof Error ? e.message : String(e)}`);
  }
  const weeklyBySymbol = /* @__PURE__ */ new Map();
  for (const c of computed) {
    const candles = historyData.get(c.symbol.toUpperCase());
    weeklyBySymbol.set(c.symbol.toUpperCase(), computeWeeklyContext(candles));
  }
  const symbolUppers = computed.map((c) => c.symbol.toUpperCase());
  const [sentVelMap, earnSurpMap] = await Promise.all([
    loadSentimentVelocity(symbolUppers).catch(() => /* @__PURE__ */ new Map()),
    loadEarningsSurprise(symbolUppers).catch(() => /* @__PURE__ */ new Map())
  ]);
  const [banditRes, abRes] = await Promise.all([
    runBandit().catch(() => null),
    runABTest().catch(() => null)
  ]);
  const marketCandles = historyData.get("EGX30");
  const aiSlice = sorted.slice(0, FAST_AI_MAX);
  for (const [index, c] of aiSlice.entries()) {
    if (!await isScanStillRunning()) {
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
        timeoutMs: AI_ANALYSIS_TIMEOUT_MS
      });
      const fundamentals = fundamentalsMap.get(c.symbol.toUpperCase()) ?? null;
      const fiveDim = computeFiveDimScores({
        ind: c.indicators,
        market,
        sector,
        news,
        fundamentals,
        macro: macroSnap
      });
      const gate = applyRuleGate(
        ai,
        c.indicators,
        market,
        weekly,
        sector,
        news,
        activeFailures,
        { technical: fiveDim.technical, sentiment: fiveDim.sentiment, sector: fiveDim.sector },
        null
      );
      let finalSignal = gate.signal;
      let rejectedByRules = gate.rejected;
      let rejectionReason = gate.reason;
      let verifierApproved = null;
      let verifierReason = null;
      let finalConfidence = Math.max(0, ai.confidence - gate.confidencePenalty);
      if (isEarningsBlackout(fundamentals) && (finalSignal === "buy" || finalSignal === "strong_buy")) {
        finalSignal = "neutral";
        rejectedByRules = true;
        rejectionReason = `(${rejectionReason ?? ""}) قرب موعد إعلان الأرباح — انتظر بعد الإعلان`.trim();
      }
      if (!fiveDim.passes && (finalSignal === "buy" || finalSignal === "strong_buy")) {
        finalSignal = "neutral";
        rejectedByRules = true;
        rejectionReason = `فشل التصفية متعددة الأبعاد: ${fiveDim.failures.join(" • ")}`;
      }
      const adv = computeAdvancedTechnical(historyData.get(c.symbol.toUpperCase()), c.indicators.close);
      if (adv.bullishScore < 35 && (finalSignal === "buy" || finalSignal === "strong_buy")) {
        if (finalSignal === "strong_buy") finalSignal = "buy";
        finalConfidence = Math.max(40, finalConfidence - 10);
      } else if (adv.bullishScore >= 70 && finalSignal === "buy") {
        finalConfidence = Math.min(95, finalConfidence + 4);
      }
      const anomalyReport = detectAnomalies(historyData.get(c.symbol.toUpperCase()), c.indicators);
      if ((finalSignal === "buy" || finalSignal === "strong_buy") && anomalyReport.anomalies.length > 0) {
        finalConfidence = Math.max(30, Math.min(95, finalConfidence + anomalyReport.netDelta));
        if (anomalyReport.netDelta <= -12) {
          if (finalSignal === "strong_buy") finalSignal = "buy";
          else {
            finalSignal = "neutral";
            rejectedByRules = true;
            rejectionReason = `حركة غير طبيعية سلبية: ${anomalyReport.anomalies.map((a) => a.description_ar).join(" • ")}`;
          }
        }
      }
      let ensembleAgreement = null;
      if (!rejectedByRules && index < FAST_ENSEMBLE_MAX && (finalSignal === "buy" || finalSignal === "strong_buy")) {
        try {
          const ens = await withTimeout(
            ensembleVote({
              symbol: c.symbol,
              nameAr: c.nameAr,
              ind: c.indicators,
              primary: ai,
              scores: fiveDim,
              scanId
            }),
            AI_ENSEMBLE_TIMEOUT_MS,
            `${c.symbol}: انتهت مهلة نموذج التأكيد`
          );
          ensembleAgreement = ens.agreementScore;
          finalSignal = ens.finalSignal;
          finalConfidence = ens.finalConfidence;
          if (ens.agreement === "conflict") {
            rejectedByRules = true;
            rejectionReason = `النموذجان غير متفقين: الأساسي=${ai.signal} والثاني=${ens.secondary?.vote}`;
          }
        } catch {
          finalConfidence = Math.max(40, finalConfidence - 8);
        }
      }
      const isTopBullish = !rejectedByRules && (finalSignal === "buy" || finalSignal === "strong_buy") && index < FAST_VERIFIER_MAX;
      if (isTopBullish) {
        try {
          const v = await withTimeout(
            verifyPick({
              symbol: c.symbol,
              nameAr: c.nameAr,
              signal: finalSignal,
              primaryConfidence: ai.confidence,
              ind: c.indicators,
              history: historyData.get(c.symbol.toUpperCase()),
              market,
              expectedNextDayPct: ai.expected_next_day_pct
            }),
            AI_VERIFIER_TIMEOUT_MS,
            `${c.symbol}: انتهت مهلة المحكّم`
          );
          verifierApproved = v.approved;
          verifierReason = v.reason_ar;
          if (!v.approved) {
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
          verifierReason = `فشل المحكّم: ${e instanceof Error ? e.message : String(e)}`;
        }
      }
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
      const lvl = canonicalLevels(c.indicators);
      const useCanonical = lvl.source === "atr" && (finalSignal === "buy" || finalSignal === "strong_buy");
      const finalEntryMin = useCanonical ? lvl.entryMin : ai.entry_min;
      const finalEntryMax = useCanonical ? lvl.entryMax : ai.entry_max;
      const finalTarget = useCanonical ? lvl.target : ai.target;
      const finalStop = useCanonical ? lvl.stopLoss : ai.stop_loss;
      const finalRr = useCanonical ? lvl.rrRatio : finalStop > 0 && c.indicators.close > finalStop ? +((finalTarget - c.indicators.close) / (c.indicators.close - finalStop)).toFixed(2) : rrRatio;
      const stopDistPct = c.indicators.close > 0 ? (c.indicators.close - finalStop) / c.indicators.close * 100 : 2;
      const corr = correlationMultiplier({
        candidate: historyData.get(c.symbol.toUpperCase()),
        accepted: acceptedPicks
      });
      const riskMult = combinedRiskMultiplier({ kelly: kellyMult, correlation: corr.multiplier });
      const positionPct = finalSignal === "buy" || finalSignal === "strong_buy" ? (() => {
        const risk2 = 1;
        if (stopDistPct <= 0) return 1;
        const base = risk2 / (stopDistPct / 100);
        const scaler = Math.min(1.5, Math.max(0.5, finalConfidence / 70));
        return +Math.min(10, Math.max(0.5, base * scaler * riskMult)).toFixed(2);
      })() : 0.5;
      if (finalSignal === "buy" || finalSignal === "strong_buy") {
        acceptedPicks.push({ symbol: c.symbol, candles: historyData.get(c.symbol.toUpperCase()) });
        acceptedSectors.push({
          symbol: c.symbol,
          sector: stocks.find((s) => s.symbol.toUpperCase() === c.symbol.toUpperCase())?.sector_ar ?? null,
          confidence: finalConfidence
        });
      }
      if (finalSignal === "buy" || finalSignal === "strong_buy") {
        finalConfidence = Math.round(
          Math.max(30, Math.min(95, finalConfidence * regime.confidence_multiplier))
        );
      }
      const mc = finalSignal === "buy" || finalSignal === "strong_buy" ? monteCarloProject({
        candles: historyData.get(c.symbol.toUpperCase()),
        currentPrice: c.indicators.close,
        target: finalTarget,
        stopLoss: finalStop,
        horizonDays: ai.timeframe_days ?? 30
      }) : null;
      if (mc && mc.prob_profit < 35 && (finalSignal === "buy" || finalSignal === "strong_buy")) {
        if (finalSignal === "strong_buy") finalSignal = "buy";
        finalConfidence = Math.max(35, finalConfidence - 10);
      }
      const confluence = computeConfluence(c.indicators, weekly, market);
      if (finalSignal === "buy" || finalSignal === "strong_buy") {
        if (confluence.aligned && confluence.bullishVotes >= 2) {
          finalConfidence = Math.min(95, finalConfidence + 6);
        } else if (confluence.conflict) {
          finalConfidence = Math.max(35, finalConfidence - 8);
        }
      }
      const vpd = detectVPD(historyData.get(c.symbol.toUpperCase()));
      if (vpd.detected && vpd.type === "bearish_divergence" && (finalSignal === "buy" || finalSignal === "strong_buy")) {
        if (finalSignal === "strong_buy") finalSignal = "buy";
        finalConfidence = Math.max(35, finalConfidence - Math.min(12, Math.round(vpd.strength / 8)));
      }
      const sectorName = sector?.sector ?? null;
      const rotationDelta = sectorName ? rotation.sectorBoost.get(sectorName) ?? 0 : 0;
      if (rotationDelta !== 0 && (finalSignal === "buy" || finalSignal === "strong_buy")) {
        finalConfidence = Math.max(30, Math.min(95, finalConfidence + rotationDelta));
      }
      const mem = symbolMemory.get(c.symbol);
      if (mem && (finalSignal === "buy" || finalSignal === "strong_buy")) {
        finalConfidence = Math.max(30, Math.min(95, finalConfidence + mem.confidenceDelta));
      }
      const liquidity = assessLiquidity(c.indicators);
      const disagreement = computeDisagreement({
        technical: fiveDim.technical,
        fundamental: fiveDim.fundamental,
        sentiment: fiveDim.sentiment,
        macro: fiveDim.macro,
        sector: fiveDim.sector
      });
      const contrarian = detectContrarian({
        ind: c.indicators,
        news,
        ensembleAgreement,
        changePct5d: market?.change_5d_pct ?? void 0
      });
      const crossAsset = computeCrossAsset(macroSnap, historyData.get(c.symbol.toUpperCase()));
      if (finalSignal === "buy" || finalSignal === "strong_buy") {
        finalConfidence = Math.max(
          30,
          Math.min(
            95,
            finalConfidence + liquidity.confidenceDelta + disagreement.confidenceDelta + contrarian.confidenceDelta + breadth.confidenceDelta + crossAsset.confidenceDelta
          )
        );
        if (liquidity.tier === "illiquid") {
          finalSignal = "neutral";
          rejectedByRules = true;
          rejectionReason = (rejectionReason ? rejectionReason + " • " : "") + "سيولة غير كافية للتنفيذ";
        }
      }
      const candlesForSym = historyData.get(c.symbol.toUpperCase());
      const blockTrade = detectBlockTrade(c.indicators, candlesForSym);
      const anomalyAlert = detectAnomalyAlert(c.indicators, candlesForSym, news ?? void 0);
      const sentVel = sentVelMap.get(c.symbol.toUpperCase()) ?? {
        velocity: 0,
        trend: "stable",
        label_ar: "",
        confidenceDelta: 0,
        sampleSize: 0,
        symbol: c.symbol
      };
      const earnSurp = earnSurpMap.get(c.symbol.toUpperCase()) ?? {
        streak: 0,
        label_ar: "",
        confidenceDelta: 0,
        symbol: c.symbol
      };
      const horizons = multiHorizonForecast(c.indicators, candlesForSym);
      const atrSuggested = atrLevels(c.indicators.close, c.indicators);
      const relStrength = computeRelativeStrength(candlesForSym, marketCandles);
      const seasonality = detectSeasonality(candlesForSym);
      const seqForecast = sequenceForecast(candlesForSym);
      const stacking = stackingEnsemble(fiveDim);
      if (finalSignal === "buy" || finalSignal === "strong_buy") {
        finalConfidence = Math.max(
          30,
          Math.min(
            95,
            finalConfidence + blockTrade.confidenceDelta + anomalyAlert.confidenceDelta + sentVel.confidenceDelta + earnSurp.confidenceDelta + relStrength.confidenceDelta + seasonality.confidenceDelta + seqForecast.confidenceDelta + stacking.confidenceDelta
          )
        );
      }
      const rawConfidence = Math.round(finalConfidence);
      const calibratedConfidence = calibrateConfidence(rawConfidence, calibration);
      const metaProb = metaPredict(
        {
          technical: fiveDim.technical,
          fundamental: fiveDim.fundamental,
          sentiment: fiveDim.sentiment,
          macro: fiveDim.macro,
          sector: fiveDim.sector
        },
        activeMeta
      );
      const blended = activeMeta.fitted ? Math.round(calibratedConfidence * 0.6 + metaProb * 0.4) : calibratedConfidence;
      const probTrue = calibrateProbability(blended, reliability);
      const bayesianRes = bayesianUpdate(blended, [
        { label: "stacking", probability: stacking.stackedProb, reliability: 0.5 },
        { label: "sequence", probability: seqForecast.direction === "up" ? 65 : seqForecast.direction === "down" ? 35 : 50, reliability: 0.4 },
        { label: "relative_strength", probability: relStrength.isLeader ? 65 : relStrength.isLaggard ? 35 : 50, reliability: 0.45 },
        { label: "seasonality", probability: seasonality.bias === "bullish" ? 60 : seasonality.bias === "bearish" ? 40 : 50, reliability: 0.25 }
      ]);
      const ci = wilsonCI(probTrue, Math.max(20, activeMeta.sampleSize));
      finalConfidence = Math.max(30, Math.min(95, bayesianRes.posteriorPct - drift.confidencePenalty));
      let setupBoost = 0;
      let setupLabel = "";
      let setupWinRate = 0;
      let setupSampleSize = 0;
      let llmVerdict = "neutral";
      let llmReason = "";
      try {
        if (index < FAST_VERIFIER_MAX && (finalSignal === "buy" || finalSignal === "strong_buy")) {
          const sim = await similarSetupBoost({
            signal: finalSignal,
            rsi: c.indicators.rsi14,
            macdHist: c.indicators.macdHist
          });
          setupBoost = sim.confidenceDelta;
          setupLabel = sim.label_ar;
          setupWinRate = sim.winRate;
          setupSampleSize = sim.sampleSize;
          finalConfidence = Math.max(30, Math.min(95, finalConfidence + setupBoost));
        }
      } catch {
      }
      try {
        if (finalSignal === "buy" || finalSignal === "strong_buy") {
          const verdict = await withTimeout(
            sanityCheck({
              symbol: c.symbol,
              signal: finalSignal,
              confidence: finalConfidence,
              regime: regime.regime,
              signals: [
                { name: "technical", value: Number(fiveDim.technical ?? 50), confidence: 0.7 },
                { name: "fundamental", value: Number(fiveDim.fundamental ?? 50), confidence: 0.6 },
                { name: "sentiment", value: Number(fiveDim.sentiment ?? 50), confidence: 0.5 },
                { name: "macro", value: Number(fiveDim.macro ?? 50), confidence: 0.6 },
                { name: "sector", value: Number(fiveDim.sector ?? 50), confidence: 0.5 }
              ]
            }),
            AI_VERIFIER_TIMEOUT_MS,
            `${c.symbol}: انتهت مهلة فحص سلامة LLM`
          );
          llmVerdict = verdict.verdict;
          llmReason = verdict.reason;
          finalConfidence = Math.max(30, Math.min(95, finalConfidence * verdict.multiplier));
        }
      } catch {
      }
      const preIsotonic = Math.round(finalConfidence);
      finalConfidence = applyIsotonic(preIsotonic, isotonic);
      try {
        const mt = market?.trend;
        if ((finalSignal === "buy" || finalSignal === "strong_buy") && (mt === "up" || mt === "strong_up")) {
          finalConfidence = Math.min(95, finalConfidence + 3);
        }
      } catch {
      }
      try {
        const auto = await withTimeout(
          runAutoModules({
            symbol: c.symbol,
            indicators: c.indicators,
            candles: historyData.get(c.symbol.toUpperCase()),
            baseConfidence: finalConfidence,
            signal: finalSignal,
            sector: stocks.find((s) => s.symbol.toUpperCase() === c.symbol.toUpperCase())?.sector_ar ?? null
          }),
          AUTO_MODULES_TIMEOUT_MS,
          `${c.symbol}: انتهت مهلة التحليل الداخلي`
        );
        if (finalSignal === "buy" || finalSignal === "strong_buy" || finalSignal === "sell") {
          finalConfidence = Math.max(30, Math.min(95, auto.adjustedConfidence));
        }
      } catch {
      }
      try {
        if (finalSignal === "buy" || finalSignal === "strong_buy") {
          const candidateSector = stocks.find((s) => s.symbol.toUpperCase() === c.symbol.toUpperCase())?.sector_ar ?? null;
          const penalty = portfolioCorrelationPenalty(
            { sector: candidateSector },
            acceptedSectors,
            2
          );
          if (penalty < 1) {
            finalConfidence = Math.max(30, Math.min(95, finalConfidence * penalty));
          }
        }
      } catch {
      }
      const trailingPlan = finalSignal === "buy" || finalSignal === "strong_buy" ? buildTrailingStop(c.indicators.close, c.indicators) : null;
      const cappedPositionPct = +Math.min(
        positionPct * ci.sizeMultiplier,
        liquidity.positionCapPct
      ).toFixed(2);
      const topFactors = buildExplainability({
        ind: c.indicators,
        fiveDim,
        ensembleAgreement,
        regimeMult: regime.confidence_multiplier,
        monteCarloProbProfit: mc?.prob_profit ?? null
      });
      if (finalSignal === "buy" || finalSignal === "strong_buy") {
        const dupSet = await withTimeout(
          getSymbolsBoughtToday([c.symbol]),
          DB_STEP_TIMEOUT_MS,
          `${c.symbol}: انتهت مهلة فحص التكرار`
        ).catch(() => /* @__PURE__ */ new Set());
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
        expected_gain_pct: +((finalTarget - (finalEntryMin + finalEntryMax) / 2) / ((finalEntryMin + finalEntryMax) / 2) * 100).toFixed(2),
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
            laggards: rotation.laggards
          },
          symbol_memory: mem ?? null,
          calibration: {
            raw_confidence: rawConfidence,
            calibrated_confidence: calibratedConfidence,
            fitted: calibration.fitted,
            sample_size: calibration.sampleSize
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
                sector: fiveDim.sector
              },
              activeMeta
            )
          },
          probability: {
            true_probability_pct: probTrue,
            brier_score: reliability.brier,
            reliability_fitted: reliability.fitted,
            reliability_sample_size: reliability.sampleSize
          },
          drift,
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
            atr_levels: atrSuggested
          },
          advanced: {
            relative_strength: relStrength,
            seasonality,
            sequence_forecast: seqForecast,
            stacking_ensemble: stacking,
            bayesian_update: bayesianRes,
            bandit: banditRes,
            ab_test: abRes
          },
          intelligence_boost: {
            similar_setup: {
              win_rate: setupWinRate,
              sample_size: setupSampleSize,
              confidence_delta: setupBoost,
              label_ar: setupLabel
            },
            llm_sanity: {
              verdict: llmVerdict,
              reason: llmReason
            },
            isotonic: {
              pre: preIsotonic,
              post: Math.round(finalConfidence),
              fitted: isotonic.fitted,
              sample_size: isotonic.sampleSize
            }
          }
        }
      }).select("id").maybeSingle()), DB_STEP_TIMEOUT_MS, `${c.symbol}: انتهت مهلة حفظ التوصية`);
      if (recoInserted?.id) {
        try {
          await supabaseAdmin.from("ensemble_votes").update({ recommendation_id: recoInserted.id }).eq("scan_id", scanId).eq("symbol", c.symbol).is("recommendation_id", null);
        } catch (linkErr) {
          console.warn(`[ensemble-link] ${c.symbol}:`, linkErr instanceof Error ? linkErr.message : linkErr);
        }
      }
      if (recoErr) {
        const msg = `${c.symbol}: فشل حفظ توصية AI: ${recoErr.message}`;
        aiErrors.push(msg);
        console.error("reco insert:", recoErr.message);
      } else aiCount++;
    } catch (e) {
      const msg = `${c.symbol}: ${e instanceof Error ? e.message : String(e)}`;
      console.warn(`AI fallback ${c.symbol}:`, e instanceof Error ? e.message : e);
      let fallbackSaved = false;
      try {
        if (c.indicators.close > 0) {
          const fallbackRow = buildFallbackRecommendation(c, aiCount);
          const { error: fbErr } = await withTimeout(
            Promise.resolve(supabaseAdmin.from("recommendations").insert(fallbackRow)),
            DB_STEP_TIMEOUT_MS,
            `${c.symbol}: انتهت مهلة حفظ التوصية الاحتياطية`
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
    await withTimeout(
      Promise.resolve(supabaseAdmin.from("scans").update({ ai_count: aiCount }).eq("id", scanId)),
      DB_STEP_TIMEOUT_MS,
      `${c.symbol}: انتهت مهلة تحديث تقدم المسح`
    ).catch(() => void 0);
  }
  const quickCandidates = sorted.slice(aiSlice.length, 24).filter((c) => c.indicators.close > 0).filter((c) => market?.trend !== "down").filter((c) => (c.indicators.rsi14 ?? 50) <= 68).filter((c) => (c.indicators.volRatio ?? 1) >= 1.3).filter((c) => {
    const atr = c.indicators.atr14;
    if (atr == null || c.indicators.close <= 0) return false;
    const pct = atr / c.indicators.close * 100;
    return pct >= 1.5 && pct <= 5;
  }).filter((c) => c.score >= 72);
  const quickDupSet = await getSymbolsBoughtToday(quickCandidates.map((c) => c.symbol));
  const quickFallbackRows = quickCandidates.filter((c) => !quickDupSet.has(c.symbol)).map((c, i) => buildFallbackRecommendation(c, aiCount + i + 1)).filter((r) => r.signal === "buy");
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
    const zeroAiCandidates = sorted.filter((c) => c.indicators.close > 0).filter((c) => market?.trend !== "down").filter((c) => (c.indicators.rsi14 ?? 50) <= 68).filter((c) => (c.indicators.volRatio ?? 1) >= 1.3).filter((c) => {
      const atr = c.indicators.atr14;
      if (atr == null || c.indicators.close <= 0) return false;
      const pct = atr / c.indicators.close * 100;
      return pct >= 1.5 && pct <= 5;
    }).filter((c) => c.score >= 72).slice(0, 6);
    const zeroDupSet = await getSymbolsBoughtToday(zeroAiCandidates.map((c) => c.symbol));
    const fallbackRows = zeroAiCandidates.filter((c) => !zeroDupSet.has(c.symbol)).map((c, i) => buildFallbackRecommendation(c, i)).filter((r) => r.signal === "buy").slice(0, 3);
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
  const errorMessage = allErrors.length > 0 || warnings.length > 0 ? summarizeFailures("اكتمل المسح مع تنبيهات", [...warnings, ...allErrors]) : null;
  try {
    const { data: scanRecs } = await supabaseAdmin.from("recommendations").select("id, symbol, signal, confidence, rejected_by_rules, rejection_reason").eq("scan_id", scanId).in("signal", ["buy", "strong_buy"]);
    if (scanRecs && scanRecs.length > 0) {
      const sectorBySymbol = new Map(stocks.map((s) => [s.symbol.toUpperCase(), s.sector_ar ?? null]));
      const picks = scanRecs.map((r) => ({
        id: r.id,
        symbol: r.symbol,
        sector: sectorBySymbol.get(r.symbol.toUpperCase()) ?? null,
        signal: r.signal,
        confidence: r.confidence,
        rejected_by_rules: r.rejected_by_rules,
        rejection_reason: r.rejection_reason
      }));
      const { picks: filtered, demoted } = applyPortfolioFilter(picks);
      for (const p of filtered) {
        if (p.rejected_by_rules && p.signal === "neutral" && p.rejection_reason?.includes("تنويع المحفظة")) {
          await supabaseAdmin.from("recommendations").update({
            signal: "neutral",
            rejected_by_rules: true,
            rejection_reason: p.rejection_reason
          }).eq("id", p.id);
        }
      }
      if (demoted > 0) warnings.push(`تنويع المحفظة: تم تأجيل ${demoted} توصية لتجنب تركز قطاعي`);
    }
  } catch (e) {
    warnings.push(`فشل فلتر تنويع المحفظة: ${e instanceof Error ? e.message : String(e)}`);
  }
  await supabaseAdmin.from("scans").update({
    status: "completed",
    finished_at: (/* @__PURE__ */ new Date()).toISOString(),
    source_provider: primaryProvider,
    stocks_count: computed.length,
    ai_count: aiCount,
    error_message: errorMessage
  }).eq("id", scanId);
  return {
    scanId,
    stocks: computed.length,
    ai: aiCount,
    fetched: fetchedCount,
    cached: cachedCount,
    errors: allErrors,
    warnings
  };
}
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function indicatorsFromTv(tv) {
  const prevClose = tv.close - tv.change_abs;
  const volAvg = tv.volAvg20 ?? 0;
  const volRatio = volAvg > 0 ? tv.volume / volAvg : 0;
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
    patterns: []
  };
}
function num(value, fallback = 0) {
  const n2 = Number(value);
  return Number.isFinite(n2) ? n2 : fallback;
}
function nullableNum(value) {
  if (value == null) return null;
  const n2 = Number(value);
  return Number.isFinite(n2) ? n2 : null;
}
function normalizePatterns(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const p = item;
    return [{
      name: String(p.name ?? "pattern"),
      name_ar: String(p.name_ar ?? "نمط فني"),
      bullish: Boolean(p.bullish)
    }];
  });
}
function indicatorsFromSnapshot(row) {
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
    patterns: normalizePatterns(row.patterns)
  };
}
function indicatorsWithLiveTick(base, live) {
  const close = num(live.price, base.close);
  const prevClose = base.prevClose > 0 ? base.prevClose : base.close;
  const volume = live.volume ?? 0;
  const volRatio = base.volAvg20 > 0 && volume > 0 ? +(volume / base.volAvg20).toFixed(2) : base.volRatio;
  return {
    ...base,
    close,
    prevClose,
    changePct: prevClose > 0 ? +((close - prevClose) / prevClose * 100).toFixed(2) : base.changePct,
    volRatio,
    support: Math.min(base.support, close),
    resistance: Math.max(base.resistance, close),
    priorHigh20: Math.max(base.priorHigh20, close)
  };
}
function snapshotFromCached(scanId, row, provider, ind = indicatorsFromSnapshot(row), live) {
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
    data_provider: provider
  };
}
function snapshotFromCandles(scanId, symbol, candles, ind, ts) {
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
    data_provider: "yahoo-history"
  };
}
function summarizeFailures(prefix, lines) {
  const cleaned = lines.map((line) => line.replace(/\s+/g, " ").trim());
  const sample = cleaned.slice(0, 8).join(" | ");
  const suffix = cleaned.length > 8 ? ` | +${cleaned.length - 8} أخرى` : "";
  return `${prefix}${sample ? `: ${sample}${suffix}` : ""}`;
}
export {
  runAdaptiveLearning as a,
  computeMarketBreadth$1 as b,
  createPendingScan as c,
  fetchMacroSnapshot as d,
  fetchFundamentals as e,
  fetchMarketSnapshot as f,
  saveFundamentals as g,
  fetchHistoryBulk as h,
  runScanForId as r,
  saveMacro as s
};
