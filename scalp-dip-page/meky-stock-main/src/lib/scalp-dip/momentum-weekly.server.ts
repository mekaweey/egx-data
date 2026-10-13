import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { isHalal } from "./halal-list.server";
import { getHalalStatus, assertHalalSet, HALAL_EXPECTED_COUNT } from "./halal-list.server";

/**
 * ═══════════════════════════════════════════════════════════════════════
 * MOMENTUM-WEEKLY — fresh-high/momentum rotation, 5-session hold
 * (strategy id: momentum-weekly, same operations page)
 * ═══════════════════════════════════════════════════════════════════════
 * CANONICAL CONFIG — validated 2026-09-20 on 512 weeks (2016–2026, 161
 * EGX symbols, Yahoo daily cross-verified 99% vs TradingView minutes):
 *   • geometric mean +1.39%/week (N=3) / +1.31% (N=4), Thundr cost 0.05% RT
 *   • worst week −22.2% (N=3) / −17.8% (N=4), maxDD 30% / 20%
 *   • 76/76 parameter-sweep combos profitable (0.37–1.58%/wk @0.6% cost)
 *   • walk-forward both directions positive (0.76% / 0.75%)
 * Reproduce: workspace bt/honest_sweep76.ps1, bt/honest_check.ps1,
 * bt/head_to_head.ps1, bt/picks_from_tv.ps1.
 *
 * Every rule's WHY (do not "simplify"):
 *   • WEEKLY cadence, entry first session open (Sun), exit next week's
 *     first session open: full-week hold beat 3-day (1.49 vs 1.22) and
 *     4-day (1.43) on 10y. Exit at open vs close: immaterial (1.45/1.43).
 *   • Momentum 5 sessions ∈ [+8%, +45%], ending YESTERDAY (t−1 closes):
 *     band lower cut kills noise, upper cap is the tail shield (removing
 *     it: worst week −22.7%→−36.2%, maxDD 38%→59%). No look-ahead ever.
 *   • Liquidity: mean daily money (close×vol) last 20 sessions ENDING
 *     yesterday ≥ 200k EGP, top-100 by that measure. Using entry-day data
 *     (look-ahead) was caught and removed — honest V20 only.
 *   • Gap filter at entry open ∈ [−3%, +2%] — no chasing gaps.
 *   • Regime filter: 10-week cumulative equal-weight universe return > 0,
 *     else ALL CASH. Removing it: maxDD 61% (vs 36%) and worst year −25%.
 *   • NO stop-loss, NO take-profit: both tested net-negative on 10y
 *     (SL close-only made worst week WORSE: −24.6% vs −22.7%).
 *   • Vol-targeting (8-week σ > 6% → scale 0.06/σ) + crash cut (two
 *     consecutive weeks < −8% → half size): tail protection, kept.
 *   • N ≥ 4 recommended (N=2: worst week −29.5%, maxDD 52%).
 *
 * DATA: needs the `daily_candles` table (symbol, date, open, high, low,
 * close, volume — one row per symbol per session, Cairo dates). Seeded
 * once from 10-year verified Yahoo history; updated after every close
 * from marketwatch_snapshots/live_ticks by the EOD automation hook.
 */

export const STRATEGY_ID = "momentum-weekly";

export const MW_PARAMS = {
  TOTAL_CAPITAL: 100_000,
  TOP_N_DEFAULT: 5, // N5 deployment (audited: best return/consistency balance)
  TOP_N_MAX: 5,
  MOM_LB: 5, // sessions, ending yesterday
  MOM_MIN: 0.08,
  MOM_MAX: 0.45, // tail shield — never remove (measured)
  MOM_SESSIONS_REQUIRED: 6, // agreed rule (audit Oct-4): all 6 momentum sessions present
  LIQ_TOP: 100,
  LIQ_FLOOR_MONEY: 200_000, // mean daily close×volume, last 20 sessions ending yesterday
  LIQ_WINDOW: 20,
  LIQ_SESSIONS_REQUIRED: 18, // agreed rule (audit Oct-4): >=18 of last 20 official sessions
  HIGH_WINDOW: 250, // for the fresh-high (FH) variant flag
  GAP_MIN: -0.03, // entry-open filter vs yesterday close
  GAP_MAX: 0.02,
  REGIME_WEEKS: 10, // cumulative EW universe return > 0 → trade, else cash
  HOLD_SESSIONS: 5, // exit at next week's first open
  COST_RT: 0.0005, // Thundr 0.05% round trip (0.6% variant validated: 1.17%/wk)
  VOL_TARGET: 0.06, // 8-week weekly-σ above this → scale positions by 0.06/σ
  CRASH_CUT: 0.08, // two consecutive weeks summing ≤ −8% → half size
  SESSION_DAYS: [0, 1, 2, 3, 4], // Sun..Thu
  PRICE_MIN: 0.5,
  HALAL_ONLY: true, // nominations restricted to the Shariah whitelist
  // Official EGX holidays: Sun-Thu dates with ZERO rows in daily_candles AND
  // non-trading evidence from Yahoo (absent or flat-carried closes).
  // 2026-10-08 (Thu, Armed Forces Day observance, cabinet decree 2898/2026):
  // confirmed 5 Oct 2026 by EgyptToday + Amwal Al Ghad (PM decree replaces
  // Tue 6 Oct; trading resumes Sun 11 Oct). 6 Oct 2026 is a NORMAL session.
  // The other 2026 closures below are decree-unretrieved but two-source
  // confirmed (DB-zero + Yahoo-agreed); Jun 30 and Aug 26 are SESSIONS
  // (both sources show real movement) despite stale third-party lists.
  HOLIDAYS: [
    "2026-04-12", // Easter Sunday (Sham El Nessim Mon 13th is non-session anyway)
    "2026-05-07", // Thu, closure both sources, decree unknown
    "2026-05-26", // Eid al-Adha break
    "2026-05-27", // Eid al-Adha (confirmed multi-source)
    "2026-05-28", // Eid al-Adha (confirmed multi-source)
    "2026-05-31", // Sun, closure both sources, decree unknown
    "2026-06-18", // Thu, closure both sources, decree unknown
    "2026-07-02", // Thu, June-30 observance (confirmed multi-source)
    "2026-07-23", // Thu, Revolution Day (confirmed multi-source)
    "2026-08-27", // Thu, closure both sources, decree unknown
    "2026-10-08", // Thu, Armed Forces Day observance, decree 2898/2026
  ] as readonly string[],
  // Known DATA holes (exchange traded per Yahoo/second source, rows missing).
  // Only 17 Sep 2026 qualifies. Windows crossing it are unmeasurable (E8);
  // checkMarketWide exempts listed holes so historical re-scans don't false
  // stop, but any UNLISTED outage still trips the hard stop.
  DATA_HOLES: ["2026-09-17"] as readonly string[],
  // Days whose session status is unconfirmed (none right now — 6 and 8 Oct
  // were resolved 5 Oct 2026). The machinery stays: unknown days are never
  // assumed — the engine hard-stops/asks. See calendarStatus().
  UNKNOWN_DAYS: [] as readonly string[],
  // W4 selection filters (volume confirmation + smooth momentum). Verdict per
  // the data-hierarchy rule (user's daily.csv = primary source, 2026-09-22):
  // OFF. On the primary source the filters cost ~60% of the return (they
  // exclude the monster-week picks: 07-05 +14,948 vs +5,881, 07-12 +21,770 vs
  // +3,914). Their verified value on ydf-10y was tail protection only. Flag
  // kept for live A/B — flip to true to re-enable.
  W4_FILTERS: false,
} as const;

export const USER_CAPITAL_SETTING_KEY = "momentum_weekly_user_capital";
// N5 deployment: 100k / 20k = 5 positions. Execution: 20k = p90 0.9% of pick
// liquidity - trivially fillable. (Old N3-era sizing notes removed in the
// Oct-4 audit cleanup; see AUDITED_* below for current figures.)
export const SLOT_UNIT_EGP = 20_000; // N5 deployment: 100k / 20k = 5 positions

