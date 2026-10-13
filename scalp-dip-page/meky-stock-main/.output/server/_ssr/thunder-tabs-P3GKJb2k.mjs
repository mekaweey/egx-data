import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { c as createSsrRpc } from "./router-BYsPPCpA.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import "../_libs/mendable__firecrawl-js.mjs";
import "../_libs/sonner.mjs";
import "../_libs/seroval.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-router.mjs";
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
const getLatestTabTelemetry = createServerFn({
  method: "GET"
}).handler(createSsrRpc("ed217c894431aa80c22ea8e84255ac31bf285a6c93995faf1d09320ab3e7dde0"));
function fmtAge(sec) {
  if (sec == null || !Number.isFinite(sec)) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60), s = sec % 60;
  if (m < 60) return `${m}m${s}s`;
  const h = Math.floor(m / 60), mr = m % 60;
  return `${h}h${mr}m`;
}
function ThunderTabsPage() {
  const q = useQuery({
    queryKey: ["thunder-tabs-telemetry"],
    queryFn: () => getLatestTabTelemetry(),
    refetchInterval: 1e4,
    staleTime: 5e3
  });
  const tabs = q.data?.tabs || [];
  const now = Date.now();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", className: "max-w-5xl mx-auto p-6 space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "📊 تشخيص تابات L2 (حي — كل 10 ثواني)" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "كل صف = تاب L2 مفتوحة في الاكستنشn. البيانات بتتبعت من الاكستنشن كل 60 ثانية. آخر 10 دقايق فقط." }),
    q.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "جاري التحميل…" }),
    q.error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-red-500", children: [
      "فشل: ",
      String(q.error.message)
    ] }),
    !q.isLoading && tabs.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 p-4 rounded", children: "مفيش تليمتري لسه. تأكد الاكستنشن v4.1.89+ شغّالة ومفعّل L2 Cycle." }),
    tabs.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm border-collapse", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "السهم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "Uptime" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "Snapshots" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "آخر snapshot" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "L2 fresh" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "L2 age" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "Panel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "آخر ensure" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "آخر report" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: tabs.slice().sort((a, b) => String(a.symbol).localeCompare(String(b.symbol))).map((t) => {
        const snapAge = t.last_snapshot_age_sec;
        const reportAge = Math.round((now - new Date(t.ts).getTime()) / 1e3);
        const color = snapAge == null ? "bg-red-950/40" : snapAge < 60 ? "bg-green-950/40" : snapAge < 300 ? "bg-amber-950/40" : "bg-red-950/40";
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: `border-b ${color}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-mono font-bold", children: t.symbol }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: fmtAge(t.uptime_sec) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: t.snapshots_sent ?? 0 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: fmtAge(t.last_snapshot_age_sec) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: t.last_l2_fresh === true ? "✓" : t.last_l2_fresh === false ? "✗" : "?" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: fmtAge(t.last_l2_age_sec) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-xs", children: t.panel_state ?? "?" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: fmtAge(t.last_ensure_age_sec) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-2 text-xs text-muted-foreground", children: [
            "منذ ",
            fmtAge(reportAge)
          ] })
        ] }, `${t.client_id}::${t.symbol}`);
      }) })
    ] }) })
  ] });
}
export {
  ThunderTabsPage as component
};
