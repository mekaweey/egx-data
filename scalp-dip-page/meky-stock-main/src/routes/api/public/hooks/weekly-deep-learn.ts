import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTelegram } from "@/lib/notifications/telegram.server";

/**
 * Weekly Deep Learner — runs Thursday 16:00 Cairo (end of EGX week).
 * Reads last 5 trading days from daily_intelligence, computes which
 * feature buckets predicted positive next_day_return, and stores the
 * learned weights into model_state. Sends a Telegram summary of the
 * top lessons of the week.
 */

type Row = {
  symbol: string; trade_date: string;
  rsi14: number | null; vol_ratio: number | null; composite_score: number | null;
  intraday_max_drawup_pct: number | null; news_sentiment_avg: number | null;
  breadth_pct: number | null; was_picked: boolean | null;
  next_day_return_pct: number | null; pick_pnl_pct: number | null;
};

function bucketStats(rows: Row[], picker: (r: Row) => boolean) {
  const xs = rows.filter((r) => picker(r) && r.next_day_return_pct != null);
  if (!xs.length) return { n: 0, avg: 0, winRate: 0 };
  const sum = xs.reduce((a, r) => a + (r.next_day_return_pct ?? 0), 0);
  const wins = xs.filter((r) => (r.next_day_return_pct ?? 0) > 0).length;
  return { n: xs.length, avg: sum / xs.length, winRate: (wins / xs.length) * 100 };
}

export const Route = createFileRoute("/api/public/hooks/weekly-deep-learn")({
  server: {
    handlers: {
      POST: async () => {
        const cairoNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
        const cutoff = new Date(cairoNow); cutoff.setDate(cutoff.getDate() - 7);
        const cutoffISO = cutoff.toISOString().slice(0, 10);

        const { data, error } = await supabaseAdmin
          .from("daily_intelligence")
          .select("symbol, trade_date, rsi14, vol_ratio, composite_score, intraday_max_drawup_pct, news_sentiment_avg, breadth_pct, was_picked, next_day_return_pct, pick_pnl_pct")
          .gte("trade_date", cutoffISO)
          .not("next_day_return_pct", "is", null);

        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
        const rows = (data ?? []) as Row[];
        if (rows.length < 20) {
          return Response.json({ ok: true, rows: rows.length, skipped: "insufficient_data" });
        }

        // Feature analysis
        const lessons = {
          rsi_oversold_lt30: bucketStats(rows, (r) => (r.rsi14 ?? 50) < 30),
          rsi_overbought_gt70: bucketStats(rows, (r) => (r.rsi14 ?? 50) > 70),
          rsi_sweet_50to65: bucketStats(rows, (r) => { const v = r.rsi14 ?? 0; return v >= 50 && v <= 65; }),
          vol_spike_gt2x: bucketStats(rows, (r) => (r.vol_ratio ?? 0) > 2),
          intraday_strong_drawup_gt3: bucketStats(rows, (r) => (r.intraday_max_drawup_pct ?? 0) > 3),
          news_positive: bucketStats(rows, (r) => (r.news_sentiment_avg ?? 0) > 0.3),
          news_negative: bucketStats(rows, (r) => (r.news_sentiment_avg ?? 0) < -0.3),
          breadth_strong_gt60: bucketStats(rows, (r) => (r.breadth_pct ?? 0) > 60),
          breadth_weak_lt40: bucketStats(rows, (r) => (r.breadth_pct ?? 100) < 40),
          composite_high_gt70: bucketStats(rows, (r) => (r.composite_score ?? 0) > 70),
          picks_only: bucketStats(rows, (r) => !!r.was_picked),
        };

        // Persist
        await supabaseAdmin.from("model_state").upsert({
          key: "weekly_deep_learn",
          data: { lessons, rows_analyzed: rows.length, generated_at: new Date().toISOString() } as never,
        } as never, { onConflict: "key" });

        // Telegram summary — top 3 strongest signals
        const sorted = Object.entries(lessons)
          .filter(([, v]) => v.n >= 5)
          .sort(([, a], [, b]) => Math.abs(b.avg) - Math.abs(a.avg))
          .slice(0, 5);

        const labels: Record<string, string> = {
          rsi_oversold_lt30: "RSI < 30 (تشبع بيع)",
          rsi_overbought_gt70: "RSI > 70 (تشبع شراء)",
          rsi_sweet_50to65: "RSI 50-65 (المنطقة الذهبية)",
          vol_spike_gt2x: "حجم > 2× المتوسط",
          intraday_strong_drawup_gt3: "ارتفاع لحظي > 3%",
          news_positive: "أخبار إيجابية قوية",
          news_negative: "أخبار سلبية قوية",
          breadth_strong_gt60: "عرض السوق > 60%",
          breadth_weak_lt40: "عرض السوق < 40%",
          composite_high_gt70: "score مركّب > 70",
          picks_only: "الترشيحات الفعلية",
        };

        const lines = [`<b>🧠 دروس الأسبوع</b> (${rows.length} حالة)\n`];
        for (const [k, v] of sorted) {
          const icon = v.avg > 0 ? "✅" : "❌";
          lines.push(`${icon} <b>${labels[k] ?? k}</b>: متوسط +${v.avg.toFixed(2)}% · win ${v.winRate.toFixed(0)}% · n=${v.n}`);
        }
        await sendTelegram(lines.join("\n")).catch(() => null);

        return Response.json({ ok: true, rows: rows.length, lessons });
      },
    },
  },
});