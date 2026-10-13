// Server-only module for historical data export inside the marketwatch-health page.
//
// SAFETY CONTRACT (read-only with respect to source data):
//   * Reading from D:\1All Data          -> read-only, never mutate originals.
//   * Reading from live Supabase tables  -> read-only SELECT queries ONLY.
//   * The ONLY writes allowed are:
//       (a) NEW cache files (dates not already on disk) -- never overwrite an
//           existing partition file, and
//       (b) the final merged CSV written to wherever the user chooses via the
//           native browser File System Access API.
//   This module never issues UPDATE or DELETE statements.

import { DATA_TABLES, DATA_TABLE_NAMES } from "./data-tables.config";

export type HistorySource = "local" | "cache" | "gap" | "partial";

export interface HistoryBreakdown {
  date: string;
  source: HistorySource;
  /** true when the date was fetched live and a new cache file was written */
  cached?: boolean;
  rows: number;
  /** true when the date was skipped due to a per-table timeout */
  skipped?: boolean;
  /** For source="partial": rows found for this date vs the median row count of
   *  the table's other in-range days. A day under 5% of the median is flagged
   *  "partial" so future audits see suspiciously-thin days in the metadata
   *  itself (e.g. marketwatch 2026-08-27 had only 4 rows and was previously
   *  mislabeled as a healthy non-gap day). */
  medianRows?: number;
  pctOfMedian?: number;
}

export interface HistoryTableResult {
  table: string;
  /** total rows merged for this table across all requested dates */
  rows: number;
  /** union of CSV column names, first-appearance order */
  columns: string[];
  /** single merged CSV (header + rows) in chronological order */
  csv: string;
  /** per-date source breakdown for the on-page summary */
  breakdown: HistoryBreakdown[];
  /** set when this specific table failed/timed out, instead of a crash */
  error?: string;
}

export interface ExportInput {
  /** already expanded ("All" resolved); subset of allowed tables */
  tables: string[];
  /** inclusive YYYY-MM-DD */
  start: string;
  /** inclusive YYYY-MM-DD */
  end: string;
  /** export mode: separate files per table or one unified file */
  mode?: "separate" | "unified";
}

export interface ExportResult {
  ok: boolean;
  local: boolean;
  reason?: string;
  from?: string;
  to?: string;
  tables?: HistoryTableResult[];
  gaps?: Array<{ table: string; date: string }>;
  /** per-table errors (timeouts / internal failures) so the client can show a clear message */
  errors?: Array<{ table: string; error: string }>;
  /** unified CSV string when mode is unified */
  unifiedCsv?: string;
  /** STAGE D: compact per-symbol data-quality companion (one row per
   *  table-day-symbol with reliability flags), so any consumer of the export
   *  sees which symbol-days are trustworthy WITHOUT recomputing anything. */
  qualityCsv?: string;
  /** Plain-language header block explaining the quality flags — prepended
   *  to the quality companion file in every export bundle. */
  qualityReadme?: string;
}

export type SupabaseFetcher = (params: {
  table: string;
  tsCol: string;
  fromIso: string;
  toIso: string;
}) => Promise<Record<string, unknown>[]>;

/**
 * Root of the local historical archive. Overridable for tests and to follow
 * machine-specific data locations; defaults to D:\1All Data.
 */
export const ARCHIVE_ROOT: string = process.env.HISTORY_ARCHIVE_ROOT ?? "D:\\1All Data";

/**
 * STAGE D: plain-language explanation shipped with every export bundle that
 * contains a data-quality companion file. Written for human + AI consumers.
 */
