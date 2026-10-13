import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { AI_MODEL, getAiGateway } from "@/lib/ai/gateway.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchNewsBulk } from "@/lib/market-data/news.server";

/**
 * Hybrid layer: rule-based scoring is done in the UI/other server fns for free.
 * These two server functions are the ONLY AI-powered surfaces the user opts
 * into explicitly — keeping AI cost down to "when it actually adds value":
 *   1. Understanding free-form news/headlines impact on a stock.
 *   2. Summarizing a pasted financial report (text extracted from PDF).
 */

export type NewsImpact = {
  score: number; // -1 .. +1
  sentiment: "إيجابي قوي" | "إيجابي" | "محايد" | "سلبي" | "سلبي قوي";
  summary_ar: string;
  key_points: string[];
  action_ar: string; // suggested action
};

function bucket(score: number): NewsImpact["sentiment"] {
  if (score >= 0.6) return "إيجابي قوي";
  if (score >= 0.2) return "إيجابي";
  if (score <= -0.6) return "سلبي قوي";
  if (score <= -0.2) return "سلبي";
  return "محايد";
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
  const s = cleaned.indexOf("{");
  const e = cleaned.lastIndexOf("}");
  if (s === -1 || e === -1) throw new Error("no JSON in response");
  return JSON.parse(cleaned.slice(s, e + 1));
}

export const analyzeNewsImpactAI = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        symbol: z.string().min(1).max(20),
        company_ar: z.string().min(1).max(200),
        headlines: z.array(z.string().min(3).max(500)).min(1).max(20),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<NewsImpact> => {
    const gateway = getAiGateway();
    const { text } = await generateText({
      model: gateway(AI_MODEL),
      system: [
        "أنت محلل أخبار مالية محترف للبورصة المصرية.",
        "حلل تأثير الأخبار على سعر السهم بدقة. انتبه للسياق:",
        "- 'تراجع الخسائر' = إيجابي",
        "- 'أرباح أقل من المتوقع' = سلبي رغم وجود أرباح",
        "- 'استحواذ / توسع / عقد جديد' = إيجابي عادة",
        "- 'تحقيق / غرامة / استقالة' = سلبي",
        "أجب بـ JSON فقط بهذا الشكل:",
        '{"score": رقم من -1 إلى 1, "summary": "ملخص سطرين", "points": ["نقطة 1", "نقطة 2"], "action": "اقتراح للمستثمر"}',
      ].join("\n"),
      prompt: [
        `الشركة: ${data.company_ar} (${data.symbol})`,
        "العناوين:",
        ...data.headlines.map((h, i) => `${i + 1}. ${h}`),
      ].join("\n"),
      temperature: 0.2,
    });
    const parsed = extractJson(text) as {
      score?: number;
      summary?: string;
      points?: string[];
      action?: string;
    };
    const score = Math.max(-1, Math.min(1, Number(parsed.score) || 0));
    return {
      score: +score.toFixed(2),
      sentiment: bucket(score),
      summary_ar: String(parsed.summary ?? "").slice(0, 600),
      key_points: (parsed.points ?? []).slice(0, 6).map(String),
      action_ar: String(parsed.action ?? "").slice(0, 300),
    };
  });

export type ReportSummary = {
  headline_ar: string;
  revenue_change_ar: string;
  profit_change_ar: string;
  highlights: string[];
  risks: string[];
  verdict_ar: string;
};

export const summarizeReportAI = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        company_ar: z.string().min(1).max(200),
        // user pastes raw text extracted from the PDF financial report
        report_text: z.string().min(50).max(50_000),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<ReportSummary> => {
    const gateway = getAiGateway();
    const { text } = await generateText({
      model: gateway(AI_MODEL),
      system: [
        "أنت محلل مالي خبير في تقارير الشركات المصرية.",
        "لخّص التقرير المالي بالعربية بدقة وبدون اختراع أرقام.",
        "ركز على: الإيرادات، صافي الربح، الهامش، مقارنة بالعام السابق، والمخاطر.",
        "أجب بـ JSON فقط:",
        '{"headline":"سطر واحد","revenue":"التغير في الإيرادات","profit":"التغير في الأرباح","highlights":["نقطة قوة 1","..."],"risks":["مخاطرة 1","..."],"verdict":"التوصية النهائية"}',
      ].join("\n"),
      prompt: [
        `الشركة: ${data.company_ar}`,
        "نص التقرير المالي:",
        data.report_text.slice(0, 40_000),
      ].join("\n"),
      temperature: 0.1,
    });
    const parsed = extractJson(text) as {
      headline?: string;
      revenue?: string;
      profit?: string;
      highlights?: string[];
      risks?: string[];
      verdict?: string;
    };
    return {
      headline_ar: String(parsed.headline ?? "").slice(0, 240),
      revenue_change_ar: String(parsed.revenue ?? "").slice(0, 240),
      profit_change_ar: String(parsed.profit ?? "").slice(0, 240),
      highlights: (parsed.highlights ?? []).slice(0, 8).map(String),
      risks: (parsed.risks ?? []).slice(0, 8).map(String),
      verdict_ar: String(parsed.verdict ?? "").slice(0, 400),
    };
  });

