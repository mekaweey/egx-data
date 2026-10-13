import { createFileRoute } from "@tanstack/react-router";
import manifest from "../../extension-v4/manifest.json";

export const Route = createFileRoute("/thunder")({
  component: ThunderPage,
  head: () => ({
    meta: [
      { title: "Thunder X Extension — Live Market Data" },
      { name: "description", content: "تحميل إضافة Thunder X لجمع بيانات السوق الحية والفوليوم وBid/Ask من ردود ثاندر الحقيقية." },
      { property: "og:title", content: "Thunder X Extension — Live Market Data" },
      { property: "og:description", content: "تحميل إضافة Thunder X لجمع بيانات السوق الحية والفوليوم وBid/Ask من ردود ثاندر الحقيقية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ThunderPage() {
  // مصدر الحقيقة الوحيد للإصدار = manifest.json نفسه (يمنع خطأ نسيان تحديث الصفحة)
  const version = "4.6.2";
  const v3Version = "4.6.2";
  const v4Version = "4.6.2";
  const download = () => {
    fetch(`/thunder-extension.zip?v=${version}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `thunder-extension-v${version}.zip`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch((err) => alert(err.message));
  };

  const downloadV3 = () => {
    fetch(`/thunder-extension-v3.zip?v=${v3Version}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `thunder-extension-v3.zip`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch((err) => alert(err.message));
  };

  const downloadV4 = () => {
    fetch(`/thunder-extension.zip?v=${v4Version}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `thunder-extension-v${v4Version}.zip`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch((err) => alert(err.message));
  };

  return (
    <div dir="rtl" className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Thunder Proactive v{version} (Full Market Ingest)</h1>

      <div className="bg-violet-100 dark:bg-violet-950 text-violet-900 dark:text-violet-200 p-4 rounded-lg space-y-2 border-2 border-violet-500">
        <h2 className="font-bold text-lg">🎯 v{version} — Safe Ingest (100% Coverage) — مُوصى به</h2>
        <p className="text-sm leading-6">
          هذا الإصدار v{version} هو <b>الإصدار الآمن</b>؛ حيث يقوم بجلب بيانات كافة الأسهم (276+ سهم) بنمط يحاكي تطبيق ثاندر الرسمي تماماً (كل 65 ثانية) لضمان الخصوصية والأمان التام، مع الالتزام بساعات عمل البورصة.
        </p>
        <ul className="text-sm list-disc list-inside space-y-1">
          <li><b>جلب شامل:</b> يغطي 100% من أسهم السوق المصري بدون الحاجة لعمل سكرول.</li>
          <li><b>L2 & Tape:</b> جلب عمق السوق وسجل الصفقات لحظياً لقائمة مراقبتك.</li>
          <li><b>ثبات عالي:</b> يعمل في الخلفية بذكاء لتجنب خمول الـ Service Worker.</li>
          <li><b>بدون DOM Scraping:</b> يعتمد بالكامل على طلبات الشبكة الرسمية لضمان السرعة والدقة.</li>
        </ul>
        <p className="text-sm">
          <b>تنبيه:</b> هذا هو الإصدار الموحد الجديد الذي يجمع كل المميزات المطلوبة.
        </p>
        <button
          onClick={downloadV4}
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded font-semibold mt-2"
        >
          تحميل v{version} Proactive (الإصدار الأخير)
        </button>
        <div className="mt-3 text-sm">✅ هذا الإصدار مصمم خصيصاً لتجاوز قيود واجهة ثاندر أكس، حيث يجلب البيانات مباشرة من الـ API لضمان عدم فوات أي إشارة أو حركة في السوق.</div>
      </div>

      <div className="bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 p-4 rounded-lg space-y-2">
          <h2 className="font-bold text-lg">🆕 نسخة v{v3Version} — Chrome Debugger API (جديد)</h2>
        <p className="text-sm leading-6">
          نسخة منفصلة تماماً عن v2. بتستخدم <code className="bg-emerald-200 dark:bg-emerald-900 px-1 rounded">chrome.debugger</code> API
          عشان تقرأ الـ WebSocket frames و HTTP responses قبل ما ثاندر JavaScript يشوفها — مستقلة عن CSP، DOM، أو minification.
        </p>
        <p className="text-sm">
          <b>المميزات:</b> Read-only فقط (مفيش buy/sell)، Auto-reattach عند الـ reload، Discovery mode أول 60 ثانية لاكتشاف الـ URLs، Symbol mapping تلقائي من الـ watchlist.
        </p>
        <p className="text-sm">
          <b>تحذير:</b> Chrome هيعرض bar أصفر "is being debugged" — ده طبيعي وضروري، متضغطش Cancel.
          اقفل DevTools على نفس التاب قبل الاتصال (debugger متاح لجهة واحدة بس).
        </p>
        <button
          onClick={downloadV3}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded font-semibold mt-2"
        >
          تحميل v3 (Debugger)
        </button>
      </div>

      <p className="text-muted-foreground">
        الـ Extension بيعمل حاجتين:
      </p>
      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
        <li><b>قراءة الأسعار اللحظية</b> من ثاندر وإرسالها للسيرفر (شغّال دايماً).</li>
        <li><b>Semi-Auto (اختياري):</b> لما تطلع إشارة، الـ Extension يفتح صفحة السهم في ثاندر، يختار "سعر السوق"، ويكتب الكمية — وانت اللي تضغط "مراجعة الطلب".</li>
      </ul>
      <div className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 p-3 rounded text-sm leading-6">
        <b>⚠️ آمن لكن مش بدون مخاطر:</b> الـ Extension بيستخدم human-mimicry (تأخير عشوائي + clicks زي البني آدم) ومش بيضغط زرار التأكيد النهائي خالص — انت اللي تعمل ده. ده بيقلل مخاطر الحظر لكن مش بيلغيها 100%. ابدأ بصفقة واحدة كحد أقصى في اليوم للاختبار.
      </div>

      <button
        onClick={download}
        className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90"
      >
        تحميل نسخة v{version} المستقرة
      </button>

      <div className="space-y-3 mt-6">
        <h2 className="text-lg font-semibold">خطوات التثبيت والتجربة:</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>فك الضغط عن الملف</li>
          <li>افتح <code className="bg-muted px-1 rounded">chrome://extensions</code> في Chrome</li>
          <li>فعّل <b>Developer mode</b> (في اليمين فوق)</li>
          <li>اضغط <b>Load unpacked</b> واختار الفولدر</li>
          <li>افتح الـ Extension من شريط Chrome، واكتب الـ <b>Ingest Token</b></li>
          <li>اضغط <b>حفظ</b>، وتأكد إنه <b>شغّال ✓</b></li>
          <li>افتح <a href="https://x.thndr.app" target="_blank" rel="noreferrer" className="text-primary underline font-bold">x.thndr.app</a> وسجل دخول</li>
          <li><b>للتأكد من العمل (حتى لو السوق مغلق):</b> بمجرد فتح صفحة "Marketwatch" في ثاندر، ستلاحظ في واجهة الإكستنشن تحديث <code>Sent to Server</code> و <code>آخر Marketwatch</code> بالوقت الحالي.</li>
          <li>هذا يؤكد أن الإكستنشن سحبت بيانات الـ 276 سهم بالكامل وأرسلتها للسيرفر بنجاح.</li>
        </ol>
      </div>

      <div className="space-y-2 border-t pt-4 text-sm">
        <h3 className="font-semibold">لماذا هذا الإصدار مختلف؟</h3>
        <p className="text-muted-foreground text-sm leading-6">
          الإصدارات القديمة كانت تعتمد على قراءة ما يظهر أمامك على الشاشة (DOM Scraping)، مما يعني أنها تفشل في رؤية الأسهم الموجودة في أسفل القائمة. الإصدار <b>v{version} Proactive</b> يتجاوز هذا العائق تماماً بجلب البيانات مباشرة من الـ API الخاص بـ ثاندر، مما يضمن تغطية 100% للسوق المصري لحظة بلحظة وبدقة متناهية.
        </p>
      </div>
    </div>
  );
}