import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-DcfJRNR2.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
function ExtDiagPage() {
  const q = useQuery({
    queryKey: ["ext-diag"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("extension_diag").select("*").order("ts", {
        ascending: false
      }).limit(60);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 5e3
  });
  const rows = q.data ?? [];
  const latest = rows[0];
  const bgRows = rows.filter((r) => r.visibility_state === "hidden");
  const fgRows = rows.filter((r) => r.visibility_state === "visible");
  const avg = (arr, key) => {
    const nums = arr.map((r) => Number(r[key])).filter((n) => Number.isFinite(n));
    if (!nums.length) return null;
    return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length * 10) / 10;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", className: "max-w-6xl mx-auto p-4 md:p-6 space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between flex-wrap gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "🔬 Extension Throttling Diagnostic" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "يحدّث كل 5 ثوان — الاكستنشن ترسل كل 30 ثانية" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border p-3 bg-card text-sm space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: "📋 كيف تختبر:" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "list-decimal pr-6 space-y-0.5 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "ثبّت الاكستنشن v4.1.97 (فيها الـ diagnostic)." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "افتح تاب واحد على أي سهم ثاندر (`/ar/assets/…`)." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "سيبه في الخلفية 5-10 دقايق (روح لتاب تاني أو YouTube)." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "ارجع لهنا وشوف الأرقام." })
      ] })
    ] }),
    q.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "جاري التحميل…" }),
    q.error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-red-500", children: String(q.error.message) }),
    latest && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { title: "آخر تسجيل", value: new Date(latest.ts).toLocaleTimeString("ar-EG"), sub: latest.symbol || "—" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { title: "Visibility", value: latest.visibility_state ?? "—", tone: latest.visibility_state === "visible" ? "good" : "warn" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { title: "Web Audio (v4.1.98)", value: (() => {
        const s = latest.extra?.ac_state;
        if (s === "running") return "✅ running";
        if (s === "suspended") return "⏸ suspended";
        if (s === "closed") return "❌ closed";
        return String(s ?? "—");
      })(), tone: latest.extra?.ac_state === "running" ? "good" : "bad", sub: `ac.currentTime=${Number(latest.extra?.ac_current_time ?? 0).toFixed(2)}s | resume ${latest.extra?.ac_resume_ok ?? 0}/${latest.extra?.ac_resume_attempts ?? 0}` }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { title: "Depth آخر 30ث", value: String(latest.depth_count_30s ?? 0), tone: (latest.depth_count_30s ?? 0) >= 3 ? "good" : "warn", sub: `آخر depth: ${latest.last_depth_age_ms != null ? Math.round(latest.last_depth_age_ms / 1e3) + "s ago" : "—"}` })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SummaryCard, { label: "🟢 Foreground (visible)", rows: fgRows, avg }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SummaryCard, { label: "🔴 Background (hidden)", rows: bgRows, avg })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "وقت" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "سهم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "Visibility" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "AC state" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "AC time" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "Depth/30s" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "Last depth" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "hasFocus" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: rows.map((r) => {
        const e = r.extra ?? {};
        const acState = String(e.ac_state ?? "—");
        const acTime = Number(e.ac_current_time ?? 0);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-mono", children: new Date(r.ts).toLocaleTimeString("ar-EG") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-mono", children: r.symbol ?? "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `p-2 ${r.visibility_state === "hidden" ? "text-amber-500" : "text-green-500"}`, children: r.visibility_state }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `p-2 ${acState === "running" ? "text-green-500" : "text-red-500"}`, children: acState }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-2 font-mono", children: [
            acTime.toFixed(1),
            "s"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `p-2 font-bold ${(r.depth_count_30s ?? 0) === 0 ? "text-red-500" : "text-foreground"}`, children: r.depth_count_30s ?? 0 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: r.last_depth_age_ms != null ? Math.round(r.last_depth_age_ms / 1e3) + "s" : "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: String(e.has_focus ?? "—") })
        ] }, r.id);
      }) })
    ] }) })
  ] });
}
function StatCard({
  title,
  value,
  sub,
  tone = "default"
}) {
  const bg = tone === "good" ? "bg-green-950/30 border-green-800/50" : tone === "warn" ? "bg-amber-950/30 border-amber-800/50" : tone === "bad" ? "bg-red-950/30 border-red-800/50" : "bg-card border-border";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-lg border p-3 ${bg}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-bold mt-1", children: value }),
    sub && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mt-1 break-all", children: sub })
  ] });
}
function SummaryCard({
  label,
  rows,
  avg
}) {
  const audioOnCount = rows.filter((r) => r.audio_paused === false).length;
  const audioOnPct = rows.length ? Math.round(audioOnCount / rows.length * 100) : 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border p-3 bg-card space-y-1", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-semibold", children: [
      label,
      " (",
      rows.length,
      " تسجيل)"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
      "متوسط depth/30s: ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: avg(rows, "depth_count_30s") ?? "—" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
      "Audio شغّال في: ",
      /* @__PURE__ */ jsxRuntimeExports.jsxs("b", { children: [
        audioOnPct,
        "%"
      ] }),
      " من التسجيلات"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
      "متوسط last_depth_age: ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: avg(rows, "last_depth_age_ms") != null ? Math.round(avg(rows, "last_depth_age_ms") / 1e3) + "s" : "—" })
    ] })
  ] });
}
export {
  ExtDiagPage as component
};