export const QUALITY_README = [
  "DATA-QUALITY COMPANION FILE — READ ME FIRST",
  "===========================================",
  "This export includes a data-quality companion (quality CSV). A row is",
  "FULL_SESSION_RELIABLE=true only if the symbol has data from near market",
  "open (10:00 Cairo) to near close (14:30 Cairo) with no gaps over 15",
  "minutes during continuous trading (10:00-14:15; the 14:15-14:30 closing",
  "auction silence is normal and excluded).",
  "",
  "Columns: date, table, symbol, first_tick, last_tick (Cairo local time),",
  "open_reliable, close_reliable, full_session_reliable, likely_reason.",
  "",
  "likely_reason values (only set when NOT full-session reliable):",
  "- possible_illiquidity    : the symbol stayed visible in full-market",
  "                            snapshots to end-of-day but had no trades —",
  "                            REAL thin trading, data collection was fine.",
  "- possible_collection_gap: the symbol was missing from full-market",
  "                            snapshots too, or no evidence was available —",
  "                            we may have lost data for it that day.",
  "- late_extension_start    : the whole day started late (browser opened",
  "                            after 10:10 Cairo) — not the symbol's fault.",
  "",
  "Do not use non-reliable symbol-days for precise profit/loss backtesting",
  "without accounting for this.",
].join("\n");

/**
 * True only when we are on a local dev machine that has the archive on disk.
 * On the deployed production site NODE_ENV == "production", and/or the D:\
 * archive root does not exist (Linux worker) — in that case the UI shows a
 * "local-only" message instead of attempting native filesystem/dialog access.
 */
export async function isLocalRuntime(): Promise<boolean> {
  try {
    if (String(process.env.NODE_ENV || "").toLowerCase() === "production") {
      return false;
    }
    const m = await fs();
    return m.existsSync(ARCHIVE_ROOT);
  } catch {
    return false;
  }
}

export function expandTables(tables: string[]): string[] {
  const set = new Set<string>();
  for (const t of tables) {
    const name = String(t || "").trim();
    if (name === "" || name === "all") {
      for (const a of DATA_TABLE_NAMES) set.add(a);
      continue;
    }
    if (DATA_TABLE_NAMES.includes(name)) set.add(name);
  }
  return DATA_TABLE_NAMES.filter((t) => set.has(t));
}

// ---------------------------------------------------------------------------
// Filesystem access. Loaded via Bun-native dynamic import() so the deployed
// web/worker build never resolves node:fs at compile time — only local runs.
// ---------------------------------------------------------------------------
let _fsP: Promise<typeof import("node:fs")> | null = null;
async function fs(): Promise<typeof import("node:fs")> {
  if (!_fsP) {
    _fsP = Promise.resolve()
      .then(() => import("node:fs"))
      .catch(() => import("fs")) as Promise<typeof import("node:fs")>;
  }
  return _fsP;
}

let _pathP: Promise<typeof import("node:path")> | null = null;
async function pth(): Promise<typeof import("node:path")> {
  if (!_pathP) _pathP = Promise.resolve().then(() => import("node:path"));
  return _pathP;
}

let _zlibP: Promise<typeof import("node:zlib")> | null = null;
async function zlib(): Promise<typeof import("node:zlib")> {
  if (!_zlibP) {
    _zlibP = Promise.resolve()
      .then(() => import("node:zlib"))
      .catch(() => import("zlib")) as Promise<typeof import("node:zlib")>;
  }
  return _zlibP;
}

// ---------------------------------------------------------------------------
// CSV helpers (mirror scripts/daily-archive.ts so cache files match archives)
// ---------------------------------------------------------------------------

function csvCell(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "object") {
    return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
  }
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQ = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}
function unionColumns(rows: Record<string, unknown>[]): string[] {
  const seen = new Set<string>();
  const cols: string[] = [];
  for (const r of rows) {
    for (const k of Object.keys(r)) {
      if (!seen.has(k)) {
        seen.add(k);
        cols.push(k);
      }
    }
  }
  return cols;
}

