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
const getExtensionOverview = createServerFn({
  method: "GET"
}).handler(createSsrRpc("1d76a569886393f81a39eabd66b64b62066237a0c125560028dc291bf300cf23"));
function fmtAge(sec) {
  if (sec == null || !Number.isFinite(sec)) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60), s = sec % 60;
  if (m < 60) return `${m}m${s}s`;
  const h = Math.floor(m / 60), mr = m % 60;
  return `${h}h${mr}m`;
}
function agoSec(iso) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.round((Date.now() - t) / 1e3));
}
function ageColor(sec) {
  if (sec == null) return "text-muted-foreground";
  if (sec < 15) return "text-green-500";
  if (sec < 90) return "text-emerald-500";
  if (sec < 300) return "text-yellow-500";
  return "text-red-500";
}
function Card({
  title,
  value,
  sub,
  tone = "default"
}) {
  const bg = tone === "good" ? "bg-green-950/30 border-green-800/50" : tone === "warn" ? "bg-amber-950/30 border-amber-800/50" : tone === "bad" ? "bg-red-950/30 border-red-800/50" : "bg-card border-border";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-lg border p-3 ${bg}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold mt-1", children: value }),
    sub && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mt-1", children: sub })
  ] });
}
function ExtensionTelemetryPage() {
  const q = useQuery({
    queryKey: ["extension-overview"],
    queryFn: () => getExtensionOverview(),
    refetchInterval: 1e4,
    staleTime: 5e3
  });
  const d = q.data;
  const lastTickAge = agoSec(d?.summary.lastTickTs);
  const lastSnapAge = agoSec(d?.summary.lastSnapTs);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", className: "max-w-7xl mx-auto p-4 md:p-6 space-y-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between flex-wrap gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "📡 Extension Telemetry — حي كل 10 ثواني" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-muted-foreground", children: [
        d?.marketOpen ? "🟢 السوق مفتوح" : "🔴 السوق مغلق",
        " · تحديث: ",
        q.dataUpdatedAt ? new Date(q.dataUpdatedAt).toLocaleTimeString("ar-EG") : "—"
      ] })
    ] }),
    q.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "جاري التحميل…" }),
    q.error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-red-500", children: [
      "فشل: ",
      String(q.error.message)
    ] }),
    d && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { title: "تابات L2 مفتوحة", value: d.summary.tabsCount, sub: "آخر 10 دقائق", tone: d.summary.tabsCount > 0 ? "good" : d.marketOpen ? "bad" : "default" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { title: "أسهم إشارات (متوقع فتحها)", value: d.summary.signalsCount, sub: `${d.missingSignals.length} لسه لم تفتح`, tone: d.missingSignals.length === 0 ? "good" : d.marketOpen ? "warn" : "default" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { title: "Ticks آخر ساعة", value: d.summary.ticks1h.toLocaleString("en"), sub: `${d.summary.ticks5m} آخر 5 دقائق`, tone: d.summary.ticks5m > 0 ? "good" : d.marketOpen ? "bad" : "default" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { title: "L2 Snapshots آخر ساعة", value: d.summary.snaps1h.toLocaleString("en"), sub: `${d.summary.snaps5m} آخر 5 دقائق`, tone: d.summary.snaps5m > 0 ? "good" : d.marketOpen ? "warn" : "default" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border p-3 bg-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "آخر tick سعر" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-bold", children: d.summary.lastTickSymbol ?? "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `mr-2 ${ageColor(lastTickAge)}`, children: [
              "منذ ",
              fmtAge(lastTickAge)
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: d.summary.lastTickTs ?? "—" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border p-3 bg-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "آخر L2 snapshot" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-bold", children: d.summary.lastSnapSymbol ?? "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `mr-2 ${ageColor(lastSnapAge)}`, children: [
              "منذ ",
              fmtAge(lastSnapAge)
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: d.summary.lastSnapTs ?? "—" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border p-3 bg-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-semibold mb-2", children: [
          "🎯 الأسهم المتوقع فتح L2 لها (",
          d.signals.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-1.5", children: [
          d.signals.map((sym) => {
            const isOpen = d.tabs.some((t) => t.symbol === sym.toUpperCase());
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `px-2 py-0.5 rounded text-xs font-mono ${isOpen ? "bg-green-900/50 text-green-200" : "bg-amber-900/50 text-amber-200"}`, title: isOpen ? "تاب مفتوح" : "لم يفتح بعد", children: [
              sym,
              " ",
              isOpen ? "✓" : "…"
            ] }, sym);
          }),
          d.signals.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "مفيش إشارات دلوقتي" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold mb-2", children: "🗂️ تابات L2 (تفصيل)" }),
        d.tabs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border p-3 bg-amber-950/30 text-amber-200 text-sm", children: [
          "مفيش تابات مفتوحة دلوقتي. ",
          d.marketOpen ? "لو السوق مفتوح والاكستنشن شغال، ده مؤشر مشكلة." : "طبيعي لأن السوق مغلق."
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto rounded border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "السهم" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "Uptime" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "Snapshots" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "آخر snapshot" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "L2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "Panel" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "Trigger" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "آخر ensure" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "آخر report" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: d.tabs.slice().sort((a, b) => String(a.symbol).localeCompare(String(b.symbol))).map((t) => {
            const snapAge = t.last_snapshot_age_sec;
            const reportAge = agoSec(t.ts);
            const rowBg = snapAge == null ? "bg-red-950/20" : snapAge < 60 ? "" : snapAge < 300 ? "bg-amber-950/20" : "bg-red-950/20";
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: `border-t ${rowBg}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-mono font-bold", children: t.symbol }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: fmtAge(t.uptime_sec) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: t.snapshots_sent }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `p-2 ${ageColor(snapAge)}`, children: fmtAge(snapAge) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-2", children: [
                t.last_l2_fresh === true ? "✓" : t.last_l2_fresh === false ? "✗" : "?",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground mr-1", children: fmtAge(t.last_l2_age_sec) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-xs", children: t.panel_state ?? "?" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-xs", children: t.has_trigger === true ? "✓" : t.has_trigger === false ? "✗" : "?" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: fmtAge(t.last_ensure_age_sec) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-xs text-muted-foreground", children: fmtAge(reportAge) })
            ] }, `${t.client_id}::${t.symbol}`);
          }) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-semibold mb-2", children: [
          "💹 Ticks آخر 5 دقائق (",
          d.ticksPerSymbol.length,
          " سهم)"
        ] }),
        d.ticksPerSymbol.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "مفيش ticks" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1.5", children: d.ticksPerSymbol.slice(0, 30).map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border bg-card p-2 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono font-bold", children: t.symbol }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-muted-foreground", children: [
            t.count,
            " tick · ",
            t.lastPrice
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `text-[10px] ${ageColor(agoSec(t.lastTs))}`, children: [
            "منذ ",
            fmtAge(agoSec(t.lastTs))
          ] })
        ] }, t.symbol)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-semibold mb-2", children: [
          "📖 L2 Snapshots آخر 5 دقائق (",
          d.snapsPerSymbol.length,
          " سهم)"
        ] }),
        d.snapsPerSymbol.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "مفيش snapshots" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1.5", children: d.snapsPerSymbol.slice(0, 30).map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border bg-card p-2 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono font-bold", children: s.symbol }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-muted-foreground", children: [
            s.count,
            " snap"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px]", children: [
            "bid ",
            s.bid ?? "—",
            " · ask ",
            s.ask ?? "—"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `text-[10px] ${ageColor(agoSec(s.lastTs))}`, children: [
            "منذ ",
            fmtAge(agoSec(s.lastTs))
          ] })
        ] }, s.symbol)) })
      ] })
    ] })
  ] });
}
export {
  ExtensionTelemetryPage as component
};
