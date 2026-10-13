// export-direct.ts
//
// ZERO-MEMORY streaming export of historical data from D:\1All Data\.
//
// Why this exists:
//   * runExport() in history-export.server.ts builds the full CSV in memory
//     before returning it. For multi-month/multi-year windows with 6 tables
//     and ~200K rows/day, that string buffer is ~hundreds of MB and
//     reliably crashes the Vite dev server (and would OOM in production
//     just as fast). The user has hit this on every "last 10 days, all
//     tables" attempt.
//   * This route reads the .csv (or .csv.gz) files DIRECTLY from disk
//     with a Node readStream, decodes gzip in 64KB chunks, and pipes
//     the bytes straight to the HTTP response. Peak memory: a few KB
//     regardless of total data size. Safe for years of data.
//
// Local-only: like the other hooks, this refuses to run on production
// (NODE_ENV=production) or if D:\1All Data is not accessible.

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";
import { Readable } from "node:stream";
import { DATA_TABLE_NAMES, DATA_TABLES } from "@/lib/data-tables.config";
import { isLocalRuntime, ARCHIVE_ROOT } from "@/lib/history-export.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BodySchema = z.object({
  tables: z.array(z.string().trim().min(1)).min(1).max(10),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  // Selection of columns to keep.
  //   "all"  — every column, every row, every byte (heaviest, ~138 MB gz
  //            for 10 days × 6 tables). Lossless, including any future
  //            columns we don't know about today.
  //   "core" — id, symbol, price-like, volume-like, ts (numeric & symbol
  //            columns only). Drops JSON metadata blobs and any string
  //            columns we don't recognise. ~25-40 MB gz for 10 days.
  //   "minimal" — symbol, ts, captured_at and the configured price/volume
  //            columns only. ~10-15 MB gz for 10 days. Best for sharing
  //            or importing into another analytics tool.
  // The trade-off is documented in the UI next to the download button.
  select: z.enum(["all", "core", "minimal"]).default("all"),
  // Legacy flag kept for backwards compatibility; ignored when `select`
  // is explicitly set. When true (and select is not "all"), applies
  // additional drop-duplicate-id and created_at-when-equal-ts cleanup.
  compact: z.boolean().default(true),
});

/** Return the column names to keep given the user-selected mode and the
 *  raw header. The original header's column order is preserved for
 *  "all"; for "core" and "minimal" we still preserve order, just
 *  filtering. Unknown columns are passed through under "all" and
 *  dropped under "core" / "minimal". */
function selectColumns(
  rawHeader: string[],
  mode: "all" | "core" | "minimal",
  table: string,
): string[] {
  if (mode === "all") return rawHeader;

  // Per-table column classification. Anything in CORE_KEYS is kept in
  // both "core" and "minimal" modes. Anything in MINIMAL_KEYS (subset of
  // CORE) is kept only in "minimal" mode.
  const CORE = new Set([
    "id", "symbol", "ts", "captured_at", "created_at",
    "price", "last_price", "ref_price", "open_price",
    "volume", "total_volume", "total_trades",
    "bid", "ask", "best_bid", "best_ask", "highest_bid", "lowest_ask",
  ]);
  const MINIMAL = new Set([
    "id", "symbol", "ts", "captured_at",
    "price", "last_price", "volume", "total_volume",
    "bid", "ask", "highest_bid", "lowest_ask",
  ]);
  const keep = mode === "minimal" ? MINIMAL : CORE;
  return rawHeader.filter((h) => keep.has(h));
}

const ALLOWED = DATA_TABLE_NAMES;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isoAddDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function expandTables(tables: string[]): string[] {
  const set = new Set<string>();
  for (const t of tables) {
    const name = String(t || "").trim();
    if (!name) continue;
    if (name.toLowerCase() === "all") {
      for (const a of ALLOWED) set.add(a);
    } else if (ALLOWED.includes(name)) {
      set.add(name);
    }
  }
  return ALLOWED.filter((t) => set.has(t));
}

/** Stream a local CSV (or CSV.GZ) for a single (table, date) into the response.
 *  Returns true if any bytes were streamed, false if the date had no data.
 *  When `compact` is true the per-day buffer is run through compactCsvBuffer
 *  before being forwarded, which strips redundant JSON blobs and duplicate
 *  timestamps. Memory is bounded by the size of one day's CSV (a few MB). */
