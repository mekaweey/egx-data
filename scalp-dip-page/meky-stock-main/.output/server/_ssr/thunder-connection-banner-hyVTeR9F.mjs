import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
function ThunderConnectionBanner() {
  const [health, setHealth] = reactExports.useState(null);
  const [error, setError] = reactExports.useState(null);
  const [dismissedClosed, setDismissedClosed] = reactExports.useState(false);
  reactExports.useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/public/hooks/thunder-health", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setHealth(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "network error");
      }
    };
    tick();
    const id = setInterval(tick, 15e3);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);
  if (error) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-bear/40 bg-bear/10 text-bear px-4 py-3 text-sm font-medium flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg", children: "⚠️" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "تعذر الاتصال بالسيرفر للتحقق من حالة ثاندر (",
        error,
        ")"
      ] })
    ] });
  }
  if (!health) return null;
  if (health.status === "ok") {
    const ago = health.thunder.lastTickAgoSec;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-bull/40 bg-bull/10 text-bull px-3 py-2 text-xs flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block w-2 h-2 rounded-full bg-bull animate-pulse" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "متصل بثاندر · ",
        health.thunder.symbols5m,
        " سهم · آخر سعر منذ ",
        ago ?? "?",
        " ثانية"
      ] })
    ] });
  }
  if (health.status === "closed") {
    if (dismissedClosed) return null;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-muted bg-muted/30 text-muted-foreground px-3 py-2 text-xs flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "🌙 ",
        health.message
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setDismissedClosed(true), className: "text-[10px] underline", children: "إخفاء" })
    ] });
  }
  const styles = health.status === "critical" ? "border-bear/50 bg-bear/15 text-bear" : "border-warn/50 bg-warn/15 text-warn";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-xl border ${styles} px-4 py-3 text-sm font-semibold flex items-start gap-3`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl", children: health.status === "critical" ? "🛑" : "⚠️" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: health.message }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs font-normal opacity-80 mt-1", children: [
        "آخر tick من ثاندر:",
        " ",
        health.thunder.lastTickAgoSec != null ? `${health.thunder.lastTickAgoSec}s` : "—",
        " ·",
        " ",
        health.thunder.ticks5m,
        " tick في آخر 5د · ",
        health.thunder.symbols5m,
        " سهم"
      ] })
    ] })
  ] });
}
export {
  ThunderConnectionBanner as T
};
