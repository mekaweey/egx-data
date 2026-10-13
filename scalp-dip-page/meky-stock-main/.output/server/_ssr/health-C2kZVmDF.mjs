import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
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
const getModuleHealth = createServerFn({
  method: "GET"
}).handler(createSsrRpc("4b24fa87a86ffd3cbc59f7ed840a3b5983cf4cda8340206e2508c4807bc802e6"));
const resetModuleHealth = createServerFn({
  method: "POST"
}).inputValidator((data) => data ?? {}).handler(createSsrRpc("b9314d3f21e28c9064790697a40faadc3a3292b23b8c90ed2e1479c8d1e9d428"));
const runOutcomeLoop = createServerFn({
  method: "POST"
}).handler(createSsrRpc("985b7ffce9bdcf8eacbb2c5d54c7e1d97cfd71bc0e08488e0d1f9108c41d5414"));
const STATUS_STYLES = {
  ok: "bg-bull/20 text-bull",
  error: "bg-bear/20 text-bear",
  skipped: "bg-muted text-muted-foreground",
  unknown: "bg-muted text-muted-foreground"
};
function ago(ts) {
  if (!ts) return "—";
  const s = Math.floor((Date.now() - ts) / 1e3);
  if (s < 60) return `${s}ث`;
  if (s < 3600) return `${Math.floor(s / 60)}د`;
  if (s < 86400) return `${Math.floor(s / 3600)}س`;
  return `${Math.floor(s / 86400)}ي`;
}
function HealthPage() {
  const fetchHealth = useServerFn(getModuleHealth);
  const resetFn = useServerFn(resetModuleHealth);
  const ingestFn = useServerFn(runOutcomeLoop);
  const q = useQuery({
    queryKey: ["module-health"],
    queryFn: () => fetchHealth(),
    refetchInterval: 5e3
  });
  const reset = useMutation({
    mutationFn: (name) => resetFn({
      data: {
        name
      }
    }),
    onSuccess: () => q.refetch()
  });
  const ingest = useMutation({
    mutationFn: () => ingestFn(),
    onSuccess: () => q.refetch()
  });
  const data = q.data;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background text-foreground", dir: "rtl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl px-4 py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "صحة الموديولات" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "تحديث تلقائي كل ٥ ثوانٍ — لو في موديول مش شغال هتلاقيه هنا بالخطأ بتاعه" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted", children: "الرئيسية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => ingest.mutate(), disabled: ingest.isPending, className: "rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50", children: "تشغيل حلقة التعلّم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => reset.mutate(void 0), disabled: reset.isPending, className: "rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50", children: "إعادة تفعيل الكل" })
      ] })
    ] }),
    !data && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "جارٍ التحميل…" }),
    data && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "إجمالي", value: data.total }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "شغّال", value: data.ok, cls: "text-bull" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "أخطاء", value: data.error, cls: "text-bear" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "تم تخطّيه", value: data.skipped }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "معطّل تلقائياً", value: data.disabled, cls: "text-bear" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 rounded-xl border border-border bg-card p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "معايرة الثقة (Platt)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-sm", children: [
          "عيّنات: ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: data.calibration.n }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mx-2 text-muted-foreground", children: "|" }),
          "a: ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: data.calibration.a.toFixed(4) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mx-2 text-muted-foreground", children: "|" }),
          "b: ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: data.calibration.b.toFixed(4) })
        ] })
      ] }),
      data.modules.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-6 text-center text-muted-foreground", children: [
        "لسه مفيش سكان اتعمل — افتح ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "text-primary underline", children: "الرئيسية" }),
        " وشغّل سكان عشان الموديولات تبدأ تتسجّل."
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-xl border border-border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/50 text-xs uppercase text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right", children: "الموديول" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right", children: "الحالة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right", children: "نجاح / خطأ / تخطّي" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right", children: "آخر تشغيل" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right", children: "المدة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right", children: "آخر خطأ" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: data.modules.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 font-mono text-xs", children: m.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded px-2 py-0.5 text-xs ${STATUS_STYLES[m.status] ?? ""}`, children: m.disabled ? "معطّل" : m.status }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-3 py-2 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-bull", children: m.successCount }),
            " /",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-bear", children: m.errorCount }),
            " /",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: m.skipCount })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-xs text-muted-foreground", children: ago(m.lastRunAt) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-3 py-2 text-xs text-muted-foreground", children: [
            m.lastDurationMs,
            "ms"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-xs text-bear", title: m.lastError ?? "", children: m.lastError ? m.lastError.slice(0, 80) : "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-left", children: (m.disabled || m.errorCount > 0) && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => reset.mutate(m.name), className: "text-xs text-primary hover:underline", children: "إعادة" }) })
        ] }, m.name)) })
      ] }) })
    ] })
  ] }) });
}
function Stat({
  label,
  value,
  cls = ""
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `mt-1 text-2xl font-bold ${cls}`, children: value })
  ] });
}
export {
  HealthPage as component
};
