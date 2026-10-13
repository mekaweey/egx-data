import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useServerFn, G as computeScalpFeasibility, c as createSsrRpc } from "./router-BYsPPCpA.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import "../_libs/mendable__firecrawl-js.mjs";
import "../_libs/sonner.mjs";
import "../_libs/seroval.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "./market-hours-CyHCW23Z.mjs";
import "./client.server-D5ro3rAQ.mjs";
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
import "./client-DcfJRNR2.mjs";
import "node:fs";
import "node:path";
import "node:child_process";
import "./outcome-loop.server-BOECsdkT.mjs";
import "./auto-orchestrator.server-Cobs3ZBw.mjs";
import "./tier-k-intelligence.server-IqAM99dH.mjs";
import "./run-scan.server-C7KKLuW0.mjs";
import "./tradingview.server-ASbxwkih.mjs";
import "./levels.server-DPpGzyqT.mjs";
import "../_libs/technicalindicators.mjs";
import "./yahoo.server-Coiq-pQ8.mjs";
import "../_libs/ai.mjs";
import "../_libs/ai-sdk__gateway.mjs";
import "../_libs/ai-sdk__provider-utils.mjs";
import "../_libs/ai-sdk__provider.mjs";
import "../_libs/eventsource-parser.mjs";
import "../_libs/zod.mjs";
import "../_libs/@vercel/oidc.mjs";
import "path";
import "fs";
import "os";
import "../_libs/opentelemetry__api.mjs";
import "./news.server-DBo8FnwV.mjs";
import "../_libs/ai-sdk__openai-compatible.mjs";
import "./pattern-memory.server-BKGG6vXj.mjs";
import "./tier-i-intelligence.server-Ddugl3s6.mjs";
import "./isotonic-calibration.server-CgJbsL0r.mjs";
import "node:zlib";
import "crypto";
import "./self-calibration.server-DafiNwz-.mjs";
import "./engine.server-K_Mwkd4b.mjs";
import "./strategy.server-BM-ZfGqV.mjs";
import "./blocklist-BkSBV-pn.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:http";
import "node:stream/promises";
import "node:https";
import "node:http2";
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
const listFeasibility = createServerFn({
  method: "GET"
}).inputValidator((input) => input).handler(createSsrRpc("6146a667bbc3055ca6b144d502e799f5912a769fcecfb2a9e3c56031f618d896"));
function verdictBadge(v) {
  const map = {
    profit: "bg-green-500/15 text-green-500 border-green-500/30",
    breakeven: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
    thin: "bg-orange-500/15 text-orange-500 border-orange-500/30",
    slow: "bg-blue-500/15 text-blue-500 border-blue-500/30",
    loss: "bg-red-500/15 text-red-500 border-red-500/30",
    stuck: "bg-muted text-muted-foreground border-border"
  };
  const label = {
    profit: "✅ ربح مؤكد",
    breakeven: "⚖️ تعادل",
    thin: "⚠️ سيولة رقيقة",
    slow: "🐢 بطيء (>60s)",
    loss: "❌ خسارة",
    stuck: "— بيانات ناقصة"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full border px-2 py-0.5 text-xs font-semibold ${map[v] || "border-border"}`, children: label[v] || v });
}
function fmt(n, digits = 2) {
  if (n === null || n === void 0 || Number.isNaN(Number(n))) return "—";
  return Number(n).toFixed(digits);
}
function fmtPct(n) {
  if (n === null || n === void 0) return "—";
  return `${(Number(n) * 100).toFixed(2)}%`;
}
function FeasibilityPage() {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const [tradeDate, setTradeDate] = reactExports.useState(today);
  const listFn = useServerFn(listFeasibility);
  const recomputeFn = useServerFn(computeScalpFeasibility);
  const q = useQuery({
    queryKey: ["scalp-feasibility", tradeDate],
    queryFn: () => listFn({
      data: {
        tradeDate
      }
    }),
    refetchInterval: 6e4
  });
  const rows = q.data?.rows || [];
  const total = rows.length;
  const byVerdict = rows.reduce((acc, r) => {
    acc[r.exit_verdict] = (acc[r.exit_verdict] || 0) + 1;
    return acc;
  }, {});
  const profit = byVerdict.profit || 0;
  const breakeven = byVerdict.breakeven || 0;
  const thin = byVerdict.thin || 0;
  const slow = byVerdict.slow || 0;
  const loss = byVerdict.loss || 0;
  const stuck = byVerdict.stuck || 0;
  const denom = total - stuck;
  const winRate = denom > 0 ? (profit / denom * 100).toFixed(1) : "—";
  const safeRate = denom > 0 ? ((profit + breakeven) / denom * 100).toFixed(1) : "—";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background text-foreground", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "border-b border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-4 py-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold", children: "تقرير جدوى إشارات Scalp" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "كل رقم مأخوذ من prints فعلية في live_ticks — بدون تخمين" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/scalp", className: "text-sm text-primary hover:underline", children: "← رجوع لصفحة Scalp" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "mx-auto max-w-7xl px-4 py-6 space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm", children: "تاريخ التداول:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "date", value: tradeDate, onChange: (e) => setTradeDate(e.target.value), className: "rounded border border-border bg-background px-3 py-1.5 text-sm" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: async () => {
          await recomputeFn({
            data: {
              tradeDate
            }
          });
          q.refetch();
        }, className: "rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground", children: "إعادة الحساب الآن" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "(بيتحسب تلقائياً كل يوم بعد قفل السوق)" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-7 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SummaryCard, { label: "إجمالي الإشارات", value: total }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SummaryCard, { label: "✅ ربح مؤكد", value: profit, tone: "green" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SummaryCard, { label: "⚖️ تعادل", value: breakeven, tone: "yellow" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SummaryCard, { label: "⚠️ سيولة رقيقة", value: thin, tone: "orange" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SummaryCard, { label: "🐢 بطيء", value: slow }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SummaryCard, { label: "❌ خسارة", value: loss, tone: "red" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SummaryCard, { label: "بيانات ناقصة", value: stuck })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "نسبة الربح المؤكد (بعد استبعاد stuck)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-3xl font-bold text-green-500 mt-1", children: [
            winRate,
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "نسبة النجاة (ربح أو تعادل)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-3xl font-bold text-primary mt-1", children: [
            safeRate,
            "%"
          ] })
        ] })
      ] }),
      q.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "جاري التحميل..." }),
      q.error && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-red-500", children: [
        "خطأ: ",
        q.error.message
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto rounded-lg border border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "الوقت" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "السهم" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "الدخول" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "التارجت" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "دخول متاح؟" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "t→target" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "Prints ≥ target" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "Vol @target" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "أعلى/60s" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "أسوأ خسارة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "L2 depth" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "الحكم" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
          rows.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: new Date(r.signal_ts).toLocaleTimeString("ar-EG", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
            }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-semibold", children: r.symbol }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: fmt(r.entry_price) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-muted-foreground", children: fmt(r.target_price) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: r.entry_feasible === true ? `✓ (${r.entry_delay_sec ?? 0}s)` : r.entry_feasible === false ? "✗" : "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: r.time_to_target_sec !== null ? `${r.time_to_target_sec}s` : "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-mono", children: r.prints_at_target_count }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-mono", children: r.prints_at_target_volume }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: fmt(r.max_price_60s) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-red-500", children: fmtPct(r.worst_case_loss_pct) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: r.l2_bid_depth_top5 !== null ? fmt(r.l2_bid_depth_top5, 0) : "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: verdictBadge(r.exit_verdict) })
          ] }, r.id)),
          !q.isLoading && rows.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 12, className: "p-6 text-center text-muted-foreground", children: 'مفيش إشارات (would_open) في اليوم ده. اضغط "إعادة الحساب" لو الإشارات لسه ما اتحسبتش.' }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border p-4 text-xs text-muted-foreground space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: 'حكم "ربح مؤكد":' }),
          " 3+ prints عند سعر ≥ target خلال دقيقة. كل print = صفقة حقيقية اتنفذت فعلاً بين مشتري وبايع."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: 'حكم "سيولة رقيقة":' }),
          " 1-2 print بس عند التارجت خلال 60s — wick محتمل، مش سيولة كافية للخروج بحجم."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: 'حكم "بطيء":' }),
          " السعر وصل التارجت لكن بعد الـ 60s — محتاج انتظار طويل ومش scalp حقيقي."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Target:" }),
          " entry × 1.005 |",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Breakeven:" }),
          " entry × 1.0012 (تقريباً كاسر العمولة)"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-orange-500", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "ملاحظة:" }),
          " live_ticks.volume دايماً NULL (ثاندر مش بيبعت حجم كل صفقة في الـ long-poll)، فالحكم مبني على عدد الـ prints فقط — وده كافي لأن كل print = صفقة مؤكدة."
        ] })
      ] })
    ] })
  ] });
}
function SummaryCard({
  label,
  value,
  tone
}) {
  const toneClass = tone === "green" ? "text-green-500" : tone === "yellow" ? "text-yellow-500" : tone === "orange" ? "text-orange-500" : tone === "red" ? "text-red-500" : "text-foreground";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border p-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-2xl font-bold mt-1 ${toneClass}`, children: value })
  ] });
}
export {
  FeasibilityPage as component
};
