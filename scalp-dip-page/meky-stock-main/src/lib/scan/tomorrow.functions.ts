import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { loadAutoThreshold } from "@/lib/scan/auto-threshold.server";
import { loadSymbolMemory } from "@/lib/scan/pattern-memory.server";
import { loadTargetCalibration } from "@/lib/learning/self-calibration.server";
import { kellySizingMultiplier } from "@/lib/risk/kelly-fractional.server";
import { isBlocked } from "@/lib/scan/blocklist";

export type TomorrowPick = {
  symbol: string;
  name_ar: string;
  sector_ar: string | null;
  close: number;
  signal: string;
  confidence: number;
  expected_next_day_pct: number | null;
  expected_gain_pct: number | null;
  entry_min: number | null;
  entry_max: number | null;
  target: number | null;
  stop_loss: number | null;
  ensemble_agreement: number | null;
  technical_score: number | null;
  entry_timing_ar: string | null;
  reasons_ar: string[];
  created_at: string;
  score: number;
  tier: "gold" | "silver"; // gold ≥ 70%, silver = fallback 55-69%
};

export type TomorrowPayload = {
  scanId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  picks: TomorrowPick[];
  totalCandidates: number;
  minConfidence: number;
  fallbackUsed: boolean;
};

// Defaults — يتم استبدالهم بقيم auto-tuned من model_state لو متاحة.
const DEFAULT_MIN_CONFIDENCE = 70;
const DEFAULT_FALLBACK = 55;
const FALLBACK_MAX_PICKS = 3;

export const getTomorrowPicks = createServerFn({ method: "GET" }).handler(
  async (): Promise<TomorrowPayload> => {
    const auto = await loadAutoThreshold().catch(() => null);
    const MIN_CONFIDENCE = auto?.gold ?? DEFAULT_MIN_CONFIDENCE;
    const FALLBACK_MIN_CONFIDENCE = auto?.silver ?? DEFAULT_FALLBACK;

    const { data: scan } = await supabaseAdmin
      .from("scans")
      .select("id, started_at, finished_at, status")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!scan) {
      return {
        scanId: null,
        startedAt: null,
        finishedAt: null,
        picks: [],
        totalCandidates: 0,
        minConfidence: MIN_CONFIDENCE,
        fallbackUsed: false,
      };
    }

    // Step 1: نحاول جلب الـ gold tier (≥70%)
    const selectCols =
      "symbol, signal, confidence, expected_next_day_pct, expected_gain_pct, entry_min, entry_max, target, stop_loss, ensemble_agreement, technical_score, entry_timing_ar, reasons_ar, price_at_reco, created_at, rejected_by_rules";

    const { data: goldRecos } = await supabaseAdmin
      .from("recommendations")
      .select(selectCols)
      .eq("scan_id", scan.id)
      .in("signal", ["buy", "strong_buy"])
      .eq("rejected_by_rules", false)
      .gte("confidence", MIN_CONFIDENCE)
      .gt("expected_next_day_pct", 0);

    let list = goldRecos ?? [];
    let fallbackUsed = false;

    // Step 2: fallback — لو مفيش gold، نجيب أحسن 3 ≥55%
    if (list.length === 0) {
      const { data: silverRecos } = await supabaseAdmin
        .from("recommendations")
        .select(selectCols)
        .eq("scan_id", scan.id)
        .in("signal", ["buy", "strong_buy"])
        .eq("rejected_by_rules", false)
        .gte("confidence", FALLBACK_MIN_CONFIDENCE)
        .gt("expected_next_day_pct", 0)
        .order("confidence", { ascending: false })
        .limit(FALLBACK_MAX_PICKS);
      list = silverRecos ?? [];
      fallbackUsed = list.length > 0;
    }

    const symbols = Array.from(new Set(list.map((r) => r.symbol)));
    const stocksMap = new Map<string, { name_ar: string; sector_ar: string | null }>();
    if (symbols.length) {
      const { data: stocks } = await supabaseAdmin
        .from("stocks")
        .select("symbol, name_ar, sector_ar")
        .in("symbol", symbols);
      for (const s of stocks ?? [])
        stocksMap.set(s.symbol, { name_ar: s.name_ar, sector_ar: s.sector_ar });
    }

    const picks: TomorrowPick[] = list.map((r) => {
      const expNext = Number(r.expected_next_day_pct ?? 0);
      const conf = Number(r.confidence ?? 0);
      const agree = Number(r.ensemble_agreement ?? 0);
      // Composite score: weight confidence + expected return + ensemble agreement.
      const score = conf * 0.5 + expNext * 30 + agree * 5;
      const info = stocksMap.get(r.symbol);
      const reasons = Array.isArray(r.reasons_ar)
        ? (r.reasons_ar as unknown[]).filter((x): x is string => typeof x === "string")
        : [];
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
        tier: conf >= MIN_CONFIDENCE ? "gold" : "silver",
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
      fallbackUsed,
    };
  }
);

