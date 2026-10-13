import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { u as useServerFn, c as createSsrRpc } from "./router-BYsPPCpA.mjs";
import { g as getDashboard } from "./dashboard.functions-CP1L58iF.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { g as getTrackRecord } from "./track-record.functions-BhH-QHBv.mjs";
import { g as getLiveQuotes } from "./live-quote.functions-BvAYWih7.mjs";
import { g as getMarketStatus } from "./market-hours-CyHCW23Z.mjs";
import { M as MarketPulseCard } from "./market-pulse-card-dRUyDz9X.mjs";
import "../_libs/sonner.mjs";
import "../_libs/mendable__firecrawl-js.mjs";
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
import "./client-DcfJRNR2.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "./client.server-D5ro3rAQ.mjs";
import "node:fs";
import "node:path";
import "node:child_process";
import "./outcome-loop.server-BOECsdkT.mjs";
import "./auto-orchestrator.server-Cobs3ZBw.mjs";
import "./chat-fallback.server-HMcdWJQs.mjs";
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
import "./telegram.server-D6g8flro.mjs";
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
const triggerScan = createServerFn({
  method: "POST"
}).handler(createSsrRpc("daf02c0dc194971a473c941cddcaf302d0bab61a97fa5202d405beaeff04853d"));
const cancelScan = createServerFn({
  method: "POST"
}).handler(createSsrRpc("0c51e32c0a3f0adf9f0d7f6c10762f2aa64aa8396e3253b87c707221250dce13"));
const SCHEDULES = [
  { utcHour: 7, utcMinute: 0, label: "ما قبل الافتتاح" },
  { utcHour: 7, utcMinute: 30, label: "افتتاح السوق" },
  { utcHour: 10, utcMinute: 0, label: "منتصف الجلسة" },
  { utcHour: 11, utcMinute: 0, label: "مسح يومي" },
  { utcHour: 12, utcMinute: 30, label: "نهاية الجلسة" },
  { utcHour: 14, utcMinute: 30, label: "مسح ختامي شامل" }
];
function nextRun(now) {
  for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
    const probe = new Date(now);
    probe.setUTCDate(probe.getUTCDate() + dayOffset);
    const dow = probe.getUTCDay();
    if (dow === 5 || dow === 6) continue;
    for (const s of SCHEDULES) {
      const candidate = new Date(probe);
      candidate.setUTCHours(s.utcHour, s.utcMinute, 0, 0);
      if (candidate.getTime() > now.getTime()) {
        return { at: candidate, label: s.label };
      }
    }
  }
  const f = new Date(now);
  f.setUTCDate(f.getUTCDate() + 1);
  f.setUTCHours(7, 0, 0, 0);
  return { at: f, label: SCHEDULES[0].label };
}
function pad(n) {
  return n.toString().padStart(2, "0");
}
function ScanCountdown() {
  const [mounted, setMounted] = reactExports.useState(false);
  const [now, setNow] = reactExports.useState(() => /* @__PURE__ */ new Date());
  reactExports.useEffect(() => {
    setMounted(true);
    setNow(/* @__PURE__ */ new Date());
    const t = setInterval(() => setNow(/* @__PURE__ */ new Date()), 1e3);
    return () => clearInterval(t);
  }, []);
  if (!mounted) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-2 w-2 rounded-full bg-primary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-primary", children: "التحديث التلقائي القادم…" })
    ] });
  }
  const { at, label } = nextRun(now);
  const diffMs = Math.max(0, at.getTime() - now.getTime());
  const totalSec = Math.floor(diffMs / 1e3);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor(totalSec % 3600 / 60);
  const seconds = totalSec % 60;
  const cairoTime = at.toLocaleString("ar-EG", {
    timeZone: "Africa/Cairo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-xs", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-2 w-2 animate-pulse rounded-full bg-primary" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col leading-tight", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-primary", children: [
        "التحديث التلقائي القادم: ",
        label
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
        "الموعد: ",
        cairoTime,
        " (توقيت القاهرة)"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-auto rounded-md bg-background/60 px-3 py-1 font-mono text-base font-bold tabular-nums text-primary", children: [
      pad(hours),
      ":",
      pad(minutes),
      ":",
      pad(seconds)
    ] })
  ] });
}
const getTodayScalp = createServerFn({
  method: "GET"
}).handler(createSsrRpc("fa12b30c1d8334f8bd005553e7da1184c17c37554f16d3b8ea8f893c0b5fe5bc"));
const getMacroSnapshot = createServerFn({
  method: "GET"
}).handler(createSsrRpc("9c957eddc141d0f7c3a0b80acccf0415d37bb979145afe08d50debf69ef98337"));
function fmt(n, d = 2) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-EG", { maximumFractionDigits: d, minimumFractionDigits: d });
}
function MacroBar() {
  const fetchMacro = useServerFn(getMacroSnapshot);
  const { data } = useQuery({
    queryKey: ["macro-snapshot"],
    queryFn: () => fetchMacro(),
    refetchInterval: 30 * 60 * 1e3,
    staleTime: 10 * 60 * 1e3
  });
  if (!data) return null;
  const sp = data.sp500_change_pct;
  const spCls = sp == null ? "text-muted-foreground" : sp >= 0 ? "text-bull" : "text-bear";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 rounded-lg border border-border bg-card px-4 py-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between mb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs font-bold text-muted-foreground", children: [
      "🌍 المؤشرات الكلية (",
      data.as_of,
      ")"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4 lg:grid-cols-7", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "USD/EGP" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold tabular-nums", children: fmt(data.usd_egp) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "الذهب $" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold tabular-nums", children: fmt(data.gold_usd, 0) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "برنت $" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold tabular-nums", children: fmt(data.brent_oil_usd) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "فائدة CBE" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-bold tabular-nums", children: [
          fmt(data.cbe_interest_rate, 2),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "تضخم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-bold tabular-nums", children: [
          fmt(data.inflation_yoy, 1),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "S&P 500" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `font-bold tabular-nums ${spCls}`, children: [
          fmt(data.sp500_close, 0),
          " ",
          sp != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "(",
            sp >= 0 ? "+" : "",
            fmt(sp, 2),
            "%)"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "MSCI EM" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold tabular-nums", children: fmt(data.msci_em_close, 0) })
      ] })
    ] })
  ] });
}
function StockSearch() {
  const [open, setOpen] = reactExports.useState(false);
  const [q, setQ] = reactExports.useState("");
  const fetchDashboard = useServerFn(getDashboard);
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchDashboard(),
    staleTime: 6e4,
    enabled: open
  });
  reactExports.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  const rows = data?.rows ?? [];
  const results = reactExports.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows.slice(0, 30);
    return rows.filter(
      (r) => r.symbol.toLowerCase().includes(term) || (r.name_ar ?? "").toLowerCase().includes(term)
    ).slice(0, 50);
  }, [rows, q]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: () => setOpen(true),
        title: "بحث عن سهم",
        "aria-label": "بحث عن سهم",
        className: "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:border-primary/50",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": true, children: "🔍" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline text-muted-foreground", children: "ابحث عن سهم…" })
        ]
      }
    ),
    open && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-20",
        onClick: () => setOpen(false),
        role: "dialog",
        "aria-modal": "true",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl",
            onClick: (e) => e.stopPropagation(),
            dir: "rtl",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 border-b border-border p-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": true, children: "🔍" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    autoFocus: true,
                    value: q,
                    onChange: (e) => setQ(e.target.value),
                    placeholder: "ابحث بالاسم أو الرمز (مثال: COMI أو البنك التجاري)…",
                    className: "flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => setOpen(false),
                    className: "rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted",
                    children: "ESC"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "max-h-[60vh] overflow-y-auto p-2", children: results.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "p-4 text-center text-sm text-muted-foreground", children: "لا توجد نتائج" }) : results.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Link,
                {
                  to: "/stock/$symbol",
                  params: { symbol: r.symbol },
                  onClick: () => setOpen(false),
                  className: "flex items-center justify-between gap-3 rounded-lg p-2.5 hover:bg-muted/60",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-bold", children: r.name_ar }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: r.symbol })
                    ] }),
                    r.close != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-end tabular-nums", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold", children: Number(r.close).toLocaleString("en-EG", {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2
                      }) }),
                      r.change_pct != null && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "div",
                        {
                          className: `text-[11px] ${Number(r.change_pct) >= 0 ? "text-bull" : "text-bear"}`,
                          children: [
                            Number(r.change_pct) >= 0 ? "+" : "",
                            Number(r.change_pct).toFixed(2),
                            "%"
                          ]
                        }
                      )
                    ] })
                  ]
                }
              ) }, r.symbol)) })
            ]
          }
        )
      }
    )
  ] });
}
const SIGNAL_LABELS = {
  strong_buy: {
    ar: "شراء قوي",
    cls: "bg-bull text-bull-foreground"
  },
  buy: {
    ar: "شراء",
    cls: "bg-bull/70 text-bull-foreground"
  },
  neutral: {
    ar: "محايد",
    cls: "bg-warn text-warn-foreground"
  },
  sell: {
    ar: "بيع",
    cls: "bg-bear/70 text-bear-foreground"
  },
  strong_sell: {
    ar: "بيع قوي",
    cls: "bg-bear text-bear-foreground"
  }
};
const SIGNAL_FILTERS = [{
  key: "all",
  label: "الكل"
}, {
  key: "strong_buy",
  label: "شراء قوي"
}, {
  key: "buy",
  label: "شراء"
}, {
  key: "neutral",
  label: "محايد"
}, {
  key: "sell",
  label: "بيع"
}];
function PaperScalpLive() {
  const fetchScalp = useServerFn(getTodayScalp);
  const {
    data
  } = useQuery({
    queryKey: ["paper-scalp-today"],
    queryFn: () => fetchScalp(),
    refetchInterval: 2e4
  });
  const trades = data?.trades ?? [];
  const open = trades.filter((t) => t.status === "open");
  const closed = trades.filter((t) => t.status === "closed");
  const totalPnl = closed.reduce((a, t) => a + (Number(t.pnl) || 0), 0);
  const byStrat = (s) => closed.filter((t) => t.strategy === s);
  const scalpPnl = byStrat("scalp-mr15").reduce((a, t) => a + (Number(t.pnl) || 0), 0);
  const stratLabel = (s) => s === "scalp-mr15" ? "Scalp" : s ?? "—";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 rounded-lg border-2 border-primary/60 bg-primary/5 p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(MarketPulseCard, { compact: true }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 mb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-bold text-sm", children: [
        "📡 صفقات اليوم المباشرة (Paper) — ",
        data?.date ?? ""
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/paper", className: "text-xs text-primary hover:underline", children: "عرض الكل ←" })
    ] }),
    trades.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "مفيش إشارات لسه. الفحص بيشتغل من 10:30 ص. (تحديث كل 20ث)" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1.5", children: trades.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-center gap-3 rounded border p-2 text-xs ${t.status === "open" ? "bg-blue-50 dark:bg-blue-950/30 border-blue-300" : "bg-card"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold w-16", children: t.symbol }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded px-1.5 py-0.5 text-[10px] font-semibold ${t.strategy === "scalp-mr15" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"}`, children: stratLabel(t.strategy) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "دخول: ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { className: "tabular-nums", children: Number(t.entry_price).toFixed(2) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
          "TP ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "tabular-nums text-bull", children: Number(t.tp_price).toFixed(2) }),
          " / SL ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "tabular-nums text-bear", children: Number(t.sl_price).toFixed(2) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: new Date(t.entry_ts).toLocaleTimeString("ar-EG", {
          timeZone: "Africa/Cairo",
          hour: "2-digit",
          minute: "2-digit"
        }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ms-auto", children: t.status === "open" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-blue-600 font-semibold", children: "⏳ مفتوحة" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: Number(t.pnl) >= 0 ? "text-bull font-bold" : "text-bear font-bold", children: [
          t.exit_reason,
          " • ",
          Number(t.pnl) >= 0 ? "+" : "",
          Number(t.pnl).toFixed(0)
        ] }) })
      ] }, t.id)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 text-[11px] text-muted-foreground flex flex-wrap gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "مفتوحة: ",
          open.length
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "مقفولة: ",
          closed.length
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: scalpPnl >= 0 ? "text-bull" : "text-bear", children: [
          "Scalp: ",
          scalpPnl >= 0 ? "+" : "",
          scalpPnl.toFixed(0)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: totalPnl >= 0 ? "text-bull" : "text-bear", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("b", { children: [
          "الإجمالي: ",
          totalPnl >= 0 ? "+" : "",
          totalPnl.toFixed(0),
          " EGP"
        ] }) })
      ] })
    ] })
  ] });
}
function fmtNum(n, digits = 2) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-EG", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  });
}
function StockCard({
  r,
  livePrice,
  marketOpen
}) {
  const sig = r.signal ? SIGNAL_LABELS[r.signal] : null;
  const hasLive = livePrice != null && livePrice > 0 && r.close != null && r.close > 0;
  const livePct = hasLive ? (livePrice - r.close) / r.close * 100 : null;
  const liveTotalPct = livePct != null ? (r.change_pct ?? 0) + livePct : null;
  const displayPrice = hasLive ? livePrice : r.close;
  const displayPct = liveTotalPct ?? r.change_pct ?? 0;
  const displayPos = displayPct >= 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/stock/$symbol", params: {
    symbol: r.symbol
  }, className: "block rounded-xl border border-border bg-card p-5 transition hover:border-primary/50", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold", children: r.name_ar }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: r.symbol })
        ] }),
        r.sector_ar && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: r.sector_ar })
      ] }),
      sig && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-3 py-1 text-xs font-bold ${sig.cls}`, children: sig.ar })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-end justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold tabular-nums", children: fmtNum(displayPrice) }),
          hasLive && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { title: marketOpen ? "سعر لحظي مباشر" : "آخر سعر متاح", className: `relative inline-flex h-1.5 w-1.5 rounded-full ${marketOpen ? "bg-bull" : "bg-muted-foreground"}`, children: marketOpen && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute inset-0 animate-ping rounded-full bg-bull/60" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `text-sm tabular-nums ${displayPos ? "text-bull" : "text-bear"}`, children: [
          displayPos ? "+" : "",
          fmtNum(displayPct, 2),
          "%"
        ] }),
        livePct != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `mt-0.5 text-[11px] tabular-nums ${livePct >= 0 ? "text-bull" : "text-bear"}`, title: "الحركة منذ آخر إغلاق محفوظ", children: [
          "⚡ ",
          livePct >= 0 ? "+" : "",
          fmtNum(livePct, 2),
          "% لحظي"
        ] }),
        sig && r.entry_timing_ar && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary", children: [
          "⏱ ",
          r.entry_timing_ar,
          r.expected_next_day_pct != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `ms-1 ${r.expected_next_day_pct >= 0 ? "text-bull" : "text-bear"}`, children: [
            "(اليوم ",
            r.expected_next_day_pct >= 0 ? "+" : "",
            fmtNum(r.expected_next_day_pct, 1),
            "%)"
          ] }),
          r.expected_next_day_pct == null && r.expected_gain_pct != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ms-1 text-bull", children: [
            "(+",
            fmtNum(r.expected_gain_pct, 1),
            "%)"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-end text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { title: "مؤشر القوة النسبية (0-100). فوق 70 = مبالغ، تحت 30 = فرصة", children: [
          "RSI: ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "tabular-nums text-foreground", children: fmtNum(r.rsi14, 1) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { title: "حجم التداول مقابل المتوسط — فوق 1.5 = اهتمام", children: [
          "الحجم: ",
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "tabular-nums text-foreground", children: [
            "×",
            fmtNum(r.vol_ratio, 2)
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { title: "درجة فنية مركبة (0-100) — كلما زادت كان أفضل", children: [
          "النتيجة: ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "tabular-nums text-foreground", children: fmtNum(r.composite_score, 1) })
        ] })
      ] })
    ] }),
    sig && r.entry_min != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-3 text-center text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { title: "النطاق المقترح لشراء السهم", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "دخول" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 font-semibold tabular-nums", children: [
          fmtNum(r.entry_min),
          "–",
          fmtNum(r.entry_max)
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { title: "السعر المتوقع للبيع عنده", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "الهدف" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 font-semibold tabular-nums text-bull", children: fmtNum(r.target) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { title: "إذا نزل السعر لهنا، نبيع لتقليل الخسارة", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "وقف الخسارة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 font-semibold tabular-nums text-bear", children: fmtNum(r.stop_loss) })
      ] })
    ] }),
    sig && (r.partial_exit_pct != null || r.max_hold_days != null) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 grid grid-cols-2 gap-2 rounded-lg border border-dashed border-border p-2 text-center text-[11px]", children: [
      r.partial_exit_pct != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "بِع نصف عند ربح " }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-bull", children: [
          "+",
          fmtNum(r.partial_exit_pct, 1),
          "%"
        ] })
      ] }),
      r.max_hold_days != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "اخرج خلال " }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-foreground", children: [
          r.max_hold_days,
          " أيام"
        ] })
      ] })
    ] }),
    sig && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center justify-between text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { title: "نسبة ثقة الذكاء الاصطناعي في التوصية", children: [
        "الثقة: ",
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-semibold text-foreground", children: [
          r.confidence,
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { title: "الربح المتوقع ÷ الخسارة المحتملة. كلما زاد، كانت الصفقة أفضل", children: [
        "R:R ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-foreground tabular-nums", children: fmtNum(r.rr_ratio, 2) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { title: "نسبة رأس المال المقترحة للاستثمار", children: [
        "حجم المركز: ",
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-semibold text-foreground", children: [
          fmtNum(r.position_size_pct, 1),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { title: "الفترة المتوقعة لتحقيق الهدف", children: [
        "الإطار: ",
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-semibold text-foreground", children: [
          r.timeframe_days,
          " ي"
        ] })
      ] })
    ] }),
    sig && (r.technical_score != null || r.fundamental_score != null || r.macro_score != null) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 grid grid-cols-5 gap-1 rounded-lg bg-muted/30 p-2 text-[10px]", children: [{
      label: "فني",
      v: r.technical_score,
      tip: "قوة المؤشرات الفنية (RSI, MACD, الحجم)"
    }, {
      label: "أساسي",
      v: r.fundamental_score,
      tip: "P/E و ROE و نمو الإيرادات"
    }, {
      label: "مشاعر",
      v: r.sentiment_score,
      tip: "تحليل الأخبار العربية"
    }, {
      label: "اقتصاد",
      v: r.macro_score,
      tip: "الدولار، الذهب، S&P 500"
    }, {
      label: "قطاع",
      v: r.sector_score,
      tip: "أداء القطاع"
    }].map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", title: d.tip, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: d.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `font-bold tabular-nums ${d.v == null ? "text-muted-foreground" : d.v >= 70 ? "text-bull" : d.v >= 50 ? "text-foreground" : "text-bear"}`, children: d.v == null ? "—" : Math.round(d.v) })
    ] }, d.label)) })
  ] });
}
function Index() {
  const fetchDashboard = useServerFn(getDashboard);
  const scanFn = useServerFn(triggerScan);
  const cancelFn = useServerFn(cancelScan);
  const fetchTrack = useServerFn(getTrackRecord);
  const fetchLiveBatch = useServerFn(getLiveQuotes);
  const qc = useQueryClient();
  const [signalFilter, setSignalFilter] = reactExports.useState("all");
  const [message, setMessage] = reactExports.useState(null);
  const [scanDetails, setScanDetails] = reactExports.useState([]);
  const [marketOpen, setMarketOpen] = reactExports.useState(() => getMarketStatus().isOpen);
  reactExports.useEffect(() => {
    const id = setInterval(() => setMarketOpen(getMarketStatus().isOpen), 5e3);
    return () => clearInterval(id);
  }, []);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchDashboard(),
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status === "running" ? 5e3 : 6e4;
    }
  });
  const {
    data: track
  } = useQuery({
    queryKey: ["track-record-summary"],
    queryFn: () => fetchTrack(),
    staleTime: 5 * 6e4
  });
  const scan = useMutation({
    mutationFn: () => scanFn(),
    onSuccess: (res) => {
      setScanDetails([]);
      setMessage(res.message ?? (res.ok ? "بدأ المسح" : "فشل المسح"));
      qc.invalidateQueries({
        queryKey: ["dashboard"]
      });
    },
    onError: (e) => {
      setScanDetails([]);
      setMessage(`فشل المسح: ${e.message}`);
    }
  });
  const cancel = useMutation({
    mutationFn: () => cancelFn(),
    onSuccess: (res) => {
      setMessage(res.message ?? "تم الإلغاء");
      qc.invalidateQueries({
        queryKey: ["dashboard"]
      });
    },
    onError: (e) => {
      setMessage(`فشل الإلغاء: ${e.message}`);
    }
  });
  const rows = reactExports.useMemo(() => {
    const all = data?.rows ?? [];
    if (signalFilter === "all") return all;
    return all.filter((r) => r.signal === signalFilter);
  }, [data, signalFilter]);
  const lastUpdated = data?.finishedAt ? new Date(data.finishedAt).toLocaleString("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short"
  }) : null;
  const topPicks = data?.topPicks ?? [];
  const liveSymbols = reactExports.useMemo(() => {
    const set = /* @__PURE__ */ new Set();
    for (const r of topPicks) set.add(r.symbol);
    for (const r of rows) set.add(r.symbol);
    return Array.from(set).slice(0, 100);
  }, [topPicks, rows]);
  const liveBatch = useQuery({
    queryKey: ["dashboard-live", liveSymbols.join(",")],
    queryFn: () => fetchLiveBatch({
      data: {
        symbols: liveSymbols
      }
    }),
    enabled: liveSymbols.length > 0,
    // Poll fast when market is open, slowly when closed (so user still sees last snapshot)
    refetchInterval: marketOpen ? 1e4 : 6e4,
    refetchIntervalInBackground: false,
    staleTime: marketOpen ? 5e3 : 3e4
  });
  const livePriceBySymbol = reactExports.useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const q of liveBatch.data ?? []) {
      if (q.price > 0) m.set(q.symbol, q.price);
    }
    return m;
  }, [liveBatch.data]);
  const liveFor = (sym) => livePriceBySymbol.get(sym.replace(/\.CA$/i, "").toUpperCase());
  const aiDone = data?.aiCount ?? 0;
  const totalStocks = data?.stocksCount ?? 0;
  const isRunning = data?.status === "running" || scan.isPending;
  const isCompleted = data?.status === "completed";
  let stageIdx = 0;
  if (isCompleted) stageIdx = 3;
  else if (aiDone > 0) stageIdx = 2;
  else if (totalStocks > 0) stageIdx = 1;
  else if (isRunning) stageIdx = 0;
  const elapsedMs = data?.startedAt ? Date.now() - new Date(data.startedAt).getTime() : 0;
  let progressPct = 0;
  if (stageIdx === 0) progressPct = Math.min(12, 5 + Math.floor(elapsedMs / 2e3));
  else if (stageIdx === 1) progressPct = Math.min(30, 15 + Math.floor(elapsedMs / 2e3));
  else if (stageIdx === 2) {
    const ratio = totalStocks > 0 ? Math.min(1, aiDone / totalStocks) : 0;
    progressPct = Math.round(30 + ratio * 65);
  } else if (stageIdx === 3) progressPct = 100;
  const STAGES = [{
    label: "بدء المسح",
    hint: "تجهيز عملية المسح…"
  }, {
    label: "جلب بيانات السوق",
    hint: "تحميل الأسعار والمؤشرات من المصادر…"
  }, {
    label: "تحليل الذكاء الاصطناعي",
    hint: "حساب التوصيات لكل سهم…"
  }, {
    label: "اكتمل",
    hint: "تم تجهيز التوصيات."
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "border-b border-border bg-card/50 backdrop-blur", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-extrabold", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "EGX" }),
          " سكانر"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "ماسح ذكي للبورصة المصرية — توصيات للمدى القصير (1–3 أيام)" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(StockSearch, {}),
        lastUpdated && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
          "آخر تحديث: ",
          lastUpdated
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/backtest", className: "rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted", children: "📊 Backtest" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/halal-daytrade", className: "rounded-lg border border-bull/60 bg-bull/15 px-3 py-2 text-sm font-bold text-bull hover:bg-bull/25", children: "🕌 تداول يومي حلال" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/plan", className: "rounded-lg border border-primary/60 bg-primary/15 px-3 py-2 text-sm font-bold text-primary hover:bg-primary/25", children: [
          "🎯 ",
          marketOpen ? "خطة النهارده" : "خطة الجلسة القادمة"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/today", className: "rounded-lg border border-bull/60 bg-bull/15 px-3 py-2 text-sm font-bold text-bull hover:bg-bull/25", children: "⚡ صفقة اليوم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/morning", className: "rounded-lg border border-warn/60 bg-warn/15 px-3 py-2 text-sm font-bold text-warn hover:bg-warn/25", children: "🌅 توصية الصباح" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/investment", className: "rounded-lg border border-primary/50 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/20", children: "💼 استثمار شهري" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/rights", className: "rounded-lg border border-bull/50 bg-bull/10 px-3 py-2 text-sm font-semibold text-bull hover:bg-bull/20", children: "📜 حقوق اكتتاب شرعية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/deep", className: "rounded-lg border border-primary/50 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/20", children: "🧠 تحليل هجين" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/tomorrow", className: "rounded-lg border border-bull/50 bg-bull/10 px-3 py-2 text-sm font-semibold text-bull hover:bg-bull/20", children: "🎯 توقعات الغد" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/track-record", className: "rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted", children: "📈 سجل الأداء" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/tiers", className: "rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted", children: "🧠 طبقات الذكاء" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/daily", className: "rounded-lg border border-bull/50 bg-bull/10 px-3 py-2 text-sm font-semibold text-bull hover:bg-bull/20", children: "🎯 صفقة اليوم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/positions", className: "rounded-lg border border-warn/50 bg-warn/10 px-3 py-2 text-sm font-semibold text-warn hover:bg-warn/20", children: "💰 مراكزي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/reality", className: "rounded-lg border border-bear/50 bg-bear/10 px-3 py-2 text-sm font-semibold text-bear hover:bg-bear/20", children: "🔍 Reality Check" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/learning", className: "rounded-lg border border-primary/50 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/20", children: "⚡ التعلّم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
          setMessage(null);
          setScanDetails([]);
          scan.mutate();
        }, disabled: scan.isPending, className: "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50", children: scan.isPending ? "جاري المسح…" : "تحديث الآن" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-6 py-6", children: [
      liveSymbols.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 font-bold whitespace-nowrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `relative inline-flex h-2 w-2 rounded-full ${marketOpen ? "bg-bull" : "bg-muted-foreground"}`, children: marketOpen && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute inset-0 animate-ping rounded-full bg-bull/60" }) }),
          marketOpen ? "LIVE" : "آخر إغلاق"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-5 overflow-x-auto whitespace-nowrap tabular-nums", children: [
          (liveBatch.data ?? []).filter((q) => q.price > 0).map((q) => {
            const pos = q.change_pct >= 0;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: q.symbol }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: fmtNum(q.price) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: pos ? "text-bull" : "text-bear", children: [
                pos ? "+" : "",
                fmtNum(q.change_pct, 2),
                "%"
              ] })
            ] }, q.symbol);
          }),
          liveBatch.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "جاري التحميل…" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-muted-foreground whitespace-nowrap", children: [
          "تحديث كل ",
          marketOpen ? "10ث" : "60ث"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 rounded-lg border border-warn/30 bg-warn/10 px-4 py-2 text-xs text-warn-foreground/90 text-warn", children: "⚠️ هذا التحليل لأغراض تعليمية فقط وليس نصيحة استثمارية. تداول الأسهم ينطوي على مخاطر فقدان رأس المال." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PaperScalpLive, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(MacroBar, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ScanCountdown, {}) }),
      message && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 rounded-lg border border-border bg-card px-4 py-3 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: message }),
        scanDetails.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-2 list-inside list-disc space-y-1 text-xs text-muted-foreground", children: scanDetails.slice(0, 10).map((detail) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: detail }, detail)) })
      ] }),
      (isRunning || scan.isPending && !isCompleted) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 font-semibold text-primary", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block h-2 w-2 animate-pulse rounded-full bg-primary" }),
            STAGES[stageIdx].label
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-bold tabular-nums text-primary", children: [
            progressPct,
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: stageIdx === 2 && totalStocks > 0 ? `تم تحليل ${aiDone} من ${totalStocks} سهم — يحدّث تلقائياً.` : STAGES[stageIdx].hint }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "📥 الأسهم في نطاق المسح: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold tabular-nums text-foreground", children: totalStocks })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "🧮 مرحلة البيانات: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold tabular-nums text-foreground", children: stageIdx >= 2 ? "اكتملت" : stageIdx >= 1 ? "جارية" : "تبدأ" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "🤖 اكتمل تحليل AI: ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-semibold tabular-nums text-foreground", children: [
              aiDone,
              totalStocks > 0 ? ` / ${totalStocks}` : ""
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 h-2 w-full overflow-hidden rounded-full bg-primary/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full bg-primary transition-all duration-500", style: {
          width: `${progressPct}%`
        } }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 grid grid-cols-4 gap-2 text-[10px]", children: STAGES.map((s, i) => {
          const done = i < stageIdx;
          const active = i === stageIdx;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `mb-1 flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold ${done ? "border-primary bg-primary text-primary-foreground" : active ? "border-primary bg-primary/20 text-primary animate-pulse" : "border-border bg-muted text-muted-foreground"}`, children: done ? "✓" : i + 1 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `leading-tight ${active ? "font-semibold text-primary" : done ? "text-foreground" : "text-muted-foreground"}`, children: s.label })
          ] }, s.label);
        }) }),
        data?.status === "running" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => cancel.mutate(), disabled: cancel.isPending, className: "rounded-md border border-bear/40 bg-bear/10 px-3 py-1 text-xs font-semibold text-bear transition hover:bg-bear/20 disabled:opacity-50", children: cancel.isPending ? "جاري الإلغاء…" : "✕ إلغاء المسح" }) })
      ] }),
      data?.status === "completed" && data?.finishedAt && !scan.isPending && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400", children: [
        "✓ اكتمل المسح — ",
        data.aiCount ?? 0,
        " تحليل من ",
        data.stocksCount ?? 0,
        " سهم."
      ] }),
      data?.errorMessage && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 rounded-lg border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-warn", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: "تفاصيل آخر مسح" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-2 list-inside list-disc space-y-1 text-xs", children: data.errorMessage.split(" | ").slice(0, 10).map((line) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: line }, line)) })
      ] }),
      topPicks.length > 0 && signalFilter === "all" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 rounded-xl border border-bull/40 bg-gradient-to-br from-bull/10 to-bull/5 p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg", children: "🚀" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-lg font-bold text-bull", children: [
            "أفضل ",
            topPicks.length,
            " فرص متوقعة للصعود ",
            marketOpen ? "النهارده" : "للجلسة القادمة"
          ] }),
          !data?.isSynthetic && data?.dataProvider && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ms-auto rounded-full bg-bull/20 px-2 py-0.5 text-[10px] font-semibold text-bull", children: [
            "✓ بيانات حقيقية (",
            data.dataProvider,
            ")"
          ] }),
          data?.isSynthetic && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ms-auto rounded-full bg-bear/20 px-2 py-0.5 text-[10px] font-semibold text-bear", children: "⚠️ بيانات اصطناعية — لا تتداول" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-4 text-xs text-muted-foreground", children: marketOpen ? "مرتّبة حسب (الحركة المتوقعة للجلسة الحالية × ثقة الذكاء الاصطناعي). اضغط على السهم لتفاصيل الدخول والخروج." : "السوق مغلق حاليًا — دي ترشيحات مبنية على آخر إغلاق وجاهزة لجلسة التداول القادمة. اضغط على السهم لتفاصيل الدخول والخروج." }),
        track && track.buy_30d.total >= 5 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/track-record", className: `mb-4 flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition hover:opacity-80 ${track.buy_30d.expectancy_pct > 0 ? "border-bull/40 bg-bull/10" : "border-bear/40 bg-bear/10"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "📊 آخر 30 يوم: ",
            track.buy_30d.wins,
            " فوز / ",
            track.buy_30d.losses,
            " خسارة — معدل نجاح ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
              track.buy_30d.win_rate,
              "%"
            ] }),
            " — توقع لكل صفقة",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { className: track.buy_30d.expectancy_pct > 0 ? "text-bull" : "text-bear", children: [
              track.buy_30d.expectancy_pct >= 0 ? "+" : "",
              track.buy_30d.expectancy_pct,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "شاهد التفاصيل ←" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 md:grid-cols-3", children: topPicks.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute -top-2 -right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-bull text-xs font-extrabold text-bull-foreground shadow-lg", children: [
            "#",
            i + 1
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(StockCard, { r, livePrice: liveFor(r.symbol), marketOpen })
        ] }, r.symbol)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-6 flex flex-wrap gap-2", children: SIGNAL_FILTERS.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setSignalFilter(f.key), className: `rounded-full px-4 py-1.5 text-xs font-semibold transition ${signalFilter === f.key ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`, children: f.label }, f.key)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { className: "mb-4 rounded-lg border border-border bg-card/50 px-4 py-2 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("summary", { className: "cursor-pointer font-semibold text-muted-foreground hover:text-foreground", children: "📖 شرح الأرقام والمصطلحات" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 grid grid-cols-1 gap-1 text-muted-foreground md:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: "السعر الحالي:" }),
            " سعر الإغلاق الأخير للسهم (بالجنيه)."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: "% التغيير:" }),
            " نسبة صعود/هبوط السهم عن الأمس."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: "RSI:" }),
            " مؤشر القوة النسبية (0-100). تحت 30 = فرصة شراء، فوق 70 = مبالغة."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: "الحجم:" }),
            " حجم التداول اليوم مقابل المتوسط. فوق 1.5 = اهتمام مرتفع."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: "النتيجة:" }),
            " درجة فنية مركبة (0-100). كلما زادت، كان السهم أفضل فنياً."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: "دخول من–إلى:" }),
            " النطاق المقترح لشراء السهم."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: "الهدف:" }),
            " السعر المتوقع للبيع عنده لتحقيق ربح."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: "وقف الخسارة:" }),
            " سعر الإغلاق للصفقة إذا تحرك السهم ضدنا."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: "R:R:" }),
            " الربح المتوقع ÷ الخسارة المحتملة. فوق 2 يعني صفقة جيدة."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: "حجم المركز:" }),
            " نسبة رأس المال المقترحة للاستثمار في السهم."
          ] })
        ] })
      ] }),
      isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center text-muted-foreground py-20", children: "جاري التحميل…" }) : rows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-dashed border-border p-16 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-semibold", children: signalFilter === "all" ? "لا توجد بيانات بعد" : `لا توجد أسهم بإشارة "${SIGNAL_FILTERS.find((f) => f.key === signalFilter)?.label}" حالياً` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: signalFilter === "all" ? 'اضغط "تحديث الآن" لبدء أول عملية مسح للأسهم.' : "جرب تصفية أخرى أو اضغط الكل لعرض جميع الأسهم." })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: rows.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx(StockCard, { r, livePrice: liveFor(r.symbol), marketOpen }, r.symbol)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("footer", { className: "mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground", children: [
        "البيانات من Yahoo Finance · التحليل بواسطة Lovable AI (Gemini)",
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        "هذا الموقع مستقل وليس مرتبطاً بالبورصة المصرية. لا يمثل المحتوى توصية استثمارية."
      ] })
    ] })
  ] });
}
export {
  Index as component
};
