import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type Decision = {
  id: string;
  ts: string;
  symbol: string;
  rule: string;
  action: string;
  shadow: boolean;
  price: number | null;
  entry_price: number | null;
  pnl_pct: number | null;
  seconds_since_entry: number | null;
  mw_trades_5m: number | null;
  mw_volume_5m: number | null;
  verdict: "correct" | "wrong" | "neutral" | "no_ticks" | "no_price";
  ticks_count?: number;
  min_after?: number;
  max_after?: number;
  max_15m?: number;
  min_15m?: number;
  p_5m?: number | null;
  p_15m?: number | null;
  p_30m?: number | null;
  recover_pct?: number;
  would_have_pnl_pct?: number | null;
  first_hit?: "TP" | "SL" | null;
};

type Summary = {
  rule: string;
  total: number;
  correct: number;
  wrong: number;
  neutral: number;
  no_ticks: number;
  shadow: number;
  live: number;
  accuracy_pct: number | null;
};

type Report = {
  window_days: number;
  total_decisions: number;
  summary: Summary[];
  decisions: Decision[];
};

export const Route = createFileRoute("/shadow-report")({
  head: () => ({
    meta: [
      { title: "Shadow Report — تقييم قرارات Smart Exit" },
      { name: "description", content: "مقارنة كل قرار Smart Exit بحركة السعر الفعلية بعده" },
    ],
  }),
  component: Page,
});

