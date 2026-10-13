import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "../_libs/isbot.mjs";
function Page() {
  const [r, setR] = reactExports.useState(null);
  const [err, setErr] = reactExports.useState(null);
  const [days, setDays] = reactExports.useState(7);
  const [filter, setFilter] = reactExports.useState("ALL");
  const [loading, setLoading] = reactExports.useState(false);
  const load = async (d) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/hooks/shadow-report?days=${d}`, {
        cache: "no-store"
      });
      const j = await res.json();
      setR(j);
      setErr(null);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    load(days);
  }, [days]);
  const filtered = (r?.decisions ?? []).filter((d) => filter === "ALL" ? true : d.rule === filter);
  const rules = Array.from(new Set((r?.decisions ?? []).map((d) => d.rule)));
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { dir: "rtl", className: "min-h-screen bg-background p-6 font-sans", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "Shadow Report" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "كل قرار Smart Exit vs السعر الفعلي بعده — عشان نعرف هل النظام صح ولا غلط قبل تفعيله فعلياً." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/marketwatch-health", className: "rounded border px-3 py-1 text-sm hover:bg-muted", children: "← فحص Volume" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: days, onChange: (e) => setDays(Number(e.target.value)), className: "rounded border bg-background px-2 py-1 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 1, children: "آخر يوم" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 3, children: "آخر 3 أيام" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 7, children: "آخر أسبوع" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 14, children: "آخر أسبوعين" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 30, children: "آخر شهر" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => load(days), className: "rounded border px-3 py-1 text-sm hover:bg-muted", disabled: loading, children: loading ? "..." : "↻" })
      ] })
    ] }),
    err && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-500", children: err }),
    r && r.total_decisions === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-6 text-center text-yellow-700", children: [
      "مفيش أي قرارات Smart Exit في الفترة دي.",
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-sm", children: "النظام لسه في Shadow Mode ومحتاج السوق يفتح عشان يبدأ يسجّل." })
    ] }),
    r && r.summary.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold", children: "ملخص الدقة لكل قاعدة" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 md:grid-cols-2 lg:grid-cols-3", children: r.summary.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-sm font-semibold", children: s.rule }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-2xl font-bold ${s.accuracy_pct == null ? "text-muted-foreground" : s.accuracy_pct >= 70 ? "text-green-600" : s.accuracy_pct >= 50 ? "text-yellow-600" : "text-red-600"}`, children: s.accuracy_pct == null ? "—" : `${s.accuracy_pct}%` })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 grid grid-cols-4 gap-1 text-center text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Cell, { label: "إجمالي", value: s.total }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Cell, { label: "صح", value: s.correct, tone: "good" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Cell, { label: "غلط", value: s.wrong, tone: "bad" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Cell, { label: "محايد", value: s.neutral })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 text-xs text-muted-foreground", children: [
          "Shadow: ",
          s.shadow,
          " · Live: ",
          s.live,
          " · بدون بيانات: ",
          s.no_ticks
        ] })
      ] }, s.rule)) })
    ] }),
    r && r.decisions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold", children: "تفاصيل القرارات" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: filter, onChange: (e) => setFilter(e.target.value), className: "rounded border bg-background px-2 py-1 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "ALL", children: "كل القواعد" }),
          rules.map((r2) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: r2, children: r2 }, r2))
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto rounded-lg border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/50 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2", children: "الوقت" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2", children: "السهم" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2", children: "القاعدة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2", children: "Mode" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2", children: "السعر" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2", children: "P&L%" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2", children: "Max 15m" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2", children: "تعافي%" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2", children: "P+30m" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2", children: "التقييم" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: filtered.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-mono", children: new Date(d.ts).toLocaleString("ar-EG", {
            hour12: false
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-semibold", children: d.symbol }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-mono text-[10px]", children: d.rule }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded px-1.5 py-0.5 text-[10px] ${d.shadow ? "bg-blue-500/20 text-blue-700" : "bg-red-500/20 text-red-700"}`, children: d.shadow ? "Shadow" : "Live" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-mono", children: fmt(d.price) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `p-2 font-mono ${(d.pnl_pct ?? 0) < 0 ? "text-red-600" : "text-green-600"}`, children: d.pnl_pct == null ? "—" : `${d.pnl_pct.toFixed(2)}%` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-mono", children: fmt(d.max_15m) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `p-2 font-mono ${(d.recover_pct ?? 0) > 0.5 ? "text-red-600" : "text-muted-foreground"}`, children: d.recover_pct == null ? "—" : `${d.recover_pct.toFixed(2)}%` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-mono", children: fmt(d.p_30m ?? null) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Verdict, { v: d.verdict }) })
        ] }, d.id)) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-lg border bg-muted/30 p-4 text-xs leading-6 text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-foreground", children: "إزاي بنقيّم القرار؟" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        "• ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "خروج (HARD_FLOOR / VOLUME_DEATH):" }),
        " صح لو السعر بعد 15د ما ارتفعش أكتر من 0.3%. غلط لو ارتفع 0.8%+ (يبقى خرجنا بدري)."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        "• ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "PREBUY_VOLUME_FILTER (تجاهل شراء):" }),
        " صح لو السعر ما وصلش لـ +1.5% في 30د. غلط لو وصل لـ +2% (كنا هنكسب لو دخلنا)."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "• لازم نسبة الدقة الإجمالية تبقى 70%+ لكل قاعدة قبل ما نطلع من Shadow Mode." })
    ] })
  ] }) });
}
function Cell({
  label,
  value,
  tone
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-lg font-bold ${tone === "good" ? "text-green-600" : tone === "bad" ? "text-red-600" : ""}`, children: value }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground", children: label })
  ] });
}
function Verdict({
  v
}) {
  const map = {
    correct: {
      label: "✓ صح",
      cls: "bg-green-500/20 text-green-700"
    },
    wrong: {
      label: "✗ غلط",
      cls: "bg-red-500/20 text-red-700"
    },
    neutral: {
      label: "◦ محايد",
      cls: "bg-muted text-muted-foreground"
    },
    no_ticks: {
      label: "لا بيانات",
      cls: "bg-muted text-muted-foreground"
    },
    no_price: {
      label: "بلا سعر",
      cls: "bg-muted text-muted-foreground"
    }
  };
  const s = map[v];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded px-1.5 py-0.5 text-[10px] ${s.cls}`, children: s.label });
}
function fmt(n) {
  if (n == null) return "—";
  return Number(n).toFixed(2);
}
export {
  Page as component
};
