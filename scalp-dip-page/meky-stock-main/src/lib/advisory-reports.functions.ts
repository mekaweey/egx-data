import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Advisory, read-only reports:
 *
 *   1) Daily Reconciliation
 *      Cross-checks the day's paper_trades vs extension_trades. Flags:
 *        - paper closed but no matching real fill (signal not executed)
 *        - real fill but no paper trade (executed without signal)
 *        - price drift on buy or sell
 *        - pnl delta between simulated and real
 *
 *   2) Signal Quality Score
 *      For each closed paper_trade in the last N days, reads the nearest
 *      marketwatch_snapshots row within 5 minutes BEFORE entry_ts and
 *      derives simple features: 5m trades, 5m value, drop_pct at entry,
 *      hour of day. Bins each trade by score and reports the observed
 *      win rate + net pnl per bin.
 *
 * Both are pure projections — no writes, no schema changes.
 */

function cairoTodayStr(): string {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
    .toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/* 1) Daily Reconciliation                                             */
/* ------------------------------------------------------------------ */

export const getReconciliationReport = createServerFn({ method: "GET" })
  .inputValidator((data: { date?: string } | undefined) => ({ date: data?.date }))
  .handler(async ({ data }) => {
    const date = (data.date && /^\d{4}-\d{2}-\d{2}$/.test(data.date))
      ? data.date : cairoTodayStr();

    const [{ data: papers, error: pErr }, { data: exts, error: xErr }] = await Promise.all([
      supabaseAdmin
        .from("paper_trades")
        .select("id, symbol, strategy, entry_price, entry_ts, exit_price, exit_ts, exit_reason, pnl, pnl_pct, status")
        .eq("trade_date", date)
        .order("entry_ts", { ascending: true })
        .limit(500),
      supabaseAdmin
        .from("extension_trades")
        .select("client_trade_id, symbol, source, status, opened_at, closed_at, buy_price, sell_price, pnl, pnl_pct, buy_qty, sell_qty")
        .eq("trade_date", date)
        .order("opened_at", { ascending: true })
        .limit(500),
    ]);
    if (pErr) throw new Error(pErr.message);
    if (xErr) throw new Error(xErr.message);

    type Paper = NonNullable<typeof papers>[number];
    type Ext = NonNullable<typeof exts>[number];

    // Match paper ↔ extension by (symbol, closest time within 30 min).
    const usedExt = new Set<string>();
    type Row = {
      symbol: string;
      status: "matched" | "signal_only" | "real_only";
      paper_entry: number | null; paper_exit: number | null; paper_pnl: number | null;
      real_buy: number | null; real_sell: number | null; real_pnl: number | null;
      buy_drift_pct: number | null; sell_drift_pct: number | null; pnl_delta: number | null;
      strategy: string | null; entry_ts: string | null; opened_at: string | null;
      exit_reason: string | null;
    };
    const rows: Row[] = [];

    for (const p of papers ?? []) {
      const pt = p.entry_ts ? new Date(p.entry_ts).getTime() : 0;
      let bestKey: string | null = null;
      let bestDelta = Infinity;
      for (const x of exts ?? []) {
        if (usedExt.has(x.client_trade_id)) continue;
        if (x.symbol.toUpperCase() !== p.symbol.toUpperCase()) continue;
        const xt = x.opened_at ? new Date(x.opened_at).getTime() : 0;
        const d = Math.abs(xt - pt);
        if (d < bestDelta && d <= 30 * 60_000) {
          bestDelta = d; bestKey = x.client_trade_id;
        }
      }
      const match = (exts ?? []).find(x => x.client_trade_id === bestKey) as Ext | undefined;
      if (match) usedExt.add(match.client_trade_id);
      const pe = p.entry_price != null ? Number(p.entry_price) : null;
      const px = p.exit_price  != null ? Number(p.exit_price)  : null;
      const rb = match?.buy_price  != null ? Number(match.buy_price)  : null;
      const rs = match?.sell_price != null ? Number(match.sell_price) : null;
      const buyDrift  = (pe && rb) ? ((rb - pe) / pe) * 100 : null;
      const sellDrift = (px && rs) ? ((rs - px) / px) * 100 : null;
      const ppl = p.pnl != null ? Number(p.pnl) : null;
      const rpl = match?.pnl != null ? Number(match.pnl) : null;
      rows.push({
        symbol: p.symbol,
        status: match ? "matched" : "signal_only",
        paper_entry: pe, paper_exit: px, paper_pnl: ppl,
        real_buy: rb, real_sell: rs, real_pnl: rpl,
        buy_drift_pct:  buyDrift  != null ? +buyDrift.toFixed(3)  : null,
        sell_drift_pct: sellDrift != null ? +sellDrift.toFixed(3) : null,
        pnl_delta: (ppl != null && rpl != null) ? +(rpl - ppl).toFixed(1) : null,
        strategy: p.strategy, entry_ts: p.entry_ts, opened_at: match?.opened_at ?? null,
        exit_reason: p.exit_reason,
      });
    }

    // Extension-only fills (executed with no matching paper signal).
    for (const x of exts ?? []) {
      if (usedExt.has(x.client_trade_id)) continue;
      const rb = x.buy_price != null ? Number(x.buy_price) : null;
      const rs = x.sell_price != null ? Number(x.sell_price) : null;
      rows.push({
        symbol: x.symbol,
        status: "real_only",
        paper_entry: null, paper_exit: null, paper_pnl: null,
        real_buy: rb, real_sell: rs,
        real_pnl: x.pnl != null ? Number(x.pnl) : null,
        buy_drift_pct: null, sell_drift_pct: null, pnl_delta: null,
        strategy: null, entry_ts: null, opened_at: x.opened_at,
        exit_reason: null,
      });
    }

    const buyDrifts  = rows.map(r => r.buy_drift_pct).filter((n): n is number => n != null);
    const sellDrifts = rows.map(r => r.sell_drift_pct).filter((n): n is number => n != null);
    const avg = (a: number[]) => a.length ? +(a.reduce((s, x) => s + x, 0) / a.length).toFixed(3) : null;
    const worst = (a: number[]) => a.length ? +Math.max(...a.map(Math.abs)).toFixed(3) : null;

    const summary = {
      date,
      total_signals: (papers ?? []).length,
      total_real: (exts ?? []).length,
      matched: rows.filter(r => r.status === "matched").length,
      signal_only: rows.filter(r => r.status === "signal_only").length,
      real_only: rows.filter(r => r.status === "real_only").length,
      simulated_pnl: +((papers ?? []).reduce((s, p) => s + Number(p.pnl ?? 0), 0)).toFixed(1),
      real_pnl:      +((exts   ?? []).reduce((s, x) => s + Number(x.pnl ?? 0), 0)).toFixed(1),
      buy_drift_avg_pct:  avg(buyDrifts),
      buy_drift_worst_pct: worst(buyDrifts),
      sell_drift_avg_pct: avg(sellDrifts),
      sell_drift_worst_pct: worst(sellDrifts),
    };

    rows.sort((a, b) => (b.entry_ts ?? b.opened_at ?? "").localeCompare(a.entry_ts ?? a.opened_at ?? ""));
    return { date, summary, rows };
  });

/* ------------------------------------------------------------------ */
/* 2) Signal Quality Score                                             */
/* ------------------------------------------------------------------ */

export const getSignalQualityReport = createServerFn({ method: "GET" })
  .inputValidator((data: { days?: number } | undefined) => ({ days: data?.days }))
  .handler(async ({ data }) => {
    const days = Math.max(1, Math.min(60, Number(data.days ?? 14)));
    const since = new Date(Date.now() - days * 86_400_000).toISOString();

    const { data: trades, error } = await supabaseAdmin
      .from("paper_trades")
      .select("id, symbol, strategy, trade_date, entry_price, entry_ts, exit_price, exit_reason, pnl, pnl_pct, dip_trigger_price, morning_high, status")
      .eq("strategy", "scalp-dip")
      .gte("entry_ts", since)
      .not("exit_ts", "is", null)
      .order("entry_ts", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    // Bulk-load marketwatch snapshots in a window around each entry_ts.
    // We fetch per-symbol slices to avoid a giant IN + range scan.
    type Trade = NonNullable<typeof trades>[number];
    type Feature = {
      trade_id: string;
      symbol: string;
      entry_ts: string;
      hour: number;
      trades_5m: number | null;
      value_5m: number | null;
      drop_pct: number | null;
      pnl: number;
      is_win: boolean;
      score: number;
      bucket: "A" | "B" | "C" | "D";
    };
    const rows: Feature[] = [];

    for (const t of trades ?? []) {
      const entryMs = new Date(t.entry_ts as string).getTime();
      const winStart = new Date(entryMs - 5 * 60_000).toISOString();
      const winEnd = new Date(entryMs + 30_000).toISOString();
      const { data: snaps } = await supabaseAdmin
        .from("marketwatch_snapshots")
        .select("captured_at,total_trades,total_value")
        .eq("symbol", t.symbol)
        .gte("captured_at", winStart)
        .lte("captured_at", winEnd)
        .order("captured_at", { ascending: true })
        .limit(120);

      let trades_5m: number | null = null;
      let value_5m: number | null = null;
      if (snaps && snaps.length >= 2) {
        const first = snaps[0];
        const last = snaps[snaps.length - 1];
        trades_5m = Math.max(0, Number(last.total_trades ?? 0) - Number(first.total_trades ?? 0));
        value_5m  = Math.max(0, Number(last.total_value  ?? 0) - Number(first.total_value  ?? 0));
      } else if (snaps && snaps.length === 1) {
        trades_5m = Number(snaps[0].total_trades ?? 0);
        value_5m  = Number(snaps[0].total_value  ?? 0);
      }

      const entry = t.entry_price != null ? Number(t.entry_price) : null;
      const high  = t.morning_high != null ? Number(t.morning_high) : null;
      const drop_pct = (entry && high) ? +(((entry - high) / high) * 100).toFixed(2) : null;

      // Score 0..100 (heuristic, transparent):
      //   +40 for trades_5m ≥ 40 (activity)     ↓ scaled
      //   +30 for value_5m  ≥ 200k EGP          ↓ scaled
      //   +20 for drop between -8% and -3%     (sweet spot)
      //   +10 for hour 10–12 Cairo (best session window)
      const cairoHour = new Date(new Date(t.entry_ts as string)
        .toLocaleString("en-US", { timeZone: "Africa/Cairo" })).getHours();
      let score = 0;
      if (trades_5m != null) score += Math.min(40, (trades_5m / 40) * 40);
      if (value_5m  != null) score += Math.min(30, (value_5m / 200_000) * 30);
      if (drop_pct != null && drop_pct <= -3 && drop_pct >= -8) score += 20;
      if (cairoHour >= 10 && cairoHour <= 12) score += 10;
      score = Math.round(score);

      const bucket: Feature["bucket"] =
        score >= 75 ? "A" : score >= 55 ? "B" : score >= 35 ? "C" : "D";

      const pnl = Number(t.pnl ?? 0);
      rows.push({
        trade_id: t.id, symbol: t.symbol, entry_ts: t.entry_ts as string,
        hour: cairoHour, trades_5m, value_5m, drop_pct,
        pnl, is_win: pnl > 0, score, bucket,
      });
    }

    const bucketStats = (["A", "B", "C", "D"] as const).map(b => {
      const bs = rows.filter(r => r.bucket === b);
      const wins = bs.filter(r => r.is_win).length;
      const pnl  = bs.reduce((s, r) => s + r.pnl, 0);
      return {
        bucket: b,
        trades: bs.length,
        win_rate: bs.length ? +(wins / bs.length * 100).toFixed(1) : 0,
        net_pnl:  +pnl.toFixed(1),
        avg_pnl:  bs.length ? +(pnl / bs.length).toFixed(1) : 0,
      };
    });

    const wins = rows.filter(r => r.is_win).length;
    const overall = {
      trades: rows.length,
      wins,
      win_rate: rows.length ? +(wins / rows.length * 100).toFixed(1) : 0,
      net_pnl: +rows.reduce((s, r) => s + r.pnl, 0).toFixed(1),
      avg_score: rows.length ? +(rows.reduce((s, r) => s + r.score, 0) / rows.length).toFixed(1) : 0,
    };

    return { days, overall, bucketStats, rows };
  });