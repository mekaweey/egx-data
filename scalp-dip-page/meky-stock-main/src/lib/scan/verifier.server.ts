import { generateText } from "ai";
import { z } from "zod";
import { AI_MODEL, getAiGateway } from "@/lib/ai/gateway.server";
import type { Indicators } from "@/lib/analysis/indicators.server";
import type { MarketSnapshot } from "@/lib/market-data/market-index.server";
import type { Candle } from "@/lib/market-data/types";

const VerifierSchema = z.object({
  approved: z.boolean(),
  reason_ar: z.string().min(3).max(200),
  adjusted_confidence: z.coerce.number().min(0).max(100).optional(),
});

export type VerifierResult = z.infer<typeof VerifierSchema>;

/**
 * Second-pass AI "devil's advocate" for top bullish picks. It tries to falsify
 * the primary AI's call. If it disapproves, the signal is downgraded to neutral.
 */
export async function verifyPick(args: {
  symbol: string;
  nameAr: string;
  signal: "buy" | "strong_buy";
  primaryConfidence: number;
  ind: Indicators;
  history?: Candle[];
  market: MarketSnapshot | null;
  expectedNextDayPct: number;
}): Promise<VerifierResult> {
  const { symbol, nameAr, signal, primaryConfidence, ind, history, market, expectedNextDayPct } = args;
  const gateway = getAiGateway();
  const model = gateway(AI_MODEL);

  const series = (history ?? []).slice(-7).map((c) => ({
    d: c.date.slice(5, 10),
    c: +c.close.toFixed(2),
    v: c.volume,
  }));

  const system = [
    "أنت محكِّم ثاني لقرارات تحليل فني في البورصة المصرية. ابحث عن نقاط الضعف الواضحة.",
    "ارفض فقط إذا في دليل قاطع ضد الشراء (RSI>80، أنماط هبوطية واضحة، حجم منهار، انهيار سعر مفاجئ).",
    "في الحالات الرمادية وافق مع تخفيض الثقة. لا ترفض لمجرد عدم اليقين.",
    "أجب JSON فقط: {\"approved\": bool, \"reason_ar\": \"...\", \"adjusted_confidence\": رقم اختياري 0-100}.",
    "reason_ar مختصرة (3-15 كلمة) — سبب واضح بأرقام.",
  ].join("\n");

  const prompt = [
    `السهم: ${nameAr} (${symbol})`,
    `قرار المحلل الأول: ${signal} بثقة ${primaryConfidence}%`,
    `توقع حركة الغد: ${expectedNextDayPct}%`,
    `السوق: ${market?.trend ?? "unknown"} (آخر 5 أيام ${market?.change_5d_pct ?? 0}%)`,
    `RSI=${ind.rsi14?.toFixed(1) ?? "?"} • MACD_hist=${ind.macdHist?.toFixed(3) ?? "?"} • السعر/EMA21=${ind.ema21 ? (ind.close / ind.ema21).toFixed(3) : "?"} • حجم=${ind.volRatio.toFixed(2)}×`,
    `BB: ${ind.bbLower?.toFixed(2)} - ${ind.bbUpper?.toFixed(2)} • السعر=${ind.close.toFixed(2)}`,
    series.length > 0 ? `آخر 7 جلسات: ${JSON.stringify(series)}` : "",
    "هل توافق على الشراء؟ JSON فقط.",
  ].filter(Boolean).join("\n");

  const { text } = await generateText({
    model,
    system,
    prompt,
    temperature: 0.1,
    maxRetries: 0,
    abortSignal: AbortSignal.timeout(6000),
  });

  const parsed = extractJson(text);
  return VerifierSchema.parse(parsed);
}

function extractJson(raw: string): unknown {
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