function rowTs(row: Record<string, unknown>, tsCol: string): number {
  const raw = row[tsCol] ?? row["created_at"] ?? row["captured_at"] ?? "";
  if (!raw) return 0;
  try {
    const n = new Date(String(raw)).getTime();
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}
/**
 * Convert a row from a specific table to a unified row for the unified export.
 * Returns null if the row is missing required data (symbol or timestamp).
 */
function toUnifiedRow(table: string, row: Record<string, unknown>): Record<string, unknown> | null {
  const symbol = (row["symbol"] as string) || "";
  if (!symbol) return null;

  const cfg = DATA_TABLES[table];
  if (!cfg) return null;

  const tsCol = cfg.timestampCol;
  const ts = rowTs(row, tsCol);
  if (ts === 0) return null;

  const date = new Date(ts);
  const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD
  const timeStr = date.toTimeString().slice(0, 8); // HH:mm:ss

  // Use config-based column names so each table reads from the correct columns
  const price = cfg.priceCol && row[cfg.priceCol] != null ? row[cfg.priceCol] : "";
  const volume = cfg.volumeCol && row[cfg.volumeCol] != null ? row[cfg.volumeCol] : "";
  const bid = cfg.bidCol && row[cfg.bidCol] != null ? row[cfg.bidCol] : "";
  const ask = cfg.askCol && row[cfg.askCol] != null ? row[cfg.askCol] : "";

  return {
    symbol,
    date: dateStr,
    time: timeStr,
    data_type: table,
    price,
    volume,
    bid,
    ask,
  };
}

function isoAddDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Local archive access
// ---------------------------------------------------------------------------

async function readLocalRows(table: string, date: string): Promise<Record<string, unknown>[]> {
  const p = await pth();
  const m = await fs();
  const csvFp = p.join(ARCHIVE_ROOT, table, `${date}.csv`);
  const gzFp = p.join(ARCHIVE_ROOT, table, `${date}.csv.gz`);

  let content: string;
  if (m.existsSync(csvFp)) {
    content = m.readFileSync(csvFp, "utf-8") as string;
  } else if (m.existsSync(gzFp)) {
    // Read gzip-compressed archival copy written by archive-runner.server.ts
    const z = await zlib();
    const gzBuffer = m.readFileSync(gzFp);
    const decompressed = z.gunzipSync(gzBuffer);
    content = decompressed.toString("utf-8");
  } else {
    return [];
  }

  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]);
  const rows: Record<string, unknown>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const obj: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      obj[h] = idx < cells.length ? cells[idx] : "";
    });
    rows.push(obj);
  }
  return rows;
}

/**
 * Write a NEW cache partition file. Never overwrites an existing file.
 * Returns true only when a file was actually created.
 */
async function cacheLocalRows(
  table: string,
  date: string,
  rows: Record<string, unknown>[],
): Promise<boolean> {
  const p = await pth();
  const m = await fs();
  const dir = p.join(ARCHIVE_ROOT, table);
  if (!m.existsSync(dir)) m.mkdirSync(dir, { recursive: true });
  const fp = p.join(dir, `${date}.csv`);
  if (m.existsSync(fp)) return false; // never overwrite
  const columns = unionColumns(rows);
  const csv =
    [columns.join(","), ...rows.map((r) => columns.map((c) => csvCell(r[c] ?? "")).join(","))].join(
      "\n",
    ) + "\n";
  m.writeFileSync(fp, csv, "utf-8");
  return true;
}
// ---------------------------------------------------------------------------
// Supabase read-only SELECT fetcher
// ---------------------------------------------------------------------------

