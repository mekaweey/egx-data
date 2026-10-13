import { j as jsxRuntimeExports } from "../_libs/react.mjs";
function ThunderPage() {
  const version = "4.6.2";
  const v3Version = "4.6.2";
  const v4Version = "4.6.2";
  const download = () => {
    fetch(`/thunder-extension.zip?v=${version}`, {
      cache: "no-store"
    }).then((res) => {
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      return res.blob();
    }).then((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `thunder-extension-v${version}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    }).catch((err) => alert(err.message));
  };
  const downloadV3 = () => {
    fetch(`/thunder-extension-v3.zip?v=${v3Version}`, {
      cache: "no-store"
    }).then((res) => {
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      return res.blob();
    }).then((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `thunder-extension-v3.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    }).catch((err) => alert(err.message));
  };
  const downloadV4 = () => {
    fetch(`/thunder-extension.zip?v=${v4Version}`, {
      cache: "no-store"
    }).then((res) => {
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      return res.blob();
    }).then((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `thunder-extension-v${v4Version}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    }).catch((err) => alert(err.message));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", className: "max-w-2xl mx-auto p-6 space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-bold", children: [
      "Thunder Proactive v",
      version,
      " (Full Market Ingest)"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-violet-100 dark:bg-violet-950 text-violet-900 dark:text-violet-200 p-4 rounded-lg space-y-2 border-2 border-violet-500", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-bold text-lg", children: [
        "🎯 v",
        version,
        " — Safe Ingest (100% Coverage) — مُوصى به"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm leading-6", children: [
        "هذا الإصدار v",
        version,
        " هو ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "الإصدار الآمن" }),
        "؛ حيث يقوم بجلب بيانات كافة الأسهم (276+ سهم) بنمط يحاكي تطبيق ثاندر الرسمي تماماً (كل 65 ثانية) لضمان الخصوصية والأمان التام، مع الالتزام بساعات عمل البورصة."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm list-disc list-inside space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "جلب شامل:" }),
          " يغطي 100% من أسهم السوق المصري بدون الحاجة لعمل سكرول."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "L2 & Tape:" }),
          " جلب عمق السوق وسجل الصفقات لحظياً لقائمة مراقبتك."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "ثبات عالي:" }),
          " يعمل في الخلفية بذكاء لتجنب خمول الـ Service Worker."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "بدون DOM Scraping:" }),
          " يعتمد بالكامل على طلبات الشبكة الرسمية لضمان السرعة والدقة."
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "تنبيه:" }),
        " هذا هو الإصدار الموحد الجديد الذي يجمع كل المميزات المطلوبة."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: downloadV4, className: "bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded font-semibold mt-2", children: [
        "تحميل v",
        version,
        " Proactive (الإصدار الأخير)"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 text-sm", children: "✅ هذا الإصدار مصمم خصيصاً لتجاوز قيود واجهة ثاندر أكس، حيث يجلب البيانات مباشرة من الـ API لضمان عدم فوات أي إشارة أو حركة في السوق." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 p-4 rounded-lg space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-bold text-lg", children: [
        "🆕 نسخة v",
        v3Version,
        " — Chrome Debugger API (جديد)"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm leading-6", children: [
        "نسخة منفصلة تماماً عن v2. بتستخدم ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "bg-emerald-200 dark:bg-emerald-900 px-1 rounded", children: "chrome.debugger" }),
        " API عشان تقرأ الـ WebSocket frames و HTTP responses قبل ما ثاندر JavaScript يشوفها — مستقلة عن CSP، DOM، أو minification."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "المميزات:" }),
        " Read-only فقط (مفيش buy/sell)، Auto-reattach عند الـ reload، Discovery mode أول 60 ثانية لاكتشاف الـ URLs، Symbol mapping تلقائي من الـ watchlist."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "تحذير:" }),
        ' Chrome هيعرض bar أصفر "is being debugged" — ده طبيعي وضروري، متضغطش Cancel. اقفل DevTools على نفس التاب قبل الاتصال (debugger متاح لجهة واحدة بس).'
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: downloadV3, className: "bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded font-semibold mt-2", children: "تحميل v3 (Debugger)" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "الـ Extension بيعمل حاجتين:" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "list-disc list-inside space-y-1 text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "قراءة الأسعار اللحظية" }),
        " من ثاندر وإرسالها للسيرفر (شغّال دايماً)."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Semi-Auto (اختياري):" }),
        ' لما تطلع إشارة، الـ Extension يفتح صفحة السهم في ثاندر، يختار "سعر السوق"، ويكتب الكمية — وانت اللي تضغط "مراجعة الطلب".'
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 p-3 rounded text-sm leading-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "⚠️ آمن لكن مش بدون مخاطر:" }),
      " الـ Extension بيستخدم human-mimicry (تأخير عشوائي + clicks زي البني آدم) ومش بيضغط زرار التأكيد النهائي خالص — انت اللي تعمل ده. ده بيقلل مخاطر الحظر لكن مش بيلغيها 100%. ابدأ بصفقة واحدة كحد أقصى في اليوم للاختبار."
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: download, className: "bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90", children: [
      "تحميل نسخة v",
      version,
      " المستقرة"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 mt-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold", children: "خطوات التثبيت والتجربة:" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "list-decimal list-inside space-y-2 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "فك الضغط عن الملف" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          "افتح ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "bg-muted px-1 rounded", children: "chrome://extensions" }),
          " في Chrome"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          "فعّل ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Developer mode" }),
          " (في اليمين فوق)"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          "اضغط ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Load unpacked" }),
          " واختار الفولدر"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          "افتح الـ Extension من شريط Chrome، واكتب الـ ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Ingest Token" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          "اضغط ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "حفظ" }),
          "، وتأكد إنه ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "شغّال ✓" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          "افتح ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "https://x.thndr.app", target: "_blank", rel: "noreferrer", className: "text-primary underline font-bold", children: "x.thndr.app" }),
          " وسجل دخول"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "للتأكد من العمل (حتى لو السوق مغلق):" }),
          ' بمجرد فتح صفحة "Marketwatch" في ثاندر، ستلاحظ في واجهة الإكستنشن تحديث ',
          /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: "Sent to Server" }),
          " و ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: "آخر Marketwatch" }),
          " بالوقت الحالي."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "هذا يؤكد أن الإكستنشن سحبت بيانات الـ 276 سهم بالكامل وأرسلتها للسيرفر بنجاح." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 border-t pt-4 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: "لماذا هذا الإصدار مختلف؟" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground text-sm leading-6", children: [
        "الإصدارات القديمة كانت تعتمد على قراءة ما يظهر أمامك على الشاشة (DOM Scraping)، مما يعني أنها تفشل في رؤية الأسهم الموجودة في أسفل القائمة. الإصدار ",
        /* @__PURE__ */ jsxRuntimeExports.jsxs("b", { children: [
          "v",
          version,
          " Proactive"
        ] }),
        " يتجاوز هذا العائق تماماً بجلب البيانات مباشرة من الـ API الخاص بـ ثاندر، مما يضمن تغطية 100% للسوق المصري لحظة بلحظة وبدقة متناهية."
      ] })
    ] })
  ] });
}
export {
  ThunderPage as component
};
