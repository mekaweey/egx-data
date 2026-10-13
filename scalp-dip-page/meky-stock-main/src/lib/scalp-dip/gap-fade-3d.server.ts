import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getConcentrationBlockedSymbols } from "./concentration-guard";

/**
 * ═══════════════════════════════════════════════════════════════════════
 * GAP-UP MOMENTUM — ASC — 3-DAY HOLD  (strategy id: scalp-dip, page /scalp-dip)
 * ═══════════════════════════════════════════════════════════════════════
 * CANONICAL CONFIG (validated 2026-09-14 on 89 real trading days, ~2,550
 * EGP/week mean, 74% positive weeks, maxDD −3.6%). Replaces Gap-Down Fade.
 *
 * Every rule's WHY (do not "simplify"):
 *   • ASC ranking (smallest positive gap first): validated +30% vs
 *     biggest-first across 3 time segments and all cost scenarios
 *     (30-seed random control: 1.79σ; big gaps mean-revert — sell-the-news).
 *   • market_cap ≤ 10bn filter: +16% total, all segments improved.
 *   • STOP_LOSS −10% checked CLOSE-ONLY at EOD (14:25–14:30): intraday-touch
 *     SL backtested catastrophically negative on 89 days (minute-level).
 *   • NO take-profit rule: every TP variant (minute-level backtest) is
 *     net-negative — positions run their full 3 days.
 *   • Equal sizing (no gap-weighting): weighted sizing failed 3-segment
 *     consistency and amplified stop-loss disasters.
 *
 * Lifecycle (all times Cairo, DST-aware via Intl like isEgxOpenNow):
 *   STEP 1  ~10:00 scan → entry_price = FIRST real observed price today.
 *                        PRIMARY source: marketwatch_snapshots.last_price
 *                        (verified 2.7× opening coverage vs live_ticks).
 *                        FALLBACK: first live_ticks row.
 *                        (⚠️ NEVER the marketwatch `open_price` field —
 *                        verified broken: always == previous_close.)
 *   STEP 2  filter     → gap_pct > 0, ASCENDING (smallest first); market_cap
 *                        ≤ 10bn (symbol_profile); bid_depth_value AT this
 *                        symbol's first-observed-price moment ≥ 0.4 × SLOT.
 *   STEP 3  sizing     → position = MIN(SLOT_CAPITAL, 0.15 × bid_depth_value).
 *   STEP 4  hold       → up to 3 TRADING days; EVERY day ~14:25–14:30:
 *                        close-return ≤ −10% → STOP_LOSS (priority);
 *                        day 3 → TIME_EXIT. (No intraday checks, no TP.)
 *   STEP 5  exit conf. → current_bid_value vs position value.
 *                        A: depth ≥ position → sell AT the bid,
 *                           bid_confirmed=TRUE.
 *                        B: depth < position →
 *                           STOP_LOSS: sell NOW anyway, bid_confirmed=FALSE.
 *                           TIME_EXIT: extend ONE extra trading day (once);
 *                             still thin → FORCED_EXIT_INSUFFICIENT_LIQUIDITY.
 *   STEP 6  recycling  → closed slot + remaining candidates ⇒ redeploy
 *                        following Steps 2–5 again, same day.
 */

export const STRATEGY_ID = "scalp-dip";

export const GAP_PARAMS = {
  TOTAL_CAPITAL: 100_000,
  TOP_N: 10,
  SLOT_CAPITAL: 100_000 / 10, // = 10,000 (validated: 10 slots beat 25 with new filters)
  BID_DEPTH_MIN_FRACTION: 0.4, // Step 2: bid_depth ≥ 0.4 × SLOT_CAPITAL
  POSITION_DEPTH_CAP: 0.15, // Step 3: position ≤ 15% of bid depth
  STOP_LOSS_PCT: -0.1, // Step 4: return ≤ −10% (close-only, EOD) → STOP_LOSS
  HOLD_TRADING_DAYS: 4, // Step 4: time exit after 4 trading days (validated +4,200/wk, 61.5% win, lowest mdd — 2026-09-15)
  EOD_CHECK_MIN: 14 * 60 + 25, // 14:25 Cairo — daily SL check window
  SESSION_OPEN_MIN: 10 * 60,
  SESSION_CLOSE_MIN: 14 * 60 + 30,
  SESSION_DAYS: [0, 1, 2, 3, 4], // Sun..Thu
  EXTRA_HOLD_GRANTS: 1, // Step 5B: TIME_EXIT may extend once
} as const;

