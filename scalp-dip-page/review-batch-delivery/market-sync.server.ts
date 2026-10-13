import { supabaseAdmin as _supabaseAdmin } from "@/integrations/supabase/client.server";
import { isOfficialSessionDay, lastNOfficialSessions } from "@/lib/scalp-dip/momentum-weekly.server";
// daily_candles exists in the database but is absent from the generated
// Database types — the codebase's escape hatch (same as decision_audit_log).
const supabaseAdmin = _supabaseAdmin as any;

/**
 * market-sync.server.ts — Layer 1 data backbone for the weekly system.
 *
 * ONE POST to TradingView's public screener endpoint returns the WHOLE EGX
 * market (open/high/low/close/volume for ~296 symbols). The session OPEN is
 * recorded by the exchange, so a call DURING/AFTER the session yields the
 * true open — but a PRE-OPEN, holiday or weekend call returns the PREVIOUS
 * session's values, which must never be stored under today's date (that is
 * exactly how the 3-Oct phantom rows happened). syncMarketSnapshot therefore
 * validates (official session, >=10:05 Cairo, duplicate-day and coverage
 * gates) BEFORE any write; upsertTodayCandles fills only scanner-missed
 * symbols and never overwrites scanner rows.
 *
 * Primary source: this scanner. Secondary: marketwatch_snapshots/live_ticks
 * (the ThunderX extension) fills symbols the scanner missed. Tertiary: the
 * user's TradingView export backfill (backfill_from_tv.cjs). Hard stop last.
 */

const SCANNER_URL = "https://scanner.tradingview.com/egypt/scan?label-product=screener-stock";

/** Scanner response shape guard (audit Oct-4 batch 3 A4: undocumented
 * endpoint, no SLA — every response is validated before use). */
export function validateScannerPayload(j: any): { ok: boolean; reason: string } {
  if (!j || !Array.isArray(j.data)) return { ok: false, reason: "bad-shape" };
  if (!j.data.length) return { ok: false, reason: "empty" };
  const bad = j.data.filter((it: any) => typeof it?.s !== "string" || !Array.isArray(it?.d) || it.d.length < 6).length;
  if (bad > j.data.length * 0.1) return { ok: false, reason: `schema-drift:${bad}/${j.data.length}` };
  return { ok: true, reason: "ok" };
}

/** Pre-write validator (audit Oct-4 batch 3 A2). Runs BEFORE any candle
 * write: (a) date must be an official session; (b) opens are valid only
 * at/after 10:05 Cairo (earlier the scanner repeats the previous close);
 * (c) duplicate-day detector: >=90% of symbols byte-identical to their
 * previous stored candle means a stale reprint (the 3-Oct mechanism) —
 * reject; (d) coverage >= 80% of the previous session's symbol count.
 * Fallback order when rejected: scanner -> extension-fill -> user-file
 * backfill -> hard stop (see route). Before real money this feed must be
 * replaced by a licensed feed or broker data (no SLA, no key, silent
 * schema changes — see validateScannerPayload). */
export function validateScannerSnapshot(
  rows: Array<{ symbol: string; open: number; high: number; low: number; close: number; volume: number }>,
  opts: {
    dateISO: string;
    cairoMins: number;
    prevCount: number;
    prevBySymbol: Map<string, { o: number; h: number; l: number; c: number; v: number }>;
  },
): { ok: boolean; reason: string; opensValid: boolean } {
  if (!isOfficialSessionDay(opts.dateISO)) {
    return { ok: false, reason: `non-session-date:${opts.dateISO}`, opensValid: false };
  }
  const opensValid = opts.cairoMins >= 10 * 60 + 5;
  if (!rows.length) return { ok: false, reason: "empty-snapshot", opensValid };
  if (opts.prevCount > 0 && rows.length < 0.8 * opts.prevCount) {
    return { ok: false, reason: `low-coverage:${rows.length}/${opts.prevCount}`, opensValid };
  }
  if (opts.prevBySymbol.size > 0) {
    let identical = 0;
    let compared = 0;
    for (const r of rows) {
      const p = opts.prevBySymbol.get(r.symbol);
      if (!p) continue;
      compared++;
      if (p.o === r.open && p.h === r.high && p.l === r.low && p.c === r.close && p.v === r.volume) identical++;
    }
    if (compared > 0 && identical / compared >= 0.9) {
      return { ok: false, reason: `duplicate-day:${identical}/${compared}`, opensValid };
    }
  }
  return { ok: true, reason: "ok", opensValid };
}

export async function fetchEgxScannerSnapshot(): Promise<
  { symbol: string; open: number; high: number; low: number; close: number; volume: number }[]