/**
 * Morning Brief — صفقات اليوم اللي تقدر تعتمد عليها.
 * بوّابة Conviction صارمة فوق getTomorrowPicks:
 *   - confidence ≥ max(gold, 75)
 *   - ensemble_agreement ≥ 4 من 5
 *   - verifier_approved = true
 *   - رفض لو الـ symbol عنده تاريخ سيء (winRate < 35%) في memory
 *   - حد أقصى 3 صفقات
 * لو مفيش أي صفقة تعدّي البوابة → noTrade = true (أحسن من صفقة سيئة).
 */
export type MorningBriefPick = TomorrowPick & {
  symbol_win_rate: number | null;
  symbol_history_n: number;
  verifier_approved: boolean;
};

export type MorningBriefPayload = {
  scanId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  picks: MorningBriefPick[];
  noTrade: boolean;
  reason: string | null;
  minConfidenceUsed: number;
  generatedAt: string;
};

export const getMorningBrief = createServerFn({ method: "GET" }).handler(
  async (): Promise<MorningBriefPayload> => {
    const auto = await loadAutoThreshold().catch(() => null);
    const STRICT_MIN = Math.max(75, auto?.gold ?? 75);

    const { data: scan } = await supabaseAdmin
      .from("scans")
      .select("id, started_at, finished_at")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!scan) {
      return {
        scanId: null,
        startedAt: null,
        finishedAt: null,
        picks: [],
        noTrade: true,
        reason: "لم يتم تشغيل مسح بعد",
        minConfidenceUsed: STRICT_MIN,
        generatedAt: new Date().toISOString(),
      };
    }

    const cols =
      "symbol, signal, confidence, expected_next_day_pct, expected_gain_pct, entry_min, entry_max, target, stop_loss, ensemble_agreement, technical_score, entry_timing_ar, reasons_ar, price_at_reco, created_at, verifier_approved, rejected_by_rules";

    const { data: recos } = await supabaseAdmin
      .from("recommendations")
      .select(cols)
      .eq("scan_id", scan.id)
      .in("signal", ["buy", "strong_buy"])
      .eq("rejected_by_rules", false)
      .gte("confidence", STRICT_MIN)
      .gt("expected_next_day_pct", 0)
      .order("confidence", { ascending: false });

    const list = recos ?? [];
    const memory = await loadSymbolMemory().catch(() => new Map());
    const calibration = await loadTargetCalibration().catch(() => ({ normal: 1, momentum: 1, explosive: 1 } as Record<string, number>));

    type R = (typeof list)[number];
    const passed: R[] = [];
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
        generatedAt: new Date().toISOString(),
      };
    }

    const symbols = Array.from(new Set(passed.map((r) => r.symbol)));
    const { data: stocks } = await supabaseAdmin
      .from("stocks")
      .select("symbol, name_ar, sector_ar")
      .in("symbol", symbols);
    const stocksMap = new Map(stocks?.map((s) => [s.symbol, s]) ?? []);

    const picks: MorningBriefPick[] = passed.map((r) => {
      const conf = Number(r.confidence ?? 0);
      const expNext = Number(r.expected_next_day_pct ?? 0);
      const agree = Number(r.ensemble_agreement ?? 0);
      const info = stocksMap.get(r.symbol);
      const mem = memory.get(r.symbol);
      const reasons = Array.isArray(r.reasons_ar)
        ? (r.reasons_ar as unknown[]).filter((x): x is string => typeof x === "string")
        : [];
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
        tier: "gold" as const,
        symbol_win_rate: mem ? mem.winRate : null,
        symbol_history_n: mem ? mem.total : 0,
        verifier_approved: r.verifier_approved === true,
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
      generatedAt: new Date().toISOString(),
    };
  },
);
/**
 * Daily 1% Strategy — صفقة واحدة كل يوم بهدف +1% فقط.
 * منطق الاختيار: مش بندوّر على أعلى ثقة، بندوّر على أعلى احتمال
 * إن السهم يتحرك +1% خلال اليوم. يعني:
 *   - intraday swing (ATR/close) ≥ 1.2%  → فيه حركة كافية
 *   - confidence ≥ 65 و signal buy/strong_buy
 *   - ensemble_agreement ≥ 3
 *   - مش مرفوض بقواعد الفشل
 * بنرجّع أعلى سهم بسكور = (swing% × ثقة) ونحدّد:
 *   - target = entry × 1.01  (بِيع فوراً)
 *   - stop   = entry × 0.985 (R:R = 1:1.5)
 */