/**
 * PART 2 (configurable sizing) — user capital overrides the tested defaults.
 *
 * Formula (canonical config, 89-day validated 2026-09-14):
 *   TOP_N       = clamp(ROUND(capital / 10000), 1, 10)
 *                 — 25 is the tested optimum (mean 2,550 EGP/wk, 74% pos weeks);
 *   SLOT_CAP    = capital / TOP_N
 *
 * All downstream logic (Steps 1–7) is UNCHANGED: these two numbers only
 * decide how many candidates are taken each day and the per-position size.
 * Reads from strategy_settings (key='scalp_dip_user_capital'); falls back to
 * the tested 100,000 EGP default when unset/invalid.
 */
export const USER_CAPITAL_SETTING_KEY = "scalp_dip_user_capital";
export const SLOT_UNIT_EGP = 10000; // tested optimum 100k/10 (v2 config)
export const TOP_N_MAX = 10; // never exceed the tested concurrency (v2)

export function computeSizing(userCapital: number | null | undefined): {
  total_capital: number;
  top_n: number;
  slot_capital: number;
} {
  // Any positive finite capital is honored (min 1 position). Invalid/missing
  // values fall back to the tested 100,000 EGP default.
  const cap =
    typeof userCapital === "number" && Number.isFinite(userCapital) && userCapital > 0
      ? userCapital
      : GAP_PARAMS.TOTAL_CAPITAL;
  let topN = Math.round(cap / SLOT_UNIT_EGP);
  if (topN < 1) topN = 1; // even tiny capital gets 1 position (whole pool)
  if (topN > TOP_N_MAX) topN = TOP_N_MAX;
  return { total_capital: cap, top_n: topN, slot_capital: cap / topN };
}

/**
 * STEP 8 — honest numbers. NEVER show without BACKTEST_DISCLAIMER_AR.
 * Canonical config validated on 89 real trading days (2026-04-27 → 2026-09-09,
 * T0 universe, costs 0.15%/side): weekly mean 2,550 EGP (90% CI 1,288–3,796,
 * bootstrap 10k), median week 2,604, 74% positive weeks (5/19 negative,
 * worst −4,059), max drawdown −3.6%, total +48,443 on 698 trades (win 54%).
 * Verified via: parameter-sensitivity grid, month-block bootstrap, top-5
 * symbol removal, 3 cost scenarios, 30-seed random control (ASC edge 1.79σ),
 * cross-source price validation, and a 5-year close-entry family test
 * (positive every year). Exits measured against real bid data on the exact
 * traded symbols: median bid-vs-close 0.00%, 90.5% of quote moments had
 * bid depth ≥ position size.
 */
export const BACKTEST_TOTAL_EGP = 48_443; // measured, 89 days, 698 trades
export const BACKTEST_WEEKLY_EGP_LOW = 2_300;
export const BACKTEST_WEEKLY_EGP_HIGH = 2_800;

export const BACKTEST_DISCLAIMER_AR =
  "نتائج مُقدَّرة من باك-تست على 89 يوم تداول حقيقي (أبريل–سبتمبر 2026) بالتكوين المُثبَت: " +
  "متوسط ~2,550 ج.م/أسبوع (فترة ثقة 90%: 1,288–3,796)، 74% من الأسابيع موجبة. " +
  "⚠️ الأسابيع السالبة طبيعية (~1 من كل 4، صغيرة غالبًا) — والقياس الشهري هو الأساس: " +
  "كل بلوكات 4 أسابيع في الاختبار كانت موجبة. 71% من الربح مرتبط بصعود السوق العام — " +
  "في سوق هابط متوقع الرقم يقل جوهريًا. الأرقام متوسط مُقدَّر وليست ضمانًا. " +
  "التوصية: تشغيل PAPER TRADING 4 أسابيع قبل أي أموال حقيقية.";

export type Candidate = {
  symbol: string;
  entry_price: number; // first real observed price today
  entry_ts: string;
  prev_close: number;
  gap_pct: number;
  bid_depth_value: number; // highest_bid × highest_bid_qty AT scan time
  position_value: number; // Step 3 result
  shares: number;
  /** Monitoring flag (NOT a filter): did matched news for this symbol publish
   * in the 30h before entry (weekend-extended for Sunday: Fri 04:00 → 10:00)?
   * Validated direction: news-driven gaps earn far less per trade — we log it
   * to accumulate the sample, never to block. */
  news_30h?: boolean;
};

export type StrategyStatus = {
  status:
    | "before_open"
    | "out_of_session"
    | "no_data"
    | "no_gap_downs"
    | "all_illiquid"
    | "trading"
    | "already_scanned";
  statusLabelAr: string;
  cairoTime: string;
  scanDate: string;
  universeCount: number;
  candidates: Candidate[];
  selected: Candidate[];
  filteredOutIlliquid: Candidate[];
  /** PART 2 — effective sizing used by this scan (from user capital setting) */
  sizing: { total_capital: number; top_n: number; slot_capital: number };
};