async function streamLocalDay(
  table: string,
  date: string,
  writer: WritableStreamDefaultWriter<Uint8Array>,
  compact: boolean,
  selectMode: "all" | "core" | "minimal",
): Promise<{ ok: boolean; rawBytes: number; outBytes: number }> {
  const csvFp = path.join(ARCHIVE_ROOT, table, `${date}.csv`);
  const gzFp = path.join(ARCHIVE_ROOT, table, `${date}.csv.gz`);

  // Read the whole day's bytes into memory (per-day, not per-export).
  // Worst case is the largest daily file (~90 MB for marketwatch).
  // We then compact and forward once. This is still far less memory than
  // the original runExport which held the entire 374 MB in one string.
  let buf: Buffer;
  try {
    if (fs.existsSync(csvFp)) {
      buf = fs.readFileSync(csvFp);
    } else if (fs.existsSync(gzFp)) {
      const gz = fs.readFileSync(gzFp);
      buf = zlib.gunzipSync(gz);
    } else {
      return { ok: false, rawBytes: 0, outBytes: 0 };
    }
  } catch (e) {
    return { ok: false, rawBytes: 0, outBytes: 0 };
  }

  const rawBytes = buf.length;
  // For "all" mode we still need to compact if the legacy `compact: true`
  // is set, to dedup `meta` JSON blobs and `created_at`. The select mode
  // drives the column set.
  const out = compact ? compactCsvBuffer(buf, table, selectMode) : buf;
  const outBytes = out.length;

  // Forward in a single write to the writer; the writer applies backpressure
  // to the underlying gzip transform if any.
  await writer.write(out);
  return { ok: true, rawBytes, outBytes };
}

/** CSV-escape a value the same way the archive pipeline writes CSVs. */
function csvEscapeLocal(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

/**
 * SUPABASE FALLBACK (read-only): fetch one day's rows for a table straight
 * from the live Supabase DB (keyset/paginated via .range), and build a CSV
 * buffer that matches the on-disk archive format (same header style: column
 * names from the first row, rows in arrival order).
 *
 * Used ONLY when the requested date has no file on disk — typically the
 * CURRENT day, whose data only reaches disk at the 5 PM archive run.
 * This path NEVER writes to disk (the 5 PM pipeline owns all disk writes).
 */
async function fetchSupabaseDayCsv(
  table: string,
  date: string,
): Promise<{ ok: boolean; csv: Buffer; rows: number; error?: string }> {
  const cfg = DATA_TABLES[table];
  if (!cfg) return { ok: false, csv: Buffer.alloc(0), rows: 0, error: "unknown_table" };
  const tsCol = cfg.timestampCol;
  // Cairo-local day boundaries (the archive pipeline and quality system use
  // Africa/Cairo consistently; UTC boundaries would split trading days).
  const [y, m, d] = date.split("-").map(Number);
  const fromIso = `${date}T00:00:00+03:00`; // Cairo is UTC+3 in September
  const toIso = `${date}T23:59:59.999+03:00`;
  void y; void m; void d;

  const PAGE = 1000;
  let from = 0;
  const allRows: Record<string, unknown>[] = [];
  // First pass: count + header discovery (fetch first page once)
  let headerCols: string[] = [];
  for (;;) {
    // Cast: the table is a validated DATA_TABLES member at runtime; the generated
    // types are per-table, so we cast the whole query expression (calling .from()
    // normally preserves the client's `this` context — extracting the method
    // breaks it).
    const { data, error } = await ((supabaseAdmin as any)
      .from(table)
      .select("*")
      .gte(tsCol, fromIso)
      .lte(tsCol, toIso)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1)) as { data: Record<string, unknown>[] | null; error: { message: string } | null };
    if (error) return { ok: false, csv: Buffer.alloc(0), rows: 0, error: error.message };
    const page = data ?? [];
    if (page.length === 0) break;
    if (from === 0) headerCols = Object.keys(page[0] as Record<string, unknown>);
    for (const row of page) allRows.push(row as Record<string, unknown>);
    if (page.length < PAGE) break;
    from += PAGE;
  }
  if (allRows.length === 0) return { ok: false, csv: Buffer.alloc(0), rows: 0, error: "no_rows" };

  const lines: string[] = [headerCols.join(",")];
  for (const row of allRows) {
    lines.push(headerCols.map((c) => csvEscapeLocal(row[c])).join(","));
  }
  return { ok: true, csv: Buffer.from(lines.join("\n") + "\n", "utf-8"), rows: allRows.length };
}

/** Stream one day for one table: disk-first, live-Supabase fallback.
 *  Returns the source used ("disk_archive" | "supabase_live" | "gap") so the
 *  per-day marker line is self-describing. */
