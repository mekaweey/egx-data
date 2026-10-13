import { c as createServerRpc } from "./createServerRpc-BEwYw6bn.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { g as generateText } from "../_libs/ai.mjs";
import { g as getAiGateway, A as AI_MODEL, f as fetchNewsBulk } from "./news.server-DBo8FnwV.mjs";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "../_libs/mendable__firecrawl-js.mjs";
import { o as object, c as array, b as string } from "../_libs/zod.mjs";
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
import "../_libs/ai-sdk__gateway.mjs";
import "../_libs/ai-sdk__provider-utils.mjs";
import "../_libs/ai-sdk__provider.mjs";
import "../_libs/eventsource-parser.mjs";
import "../_libs/@vercel/oidc.mjs";
import "path";
import "fs";
import "os";
import "../_libs/opentelemetry__api.mjs";
import "../_libs/ai-sdk__openai-compatible.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/axios.mjs";
import "../_libs/form-data.mjs";
import "../_libs/combined-stream.mjs";
import "../_libs/delayed-stream.mjs";
import "http";
import "https";
import "url";
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
import "../_libs/has-flag.mjs";
import "zlib";
import "events";
import "../_libs/zod-to-json-schema.mjs";
function bucket(score) {
  if (score >= 0.6) return "إيجابي قوي";
  if (score >= 0.2) return "إيجابي";
  if (score <= -0.6) return "سلبي قوي";
  if (score <= -0.2) return "سلبي";
  return "محايد";
}
function extractJson(text) {
  const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
  const s = cleaned.indexOf("{");
  const e = cleaned.lastIndexOf("}");
  if (s === -1 || e === -1) throw new Error("no JSON in response");
  return JSON.parse(cleaned.slice(s, e + 1));
}
const analyzeNewsImpactAI_createServerFn_handler = createServerRpc({
  id: "4b6ba4d96a85210e8d8edcabb8ac9b2456ca8f1f053914ff44216a765ef5b706",
  name: "analyzeNewsImpactAI",
  filename: "src/lib/hybrid/deep-analysis.functions.ts"
}, (opts) => analyzeNewsImpactAI.__executeServer(opts));
const analyzeNewsImpactAI = createServerFn({
  method: "POST"
}).inputValidator((input) => object({
  symbol: string().min(1).max(20),
  company_ar: string().min(1).max(200),
  headlines: array(string().min(3).max(500)).min(1).max(20)
}).parse(input)).handler(analyzeNewsImpactAI_createServerFn_handler, async ({
  data
}) => {
  const gateway = getAiGateway();
  const {
    text
  } = await generateText({
    model: gateway(AI_MODEL),
    system: ["أنت محلل أخبار مالية محترف للبورصة المصرية.", "حلل تأثير الأخبار على سعر السهم بدقة. انتبه للسياق:", "- 'تراجع الخسائر' = إيجابي", "- 'أرباح أقل من المتوقع' = سلبي رغم وجود أرباح", "- 'استحواذ / توسع / عقد جديد' = إيجابي عادة", "- 'تحقيق / غرامة / استقالة' = سلبي", "أجب بـ JSON فقط بهذا الشكل:", '{"score": رقم من -1 إلى 1, "summary": "ملخص سطرين", "points": ["نقطة 1", "نقطة 2"], "action": "اقتراح للمستثمر"}'].join("\n"),
    prompt: [`الشركة: ${data.company_ar} (${data.symbol})`, "العناوين:", ...data.headlines.map((h, i) => `${i + 1}. ${h}`)].join("\n"),
    temperature: 0.2
  });
  const parsed = extractJson(text);
  const score = Math.max(-1, Math.min(1, Number(parsed.score) || 0));
  return {
    score: +score.toFixed(2),
    sentiment: bucket(score),
    summary_ar: String(parsed.summary ?? "").slice(0, 600),
    key_points: (parsed.points ?? []).slice(0, 6).map(String),
    action_ar: String(parsed.action ?? "").slice(0, 300)
  };
});
const summarizeReportAI_createServerFn_handler = createServerRpc({
  id: "5ebde02fc9cb42e78b75f4aa5fcc0830c6f3347c5a32a5bd4d4ebffc2e2de3f1",
  name: "summarizeReportAI",
  filename: "src/lib/hybrid/deep-analysis.functions.ts"
}, (opts) => summarizeReportAI.__executeServer(opts));
const summarizeReportAI = createServerFn({
  method: "POST"
}).inputValidator((input) => object({
  company_ar: string().min(1).max(200),
  // user pastes raw text extracted from the PDF financial report
  report_text: string().min(50).max(5e4)
}).parse(input)).handler(summarizeReportAI_createServerFn_handler, async ({
  data
}) => {
  const gateway = getAiGateway();
  const {
    text
  } = await generateText({
    model: gateway(AI_MODEL),
    system: ["أنت محلل مالي خبير في تقارير الشركات المصرية.", "لخّص التقرير المالي بالعربية بدقة وبدون اختراع أرقام.", "ركز على: الإيرادات، صافي الربح، الهامش، مقارنة بالعام السابق، والمخاطر.", "أجب بـ JSON فقط:", '{"headline":"سطر واحد","revenue":"التغير في الإيرادات","profit":"التغير في الأرباح","highlights":["نقطة قوة 1","..."],"risks":["مخاطرة 1","..."],"verdict":"التوصية النهائية"}'].join("\n"),
    prompt: [`الشركة: ${data.company_ar}`, "نص التقرير المالي:", data.report_text.slice(0, 4e4)].join("\n"),
    temperature: 0.1
  });
  const parsed = extractJson(text);
  return {
    headline_ar: String(parsed.headline ?? "").slice(0, 240),
    revenue_change_ar: String(parsed.revenue ?? "").slice(0, 240),
    profit_change_ar: String(parsed.profit ?? "").slice(0, 240),
    highlights: (parsed.highlights ?? []).slice(0, 8).map(String),
    risks: (parsed.risks ?? []).slice(0, 8).map(String),
    verdict_ar: String(parsed.verdict ?? "").slice(0, 400)
  };
});
const POS_KW = ["أرباح", "نمو", "ارتفاع", "استحواذ", "توسع", "عقد", "توزيع", "تراجع الخسائر"];
const NEG_KW = ["خسائر", "تراجع", "هبوط", "غرامة", "تحقيق", "استقالة", "تعثر", "شطب"];
function ruleScore(headlines) {
  let pos = 0;
  let neg = 0;
  for (const h of headlines) {
    for (const k of POS_KW) if (h.includes(k)) pos++;
    for (const k of NEG_KW) if (h.includes(k)) neg++;
  }
  const total = pos + neg;
  if (total === 0) return {
    score: 0,
    label: "محايد"
  };
  const score = (pos - neg) / total;
  if (score >= 0.5) return {
    score,
    label: "إيجابي"
  };
  if (score <= -0.5) return {
    score,
    label: "سلبي"
  };
  return {
    score,
    label: "مختلط"
  };
}
const getAutoDeepAnalysis_createServerFn_handler = createServerRpc({
  id: "960f51279087a9cf413c6386776d2ead86b7900c86f423102192916ec9cb7384",
  name: "getAutoDeepAnalysis",
  filename: "src/lib/hybrid/deep-analysis.functions.ts"
}, (opts) => getAutoDeepAnalysis.__executeServer(opts));
const getAutoDeepAnalysis = createServerFn({
  method: "GET"
}).handler(getAutoDeepAnalysis_createServerFn_handler, async () => {
  const {
    data: scan
  } = await supabaseAdmin.from("scans").select("id").order("started_at", {
    ascending: false
  }).limit(1).maybeSingle();
  if (!scan?.id) return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    rows: []
  };
  const {
    data: snaps
  } = await supabaseAdmin.from("stock_snapshots").select("symbol, close, change_pct").eq("scan_id", scan.id).order("change_pct", {
    ascending: false,
    nullsFirst: false
  }).limit(6);
  if (!snaps?.length) return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    rows: []
  };
  const symbols = snaps.map((s) => s.symbol);
  const [{
    data: stocks
  }, {
    data: recs
  }] = await Promise.all([supabaseAdmin.from("stocks").select("symbol, name_ar, sector_ar").in("symbol", symbols), supabaseAdmin.from("recommendations").select("symbol, signal").eq("scan_id", scan.id).in("symbol", symbols)]);
  const stockMap = new Map((stocks ?? []).map((s) => [s.symbol, s]));
  const recMap = new Map((recs ?? []).map((r) => [r.symbol, r]));
  const newsInput = snaps.map((s) => ({
    symbol: s.symbol,
    nameAr: stockMap.get(s.symbol)?.name_ar ?? s.symbol
  }));
  const newsMap = await fetchNewsBulk(newsInput, 4);
  const rows = snaps.map((s) => {
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
      news_found: news?.found ?? false
    };
  });
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    rows
  };
});
export {
  analyzeNewsImpactAI_createServerFn_handler,
  getAutoDeepAnalysis_createServerFn_handler,
  summarizeReportAI_createServerFn_handler
};
