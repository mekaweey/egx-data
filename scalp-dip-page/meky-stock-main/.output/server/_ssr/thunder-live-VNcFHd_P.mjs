import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useServerFn, c as createSsrRpc, t as fmtPrice } from "./router-BYsPPCpA.mjs";
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
const getThunderLive = createServerFn({
  method: "GET"
}).handler(createSsrRpc("cabe748d209f45feb625090dbcc2e7cabd23b876e346db4bc8e9403b4e1abeda"));
function fmtAge(s) {
  if (s == null) return "—";
  if (s < 60) return `${s}ث`;
  if (s < 3600) return `${Math.floor(s / 60)}د ${s % 60}ث`;
  return `${Math.floor(s / 3600)}س ${Math.floor(s % 3600 / 60)}د`;
}
function ageColor(s) {
  if (s == null) return "text-muted-foreground";
  if (s < 10) return "text-bull";
  if (s < 60) return "text-emerald-500";
  if (s < 300) return "text-yellow-500";
  return "text-bear";
}
function ThunderLivePage() {
  const fetchLive = useServerFn(getThunderLive);
  const [filter, setFilter] = reactExports.useState("");
  const [autoRefresh, setAutoRefresh] = reactExports.useState(true);
  const q = useQuery({
    queryKey: ["thunder-live"],
    queryFn: () => fetchLive(),
    refetchInterval: autoRefresh ? 3e3 : false,
    refetchOnWindowFocus: true
  });
  const data = q.data;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", className: "mx-auto max-w-7xl space-y-6 p-4 md:p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "Thunder Live · مراقبة البيانات اللحظية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "هل البيانات الواصلة من Thunder Extension حقيقية ولحظية؟ كل المؤشرات هنا." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/thunder", className: "rounded-md border px-3 py-1.5 text-sm hover:bg-muted", children: "← Thunder" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: autoRefresh, onChange: (e) => setAutoRefresh(e.target.checked) }),
          "تحديث كل 3 ثواني"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => q.refetch(), className: "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90", children: "تحديث الآن" })
      ] })
    ] }),
    q.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border p-6 text-center text-sm", children: "جاري التحميل…" }),
    q.error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-bear/40 bg-bear/10 p-4 text-sm text-bear", children: [
      "خطأ: ",
      q.error.message
    ] }),
    data && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(VerdictCard, { data }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SummaryGrid, { data }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FlushChart, { buckets: data.flushBuckets }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(GapHistogram, { gaps: data.gapHistogram })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 lg:grid-cols-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:col-span-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PerSymbolTable, { symbols: data.perSymbol, filter, onFilter: setFilter }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TopMovers, { movers: data.topMovers }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SourcesCard, { sources: data.sourceBreakdown })
        ] })
      ] })
    ] })
  ] });
}
function VerdictCard({
  data
}) {
  const v = data.verdict;
  const tone = v.isLive ? "border-bull/50 bg-bull/10 text-bull" : v.confidence === "high" ? "border-bear/50 bg-bear/10 text-bear" : "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `rounded-2xl border-2 p-5 ${tone}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `relative flex h-4 w-4 ${v.isLive ? "" : "opacity-60"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `absolute inline-flex h-full w-full rounded-full ${v.isLive ? "animate-ping bg-bull/70" : "bg-current/40"}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative inline-flex h-4 w-4 rounded-full bg-current" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xl font-bold", children: v.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-sm opacity-90", children: v.reason })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-end text-xs opacity-80", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: data.marketLabel }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 tabular-nums", children: [
        "القاهرة ",
        data.cairoHHMM
      ] })
    ] })
  ] }) });
}
function Stat({
  label,
  value,
  sub,
  tone
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card p-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `mt-1 text-2xl font-bold tabular-nums ${tone ?? ""}`, children: value }),
    sub && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-[11px] text-muted-foreground", children: sub })
  ] });
}
function SummaryGrid({
  data
}) {
  const s = data.summary;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "آخر flush", value: fmtAge(s.lastFlushAgoSec), sub: s.lastFlushTs ? new Date(s.lastFlushTs).toLocaleTimeString("ar-EG") : "—", tone: ageColor(s.lastFlushAgoSec) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "آخر دقيقة", value: String(s.ticks1m), sub: "tick", tone: s.ticks1m > 0 ? "text-bull" : "text-muted-foreground" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "آخر 5د", value: String(s.ticks5m), sub: "tick" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "آخر 15د", value: String(s.ticks15m), sub: "tick" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "آخر ساعة", value: String(s.ticks1h), sub: `${s.uniqueSymbols1h} سهم` }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "متوسط الفاصل", value: s.avgFlushIntervalSec != null ? `${s.avgFlushIntervalSec}ث` : "—", sub: `${s.distinctFlushes1h} flush/س`, tone: s.avgFlushIntervalSec != null && s.avgFlushIntervalSec < 10 ? "text-bull" : "" })
  ] });
}
function FlushChart({
  buckets
}) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-baseline justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold", children: "نشاط الـ flushes — آخر 60 دقيقة" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "أعمدة طويلة = تدفق مستمر" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-32 items-end gap-[2px]", dir: "ltr", children: buckets.map((b, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { title: `${b.minute} — ${b.count} flush`, className: `flex-1 rounded-t ${b.count > 0 ? "bg-bull/70" : "bg-muted"}`, style: {
      height: `${b.count / max * 100}%`,
      minHeight: b.count > 0 ? 2 : 1
    } }, i)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex justify-between text-[10px] text-muted-foreground tabular-nums", dir: "ltr", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: buckets[0]?.minute }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: buckets[Math.floor(buckets.length / 2)]?.minute }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: buckets[buckets.length - 1]?.minute })
    ] })
  ] });
}
function GapHistogram({
  gaps
}) {
  const total = gaps.reduce((a, b) => a + b.count, 0) || 1;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-baseline justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold", children: "الفواصل بين الـ flushes" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "معظمها <15ث = لحظي حقيقي" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: gaps.map((g) => {
      const pct = g.count / total * 100;
      const good = g.label === "<5s" || g.label === "5-15s";
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 text-xs tabular-nums text-muted-foreground", dir: "ltr", children: g.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-2 rounded-full ${good ? "bg-bull" : "bg-bear/60"}`, style: {
          width: `${pct}%`
        } }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 text-end text-xs tabular-nums", children: g.count })
      ] }, g.label);
    }) })
  ] });
}
function PerSymbolTable({
  symbols,
  filter,
  onFilter
}) {
  const filtered = filter ? symbols.filter((s) => s.symbol.toLowerCase().includes(filter.toLowerCase())) : symbols;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 border-b p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-bold", children: [
        "آخر سعر لكل سهم (",
        filtered.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: filter, onChange: (e) => onFilter(e.target.value), placeholder: "بحث رمز…", className: "rounded-md border bg-background px-2 py-1 text-sm" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-[520px] overflow-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "sticky top-0 bg-card text-xs text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-start", children: "الرمز" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-end", children: "السعر" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-end", children: "التغير" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-end", children: "العمر" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-end", children: "ticks/س" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
        filtered.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b last:border-0 hover:bg-muted/40", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-bold", children: s.symbol }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-end tabular-nums", children: fmtPrice(s.price) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `p-2 text-end tabular-nums ${s.changePct == null ? "text-muted-foreground" : s.changePct >= 0 ? "text-bull" : "text-bear"}`, children: s.changePct == null ? "—" : `${s.changePct >= 0 ? "+" : ""}${s.changePct.toFixed(2)}%` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `p-2 text-end tabular-nums ${ageColor(s.ageSec)}`, children: fmtAge(s.ageSec) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-end tabular-nums", children: s.ticks1h })
        ] }, s.symbol)),
        filtered.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "p-6 text-center text-muted-foreground", children: "لا توجد بيانات" }) })
      ] })
    ] }) })
  ] });
}
function TopMovers({
  movers
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-3 font-bold", children: "أكبر تحركات (آخر ساعة)" }),
    movers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: "لا يوجد تغير في الأسعار — السوق مغلق غالباً." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1.5 text-sm", children: movers.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: m.symbol }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "tabular-nums text-muted-foreground", children: fmtPrice(m.price) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `tabular-nums font-bold ${m.changePct >= 0 ? "text-bull" : "text-bear"}`, children: [
        m.changePct >= 0 ? "+" : "",
        m.changePct.toFixed(2),
        "%"
      ] })
    ] }, m.symbol)) })
  ] });
}
function SourcesCard({
  sources
}) {
  const total = sources.reduce((a, b) => a + b.count, 0) || 1;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-3 font-bold", children: "مصادر البيانات (آخر ساعة)" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-2 text-sm", children: [
      sources.map((s) => {
        const pct = s.count / total * 100;
        const isThunder = s.source === "thunder_ext";
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: isThunder ? "font-bold text-bull" : "", children: s.source }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "tabular-nums", children: [
              s.count,
              " (",
              pct.toFixed(0),
              "%)"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 h-1.5 rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-1.5 rounded-full ${isThunder ? "bg-bull" : "bg-primary/60"}`, style: {
            width: `${pct}%`
          } }) })
        ] }, s.source);
      }),
      sources.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "text-muted-foreground", children: "لا توجد بيانات" })
    ] })
  ] });
}
export {
  ThunderLivePage as component
};