export type DailyOnePercentPick = {
  symbol: string;
  name_ar: string;
  sector_ar: string | null;
  entry: number;
  target: number;
  stop: number;
  target_pct: number;
  stop_pct: number;
  trail_to_be_at: number; // سعر تنشيط نقل الستوب لـ break-even
  expected_swing_pct: number;
  confidence: number;
  ensemble_agreement: number | null;
  reasons_ar: string[];
  symbol_win_rate: number | null;
  symbol_history_n: number;
  rank_score: number;
  position_size_pct: number; // % من رأس المال
  quality_signals: number; // 0..4 — كم إشارة قوية اتفقت
  tier: "premium" | "strong" | "standard";
};

export type DailyOnePercentPayload = {
  scanId: string | null;
  pick: DailyOnePercentPick | null;
  alternatives: DailyOnePercentPick[];
  portfolio: DailyOnePercentPick[]; // المحفظة الكاملة (1-3 أسهم)
  total_exposure_pct: number; // مجموع نسب الدخول
  cash_pct: number; // الكاش المتبقي
  market_regime: "bullish" | "neutral" | "bearish" | "unknown";
  market_ok: boolean;
  news_warnings: { symbol: string; reason: string }[];
  noTrade: boolean;
  reason: string | null;
  generatedAt: string;
};