/** Sizing from user capital: N = clamp(round(capital / 33k), 1, 5). */
export function computeSizing(userCapital: number | null | undefined): {
  total_capital: number;
  top_n: number;
  slot_capital: number;
} {
  const cap =
    typeof userCapital === "number" && Number.isFinite(userCapital) && userCapital > 0
      ? userCapital
      : MW_PARAMS.TOTAL_CAPITAL;
  let topN = Math.round(cap / SLOT_UNIT_EGP);
  if (topN < 1) topN = 1;
  if (topN > MW_PARAMS.TOP_N_MAX) topN = MW_PARAMS.TOP_N_MAX;
  return { total_capital: cap, top_n: topN, slot_capital: cap / topN };
}

/** Audited strategy figures (Oct-4 independent replication, agreed rule:
 * 6/6 momentum sessions, >=18/20 liquidity, band 8-45%, gap -3/+2%,
 * capital-weighted, 19 complete weeks Apr-Aug 2026, Sep-17 weeks excluded).
 * NEVER shown without BACKTEST_DISCLAIMER_AR. No guaranteed-profit promises.
 * (Old N3-era constants 1,033 / 490-1,600 / 2,000-3,300 removed here.) */
export const AUDITED_WEEKLY_WIN_RATE = 0.58; // 11/19 weeks
export const AUDITED_WIN_CI_LOW = 0.33; // Wilson 95%
export const AUDITED_WIN_CI_HIGH = 0.79; // Wilson 95%
export const AUDITED_WEEKLY_MEAN = 0.0189; // +1.89%/week capital-weighted
export const AUDITED_WEEKLY_MEAN_EX_TOP2 = 0.0076; // +0.76% without 2 best weeks
export const BACKTEST_WORST_WEEK_PCT = -24.5; // halal 10y worst week
export const BACKTEST_MAXDD_PCT = 36.7; // halal 10y max drawdown

export const BACKTEST_DISCLAIMER_AR =
  "تدقيق مستقل (19 أسبوعاً مكتملاً، القاعدة المتفق عليها، ترجيح برأس المال): " +
  "فوز أسبوعي 58% (فاصل ثقة 95%: 33-79%) — متوسط +1.9%/أسبوع (+0.8% بدون أفضل أسبوعين). " +
  "معدل 80% غير مثبت للمستقبل بأي طريقة قياس. " +
  "مرفوض نهائياً: وعد بربح ثابت. " +
  "أقصى تراجع تاريخي 36.7% — التوصية: paper trading ثم رأس مال تدريجي.";

// ── time helpers (identical conventions to gap-fade engine) ──

export function cairoNow(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
}

