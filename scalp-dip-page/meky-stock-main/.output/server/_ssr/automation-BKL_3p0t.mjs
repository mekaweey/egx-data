import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { s as snapshotQO } from "./router-BYsPPCpA.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { c as useSuspenseQuery } from "../_libs/tanstack__react-query.mjs";
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
import "./server-BpMZvK1r.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:http";
import "node:stream/promises";
import "node:https";
import "node:http2";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "../_libs/isbot.mjs";
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
const SCHEDULE_AR = {
  "* * * * *": "كل دقيقة",
  "*/5 * * * *": "كل 5 دقايق",
  "*/10 * * * *": "كل 10 دقايق",
  "*/30 * * * *": "كل نص ساعة",
  "0 * * * *": "كل ساعة"
};
function explainSchedule(s) {
  if (SCHEDULE_AR[s]) return SCHEDULE_AR[s];
  return s;
}
function fmt(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ar-EG", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  } catch {
    return iso;
  }
}
function statusBadge(status) {
  const ok = status === "succeeded";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block rounded px-2 py-0.5 text-xs font-medium " + (ok ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"), children: ok ? "نجح" : status });
}
function JobCard({
  job,
  lastRun
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-card p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-foreground", children: job.jobname }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [
          "⏱ ",
          explainSchedule(job.schedule)
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded px-2 py-0.5 text-xs " + (job.active ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"), children: job.active ? "شغالة" : "متوقفة" })
    ] }),
    lastRun ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center justify-between border-t border-border pt-2 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
        "آخر تشغيل: ",
        fmt(lastRun.start_time)
      ] }),
      statusBadge(lastRun.status)
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 border-t border-border pt-2 text-xs text-muted-foreground", children: "لم يتم تشغيلها بعد" })
  ] });
}
function AutomationPage() {
  const {
    data
  } = useSuspenseQuery(snapshotQO);
  const lastByJob = /* @__PURE__ */ new Map();
  for (const r of data.runs) {
    if (!lastByJob.has(r.jobid)) lastByJob.set(r.jobid, r);
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background px-4 py-6 text-foreground", dir: "rtl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "🤖 الأتمتة — مراقبة المشروع" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "كل اللي بيشتغل تلقائي في الخلفية — جدولة، حالة، وآخر تشغيل." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "text-sm text-primary hover:underline", children: "← الرئيسية" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 grid grid-cols-2 gap-3 md:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "إجمالي المهام", value: data.stats.total_jobs }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "شغالة", value: data.stats.active_jobs, tone: "ok" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "تشغيلات آخر 24س", value: data.stats.runs_24h }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "فشل آخر 24س", value: data.stats.failed_24h, tone: data.stats.failed_24h > 0 ? "bad" : "ok" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-3 text-lg font-semibold", children: "المهام المجدولة" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3", children: data.jobs.map((j) => /* @__PURE__ */ jsxRuntimeExports.jsx(JobCard, { job: j, lastRun: lastByJob.get(j.jobid) }, j.jobid)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-3 text-lg font-semibold", children: "آخر التشغيلات" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-lg border border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/40 text-xs text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right", children: "المهمة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right", children: "الحالة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right", children: "البداية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right", children: "المدة" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: data.runs.slice(0, 50).map((r) => {
        const dur = r.end_time ? Math.max(0, new Date(r.end_time).getTime() - new Date(r.start_time).getTime()) : null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 font-medium", children: r.jobname ?? `#${r.jobid}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: statusBadge(r.status) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-muted-foreground", children: fmt(r.start_time) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-muted-foreground", children: dur !== null ? `${dur} ms` : "—" })
        ] }, r.runid);
      }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-center text-xs text-muted-foreground", children: "الصفحة بتحدّث نفسها كل 30 ثانية تلقائي." })
  ] }) });
}
function Stat({
  label,
  value,
  tone
}) {
  const color = tone === "ok" ? "text-emerald-400" : tone === "bad" ? "text-red-400" : "text-foreground";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-card p-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-2xl font-bold " + color, children: value })
  ] });
}
export {
  AutomationPage as component
};