export const getDailyOnePercent = createServerFn({ method: "GET" }).handler(
  async (): Promise<DailyOnePercentPayload> => {
    const empty = (reason: string, scanId: string | null = null) => ({
      scanId, pick: null, alternatives: [], portfolio: [],
      total_exposure_pct: 0, cash_pct: 100,
      market_regime: "unknown" as const, market_ok: false,
      news_warnings: [], noTrade: true, reason,
      generatedAt: new Date().toISOString(),
    });

    const { data: scan } = await supabaseAdmin
      .from("scans")
      .select("id")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!scan) return empty("لم يتم تشغيل مسح بعد");

    // (3) Regime Filter — حالة السوق العامة
    const { data: mkt } = await supabaseAdmin
      .from("market_snapshots")
      .select("close, ema20, change_5d_pct, trend, date")
      .eq("index_symbol", "EGX30")
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    let regime: "bullish" | "neutral" | "bearish" | "unknown" = "unknown";
    let marketOk = true;
    if (mkt) {
      const close = Number(mkt.close ?? 0);
      const ema = Number(mkt.ema20 ?? 0);
      const ch5 = Number(mkt.change_5d_pct ?? 0);
      if (close > 0 && ema > 0) {
        if (close > ema && ch5 > 0) regime = "bullish";
        else if (close < ema && ch5 < -2) { regime = "bearish"; marketOk = false; }
        else regime = "neutral";
      }
    }
    if (!marketOk) {
      return { ...empty("السوق في حالة هبوط (تحت EMA20 وأداء -2% آخر 5 أيام) — لا تداول اليوم", scan.id),
        market_regime: regime, market_ok: false };
    }

    const { data: recosRaw } = await supabaseAdmin
      .from("recommendations")
      .select("symbol, signal, confidence, ensemble_agreement, price_at_reco, reasons_ar, rejected_by_rules")
      .eq("scan_id", scan.id)
      .in("signal", ["buy", "strong_buy"])
      .eq("rejected_by_rules", false)
      .gte("confidence", 55);

    const recos = (recosRaw ?? []).filter((r) => !isBlocked(r.symbol));

    if (!recos || recos.length === 0) {
      // Fallback ذكي بدون AI — نبني مرشحين من stock_snapshots مباشرة
      const fb = await buildRuleBasedCandidates(scan.id, regime);
      if (fb.length === 0) {
        return { ...empty("مفيش فرصة شراء آمنة كفاية دلوقتي — هنعيد التقييم مع كل تحديث لحظي اليوم", scan.id),
          market_regime: regime, market_ok: true };
      }
      return finalizePortfolio(fb, scan.id, regime, []);
    }

    const symbols = recos.map((r) => r.symbol);
    const { data: snaps } = await supabaseAdmin
      .from("stock_snapshots")
      .select("symbol, atr14, close, vol_ratio, rsi14, resistance")
      .eq("scan_id", scan.id)
      .in("symbol", symbols);
    const snapMap = new Map(snaps?.map((s) => [s.symbol, s]) ?? []);

    const { data: stocks } = await supabaseAdmin
      .from("stocks").select("symbol, name_ar, sector_ar").in("symbol", symbols);
    const stockMap = new Map(stocks?.map((s) => [s.symbol, s]) ?? []);

    const memory = await loadSymbolMemory().catch(() => new Map());

    // (6) News Filter — استبعد الأسهم اللي عليها خبر سلبي قوي آخر 24 ساعة
    const calibration = await loadTargetCalibration().catch(
      () => ({ normal: 1, momentum: 1, explosive: 1 }) as Record<string, number>,
    );
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { data: badNews } = await supabaseAdmin
      .from("news_sentiment")
      .select("symbol, headline, sentiment, impact_level, sentiment_score")
      .in("symbol", symbols)
      .eq("sentiment", "negative")
      .in("impact_level", ["high", "medium"])
      .gte("published_at", since);
    const blockedNews = new Map<string, string>();
    for (const n of badNews ?? []) {
      blockedNews.set(n.symbol, n.headline ?? "خبر سلبي مؤثر");
    }
    const newsWarnings = Array.from(blockedNews.entries()).map(([symbol, reason]) => ({ symbol, reason }));

    // (6b) Positive News Boost — كافئ الأسهم اللي عليها أخبار إيجابية مؤثرة آخر 48 ساعة
    const since48 = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
    const { data: goodNews } = await supabaseAdmin
      .from("news_sentiment")
      .select("symbol, sentiment_score, impact_level")
      .in("symbol", symbols)
      .eq("sentiment", "positive")
      .gte("published_at", since48);
    const positiveScore = new Map<string, number>();
    for (const n of goodNews ?? []) {
      const s = Math.max(positiveScore.get(n.symbol) ?? 0, Number(n.sentiment_score) || 0);
      positiveScore.set(n.symbol, s);
    }

    const candidates: DailyOnePercentPick[] = [];
    for (const r of recos) {
      if (blockedNews.has(r.symbol)) continue;
      const snap = snapMap.get(r.symbol);
      const entry = Number(r.price_at_reco ?? snap?.close ?? 0);
      if (entry <= 0) continue;
      const atr = Number(snap?.atr14 ?? 0);
      const swing = entry > 0 ? (atr / entry) * 100 : 0;
      // النهارده أهم من بكرة: اقبل حركة يومية أقل، والهدف يتكيّف حسب قوة السهم.
      if (swing < 0.45) continue;
      const agree = Number(r.ensemble_agreement ?? 0);
      if (agree < 2) continue;

      const mem = memory.get(r.symbol);
      // فلتر دقة أعلى — استبعد أي سهم تاريخه أقل من 45٪ نجاح
      if (mem && mem.total >= 5 && mem.winRate < 0.45) continue;

      const conf = Number(r.confidence);
      const volRatio = Number(snap?.vol_ratio ?? 1);
      const rsi = Number(snap?.rsi14 ?? 50);
      const volBoost = Math.min(1.5, volRatio);
      const memBoost = mem ? 1 + (mem.winRate - 0.5) * 0.5 : 1;
      const regimeBoost = regime === "bullish" ? 1.15 : regime === "neutral" ? 1.0 : 0.9;

      // Momentum tier — سهم زخم قوي يستحق هدف أعلى
      // شروط: حركة ≥2٪ + حجم ≥1.5× + ثقة ≥72 + اتفاق ≥4 + RSI 50-72 (مش متشبع)
      const isMomentum =
        swing >= 2.0 &&
        volRatio >= 1.5 &&
        conf >= 72 &&
        agree >= 4 &&
        rsi >= 50 && rsi <= 72;

      const momentumBoost = isMomentum ? 1.4 : 1.0;

      // 🚀 Explosive Tier — نمط زي MPCO (طلع +10٪ في يوم)
      // إشارة تجميع مؤسسات: حجم انفجاري ≥2× + بريك آوت فوق المقاومة + RSI صحي
      const resistance = Number(snap?.resistance ?? 0);
      const close = Number(snap?.close ?? entry);
      const breakout = resistance > 0 && close >= resistance * 0.985; // قرب/فوق المقاومة
      const isExplosive =
        volRatio >= 2.0 &&
        conf >= 75 &&
        rsi >= 55 && rsi <= 70 &&
        breakout &&
        regime !== "bearish";
      const explosiveBoost = isExplosive ? 2.2 : 1.0;

      // 📰 News boost: +20% لو فيه خبر إيجابي قوي (score≥0.7) أو +10% للمتوسط
      const posNews = positiveScore.get(r.symbol) ?? 0;
      const newsBoost = posNews >= 0.7 ? 1.20 : posNews >= 0.4 ? 1.10 : 1.0;

      const score = swing * conf * volBoost * memBoost * regimeBoost * momentumBoost * explosiveBoost * newsBoost;

      // 🏆 Quality Score — كم إشارة قوية اتفقت (من 4): تكنيكال + حجم + خبر + ذاكرة
      const qTech = conf >= 72 && agree >= 4 ? 1 : 0;
      const qVol = volRatio >= 1.5 ? 1 : 0;
      const qNews = posNews >= 0.4 ? 1 : 0;
      const qMem = mem && mem.winRate >= 0.55 && mem.total >= 5 ? 1 : 0;
      const qualitySignals = qTech + qVol + qNews + qMem;
      const tier: "premium" | "strong" | "standard" =
        qualitySignals >= 3 ? "premium" : qualitySignals === 2 ? "strong" : "standard";

      // (5) Dynamic Target — متدرّج حسب قوة الإشارة
      //   عادي:     1-2٪
      //   زخم:      حتى 6٪
      //   انفجاري:  حتى 8٪ (حجم 2×+ بريك آوت)
      //   انفجاري + خبر إيجابي قوي: حتى 12٪ (نمط MPCO)
      // الأساس = swing (ATR%) × مضاعِف حسب القوة
      let targetPct: number;
      if (isExplosive && posNews >= 0.7) {
        // قنبلة: انفجار حجم + خبر — الهدف ممكن يوصل 10-12٪
        targetPct = Math.min(12.0, Math.max(5.0, swing * 1.8));
      } else if (isExplosive) {
        // انفجار حجم بس — الهدف 5-8٪
        targetPct = Math.min(8.0, Math.max(3.5, swing * 1.3));
      } else if (isMomentum && posNews >= 0.4) {
        // زخم + خبر إيجابي — وسّع الهدف شويه
        targetPct = Math.min(7.0, Math.max(2.5, swing * 0.95));
      } else if (isMomentum) {
        targetPct = Math.min(6.0, Math.max(2.0, swing * 0.75));
      } else {
        targetPct = Math.min(2.0, Math.max(1.0, swing * 0.55));
      }
      // 🎯 طبّق المعايرة الذاتية
      const calibTier = isExplosive ? "explosive" : isMomentum ? "momentum" : "normal";
      const calibMult = (calibration as Record<string, number>)[calibTier] ?? 1;
      targetPct = Math.max(1.0, Math.min(14.0, targetPct * calibMult));
      // Stop loss يفضل أضيق من الهدف عشان R:R ≥ 1.5
      const stopPct = isMomentum
        ? Math.min(2.5, Math.max(1.2, swing * 0.5))
        : Math.min(1.8, Math.max(1.0, swing * 0.45));

      const reasons = Array.isArray(r.reasons_ar)
        ? (r.reasons_ar as unknown[]).filter((x): x is string => typeof x === "string")
        : [];
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
        trail_to_be_at: +(entry * (1 + (targetPct / 2) / 100)).toFixed(2),
        expected_swing_pct: +swing.toFixed(2),
        confidence: conf,
        ensemble_agreement: agree,
        reasons_ar: reasons.slice(0, 3),
        symbol_win_rate: mem ? mem.winRate : null,
        symbol_history_n: mem ? mem.total : 0,
        rank_score: +score.toFixed(1),
        position_size_pct: 0, // يتحدد بعد الترتيب
        quality_signals: qualitySignals,
        tier,
      });
    }

    candidates.sort((a, b) => b.rank_score - a.rank_score);

    if (candidates.length === 0) {
      const fb = await buildRuleBasedCandidates(scan.id, regime, blockedNews);
      if (fb.length === 0) {
        return { ...empty("مفيش فرصة شراء آمنة كفاية دلوقتي — هنعيد التقييم مع كل تحديث لحظي اليوم", scan.id),
          market_regime: regime, market_ok: true, news_warnings: newsWarnings };
      }
      return finalizePortfolio(fb, scan.id, regime, newsWarnings);
    }

    // (1)+(2) Position Sizing + Multi-Position حسب ثقة السهم الرئيسي
    const top = candidates.slice(0, 3);
    const primaryConf = top[0].confidence;
    let weights: number[];
    if (primaryConf >= 80) weights = [50, 30, 20];
    else if (primaryConf >= 72) weights = [40, 25, 15];
    else weights = [25, 15, 10];
    for (let i = 0; i < top.length; i++) {
      top[i].position_size_pct = weights[i] ?? 0;
    }
    const totalExposure = top.reduce((s, p) => s + p.position_size_pct, 0);

    return finalizePortfolio(candidates, scan.id, regime, newsWarnings);
  },
);