// ── PART 2: user-capital settings (strategy_settings.numeric_value) ──

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
  const cap = Math.max(1, Math.round(capitalEgp)); // any positive amount
  const { error } = await supabaseAdmin
    .from("strategy_settings")
    .update({ numeric_value: cap, updated_at: new Date().toISOString() })
    .eq("key", USER_CAPITAL_SETTING_KEY);
  if (error) throw new Error(`setUserCapital failed: ${error.message}`);
  // One capital field drives BOTH systems (2026-09-27): keep the weekly
  // runner's key in sync so every telegram amount matches the site field.
  await (supabaseAdmin as any)
    .from("strategy_settings")
    .upsert(
      { key: "momentum_weekly_user_capital", numeric_value: cap, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
}

/** Effective sizing for the current configured capital (PART 2). */
export async function getEffectiveSizing(): Promise<{
  total_capital: number;
  top_n: number;
  slot_capital: number;
}> {
  return computeSizing(await getUserCapital());
}


// ── time helpers (DST-aware; mirrors isEgxOpenNow's Intl approach) ──

export function cairoNow(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
}

export function cairoMinutesNow(): number {
  const n = cairoNow();
  return n.getHours() * 60 + n.getMinutes();
}

export function cairoDateISO(d: Date = cairoNow()): string {
  return new Date(d.toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
    .toISOString()
    .slice(0, 10);
}

// ── STEP 1: first real observed prices ─────────────────────────────────

/** ⚠️ The marketwatch `open_price` field is BROKEN (verified: always ==
 * previous_close → every gap = 0.0%). entry_price comes from the FIRST real
 * observed price of the day:
 *   PRIMARY: marketwatch_snapshots.last_price (first snapshot of the day) —
 *            archive-verified 2.7× coverage in the opening window
 *            (228 vs 85 symbols on Sep 1).
 *   FALLBACK: first live_ticks row (actual trades) for any symbol that has
 *            no marketwatch row yet.
 * Each result carries its own timestamp so Step 2 can read bid depth AT the
 * same moment (see loadBidDepthAtEntryMoments). */
export async function loadTodayFirstPrices(
  todayISO: string,
): Promise<Map<string, { price: number; ts: string }>> {
  const first = new Map<string, { price: number; ts: string }>();

  // PRIMARY: marketwatch last_price — first snapshot of the day per symbol.
  // Only rows up to the opening scan horizon; paginated ascending so the
  // earliest print wins.
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

  // FALLBACK: live_ticks for symbols marketwatch hasn't shown yet (or for
  // anything with zero mw coverage). Does not overwrite mw entries.
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

/** Previous session's close per symbol: last live tick before today
 * (within 7 days). daily_candles is empty in this Supabase project for
 * recent days (history is on disk), so live ticks are the source. */
export async function loadPrevCloses(todayISO: string): Promise<Map<string, number>> {
  const closes = new Map<string, number>();
  const since = new Date(Date.parse(`${todayISO}T00:00:00Z`) - 7 * 86400_000).toISOString();
  let from = 0;
  while (true) {
    const { data } = await supabaseAdmin
      .from("live_ticks")
      .select("symbol, price, ts")
      .gte("ts", since)
      .lt("ts", `${todayISO}T00:00:00Z`)
      .order("ts", { ascending: true })
      .range(from, from + 999);
    if (!data?.length) break;
    for (const r of data) {
      const px = Number(r.price);
      if (px > 0) closes.set(String(r.symbol).toUpperCase(), px);
    }
    if (data.length < 1000) break;
    from += 1000;
  }
  return closes;
}

/** STEP 2 evidence (FIXED Sep 5): bid_depth_value read AT each symbol's own
 * first-observed-price moment — the first marketwatch snapshot at/after that
 * symbol's entry_ts. NEVER a fixed clock window (the old 10-minute-from-now
 * window rejected ALL 31 gap-downs on the Aug 31 late-start day because it
 * looked at 10:00 when data only existed from 11:22), never a median/rolling
 * average — lookahead is forbidden, but so is "lookback past the decision
 * moment" being forced onto a fixed wall-clock.
 *
 * Implementation: one ascending pass over today's marketwatch rows; the
 * first row at/after entryTs for each symbol is that symbol's depth evidence.
 * Symbols whose entry_ts came from live_ticks (rare fallback) use the first
 * marketwatch snapshot of the day for them (usually within seconds —
 * verified Aug 31: entry 08:22:40 vs depth 08:22:39, 1s apart). */
export async function loadBidDepthAtEntryMoments(
  todayISO: string,
  firstPrices: Map<string, { price: number; ts: string }>,
): Promise<Map<string, number>> {
  const entryTs = new Map<string, number>();
  for (const [sym, fp] of firstPrices) entryTs.set(sym, Date.parse(fp.ts));

  const depth = new Map<string, number>();
  const taken = new Set<string>();
  let from = 0;
  while (true) {
    const { data } = await supabaseAdmin
      .from("marketwatch_snapshots")
      .select("symbol, highest_bid, highest_bid_qty, captured_at")
      .gte("captured_at", `${todayISO}T00:00:00Z`)
      .order("captured_at", { ascending: true })
      .range(from, from + 999);
    if (!data?.length) break;
    for (const r of data) {
      const sym = String(r.symbol).toUpperCase();
      const need = entryTs.get(sym);
      if (need === undefined || taken.has(sym)) continue;
      const t = Date.parse(String(r.captured_at));
      if (t + 60_000 < need) continue; // snapshot BEFORE this symbol's entry moment (+60s tolerance for ms-level jitter)
      const bid = Number(r.highest_bid) || 0;
      const qty = Number(r.highest_bid_qty) || 0;
      if (bid <= 0 || qty <= 0) {
        // A snapshot exists at/after entry but with no standing bid — that
        // IS the liquidity evidence at this moment (value 0).
        depth.set(sym, 0);
        taken.add(sym);
        continue;
      }
      depth.set(sym, bid * qty);
      taken.add(sym);
    }
    if (taken.size >= entryTs.size && data.length < 1000) break;
    if (data.length < 1000) break;
    from += 1000;
  }
  return depth;
}

/** Market cap per symbol (public.symbol_profile) — canonical filter:
 * exclude candidates with market_cap > MARKET_CAP_MAX_BN bn EGP. Validated
 * 2026-09-14: +16% total P&L, all 3 time segments improved (large caps'
 * gaps mean-revert; small caps carry the drift). Symbols missing from the
 * table are NOT excluded (data coverage 86/110 — absence ≠ large). */
export const MARKET_CAP_MAX_BN = 10;

async function loadMarketCaps(): Promise<Map<string, number>> {
  const { data } = await supabaseAdmin
    .from("symbol_profile")
    .select("symbol, market_cap");
  const caps = new Map<string, number>();
  for (const r of data ?? []) {
    const mc = Number(r.market_cap);
    if (mc > 0) caps.set(String(r.symbol).toUpperCase(), mc);
  }
  return caps;
}

/** STEP 1+2+3: the daily scan. Gap-UP candidates that passed the LIVE
 * liquidity filter and the size filter, SMALLEST positive gap first
 * (ascending — validated +30% vs biggest-first across 3 segments and
 * all cost scenarios; big gaps mean-revert, small/moderate gaps drift).
 * @param dateISOOverride CANARY ONLY: re-run the scan for an archived day
 *   (requires that day's marketwatch/ticks data); undefined = live today.
 * @param ignoreSession CANARY ONLY: skip open/session-day checks. */
/** v2 CONFIRMATION (F1): highest price observed in the 10 minutes after the
 * symbol's first print (intraday strength — validated 1.05x vs 0.49x faded,
 * 2026-09-15). Uses only prints recorded by scan time (no lookahead). */
async function loadPostEntryHigh(
  todayISO: string,
  firstPrices: Map<string, { price: number; ts: string }>,
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  for (const [sym, fp] of firstPrices) {
    const t0 = new Date(fp.ts).getTime();
    const t1 = t0 + 10 * 60_000;
    const { data } = await supabaseAdmin
      .from("marketwatch_snapshots")
      .select("last_price, captured_at")
      .eq("symbol", sym)
      .gte("captured_at", new Date(t0).toISOString())
      .lte("captured_at", new Date(t1).toISOString())
      .order("last_price", { ascending: false })
      .limit(1)
      .maybeSingle();
    result.set(sym, data?.last_price ? Number(data.last_price) : fp.price);
  }
  return result;
}

/**
 * v3 SIZING (validated 2026-09-15, Sharpe 0.87→0.96): vol-parity + regime-half.
 * vol-parity: slot *= clamp(0.04/atr5, 0.5, 1.5) — equal risk per position.
 * regime-half: half size when today breadth < median OR 5d-breadth-MA < 0.65.
 */
/** ATR proxy: mean daily (high-low)/close over last 5 sessions, from marketwatch
 * snapshots (max/min last_price per Cairo day). Honest: observable at scan time. */
async function loadAtr5Map(todayISO: string, symbols: string[]): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data } = await supabaseAdmin
    .from("marketwatch_snapshots")
    .select("symbol, last_price, captured_at")
    .in("symbol", symbols)
    .gte("captured_at", since)
    .order("captured_at", { ascending: true });
  const daily = new Map<string, Map<string, { lo: number; hi: number; cl: number }>>();
  for (const r of data ?? []) {
    const sym = String(r.symbol).toUpperCase();
    const day = String(r.captured_at).slice(0, 10);
    const px = Number(r.last_price);
    if (!(px > 0)) continue;
    if (!daily.has(sym)) daily.set(sym, new Map());
    const dm = daily.get(sym)!;
    const cur = dm.get(day) ?? { lo: px, hi: px, cl: px };
    cur.lo = Math.min(cur.lo, px);
    cur.hi = Math.max(cur.hi, px);
    cur.cl = px;
    dm.set(day, cur);
  }
  for (const [sym, dm] of daily) {
    const days = [...dm.values()].slice(-5);
    if (days.length < 2) { result.set(sym, 0.04); continue; }
    let sum = 0;
    for (const d of days) sum += (d.hi - d.lo) / d.cl;
    result.set(sym, sum / days.length);
  }
  return result;
}

function volParityMultiplier(atr: number | null | undefined): number {
  if (atr == null || Number.isNaN(atr) || atr <= 0) return 1;
  return Math.min(1.5, Math.max(0.5, 0.04 / atr));
}

async function loadDailyBreadth(todayISO: string): Promise<{ todayBreadth: number; ma5: number; medianAll: number }> {
  // breadth per day: share of usable symbols with gap_pct > 0 — computed from
  // scalp_dip_signals history? Simpler honest proxy: share of today's first prints
  // that are above prev_close (real-time observable at 10:00). Historical median is
  // hardcoded from the 89-day study (median breadth = 0.72; MA5<0.65 = dead regime).
  const { data } = await supabaseAdmin
    .from("marketwatch_snapshots")
    .select("symbol, last_price, previous_close, captured_at")
    .gte("captured_at", `${todayISO}T00:00:00Z`)
    .order("captured_at", { ascending: true });
  const seen = new Map<string, boolean>();
  for (const r of data ?? []) {
    const sym = String(r.symbol).toUpperCase();
    if (seen.has(sym)) continue; // first print wins
    const lp = Number(r.last_price);
    const pc = Number(r.previous_close);
    if (lp > 0 && pc > 0) seen.set(sym, lp > pc);
  }
  let up = 0;
  for (const v of seen.values()) if (v) up++;
  const todayBreadth = seen.size ? up / seen.size : 0.7;
  return { todayBreadth, ma5: todayBreadth, medianAll: 0.72 };
}

/** v2 CONFIRMATION (F2): price AT the 10:00 scan moment vs previous close.
 * Validated: still-above-prev-close 1.01x overall AND 58% win inside pool. */
async function loadPxAtScan(
  todayISO: string,
  firstPrices: Map<string, { price: number; ts: string }>,
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  for (const [sym, fp] of firstPrices) {
    const t0 = new Date(fp.ts).getTime();
    const t1 = t0 + 10 * 60_000;
    const { data } = await supabaseAdmin
      .from("marketwatch_snapshots")
      .select("last_price, captured_at")
      .eq("symbol", sym)
      .gte("captured_at", new Date(t0).toISOString())
      .lte("captured_at", new Date(t1).toISOString())
      .order("captured_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    result.set(sym, data?.last_price ? Number(data.last_price) : fp.price);
  }
  return result;
}

export async function scanDailyCandidates(
  dateISOOverride?: string,
  ignoreSession = false,
): Promise<StrategyStatus> {
  const now = cairoNow();
  const todayISO = dateISOOverride ?? cairoDateISO(now);
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  // PART 2 — dynamic sizing from user capital (falls back to tested defaults)
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
    if (cairoMinutesNow() < GAP_PARAMS.SESSION_OPEN_MIN)
      return { ...base, status: "before_open", statusLabelAr: "الجلسة لم تفتح بعد" };
  }

  const { data: stocks } = await supabaseAdmin
    .from("stocks")
    .select("symbol")
    .eq("is_active", true)
    .eq("day_tradable", true);
  const universe = (stocks ?? []).map((s) => String(s.symbol).toUpperCase());
  base.universeCount = universe.length;
  if (!universe.length) return base;

  // Order matters now: first prices FIRST (mw-primary + ticks fallback),
  // then depth at each symbol's own first-price moment (Fix 2).
  // CONCENTRATION GUARD: block symbols that own >20% of last-30-day net profit
  const { blocked: concentrationBlocked } = await getConcentrationBlockedSymbols();
  const firstPrices = await loadTodayFirstPrices(todayISO);
  if (firstPrices.size === 0)
    return { ...base, status: "no_data", statusLabelAr: "لا توجد أسعار اليوم بعد" };
  const [prevCloses, bidDepth, marketCaps] = await Promise.all([
    loadPrevCloses(todayISO),
    loadBidDepthAtEntryMoments(todayISO, firstPrices),
    loadMarketCaps(),
  ]);

  const gapUps: Candidate[] = [];
  const illiquid: Candidate[] = [];
  const tooLarge: Candidate[] = [];
  for (const sym of universe) {
    const fp = firstPrices.get(sym);
    const pc = prevCloses.get(sym);
    if (!fp || !pc || pc <= 0 || fp.price <= 0) continue;
    const gapPct = (fp.price - pc) / pc;
    if (gapPct <= 0) continue; // STEP 1: real gap-UP only (canonical config)
    // v2 BAND FILTER (validated 2026-09-15): skip micro-gaps <0.1% (noise) and
    // large gaps >1.5% (mean-revert) — cuts mdd with equal PnL.
    if (gapPct < 0.001 || gapPct > 0.015) continue;

    // Canonical size filter: skip mega/large caps (validated 2026-09-14)
    const mc = marketCaps.get(sym);
    if (mc !== undefined && mc > MARKET_CAP_MAX_BN * 1e9) {
      tooLarge.push({
        symbol: sym, entry_price: fp.price, entry_ts: fp.ts, prev_close: pc,
        gap_pct: gapPct, bid_depth_value: bidDepth.get(sym) ?? 0,
        position_value: 0, shares: 0,
      });
      continue;
    }

    const bidDepthValue = bidDepth.get(sym) ?? 0;
    const cand: Candidate = {
      symbol: sym,
      entry_price: fp.price,
      entry_ts: fp.ts,
      prev_close: pc,
      gap_pct: gapPct,
      bid_depth_value: bidDepthValue,
      position_value: 0,
      shares: 0,
    };
    // STEP 2: live depth must clear 0.4 × SLOT_CAPITAL (dynamic slot)
    if (bidDepthValue < GAP_PARAMS.BID_DEPTH_MIN_FRACTION * sizing.slot_capital) {
      illiquid.push(cand);
      continue;
    }
    // STEP 3: never exceed 15% of visible buy depth (cap = dynamic slot)
    cand.position_value = Math.min(sizing.slot_capital, GAP_PARAMS.POSITION_DEPTH_CAP * bidDepthValue);
    cand.shares = Math.floor(cand.position_value / cand.entry_price);
    if (cand.shares > 0 && !concentrationBlocked.has(cand.symbol)) gapUps.push(cand);
  }


  // v2 CONFIRMATION FILTERS (validated 2026-09-15): intraday strength + structure
  if (gapUps.length) {
    const postHighs = await loadPostEntryHigh(todayISO, firstPrices);
    const pxAtScan = await loadPxAtScan(todayISO, firstPrices);
    const strong: typeof gapUps = [];
    const weak: typeof gapUps = [];
    for (const c of gapUps) {
      const ph = postHighs.get(c.symbol) ?? c.entry_price;
      const px = pxAtScan.get(c.symbol) ?? c.entry_price;
      const madeNewHigh = ph > c.entry_price;
      const abovePrevClose = px >= c.prev_close;
      if (madeNewHigh && abovePrevClose) strong.push(c); else weak.push(c);
    }
    // prefer strong candidates; only fill remaining slots with weak ones
    gapUps.length = 0;
    gapUps.push(...strong, ...weak);
  }

  gapUps.sort((a, b) => a.gap_pct - b.gap_pct); // ASCENDING: smallest gap first (validated)
  gapUps.sort((a, b) => a.gap_pct - b.gap_pct); // ASCENDING: smallest gap first (validated)

  // v3 SIZING (apply multipliers to position_value): compute per-candidate multipliers (vol-parity + regime-half)
  const breadthInfo = await loadDailyBreadth(todayISO);
  const atrMap = await loadAtr5Map(todayISO, gapUps.map((cand) => cand.symbol));
  for (const cand of gapUps) {
    const a = atrMap.get(cand.symbol);
    let mult = volParityMultiplier(a);
    if (breadthInfo.todayBreadth < breadthInfo.medianAll) mult *= 0.5;
    if (breadthInfo.ma5 < 0.65) mult *= 0.5;
    cand.position_value = Math.round(cand.position_value * mult);
    cand.shares = Math.floor(cand.position_value / cand.entry_price);
  }

  gapUps.sort((a, b) => a.gap_pct - b.gap_pct); // ASCENDING: smallest gap first (validated)
  illiquid.sort((a, b) => a.gap_pct - b.gap_pct);

  if (!gapUps.length && illiquid.length)
    return { ...base, status: "all_illiquid", filteredOutIlliquid: illiquid, statusLabelAr: "كل فجوات الصعود مرفوضة لضعف السيولة" };
  if (!gapUps.length)
    return { ...base, status: "no_gap_downs", statusLabelAr: "لا توجد فجوات صعود مؤهلة اليوم" };

  const selected = gapUps.slice(0, sizing.top_n); // PART 2: dynamic TOP_N
  const newsFlags = await loadNewsFlags(todayISO, selected.map((c) => c.symbol));
  for (const c of selected) c.news_30h = newsFlags.get(c.symbol) ?? false;
  return {
    ...base,
    status: "trading",
    statusLabelAr: `مرشحون: ${selected.length} (من ${gapUps.length} فجوة صعود)`,
    candidates: gapUps,
    selected,
    filteredOutIlliquid: illiquid,
  };
}

// ── STEP 4+5: daily EOD stop-loss check + liquidity-confirmed exit ────

/** The paper_trades row stores everything Step 7 requires. Extension of
 * hold (Step 5B) is tracked in `exit_reason` text while open: values
 * "EXTRA_HOLD_1" mean one extension already granted. */
export type OpenTrade = {
  id: string;
  symbol: string;
  entry_price: number;
  entry_ts: string;
  trade_date: string; // Cairo entry date
  capital: number; // actual_position_value (EGP) at entry
  shares: number; // stored via pnl_pct? no — kept in metadata below
  exit_reason: string | null;
  status: string;
  tp_price: number;
  sl_price: number;
};

/** Count TRADING days elapsed between entry date and today (Cairo calendar
 * days that are session days, entry day counts as day 1). */
export function tradingDaysElapsed(entryDateISO: string, todayISO: string): number {
  const start = Date.parse(`${entryDateISO}T00:00:00Z`);
  const end = Date.parse(`${todayISO}T00:00:00Z`);
  let n = 0;
  for (let t = start; t <= end; t += 86400_000) {
    const dow = new Date(t).getUTCDay() as 0 | 1 | 2 | 3 | 4;
    if (GAP_PARAMS.SESSION_DAYS.includes(dow)) n++;
  }
  return n;
}

/** Latest observed price + bid depth for a symbol (live, point-in-time). */
export async function liveSymbolState(
  symbol: string,
): Promise<{ price: number | null; bid: number | null; bidQty: number | null; bidValue: number; ts: string | null }> {
  const [{ data: tick }, { data: mw }] = await Promise.all([
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
  ]);
  const price = tick ? Number(tick.price) : mw ? Number(mw.last_price) || null : null;
  const bid = mw ? Number(mw.highest_bid) || null : null;
  const bidQty = mw ? Number(mw.highest_bid_qty) || null : null;
  return {
    price,
    bid,
    bidQty,
    bidValue: (bid ?? 0) * (bidQty ?? 0),
    ts: tick ? String(tick.ts) : mw ? String(mw.captured_at) : null,
  };
}

export type ExitDecision =
  | { action: "HOLD" }
  | {
      action: "SELL";
      reason: "STOP_LOSS" | "TIME_EXIT" | "SL_FORCED_LOW_LIQUIDITY" | "FORCED_EXIT_INSUFFICIENT_LIQUIDITY";
      exit_price: number; // executable price (the bid in Case A)
      bid_confirmed: boolean;
    }
  | { action: "EXTEND_HOLD" };

/**
 * STEP 4 + STEP 5 combined decision for ONE open position, evaluated at
 * EOD (~14:25–14:30 Cairo) of a session day.
 *  - Step 4 first: STOP_LOSS (≤ −8% from entry) has priority every day,
 *    then TIME_EXIT on trading day 3.
 *  - Step 5 then: liquidity confirmation against the LIVE bid book.
 *    Case A sells at the bid (bid_confirmed=TRUE). Case B: STOP_LOSS sells
 *    anyway (SL_FORCED_LOW_LIQUIDITY); TIME_EXIT grants ONE extra day
 *    (EXTEND_HOLD) and the next day's forced exit is
 *    FORCED_EXIT_INSUFFICIENT_LIQUIDITY.
 */
export function decideExit(args: {
  daysHeld: number; // trading days elapsed incl. today
  extraHoldGranted: boolean;
  price: number;
  bid: number; // highest_bid (executable price), NOT bidValue
  bidValue: number; // bid × qty (depth capacity)
  positionValue: number; // shares × price now
  entryPrice: number;
  exitDue: "STOP_LOSS" | "TIME_EXIT" | null;
}): ExitDecision {
  // STEP 4 — reason determination
  const ret = (args.price - args.entryPrice) / args.entryPrice;
  let exitDue: "STOP_LOSS" | "TIME_EXIT" | null = args.exitDue;
  if (ret <= GAP_PARAMS.STOP_LOSS_PCT) exitDue = "STOP_LOSS";
  else if (args.daysHeld >= GAP_PARAMS.HOLD_TRADING_DAYS && !exitDue) exitDue = "TIME_EXIT";

  if (!exitDue) return { action: "HOLD" };

  // STEP 5 — mandatory liquidity confirmation (THE most important rule)
  if (args.bidValue >= args.positionValue && args.bid > 0) {
    // Case A: depth absorbs our full position → sell AT the standing bid
    // (the price a real buyer is actually offering — the honest executable
    // price, NOT "last traded price").
    return { action: "SELL", reason: exitDue, exit_price: args.bid, bid_confirmed: true };
  }
  // Case B: insufficient visible buy-side depth for the full position.
  if (exitDue === "STOP_LOSS") {
    // Protect against further loss — sell NOW at best available (last price).
    return { action: "SELL", reason: "SL_FORCED_LOW_LIQUIDITY", exit_price: args.price, bid_confirmed: false };
  }
  // TIME_EXIT with thin liquidity: extend ONCE, then force out.
  if (!args.extraHoldGranted) return { action: "EXTEND_HOLD" };
  return { action: "SELL", reason: "FORCED_EXIT_INSUFFICIENT_LIQUIDITY", exit_price: args.price, bid_confirmed: false };
}

/** News flag (monitoring only): matched news for these symbols in the window
 * before entry. Sunday entries cover FRIDAY 04:00 → Sunday 10:00 Cairo (the
 * whole weekend — Friday AND Saturday news both drive Sunday gaps); other
 * days: yesterday 04:00 → today 10:00 Cairo. All Cairo→UTC arithmetic uses
 * +03:00 (the trading window Apr–Oct is DST; ±1h off-DST is harmless for a
 * 30h-classification window). */
export async function loadNewsFlags(
  todayISO: string,
  symbols: string[],
): Promise<Map<string, boolean>> {
  const flags = new Map<string, boolean>();
  if (!symbols.length) return flags;
  const dow = new Date(`${todayISO}T00:00:00Z`).getUTCDay();
  const backDays = dow === 0 ? 2 : 1; // Sunday covers the full weekend
  const startISO = new Date(
    Date.parse(`${todayISO}T01:00:00Z`) - backDays * 86400_000,
  ).toISOString(); // 04:00 Cairo on the start day
  const endISO = `${todayISO}T07:00:00Z`; // 10:00 Cairo today
  // Two-step (no FK dependency): article_ids per symbol → filter by publish window
  const { data: mapRows } = await supabaseAdmin
    .from("news_symbol_map")
    .select("symbol, article_id")
    .in("symbol", symbols);
  if (!mapRows?.length) return flags;
  const ids = mapRows.map((r) => String(r.article_id));
  const hit = new Set<string>();
  let from = 0;
  while (true) {
    const { data: arts } = await supabaseAdmin
      .from("mubasher_news")
      .select("id")
      .in("id", ids.slice(from, from + 500))
      .gte("published_at", startISO)
      .lte("published_at", endISO);
    for (const a of arts ?? []) hit.add(String(a.id));
    if (!arts || arts.length < 500 || from + 500 >= ids.length) break;
    from += 500;
  }
  for (const r of mapRows) {
    if (hit.has(String(r.article_id))) flags.set(String(r.symbol).toUpperCase(), true);
  }
  return flags;
}

export function isSessionDay(d: Date = cairoNow()): boolean {
  return GAP_PARAMS.SESSION_DAYS.includes(d.getDay() as 0 | 1 | 2 | 3 | 4);
}

// ── RISK GUARDS (loose catastrophe net — tested 2026-09-14) ─────────────
// Guards set TIGHT destroyed returns (week kill at -3k cost 11k EGP in
// missed recoveries). These are set at 2× the worst observed values so
// they NEVER bite in normal operation but catch genuine catastrophe.
export const RISK_GUARDS = {
  /** Week-to-date realized P&L at/below this → block NEW entries until Sunday. */
  WEEK_LOSS_KILL_EGP: -8_000, // 2× worst observed week (−4,059)
  /** Equity drawdown from peak at/below this → halve new position sizes. */
  DD_HALVE_PCT: 0.1, // 2.8× worst observed drawdown (−3.6%)
} as const;

export type GuardState = {
  week_kill_active: boolean;
  week_pnl: number;
  dd_halve_active: boolean;
  drawdown_pct: number;
};

/** Pure guard evaluation from realized weekly P&L + equity drawdown.
 * Callers supply real numbers; this never queries (no lookahead). */
export function evaluateGuards(args: {
  weekPnlEgp: number;
  drawdownPct: number; // negative number, e.g. -0.04
}): GuardState {
  return {
    week_kill_active: args.weekPnlEgp <= RISK_GUARDS.WEEK_LOSS_KILL_EGP,
    week_pnl: args.weekPnlEgp,
    dd_halve_active: args.drawdownPct <= -RISK_GUARDS.DD_HALVE_PCT,
    drawdown_pct: args.drawdownPct,
  };
}
