// data-quality.server.ts — per-symbol-per-day data quality metadata.
//
// STAGE C of the self-describing data-quality system (Sep 5, 2026).
// PURELY ADDITIVE: nothing here modifies archive/ingest logic; it only READS
// archived day-CSVs (or .csv.gz) and writes a companion {date}.quality.json.
//
// Cairo offsets are DST-aware (verified Sep 5: Cairo is UTC+3 in Aug-Sep
// 2026; Egypt reintroduced DST in 2023). We derive the offset from the same
// Intl-based logic isEgxOpenNow() uses — never hardcoded.
//
// Flags:
//   OPEN_RELIABLE   — first tick within 10 min of 10:00 Cairo
//   CLOSE_RELIABLE  — last tick within 15 min of 14:30 Cairo
//   FULL_SESSION_RELIABLE — both true AND maxIntradayGapMinutes < 15
//   likely_reason (when NOT reliable):
//     possible_illiquidity    — symbol visible in marketwatch to end-of-day
//                               with flat volume/trades (real market behavior)
//     possible_collection_gap — symbol absent from marketwatch too (our loss)
//     late_extension_start    — the WHOLE day started late (browser opened
//                               after 10:20 Cairo), not this symbol's fault

export interface SymbolDayQuality {
  symbol: string;
  firstTickCairo: string | null; // HH:mm
  lastTickCairo: string | null; // HH:mm
  minutesFromOpen: number | null;
  minutesBeforeClose: number | null;
  totalRows: number;
  maxIntradayGapMinutes: number | null;
  openReliable: boolean;
  closeReliable: boolean;
  fullSessionReliable: boolean;
  likelyReason: string | null;
}

export interface DayQuality {
  table: string;
  date: string; // YYYY-MM-DD (UTC date of the archive partition)
  cairoOffsetMinutes: number; // e.g. 180 summer / 120 winter
  generatedAt: string;
  marketWideLateStart: boolean;
  symbols: SymbolDayQuality[];
}

/** DST-aware Cairo offset for a given UTC date, via Intl (no tz db needed). */
export function cairoOffsetMinutesFor(dateUtc: string): number {
  // Take 12:00 UTC on that date and ask Intl for the Cairo wall clock.
  const d = new Date(dateUtc + "T12:00:00Z");
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = fmt.formatToParts(d);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? "12");
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  // hour "24" can appear for midnight in hour12:false edge cases; normalize.
  const wall = (h % 24) * 60 + m;
  return wall - 720; // minutes past 12:00 UTC
}

