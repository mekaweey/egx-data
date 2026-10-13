import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  STRATEGY_ID,
  evaluateGuards,
  tradingDaysElapsed,
  cairoNow,
  cairoDateISO,
  RISK_GUARDS,
} from "@/lib/scalp-dip/gap-fade-3d.server";

/**
 * SCALP BRIEF — الملخص اليومي (يظهر دايمًا، أهم قيمة عند 14:35 بعد فحص الإقفال)
 * + تقرير السبت (نفس البيانات على مستوى الأسبوع).
 * GET /api/public/hooks/scalp-brief → JSON brief. Read-only; never writes.
 */
export const Route = createFileRoute("/api/public/hooks/scalp-brief")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const now = cairoNow();
          const todayISO = cairoDateISO(now);
          const dow = now.getDay(); // 0 = Sunday
          const sundayISO = new Date(Date.parse(`${todayISO}T00:00:00Z`) - dow * 86400_000)
            .toISOString()
            .slice(0, 10);

          const [openRes, closedRes, startRes] = await Promise.all([
            supabaseAdmin
              .from("paper_trades")
              .select("id, symbol, trade_date, capital, entry_price, sl_price, status, strategy")
              .eq("strategy", STRATEGY_ID)
              .eq("status", "open"),
            supabaseAdmin
              .from("paper_trades")
              .select("symbol, pnl, exit_reason, status, trade_date, updated_at, strategy")
              .eq("strategy", STRATEGY_ID)
              .eq("status", "closed")
              .gte("updated_at", new Date(Date.now() - 35 * 86400_000).toISOString())
              .order("updated_at", { ascending: false }),
            supabaseAdmin
              .from("strategy_settings")
              .select("numeric_value")
              .eq("key", "scalp_dip_paper_start")
              .maybeSingle(),
          ]);

          type Closed = { symbol: string; pnl: number | null; exit_reason: string | null; updated_at: string };
          const closed = (closedRes.data ?? []) as Closed[];
          const todayClosed = closed.filter((c) => (c.updated_at ?? "").slice(0, 10) >= todayISO);
          const weekClosed = closed.filter((c) => (c.updated_at ?? "").slice(0, 10) >= sundayISO);
          const weekPnl = weekClosed.reduce((s, c) => s + (Number(c.pnl) || 0), 0);

          // rolling 4-week blocks (weekly buckets, oldest → newest)
          const byWeek = new Map<string, number>();
          for (const c of closed) {
            const d = (c.updated_at ?? "").slice(0, 10);
            const dd = new Date(`${d}T00:00:00Z`);
            const wkSunday = new Date(dd.getTime() - dd.getUTCDay() * 86400_000).toISOString().slice(0, 10);
            byWeek.set(wkSunday, (byWeek.get(wkSunday) ?? 0) + (Number(c.pnl) || 0));
          }
          const weeks = [...byWeek.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([week, pnl]) => ({ week, pnl }));
          const blocks: { from: string; to: string; pnl: number; positive: boolean }[] = [];
          for (let i = 0; i + 4 <= weeks.length; i++) {
            const slice = weeks.slice(i, i + 4);
            blocks.push({
              from: slice[0].week,
              to: slice[3].week,
              pnl: slice.reduce((s, x) => s + x.pnl, 0),
              positive: slice.reduce((s, x) => s + x.pnl, 0) > 0,
            });
          }

          const drawdownPct = (() => {
            // realized equity curve over the last 35 days (approx peak-based)
            const chrono = [...closed].reverse();
            let eq = 0, peak = 0, dd = 0;
            for (const c of chrono) { eq += Number(c.pnl) || 0; peak = Math.max(peak, eq); dd = Math.min(dd, eq - peak); }
            return peak > 0 ? dd / (100_000 + peak) : 0;
          })();
          const guards = evaluateGuards({ weekPnlEgp: weekPnl, drawdownPct });

          const startVal = startRes.data ? Number((startRes.data as { numeric_value?: number }).numeric_value) : null;
          const paperGate = startVal
            ? {
                started: true,
                start_date: new Date(startVal).toISOString().slice(0, 10),
                weeks_elapsed: Math.min(4, Math.floor((Date.now() - startVal) / (7 * 86400_000))),
                weeks_total: 4,
                realized_total: closed.reduce((s, c) => s + (Number(c.pnl) || 0), 0),
              }
            : { started: false, weeks_elapsed: 0, weeks_total: 4, realized_total: closed.reduce((s, c) => s + (Number(c.pnl) || 0), 0) };

          return Response.json({
            ok: true,
            cairo_date: todayISO,
            is_saturday_report: dow === 6,
            open_positions: (openRes.data ?? []).map((t) => ({
              symbol: String(t.symbol),
              capital: Number(t.capital) || 0,
              entry_price: Number(t.entry_price) || 0,
              days_held: tradingDaysElapsed(String(t.trade_date), todayISO),
              sl_price: Number(t.sl_price) || 0,
            })),
            today_closed: todayClosed.map((c) => ({
              symbol: c.symbol, pnl: Number(c.pnl) || 0, exit_reason: c.exit_reason,
            })),
            week_pnl: Math.round(weekPnl),
            guards: {
              week_kill_active: guards.week_kill_active,
              dd_halve_active: guards.dd_halve_active,
              thresholds: RISK_GUARDS,
            },
            rolling_4w: { weeks, blocks },
            paper_gate: paperGate,
          });
        } catch (e) {
          return Response.json({ ok: false, error: (e as Error).message }, { status: 200 });
        }
      },
    },
  },
});
