import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as fmtPrice, C as CURRENT_REGIME_WEEKLY_LOW_EGP, w as CURRENT_REGIME_WEEKLY_HIGH_EGP, B as BACKTEST_WEEKLY_EGP_LOW, x as BACKTEST_WEEKLY_EGP_HIGH, y as BACKTEST_WEEKLY_EGP, z as BACKTEST_WORST_WEEK_PCT, A as BACKTEST_MAXDD_PCT, F as BACKTEST_DISCLAIMER_AR } from "./router-BYsPPCpA.mjs";
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
import "./server-BpMZvK1r.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:http";
import "node:stream/promises";
import "node:https";
import "node:http2";
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
function DataFreshnessBanner() {
  const [fresh, setFresh] = reactExports.useState(null);
  const [err, setErr] = reactExports.useState(null);
  reactExports.useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/public/hooks/data-freshness", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setFresh(data);
          setErr(null);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || "network error");
      }
    };
    tick();
    const id = setInterval(tick, 6e4);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);
  if (err) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-warn/40 bg-warn/10 text-warn px-3 py-2 text-xs flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "⚠️" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "تعذر فحص نضارة بيانات الشموع (",
        err,
        ") — البيانات المعروضة قد تكون قديمة."
      ] })
    ] });
  }
  if (!fresh) return null;
  if (fresh.healthy) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-bull/40 bg-bull/10 text-bull px-3 py-2 text-xs flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block w-2 h-2 rounded-full bg-bull animate-pulse" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "بيانات الشموع اليومية سليمة · آخر جلسة مسجلة",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { className: "font-mono", children: fresh.maxDate }),
        " (منذ ",
        fresh.ageDays,
        " يوم)",
        fresh.symbolsOnMaxDate != null && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          " · ",
          fresh.symbolsOnMaxDate,
          " سهم"
        ] })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-warn/50 bg-warn/15 text-warn px-3 py-2 text-xs flex items-center gap-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base", children: "🛑" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "بيانات الشموع قديمة" }),
      " — آخر جلسة في daily_candles:",
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { className: "font-mono", children: fresh.maxDate ?? "لا يوجد" }),
      fresh.ageDays != null && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        " (منذ ",
        fresh.ageDays,
        " يوم)"
      ] }),
      ". مسح الترشيح لن يكون صادقاً حتى التحديث — شغّل مهمة الـ14:45 أو /api/public/hooks/momentum-weekly-run?phase=candles"
    ] })
  ] });
}
function ageText(min) {
  if (min == null) return "لا يوجد";
  if (min < 1) return "الآن";
  if (min < 60) return `منذ ${min} دقيقة`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `منذ ${h} ساعة و ${m} د` : `منذ ${h} ساعة`;
}
function LivePriceBadge() {
  const [st, setSt] = reactExports.useState(null);
  reactExports.useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/public/hooks/live-price-status", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setSt(data);
      } catch {
        if (!cancelled) setSt({ ok: false, status: "closed", inSession: false, lastCaptureAt: null, ageMin: null, symbolsLast15m: 0, checkedAt: "", error: "network" });
      }
    };
    tick();
    const id = setInterval(tick, 3e4);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);
  if (!st) return null;
  if (st.error) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-2 rounded-full border border-warn/40 bg-warn/10 text-warn px-3 py-1.5 text-xs font-bold", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "relative flex h-2 w-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute inline-flex h-full w-full rounded-full bg-warn opacity-60" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative inline-flex rounded-full h-2 w-2 bg-warn" })
      ] }),
      "تعذر فحص التغذية اللحظية"
    ] });
  }
  if (st.status === "live") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-2 rounded-full border border-bull/40 bg-bull/10 text-bull px-3 py-1.5 text-xs font-bold", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "relative flex h-2 w-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-bull opacity-75" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative inline-flex rounded-full h-2 w-2 bg-bull" })
      ] }),
      "أسعار لحظية حية — ",
      st.symbolsLast15m,
      " سهم (",
      ageText(st.ageMin),
      ")"
    ] });
  }
  if (st.status === "stale") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-2 rounded-full border border-bear/40 bg-bear/10 text-bear px-3 py-1.5 text-xs font-bold", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "relative flex h-2 w-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute inline-flex h-full w-full rounded-full bg-bear opacity-60" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative inline-flex rounded-full h-2 w-2 bg-bear" })
      ] }),
      "لا أسعار لحظية — الإكستنشن غير شغال (آخر تغذية ",
      ageText(st.ageMin),
      ")"
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 text-muted-foreground px-3 py-1.5 text-xs font-bold", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative flex h-2 w-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative inline-flex rounded-full h-2 w-2 bg-muted-foreground/60" }) }),
    "السوق مقفول — آخر تغذية لحظية ",
    ageText(st.ageMin)
  ] });
}
const COMP_LABELS = {
  breadth: "اتساع السوق فوق المتوسط",
  trend20: "الاتجاه (20 جلسة)",
  prevday: "عائد أمس",
  trend5: "الزخم (5 جلسات)",
  volreg: "هدوء التقلب",
  opening: "قوة الافتتاح (أول 15 دقيقة)"
};
function bucketColor(bucket) {
  if (bucket === "ممتاز") return "#22c55e";
  if (bucket === "جيد") return "#4ade80";
  if (bucket === "متوسط") return "#eab308";
  return "#ef4444";
}
function MarketStateGauge() {
  const [st, setSt] = reactExports.useState(null);
  const [err, setErr] = reactExports.useState(null);
  reactExports.useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/public/hooks/market-state", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setSt(data);
          setErr(null);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || "network error");
      }
    };
    tick();
    const id = setInterval(tick, 6e4);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);
  if (err) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-bear/40 bg-bear/10 text-bear px-4 py-3 text-xs font-bold", children: [
      "⚠️ تعذر حساب حالة السوق (",
      err,
      ")"
    ] });
  }
  if (!st || !st.ok) return null;
  const score = st.score;
  const color = bucketColor(st.bucket);
  const arcLen = Math.PI * 80;
  const filled = score / 100 * arcLen;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border bg-card p-5 shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl", children: "🧠" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-black", children: "محلل حالة السوق الذكي" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: "rounded-full px-2.5 py-0.5 text-[11px] font-black",
              style: { background: `${color}22`, color, border: `1px solid ${color}55` },
              children: st.bucket
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[11px] text-muted-foreground", children: "تركيب مقاس من عشر سنين: الاتساع والاتجاه وعائد أمس والزخم وهدوء التقلب وقوة الافتتاح — كل مكوّن اختُبر على التاريخ قبل ما يدخل المؤشر." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] text-muted-foreground text-left", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          "آخر جلسة: ",
          st.detail.asOf
        ] }),
        st.detail.inSession ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "السوق مفتوح — القياس اللحظي نشط" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "السوق مقفول — التحليل من إغلاق آخر جلسة" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap items-center justify-center gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 200 125", className: "w-52", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "path",
          {
            d: "M 20 105 A 80 80 0 0 1 180 105",
            fill: "none",
            stroke: "rgba(128,128,128,0.25)",
            strokeWidth: "14",
            strokeLinecap: "round"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "path",
          {
            d: "M 20 105 A 80 80 0 0 1 180 105",
            fill: "none",
            stroke: color,
            strokeWidth: "14",
            strokeLinecap: "round",
            strokeDasharray: `${filled} 999`,
            style: { transition: "stroke-dasharray 0.8s ease" }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("text", { x: "100", y: "88", textAnchor: "middle", fontSize: "38", fontWeight: "900", fill: color, children: score }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("text", { x: "100", y: "112", textAnchor: "middle", fontSize: "13", fontWeight: "700", fill: color, children: [
          st.bucket,
          " — من 100"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-[260px] flex-1 space-y-2", children: Object.entries(COMP_LABELS).map(([k, label]) => {
        const v = st.components[k];
        if (v == null) {
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 text-[11px] text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "غير متاح الآن (الإكستنشن)" })
          ] }, k);
        }
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-[11px]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-bold", children: v })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5 w-full overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "h-full rounded-full",
              style: {
                width: `${v}%`,
                background: v >= 60 ? "#4ade80" : v >= 40 ? "#eab308" : "#ef4444",
                transition: "width 0.6s ease"
              }
            }
          ) })
        ] }, k);
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 grid grid-cols-2 gap-2 text-[11px] md:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-muted/40 px-2.5 py-1.5", children: [
        "اتساع فوق المتوسط: ",
        /* @__PURE__ */ jsxRuntimeExports.jsxs("b", { className: "font-mono", children: [
          st.detail.breadthPct,
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-muted/40 px-2.5 py-1.5", children: [
        "الاتجاه 20 جلسة: ",
        /* @__PURE__ */ jsxRuntimeExports.jsxs("b", { className: "font-mono", children: [
          st.detail.trend20Pct,
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-muted/40 px-2.5 py-1.5", children: [
        "الزخم 5 جلسات: ",
        /* @__PURE__ */ jsxRuntimeExports.jsxs("b", { className: "font-mono", children: [
          st.detail.trend5Pct,
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-muted/40 px-2.5 py-1.5", children: [
        "عائد أمس: ",
        /* @__PURE__ */ jsxRuntimeExports.jsxs("b", { className: "font-mono", children: [
          st.detail.prevdayPct,
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-muted/40 px-2.5 py-1.5", children: [
        "التقلب اليومي: ",
        /* @__PURE__ */ jsxRuntimeExports.jsxs("b", { className: "font-mono", children: [
          st.detail.vol20Pct,
          "%"
        ] })
      ] }),
      st.detail.openingPct != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-muted/40 px-2.5 py-1.5", children: [
        "قوة الافتتاح: ",
        /* @__PURE__ */ jsxRuntimeExports.jsxs("b", { className: "font-mono", children: [
          st.detail.openingPct,
          "%"
        ] })
      ] })
    ] })
  ] });
}
let audioCtx = null;
function getAudioContext() {
  if (typeof window === "undefined") return null;
  try {
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (!audioCtx && AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {
      });
    }
    return audioCtx;
  } catch {
    return null;
  }
}
function playSignalChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(1e-3, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.55);
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.18);
    gain2.gain.setValueAtTime(0, now + 0.18);
    gain2.gain.linearRampToValueAtTime(0.35, now + 0.23);
    gain2.gain.exponentialRampToValueAtTime(1e-3, now + 0.85);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.9);
  } catch {
  }
}
function playEmergencySiren() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const start = now + i * 0.28;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(i % 2 === 0 ? 880 : 660, start);
      osc.frequency.linearRampToValueAtTime(i % 2 === 0 ? 740 : 550, start + 0.2);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.4, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.24);
    }
  } catch {
  }
}
function playScheduledExitTone() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const freqs = [659.25, 587.33, 523.25];
    freqs.forEach((freq, idx) => {
      const start = now + idx * 0.16;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(1e-3, start + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.5);
    });
  } catch {
  }
}
async function fetchDashboard() {
  if (typeof window === "undefined") {
    const {
      buildDashboard
    } = await import("./router-BYsPPCpA.mjs").then((n) => n.J);
    return await buildDashboard();
  }
  const res = await fetch("/api/public/hooks/scalp-dip-dashboard");
  return res.json();
}
const markBoughtFnUi = async (args) => {
  const res = await fetch("/api/public/hooks/scalp-dip-dashboard", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "bought",
      signal_id: args.data.signal_id,
      price: args.data.price
    })
  });
  return res.json();
};
const markSoldFnUi = async (args) => {
  const res = await fetch("/api/public/hooks/scalp-dip-dashboard", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "sold",
      signal_id: args.data.signal_id,
      price: args.data.price
    })
  });
  return res.json();
};
const saveCapitalFn = async (args) => {
  const res = await fetch("/api/public/hooks/scalp-dip-dashboard", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "capital",
      capital: args.data.capital
    })
  });
  return res.json();
};
function fmtDate(iso) {
  return iso ? iso.slice(0, 10) : "—";
}
function trackStatus(s) {
  if (s.sold) return {
    label: "مُغلقة — بيع مسجل ✓",
    cls: "text-muted-foreground"
  };
  if (s.sell_signal) return {
    label: "إشارة بيع الآن ⚠",
    cls: "text-amber-400"
  };
  if (s.bought) return {
    label: "قيد المتابعة",
    cls: "text-bull"
  };
  return {
    label: "بانتظار التنفيذ",
    cls: "text-foreground"
  };
}
function StatCard({
  label,
  value,
  sub,
  tone = "default"
}) {
  const cls = tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : tone === "warn" ? "text-amber-400" : tone === "muted" ? "text-muted-foreground" : "text-foreground";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border rounded-xl p-3 shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase font-medium tracking-wider text-muted-foreground mb-1", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-lg font-extrabold font-mono ${cls}`, children: value }),
    sub && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground mt-0.5", children: sub })
  ] });
}
function ScalpDipOperationalPage() {
  const {
    data,
    refetch,
    error: dashError,
    isFetching: dashFetching
  } = useQuery({
    queryKey: ["scalp-dip-operational-dashboard"],
    queryFn: () => fetchDashboard(),
    refetchInterval: 15e3,
    retry: 2
  });
  const dashErrorMsg = dashError ? String(dashError?.message || dashError).slice(0, 300) : data && data.ok === false ? String(data.error || "unknown dashboard error").slice(0, 300) : null;
  const sizing = data?.plan?.sizing;
  const [capitalInput, setCapitalInput] = reactExports.useState(sizing ? String(Math.round(sizing.total_capital)) : "");
  const [savingCap, setSavingCap] = reactExports.useState(false);
  const [capMsg, setCapMsg] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (sizing && !capitalInput) setCapitalInput(String(Math.round(sizing.total_capital)));
  }, [sizing?.total_capital]);
  const [busySignal, setBusySignal] = reactExports.useState(null);
  const [actionMsg, setActionMsg] = reactExports.useState(null);
  const [priceOverrides, setPriceOverrides] = reactExports.useState({});
  const [secondsRemaining, setSecondsRemaining] = reactExports.useState(15 * 60);
  const [isWindowExpired, setIsWindowExpired] = reactExports.useState(false);
  const [isBeforeMarket, setIsBeforeMarket] = reactExports.useState(false);
  const [dryRunActive, setDryRunActive] = reactExports.useState(false);
  const [dryRunSimulationTime, setDryRunSimulationTime] = reactExports.useState(12 * 60 + 34);
  const sirenPlayedRef = reactExports.useRef(false);
  reactExports.useEffect(() => {
    const hasEmergency = (data?.openPositions ?? []).some((p) => p.isAnomaly);
    if (hasEmergency && !sirenPlayedRef.current) {
      playEmergencySiren();
      sirenPlayedRef.current = true;
    } else if (!hasEmergency) {
      sirenPlayedRef.current = false;
    }
  }, [data?.openPositions]);
  reactExports.useEffect(() => {
    function updateCountdown() {
      if (dryRunActive) {
        setDryRunSimulationTime((prev) => prev > 0 ? prev - 1 : 0);
        return;
      }
      try {
        const now = /* @__PURE__ */ new Date();
        const cairoStr = now.toLocaleString("en-US", {
          timeZone: "Africa/Cairo"
        });
        const cairo = new Date(cairoStr);
        const h = cairo.getHours();
        const m = cairo.getMinutes();
        const s = cairo.getSeconds();
        const secondsSinceMidnight = (h * 60 + m) * 60 + s;
        const windowStart = 10 * 3600;
        const windowDuration = 15 * 60;
        if (secondsSinceMidnight < windowStart) {
          setIsBeforeMarket(true);
          setSecondsRemaining(windowDuration);
          setIsWindowExpired(false);
        } else {
          setIsBeforeMarket(false);
          const elapsed = secondsSinceMidnight - windowStart;
          if (elapsed < windowDuration) {
            setSecondsRemaining(windowDuration - elapsed);
            setIsWindowExpired(false);
          } else {
            setSecondsRemaining(0);
            setIsWindowExpired(true);
          }
        }
      } catch {
      }
    }
    updateCountdown();
    const interval = setInterval(updateCountdown, 1e3);
    return () => clearInterval(interval);
  }, [dryRunActive]);
  const displaySeconds = dryRunActive ? dryRunSimulationTime : secondsRemaining;
  const mm = String(Math.floor(displaySeconds / 60)).padStart(2, "0");
  const ss = String(displaySeconds % 60).padStart(2, "0");
  const onSaveCapital = async () => {
    const v = Number(capitalInput);
    if (!Number.isFinite(v) || v <= 0) {
      setCapMsg("⚠️ أدخل مبلغًا صحيحًا أكبر من صفر");
      return;
    }
    setSavingCap(true);
    setCapMsg(null);
    try {
      const r = await saveCapitalFn({
        data: {
          capital: v
        }
      });
      if (r.ok) {
        setCapMsg(`✅ تم الحفظ: ${r.sizing.top_n} مركز × ${Math.round(r.sizing.slot_capital).toLocaleString()} ج.م`);
        await refetch();
      } else {
        setCapMsg(`❌ ${r.error}`);
      }
    } catch (e) {
      setCapMsg(`❌ خطأ: ${e?.message ?? "غير معروف"}`);
    } finally {
      setSavingCap(false);
    }
  };
  const onBought = async (sig) => {
    setBusySignal(sig.id);
    setActionMsg(null);
    try {
      const overrideRaw = priceOverrides[sig.id];
      const price = overrideRaw ? Number(overrideRaw) : void 0;
      const r = await markBoughtFnUi({
        data: {
          signal_id: sig.id,
          price
        }
      });
      if (r.ok) {
        setActionMsg(`✅ ${sig.symbol}: تم تسجيل الشراء @ ${fmtPrice(r.signal?.actual_buy_price ?? sig.entry_price)} ج.م`);
        await refetch();
      } else {
        setActionMsg(`❌ ${sig.symbol}: ${r.error}`);
      }
    } catch (e) {
      setActionMsg(`❌ ${sig.symbol}: ${e?.message ?? "خطأ"}`);
    } finally {
      setBusySignal(null);
    }
  };
  const onSold = async (sig) => {
    setBusySignal(sig.id);
    setActionMsg(null);
    try {
      const overrideRaw = priceOverrides[sig.id];
      const price = overrideRaw ? Number(overrideRaw) : void 0;
      const r = await markSoldFnUi({
        data: {
          signal_id: sig.id,
          price
        }
      });
      if (r.ok) {
        const pnl = r.signal?.realized_pnl;
        setActionMsg(pnl != null ? `✅ ${sig.symbol}: تم تسجيل البيع — صافي ${Math.round(Number(pnl)).toLocaleString()} ج.م (${(Number(r.signal?.realized_pnl_pct) * 100).toFixed(2)}%)` : `✅ ${sig.symbol}: تم تسجيل البيع`);
        await refetch();
      } else {
        setActionMsg(`❌ ${sig.symbol}: ${r.error}`);
      }
    } catch (e) {
      setActionMsg(`❌ ${sig.symbol}: ${e?.message ?? "خطأ"}`);
    } finally {
      setBusySignal(null);
    }
  };
  data?.plan;
  const todaySignals = data?.todaySignals ?? [];
  const batchScanDate = data?.batchScanDate ?? "";
  const openPositions = data?.openPositions ?? [];
  const auditLogs = data?.auditLogs ?? [];
  const sellAlerts = data?.sellAlerts ?? [];
  const totalOpenPnlEgp = openPositions.reduce((sum, p) => sum + p.pnlEgp, 0);
  const simulatedCandidates = [{
    id: 9991,
    scan_date: "2026-09-17",
    symbol: "TMGH",
    entry_price: 54.2,
    gap_pct: 0.0185,
    position_value: 5e3,
    bought: false
  }, {
    id: 9992,
    scan_date: "2026-09-17",
    symbol: "FWRY",
    entry_price: 8.65,
    gap_pct: 0.021,
    position_value: 5e3,
    bought: false
  }];
  const simulatedPositions = [{
    id: 9993,
    scan_date: "2026-09-17",
    symbol: "COMI",
    entry_price: 132.5,
    actual_buy_price: 132.5,
    buy_timestamp: "2026-09-17T08:05:00Z",
    gap_pct: 0.014,
    bid_depth_at_entry: 45e4,
    position_value: 5e3,
    bought: true,
    sold: false,
    day1_status: "HELD",
    day1_price: 132.5,
    day2_status: null,
    day2_price: null,
    day3_status: null,
    day3_price: null,
    exit_reason: null,
    bid_confirmed_at_exit: null,
    extra_hold_used: false,
    shadow_exit_price: null,
    shadow_pnl: null,
    shadow_pnl_pct: null,
    actual_sell_price: null,
    sell_timestamp: null,
    realized_pnl: null,
    realized_pnl_pct: null,
    sell_signal: false,
    sell_signal_reason: null,
    created_at: "2026-09-17T08:00:00Z",
    updated_at: "2026-09-17T08:00:00Z",
    currentPrice: 135.2,
    pnlEgp: 102,
    pnlPct: 0.0204,
    daysHeld: 2,
    daysRemaining: 3,
    exitDate: "2026-09-22",
    exitDayName: "الثلاثاء",
    isScheduledExit: false,
    isAnomaly: false,
    shares: 37
  }, {
    id: 9994,
    scan_date: "2026-09-17",
    symbol: "EKHO",
    entry_price: 1.3,
    actual_buy_price: 1.3,
    buy_timestamp: "2026-09-17T08:05:00Z",
    gap_pct: 0.022,
    bid_depth_at_entry: 12e4,
    position_value: 5e3,
    bought: true,
    sold: false,
    day1_status: "HELD",
    day1_price: 1.3,
    day2_status: null,
    day2_price: null,
    day3_status: null,
    day3_price: null,
    exit_reason: "STOP_LOSS",
    bid_confirmed_at_exit: true,
    extra_hold_used: false,
    shadow_exit_price: null,
    shadow_pnl: null,
    shadow_pnl_pct: null,
    actual_sell_price: null,
    sell_timestamp: null,
    realized_pnl: null,
    realized_pnl_pct: null,
    sell_signal: true,
    sell_signal_reason: "STOP_LOSS",
    created_at: "2026-09-17T08:00:00Z",
    updated_at: "2026-09-17T08:00:00Z",
    currentPrice: 1.15,
    pnlEgp: -576,
    pnlPct: -0.1154,
    daysHeld: 2,
    daysRemaining: 3,
    exitDate: "2026-09-22",
    exitDayName: "الثلاثاء",
    isScheduledExit: false,
    isAnomaly: false,
    shares: 3846
  }];
  const activeCandidatesList = dryRunActive ? simulatedCandidates : todaySignals;
  const activeOpenPositionsList = dryRunActive ? simulatedPositions : openPositions;
  const emergencyAnomalyPositions = activeOpenPositionsList.filter((p) => p.isAnomaly);
  activeOpenPositionsList.filter((p) => p.isScheduledExit);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 md:p-6 max-w-6xl mx-auto space-y-5", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DataFreshnessBanner, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 space-y-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LivePriceBadge, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MarketStateGauge, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 space-y-2", children: [
      dashErrorMsg && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-bear/40 bg-bear/10 text-bear px-3 py-2 text-xs font-bold", children: [
        "❌ فشل جلب بيانات الداشبورد: ",
        dashErrorMsg,
        " — الصفحة هتعيد المحاولة تلقائياً كل 15 ثانية."
      ] }),
      dashFetching && !dashErrorMsg && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: "⏳ جاري تحميل بيانات الداشبورد..." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-wrap items-center justify-between gap-3 bg-card border rounded-2xl p-4 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl", children: "⚡" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-black tracking-tight", children: "غرفة العمليات — المومنتم الأسبوعي (قمة سنوية طازة)" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "أتمتة كاملة للمسح والمتابعة • نظام أسبوعي: دخول الأحد، خروج افتتاح الأسبوع القادم • دورك الوحيد: ضغط زر الشراء أو البيع في ثاندر بعد التنبيه." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "mt-2 text-xs px-3 py-1.5 rounded-lg border bg-muted hover:bg-accent transition", onClick: async () => {
          try {
            const r = await fetch("/api/public/hooks/archive-folder?action=open");
            const j = await r.json();
            if (j.ok) console.log("archive:", j.catchup);
          } catch {
          }
        }, children: "📁 فتح مجلد أرشيف البيانات اليومية" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
          setDryRunActive(!dryRunActive);
          if (!dryRunActive) {
            playSignalChime();
          }
        }, className: `rounded-xl px-3.5 py-2 text-xs font-bold transition-all border ${dryRunActive ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10" : "bg-muted hover:bg-muted/70 text-foreground border-border"}`, children: dryRunActive ? "🧪 وضع المحاكاة مفعّل ✓ (إيقاف)" : "🧪 تجربة المحاكاة (Dry Run)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => refetch(), className: "rounded-xl px-3.5 py-2 text-xs font-semibold bg-muted hover:bg-muted/70 text-foreground border border-border", children: "تحديث البيانات 🔄" })
      ] })
    ] }),
    dryRunActive && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg", children: "💡" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-amber-200", children: "أنت الآن في وضع المحاكاة التجريبية: اختبر مظهر العداد التنازلي وتنبيهات الطوارئ وتجربة الأصوات قبل بدء الجلسة الحقيقية." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => playSignalChime(), className: "bg-bull/20 hover:bg-bull/30 text-bull px-2.5 py-1 rounded text-[11px] font-bold", children: "🔔 نغمة الإشارة (10:00)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => playEmergencySiren(), className: "bg-bear/20 hover:bg-bear/30 text-bear px-2.5 py-1 rounded text-[11px] font-bold", children: "🚨 صفارة الطوارئ" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => playScheduledExitTone(), className: "bg-primary/20 hover:bg-primary/30 text-primary-foreground px-2.5 py-1 rounded text-[11px] font-bold", children: "📅 نغمة البيع المجدول" })
      ] })
    ] }),
    (emergencyAnomalyPositions.length > 0 || sellAlerts.length > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-3", children: [
      emergencyAnomalyPositions.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border-2 border-amber-500 bg-amber-500/20 p-4 shadow-md flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl", children: "⚠️" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-black text-amber-300", children: [
              "تنبيه طوارئ: ",
              p.symbol,
              " — تحقق فوراً من السهم!"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-amber-200/90 mt-0.5", children: "السبب: رصد خبر سلبي حاد أو تقلب استثنائي غير متوقع يهدد الصفقة قبل اكتمال مدة المسك." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => onSold(p), disabled: busySignal === p.id, className: "rounded-xl px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white", children: "تخارج اضطراري" })
      ] }, `anom-${p.id}`)),
      sellAlerts.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border-2 border-primary/50 bg-primary/15 p-4 flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl", children: "📅" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-black text-primary-foreground", children: [
              "حان وقت البيع المجدول: ",
              s.symbol,
              " (اكتملت 5 جلسات — خروج افتتاح الأسبوع القادم)"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mt-0.5", children: "نهاية فترة المسك الأسبوعية. الخروج بسعر السوق في تطبيق ثاندر عند الافتتاح — نفس قاعدة القياس التاريخي." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => onSold(s), disabled: busySignal === s.id, className: "rounded-xl px-4 py-2 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90", children: busySignal === s.id ? "..." : "تم البيع ✓" })
      ] }, `sa-${s.id}`))
    ] }),
    actionMsg && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card p-3 text-xs font-bold text-bull flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "🔔" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: actionMsg })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border bg-card p-5 shadow-sm space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b pb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl", children: "🎯" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-black", children: "إشارات اليوم (الساعة 10:00 صباحاً)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold", children: [
              activeCandidatesList.length,
              " مرشح"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "الأسهم المؤهلة بعد كل فلاتر النظام الصادق: شريعة فقط + سيولة ≥ 200 ألف ج.م/يوم (أعلى 100) + زخم 5 جلسات بين 8%-45% + فلتر النظام (تراكم 10 أسابيع) + قاعدة الفجوة عند الافتتاح (-3% إلى +2%)." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: !isWindowExpired ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 rounded-xl bg-bull/15 border border-bull/30 px-3.5 py-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base animate-pulse", children: "⏱️" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-bull font-bold", children: "نافذة التنفيذ الموصى بها" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-base font-black font-mono text-bull tracking-wider", children: [
              "متبقي ",
              mm,
              ":",
              ss,
              " دقيقة"
            ] })
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 rounded-xl bg-amber-500/15 border border-amber-500/40 px-3.5 py-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base", children: "⚠️" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-amber-400 font-bold", children: "انتهت نافذة الـ 15 دقيقة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-amber-300 font-semibold", children: "الفرصة الأصلية بعيدة — تحقق من السعر قبل الشراء" })
          ] })
        ] }) })
      ] }),
      isWindowExpired && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "⚠️" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "تنبيه تأخر:" }),
          " تجاوزت مدة الـ 15 دقيقة الأولى من الجلسة. الإشارات لا تُحذف تلقائياً حرصاً على عدم تفويت الفرص، ولكن تأكد من سعر السهم الحالي في تطبيق ثاندر قبل الضغط على الشراء."
        ] })
      ] }),
      activeCandidatesList.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/40 text-muted-foreground border-b", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-right font-bold", children: "السهم" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-right font-bold", children: "سعر إشارة الدخول" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-right font-bold", children: "زخم 5 جلسات %" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-right font-bold", children: "قيمة المركز المخطط" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-right font-bold", children: "السعر المنفذ (إن اختلف)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-center font-bold", children: "الإجراء في ثاندر" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-border", children: activeCandidatesList.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/15 transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-3 font-bold font-mono text-sm", children: [
            s.symbol,
            s._halal && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-sans", children: "شريعة" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-3 font-mono font-bold text-foreground", children: [
            fmtPrice(Number(s.entry_price)),
            " ج.م"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-3 font-mono font-bold text-bear", children: [
            "+",
            (Number(s.gap_pct) * 100).toFixed(2),
            "%"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-3 font-mono font-semibold", children: [
            Math.round(Number(s.position_value)).toLocaleString(),
            " ج.م"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", step: "0.01", placeholder: fmtPrice(Number(s.entry_price)), value: priceOverrides[s.id] ?? "", onChange: (e) => setPriceOverrides((p) => ({
            ...p,
            [s.id]: e.target.value
          })), className: "w-24 rounded-lg border bg-background px-2 py-1 text-xs font-mono" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-center", children: !s.bought ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => onBought(s), disabled: busySignal === s.id, className: "rounded-xl px-4 py-1.5 text-xs font-black bg-bull text-bull-foreground hover:bg-bull/90 transition-all shadow-sm disabled:opacity-50", children: busySignal === s.id ? "جاري الحفظ..." : "تم الشراء ✓" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-bull bg-bull/20 px-3 py-1 rounded-full", children: "تم الشراء قيد المتابعة ✓" }) })
        ] }, s.id)) })
      ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-6 text-muted-foreground text-xs", children: isBeforeMarket ? "🕒 ننتظر بدء جلسة التداول في تمام الساعة 10:00 صباحاً لإطلاق إشارات اليوم." : "لا مرشحين داخل نطاق الزخم (8%-45%) هذا الأسبوع — أو فلتر النظام أوقف التداول. النظام أسبوعي: الدخول الأحد فقط." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border bg-card p-5 shadow-sm space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl", children: "🔎" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-black", children: "التتبع الحي — كل إشارة في الدفعة الحالية" }),
          batchScanDate && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold font-mono", children: [
            "دفعة مسح ",
            batchScanDate
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "رُشِّح بكام (سعر الترشيح) ← السعر الحي الآن ← الفرق اللحظي %. تحديث تلقائي كل 15 ثانية. «—» يعني لا يوجد سعر لحظي لهذا السهم الآن (السعر المرجعي يظل سعر الترشيح)." })
      ] }) }),
      todaySignals.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/40 text-muted-foreground border-b", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-right font-bold", children: "السهم" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-right font-bold", children: "رُشِّح @" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-right font-bold", children: "حدود الشراء" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-right font-bold", children: "السعر الحي" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-right font-bold", children: "% حي من الترشيح" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-right font-bold", children: "الحالة" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-border", children: todaySignals.map((s) => {
          const st = trackStatus(s);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/15 transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-3 font-bold font-mono text-sm", children: [
              s.symbol,
              s._halal && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-sans", children: "شريعة" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 font-mono text-[11px] text-muted-foreground", children: s._bandLo != null && s._bandHi != null ? `${fmtPrice(s._bandLo)} – ${fmtPrice(s._bandHi)}` : "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 font-mono font-bold", children: s.livePrice != null ? `${fmtPrice(s.livePrice)} ج.م` : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "—" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `p-3 font-mono font-bold ${s.livePct == null ? "text-muted-foreground" : s.livePct >= 0 ? "text-bull" : "text-bear"}`, children: s.livePct != null ? `${s.livePct >= 0 ? "+" : ""}${(s.livePct * 100).toFixed(2)}%` : "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-[11px] font-bold px-2 py-0.5 rounded bg-muted/60 ${st.cls}`, children: st.label }) })
          ] }, `lt-${s.id}`);
        }) })
      ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-6 text-muted-foreground text-xs", children: "لا توجد إشارات في الدفعة الحالية — ستظهر هنا فور أول مسح أسبوعي (الأحد)." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border bg-card p-5 shadow-sm space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b pb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl", children: "💼" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-lg font-black", children: [
              "الصفقات المفتوحة قيد المتابعة (",
              activeOpenPositionsList.length,
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "متابعة حية مستمرة لكل صفقة تم تأكيد شرائها طوال الأسبوع (5 جلسات) — الخروج الوحيد: افتتاح أول جلسة الأسبوع القادم. بلا وقف خسارة (مُقاس: يزيد الخسارة) — الحماية عبر تصغير الحجم تلقائياً." })
        ] }),
        activeOpenPositionsList.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs font-bold font-mono", children: [
          "إجمالي الأرباح اللحظية:",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: totalOpenPnlEgp >= 0 ? "text-bull" : "text-bear", children: [
            totalOpenPnlEgp >= 0 ? "+" : "",
            Math.round(totalOpenPnlEgp).toLocaleString(),
            " ج.م"
          ] })
        ] })
      ] }),
      activeOpenPositionsList.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-2 gap-4", children: activeOpenPositionsList.map((pos) => {
        const progressPct = Math.min(100, Math.round(pos.daysHeld / 5 * 100));
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-2xl border p-4 space-y-3 transition-all ${pos.isAnomaly ? "border-amber-500 bg-amber-500/10" : "bg-card border-border hover:border-border/80"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base font-black font-mono", children: pos.symbol }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] text-muted-foreground mr-2", children: [
                "دخول: ",
                fmtDate(pos.scan_date),
                " @ ",
                fmtPrice(Number(pos.actual_buy_price ?? pos.entry_price)),
                " ج.م"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-black font-mono", children: [
                fmtPrice(pos.currentPrice),
                " ج.م"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `text-[11px] font-bold font-mono ${pos.pnlPct >= 0 ? "text-bull" : "text-bear"}`, children: [
                pos.pnlPct >= 0 ? "+" : "",
                (pos.pnlPct * 100).toFixed(2),
                "% (",
                pos.pnlEgp >= 0 ? "+" : "",
                Math.round(pos.pnlEgp).toLocaleString(),
                " ج.م)"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 bg-muted/40 p-2.5 rounded-xl border border-border/50 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-[11px]", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-muted-foreground", children: "مسار الأسبوع (تقويم EGX):" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-foreground", children: [
                "جلسة ",
                Math.min(pos.daysHeld, 5),
                " من 5 (متبقي ",
                pos.daysRemaining,
                " جلسة)"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full bg-muted rounded-full h-2 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-full rounded-full transition-all ${pos.daysHeld >= 5 ? "bg-primary" : "bg-bull"}`, style: {
              width: `${progressPct}%`
            } }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-[10px] text-muted-foreground pt-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "بلا وقف خسارة (مُقاس: يزيد الخسارة) — الحماية: تصغير الحجم التلقائي" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "الخروج: ",
                pos.exitDayName,
                " ",
                pos.exitDate,
                " عند الافتتاح"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between pt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] text-muted-foreground", children: [
              pos.shares.toLocaleString(),
              " سهم"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => onSold(pos), disabled: busySignal === pos.id, className: "rounded-xl px-4 py-1.5 text-xs font-black bg-bear/20 text-bear hover:bg-bear/30 disabled:opacity-50", children: busySignal === pos.id ? "..." : "تم البيع في ثاندر ✓" })
          ] })
        ] }, pos.id);
      }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-6 text-muted-foreground text-xs", children: "لا توجد صفقات مفتوحة حالياً. عند ظهور إشارة وضغطك على «تم الشراء»، ستظهر الصفقة هنا وتخضع للمراقبة الحية بالثواني." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border bg-muted/20 p-4 space-y-3 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-foreground font-bold", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "📅" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "التقويم التشغيلي الصريح لـ EGX وتوزيع الأيام:" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid md:grid-cols-2 gap-3 text-muted-foreground leading-relaxed", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card p-3 rounded-xl border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { className: "text-foreground block mb-1", children: "دورة الأسبوع (5 جلسات، يتخطى عطلة نهاية الأسبوع):" }),
          "الدخول: افتتاح أول جلسة الأسبوع (الأحد) — الخروج: افتتاح أول جلسة الأسبوع القادم.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "مثال حي:" }),
          " دخول ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "الأحد" }),
          " ➔ الأسبوع يمشي (الأحد-الخميس) ➔ الجمعة والسبت خارج الحساب ➔ خروج ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "الأحد القادم" }),
          " عند الافتتاح. بلا وقف خسارة ولا جني أرباح — الاتنين مُقاسين: يزيدوا الخسارة."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card p-3 rounded-xl border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { className: "text-foreground block mb-1", children: "مهام عطلة الجمعة والسبت (التحليل المستقل):" }),
          "تُستغل عطلة الجمعة والسبت في تشغيل العمليات التحليلية غير الحية دون تعارض مع التداول:",
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "list-disc pr-4 mt-1 space-y-0.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "إصدار التقرير الأسبوعي الشامل للمحفظة." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "فحص مؤشر الألفا (Alpha) ومقارنة الأداء بـ EGX30." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "مراجعة وتحديث قائمة أسهم الشريعة (كل 6 شهور)." })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "rounded-2xl border bg-card p-4 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-56", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-bold mb-1", children: "💰 رأس المال المتاح للتداول" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground mb-2", children: "يُحسب عدد المراكز تلقائيًا: TOP_N = رأس المال ÷ 20,000 (من 1 إلى 5 مراكز — الإعداد المدروس N5: أفضل توازن عائد/اتساق مقاس). فوق 100 ألف يزيد حجم المركز الواحد." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 items-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: 1, step: 1e3, value: capitalInput, onChange: (e) => setCapitalInput(e.target.value), placeholder: "مثال: 100000", className: "w-40 rounded-xl border bg-background px-3 py-1.5 text-sm font-mono" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onSaveCapital, disabled: savingCap, className: "rounded-xl px-4 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50", children: savingCap ? "جاري الحفظ…" : "حفظ" })
        ] }),
        capMsg && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[11px]", children: capMsg })
      ] }),
      sizing && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-muted/40 px-3 py-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] text-muted-foreground", children: "رأس المال الفعّال" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-bold font-mono", children: [
            Math.round(sizing.total_capital).toLocaleString(),
            " ج.م"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-muted/40 px-3 py-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] text-muted-foreground", children: "عدد المراكز (TOP_N)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-bold font-mono", children: sizing.top_n })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-muted/40 px-3 py-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] text-muted-foreground", children: "حجم المركز (SLOT)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-bold font-mono", children: [
            Math.round(sizing.slot_capital).toLocaleString(),
            " ج.م"
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border bg-card p-5 shadow-sm space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between border-b pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-bold", children: "📜 سجل القرارات والتنبيهات الموثق (Decision Audit Log)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground mt-0.5", children: "سجل دائم ومؤرخ بالثانية لكل إشارة صدرت، كل إنذار طوارئ، ورد فعل المستخدم لتوثيق الأداء تاريخياً." })
      ] }) }),
      auditLogs.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto max-h-60", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/40 text-muted-foreground sticky top-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "التوقيت" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "نوع الحدث" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "السهم" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "السعر" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "تصرف المستخدم" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-border", children: auditLogs.map((log) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/15", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-mono text-[10px] text-muted-foreground", children: log.created_at ? log.created_at.slice(0, 19).replace("T", " ") : "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-2 font-semibold", children: [
            log.event_type === "USER_BOUGHT" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-bull", children: "🛒 تأكيد شراء" }),
            log.event_type === "USER_SOLD" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "💰 تأكيد بيع" }),
            log.event_type === "EMERGENCY_STOP_LOSS" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-bear font-bold", children: "🚨 إنذار وقف خسارة" }),
            log.event_type === "SIGNAL_10AM" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "🎯 إشارة 10:00 صباحاً" }),
            log.event_type === "SCHEDULED_EXIT" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "📅 خروج أسبوعي مجدول" }),
            log.event_type === "MW_WEEKLY_SCAN" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-bull", children: "🔔 مسح أسبوعي — إشعار شراء" }),
            log.event_type === "MW_WEEKLY_BUY" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-bull", children: "🛒 شراء أسبوعي (ورقي)" }),
            log.event_type === "MW_WEEKLY_EXIT" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "📤 خروج أسبوعي — إغلاق الدفعة" }),
            log.event_type === "MW_REGIME_CASH" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-warn", children: "⚠️ فلتر النظام — أسبوع كاش" }),
            log.event_type === "MW_WEEKLY_GAP_SKIP" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-warn", children: "↩️ مرشح مستبعد — الفجوة خارج النطاق" }),
            !["USER_BOUGHT", "USER_SOLD", "EMERGENCY_STOP_LOSS", "SIGNAL_10AM", "SCHEDULED_EXIT", "MW_WEEKLY_SCAN", "MW_WEEKLY_BUY", "MW_WEEKLY_EXIT", "MW_REGIME_CASH", "MW_WEEKLY_GAP_SKIP"].includes(log.event_type) && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-[10px] text-muted-foreground", children: log.event_type })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-mono font-bold", children: log.symbol }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-2 font-mono", children: [
            log.trigger_price ? fmtPrice(Number(log.trigger_price)) : "—",
            " ج.م"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 rounded text-[10px] font-bold bg-muted", children: log.user_action }) })
        ] }, log.id)) })
      ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "لا توجد سجلات قرارات سابقة بعد. كل نقرة شراء أو بيع أو تنبيه طوارئ ستُوثق هنا تلقائياً." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border border-warn/40 bg-warn/10 p-4 space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-sm", children: "📋 الأداء المُقاس (شريعة فقط — باك-تست صادق 512 أسبوع 2016-2026، تكلفة ثاندر 0.05%)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "النظام الحالي (آخر 90 يوم)", value: `~${CURRENT_REGIME_WEEKLY_LOW_EGP.toLocaleString()}-${CURRENT_REGIME_WEEKLY_HIGH_EGP.toLocaleString()} ج.م`, tone: "bull", sub: "أفضل فترة في العقد — ليس حقاً مكتسباً" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "المتوسط الطويل الموثوق (10 سنين)", value: `${BACKTEST_WEEKLY_EGP.toLocaleString()} ج.م`, tone: "default", sub: `فاصل ثقة 95%: ${BACKTEST_WEEKLY_EGP_LOW.toLocaleString()}-${BACKTEST_WEEKLY_EGP_HIGH.toLocaleString()}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "أسوأ أسبوع (10 سنين)", value: `${BACKTEST_WORST_WEEK_PCT.toLocaleString()}%`, tone: "bear" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "أقصى تراجع (10 سنين)", value: `${BACKTEST_MAXDD_PCT.toLocaleString()}%`, tone: "bear", sub: "مع الحمايات التلقائية: ~27-30%" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border/50 bg-card/60 p-2.5 text-xs text-muted-foreground leading-relaxed", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { className: "text-foreground", children: "شكل الأسابيع الحقيقي (مقاس):" }),
        " ~25-30% فقط من الأسابيع تتجاوز 2,500 ج.م ووسيط الأسبوع ≈ 0 — أغلب الأسابيع صغيرة أو سالبة والمتوسط بيتحقق من قفزات نادرة (زي +21,500 و+34,900 في يونيو/يوليو 2026) لا يمكن توقيتها.",
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { className: "text-foreground", children: " ولا يوجد وعد بربح ثابت — مرفوض من كل الأطراف." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground leading-relaxed", children: BACKTEST_DISCLAIMER_AR })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "text-center py-4 text-xs text-muted-foreground border-t", children: "قواعد فلاتر الاستراتيجية ومعادلاتها مجمدة لمدة 4-6 أسابيع للاختبار والمراقبة الصارمة." })
  ] });
}
export {
  ScalpDipOperationalPage as component
};
