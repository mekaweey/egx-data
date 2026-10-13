/**
 * News Impact Forecaster — يحلل خبر و يقرر:
 *  - التصنيف (rights_issue / earnings / dividend / management / regulatory / macro / general)
 *  - الأفق الزمني (short ≤ يوم تداول / medium ~ أسبوع / long > أسبوع)
 *  - تاريخ بداية و نهاية التأثير على شمعة التداول (مع تخطّي الجمعة/السبت)
 *  - الاتجاه المتوقع و حجم التأثير التقديري
 *  - شرح بالعربي + خلاصة بلدي
 *  - يفضّل النتيجة محفوظة في news_impact_forecasts كذاكرة طويلة المدى.
 *
 * Fail-open: أي خطأ → لا حفظ، و الباقي يكمل طبيعي.
 */
import { createHash } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { chatWithFallback } from "@/lib/ai/chat-fallback.server";
import {
  addEgxTradingDays,
  nextEgxTradingDay,
  toDateOnly,
} from "./egx-calendar.server";

export type ImpactHorizon = "short" | "medium" | "long";
export type ImpactCategory =
  | "rights_issue" | "earnings" | "dividend" | "management"
  | "regulatory" | "macro" | "general";

export interface ImpactForecast {
  symbol: string;
  headline: string;
  category: ImpactCategory;
  horizon: ImpactHorizon;
  publishedAt: Date;
  impactStart: Date;
  impactEnd: Date;
  direction: "up" | "down" | "neutral";
  magnitudePct: number | null;
  confidence: number;
  explanationAr: string;
  baladiSummary: string;
  isRightsRelated: boolean;
}

const RIGHTS_KEYWORDS = [
  "حقوق اكتتاب", "حقوق الاكتتاب", "زيادة رأس المال", "زيادة رأس مال",
  "اكتتاب", "rights issue", "rights offering", "capital increase",
];

function hashHeadline(s: string): string {
  return createHash("sha256").update(s.trim().toLowerCase()).digest("hex").slice(0, 24);
}

function detectRights(text: string): boolean {
  const t = text.toLowerCase();
  return RIGHTS_KEYWORDS.some((k) => t.includes(k.toLowerCase()));
}

function ruleBasedClassify(headline: string): { category: ImpactCategory; horizon: ImpactHorizon } {
  const t = headline.toLowerCase();
  if (detectRights(t)) return { category: "rights_issue", horizon: "medium" };
  if (/(أرباح|نتائج|earnings|results|ربح|خسائر|خسارة)/.test(t)) return { category: "earnings", horizon: "short" };
  if (/(توزيع|كوبون|dividend|distribution)/.test(t)) return { category: "dividend", horizon: "medium" };
  if (/(رئيس|مدير|ceo|chairman|استقالة|تعيين)/.test(t)) return { category: "management", horizon: "medium" };
  if (/(فائدة|تضخم|سعر|inflation|interest|cbe|البنك المركزي|عملة|الدولار)/.test(t)) return { category: "macro", horizon: "long" };
  if (/(قرار|تنظيم|regulator|fra|البورصة)/.test(t)) return { category: "regulatory", horizon: "medium" };
  return { category: "general", horizon: "short" };
}

function horizonToDays(h: ImpactHorizon): { start: number; span: number } {
  if (h === "short") return { start: 0, span: 1 };   // أول يوم تداول، ليوم واحد
  if (h === "medium") return { start: 0, span: 5 };  // أسبوع تداول
  return { start: 2, span: 15 };                      // طويل: يبدأ بعد يومين، يمتد 3 أسابيع
}

async function llmEnrich(symbol: string, headline: string): Promise<Partial<ImpactForecast> | null> {
  try {
    const prompt = `حلل الخبر التالي عن سهم ${symbol} في البورصة المصرية و رد JSON فقط:
الخبر: "${headline}"
JSON Schema:
{
  "category": "rights_issue|earnings|dividend|management|regulatory|macro|general",
  "horizon": "short|medium|long",
  "direction": "up|down|neutral",
  "magnitude_pct": <رقم تقديري للتأثير على السعر، يمكن أن يكون سالب>,
  "confidence": <0-100>,
  "explanation_ar": "<شرح فني مختصر بالعربية الفصحى، حتى 25 كلمة>",
  "baladi": "<خلاصة بلهجة مصرية بلدي، حتى 20 كلمة، يوضح هيأثر إزاي و على إيه>"
}
ملاحظات:
- short = يوم تداول واحد، medium = أسبوع تداول، long = أكثر من أسبوع.
- لو الخبر عن حقوق اكتتاب أو زيادة رأس مال خليه rights_issue و horizon medium على الأقل.`;
    const txt = await chatWithFallback({
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      timeoutMs: 8000,
    });
    if (!txt) return null;
    const m = txt.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const j = JSON.parse(m[0]) as Record<string, unknown>;
    return {
      category: (j.category as ImpactCategory) ?? undefined,
      horizon: (j.horizon as ImpactHorizon) ?? undefined,
      direction: (j.direction as "up" | "down" | "neutral") ?? undefined,
      magnitudePct: typeof j.magnitude_pct === "number" ? j.magnitude_pct : null,
      confidence: typeof j.confidence === "number" ? Math.max(0, Math.min(100, j.confidence)) : 60,
      explanationAr: String(j.explanation_ar ?? "").slice(0, 240),
      baladiSummary: String(j.baladi ?? "").slice(0, 240),
    };
  } catch {
    return null;
  }
}

