import { generateText } from "ai";
import { z } from "zod";
import { getAiGateway, getAiProviderPlan } from "./gateway.server";
import type { Indicators } from "../analysis/indicators.server";
import type { MarketSnapshot } from "../market-data/market-index.server";
import type { Candle } from "../market-data/types";
import type { HistoricalPerformance } from "../scan/historical-performance.server";
import type { WeeklyContext } from "../analysis/multi-timeframe.server";
import type { SectorStats } from "../analysis/sector-momentum.server";
import type { StockNews } from "../market-data/news.server";

const SignalEnum = z.enum(["strong_buy", "buy", "neutral", "sell", "strong_sell"]);

const AiSchema = z.object({
  signal: SignalEnum,
  confidence: z.coerce.number().min(0).max(100),
  reasons_ar: z.preprocess(
    (v) => {
      const flat = Array.isArray(v) ? v.flat(3) : [v];
      const strs = flat
        .map((x) => {
          if (x == null) return "";
          if (typeof x === "string") return x;
          if (typeof x === "number" || typeof x === "boolean") return String(x);
          try { return JSON.stringify(x); } catch { return ""; }
        })
        .flatMap((s) => s.split(/\r?\n|•|·/))
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      return strs.slice(0, 3);
    },
    z.array(z.string().min(1)).min(1).max(3),
  ),
  entry_min: z.coerce.number().positive(),
  entry_max: z.coerce.number().positive(),
  target: z.coerce.number().positive(),
  stop_loss: z.coerce.number().positive(),
  timeframe_days: z.coerce.number().int().min(1).max(5),
  risk_note_ar: z.string().min(5),
  entry_timing_ar: z.string().min(2).max(80),
  partial_exit_pct: z.coerce.number().min(0.5).max(20),
  max_hold_days: z.coerce.number().int().min(1).max(10),
  expected_next_day_pct: z.coerce.number().min(-15).max(15),
});

export type AiAnalysis = z.infer<typeof AiSchema>;

export async function analyzeStock(args: {
  symbol: string;
  nameAr: string;
  ind: Indicators;
  suggested: { entryMin: number; entryMax: number; target: number; stopLoss: number; rrRatio: number };
  history?: Candle[];
  market?: MarketSnapshot | null;
  performance?: HistoricalPerformance | null;
  weekly?: WeeklyContext | null;
  sector?: SectorStats | null;
  news?: StockNews | null;
  timeoutMs?: number;
}): Promise<AiAnalysis> {
  const { symbol, nameAr, ind, suggested, history, market, performance, weekly, sector, news, timeoutMs } = args;
  const providers = getAiProviderPlan({ allowPaidFallback: false });

  const compact = {
    price: ind.close,
    change_pct: +ind.changePct.toFixed(2),
    rsi14: ind.rsi14 != null ? +ind.rsi14.toFixed(2) : null,
    macd: ind.macd != null ? +ind.macd.toFixed(4) : null,
    macd_signal: ind.macdSignal != null ? +ind.macdSignal.toFixed(4) : null,
    macd_hist: ind.macdHist != null ? +ind.macdHist.toFixed(4) : null,
    ema9: ind.ema9, ema21: ind.ema21, sma50: ind.sma50,
    bb_upper: ind.bbUpper, bb_mid: ind.bbMid, bb_lower: ind.bbLower,
    atr14: ind.atr14,
    volume_ratio_vs_20d: +ind.volRatio.toFixed(2),
    support: ind.support, resistance: ind.resistance,
    patterns: ind.patterns.map((p) => p.name),
    suggested_levels: suggested,
  };

  // Build last-25-day OHLCV sequence so the AI can see real momentum/regime
  // (LSTM-style context, not a single snapshot).
  const series = (history ?? []).slice(-25).map((c) => ({
    d: c.date.slice(5, 10),
    o: +c.open.toFixed(2),
    h: +c.high.toFixed(2),
    l: +c.low.toFixed(2),
    c: +c.close.toFixed(2),
    v: c.volume,
  }));

  const marketCtx = market
    ? {
        egx30_trend: market.trend,
        egx30_change_pct: market.change_pct,
        egx30_change_5d_pct: market.change_5d_pct,
        egx30_rsi14: market.rsi14,
      }
    : { egx30_trend: "unknown" };

  const weeklyCtx = weekly && weekly.weeks >= 6
    ? {
        trend_w: weekly.trend,
        change_4w_pct: weekly.change_4w_pct,
        rsi14_w: weekly.rsi14_w != null ? +weekly.rsi14_w.toFixed(1) : null,
      }
    : null;

  const sectorCtx = sector
    ? {
        sector: sector.sector,
        sector_change_5d_pct: sector.change_5d_pct,
        sector_change_20d_pct: sector.change_20d_pct,
        sector_trend: sector.trend,
      }
    : null;

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
    "الحقول المطلوبة: signal, confidence, reasons_ar, entry_min, entry_max, target, stop_loss, timeframe_days, risk_note_ar, entry_timing_ar, partial_exit_pct, max_hold_days, expected_next_day_pct.",
  ].join("\n");

  const prompt = [
    `السهم: ${nameAr} (${symbol})`,
    "حالة السوق العام (EGX30):",
    JSON.stringify(marketCtx),
    weeklyCtx ? `الإطار الأسبوعي: ${JSON.stringify(weeklyCtx)}` : "",
    sectorCtx ? `سياق القطاع: ${JSON.stringify(sectorCtx)}` : "",
    news && news.found
      ? `أخبار آخر أسبوع (${news.sentiment_hint}): ${news.summary_ar}`
      : "",
    performance && performance.total >= 5
      ? `أداء آخر ${performance.total} توصية شراء: نجاح ${performance.winRate}% (${performance.profit} ربح / ${performance.loss} خسارة، ${performance.pending} معلّق)، متوسط الربح المحقق ${performance.avgWin}%، متوسط الخسارة ${performance.avgLoss}%. تعلّم من النتائج وكن أكثر تحفظاً إذا نسبة النجاح < 55%.`
      : "",
    series.length > 0 ? `سلسلة آخر ${series.length} جلسة (d=تاريخ، o/h/l/c=أسعار، v=حجم):` : "لا توجد سلسلة تاريخية متاحة.",
    series.length > 0 ? JSON.stringify(series) : "",
    "البيانات الفنية:",
    JSON.stringify(compact, null, 2),
    "أعد JSON فقط بهذا الشكل:",
    `{"signal":"buy","confidence":65,"reasons_ar":["..."],"entry_min":${ind.close},"entry_max":${ind.close},"target":${suggested.target},"stop_loss":${suggested.stopLoss},"timeframe_days":1,"risk_note_ar":"...","entry_timing_ar":"اليوم بعد تأكيد أول ساعة","partial_exit_pct":3,"max_hold_days":2,"expected_next_day_pct":1.2}`,
  ].filter(Boolean).join("\n");

  let lastErr: unknown;
  for (const p of providers) {
    try {
      const gateway = getAiGateway(p.provider);
      const { text } = await generateWithBackoff({
        model: gateway(p.model),
        system,
        prompt,
        temperature: 0.3,
        maxRetries: 0,
      }, 1, timeoutMs);
      const parsed = extractJson(text);
      return AiSchema.parse(parsed);
    } catch (e) {
      lastErr = e;
    }
  }

  // Free, deterministic analysis fallback: keeps every stock analyzable when
  // free AI providers hit rate limits/credits, without consuming paid credits
  // and without skipping the downstream quality gates.
  return buildFreeQuantAnalysis({ ind, suggested, history, market, weekly, sector, news, performance, lastErr });
}