async function defaultSupabaseFetcher(params: {
  table: string;
  tsCol: string;
  fromIso: string;
  toIso: string;
}): Promise<Record<string, unknown>[]> {
  // Dynamic table name: use a loosely-typed builder so the generic-typed
  // Supabase client doesn't reject a runtime table name here.
  const supabaseAdmin = (await import("@/integrations/supabase/client.server")).supabaseAdmin;
  const all: Record<string, unknown>[] = [];
  const PAGE = 1000;
  let from = 0;
  const chain: any = (supabaseAdmin as any).from(params.table);
  for (;;) {
    const { data, error } = await chain
      .select("*")
      .gte(params.tsCol, params.fromIso)
      .lt(params.tsCol, params.toIso)
      .order(params.tsCol, { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`${params.table} ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += data.length;
  }
  return all;
}

// ---------------------------------------------------------------------------
// Orchestration: local-cache-first, Supabase-fallback, chronological merge
// ---------------------------------------------------------------------------

/** Per-table processing budget; if a single table exceeds this it is reported
 *  as a timeout instead of crashing the whole multi-table request. */
export const TABLE_TIMEOUT_MS = 60_000;

/**
 * Merge source data for a date range into one chronological CSV per table.
 * When a local partition file exists it is used as-is; otherwise the date is
 * fetched READ-ONLY from Supabase and stored as a NEW cache file (never
 * overwriting). Any date absent from both locations is reported as a gap,
 * never a fatal error. Each table is time-boxed independently so one slow
 * table degrades gracefully instead of failing the whole export.
 */
export async function runExport(
  input: ExportInput,
  fetchCb?: SupabaseFetcher,
): Promise<ExportResult> {
  const isLocal = await isLocalRuntime();
  if (!isLocal) {
    return { ok: false, local: false, reason: "PROD" };
  }

  const tables = expandTables(input.tables);
  if (tables.length === 0) {
    return { ok: false, local: true, reason: "NO_TABLE" };
  }
  if (String(input.start) > String(input.end)) {
    return { ok: false, local: true, reason: "INVALID_RANGE" };
  }

  const dates: string[] = [];
  let cur = input.start;
  while (cur <= input.end) {
    dates.push(cur);
    cur = isoAddDays(cur, 1);
  }

  const fetch = fetchCb ?? defaultSupabaseFetcher;
  const tableResults: HistoryTableResult[] = [];
  const allGaps: Array<{ table: string; date: string }> = [];
  const errors: Array<{ table: string; error: string }> = [];

  const unified = input.mode === "unified";
  // Unified export now uses a streaming k-way merge over per-table temp files
  // instead of accumulating every row in memory. The old approach built one
  // giant array + one giant string (~300 MB+ for 10 days of marketwatch) and
  // OOM-crashed the dev server (exit 134), which the browser saw as
  // "Failed to fetch" (ECONNRESET). Peak memory is now ONE day file at a time.
  let unifiedCsv: string | undefined;
  let unifiedTempPaths: string[] = [];
  let unifiedRowCount = 0;

  for (const table of tables) {
    const tableStartMs = Date.now();
    const tsCol = DATA_TABLES[table]?.timestampCol ?? "created_at";
    const merged: Record<string, unknown>[] = [];
    const breakdown: HistoryBreakdown[] = [];
    let tableError: string | undefined;

    try {
      for (const date of dates) {
        // Give up this table if it is taking too long overall — but DELIVER
        // everything merged so far instead of discarding it. (The old code
        // threw away ALL collected rows on timeout, which is why a slow
        // marketwatch_snapshots showed up as ZERO rows in the unified CSV.)
        if (Date.now() - tableStartMs > TABLE_TIMEOUT_MS) {
          tableError = `${table} partially exported — remaining dates skipped (timeout after ${Math.round(
            (Date.now() - tableStartMs) / 1000,
          )}s; collected ${merged.length} rows across ${breakdown.length} date(s) were kept)`;
          // mark the current + remaining dates as skipped (not processed)
          breakdown.push({ date, source: "gap", rows: 0, skipped: true });
          for (const rest of dates.slice(dates.indexOf(date) + 1)) {
            breakdown.push({ date: rest, source: "gap", rows: 0, skipped: true });
          }
          allGaps.push({ table, date: `${input.start}..${input.end} @ deadline` });
          break;
        }

        const fromIso = `${date}T00:00:00.000Z`;
        const toIso = `${isoAddDays(date, 1)}T00:00:00.000Z`;

        let local: Record<string, unknown>[] = [];
        try {
          local = await readLocalRows(table, date);
        } catch {
          local = [];
        }
        if (local.length === 0) {
          // fall back to live Supabase (read-only) — but never crash the table
          let remote: Record<string, unknown>[] = [];
          try {
            remote = await fetch({ table, tsCol, fromIso, toIso });
          } catch {
            remote = [];
          }
          if (remote.length === 0) {
            allGaps.push({ table, date });
            breakdown.push({ date, source: "gap", rows: 0 });
            continue;
          }
          const cached = await cacheLocalRows(table, date, remote);
          appendAll(merged, remote);
          breakdown.push({ date, source: "cache", cached, rows: remote.length });
        } else {
          appendAll(merged, local);
          breakdown.push({ date, source: "local", rows: local.length });
        }

        // UNIFIED MODE ONLY: flush this day's rows to the temp file NOW and
        // release `merged` so peak memory stays at ONE day. This is what the
        // .mkb2 export already does — without it, 10 days of marketwatch
        // (1.1M objects) plus the giant unified string OOM-crashed the dev
        // server (exit 134) and the browser saw "Failed to fetch".
        if (unified) {
          const m = await fs();
          const first = unifiedTempPaths.length === 0;
          const tmpPath = await pJoin(
            await pTempDir(),
            `unified_${table}_${Date.now()}_${Math.random().toString(36).slice(2)}.rows`,
          );
          const fh = m.openSync(tmpPath, "a");
          try {
            for (const row of merged) {
              const uRow = toUnifiedRow(table, row);
              if (uRow === null) continue;
              m.writeSync(fh, unifiedRowToSortableCsv(uRow) + "\n");
              unifiedRowCount++;
            }
          } finally {
            m.closeSync(fh);
          }
          if (merged.length > 0) unifiedTempPaths.push(tmpPath);
          else { try { m.unlinkSync(tmpPath); } catch { /* ok */ } }
          merged.length = 0; // free the day's objects — do NOT keep accumulating
        }
      }
    } catch (e) {
      // A single table failing must not crash the multi-table request.
      tableError = String((e as Error)?.message || e).slice(0, 200);
      if (String(tableError).includes("call stack")) {
        tableError = `${table}: internal error building data (too many rows) — try a smaller date range`;
      }
    }

    // A timeout/error must record the problem — but the partial data collected
    // so far is REAL and belongs in the export. The old code `continue`d here,
    // which meant a single slow table contributed ZERO rows to the unified CSV.
    if (tableError) {
      errors.push({ table, error: tableError });
    }

    // --- Partial-day detection (Stage-3 audit fix) -------------------------
    // A day with a FEW rows is NOT a "gap" (gap = zero rows). Real example:
    // marketwatch 2026-08-27 has 4 rows but was labeled "local" like any
    // healthy day, which misled external audits. Days whose row count is under
    // 5% of the median of the table's other in-range days are re-labeled
    // "partial" with their median stats attached, so the export's own
    // metadata tells any future auditor (human or AI) which days are
    // suspiciously thin WITHOUT needing to recompute from raw files.
    {
      const rowed = breakdown.filter((b) => b.rows > 0 && !b.skipped);
      if (rowed.length >= 2) {
        const sorted = rowed.map((b) => b.rows).sort((a, b) => a - b);
        const medianRows = sorted[Math.floor(sorted.length / 2)];
        for (const b of rowed) {
          if (b.source !== "gap" && b.skipped !== true && medianRows > 0) {
            const pct = (b.rows / medianRows) * 100;
            if (pct < 5) {
              b.source = "partial";
              b.medianRows = medianRows;
              b.pctOfMedian = Math.round(pct * 10) / 10;
            }
          }
        }
      }
    }
    // ------------------------------------------------------------------------

    if (unified) {
      // Rows were already flushed to the temp file day-by-day inside the loop
      // (peak memory = one day). On timeout, `merged` may still hold rows from
      // the interrupted day — flush them here so partial data is never lost.
      if (merged.length > 0) {
        const m = await fs();
        const tmpPath = await pJoin(
          await pTempDir(),
          `unified_${table}_${Date.now()}_${Math.random().toString(36).slice(2)}.rows`,
        );
        const fh = m.openSync(tmpPath, "a");
        try {
          for (const row of merged) {
            const uRow = toUnifiedRow(table, row);
            if (uRow === null) continue;
            m.writeSync(fh, unifiedRowToSortableCsv(uRow) + "\n");
            unifiedRowCount++;
          }
          unifiedTempPaths.push(tmpPath);
        } finally {
          m.closeSync(fh);
        }
        merged.length = 0;
      }
      tableResults.push({
        table,
        rows: breakdown.reduce((acc, b) => acc + (b.rows ?? 0), 0), // this table's own row total
        columns: [],
        csv: "",
        breakdown,
        error: tableError,
      });
      continue;
    }

    if (tableError) {
      // Separate mode with an error: still report the collected rows.
      tableResults.push({
        table,
        rows: merged.length,
        columns: unionColumns(merged),
        csv: "",
        breakdown,
        error: tableError,
      });
      continue;
    }

    // Separate mode (no error): original logic
    merged.sort((a, b) => rowTs(a, tsCol) - rowTs(b, tsCol));
    const columns = unionColumns(merged);
    const csv =
      (columns.length
        ? [
            columns.join(","),
            ...merged.map((r) => columns.map((c) => csvCell(r[c] ?? "")).join(",")),
          ].join("\n")
        : "") + "\n";

    tableResults.push({ table, rows: merged.length, columns, csv, breakdown });
  }

  if (unified) {
    // Build the unified CSV via a streaming k-way merge across the per-table
    // temp files. Peak memory = one line buffer per open file (~KBs), never
    // the whole dataset. Lines were written with a sortable prefix
    // (date\x1Ftime\x1Fsymbol) so a plain lexicographic merge yields the exact
    // chronological order the old in-memory sort produced.
    const m = await fs();
    const header = "symbol,date,time,data_type,price,volume,bid,ask";
    if (unifiedTempPaths.length === 0) {
      unifiedCsv = header + "\n";
    } else {
      const parts: string[] = [header];
      const readers = unifiedTempPaths.map((tp) => ({
        fd: m.openSync(tp, "r"),
        rest: "",
        done: false,
        next: null as string | null,
      }));
      try {
        // Line-reading iterator over a file descriptor (buffered, readFileSync-free).
        const BUFSZ = 1 << 20;
        const readLine = (r: (typeof readers)[number]): string | null => {
          while (true) {
            if (r.done && r.rest === "") return null;
            const nl = r.rest.indexOf("\n");
            if (nl >= 0) {
              const line = r.rest.slice(0, nl);
              r.rest = r.rest.slice(nl + 1);
              return line;
            }
            if (r.done) {
              const line = r.rest;
              r.rest = "";
              return line.length ? line : null;
            }
            const buf = Buffer.allocUnsafe(BUFSZ);
            const n = m.readSync(r.fd, buf, 0, BUFSZ, null);
            if (n === 0) {
              r.done = true;
              continue;
            }
            r.rest += buf.toString("utf8", 0, n);
          }
        };
        for (const r of readers) r.next = readLine(r);
        // strip "date \x1F time \x1F symbol \x1F" prefix: cut after the THIRD separator
        const stripPrefix = (s: string) => {
          let i = -1;
          for (let k = 0; k < 3; k++) {
            i = s.indexOf("\u001f", i + 1);
            if (i < 0) return s; // malformed line: keep as-is rather than drop
          }
          return s.slice(i + 1);
        };
        for (;;) {
          let best = -1;
          for (let i = 0; i < readers.length; i++) {
            const cur = readers[i].next;
            if (cur !== null && (best === -1 || cur < readers[best].next!)) best = i;
          }
          if (best === -1) break;
          parts.push(stripPrefix(readers[best].next!));
          readers[best].next = readLine(readers[best]);
        }
      } finally {
        for (const r of readers) {
          try { m.closeSync(r.fd); } catch { /* ok */ }
        }
        for (const tp of unifiedTempPaths) {
          try { m.unlinkSync(tp); } catch { /* ok */ }
        }
      }
      unifiedCsv = parts.join("\n") + "\n";
    }
  }

  // ── STAGE D: data-quality companion CSV ────────────────────────────────
  // Reads {date}.quality.json companions (if present) for the requested range
  // and builds one compact CSV: date,table,symbol,first_tick,last_tick,
  // open_reliable,close_reliable,full_session_reliable,likely_reason.
  // If no quality files exist yet, qualityCsv stays undefined (additive; the
  // export behaves exactly as before). Missing days are simply omitted.
  let qualityCsv: string | undefined;
  {
    const p = await pth();
    const m = await fs();
    const qualityRows: string[] = [];
    for (const table of tables) {
      for (const date of dates) {
        const qp = p.join(ARCHIVE_ROOT, table, `${date}.quality.json`);
        if (!m.existsSync(qp)) continue;
        try {
          const q = JSON.parse(m.readFileSync(qp, "utf-8")) as {
            symbols?: Array<{
              symbol: string; firstTickCairo: string | null; lastTickCairo: string | null;
              openReliable: boolean; closeReliable: boolean;
              fullSessionReliable: boolean; likelyReason: string | null;
            }>;
          };
          for (const s of q.symbols ?? []) {
            qualityRows.push(
              [
                date, table, s.symbol,
                s.firstTickCairo ?? "", s.lastTickCairo ?? "",
                s.openReliable, s.closeReliable, s.fullSessionReliable,
                s.likelyReason ?? "",
              ].join(","),
            );
          }
        } catch { /* malformed quality file: skip it, never break the export */ }
      }
    }
    if (qualityRows.length > 0) {
      qualityCsv = [
        "date,table,symbol,first_tick,last_tick,open_reliable,close_reliable,full_session_reliable,likely_reason",
        ...qualityRows,
      ].join("\n") + "\n";
    }
  }

  return {
    ok: true,
    local: true,
    from: input.start,
    to: input.end,
    tables: tableResults,
    gaps: allGaps,
    errors,
    unifiedCsv,
    qualityCsv,
    qualityReadme: QUALITY_README,
  };
}

/**
 * Append without spread-into-arguments. Spread with very large arrays (e.g.
 * 176k rows) exceeds the JS call-argument limit and throws
 * "RangeError: Maximum call stack size exceeded" inside the dev server.
 */
function appendAll(dest: Record<string, unknown>[], src: Record<string, unknown>[]) {
  for (let i = 0; i < (src?.length ?? 0); i++) dest[dest.length] = src[i];
}

// ── Unified streaming helpers ────────────────────────────────────────
// The unified export writes per-table rows to temp files, then k-way merges
// them. Each line carries a sortable prefix so lexicographic merge == the
// chronological order the old in-memory sort produced.

let _osP: Promise<typeof import("node:os")> | null = null;
async function osmod(): Promise<typeof import("node:os")> {
  if (!_osP) {
    _osP = Promise.resolve()
      .then(() => import("node:os"))
      .catch(() => import("os")) as Promise<typeof import("node:os")>;
  }
  return _osP;
}

/** Temp dir for the unified external sort (OS temp + subdir). Also sweeps
 * files older than 1h — leftovers from a past crash never accumulate. */
async function pTempDir(): Promise<string> {
  const os = await osmod();
  const p = await pth();
  const m = await fs();
  const dir = p.join(os.tmpdir(), "mky-unified-export");
  if (!m.existsSync(dir)) m.mkdirSync(dir, { recursive: true });
  else {
    try {
      const cutoff = Date.now() - 60 * 60 * 1000;
      for (const f of m.readdirSync(dir)) {
        const fp = p.join(dir, f);
        try {
          if (m.statSync(fp).mtimeMs < cutoff) m.unlinkSync(fp);
        } catch { /* raced or in use — skip */ }
      }
    } catch { /* never fatal */ }
  }
  return dir;
}

async function pJoin(dir: string, file: string): Promise<string> {
  const p = await pth();
  return p.join(dir, file);
}

/** CSV cells for one unified row, as a single line WITH the sort prefix. */
function unifiedRowToSortableCsv(row: Record<string, unknown>): string {
  const cells = [
    row.symbol ?? "",
    row.date ?? "",
    row.time ?? "",
    row.data_type ?? "",
    row.price ?? "",
    row.volume ?? "",
    row.bid ?? "",
    row.ask ?? "",
  ].map((v) => csvCell(v));
  const csvLine = cells.join(",");
  // prefix: date \x1F time \x1F symbol \x1F — sortable, then stripped on merge
  return `${row.date ?? ""}\u001f${row.time ?? ""}\u001f${row.symbol ?? ""}\u001f${csvLine}`;
}