export function cairoHmFromUtcMs(ms: number, offsetMin: number): string {
  const d = new Date(ms + offsetMin * 60_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

/** Thresholds (minutes) — documented in DATA_QUALITY_SYSTEM.md. */
export const T = {
  openTolerance: 10, // first tick <= 10:10 Cairo
  closeTolerance: 15, // last tick >= 14:15 Cairo
  maxGap: 15, // no intraday gap > 15 min during continuous trading
  lateDayStart: 20, // whole day considered late if first data >= 10:20 Cairo
} as const;


/**
 * Compute per-symbol quality for one table-day from parsed rows
 * ({ symbol, tsMs } each; tsMs = epoch ms UTC). `mwBySymbol` (optional):
 * per-symbol { lastMs, flatSinceMs } evidence from the same day's
 * marketwatch partition, used to distinguish real illiquidity from our
 * collection loss. Classification mirrors the manual Stage-B audit:
 * symbol visible in marketwatch to end-of-day => possible_illiquidity;
 * absent there too => possible_collection_gap.
 */
export function computeDayQuality(args: {
  table: string;
  dateUtc: string;
  rows: Array<{ symbol: string; tsMs: number }>;
  mwBySymbol?: Map<string, { lastMs: number; flatSinceMs: number | null }>;
}): DayQuality {
  const offset = cairoOffsetMinutesFor(args.dateUtc);
  const day0 = Date.parse(args.dateUtc + "T00:00:00Z");
  const openUtcMs = day0 + (10 * 60 - offset) * 60_000; // 10:00 Cairo
  const closeUtcMs = day0 + (14.5 * 60 - offset) * 60_000; // 14:30 Cairo
  const contEndUtcMs = day0 + (14.25 * 60 - offset) * 60_000; // 14:15 Cairo

  const bySym = new Map<string, number[]>();
  for (const r of args.rows) {
    let a = bySym.get(r.symbol);
    if (!a) { a = []; bySym.set(r.symbol, a); }
    a.push(r.tsMs);
  }
  for (const a of bySym.values()) a.sort((x, y) => x - y);

  // market-wide late start: median symbol's first data after open+tolerance.
  // Verified against real days: Sep 2 started 10:11 (11 min late) — those
  // symbols are NOT individually broken; Aug 31 started 11:22 (82 min late).
  // The old fixed 20-min threshold + 45-min cap mislabeled both.
  const firsts = [...bySym.values()].map((a) => a[0]).sort((x, y) => x - y);
  const medianFirst = firsts.length ? firsts[Math.floor(firsts.length / 2)] : null;
  const lateDay = medianFirst !== null && medianFirst > openUtcMs + T.openTolerance * 60_000;

  const symbols: SymbolDayQuality[] = [];
  for (const [symbol, ts] of bySym) {
    const first = ts[0], last = ts[ts.length - 1];
    const minFromOpen = Math.round((first - openUtcMs) / 60_000);
    const minBeforeClose = Math.round((closeUtcMs - last) / 60_000);
    let maxGap = 0;
    for (let i = 1; i < ts.length; i++) {
      if (ts[i - 1] < contEndUtcMs) {
        const g = (ts[i] - ts[i - 1]) / 60_000;
        if (g > maxGap) maxGap = g;
      }
    }
    const openReliable = minFromOpen <= T.openTolerance;
    const closeReliable = minBeforeClose <= T.closeTolerance;
    const full = openReliable && closeReliable && maxGap < T.maxGap;

    let likelyReason: string | null = null;
    if (!full) {
      // Evidence from the same day's marketwatch partition (captures ALL
      // ~275 symbols every 20-53s regardless of trading). If the symbol was
      // visible there to end-of-day, collection was fine and the tick
      // stop/gap is REAL market behavior (no trades = illiquidity).
      const mw = args.mwBySymbol?.get(symbol);
      const mwVisibleToEod = !!mw && closeUtcMs - mw.lastMs <= 5 * 60_000;
      // late_extension_start only when the symbol began when the day actually
      // began (within 15 min of the day's median first tick) — a symbol whose
      // OWN first tick is hours later (e.g. PACH 12:00 on a 10:11 day) has an
      // individual problem (illiquidity), not a late-start problem.
      const startedWithDay =
        medianFirst !== null && Math.abs(first - medianFirst) <= 15 * 60_000;
      if (lateDay && !openReliable && startedWithDay) {
        likelyReason = "late_extension_start";
      } else if (mwVisibleToEod) {
        likelyReason = "possible_illiquidity"; // early stop OR mid-day gap
      } else {
        likelyReason = "possible_collection_gap"; // absent from mw too, or no mw evidence
      }
    }

    symbols.push({
      symbol,
      firstTickCairo: cairoHmFromUtcMs(first, offset),
      lastTickCairo: cairoHmFromUtcMs(last, offset),
      minutesFromOpen: minFromOpen,
      minutesBeforeClose: minBeforeClose,
      totalRows: ts.length,
      maxIntradayGapMinutes: Math.round(maxGap * 10) / 10,
      openReliable,
      closeReliable,
      fullSessionReliable: full,
      likelyReason,
    });
  }
  symbols.sort((a, b) => a.symbol.localeCompare(b.symbol));

  return {
    table: args.table,
    date: args.dateUtc,
    cairoOffsetMinutes: offset,
    generatedAt: new Date().toISOString(),
    marketWideLateStart: lateDay,
    symbols,
  };
}