/**
 * يبني التنبؤ كاملاً (LLM + قواعد) و يحفظه. لو الخبر موجود قبل كده بنفس الـ headline_hash يتجاهل.
 */
export async function forecastAndPersistNews(args: {
  symbol: string;
  headline: string;
  newsId?: string | null;
  publishedAt?: Date;
  sentimentScore?: number | null;
}): Promise<ImpactForecast | null> {
  const publishedAt = args.publishedAt ?? new Date();
  const headline = args.headline.trim();
  if (!headline) return null;

  const rule = ruleBasedClassify(headline);
  const ai = await llmEnrich(args.symbol, headline);

  const category: ImpactCategory = (ai?.category as ImpactCategory) ?? rule.category;
  const horizon: ImpactHorizon = (ai?.horizon as ImpactHorizon) ?? rule.horizon;

  const { start, span } = horizonToDays(horizon);
  // أول يوم تأثير = أول يوم تداول بعد النشر + start تداول إضافية
  const firstTrading = nextEgxTradingDay(publishedAt, true);
  const impactStart = start === 0 ? firstTrading : addEgxTradingDays(firstTrading, start);
  const impactEnd = addEgxTradingDays(impactStart, Math.max(0, span - 1));

  const sScore = args.sentimentScore ?? 0;
  const direction: "up" | "down" | "neutral" = ai?.direction
    ?? (sScore > 0.15 ? "up" : sScore < -0.15 ? "down" : "neutral");

  const isRights = category === "rights_issue" || detectRights(headline);

  const forecast: ImpactForecast = {
    symbol: args.symbol,
    headline,
    category,
    horizon,
    publishedAt,
    impactStart,
    impactEnd,
    direction,
    magnitudePct: ai?.magnitudePct ?? null,
    confidence: ai?.confidence ?? 55,
    explanationAr: ai?.explanationAr ?? "تحليل أوّلي بناءً على نوع الخبر و توقيته.",
    baladiSummary: ai?.baladiSummary ?? "الخبر ده ممكن يحرّك السهم على المدى المحدد، خلي بالك من حركة السعر.",
    isRightsRelated: isRights,
  };

  try {
    await supabaseAdmin.from("news_impact_forecasts").upsert({
      news_id: args.newsId ?? null,
      symbol: forecast.symbol,
      headline: forecast.headline,
      headline_hash: hashHeadline(`${forecast.symbol}|${forecast.headline}`),
      category: forecast.category,
      horizon: forecast.horizon,
      published_at: forecast.publishedAt.toISOString(),
      impact_start_date: toDateOnly(forecast.impactStart),
      impact_end_date: toDateOnly(forecast.impactEnd),
      expected_direction: forecast.direction,
      expected_magnitude_pct: forecast.magnitudePct,
      confidence: forecast.confidence,
      explanation_ar: forecast.explanationAr,
      baladi_summary: forecast.baladiSummary,
      is_rights_related: forecast.isRightsRelated,
    }, { onConflict: "symbol,headline_hash", ignoreDuplicates: false });
  } catch (e) {
    console.error("[news-impact-forecast] persist failed", e);
  }

  return forecast;
}

/** يجلب التوقعات الفعّالة لرمز معين (تأثير لسه ساري). */
export async function getActiveForecastsForSymbol(symbol: string, today = new Date()) {
  const todayKey = toDateOnly(today);
  const { data } = await supabaseAdmin
    .from("news_impact_forecasts")
    .select("*")
    .eq("symbol", symbol)
    .lte("impact_start_date", todayKey)
    .gte("impact_end_date", todayKey)
    .order("confidence", { ascending: false })
    .limit(10);
  return data ?? [];
}

/** يجلب التوقعات المستقبلية (لسه ما بدأتش) — مفيدة لـ premarket brief. */
export async function getUpcomingForecasts(daysAhead = 7) {
  const today = toDateOnly(new Date());
  const horizon = toDateOnly(new Date(Date.now() + daysAhead * 86400000));
  const { data } = await supabaseAdmin
    .from("news_impact_forecasts")
    .select("*")
    .gte("impact_start_date", today)
    .lte("impact_start_date", horizon)
    .order("impact_start_date", { ascending: true })
    .limit(40);
  return data ?? [];
}

/** يجلب أحدث توقعات حقوق الاكتتاب (سارية أو قادمة). */
export async function getRightsForecasts() {
  const today = toDateOnly(new Date());
  const { data } = await supabaseAdmin
    .from("news_impact_forecasts")
    .select("*")
    .eq("is_rights_related", true)
    .gte("impact_end_date", today)
    .order("impact_start_date", { ascending: true })
    .limit(20);
  return data ?? [];
}