function buildFreeQuantAnalysis(args: {
  ind: Indicators;
  suggested: { entryMin: number; entryMax: number; target: number; stopLoss: number; rrRatio: number };
  history?: Candle[];
  market?: MarketSnapshot | null;
  performance?: HistoricalPerformance | null;
  weekly?: WeeklyContext | null;
  sector?: SectorStats | null;
  news?: StockNews | null;
  lastErr?: unknown;
}): AiAnalysis {
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

  const signal: AiAnalysis["signal"] =
    score >= 78 && !marketBad && !negativeNews ? "strong_buy" :
    score >= 64 && !marketBad && !negativeNews ? "buy" :
    score <= 34 ? "sell" :
    "neutral";

  const atr = ind.atr14 && ind.atr14 > 0 ? ind.atr14 : Math.max(ind.close * 0.018, 0.01);
  const targetPct = signal === "strong_buy" ? 3.2 : signal === "buy" ? 2.2 : signal === "sell" ? 0.8 : 1.2;
  const expectedNext = signal === "strong_buy" ? Math.min(3.8, Math.max(1.5, (atr / ind.close) * 80)) :
    signal === "buy" ? Math.min(2.4, Math.max(0.6, (atr / ind.close) * 55)) :
    signal === "sell" ? -Math.min(2.2, Math.max(0.6, Math.abs(ind.changePct) * 0.5)) :
    Math.max(-0.4, Math.min(0.4, ind.changePct * 0.12));

  const reasons = [
    trendOk ? "الاتجاه القصير أعلى من المتوسطات" : `النتيجة الكمية ${score.toFixed(0)}/100`,
    macdOk ? "MACD لا يعارض الصعود" : "الزخم يحتاج تأكيد إضافي",
    volOk ? `الحجم النسبي ${ind.volRatio.toFixed(1)}×` : `RSI عند ${rsi.toFixed(1)}`,
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
    expected_next_day_pct: +expectedNext.toFixed(2),
  });
}

/**
 * Wrap generateText with explicit backoff on rate-limit / overload errors.
 * The AI SDK retries internally only 3 times with short waits; Gemini's free
 * tier (10 RPM) triggers 429s during a 116-stock scan, so we need much
 * longer pauses for those specific errors.
 */
async function generateWithBackoff(
  opts: Parameters<typeof generateText>[0],
  maxAttempts = 3,
  perAttemptTimeoutMs = 12000,
): Promise<{ text: string }> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Per-attempt timeout: the previous shared AbortSignal cancelled the
      // whole retry sequence after 8s, so backoff never actually ran.
      return await generateText({
        ...opts,
        abortSignal: AbortSignal.timeout(perAttemptTimeoutMs),
      });
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      const isRate = /429|too many|rate.?limit|overload|unavailable|503/i.test(msg);
      if (!isRate || attempt === maxAttempts) throw e;
      // Gemini free tier is 10 RPM → ~6s between calls. Exponential wait
      // (6s, 12s) respects the quota and lets the AI finish instead of
      // dropping into the rule-based fallback.
      const waitMs = attempt === 1 ? 6000 : 12000;
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw lastErr;
}

function extractJson(raw: string): unknown {
  let s = raw.trim();
  // Strip ```json ... ``` or ``` ... ``` code fences if present
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) s = fence[1].trim();
  // Otherwise grab the first {...} block
  if (!s.startsWith("{")) {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error(`no JSON object in AI response: ${raw.slice(0, 200)}`);
    s = s.slice(start, end + 1);
  }
  try {
    return JSON.parse(s);
  } catch {
    const repaired = s
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/[\x00-\x1F\x7F]/g, "");
    return JSON.parse(repaired);
  }
}