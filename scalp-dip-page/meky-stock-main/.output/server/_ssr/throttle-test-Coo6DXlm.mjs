import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
function ThrottleTestPage() {
  const [running, setRunning] = reactExports.useState(false);
  const [ticks, setTicks] = reactExports.useState(0);
  const [elapsed, setElapsed] = reactExports.useState(0);
  const [result, setResult] = reactExports.useState(null);
  const startRef = reactExports.useRef(0);
  const tickRef = reactExports.useRef(0);
  const intervalRef = reactExports.useRef(null);
  const [duration, setDuration] = reactExports.useState(60);
  reactExports.useEffect(() => () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
  }, []);
  const start = () => {
    setResult(null);
    setTicks(0);
    setElapsed(0);
    tickRef.current = 0;
    startRef.current = Date.now();
    setRunning(true);
    intervalRef.current = window.setInterval(() => {
      tickRef.current += 1;
      const elapsedSec = (Date.now() - startRef.current) / 1e3;
      setTicks(tickRef.current);
      setElapsed(elapsedSec);
      if (elapsedSec >= duration) {
        finish();
      }
    }, 250);
  };
  const finish = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const elapsedSec = (Date.now() - startRef.current) / 1e3;
    const t = tickRef.current;
    const expected = elapsedSec * 4;
    const efficiency = expected > 0 ? t / expected * 100 : 0;
    let verdict = "", verdictColor = "";
    if (efficiency >= 90) {
      verdict = "✅ ممتاز — مفيش throttling. الاكستنشن هيشتغل بأقصى كفاءة";
      verdictColor = "text-green-500";
    } else if (efficiency >= 50) {
      verdict = "⚠️ throttling متوسط — الاكستنشن هيشتغل بس بكفاءة أقل";
      verdictColor = "text-amber-500";
    } else if (efficiency >= 5) {
      verdict = "🔴 throttling قوي — Chrome بيبطأ التاب في الخلفية بشدة";
      verdictColor = "text-red-500";
    } else {
      verdict = "💀 throttling كامل — التاب متجمد تقريباً في الخلفية";
      verdictColor = "text-red-600";
    }
    const snapPerHourPerTab = Math.round(3600 * (efficiency / 100));
    const total = Math.round(snapPerHourPerTab * 4.5 * 25);
    setRunning(false);
    setResult({
      ticks: t,
      elapsedSec: Math.round(elapsedSec * 10) / 10,
      expected: Math.round(expected),
      efficiency: Math.round(efficiency * 10) / 10,
      verdict,
      verdictColor,
      estimateSnapshotsPerHourPerTab: snapPerHourPerTab,
      estimate25Tabs45h: total
    });
  };
  const stop = () => finish();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", className: "max-w-3xl mx-auto p-6 space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "🧪 اختبار Throttling — سهل وسريع" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "الاختبار ده بيقيس هل Chrome بيبطأ التاب لما يكون في الخلفية. ده نفس الميكانيزم اللي بيأثر على الاكستنشن." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border p-4 bg-card space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: "خطوات (سهل جداً):" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "list-decimal pr-6 space-y-1 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "اختار مدة الاختبار (60 ثانية كافية)." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          "اضغط ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "ابدأ" }),
          "."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          "فوراً روح لتاب تاني (YouTube أو أي حاجة) — ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "مهم" }),
          " يكون التاب ده في الخلفية."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "استنى المدة تخلص، ارجعلي وشوف النتيجة." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border p-4 bg-card space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm", children: "المدة:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "rounded border bg-background px-2 py-1 text-sm", value: duration, onChange: (e) => setDuration(Number(e.target.value)), disabled: running, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 30, children: "30 ثانية" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 60, children: "60 ثانية (موصى)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 120, children: "دقيقتين" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 300, children: "5 دقايق (أدق)" })
        ] }),
        !running ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: start, className: "rounded bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold", children: "▶ ابدأ الاختبار" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: stop, className: "rounded bg-red-600 text-white px-4 py-2 text-sm font-semibold", children: "⏹ إيقاف" })
      ] }),
      running && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded bg-amber-950/30 border border-amber-800/50 p-3 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-amber-300", children: "🚨 دلوقتي روح لتاب تاني! سيب التاب ده في الخلفية." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 grid grid-cols-3 gap-2 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "الوقت" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xl font-bold", children: [
              elapsed.toFixed(1),
              "s / ",
              duration,
              "s"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Ticks فعلياً" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xl font-bold", children: ticks })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Ticks متوقعة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xl font-bold", children: Math.round(elapsed * 4) })
          ] })
        ] })
      ] }),
      result && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border p-4 bg-background space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-lg font-bold ${result.verdictColor}`, children: result.verdict }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground text-xs", children: "Ticks فعلية" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xl font-bold", children: result.ticks })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground text-xs", children: "Ticks متوقعة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xl font-bold", children: result.expected })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground text-xs", children: "المدة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xl font-bold", children: [
              result.elapsedSec,
              "s"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground text-xs", children: "الكفاءة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xl font-bold", children: [
              result.efficiency,
              "%"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t pt-3 space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-sm", children: "📊 توقع بكرا (25 تاب × 4.5 ساعة):" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
            "Snapshots/ساعة/تاب: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: result.estimateSnapshotsPerHourPerTab.toLocaleString("en") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
            "إجمالي متوقع: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { className: "text-lg", children: result.estimate25Tabs45h.toLocaleString("en") }),
            " snapshot"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground pt-2 border-t", children: "💡 الحساب مبني على إن الاكستنشن بيسحب L2 كل ~1 ثانية. الكفاءة اللي طلعت بتتطبق مباشرة على معدل السحب لما التاب في الخلفية." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border p-4 bg-card text-sm space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: "🎯 يعني إيه النتيجة؟" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-1 pr-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-green-500 font-bold", children: "90-100%:" }),
          " فيه audio anti-throttle شغال أو Chrome مش بيعمل throttle → ممتاز"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-amber-500 font-bold", children: "50-90%:" }),
          " throttling خفيف → مقبول بس مش مثالي"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500 font-bold", children: "5-50%:" }),
          " throttling قوي → لازم نصلح anti-throttle"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-600 font-bold", children: "أقل من 5%:" }),
          " Chrome جمد التاب تماماً → مشكلة كبيرة"
        ] })
      ] })
    ] })
  ] });
}
export {
  ThrottleTestPage as component
};