function Page() {
  const [r, setR] = useState<Report | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [days, setDays] = useState(7);
  const [filter, setFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(false);

  const load = async (d: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/hooks/shadow-report?days=${d}`, { cache: "no-store" });
      const j = await res.json();
      setR(j);
      setErr(null);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(days); }, [days]);

  const filtered = (r?.decisions ?? []).filter((d) =>
    filter === "ALL" ? true : d.rule === filter,
  );

  const rules = Array.from(new Set((r?.decisions ?? []).map((d) => d.rule)));

  return (
    <div dir="rtl" className="min-h-screen bg-background p-6 font-sans">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Shadow Report</h1>
            <p className="text-sm text-muted-foreground">
              كل قرار Smart Exit vs السعر الفعلي بعده — عشان نعرف هل النظام صح ولا غلط قبل تفعيله فعلياً.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/marketwatch-health" className="rounded border px-3 py-1 text-sm hover:bg-muted">
              ← فحص Volume
            </Link>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded border bg-background px-2 py-1 text-sm"
            >
              <option value={1}>آخر يوم</option>
              <option value={3}>آخر 3 أيام</option>
              <option value={7}>آخر أسبوع</option>
              <option value={14}>آخر أسبوعين</option>
              <option value={30}>آخر شهر</option>
            </select>
            <button
              onClick={() => load(days)}
              className="rounded border px-3 py-1 text-sm hover:bg-muted"
              disabled={loading}
            >
              {loading ? "..." : "↻"}
            </button>
          </div>
        </header>

        {err && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-500">{err}</div>
        )}

        {r && r.total_decisions === 0 && (
          <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-6 text-center text-yellow-700">
            مفيش أي قرارات Smart Exit في الفترة دي.
            <div className="mt-2 text-sm">النظام لسه في Shadow Mode ومحتاج السوق يفتح عشان يبدأ يسجّل.</div>
          </div>
        )}

        {r && r.summary.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">ملخص الدقة لكل قاعدة</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {r.summary.map((s) => (
                <div key={s.rule} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-sm font-semibold">{s.rule}</div>
                    <div className={`text-2xl font-bold ${
                      s.accuracy_pct == null ? "text-muted-foreground"
                        : s.accuracy_pct >= 70 ? "text-green-600"
                        : s.accuracy_pct >= 50 ? "text-yellow-600"
                        : "text-red-600"
                    }`}>
                      {s.accuracy_pct == null ? "—" : `${s.accuracy_pct}%`}
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-1 text-center text-xs">
                    <Cell label="إجمالي" value={s.total} />
                    <Cell label="صح" value={s.correct} tone="good" />
                    <Cell label="غلط" value={s.wrong} tone="bad" />
                    <Cell label="محايد" value={s.neutral} />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Shadow: {s.shadow} · Live: {s.live} · بدون بيانات: {s.no_ticks}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {r && r.decisions.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">تفاصيل القرارات</h2>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded border bg-background px-2 py-1 text-sm"
              >
                <option value="ALL">كل القواعد</option>
                {rules.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 text-right">
                  <tr>
                    <th className="p-2">الوقت</th>
                    <th className="p-2">السهم</th>
                    <th className="p-2">القاعدة</th>
                    <th className="p-2">Mode</th>
                    <th className="p-2">السعر</th>
                    <th className="p-2">P&L%</th>
                    <th className="p-2">Max 15m</th>
                    <th className="p-2">تعافي%</th>
                    <th className="p-2">P+30m</th>
                    <th className="p-2">التقييم</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <tr key={d.id} className="border-t">
                      <td className="p-2 font-mono">{new Date(d.ts).toLocaleString("ar-EG", { hour12: false })}</td>
                      <td className="p-2 font-semibold">{d.symbol}</td>
                      <td className="p-2 font-mono text-[10px]">{d.rule}</td>
                      <td className="p-2">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] ${d.shadow ? "bg-blue-500/20 text-blue-700" : "bg-red-500/20 text-red-700"}`}>
                          {d.shadow ? "Shadow" : "Live"}
                        </span>
                      </td>
                      <td className="p-2 font-mono">{fmt(d.price)}</td>
                      <td className={`p-2 font-mono ${(d.pnl_pct ?? 0) < 0 ? "text-red-600" : "text-green-600"}`}>
                        {d.pnl_pct == null ? "—" : `${d.pnl_pct.toFixed(2)}%`}
                      </td>
                      <td className="p-2 font-mono">{fmt(d.max_15m)}</td>
                      <td className={`p-2 font-mono ${(d.recover_pct ?? 0) > 0.5 ? "text-red-600" : "text-muted-foreground"}`}>
                        {d.recover_pct == null ? "—" : `${d.recover_pct.toFixed(2)}%`}
                      </td>
                      <td className="p-2 font-mono">{fmt(d.p_30m ?? null)}</td>
                      <td className="p-2">
                        <Verdict v={d.verdict} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="rounded-lg border bg-muted/30 p-4 text-xs leading-6 text-muted-foreground">
          <div className="font-semibold text-foreground">إزاي بنقيّم القرار؟</div>
          <div>• <b>خروج (HARD_FLOOR / VOLUME_DEATH):</b> صح لو السعر بعد 15د ما ارتفعش أكتر من 0.3%. غلط لو ارتفع 0.8%+ (يبقى خرجنا بدري).</div>
          <div>• <b>PREBUY_VOLUME_FILTER (تجاهل شراء):</b> صح لو السعر ما وصلش لـ +1.5% في 30د. غلط لو وصل لـ +2% (كنا هنكسب لو دخلنا).</div>
          <div>• لازم نسبة الدقة الإجمالية تبقى 70%+ لكل قاعدة قبل ما نطلع من Shadow Mode.</div>
        </section>
      </div>
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: number; tone?: "good" | "bad" }) {
  return (
    <div>
      <div className={`text-lg font-bold ${tone === "good" ? "text-green-600" : tone === "bad" ? "text-red-600" : ""}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function Verdict({ v }: { v: Decision["verdict"] }) {
  const map: Record<Decision["verdict"], { label: string; cls: string }> = {
    correct: { label: "✓ صح", cls: "bg-green-500/20 text-green-700" },
    wrong: { label: "✗ غلط", cls: "bg-red-500/20 text-red-700" },
    neutral: { label: "◦ محايد", cls: "bg-muted text-muted-foreground" },
    no_ticks: { label: "لا بيانات", cls: "bg-muted text-muted-foreground" },
    no_price: { label: "بلا سعر", cls: "bg-muted text-muted-foreground" },
  };
  const s = map[v];
  return <span className={`rounded px-1.5 py-0.5 text-[10px] ${s.cls}`}>{s.label}</span>;
}

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return Number(n).toFixed(2);
}
