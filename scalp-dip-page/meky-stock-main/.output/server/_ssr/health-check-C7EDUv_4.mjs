import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
const COLOR = {
  green: "border-bull/50 bg-bull/10 text-bull",
  yellow: "border-warn/50 bg-warn/10 text-warn",
  red: "border-bear/60 bg-bear/15 text-bear",
  idle: "border-muted bg-muted/30 text-muted-foreground"
};
const BADGE = {
  green: "✓ يعمل",
  yellow: "⚠ بطء",
  red: "✗ متوقف",
  idle: "— خامد"
};
function HealthCheckPage() {
  const [data, setData] = reactExports.useState(null);
  const [err, setErr] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(false);
  const run = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/public/hooks/self-test", {
        cache: "no-store"
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData(await r.json());
      setErr(null);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    run();
    const id = setInterval(run, 3e4);
    return () => clearInterval(id);
  }, []);
  const grouped = data ? {
    data: data.checks.filter((c) => c.category === "data"),
    cron: data.checks.filter((c) => c.category === "cron"),
    output: data.checks.filter((c) => c.category === "output")
  } : null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background text-foreground p-4", dir: "rtl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-5xl mx-auto space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "🔍 فحص التجميع الشامل" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "كل مصادر البيانات + كل cron jobs — تلقائياً كل 30ث" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: run, disabled: loading, className: "rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50", children: loading ? "جارٍ الفحص…" : "🔄 فحص الآن" })
    ] }),
    err && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-bear/50 bg-bear/10 text-bear p-3 text-sm", children: err }),
    data && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `rounded-xl border ${COLOR[data.overall]} p-4`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-3xl", children: data.overall === "green" ? "✅" : data.overall === "yellow" ? "⚠️" : data.overall === "red" ? "🚨" : "⚪" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-lg", children: data.overall === "green" ? "كل شيء يعمل بشكل صحيح" : data.overall === "yellow" ? "بطء في بعض المصادر" : data.overall === "red" ? "مصدر أو أكثر متوقف" : "السوق مغلق — لا نتوقع نشاط" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs opacity-80", children: [
            data.marketOpen ? "🟢 السوق مفتوح" : "⚪ السوق مغلق",
            " · آخر فحص: ",
            new Date(data.now).toLocaleTimeString("ar-EG")
          ] })
        ] })
      ] }) }),
      grouped && ["data", "cron", "output"].map((cat) => /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-bold text-muted-foreground mb-2", children: cat === "data" ? "📥 مصادر البيانات (الإكستنشن)" : cat === "cron" ? "⚙️ المهام المجدولة (Cron)" : "📊 المخرجات و الجودة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-2 sm:grid-cols-2", children: grouped[cat].map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-lg border ${COLOR[c.status]} p-3`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: c.label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-mono px-2 py-0.5 rounded bg-background/50", children: BADGE[c.status] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs mb-1", children: c.evidence }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] opacity-70", children: [
            "متوقع: ",
            c.expected
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] opacity-50 mt-1", children: c.detail })
        ] }, c.key)) })
      ] }, cat)),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-muted bg-muted/20 p-3 text-xs text-muted-foreground", children: "💡 هذا الفحص يشتغل تلقائياً 2 مرة يومياً (10:15 صباحاً و 2:45 عصراً القاهرة). لو أي مصدر أحمر يوصلك تنبيه تليجرام فوراً." })
    ] })
  ] }) });
}
export {
  HealthCheckPage as component
};