export function cairoDateISO(d: Date = cairoNow()): string {
  return new Date(d.toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
    .toISOString()
    .slice(0, 10);
}

export function isSessionDay(d: Date = cairoNow()): boolean {
  return MW_PARAMS.SESSION_DAYS.includes(d.getDay() as 0 | 1 | 2 | 3 | 4);
}

/** EGX session days are Sun(0)..Thu(4). Count sessions in [fromISO, toISO]. */
export function sessionsBetween(fromISO: string, toISO: string): number {
  const start = Date.parse(`${fromISO}T00:00:00Z`);
  const end = Date.parse(`${toISO}T00:00:00Z`);
  let n = 0;
  for (let t = start; t <= end; t += 86_400_000) {
    const dow = new Date(t).getUTCDay() as 0 | 1 | 2 | 3 | 4;
    if (MW_PARAMS.SESSION_DAYS.includes(dow)) n++;
  }
  return n;
}

// ── daily candles data layer ──────────────────────────────────────────

export type DailyCandle = {
  date: string; // YYYY-MM-DD Cairo
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

/** Load one symbol's candle history (ascending) from daily_candles.
 * Paginates past the 1000-row PostgREST default cap (10y = ~2,478 rows). */
export async function loadCandles(symbol: string, minRows = 30): Promise<DailyCandle[]> {
  const out: DailyCandle[] = [];
  let from = 0;
  while (true) {
    const { data } = await supabaseAdmin
      .from("daily_candles")
      .select("date, open, high, low, close, volume")
      .eq("symbol", symbol)
      .order("date", { ascending: true })
      .range(from, from + 999);
    if (!data?.length) break;
    for (const r of data) {
      const o = Number(r.open);
      const c = Number(r.close);
      if (!(o > 0) || !(c > 0)) continue;
      out.push({
        date: String(r.date),
        open: o,
        high: Number(r.high) || o,
        low: Number(r.low) || o,
        close: c,
        volume: Number(r.volume) || 0,
      });
    }
    if (data.length < 1000) break;
    from += 1000;
  }
  return out;
}

/** Active tradable universe (bug fix 2026-09-22): the stocks table alone held
 * only 66 active symbols while 93+ halal symbols actually trade — new listings
 * were silently excluded from nominations. FIX: union the stocks table with
 * every symbol that has scanner-synced candles in the last ~2 weeks (new
 * listings enter automatically). */
export async function loadUniverse(): Promise<string[]> {
  const syms = new Set<string>();
  const { data: stocks } = await supabaseAdmin
    .from("stocks")
    .select("symbol")
    .eq("is_active", true)
    .eq("day_tradable", true);
  for (const s of stocks ?? []) syms.add(String(s.symbol).toUpperCase());
  const since = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
  const { data: candles } = await (supabaseAdmin as any)
    .from("daily_candles")
    .select("symbol")
    .gte("date", since);
  for (const r of candles ?? []) syms.add(String(r.symbol).toUpperCase());
  return [...syms];
}

export type WeeklyCandidate = {
  symbol: string;
  last_close: number; // close at the signal session (yesterday's close)
  mom5: number; // 5-session return ending yesterday
  v20_money: number; // mean daily close×volume, ending yesterday
  near_high: number; // close(yesterday) / max close(250 ending yesterday)
  fresh_high: boolean; // closed exactly at the 250-session max yesterday
  halal: boolean;
  down5: number; // down days in the last 5 sessions (smooth-momentum filter)
  volR: number; // mean volume last 10 / mean volume last 20 (confirmation)
  mom_sessions?: string; // audit Oct-4: "6/6" presence for the alert format
  liq_sessions?: string; // audit Oct-4: "y/20" presence for the alert format
};

export type WeeklyStatus = {
  status:
    | "before_data"
    | "stale_data"
    | "bad_signal" // audit Oct-4: signal date is Fri/Sat/holiday (hard stop)
    | "bad_halal" // audit Oct-4 batch 3 (A1): whitelist unreadable/too small (hard stop)
    | "unknown_calendar" // audit Oct-4 task 8: touches an unconfirmed day (ask user)
    | "market_hole" // audit Oct-4 task 4: market-wide missing session (hard stop)
    | "regime_off"
    | "no_candidates"
    | "ready";
  statusLabelAr: string;
  cairoTime: string;
  signalDate: string; // the session whose close the signals are computed from
  entryDate: string; // next session (entry at its open)
  exitDate: string; // expected exit session (open)
  regimeOn: boolean;
  regimeCum10: number;
  regimeDef: string; // audit Oct-4: exact regime definition (see REGIME_DEF)
  regimeOO10?: number; // audit Oct-4 task 6: open-to-open reference twin (NOT the trigger)
  protectionScale: number; // risk overlays: vol-target × crash-cut sizing scale
  universeCount: number;
  liquidCount: number;
  bandCount: number;
  candidates: WeeklyCandidate[];
  selected: WeeklyCandidate[];
  sizing: { total_capital: number; top_n: number; slot_capital: number };
  // audit Oct-4 additions (all optional so old readers keep working):
  rejectReasons?: Array<{ symbol: string; reason: string }>;
  heldSessions?: string[]; // official sessions actually held entry→exit
  shortenedHold?: boolean; // true when a holiday shrinks the holding period
  halalPath?: string; // audit Oct-4 batch 3 (A1): whitelist path used
  halalCount?: number; // audit Oct-4 batch 3 (A1): whitelist size used
  dryRun?: boolean;
};

/** Regime definition (audit Oct-4, task 5) — close-to-close, equal-weight over
 * the full scanner universe present in BOTH the first and the last session of
 * each Sun-week (>=100 symbols required per week or the week is skipped),
 * cumulative product over the last 10 such weeks, ON iff > 0.
 * Open-to-open is reported alongside for comparison but is NOT the trigger. */
export const REGIME_DEF =
  "close-to-close, equal-weight, full-scanner-universe (>=100 syms/wk), 10-week cumulative product > 0";

/** Normalize any DB date label to a Cairo calendar day (YYYY-MM-DD).
 * Fixes the audit Oct-4 date-labelling hazard: timestamptz Cairo-midnights
 * display as previous-day 21:00Z in UTC. */
export function cairoDayOfRow(dateStr: string): string {
  const d = new Date(dateStr.length <= 10 ? `${dateStr}T00:00:00Z` : dateStr);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(d);
}

/** Official EGX session day: Sun..Thu and not a confirmed holiday.
 * Unknown days (see UNKNOWN_DAYS) are NOT sessions — conservative: the
 * engine hard-stops/asks instead of assuming (audit Oct-4 task 8). */
export function isOfficialSessionDay(cairoDay: string): boolean {
  if (calendarStatus(cairoDay) !== "session") return false;
  return true;
}

/** Calendar status of a Cairo day: session | holiday | weekend | unknown.
 * Unknown = weekday that is neither confirmed open nor a confirmed holiday
 * (currently 6 and 8 Oct 2026) — the engine must ask, never assume. */
export function calendarStatus(cairoDay: string): "session" | "holiday" | "weekend" | "unknown" {
  const dow = new Date(`${cairoDay}T00:00:00Z`).getUTCDay();
  if (!MW_PARAMS.SESSION_DAYS.includes(dow as 0 | 1 | 2 | 3 | 4)) return "weekend";
  if ((MW_PARAMS.HOLIDAYS as readonly string[]).includes(cairoDay)) return "holiday";
  if ((MW_PARAMS.UNKNOWN_DAYS as readonly string[]).includes(cairoDay)) return "unknown";
  return "session";
}

/** Signal window (audit Oct-4 batch 3 task 1): the LAST official session of
 * the week, after the 14:45 Cairo close. Normally Thursday; if Thursday is a
 * holiday/unknown (e.g. 8 Oct 2026), the last official session before the
 * Fri/Sat break (e.g. Wed 7 Oct) carries the signal. Alerts go out that
 * evening; Sunday is gap/fill check only. */
export function isSignalWindow(nowCairo: Date): boolean {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(nowCairo);
  if (!isOfficialSessionDay(day)) return false;
  // no official session later this Sun-Sat week?
  const cur = new Date(`${day}T00:00:00Z`);
  const weekEnd = new Date(cur);
  while (weekEnd.getUTCDay() !== 6) weekEnd.setUTCDate(weekEnd.getUTCDate() + 1); // Saturday
  const probe = new Date(cur);
  probe.setUTCDate(probe.getUTCDate() + 1);
  while (probe.toISOString().slice(0, 10) <= weekEnd.toISOString().slice(0, 10)) {
    if (isOfficialSessionDay(probe.toISOString().slice(0, 10))) return false;
    probe.setUTCDate(probe.getUTCDate() + 1);
  }
  const mins = nowCairo.getHours() * 60 + nowCairo.getMinutes();
  return mins >= 14 * 60 + 45;
}

/** Market-wide hole check (audit Oct-4 task 4): (a) any official session in
 * the trailing 26-session window with zero market-wide candles while already
 * passed, or (b) signal-session coverage below MARKET_HOLE_COVERAGE.
 * Either is a HARD STOP — never "no candidates". */
export const MARKET_HOLE_COVERAGE = 0.8;

export function checkMarketWide(
  cairoDaysPresent: string[],
  signalDay: string,
  signalSymbols: number,
  universeSymbols: number,
): { ok: boolean; reason: string } {
  // Listed data holes (e.g. 17 Sep) are known outages, not market closures:
  // exempt them here (windows still penalize them via presence counts), but
  // any UNLISTED outage trips the hard stop.
  const holes = new Set<string>(MW_PARAMS.DATA_HOLES as readonly string[]);
  const win = lastNOfficialSessions(signalDay, 26);
  const missing = win.filter((d) => !cairoDaysPresent.includes(d) && !holes.has(d));
  if (missing.length) return { ok: false, reason: `market-hole:${missing.join(",")}` };
  if (universeSymbols > 0 && signalSymbols / universeSymbols < MARKET_HOLE_COVERAGE) {
    return { ok: false, reason: `signal-coverage:${signalSymbols}/${universeSymbols}` };
  }
  return { ok: true, reason: "ok" };
}
/** True when the entry→exit holding span touches an unknown-calendar day. */
export function holdingTouchesUnknown(entryDateCairo: string, exitDateCairo: string): boolean {
  const cur = new Date(`${entryDateCairo}T00:00:00Z`);
  while (cur.toISOString().slice(0, 10) <= exitDateCairo) {
    if (calendarStatus(cur.toISOString().slice(0, 10)) === "unknown") return true;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return false;
}

/** Last n official sessions ending at (and including) a Cairo day. */
export function lastNOfficialSessions(cairoDay: string, n: number): string[] {
  const out: string[] = [];
  const cur = new Date(`${cairoDay}T00:00:00Z`);
  while (out.length < n) {
    const iso = cur.toISOString().slice(0, 10);
    if (isOfficialSessionDay(iso)) out.unshift(iso);
    cur.setUTCDate(cur.getUTCDate() - 1);
  }
  return out;
}

/** Per-symbol agreed-rule screening (audit Oct-4, task 3).
 * Sessions are OFFICIAL session dates (not table-row offsets): momentum needs
 * all 6 present with valid data; liquidity needs >=18 of 20 present.
 * Returns the candidate or a machine-readable reject reason. NULL = reject:
 * any null/non-positive close, or null volume, inside the required windows
 * rejects. Row lookup is by Cairo calendar day (fixes the UTC/21:00Z
 * date-labelling hazard). */
export function screenSymbolCandidate(
  sym: string,
  byDay: Map<string, { close: number; volume: number }>,
  momSessions: string[],
  liqSessions: string[],
): { cand: { symbol: string; last_close: number; mom5: number; v20_money: number } | null; reason: string; momPresent: number; liqPresent: number } {
  const momNeed = MW_PARAMS.MOM_LB + 1; // 6 sessions
  if (momSessions.length < momNeed) return { cand: null, reason: `momentum-short:${momSessions.length}/6`, momPresent: 0, liqPresent: 0 };
  const momRows = momSessions.map((d) => byDay.get(d));
  const momOk = momRows.filter((r) => r && r.close > 0 && (r.volume || 0) > 0);
  if (momOk.length < momNeed) {
    const hasNull = momRows.some((r) => !r || !(r.close > 0) || (r.volume || 0) <= 0);
    return { cand: null, reason: hasNull ? "momentum-null" : `momentum-short:${momOk.length}/6`, momPresent: momOk.length, liqPresent: 0 };
  }
  const liqPresent = liqSessions
    .map((d) => byDay.get(d))
    .filter((r) => r && r.close > 0 && (r.volume || 0) > 0);
  if (liqPresent.length < MW_PARAMS.LIQ_SESSIONS_REQUIRED) {
    return { cand: null, reason: `liquidity-short:${liqPresent.length}/20`, momPresent: momNeed, liqPresent: liqPresent.length };
  }
  const lastClose = byDay.get(momSessions[momSessions.length - 1])!.close;
  if (!(lastClose >= MW_PARAMS.PRICE_MIN)) return { cand: null, reason: "price-floor", momPresent: momNeed, liqPresent: liqPresent.length };
  const money = liqPresent.reduce((a, r) => a + r!.close * (r!.volume || 0), 0) / MW_PARAMS.LIQ_WINDOW;
  if (money < MW_PARAMS.LIQ_FLOOR_MONEY) return { cand: null, reason: "liquidity-floor", momPresent: momNeed, liqPresent: liqPresent.length };
  const firstClose = byDay.get(momSessions[0])!.close;
  const mom = lastClose / firstClose - 1;
  if (!(mom >= MW_PARAMS.MOM_MIN && mom <= MW_PARAMS.MOM_MAX)) return { cand: null, reason: "momentum-band", momPresent: momNeed, liqPresent: liqPresent.length };
  return {
    cand: { symbol: sym, last_close: lastClose, mom5: mom, v20_money: money },
    reason: "pass",
    momPresent: momNeed,
    liqPresent: liqPresent.length,
  };
}

/** Exit + holding set from the official calendar (audit Oct-4, task 3/5).
 * Entry week Sunday -> following Sunday; holidays skipped; flags shortened holds. */
export function computeExitFromCalendar(entryDateCairo: string): {
  exitDate: string;
  heldSessions: string[];
  shortenedHold: boolean;
} {
  const entry = new Date(`${entryDateCairo}T00:00:00Z`);
  const weekStart = new Date(entry);
  weekStart.setUTCDate(weekStart.getUTCDate() - entry.getUTCDay());
  const target = new Date(weekStart);
  target.setUTCDate(target.getUTCDate() + 7); // following Sunday
  const exit = new Date(target);
  while (!isOfficialSessionDay(exit.toISOString().slice(0, 10))) {
    exit.setUTCDate(exit.getUTCDate() + 1);
  }
  const held: string[] = [];
  const cur = new Date(entry);
  const exitISO = exit.toISOString().slice(0, 10);
  while (cur.toISOString().slice(0, 10) < exitISO) {
    const iso = cur.toISOString().slice(0, 10);
    if (isOfficialSessionDay(iso)) held.push(iso);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return { exitDate: exitISO, heldSessions: held, shortenedHold: held.length < MW_PARAMS.HOLD_SESSIONS };
}

/** Exit-price source selection (audit Oct-4 task 3). Pure and tested:
 * candles-open wins; anything else is a fallback that must NOT close. */
export function selectExitPrice(
  todayOpen: number,
  mwPrice: number,
  lastClose: number,
): { price: number; source: "candles-open" | "marketwatch" | "last_close" } {
  if (todayOpen > 0) return { price: todayOpen, source: "candles-open" };
  if (mwPrice > 0) return { price: mwPrice, source: "marketwatch" };
  return { price: lastClose, source: "last_close" };
}

/** Alert delivery state machine (audit Oct-4 batch 5 A1). Pure and tested
 * with a fake clock. Rows persisted but no delivered marker
 * (telegram_sent=true) -> retry every run in the window; after
 * ALERT_MAX_FAILURES undelivered runs -> escalate once. Delivered -> never
 * resend. */
export const ALERT_MAX_FAILURES = 5;

export function alertSendState(args: {
  ready: boolean;
  deliveredMarkers: number;
  failedMarkers: number;
  escalationMarkers: number;
}): "send" | "retry" | "escalate" | "skip" {
  if (!args.ready) return "skip";
  if (args.deliveredMarkers > 0) return "skip";
  if (args.failedMarkers >= ALERT_MAX_FAILURES && args.escalationMarkers > 0) return "skip";
  if (args.failedMarkers >= ALERT_MAX_FAILURES) return "escalate";
  return args.failedMarkers > 0 ? "retry" : "send";
}

/** Telegram per-stock preview line (audit Oct-4, task 7). Preview only. */
export function formatTelegramPreviewLine(r: {
  symbol: string;
  mom5: number;
  momSessions: string;
  liqSessions: string;
  v20: number;
  signalClose: number;
  verdict: string;
}): string {
  const lo = (r.signalClose * (1 + MW_PARAMS.GAP_MIN)).toFixed(2);
  const hi = (r.signalClose * (1 + MW_PARAMS.GAP_MAX)).toFixed(2);
  return (
    `• ${r.symbol} | mom ${(100 * r.mom5).toFixed(1)}% (${r.momSessions} جلسات، سيولة ${r.liqSessions}) | ` +
    `v20 ${Math.round(r.v20).toLocaleString("en-US")} | إغلاق ${r.signalClose} | شراء [${lo} .. ${hi}] | ${r.verdict}`
  );
}

/** A candle for date D is COMPLETE when D has passed, or D is today and the
 * Cairo clock is past 14:45. Midnight-safe (uses the real Cairo date). */
function lastCompletedIdx(g: DailyCandle[], nowCairo: Date): number {
  const todayISO = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(nowCairo);
  const mins = nowCairo.getHours() * 60 + nowCairo.getMinutes();
  let li = g.length - 1;
  while (li > 0) {
    const d = g[li].date;
    const complete = d < todayISO || (d === todayISO && mins >= 14 * 60 + 45);
    if (complete) break;
    li--;
  }
  return li;
}

/** The weekly scan — honest windows only (signals from t−1 closes).
 * signalDate = the last completed session in daily_candles. */
export async function scanWeeklyCandidates(opts?: { dryRun?: boolean }): Promise<WeeklyStatus> {
  const now = cairoNow();
  const todayISO = cairoDateISO(now);
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const sizing = { total_capital: MW_PARAMS.TOTAL_CAPITAL, top_n: MW_PARAMS.TOP_N_DEFAULT, slot_capital: MW_PARAMS.TOTAL_CAPITAL / MW_PARAMS.TOP_N_DEFAULT };
  const base: WeeklyStatus = {
    status: "before_data",
    statusLabelAr: "لا توجد بيانات",
    cairoTime: hhmm,
    signalDate: "",
    entryDate: "",
    exitDate: "",
    regimeOn: false,
    regimeCum10: 0,
    regimeDef: REGIME_DEF,
    protectionScale: 1.0,
    universeCount: 0,
    liquidCount: 0,
    bandCount: 0,
    candidates: [],
    selected: [],
    sizing,
    rejectReasons: [],
    heldSessions: [],
    shortenedHold: false,
    dryRun: opts?.dryRun === true,
  };

  const universe = await loadUniverse();
  base.universeCount = universe.length;
  if (!universe.length) return base;

  // Audit Oct-4 batch 3 (A1): fail-closed whitelist. An unreadable or tiny
  // halal file previously scanned blind ("no candidates" with no alarm).
  const halalStatus = getHalalStatus();
  const halalCheck = assertHalalSet({ count: halalStatus.count, error: halalStatus.error });
  base.halalPath = halalStatus.path;
  base.halalCount = halalStatus.count;
  if (!halalCheck.ok) {
    return {
      ...base,
      status: "bad_halal",
      statusLabelAr: `توقف صارم: قائمة الحلال غير صالحة (${halalCheck.reason}) — متوقع ${HALAL_EXPECTED_COUNT} — لا ترشيح`,
    };
  }

  // weekly candidates from candles (honest windows, signal = last completed
  // close). Signal session rule: if today's candle is not yet complete
  // (before 14:45 Cairo), the signal is the session BEFORE today; after the
  // close (or once the EOD sync landed), today's close is the signal.
  const candles = new Map<string, DailyCandle[]>();
  let maxDate = "";
  for (const sym of universe) {
    const g = await loadCandles(sym);
    if (g.length >= 26) {
      candles.set(sym, g);
      const li = lastCompletedIdx(g, now);
      if (g[li].date > maxDate) maxDate = g[li].date;
    }
  }
  if (!candles.size || !maxDate) return base;
  const signalDate = maxDate;
  base.signalDate = signalDate;

  // Staleness guard: signal must be at most 4 calendar days old (weekend ok).
  const ageDays = Math.floor((Date.now() - Date.parse(`${signalDate}T00:00:00Z`)) / 86_400_000);
  if (ageDays > 4) {
    return { ...base, status: "stale_data", statusLabelAr: `البيانات قديمة (${signalDate}) — حدّث daily_candles قبل الترشيح` };
  }

  // Audit Oct-4 (task 3): a signal date must be an official session.
  // Phantom Fri/Sat/holiday rows (e.g. the 3-Oct duplicates) can never
  // become a signal — hard stop with an alertable status.
  const signalCairoDay = cairoDayOfRow(signalDate);
  if (calendarStatus(signalCairoDay) === "unknown") {
    return {
      ...base,
      status: "unknown_calendar",
      statusLabelAr: `تقويم غير مؤكد: تاريخ الإشارة ${signalCairoDay} يحتاج تأكيد المستخدم (عطلة؟) — لا ترشيح حتى الحسم`,
    };
  }
  if (!isOfficialSessionDay(signalCairoDay)) {
    return {
      ...base,
      status: "bad_signal",
      statusLabelAr: `توقف صارم: تاريخ الإشارة ${signalCairoDay} ليس جلسة رسمية (عطلة/جمعة/سبت) — لا ترشيح`,
    };
  }
  // Audit Oct-4 (task 4): market-wide hole = hard stop, never "no candidates".
  {
    const presentDays = [...new Set([...candles.values()].flatMap((g) => g.map((r) => cairoDayOfRow(r.date))))];
    let atSignal = 0;
    for (const g of candles.values()) {
      const li = lastCompletedIdx(g, now);
      if (g[li] && g[li].date === signalDate) atSignal++;
    }
    const hole = checkMarketWide(presentDays, signalCairoDay, atSignal, universe.length);
    if (!hole.ok) {
      return {
        ...base,
        status: "market_hole",
        statusLabelAr: `توقف صارم: فجوة على مستوى السوق (${hole.reason}) — لا ترشيح`,
      };
    }
  }

  // Entry/exit dates: next session after signal, and the exit from the
  // official calendar (holidays skipped; shortened holds flagged).
  const nextDow = new Date(`${signalDate}T00:00:00Z`).getUTCDay();
  let entry = new Date(`${signalDate}T00:00:00Z`);
  do { entry.setUTCDate(entry.getUTCDate() + 1); } while (!MW_PARAMS.SESSION_DAYS.includes(entry.getUTCDay() as 0 | 1 | 2 | 3 | 4));
  const entryDate = entry.toISOString().slice(0, 10);
  const calExit = computeExitFromCalendar(cairoDayOfRow(entryDate));
  base.entryDate = entryDate;
  base.exitDate = calExit.exitDate;
  base.heldSessions = calExit.heldSessions;
  base.shortenedHold = calExit.shortenedHold;
  // Audit Oct-4 (task 8): the holding span crosses an unconfirmed day —
  // ask the user instead of assuming the week is tradable.
  if (holdingTouchesUnknown(cairoDayOfRow(entryDate), calExit.exitDate)) {
    return {
      ...base,
      status: "unknown_calendar",
      statusLabelAr: `تقويم غير مؤكد: فترة الحمل ${entryDate} ← ${calExit.exitDate} تعبر يوماً غير مؤكد — أكّد العطل قبل التداول`,
    };
  }

  // Candidates (honest windows: momentum/liquidity/high all END at the
  // signal session = the last completed close; nothing from the entry day).
  // Audit Oct-4 (task 3): agreed-rule gates live here — 6/6 momentum
  // sessions, >=18/20 liquidity sessions, NULL = reject — with a logged
  // reason per rejected symbol. The legacy checks below stay as
  // defense-in-depth.
  const cands: WeeklyCandidate[] = [];
  const rejectReasons: Array<{ symbol: string; reason: string }> = [];
  const signalDay = cairoDayOfRow(signalDate);
  const momSess = lastNOfficialSessions(signalDay, MW_PARAMS.MOM_LB + 1);
  const liqSess = lastNOfficialSessions(signalDay, MW_PARAMS.LIQ_WINDOW);
  for (const [sym, g] of candles) {
    if (MW_PARAMS.HALAL_ONLY && !isHalal(sym)) continue;
    const li = lastCompletedIdx(g, now);
    if (g[li].date !== signalDate) continue;
    const byDay = new Map(g.map((r) => [cairoDayOfRow(r.date), { close: r.close, volume: r.volume }]));
    const rule = screenSymbolCandidate(sym, byDay, momSess, liqSess);
    if (!rule.cand) {
      rejectReasons.push({ symbol: sym, reason: rule.reason });
      continue;
    }
    const n = li + 1;
    if (n < 26) continue;
    // Audit Oct-4 (task 7): momentum and liquidity come from the agreed-rule
    // screen (official-session windows), NOT from row offsets. The legacy
    // row-offset recomputation is deleted; near_high/down5/volR below still
    // use row windows (documented residual, out of task scope).
    const lastClose = rule.cand.last_close;
    const v20 = rule.cand.v20_money;
    const mom = rule.cand.mom5;
    const from = Math.max(0, li + 1 - MW_PARAMS.HIGH_WINDOW);
    let hh = 0;
    for (let j = from; j <= li; j++) if (g[j].close > hh) hh = g[j].close;
    const nearHigh = hh > 0 ? g[li].close / hh : 0;
    // calendar-gap guard: a >7-day hole inside the momentum window (missing
    // backfill) disqualifies the symbol — honesty over volume.
    let gapped = false;
    for (let j = Math.max(1, li - MW_PARAMS.MOM_LB); j <= li; j++) {
      const dd = (Date.parse(`${g[j].date}T00:00:00Z`) - Date.parse(`${g[j - 1].date}T00:00:00Z`)) / 86_400_000;
      if (dd > 7) { gapped = true; break; }
    }
    if (gapped) continue;
    // W4 filter inputs (all windows END at the signal session — no look-ahead)
    let down5 = 0;
    for (let j = li - 4; j <= li; j++) if (g[j].close < g[j - 1].close) down5++;
    let v10s = 0;
    for (let j = li - 9; j <= li; j++) v10s += g[j].volume;
    let v20s = 0;
    for (let j = li - 19; j <= li; j++) v20s += g[j].volume;
    const volR = v20s > 0 ? v10s / 10 / (v20s / 20) : 0;
    cands.push({
      symbol: sym,
      last_close: lastClose,
      mom5: mom,
      v20_money: v20,
      near_high: Math.round(nearHigh * 1000) / 1000,
      fresh_high: g[li].close >= hh && hh > 0,
      halal: isHalal(sym),
      down5,
      volR: Math.round(volR * 1000) / 1000,
      mom_sessions: `${rule.momPresent}/6`,
      liq_sessions: `${rule.liqPresent}/20`,
    });
  }
  base.liquidCount = cands.length;
  base.rejectReasons = rejectReasons;

  const liq = [...cands].sort((a, b) => b.v20_money - a.v20_money).slice(0, MW_PARAMS.LIQ_TOP);
  const inBand = liq
    .filter((c) => c.mom5 >= MW_PARAMS.MOM_MIN && c.mom5 <= MW_PARAMS.MOM_MAX)
    .sort((a, b) => b.mom5 - a.mom5);
  base.bandCount = inBand.length;
  // W4 gates: volume confirmation + smooth momentum (measured tail protection)
  const pool = MW_PARAMS.W4_FILTERS
    ? inBand.filter((c) => c.down5 <= 2 && c.volR >= 1.1)
    : inBand;

  // Regime: cumulative equal-weight universe weekly return over last 10 weeks
  // (audit Oct-4 task 6: CLOSE-to-close per REGIME_DEF, thin weeks skipped).
  const weekly = computeWeeklyBench(candles);
  const weeklyOO = computeWeeklyBenchOO(candles);
  const cum10 = cumProduct(weekly.slice(-MW_PARAMS.REGIME_WEEKS));
  const cum10oo = cumProduct(weeklyOO.slice(-MW_PARAMS.REGIME_WEEKS));
  base.regimeCum10 = cum10 - 1;
  base.regimeOn = cum10 > 1;
  base.regimeOO10 = cum10oo - 1;
  // Risk overlays (LIVE): vol-target on 8-week realized weekly vol + crash cut.
  // Measured (bt/halal_ideas_sweep.ps1 V7): MaxDD 30.2% vs 36.7% at ~flat return.
  let protectionScale = 1.0;
  const last8 = weekly.slice(-8);
  if (last8.length >= 8) {
    const mu = last8.reduce((a, r) => a + r, 0) / 8;
    const ss = last8.reduce((a, r) => a + (r - mu) * (r - mu), 0);
    const sd = Math.sqrt(ss / 7);
    if (sd > MW_PARAMS.VOL_TARGET) protectionScale = MW_PARAMS.VOL_TARGET / sd;
  }
  if (weekly.length >= 2 && weekly[weekly.length - 1] + weekly[weekly.length - 2] <= -MW_PARAMS.CRASH_CUT) {
    protectionScale *= 0.5;
  }
  base.protectionScale = protectionScale;
  if (!base.regimeOn) {
    return { ...base, status: "regime_off", statusLabelAr: "فلتر النظام: كاش هذا الأسبوع (تراكم 10 أسابيع سالب)" };
  }
  if (!pool.length) {
    return { ...base, status: "no_candidates", statusLabelAr: "لا مرشحين داخل نطاق الزخم هذا الأسبوع (كاش)" };
  }

  base.status = "ready";
  base.statusLabelAr = `جاهز: ${Math.min(sizing.top_n, pool.length)} مرشح (من ${inBand.length} داخل النطاق)`;
  base.candidates = pool;
  base.selected = pool.slice(0, sizing.top_n);
  return base;
}

function allDates(candles: Map<string, DailyCandle[]>): string[] {
  const s = new Set<string>();
  for (const g of candles.values()) for (const r of g) s.add(r.date);
  return [...s].sort();
}

/** Equal-weight weekly bench return series (audit Oct-4 task 6).
 * CLOSE-TO-CLOSE per REGIME_DEF: each week's return uses the week's first
 * and last OFFICIAL session closes, over symbols present in BOTH, and weeks
 * with fewer than REGIME_MIN_SYMBOLS qualifying symbols are SKIPPED (not
 * zero-filled). Days are Cairo-normalized first (Oct-4 date-hazard fix). */
export const REGIME_MIN_SYMBOLS = 100;

export function computeWeeklyBench(candles: Map<string, DailyCandle[]>): number[] {
  const byDay = new Map<string, Map<string, number>>();
  for (const [sym, g] of candles) {
    for (const r of g) {
      if (!(r.close > 0)) continue;
      const d = cairoDayOfRow(r.date);
      if (!byDay.has(d)) byDay.set(d, new Map());
      byDay.get(d)!.set(sym, r.close);
    }
  }
  const days = [...byDay.keys()].sort().filter((d) => isOfficialSessionDay(d));
  const weekStarts: string[] = [];
  for (let i = 0; i < days.length; i++) {
    const prev = i === 0 ? "" : days[i - 1];
    const prevDow = i === 0 ? 99 : new Date(`${prev}T00:00:00Z`).getUTCDay();
    const dow = new Date(`${days[i]}T00:00:00Z`).getUTCDay();
    if (i === 0 || dow < prevDow) weekStarts.push(days[i]);
  }
  const out: number[] = [];
  for (let k = 0; k < weekStarts.length - 1; k++) {
    const a = byDay.get(weekStarts[k])!;
    const b = byDay.get(weekStarts[k + 1])!;
    let sum = 0;
    let n = 0;
    for (const [sym, cb] of b) {
      const ca = a.get(sym);
      if (ca === undefined) continue;
      sum += cb / ca - 1;
      n++;
    }
    if (n >= REGIME_MIN_SYMBOLS) out.push(sum / n);
  }
  return out;
}

/** Open-to-open reference twin of computeWeeklyBench (audit Oct-4 task 6).
 * Same weeks, same minimum — reported alongside so any divergence between
 * the definitions is visible in the audit log. NOT the trigger. */
export function computeWeeklyBenchOO(candles: Map<string, DailyCandle[]>): number[] {
  const byDay = new Map<string, Map<string, number>>();
  for (const [sym, g] of candles) {
    for (const r of g) {
      const o = Number((r as any).open);
      if (!(o > 0)) continue;
      const d = cairoDayOfRow(r.date);
      if (!byDay.has(d)) byDay.set(d, new Map());
      byDay.get(d)!.set(sym, o);
    }
  }
  const days = [...byDay.keys()].sort().filter((d) => isOfficialSessionDay(d));
  const weekStarts: string[] = [];
  for (let i = 0; i < days.length; i++) {
    const prevDow = i === 0 ? 99 : new Date(`${days[i - 1]}T00:00:00Z`).getUTCDay();
    const dow = new Date(`${days[i]}T00:00:00Z`).getUTCDay();
    if (i === 0 || dow < prevDow) weekStarts.push(days[i]);
  }
  const out: number[] = [];
  for (let k = 0; k < weekStarts.length - 1; k++) {
    const a = byDay.get(weekStarts[k])!;
    const b = byDay.get(weekStarts[k + 1])!;
    let sum = 0;
    let n = 0;
    for (const [sym, ob] of b) {
      const oa = a.get(sym);
      if (oa === undefined) continue;
      sum += ob / oa - 1;
      n++;
    }
    if (n >= REGIME_MIN_SYMBOLS) out.push(sum / n);
  }
  return out;
}

export function cumProduct(rs: number[]): number {
  return rs.reduce((a, r) => a * (1 + r), 1);
}

/** Exit rule for one open weekly position — evaluated at any session's close
 * or pre-open. The ONLY exit is the next week's first-session open (no SL,
 * no TP — both measured net-negative). Liquidity confirmation uses the live
 * bid like the old engine (best-effort execution guidance). */
export function decideWeeklyExit(args: {
  sessionsHeld: number; // sessions since entry, entry day = 1
  isNextWeekFirstSession: boolean;
}): { action: "HOLD" } | { action: "SELL"; reason: "WEEKLY_TIME_EXIT" } {
  if (args.isNextWeekFirstSession && args.sessionsHeld >= MW_PARAMS.HOLD_SESSIONS) {
    return { action: "SELL", reason: "WEEKLY_TIME_EXIT" };
  }
  return { action: "HOLD" };
}

// ═══════════════════════════════════════════════════════════════════════
// COMPAT LAYER — same export surface as gap-fade-3d.server.ts so the page,
// the runner hook and the signals server switch engines by changing ONE
// import line. Old shapes outside, weekly semantics inside.
// ═══════════════════════════════════════════════════════════════════════

/** Legacy-shaped params. STOP_LOSS_PCT = 0: the weekly system has NO
 * stop-loss (measured net-negative on 10y — close-only SL made the worst
 * week worse: −24.6% vs −22.7%). HOLD_TRADING_DAYS = 5 (exit at next
 * week's first open). */
export const GAP_PARAMS = {
  TOTAL_CAPITAL: MW_PARAMS.TOTAL_CAPITAL,
  TOP_N: MW_PARAMS.TOP_N_DEFAULT,
  SLOT_CAPITAL: MW_PARAMS.TOTAL_CAPITAL / MW_PARAMS.TOP_N_DEFAULT,
  BID_DEPTH_MIN_FRACTION: 0,
  POSITION_DEPTH_CAP: 1,
  STOP_LOSS_PCT: 0,
  HOLD_TRADING_DAYS: MW_PARAMS.HOLD_SESSIONS,
  EOD_CHECK_MIN: 14 * 60 + 25,
  SESSION_OPEN_MIN: 10 * 60,
  SESSION_DAYS: [0, 1, 2, 3, 4] as readonly number[],
  EXTRA_HOLD_GRANTS: 0,
} as const;

export function cairoMinutesNow(): number {
  const n = cairoNow();
  return n.getHours() * 60 + n.getMinutes();
}

/** Session count Sun..Thu between two dates, inclusive of both ends. */
export function tradingDaysElapsed(entryDateISO: string, todayISO: string): number {
  const start = Date.parse(`${entryDateISO}T00:00:00Z`);
  const end = Date.parse(`${todayISO}T00:00:00Z`);
  let n = 0;
  for (let t = start; t <= end; t += 86_400_000) {
    const dow = new Date(t).getUTCDay() as 0 | 1 | 2 | 3 | 4;
    if (MW_PARAMS.SESSION_DAYS.includes(dow)) n++;
  }
  return n;
}

/** Live price + bid book state (identical to the legacy engine's reads). */
export async function liveSymbolState(
  symbol: string,
): Promise<{ price: number | null; bid: number | null; bidQty: number | null; bidValue: number; ts: string | null }> {
  const [{ data: tick }, { data: mw }, { data: candle }] = await Promise.all([
    supabaseAdmin
      .from("live_ticks")
      .select("price, ts")
      .eq("symbol", symbol)
      .order("ts", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("marketwatch_snapshots")
      .select("highest_bid, highest_bid_qty, last_price, captured_at")
      .eq("symbol", symbol)
      .order("captured_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Final fallback: latest daily close — kept fresh in-session by the
    // Supabase tv-bridge (every 5s) so open-position cards never read 0
    // when no live feed (extension/marketwatch) is connected.
    supabaseAdmin
      .from("daily_candles")
      .select("close, date")
      .eq("symbol", symbol)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const price = tick
    ? Number(tick.price)
    : mw
      ? Number(mw.last_price) || null
      : candle
        ? Number(candle.close) || null
        : null;
  const bid = mw ? Number(mw.highest_bid) || null : null;
  const bidQty = mw ? Number(mw.highest_bid_qty) || null : null;
  return {
    price,
    bid,
    bidQty,
    bidValue: (bid ?? 0) * (bidQty ?? 0),
    ts: tick ? String(tick.ts) : mw ? String(mw.captured_at) : candle ? String(candle.date) : null,
  };
}

/** Weekly exit decision — legacy signature/return shape. The ONLY exit is
 * the next week's first-session open (sessionsHeld >= 5). Liquidity
 * confirmation kept: sell AT the bid when depth absorbs the position. */
export function decideExit(args: {
  daysHeld: number;
  extraHoldGranted: boolean;
  price: number;
  bid: number;
  bidValue: number;
  positionValue: number;
  entryPrice: number;
  exitDue: "STOP_LOSS" | "TIME_EXIT" | null;
}):
  | { action: "HOLD" }
  | { action: "SELL"; reason: "TIME_EXIT" | "STOP_LOSS" | "SL_FORCED_LOW_LIQUIDITY" | "FORCED_EXIT_INSUFFICIENT_LIQUIDITY"; exit_price: number; bid_confirmed: boolean }
  | { action: "EXTEND_HOLD" } {
  void args.extraHoldGranted;
  void args.exitDue;
  if (args.daysHeld < MW_PARAMS.HOLD_SESSIONS) return { action: "HOLD" };
  if (args.bidValue >= args.positionValue && args.bid > 0) {
    return { action: "SELL", reason: "TIME_EXIT", exit_price: args.bid, bid_confirmed: true };
  }
  return { action: "SELL", reason: "TIME_EXIT", exit_price: args.price, bid_confirmed: false };
}

/** User capital (weekly key — separate from the legacy key). */
export async function getUserCapital(): Promise<number | null> {
  const { data } = await supabaseAdmin
    .from("strategy_settings")
    .select("numeric_value")
    .eq("key", USER_CAPITAL_SETTING_KEY)
    .maybeSingle();
  const v = data ? (data as { numeric_value?: number | string | null }).numeric_value : null;
  const n = v == null ? null : Number(v);
  return n != null && Number.isFinite(n) ? n : null;
}

export async function setUserCapital(capitalEgp: number): Promise<void> {
  const cap = Math.max(1, Math.round(capitalEgp));
  const { error } = await supabaseAdmin
    .from("strategy_settings")
    .upsert(
      { key: USER_CAPITAL_SETTING_KEY, numeric_value: cap, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
  if (error) throw new Error(`setUserCapital failed: ${error.message}`);
}

export async function getEffectiveSizing(): Promise<{
  total_capital: number;
  top_n: number;
  slot_capital: number;
}> {
  return computeSizing(await getUserCapital());
}

/** Today's first real observed price per symbol (marketwatch primary,
 * live_ticks fallback) — used for the LIVE entry price and the gap filter. */
async function loadTodayFirstPrices(
  todayISO: string,
): Promise<Map<string, { price: number; ts: string }>> {
  const first = new Map<string, { price: number; ts: string }>();
  let mwFrom = 0;
  let mwDone = false;
  while (!mwDone) {
    const { data: mw } = await supabaseAdmin
      .from("marketwatch_snapshots")
      .select("symbol, last_price, captured_at")
      .gte("captured_at", `${todayISO}T00:00:00Z`)
      .order("captured_at", { ascending: true })
      .range(mwFrom, mwFrom + 999);
    if (!mw?.length) break;
    for (const r of mw) {
      const sym = String(r.symbol).toUpperCase();
      const px = Number(r.last_price);
      if (px > 0 && !first.has(sym)) first.set(sym, { price: px, ts: String(r.captured_at) });
    }
    if (mw.length < 1000) mwDone = true;
    else mwFrom += 1000;
  }
  let from = 0;
  while (true) {
    const { data } = await supabaseAdmin
      .from("live_ticks")
      .select("symbol, price, ts")
      .gte("ts", `${todayISO}T00:00:00Z`)
      .order("ts", { ascending: true })
      .range(from, from + 999);
    if (!data?.length) break;
    for (const r of data) {
      const sym = String(r.symbol).toUpperCase();
      const px = Number(r.price);
      if (px > 0 && !first.has(sym)) first.set(sym, { price: px, ts: String(r.ts) });
    }
    if (data.length < 1000) break;
    from += 1000;
  }
  return first;
}

/** Legacy-shape candidate (page/runner compatibility) + weekly extras. */
export type Candidate = {
  symbol: string;
  entry_price: number; // LIVE first observed price today (execution price)
  entry_ts: string;
  prev_close: number; // signal-session close (yesterday at entry time)
  gap_pct: number; // LIVE open gap vs prev_close — the [-3%,+2%] rule
  bid_depth_value: number;
  position_value: number;
  shares: number;
  mom5: number; // weekly extras
  v20_money: number;
  near_high: number;
  fresh_high: boolean;
  last_close: number;
  down5?: number; // W4 filter inputs (transparency for the page)
  volR?: number;
  news_30h?: boolean;
  halal?: boolean;
};

export type StrategyStatus = {
  status:
    | "before_open"
    | "out_of_session"
    | "no_data"
    | "no_gap_downs"
    | "all_illiquid"
    | "trading"
    | "already_scanned"
    | "not_entry_day";
  statusLabelAr: string;
  cairoTime: string;
  scanDate: string;
  universeCount: number;
  candidates: Candidate[];
  selected: Candidate[];
  filteredOutIlliquid: Candidate[];
  sizing: { total_capital: number; top_n: number; slot_capital: number };
  // weekly extras
  regimeOn?: boolean;
  regimeCum10?: number;
  protectionScale?: number; // risk overlays: vol-target × crash-cut sizing scale
  signalDate?: string;
  exitDate?: string;
};

/**
 * Legacy-name scan (same signature as gap-fade-3d.scanDailyCandidates).
 * WEEKLY cadence: produces tradable candidates ONLY on the week's first
 * session (Sunday), from candles through the last completed close, with the
 * LIVE gap filter [-3%, +2%] applied against the actual first observed
 * price. Other days return not_entry_day (the system is weekly by design).
 */
export async function scanDailyCandidates(
  _dateISOOverride?: string,
  ignoreSession = false,
): Promise<StrategyStatus> {
  void _dateISOOverride; // canary override not supported by the weekly engine yet
  const now = cairoNow();
  const todayISO = cairoDateISO(now);
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const sizing = await getEffectiveSizing();
  const base: StrategyStatus = {
    status: "no_data",
    statusLabelAr: "لا توجد بيانات",
    cairoTime: hhmm,
    scanDate: todayISO,
    universeCount: 0,
    candidates: [],
    selected: [],
    filteredOutIlliquid: [],
    sizing,
  };

  if (!ignoreSession) {
    if (!isSessionDay(now)) return { ...base, status: "out_of_session", statusLabelAr: "السوق مغلق" };
    if (now.getDay() !== 0) {
      return { ...base, status: "not_entry_day", statusLabelAr: "نظام أسبوعي: الدخول يوم الأحد فقط (أول جلسة في الأسبوع)" };
    }
    if (cairoMinutesNow() < GAP_PARAMS.SESSION_OPEN_MIN)
      return { ...base, status: "before_open", statusLabelAr: "الجلسة لم تفتح بعد" };
  }

  const universe = await loadUniverse();
  base.universeCount = universe.length;
  if (!universe.length) return base;

  // weekly candidates from candles (honest windows, signal = last close).
  // Signal session rule: before 14:45 Cairo today's candle is incomplete —
  // the signal is the session BEFORE today; after the close (or once the
  // EOD sync landed today's candle), today's close is the signal.
  const candles = new Map<string, DailyCandle[]>();
  let maxDate = "";
  for (const sym of universe) {
    const g = await loadCandles(sym);
    if (g.length >= 26) {
      candles.set(sym, g);
      const li = lastCompletedIdx(g, now);
      if (g[li].date > maxDate) maxDate = g[li].date;
    }
  }
  if (!candles.size || !maxDate) return { ...base, status: "no_data", statusLabelAr: "لا توجد شموع يومية بعد — شغّل تحديث daily_candles" };

  const signalDate = maxDate;
  const cands: WeeklyCandidate[] = [];
  for (const [sym, g] of candles) {
    if (MW_PARAMS.HALAL_ONLY && !isHalal(sym)) continue;
    const li = lastCompletedIdx(g, now);
    if (g[li].date !== signalDate) continue;
    const n = li + 1;
    if (n < 26) continue;
    const lastClose = g[li].close;
    if (lastClose < MW_PARAMS.PRICE_MIN) continue;
    let money = 0;
    for (let j = n - MW_PARAMS.LIQ_WINDOW; j < n; j++) money += g[j].close * g[j].volume;
    const v20 = money / MW_PARAMS.LIQ_WINDOW;
    if (v20 < MW_PARAMS.LIQ_FLOOR_MONEY) continue;
    const mom = n > MW_PARAMS.MOM_LB + 1 ? g[li].close / g[li - MW_PARAMS.MOM_LB].close - 1 : -9;
    const from = Math.max(0, li + 1 - MW_PARAMS.HIGH_WINDOW);
    let hh = 0;
    for (let j = from; j <= li; j++) if (g[j].close > hh) hh = g[j].close;
    const nearHigh = hh > 0 ? g[li].close / hh : 0;
    // calendar-gap guard: a >7-day hole inside the momentum window (missing
    // backfill) disqualifies the symbol — honesty over volume.
    let gapped = false;
    for (let j = Math.max(1, li - MW_PARAMS.MOM_LB); j <= li; j++) {
      const dd = (Date.parse(`${g[j].date}T00:00:00Z`) - Date.parse(`${g[j - 1].date}T00:00:00Z`)) / 86_400_000;
      if (dd > 7) { gapped = true; break; }
    }
    if (gapped) continue;
    // W4 filter inputs (all windows END at the signal session — no look-ahead)
    let down5 = 0;
    for (let j = li - 4; j <= li; j++) if (g[j].close < g[j - 1].close) down5++;
    let v10s = 0;
    for (let j = li - 9; j <= li; j++) v10s += g[j].volume;
    let v20s = 0;
    for (let j = li - 19; j <= li; j++) v20s += g[j].volume;
    const volR = v20s > 0 ? v10s / 10 / (v20s / 20) : 0;
    cands.push({
      symbol: sym,
      last_close: lastClose,
      mom5: mom,
      v20_money: v20,
      near_high: Math.round(nearHigh * 1000) / 1000,
      fresh_high: g[li].close >= hh && hh > 0,
      halal: isHalal(sym),
      down5,
      volR: Math.round(volR * 1000) / 1000,
    });
  }
  const liq = [...cands].sort((a, b) => b.v20_money - a.v20_money).slice(0, MW_PARAMS.LIQ_TOP);
  const inBand = liq
    .filter((c) => c.mom5 >= MW_PARAMS.MOM_MIN && c.mom5 <= MW_PARAMS.MOM_MAX)
    .sort((a, b) => b.mom5 - a.mom5);
  // W4 gates: volume confirmation + smooth momentum (measured tail protection)
  const pool = MW_PARAMS.W4_FILTERS
    ? inBand.filter((c) => c.down5 <= 2 && c.volR >= 1.1)
    : inBand;

  const weekly = computeWeeklyBench(candles);
  const cum10 = cumProduct(weekly.slice(-MW_PARAMS.REGIME_WEEKS));
  base.regimeOn = cum10 > 1;
  base.regimeCum10 = cum10 - 1;
  base.signalDate = signalDate;
  // Risk overlays (LIVE): vol-target + crash-cut (see scanWeeklyCandidates)
  let protectionScale = 1.0;
  const last8 = weekly.slice(-8);
  if (last8.length >= 8) {
    const mu = last8.reduce((a, r) => a + r, 0) / 8;
    const ss = last8.reduce((a, r) => a + (r - mu) * (r - mu), 0);
    const sd = Math.sqrt(ss / 7);
    if (sd > MW_PARAMS.VOL_TARGET) protectionScale = MW_PARAMS.VOL_TARGET / sd;
  }
  if (weekly.length >= 2 && weekly[weekly.length - 1] + weekly[weekly.length - 2] <= -MW_PARAMS.CRASH_CUT) {
    protectionScale *= 0.5;
  }
  base.protectionScale = protectionScale;

  if (!base.regimeOn) {
    return {
      ...base,
      status: "no_gap_downs",
      statusLabelAr: `فلتر النظام: كاش هذا الأسبوع (تراكم 10 أسابيع ${(cum10 - 1 >= 0 ? "+" : "") + ((cum10 - 1) * 100).toFixed(1)}% ≤ 0)`,
    };
  }
  if (!pool.length) {
    return { ...base, status: "no_gap_downs", statusLabelAr: "لا مرشحين داخل نطاق الزخم (8%-45%) هذا الأسبوع — كاش" };
  }

  // LIVE entry price + gap filter [-3%, +2%] vs yesterday's close.
  // Entry-price priority: (1) extension first observed price, (2) the
  // scanner-synced session open in daily_candles (works without the
  // extension — the exchange records the open), (3) last_close fallback.
  const firstPrices = await loadTodayFirstPrices(todayISO);
  const mapped: Candidate[] = [];
  const gapFiltered: Candidate[] = [];
  for (const c of pool) {
    const fp = firstPrices.get(c.symbol);
    const gAll = candles.get(c.symbol)!;
    const todayCandle = gAll.find((r) => r.date === todayISO);
    let entryPrice = fp ? fp.price : 0;
    if (!(entryPrice > 0) && todayCandle && todayCandle.open > 0) entryPrice = todayCandle.open;
    if (!(entryPrice > 0)) entryPrice = c.last_close;
    const gapPct = c.last_close > 0 ? entryPrice / c.last_close - 1 : 0;
    const posValue = Math.round(sizing.slot_capital * (base.protectionScale ?? 1));
    const cand: Candidate = {
      symbol: c.symbol,
      entry_price: entryPrice,
      entry_ts: fp?.ts ?? `${todayISO}T08:00:00Z`,
      prev_close: c.last_close,
      gap_pct: gapPct,
      bid_depth_value: c.v20_money,
      position_value: posValue,
      shares: entryPrice > 0 ? Math.floor(posValue / entryPrice) : 0,
      mom5: c.mom5,
      v20_money: c.v20_money,
      near_high: c.near_high,
      fresh_high: c.fresh_high,
      halal: isHalal(c.symbol),
      last_close: c.last_close,
      down5: c.down5,
      volR: c.volR,
    };
    if (gapPct < MW_PARAMS.GAP_MIN || gapPct > MW_PARAMS.GAP_MAX) gapFiltered.push(cand);
    else mapped.push(cand);
  }

  const selected = mapped.slice(0, sizing.top_n);
  if (!selected.length) {
    return {
      ...base,
      status: "all_illiquid",
      statusLabelAr: "كل المرشحين استُبعدوا بقاعدة الفجوة (-3% إلى +2%) — لا مطاردة افتتاحات",
      filteredOutIlliquid: gapFiltered,
    };
  }
  base.status = "trading";
  base.statusLabelAr = `مرشحون: ${selected.length} (من ${inBand.length} داخل نطاق الزخم) — دخول الأحد، خروج افتتاح الأسبوع القادم`;
  base.candidates = mapped;
  base.selected = selected;
  base.filteredOutIlliquid = gapFiltered;
  return base;
}