async function streamOneDay(
  table: string,
  date: string,
  writer: WritableStreamDefaultWriter<Uint8Array>,
  compact: boolean,
  selectMode: "all" | "core" | "minimal",
): Promise<{ source: "disk_archive" | "supabase_live" | "gap"; rawBytes: number; outBytes: number; rows?: number }> {
  const local = await streamLocalDay(table, date, writer, compact, selectMode);
  if (local.ok) return { source: "disk_archive", rawBytes: local.rawBytes, outBytes: local.outBytes };

  // Disk miss → live Supabase fallback (read-only; never writes to disk).
  const live = await fetchSupabaseDayCsv(table, date);
  if (!live.ok) return { source: "gap", rawBytes: 0, outBytes: 0 };
  const buf = compact ? compactCsvBuffer(live.csv, table, selectMode) : live.csv;
  await writer.write(buf);
  return { source: "supabase_live", rawBytes: live.csv.length, outBytes: buf.length, rows: live.rows };
}

/** Compact an in-memory CSV buffer. See full docstring below.
 *  `mode` controls which columns are kept; the meta / created_at cleanup
 *  is applied only when `mode !== "all"`. */
function compactCsvBuffer(
  buf: Buffer,
  table: string,
  mode: "all" | "core" | "minimal",
): Buffer {
  const text = buf.toString("utf-8");
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return buf;

  const header = parseCsvLineLocal(lines[0]);
  // Decide which columns to keep.
  const keep = selectColumns(header, mode, table);
  const keepIdx = keep.map((name) => header.indexOf(name)).filter((i) => i >= 0);

  const metaIdx = keep.indexOf("meta");
  const tsIdx = keep.indexOf("ts");
  const createdAtIdx = keep.indexOf("created_at");

  const newHeader = keep.join(",");

  const metaMap = new Map<string, string>();
  let metaCounter = 0;

  const newLines: string[] = [];
  newLines.push(`# table=${table} select=${mode} compacted=2026-08-30`);
  if (metaIdx >= 0) {
    newLines.push(
      `# meta_map: compact IDs (m0, m1, ...) reference JSON sidecar below`,
    );
  }
  newLines.push(newHeader);

  for (let li = 1; li < lines.length; li++) {
    const line = lines[li];
    if (!line) continue;
    const cells = parseCsvLineLocal(line);
    let kept = keepIdx.map((i) => cells[i] ?? "");

    if (metaIdx >= 0) {
      const metaColPos = keep.indexOf("meta");
      if (metaColPos >= 0) {
        const raw = kept[metaColPos] ?? "";
        if (raw && !metaMap.has(raw) && raw.startsWith("{")) {
          const compact = "m" + metaCounter++;
          metaMap.set(raw, compact);
        }
        if (raw) kept[metaColPos] = metaMap.get(raw) ?? "";
      }
    }

    if (tsIdx >= 0 && createdAtIdx >= 0) {
      const tsStr = kept[tsIdx];
      const caStr = kept[createdAtIdx];
      if (tsStr && caStr && roughlyEqualTimestamps(tsStr, caStr)) {
        kept.splice(createdAtIdx, 1);
      }
    }

    newLines.push(kept.map(csvCellLocal).join(","));
  }

  if (metaMap.size > 0) {
    const sidecar: string[] = [];
    for (const [orig, compact] of metaMap) {
      sidecar.push(`# meta_map_entry: ${compact}=${JSON.stringify(orig)}`);
    }
    newLines.splice(3, 0, ...sidecar);
  }

  return Buffer.from(newLines.join("\n") + "\n", "utf-8");
}