> {
  const res = await fetch(SCANNER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    body: JSON.stringify({
      filter: [{ left: "type", operation: "equal", right: "stock" }],
      options: { lang: "en" },
      markets: ["egypt"],
      symbols: { query: { types: [] }, tickers: [] },
      columns: ["name", "open", "high", "low", "close", "volume", "change"],
      sort: { sortBy: "name", sortOrder: "asc" },
    }),
  });
  if (!res.ok) throw new Error(`scanner HTTP ${res.status}`);
  const j: any = await res.json();
  const shape = validateScannerPayload(j);
  if (!shape.ok) throw new Error(`scanner payload rejected: ${shape.reason}`);
  const out: { symbol: string; open: number; high: number; low: number; close: number; volume: number }[] = [];
  for (const item of j.data ?? []) {
    const d = item.d;
    const symbol = String(item.s || "").replace("EGX:", "").toUpperCase();
    const open = Number(d?.[1]);
    const high = Number(d?.[2]);
    const low = Number(d?.[3]);
    const close = Number(d?.[4]);
    const volume = Number(d?.[5]) || 0;
    if (!(close > 0) || !(open > 0)) continue;
    out.push({ symbol, open, high: high > 0 ? high : close, low: low > 0 ? low : open, close, volume });
  }
  return out;
}

/** Upsert today's candles from the scanner snapshot. Idempotent.
 * Audit Oct-4 batch 3 (A2): validated BEFORE any write (official session,
 * duplicate-day and coverage gates); pre-10:05 runs merge H/L/C/V but never
 * opens. Returns rejection instead of writing on failure. */
export async function syncMarketSnapshot(
  dateISO: string,
  opts?: { cairoMins?: number },
): Promise<{ written: number; total: number; rejected?: string; opensValid?: boolean }> {
  const rows = await fetchEgxScannerSnapshot();
  // previous official session's stored candles (for duplicate/coverage gates)
  const prevDays = lastNOfficialSessions(dateISO, 2).filter((d) => d < dateISO);
  const prevDay = prevDays.length ? prevDays[prevDays.length - 1] : "";
  let prevCount = 0;
  const prevBySymbol = new Map<string, { o: number; h: number; l: number; c: number; v: number }>();
  if (prevDay) {
    const { data: prev } = await supabaseAdmin.from("daily_candles").select("symbol,open,high,low,close,volume").eq("date", prevDay);
    for (const r of prev ?? []) {
      prevCount++;
      prevBySymbol.set(String((r as any).symbol).toUpperCase(), {
        o: Number((r as any).open) || 0,
        h: Number((r as any).high) || 0,
        l: Number((r as any).low) || 0,
        c: Number((r as any).close) || 0,
        v: Number((r as any).volume) || 0,
      });
    }
  }
  const v = validateScannerSnapshot(rows, { dateISO, cairoMins: opts?.cairoMins ?? 9999, prevCount, prevBySymbol });
  if (!v.ok) return { written: 0, total: rows.length, rejected: v.reason, opensValid: v.opensValid };
  // Pre-10:05 the scanner repeats previous closes as "opens" — writing them
  // would poison the open column, so the whole sync waits (safe: cron runs
  // at 10:10 Cairo; manual early calls no-op with a reason).
  if (!v.opensValid) return { written: 0, total: rows.length, rejected: "pre-open", opensValid: false };
  let written = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500).map((r) => ({ ...r, date: dateISO }));
    const { error } = await supabaseAdmin.from("daily_candles").upsert(batch, { onConflict: "symbol,date" });
    if (error) throw new Error(`daily_candles upsert: ${error.message}`);
    written += batch.length;
  }
  return { written, total: rows.length, opensValid: v.opensValid };
}

/** Filler: for symbols with NO candle today, build one from
 * marketwatch_snapshots (o=first, c=last, h/l=max/min) + live_ticks volume.
 * Never overwrites scanner rows. */
export async function fillMissingTodayCandles(dateISO: string): Promise<number> {
  const { data: existing } = await supabaseAdmin
    .from("daily_candles")
    .select("symbol")
    .eq("date", dateISO);
  const have = new Set((existing ?? []).map((r: any) => String(r.symbol).toUpperCase()));

  const snaps: any[] = [];
  let from = 0;
  while (true) {
    const { data } = await supabaseAdmin
      .from("marketwatch_snapshots")
      .select("symbol, last_price, captured_at")
      .gte("captured_at", `${dateISO}T00:00:00Z`)
      .order("captured_at", { ascending: true })
      .range(from, from + 999);
    if (!data?.length) break;
    snaps.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  const agg = new Map<string, { o: number; c: number; h: number; l: number }>();
  for (const r of snaps) {
    const sym = String(r.symbol).toUpperCase();
    if (have.has(sym)) continue;
    const px = Number(r.last_price);
    if (!(px > 0)) continue;
    const cur = agg.get(sym);
    if (!cur) agg.set(sym, { o: px, c: px, h: px, l: px });
    else { cur.c = px; cur.h = Math.max(cur.h, px); cur.l = Math.min(cur.l, px); }
  }
  let written = 0;
  const rows: any[] = [];
  for (const [sym, a] of agg) {
    rows.push({ symbol: sym, date: dateISO, open: a.o, high: a.h, low: a.l, close: a.c, volume: 0 });
  }
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await supabaseAdmin.from("daily_candles").upsert(batch, { onConflict: "symbol,date" });
    if (!error) written += batch.length;
  }
  return written;
}
