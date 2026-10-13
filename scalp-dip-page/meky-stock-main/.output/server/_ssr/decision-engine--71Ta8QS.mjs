import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { u as useServerFn, c as createSsrRpc } from "./router-BYsPPCpA.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import "../_libs/mendable__firecrawl-js.mjs";
import "../_libs/sonner.mjs";
import "../_libs/seroval.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__query-core.mjs";
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
import "./self-calibration.server-DafiNwz-.mjs";
import "./engine.server-K_Mwkd4b.mjs";
import "./strategy.server-BM-ZfGqV.mjs";
import "./blocklist-BkSBV-pn.mjs";
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
const runDecisionEngine = createServerFn({
  method: "POST"
}).inputValidator((data) => ({
  days: Math.max(3, Math.min(60, data?.days ?? 14))
})).handler(createSsrRpc("9f28297d28e79acffc175c7937bd59fcdf22f0ce32145ad870f5489e3ded2022"));
const listDecisionSuggestions = createServerFn({
  method: "GET"
}).inputValidator((data) => ({
  status: data?.status
})).handler(createSsrRpc("60005308d8d79969383950cb24ddf438f3bde1e9211d63caf626702d5ff70d11"));
const applyDecisionSuggestion = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("45c3f4d3de703a3a86610fffd645a972e2ec818f0b61ff70403281794029a812"));
const rejectDecisionSuggestion = createServerFn({
  method: "POST"
}).inputValidator((data) => data).handler(createSsrRpc("3e28ac361a5a6447c80d39738ac9076fbc64c197b520dd015ff137da78172bc1"));
const categoryLabel = {
  prebuy_filter: "🔇 فلتر السيولة قبل الشراء",
  shadow_promotion: "👁 ترقية Smart-Exit من shadow إلى live",
  tp_target: "🎯 معايرة هدف الربح (TP)",
  sl_stop: "🛑 معايرة حد الخسارة (SL)"
};
function Page() {
  const qc = useQueryClient();
  const [days, setDays] = reactExports.useState(14);
  const listFn = useServerFn(listDecisionSuggestions);
  const runFn = useServerFn(runDecisionEngine);
  const applyFn = useServerFn(applyDecisionSuggestion);
  const rejectFn = useServerFn(rejectDecisionSuggestion);
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ["decision-suggestions"],
    queryFn: () => listFn({
      data: {}
    }),
    refetchInterval: 15e3
  });
  const runMut = useMutation({
    mutationFn: () => runFn({
      data: {
        days
      }
    }),
    onSuccess: () => qc.invalidateQueries({
      queryKey: ["decision-suggestions"]
    })
  });
  const applyMut = useMutation({
    mutationFn: (id) => applyFn({
      data: {
        id
      }
    }),
    onSuccess: () => qc.invalidateQueries({
      queryKey: ["decision-suggestions"]
    })
  });
  const rejectMut = useMutation({
    mutationFn: (id) => rejectFn({
      data: {
        id
      }
    }),
    onSuccess: () => qc.invalidateQueries({
      queryKey: ["decision-suggestions"]
    })
  });
  const rows = data?.rows ?? [];
  const pending = rows.filter((r) => r.status === "pending");
  const handled = rows.filter((r) => r.status !== "pending");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 max-w-5xl mx-auto space-y-6", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "🧠 Decision Engine" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600", children: "بيحلل صفقاتك الحقيقية والإشارات الضايعة وقرارات Smart-Exit ويقترح تعديلات مبنية على الأدلة. الاقتراحات لا تُطبّق تلقائيًا — أنت تختار." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-sm", children: [
          "آخر",
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: 3, max: 60, value: days, onChange: (e) => setDays(Math.max(3, Math.min(60, Number(e.target.value) || 14))), className: "mx-1 w-16 rounded border px-2 py-1 text-sm text-center" }),
          "يوم"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => runMut.mutate(), disabled: runMut.isPending, className: "px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60", children: runMut.isPending ? "…جاري التحليل" : "شغّل التحليل" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/marketwatch-health", className: "text-sm text-blue-600 hover:underline", children: "← العودة" })
      ] })
    ] }),
    runMut.data && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border bg-emerald-50 p-3 text-sm text-emerald-900", children: [
      "✅ التحليل تم — اقتراحات جديدة: ",
      runMut.data.suggestions_created,
      "· صفقات محسوبة: ",
      runMut.data.stats.paper_trades_total,
      "· win rate: ",
      (runMut.data.stats.win_rate * 100).toFixed(0),
      "% · TP/SL/Trail: ",
      runMut.data.stats.tp_hits,
      "/",
      runMut.data.stats.sl_hits,
      "/",
      runMut.data.stats.trail_hits
    ] }),
    runMut.error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border bg-red-50 p-3 text-sm text-red-700", children: [
      "خطأ: ",
      String(runMut.error.message)
    ] }),
    isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-gray-500", children: "جاري التحميل…" }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-red-600", children: [
      "خطأ: ",
      String(error.message)
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-lg font-bold mb-2", children: [
        "🟡 اقتراحات في انتظار قرارك (",
        pending.length,
        ")"
      ] }),
      !pending.length && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-500 border rounded p-4 bg-white", children: 'لا توجد اقتراحات معلّقة. اضغط "شغّل التحليل" لبدء الفحص.' }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: pending.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(SuggestionCard, { s, onApply: () => applyMut.mutate(s.id), onReject: () => rejectMut.mutate(s.id), busy: applyMut.isPending || rejectMut.isPending }, s.id)) })
    ] }),
    handled.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-lg font-bold mb-2", children: [
        "📜 السجل (",
        handled.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: handled.slice(0, 30).map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border rounded p-3 bg-gray-50 text-sm flex items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: categoryLabel[s.category] ?? s.category }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-gray-600", children: s.rationale }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 mt-1", children: new Date(s.created_at).toLocaleString("ar-EG", {
            timeZone: "Africa/Cairo"
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs px-2 py-0.5 rounded ${s.status === "applied" ? "bg-emerald-100 text-emerald-800" : s.status === "rejected" ? "bg-gray-200 text-gray-700" : "bg-yellow-100 text-yellow-800"}`, children: s.status === "applied" ? "طُبِّق" : s.status === "rejected" ? "مرفوض" : s.status })
      ] }, s.id)) })
    ] })
  ] });
}
function SuggestionCard({
  s,
  onApply,
  onReject,
  busy
}) {
  const isToggle = s.action_type === "toggle";
  const conf = s.confidence != null ? Math.round(s.confidence * 100) : null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border rounded-lg bg-white p-4 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold", children: categoryLabel[s.category] ?? s.category }),
        conf != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `text-xs px-2 py-0.5 rounded ${conf >= 70 ? "bg-emerald-100 text-emerald-800" : conf >= 40 ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-700"}`, children: [
          "ثقة ",
          conf,
          "%"
        ] }),
        !isToggle && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800", children: "استشاري" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-700 mt-1", children: s.rationale }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-600 mt-2 flex flex-wrap gap-3", children: [
        s.target_key && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "الإعداد: ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "bg-gray-100 px-1 rounded", children: s.target_key })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "الحالي: ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: s.current_value ?? "—" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "المقترح: ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { className: "text-blue-700", children: s.suggested_value ?? "—" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "مبني على ",
          s.evidence_days,
          " يوم"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { className: "mt-2 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("summary", { className: "cursor-pointer text-gray-500 hover:text-gray-700", children: "الأدلة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "bg-gray-50 border rounded p-2 mt-1 overflow-x-auto text-[11px]", children: JSON.stringify(s.evidence, null, 2) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 shrink-0", children: [
      isToggle ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onApply, disabled: busy, className: "px-3 py-1.5 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-60", children: "تطبيق" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("button", { disabled: true, title: "يتطلب تعديل الكود يدوياً", className: "px-3 py-1.5 rounded bg-gray-300 text-gray-600 text-sm cursor-not-allowed", children: "يدوي" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onReject, disabled: busy, className: "px-3 py-1.5 rounded border text-sm hover:bg-gray-50 disabled:opacity-60", children: "رفض" })
    ] })
  ] }) });
}
export {
  Page as component
};