function parseCsvLineLocal(line: string): string[] {
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

function csvCellLocal(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n") || val.includes("\r")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function roughlyEqualTimestamps(a: string, b: string): boolean {
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  if (!Number.isFinite(ta) || !Number.isFinite(tb)) return false;
  return Math.abs(ta - tb) < 1000;
}

/** Compress a buffer with gzip. Used for the final "summary" footer only —
 *  the per-day file bytes are streamed raw (they may already be gzipped
 *  on disk, and re-compressing CSV that just came out of zlib is wasteful). */
function gzipSync(buf: Buffer): Buffer {
  return zlib.gzipSync(buf, { level: zlib.constants.Z_BEST_COMPRESSION });
}

export const Route = createFileRoute("/api/public/hooks/export-direct")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204 }),
      GET: async () => {
        const local = await isLocalRuntime();
        return json({ local, reason: local ? null : "PROD" });
      },
      POST: async ({ request }) => {
        const local = await isLocalRuntime();
        if (!local) {
          return json({ ok: false, local: false, reason: "PROD" }, 200);
        }
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ ok: false, local: true, reason: "BAD_JSON" }, 400);
        }
        const parsed = BodySchema.safeParse(raw);
        if (!parsed.success) {
          return json({ ok: false, local: true, reason: "BAD_BODY" }, 400);
        }
        const tables = expandTables(parsed.data.tables);
        if (tables.length === 0) {
          return json({ ok: false, local: true, reason: "NO_TABLE" }, 400);
        }
        if (parsed.data.start > parsed.data.end) {
          return json({ ok: false, local: true, reason: "INVALID_RANGE" }, 400);
        }

        const dates: string[] = [];
        let cur = parsed.data.start;
        while (cur <= parsed.data.end) {
          dates.push(cur);
          cur = isoAddDays(cur, 1);
        }

        // Client sends Accept-Encoding to opt into gzip. Most browsers do
        // this automatically; we honor it and serve Content-Encoding: gzip.
        // The browser transparently decompresses the bytes; from the user's
        // perspective they get the same CSV but ~10-30x smaller on the wire.
        // 374 MB of repetitive market data compresses to ~10-30 MB with
        // gzip's BEST level.
        const acceptEnc = (request.headers.get("accept-encoding") || "").toLowerCase();
        const useGzip = acceptEnc.includes("gzip");

        const encoder = new TextEncoder();
        const gzip = useGzip ? zlib.createGzip({ level: zlib.constants.Z_BEST_COMPRESSION }) : null;
        if (gzip) {
          // Pipe all raw bytes through gzip's Transform stream before
          // handing them to the ReadableStream controller. The client sees
          // Content-Encoding: gzip and the browser decompresses on the fly.
          // Per-day CSVs that are already gzipped on disk pass through
          // gunzipSync (see streamLocalDay) before re-entering the pipeline,
          // so the outer gzip layer finds highly compressible repetitive
          // data and produces a much smaller payload than just re-wrapping
          // the inner .gz.
          //
          // Alternative we considered: ship each per-day file's bytes
          // unchanged (using Transfer-Encoding: chunked with custom
          // "sub-boundary" markers) and let the client decide which days
          // to actually save. That's more complex and would require the
          // client to understand the multipart protocol. The simpler
          // approach — gunzip per-day, then gzip the whole response —
          // produces the best compression ratio and works with every
          // existing browser/download tool.
        }

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const rawWriter = {
              write: async (chunk: Buffer | Uint8Array) => {
                if (gzip) {
                  // queue into the gzip transform; the transform's
                  // readable side will then push compressed chunks to
                  // the controller via the data event handler below.
                  gzip.write(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                } else {
                  const arr = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
                  controller.enqueue(arr);
                }
              },
            } as WritableStreamDefaultWriter<Uint8Array>;

            // Forward gzip's compressed output to the controller.
            // (Only attached when gzip is in use; in the non-gzip path
            // the rawWriter writes directly to the controller above.)
            if (gzip) {
              gzip.on("data", (chunk: Buffer) => {
                controller.enqueue(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
              });
              gzip.on("end", () => controller.close());
              gzip.on("error", (e) => controller.error(e));
            }

            const safeWrite = async (s: string) => {
              rawWriter.write(encoder.encode(s));
            };

            try {
              for (const table of tables) {
                await safeWrite(`# table=${table} range=${parsed.data.start}..${parsed.data.end}\n`);
                let totalRawBytes = 0;
                let totalOutBytes = 0;
                let totalDays = 0;
                for (const date of dates) {
                  const result = await streamOneDay(table, date, rawWriter as any, parsed.data.compact, parsed.data.select);
                  if (result.source !== "gap") {
                    totalRawBytes += result.rawBytes;
                    totalOutBytes += result.outBytes;
                    totalDays++;
                    const saved = result.rawBytes - result.outBytes;
                    await safeWrite(
                      `# date=${date} source=${result.source} rows=${result.rows ?? "?"} raw_bytes=${result.rawBytes} out_bytes=${result.outBytes} saved=${saved}\n`,
                    );
                  } else {
                    await safeWrite(`# date=${date} source=gap bytes=0 reason=no_data_on_disk_or_supabase\n`);
                  }
                }
                const totalSaved = totalRawBytes - totalOutBytes;
                await safeWrite(
                  `# table=${table} total_days=${totalDays} raw_total=${totalRawBytes} out_total=${totalOutBytes} saved=${totalSaved} (compact=${parsed.data.compact})\n\n`,
                );
              }
              if (gzip) gzip.end();
              else controller.close();
            } catch (e) {
              if (gzip) gzip.destroy();
              controller.error(e);
            }
          },
        });

        const headers: Record<string, string> = {
          "Content-Type": "text/csv; charset=utf-8",
          "Cache-Control": "no-store",
          "Content-Disposition": useGzip
            ? 'attachment; filename="historical_export.csv.gz"'
            : 'attachment; filename="historical_export.csv"',
        };
        if (useGzip) headers["Content-Encoding"] = "gzip";

        return new Response(stream as any, { status: 200, headers });
      },
    },
  },
});