// ============== AUTO HYBRID PIPELINE ==============
// Pulls top movers from the latest scan, auto-fetches news per stock,
// and returns rule-based + AI sentiment without any manual input.

export type AutoDeepRow = {
  symbol: string;
  name_ar: string;
  sector_ar: string | null;
  close: number;
  change_pct: number | null;
  signal: string | null;
  // rule-based
  rule_label: "إيجابي" | "سلبي" | "محايد" | "مختلط";
  rule_score: number;
  // AI-powered (from existing fetchStockNews pipeline)
  ai_sentiment: "positive" | "negative" | "mixed" | "neutral";
  ai_score: number;
  headlines: string[];
  ai_reason: string;
  news_found: boolean;
};

const POS_KW = ["أرباح", "نمو", "ارتفاع", "استحواذ", "توسع", "عقد", "توزيع", "تراجع الخسائر"];
const NEG_KW = ["خسائر", "تراجع", "هبوط", "غرامة", "تحقيق", "استقالة", "تعثر", "شطب"];

function ruleScore(headlines: string[]): { score: number; label: AutoDeepRow["rule_label"] } {
  let pos = 0;
  let neg = 0;
  for (const h of headlines) {
    for (const k of POS_KW) if (h.includes(k)) pos++;
    for (const k of NEG_KW) if (h.includes(k)) neg++;
  }
  const total = pos + neg;
  if (total === 0) return { score: 0, label: "محايد" };
  const score = (pos - neg) / total;
  if (score >= 0.5) return { score, label: "إيجابي" };
  if (score <= -0.5) return { score, label: "سلبي" };
  return { score, label: "مختلط" };
}

export const getAutoDeepAnalysis = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ generatedAt: string; rows: AutoDeepRow[] }> => {
    // 1. latest scan id
    const { data: scan } = await supabaseAdmin
      .from("scans")
      .select("id")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!scan?.id) return { generatedAt: new Date().toISOString(), rows: [] };

    // 2. top 6 movers from that scan
    const { data: snaps } = await supabaseAdmin
      .from("stock_snapshots")
      .select("symbol, close, change_pct")
      .eq("scan_id", scan.id)
      .order("change_pct", { ascending: false, nullsFirst: false })
      .limit(6);
    if (!snaps?.length) return { generatedAt: new Date().toISOString(), rows: [] };

    const symbols = snaps.map((s) => s.symbol);

    // 3. company info + latest recommendation
    const [{ data: stocks }, { data: recs }] = await Promise.all([
      supabaseAdmin
        .from("stocks")
        .select("symbol, name_ar, sector_ar")
        .in("symbol", symbols),
      supabaseAdmin
        .from("recommendations")
        .select("symbol, signal")
        .eq("scan_id", scan.id)
        .in("symbol", symbols),
    ]);
    const stockMap = new Map((stocks ?? []).map((s) => [s.symbol, s]));
    const recMap = new Map((recs ?? []).map((r) => [r.symbol, r]));

    // 4. auto-fetch news (already AI-scored inside fetchNewsBulk)
    const newsInput = snaps.map((s) => ({
      symbol: s.symbol,
      nameAr: stockMap.get(s.symbol)?.name_ar ?? s.symbol,
    }));
    const newsMap = await fetchNewsBulk(newsInput, 4);

    // 5. merge
    const rows: AutoDeepRow[] = snaps.map((s) => {
      const meta = stockMap.get(s.symbol);
      const rec = recMap.get(s.symbol);
      const news = newsMap.get(s.symbol.toUpperCase());
      const rb = ruleScore(news?.headlines ?? []);
      return {
        symbol: s.symbol,
        name_ar: meta?.name_ar ?? s.symbol,
        sector_ar: meta?.sector_ar ?? null,
        close: Number(s.close ?? 0),
        change_pct: s.change_pct == null ? null : Number(s.change_pct),
        signal: rec?.signal ?? null,
        rule_label: rb.label,
        rule_score: +rb.score.toFixed(2),
        ai_sentiment: news?.sentiment_hint ?? "neutral",
        ai_score: news?.sentiment_score ?? 0,
        headlines: news?.headlines ?? [],
        ai_reason: news?.reason_ar ?? "",
        news_found: news?.found ?? false,
      };
    });

    return { generatedAt: new Date().toISOString(), rows };
  },
);