// ============================================================
// Rule-based fallback — يشتغل لما الـ AI مش متاح (credits خلصت)
// بيستخدم stock_snapshots مباشرة + pattern memory للترشيح
// ============================================================
async function buildRuleBasedCandidates(
  scanId: string,
  regime: "bullish" | "neutral" | "bearish" | "unknown",
  blockedNews?: Map<string, string>,
): Promise<DailyOnePercentPick[]> {
  const { data: snaps } = await supabaseAdmin
    .from("stock_snapshots")
    .select("symbol, close, atr14, vol_ratio, rsi14, macd, macd_signal, ema9, ema21, sma50, support, resistance, composite_score, change_pct, volume")
    .eq("scan_id", scanId);
  if (!snaps || snaps.length === 0) return [];

  const symbols = snaps.map((s) => s.symbol);
  const { data: stocks } = await supabaseAdmin
    .from("stocks").select("symbol, name_ar, sector_ar, is_active").in("symbol", symbols);
  const stockMap = new Map(stocks?.map((s) => [s.symbol, s]) ?? []);
  const memory = await loadSymbolMemory().catch(() => new Map());

  // لو مفيش blockedNews متمرر، اجلب أخبار سلبية آخر 24 ساعة
  let blocked = blockedNews;
  if (!blocked) {
    blocked = new Map();
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { data: bad } = await supabaseAdmin
      .from("news_sentiment")
      .select("symbol, headline")
      .in("symbol", symbols)
      .eq("sentiment", "negative")
      .in("impact_level", ["high", "medium"])
      .gte("published_at", since);
    for (const n of bad ?? []) blocked.set(n.symbol, n.headline ?? "خبر سلبي");
  }

  const cands: DailyOnePercentPick[] = [];
  for (const s of snaps) {
    if (isBlocked(s.symbol)) continue;
    if (blocked.has(s.symbol)) continue;
    const info = stockMap.get(s.symbol);
    if (!info || !info.is_active) continue;

    const entry = Number(s.close ?? 0);
    const atr = Number(s.atr14 ?? 0);
    if (entry <= 0 || atr <= 0) continue;

    const swing = (atr / entry) * 100;
    if (swing < 0.45) continue; // النهارده: نقبل حركة أقل ونصغّر الهدف حسب الواقع

    const rsi = Number(s.rsi14 ?? 50);
    if (rsi < 35 || rsi > 82) continue; // فلتر خطر فقط بدل منع أغلب الفرص

    const volRatio = Number(s.vol_ratio ?? 1);
    if (volRatio < 0.35) continue; // في يوم هادي نفضل نطلع أفضل المتاح بدل لا شيء

    const ema9 = Number(s.ema9 ?? 0);
    const ema21 = Number(s.ema21 ?? 0);
    const macd = Number(s.macd ?? 0);
    const macdSig = Number(s.macd_signal ?? 0);
    // اتجاه قصير صاعد: EMA9 > EMA21 و MACD > Signal
    const trendOk = ema9 > 0 && ema21 > 0 && ema9 >= ema21;
    const momentumOk = macd >= macdSig;
    const positiveTape = Number(s.change_pct ?? 0) >= 0 || Number(s.composite_score ?? 0) >= 45;
    if (!trendOk && !momentumOk && !positiveTape) continue;

    // فلتر دقة من الذاكرة
    const mem = memory.get(s.symbol);
    if (mem && mem.total >= 5 && mem.winRate < 0.45) continue;

    // قرب من المقاومة → فرصة كسر، بعيد عن الدعم → أمان
    const resistance = Number(s.resistance ?? 0);
    const support = Number(s.support ?? 0);
    const distToResPct = resistance > entry ? ((resistance - entry) / entry) * 100 : 0;
    const distFromSupPct = support > 0 && support < entry ? ((entry - support) / entry) * 100 : 99;
    // محتاج مساحة للهدف + بعيد عن stop
    if (distToResPct > 0 && distToResPct < 0.8) continue; // ملصوق بالمقاومة
    if (distFromSupPct < 0.5) continue; // ملصوق بالدعم (خطر كسر)

    // Score مركّب
    const compScore = Number(s.composite_score ?? 0);
    const volBoost = Math.min(1.5, volRatio);
    const memBoost = mem ? 1 + (mem.winRate - 0.5) * 0.5 : 1;
    const regimeBoost = regime === "bullish" ? 1.15 : regime === "neutral" ? 1.0 : 0.9;
    const trendBoost = trendOk && momentumOk ? 1.2 : 1.0;
    const rank = swing * (50 + compScore) * volBoost * memBoost * regimeBoost * trendBoost;

    // ثقة مُشتقة (0-95) من الإشارات الفنية بدون AI
    let confidence = 55;
    if (trendOk) confidence += 6;
    if (momentumOk) confidence += 5;
    if (volRatio >= 1.5) confidence += 5;
    if (rsi >= 50 && rsi <= 65) confidence += 4;
    if (compScore >= 60) confidence += 6;
    if (mem && mem.winRate >= 0.6 && mem.total >= 5) confidence += 5;
    if (regime === "bullish") confidence += 4;
    confidence = Math.min(85, Math.max(50, confidence));

    // Target/Stop — متدرّج حسب قوة الإشارة (مثل المنطق الأساسي)
    const isMomentum = swing >= 2.0 && volRatio >= 1.5 && trendOk && momentumOk;
    const resistance2 = Number(s.resistance ?? 0);
    const close2 = Number(s.close ?? entry);
    const breakout2 = resistance2 > 0 && close2 >= resistance2 * 0.985;
    const isExplosive2 =
      volRatio >= 2.0 &&
      rsi >= 55 && rsi <= 70 &&
      breakout2 &&
      regime !== "bearish";
    let targetPct: number;
    if (isExplosive2) {
      // انفجار: حجم 2×+ بريك آوت — الهدف 5-9٪
      targetPct = Math.min(9.0, Math.max(3.5, swing * 1.4));
    } else if (isMomentum) {
      targetPct = Math.min(6.0, Math.max(2.0, swing * 0.8));
    } else {
      targetPct = Math.min(2.0, Math.max(1.0, swing * 0.55));
    }
    const stopPct = isMomentum
      ? Math.min(2.5, Math.max(1.2, swing * 0.5))
      : Math.min(1.8, Math.max(1.0, swing * 0.45));

    const reasons: string[] = [];
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
      trail_to_be_at: +(entry * (1 + (targetPct / 2) / 100)).toFixed(2),
      expected_swing_pct: +swing.toFixed(2),
      confidence,
      ensemble_agreement: null,
      reasons_ar: reasons.slice(0, 3),
      symbol_win_rate: mem ? mem.winRate : null,
      symbol_history_n: mem ? mem.total : 0,
      rank_score: +rank.toFixed(1),
      position_size_pct: 0,
      quality_signals:
        (trendOk && momentumOk ? 1 : 0) +
        (volRatio >= 1.5 ? 1 : 0) +
        (compScore >= 60 ? 1 : 0) +
        (mem && mem.winRate >= 0.55 && mem.total >= 5 ? 1 : 0),
      tier: "standard",
    });
  }

  cands.sort((a, b) => b.rank_score - a.rank_score);
  return cands;
}

