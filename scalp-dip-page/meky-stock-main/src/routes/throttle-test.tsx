import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/throttle-test")({
  component: ThrottleTestPage,
  head: () => ({ meta: [{ title: "اختبار Throttling — Meky" }] }),
});

function ThrottleTestPage() {
  const [running, setRunning] = useState(false);
  const [ticks, setTicks] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<null | {
    ticks: number;
    elapsedSec: number;
    expected: number;
    efficiency: number;
    verdict: string;
    verdictColor: string;
    estimateSnapshotsPerHourPerTab: number;
    estimate25Tabs45h: number;
  }>(null);
  const startRef = useRef<number>(0);
  const tickRef = useRef<number>(0);
  const intervalRef = useRef<number | null>(null);
  const [duration, setDuration] = useState(60);

  useEffect(() => () => { if (intervalRef.current) window.clearInterval(intervalRef.current); }, []);

  const start = () => {
    setResult(null);
    setTicks(0);
    setElapsed(0);
    tickRef.current = 0;
    startRef.current = Date.now();
    setRunning(true);
    // كل 250ms = 4 tick/s = 240 tick/دقيقة لو مفيش throttling
    intervalRef.current = window.setInterval(() => {
      tickRef.current += 1;
      const elapsedSec = (Date.now() - startRef.current) / 1000;
      setTicks(tickRef.current);
      setElapsed(elapsedSec);
      if (elapsedSec >= duration) {
        finish();
      }
    }, 250);
  };

  const finish = () => {
    if (intervalRef.current) { window.clearInterval(intervalRef.current); intervalRef.current = null; }
    const elapsedSec = (Date.now() - startRef.current) / 1000;
    const t = tickRef.current;
    const expected = elapsedSec * 4;
    const efficiency = expected > 0 ? (t / expected) * 100 : 0;
    let verdict = "", verdictColor = "";
    if (efficiency >= 90) { verdict = "✅ ممتاز — مفيش throttling. الاكستنشن هيشتغل بأقصى كفاءة"; verdictColor = "text-green-500"; }
    else if (efficiency >= 50) { verdict = "⚠️ throttling متوسط — الاكستنشن هيشتغل بس بكفاءة أقل"; verdictColor = "text-amber-500"; }
    else if (efficiency >= 5) { verdict = "🔴 throttling قوي — Chrome بيبطأ التاب في الخلفية بشدة"; verdictColor = "text-red-500"; }
    else { verdict = "💀 throttling كامل — التاب متجمد تقريباً في الخلفية"; verdictColor = "text-red-600"; }

    // Extension polls L2 كل ~1s. لو efficiency=X% → real polls/sec ≈ X/100.
    // snapshots/hour/tab ≈ 3600 * (efficiency/100). 4.5h * 25 tab.
    const snapPerHourPerTab = Math.round(3600 * (efficiency / 100));
    const total = Math.round(snapPerHourPerTab * 4.5 * 25);

    setRunning(false);
    setResult({
      ticks: t,
      elapsedSec: Math.round(elapsedSec * 10) / 10,
      expected: Math.round(expected),
      efficiency: Math.round(efficiency * 10) / 10,
      verdict, verdictColor,
      estimateSnapshotsPerHourPerTab: snapPerHourPerTab,
      estimate25Tabs45h: total,
    });
  };

  const stop = () => finish();

  return (
    <div dir="rtl" className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🧪 اختبار Throttling — سهل وسريع</h1>
        <p className="text-sm text-muted-foreground mt-1">
          الاختبار ده بيقيس هل Chrome بيبطأ التاب لما يكون في الخلفية. ده نفس الميكانيزم اللي بيأثر على الاكستنشن.
        </p>
      </div>

      <div className="rounded-lg border p-4 bg-card space-y-3">
        <div className="font-semibold">خطوات (سهل جداً):</div>
        <ol className="list-decimal pr-6 space-y-1 text-sm">
          <li>اختار مدة الاختبار (60 ثانية كافية).</li>
          <li>اضغط <b>ابدأ</b>.</li>
          <li>فوراً روح لتاب تاني (YouTube أو أي حاجة) — <b>مهم</b> يكون التاب ده في الخلفية.</li>
          <li>استنى المدة تخلص، ارجعلي وشوف النتيجة.</li>
        </ol>
      </div>

      <div className="rounded-lg border p-4 bg-card space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm">المدة:</label>
          <select
            className="rounded border bg-background px-2 py-1 text-sm"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            disabled={running}
          >
            <option value={30}>30 ثانية</option>
            <option value={60}>60 ثانية (موصى)</option>
            <option value={120}>دقيقتين</option>
            <option value={300}>5 دقايق (أدق)</option>
          </select>
          {!running ? (
            <button
              onClick={start}
              className="rounded bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold"
            >
              ▶ ابدأ الاختبار
            </button>
          ) : (
            <button
              onClick={stop}
              className="rounded bg-red-600 text-white px-4 py-2 text-sm font-semibold"
            >
              ⏹ إيقاف
            </button>
          )}
        </div>

        {running && (
          <div className="rounded bg-amber-950/30 border border-amber-800/50 p-3 text-sm">
            <div className="font-bold text-amber-300">🚨 دلوقتي روح لتاب تاني! سيب التاب ده في الخلفية.</div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs text-muted-foreground">الوقت</div>
                <div className="text-xl font-bold">{elapsed.toFixed(1)}s / {duration}s</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Ticks فعلياً</div>
                <div className="text-xl font-bold">{ticks}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Ticks متوقعة</div>
                <div className="text-xl font-bold">{Math.round(elapsed * 4)}</div>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="rounded border p-4 bg-background space-y-3">
            <div className={`text-lg font-bold ${result.verdictColor}`}>{result.verdict}</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><div className="text-muted-foreground text-xs">Ticks فعلية</div><div className="text-xl font-bold">{result.ticks}</div></div>
              <div><div className="text-muted-foreground text-xs">Ticks متوقعة</div><div className="text-xl font-bold">{result.expected}</div></div>
              <div><div className="text-muted-foreground text-xs">المدة</div><div className="text-xl font-bold">{result.elapsedSec}s</div></div>
              <div><div className="text-muted-foreground text-xs">الكفاءة</div><div className="text-xl font-bold">{result.efficiency}%</div></div>
            </div>
            <div className="border-t pt-3 space-y-1">
              <div className="font-semibold text-sm">📊 توقع بكرا (25 تاب × 4.5 ساعة):</div>
              <div className="text-sm">Snapshots/ساعة/تاب: <b>{result.estimateSnapshotsPerHourPerTab.toLocaleString("en")}</b></div>
              <div className="text-sm">إجمالي متوقع: <b className="text-lg">{result.estimate25Tabs45h.toLocaleString("en")}</b> snapshot</div>
            </div>
            <div className="text-xs text-muted-foreground pt-2 border-t">
              💡 الحساب مبني على إن الاكستنشن بيسحب L2 كل ~1 ثانية. الكفاءة اللي طلعت بتتطبق مباشرة على معدل السحب لما التاب في الخلفية.
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border p-4 bg-card text-sm space-y-2">
        <div className="font-semibold">🎯 يعني إيه النتيجة؟</div>
        <ul className="space-y-1 pr-4">
          <li><span className="text-green-500 font-bold">90-100%:</span> فيه audio anti-throttle شغال أو Chrome مش بيعمل throttle → ممتاز</li>
          <li><span className="text-amber-500 font-bold">50-90%:</span> throttling خفيف → مقبول بس مش مثالي</li>
          <li><span className="text-red-500 font-bold">5-50%:</span> throttling قوي → لازم نصلح anti-throttle</li>
          <li><span className="text-red-600 font-bold">أقل من 5%:</span> Chrome جمد التاب تماماً → مشكلة كبيرة</li>
        </ul>
      </div>
    </div>
  );
}