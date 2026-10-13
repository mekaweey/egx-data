import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useServerFn } from "./router-BYsPPCpA.mjs";
import { g as getDashboard } from "./dashboard.functions-CP1L58iF.mjs";
import { g as getMarketStatus } from "./market-hours-CyHCW23Z.mjs";
import "../_libs/sonner.mjs";
import "../_libs/seroval.mjs";
import "../_libs/mendable__firecrawl-js.mjs";
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
import "./server-BpMZvK1r.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:http";
import "node:stream/promises";
import "node:https";
import "node:http2";
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
function fmt(n, d = 2) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-EG", {
    maximumFractionDigits: d,
    minimumFractionDigits: d
  });
}
function fmtEGP(n) {
  return n.toLocaleString("en-EG", {
    maximumFractionDigits: 0
  }) + " ج.م";
}
function weeklyTargetPct(r) {
  const direct = r.target && r.close ? (r.target / r.close - 1) * 100 : 0;
  const compounded = (r.expected_gain_pct ?? 0) * 5;
  return Math.max(direct, compounded);
}
function selectHybrid(rows, capital) {
  const candidates = rows.filter((r) => r.close > 0 && (r.signal === "buy" || r.signal === "strong_buy"));
  const holdPool = [...candidates].filter((r) => (r.composite_score ?? 0) >= 50 && (r.expected_gain_pct ?? 0) > 0).sort((a, b) => (b.composite_score ?? 0) - (a.composite_score ?? 0));
  const swingPool = [...candidates].filter((r) => (r.vol_ratio ?? 0) >= 1).sort((a, b) => weeklyTargetPct(b) - weeklyTargetPct(a));
  const holdSymbols = /* @__PURE__ */ new Set();
  const hold = [];
  for (const r of holdPool) {
    if (hold.length >= 4) break;
    if (!holdSymbols.has(r.symbol)) {
      hold.push(r);
      holdSymbols.add(r.symbol);
    }
  }
  const swing = [];
  for (const r of swingPool) {
    if (swing.length >= 2) break;
    if (!holdSymbols.has(r.symbol)) swing.push(r);
  }
  const holdCapital = hold.length > 0 ? capital * 0.8 : 0;
  const swingCapital = swing.length > 0 ? capital * 0.2 : 0;
  const mk = (list, pool) => {
    if (!list.length) return [];
    const per = pool / list.length;
    return list.map((r) => {
      const shares = Math.floor(per / r.close);
      const cost = shares * r.close;
      const tgt = r.target ?? r.close * 1.1;
      const stp = r.stop_loss ?? r.close * 0.94;
      return {
        row: r,
        alloc: per,
        shares,
        cost,
        targetProfit: shares * (tgt - r.close),
        stopLoss: shares * (r.close - stp)
      };
    });
  };
  return {
    hold: mk(hold, holdCapital),
    swing: mk(swing, swingCapital),
    holdCapital,
    swingCapital
  };
}
function PickCard({
  p,
  kind
}) {
  const r = p.row;
  const isHold = kind === "hold";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-xl border p-4 ${isHold ? "border-primary/40 bg-primary/5" : "border-bull/40 bg-bull/5"}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold", children: r.name_ar }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: r.symbol })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: r.sector_ar ?? "—" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-2 py-1 text-[11px] font-bold ${isHold ? "bg-primary/20 text-primary" : "bg-bull/20 text-bull"}`, children: isHold ? "Hold طويل" : "Swing سريع" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 grid grid-cols-2 gap-2 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md bg-card p-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: "السعر الحالي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold tabular-nums", children: fmt(r.close) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md bg-card p-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: "عدد الأسهم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold tabular-nums", children: p.shares.toLocaleString("en-EG") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md bg-card p-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: "المبلغ المستثمر" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold tabular-nums", children: fmtEGP(p.cost) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md bg-card p-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: "المخصص" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold tabular-nums", children: fmtEGP(p.alloc) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-2 text-center text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "دخول" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 font-semibold tabular-nums", children: r.entry_min != null ? `${fmt(r.entry_min)}–${fmt(r.entry_max)}` : fmt(r.close) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "الهدف" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 font-semibold tabular-nums text-bull", children: fmt(r.target ?? r.close * 1.1) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "وقف الخسارة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 font-semibold tabular-nums text-bear", children: fmt(r.stop_loss ?? r.close * 0.94) })
      ] })
    ] }),
    !isHold && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 rounded-lg border border-bull/40 bg-bull/10 p-3 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: "الزيادة المتوقعة خلال الأسبوع" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-2xl font-extrabold text-bull tabular-nums", children: [
        "+",
        fmt(weeklyTargetPct(r), 1),
        "%"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-[11px] text-muted-foreground", children: [
        "مبني على الزخم الحالي + حجم التداول × ",
        fmt(r.vol_ratio ?? 0, 2)
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap items-center justify-between gap-2 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-bull", children: [
        "لو وصل للهدف: ",
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold", children: [
          "+",
          fmtEGP(p.targetProfit)
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-bear", children: [
        "لو ضرب الستوب: ",
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold", children: [
          "-",
          fmtEGP(p.stopLoss)
        ] })
      ] }),
      r.max_hold_days != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
        "أقصى مدة: ",
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-foreground", children: [
          r.max_hold_days,
          " يوم"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 rounded-md border border-dashed border-border p-2 text-[12px] leading-relaxed text-muted-foreground", children: isHold ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      "💡 ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "اشتري وامسك" }),
      " السهم ده على المدى المتوسط (شهور). لا تبيع لو نزل شويه، البيع بس لو وصل للهدف أو نزل تحت وقف الخسارة."
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      "⚡ ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "صفقة سريعة" }),
      ": ادخل أثناء الجلسة فقط، واطلع بمجرد ما يوصل للهدف (+",
      fmt(((r.target ?? r.close * 1.1) / r.close - 1) * 100, 1),
      "%)، أو لو ضرب الستوب اخرج فوراً بدون تردد."
    ] }) })
  ] });
}
function PlanPage() {
  const fetchDashboard = useServerFn(getDashboard);
  const [capital, setCapital] = reactExports.useState(15e4);
  const [marketOpen, setMarketOpen] = reactExports.useState(() => getMarketStatus().isOpen);
  reactExports.useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("plan.capital") : null;
    if (saved) setCapital(Number(saved) || 15e4);
  }, []);
  reactExports.useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("plan.capital", String(capital));
  }, [capital]);
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
    refetchInterval: 6e4
  });
  const plan = reactExports.useMemo(() => selectHybrid(data?.rows ?? [], capital), [data, capital]);
  const hasPlan = plan.hold.length > 0 || plan.swing.length > 0;
  const totalInvested = plan.hold.reduce((a, p) => a + p.cost, 0) + plan.swing.reduce((a, p) => a + p.cost, 0);
  const cash = capital - totalInvested;
  const MONTHLY_RATE = 0.028;
  const YEARLY_RATE = 0.33;
  const monthlyExpected = capital * MONTHLY_RATE;
  const weeklyExpected = monthlyExpected / 4;
  const yearlyExpected = capital * YEARLY_RATE;
  const capitalNeededFor14k = Math.round(14e3 / MONTHLY_RATE / 1e3) * 1e3;
  const lastUpdated = data?.finishedAt ? new Date(data.finishedAt).toLocaleString("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short"
  }) : null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", className: "min-h-screen bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "border-b border-border bg-card/50 backdrop-blur", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-extrabold", children: [
          "🎯 خطة ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: marketOpen ? "النهارده" : "الجلسة القادمة" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "استراتيجية Hold-Heavy 80/20 — مثبتة على 8 شهور (+22% فعلي)" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        lastUpdated && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
          "آخر تحديث: ",
          lastUpdated
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted", children: "← الرئيسية" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "mx-auto max-w-6xl px-6 py-6 space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-warn/30 bg-warn/10 px-4 py-2 text-xs text-warn", children: "⚠️ معلومات تعليمية فقط — مش نصيحة مالية. الأسعار بتتحدّث كل دقيقة تلقائياً." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-semibold text-muted-foreground", children: "رأس المال اللي معاك (جنيه)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: 1e3, step: 1e3, value: capital, onChange: (e) => setCapital(Math.max(1e3, Number(e.target.value) || 0)), className: "w-48 rounded-lg border border-border bg-background px-3 py-2 text-lg font-bold tabular-nums" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: [5e4, 1e5, 15e4, 5e5, 1e6].map((v) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setCapital(v), className: `rounded-md border px-3 py-1 text-xs ${capital === v ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`, children: v.toLocaleString("en-EG") }, v)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "grid grid-cols-2 gap-3 md:grid-cols-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-primary/40 bg-primary/5 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Hold (80%)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xl font-bold tabular-nums", children: fmtEGP(plan.holdCapital) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-[11px] text-muted-foreground", children: [
            plan.hold.length,
            " سهم للمدى المتوسط"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-bull/40 bg-bull/5 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Swing (20%)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xl font-bold tabular-nums", children: fmtEGP(plan.swingCapital) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-[11px] text-muted-foreground", children: [
            plan.swing.length,
            " صفقة سريعة"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "إجمالي مستثمر" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xl font-bold tabular-nums", children: fmtEGP(totalInvested) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-[11px] text-muted-foreground", children: [
            "كاش متاح: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground", children: fmtEGP(Math.max(0, cash)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-bull/40 bg-bull/5 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "متوسط ربح متوقع" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-xl font-bold tabular-nums text-bull", children: [
            "+",
            fmtEGP(monthlyExpected)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[11px] text-muted-foreground", children: "شهرياً (2.8% — مبني على محاكاة حقيقية)" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-warn/40 bg-warn/5 p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold", children: "🎯 الواقع بدون تجميل" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 grid gap-3 md:grid-cols-3 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-card p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "متوسط الربح الشهري" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-2xl font-bold text-bull tabular-nums", children: [
              "+",
              fmtEGP(monthlyExpected)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-[11px] text-muted-foreground", children: [
              "2.8% من رأس مالك (",
              fmtEGP(capital),
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-card p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "العائد السنوي المتوقع" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-2xl font-bold text-bull tabular-nums", children: [
              "+",
              fmtEGP(yearlyExpected)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[11px] text-muted-foreground", children: "33% سنوياً مركب" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-card p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "أكبر هبوط محتمل" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-2xl font-bold text-bear tabular-nums", children: [
              "-",
              fmtEGP(capital * 0.06)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[11px] text-muted-foreground", children: "~6% (Drawdown مثبت بالمحاكاة)" })
          ] })
        ] }),
        monthlyExpected < 14e3 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 rounded-lg border border-primary/40 bg-primary/10 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-semibold", children: [
            "🧮 عشان توصل لهدف ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "14,000 ج/شهر" }),
            " فعلياً:"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 text-sm", children: [
            "محتاج رأس مال ≈ ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-primary tabular-nums", children: fmtEGP(capitalNeededFor14k) }),
            " ",
            "(زيادة ",
            fmtEGP(Math.max(0, capitalNeededFor14k - capital)),
            " عن رأس مالك الحالي)."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 text-xs text-muted-foreground", children: [
            "البديل: ابدأ بـ ",
            fmtEGP(capital),
            " وعيد استثمار الأرباح — هتوصل لـ ",
            fmtEGP(capitalNeededFor14k),
            " خلال",
            " ",
            Math.ceil(Math.log(capitalNeededFor14k / capital) / Math.log(1 + 0.028)),
            " شهر بالربح المركب."
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 text-xs text-muted-foreground leading-relaxed", children: [
          "📊 ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "مصدر الأرقام:" }),
          " محاكاة حقيقية على البورصة المصرية من نوفمبر 2025 حتى يونيو 2026 (8 شهور كاملة). استراتيجية Hold-Heavy 80/20 (4 أسهم طويلة + 2 صفقات سريعة) حققت ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "+22.3% خلال 8 شهور" }),
          "، بمعدل نجاح 48% وأكبر انخفاض -5.3%. الشهور الرابحة 5 من 8.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "⚠️ ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "الواقع:" }),
          " فيه شهور هتربح فيها 15-18 ألف، وشهور هتخسر 3-5 آلاف. المتوسط هو اللي يهم."
        ] })
      ] }),
      isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-card p-8 text-center text-muted-foreground", children: "⏳ بنحمّل آخر بيانات السوق…" }),
      !isLoading && plan.hold.length === 0 && plan.swing.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-warn/40 bg-warn/10 p-6 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-bold", children: "مفيش توصيات شراء قوية دلوقتي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "السوق مش معطي إشارات واضحة — يفضل تنتظر مسح جديد أو تشغّل المسح من الصفحة الرئيسية." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground", children: "← شغّل مسح جديد" })
      ] }),
      plan.hold.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "mb-3 text-lg font-bold", children: [
          "🏦 ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "Buy & Hold" }),
          " — تنفيذ أثناء الجلسة فقط"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 text-xs text-muted-foreground", children: "دي توصيات شراء فعلية من آخر مسح. لو السوق مقفول، التنفيذ يكون مع الجلسة القادمة بعد تأكيد السعر." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 md:grid-cols-2", children: plan.hold.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(PickCard, { p, kind: "hold" }, p.row.symbol)) })
      ] }),
      plan.swing.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "mb-3 text-lg font-bold", children: [
          "⚡ ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-bull", children: "Swing" }),
          " — صفقات الأسبوع"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 text-xs text-muted-foreground", children: "دول أسهم متوقع تتحرك +10% خلال أيام. اخرج فوراً عند الهدف أو الستوب — بدون مشاعر." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 md:grid-cols-2", children: plan.swing.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(PickCard, { p, kind: "swing" }, p.row.symbol)) })
      ] }),
      hasPlan && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold", children: "📋 الخطوات بترتيب — من بكرا الصبح" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "mt-3 space-y-2 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "1." }),
            " افتح حسابك في شركة السمسرة قبل 10:00 صباحاً."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "2." }),
            " اشتري أسهم ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Hold" }),
            " الأول (دول طويلين، اشتريهم بسعر السوق)."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "3." }),
            " اشتري صفقات ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Swing" }),
            " بحد سعري داخل نطاق الدخول الموضح."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "4." }),
            " حط ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "وقف خسارة آلي" }),
            " لكل صفقة Swing فوراً — ده اللي بيحميك."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "5." }),
            " راجع الصفحة دي يومياً قبل الافتتاح — البيانات بتتحدّث تلقائي."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "6." }),
            " لما صفقة Swing تكسب، ضيف الأرباح لرأس المال وأعد الحساب."
          ] })
        ] })
      ] }),
      hasPlan && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold", children: "📈 توقعات الأرباح (تقدير محافظ)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 grid grid-cols-3 gap-3 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-muted/40 p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "أسبوع" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-lg font-bold text-bull tabular-nums", children: [
              "+",
              fmtEGP(weeklyExpected)
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-muted/40 p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "شهر" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-lg font-bold text-bull tabular-nums", children: [
              "+",
              fmtEGP(monthlyExpected)
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-muted/40 p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "سنة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-lg font-bold text-bull tabular-nums", children: [
              "+",
              fmtEGP(yearlyExpected)
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-[11px] text-muted-foreground", children: "* التقدير مبني على متوسط نجاح 50% لصفقات Swing + هدف Hold على 6 شهور. الأرباح الفعلية ممكن تختلف." })
      ] })
    ] })
  ] });
}
export {
  PlanPage as component
};