function finalizePortfolio(
  candidates: DailyOnePercentPick[],
  scanId: string,
  regime: "bullish" | "neutral" | "bearish" | "unknown",
  newsWarnings: { symbol: string; reason: string }[],
): DailyOnePercentPayload {
    // 📊 Sector Rotation Boost — لو نفس القطاع فيه ≥2 سهم قوي، زوّد نقاطه
    const sectorCount = new Map<string, number>();
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

    // 🔗 Correlation Filter — تنويع القطاعات: أقصى سهمين من نفس القطاع في أعلى 3
    const top: DailyOnePercentPick[] = [];
    const sectorTaken = new Map<string, number>();
    const overflow: DailyOnePercentPick[] = [];
    for (const c of candidates) {
      if (top.length >= 3) break;
      const sec = c.sector_ar || "_unknown";
      const used = sectorTaken.get(sec) ?? 0;
      if (used >= 2) { overflow.push(c); continue; }
      top.push(c);
      sectorTaken.set(sec, used + 1);
    }
    // لو ملقتش 3 من قطاعات مختلفة، كمّل من الـ overflow
    for (const c of overflow) {
      if (top.length >= 3) break;
      top.push(c);
    }
    if (top.length === 0) {
      return {
        scanId, pick: candidates[0], alternatives: [], portfolio: [],
        total_exposure_pct: 0, cash_pct: 100, market_regime: regime,
        market_ok: true, news_warnings: newsWarnings, noTrade: true,
        reason: "no candidates after diversity filter",
        generatedAt: new Date().toISOString(),
      };
    }
    const primaryConf = top[0].confidence;

    // 💰 Kelly Sizing — وزن كل صفقة حسب تاريخ السهم (winRate × avgWin/avgLoss)
    // كل صفقة بتاخد وزن بين 5٪ (افتراضي) و25٪ (Kelly كامل)
    const baseWeights =
      primaryConf >= 80 ? [40, 25, 15] :
      primaryConf >= 72 ? [32, 20, 12] :
      [22, 14, 9];
    for (let i = 0; i < top.length; i++) {
      const base = baseWeights[i] ?? 0;
      const wr = top[i].symbol_win_rate;
      const n = top[i].symbol_history_n;
      // لو عندنا تاريخ كافٍ، طبّق Kelly كمضاعِف على الوزن الأساسي
      let mult = 1;
      if (wr != null && n >= 5) {
        // approximate avgWin/avgLoss من target/stop
        const approxWin = Math.max(1, top[i].target_pct);
        const approxLoss = Math.max(1, top[i].stop_pct);
        mult = kellySizingMultiplier(wr, approxWin, approxLoss);
      }
      // ارفع المرتبة لو premium tier
      if (top[i].tier === "premium") mult *= 1.15;
      else if (top[i].tier === "standard") mult *= 0.85;
      // V2.1 (walk-forward verified): April size reduction — 50% during
      // the historically weakest month. Cuts Q2 drawdown without killing
      // trades (active days kept; only sizing halved).
      const aprilMonth = new Date().getUTCMonth() + 1; // 1..12
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
      generatedAt: new Date().toISOString(),
    };
}
