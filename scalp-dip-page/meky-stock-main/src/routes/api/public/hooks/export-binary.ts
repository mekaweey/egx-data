// export-binary.ts
//
// Lossless, custom binary export. Pure Node.js — no native deps.
//
// Format (MKB2, "MeKy Binary v2"):
//   4 bytes  : magic 'MKB2'
//   then a sequence of self-describing sections, one per table×date:
//     uvarint : table name length + UTF-8 bytes
//     uvarint : date length + UTF-8 bytes
//     uvarint : row count n
//     uvarint : column count
//     uvarint : compressed body length
//     N bytes : body = zlib deflate(level 9) of the column records:
//               per column: uvarint name length + name + 1 tag byte +
//               null bitmap (ceil(n/8) bytes) + payload of non-null values.
//
// Lossless guarantees (the whole point of v2):
//   - Every cell is reproduced EXACTLY as its original string. A column
//     is encoded as int/float/bool ONLY if every non-empty value is
//     canonical AND round-trips (String(BigInt(v)) === v,
//     String(Number(v)) === v); otherwise it stays a string column.
//   - Empty cells are stored via a per-column null bitmap — never
//     coerced to 0 and never conflated with a real value.
//   - Integers use BigInt end-to-end (no 32-bit overflow) with int64
//     range checks; deltas are zigzag LEB128.
//   - Strings are length-prefixed UTF-8, dictionary-encoded when
//     repetitive.
//
// Memory: fully streaming and pull-based — one day file plus its column
// arrays are in memory at a time, then the encoded section is flushed to
// the client. Nothing accumulates, so year-long ranges are safe.
//
// Transport: no Content-Encoding — each section body is already deflated
// internally, and keeping the wire uncompressed guarantees the file the
// browser saves is byte-identical to what we send (no transparent
// gunzip mismatch).
//
// Local-only: like the other hooks, refuses to run on production.

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";
import { DATA_TABLE_NAMES } from "@/lib/data-tables.config";
import { isLocalRuntime, ARCHIVE_ROOT } from "@/lib/history-export.server";

const BodySchema = z.object({
  tables: z.array(z.string().trim().min(1)).min(1).max(10),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const ALLOWED = DATA_TABLE_NAMES;
const MAGIC = Buffer.from("MKB2", "ascii");

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
    } else if (ALLOWED.includes(name)) set.add(name);
  }
  return ALLOWED.filter((t) => set.has(t));
}

// === CSV line parser (handles quoted fields with embedded commas/newlines) ===
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
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

// Split text into CSV lines, honoring double-quoted fields so a raw
// newline inside a quoted value never splits a row in two. Doubled
// quotes ("") toggle twice, leaving the in-quote state unchanged.
function splitCsvLines(text: string): string[] {
  const lines: string[] = [];
  const len = text.length;
  let start = 0;
  let inQ = false;
  for (let i = 0; i < len; i++) {
    const c = text.charCodeAt(i);
    if (c === 34) inQ = !inQ;
    else if (c === 10 && !inQ) {
      let end = i;
      if (end > start && text.charCodeAt(end - 1) === 13) end--;
      lines.push(text.slice(start, end));
      start = i + 1;
    }
  }
  if (start < len) {
    let end = len;
    if (end > start && text.charCodeAt(end - 1) === 13) end--;
    const last = text.slice(start, end);
    if (last.length > 0) lines.push(last);
  }
  return lines;
}

// === Unsigned LEB128 (lengths, counts, dictionary ids) ===
function uvarint(v: number): Buffer {
  const out: number[] = [];
  let x = v;
  do {
    let b = x % 128;
    x = Math.floor(x / 128);
    if (x > 0) b |= 0x80;
    out.push(b);
  } while (x > 0);
  return Buffer.from(out);
}

// === MKB2 column tags (written into the deflated section body) ===
const TAG_DICT = 0x01; // strings: uvarint dict size + entries, then ids
const TAG_PLAIN = 0x02; // strings: uvarint byte len + utf-8 bytes each
const TAG_INT_DELTA = 0x10; // int64: 8-byte BE seed + zigzag varint deltas
const TAG_INT_DIRECT = 0x11; // int64: zigzag varint each
const TAG_FLOAT = 0x20; // float64: 8-byte BE double each
const TAG_BOOL = 0x30; // bool: ceil(nn/8) packed bits of non-null rows

const INT_RE = /^-?\d+$/;
const INT64_MIN = -9223372036854775808n;
const INT64_MAX = 9223372036854775807n;

// Growable byte sink. A single day can hold hundreds of thousands of
// values; allocating one tiny Buffer per value would create millions of
// objects and crush the GC. This keeps only ~1 MB chunks alive.
class ByteSink {
  private chunks: Buffer[] = [];
  private cur: Buffer = Buffer.allocUnsafe(1 << 20);
  private used = 0;

  private ensure(extra: number) {
    if (this.used + extra <= this.cur.length) return;
    this.chunks.push(this.cur.subarray(0, this.used));
    this.cur = Buffer.allocUnsafe(Math.max(1 << 20, extra));
    this.used = 0;
  }
  pushBuf(b: Buffer): this {
    this.ensure(b.length);
    b.copy(this.cur, this.used);
    this.used += b.length;
    return this;
  }
  pushByte(b: number): this {
    this.ensure(1);
    this.cur[this.used++] = b;
    return this;
  }
  pushUvar(v: number): this {
    this.ensure(10);
    let x = v;
    do {
      let byte = x % 128;
      x = Math.floor(x / 128);
      if (x > 0) byte |= 0x80;
      this.cur[this.used++] = byte;
    } while (x > 0);
    return this;
  }
  pushSvar(v: bigint): this {
    this.ensure(10);
    const zz = v >= 0n ? v << 1n : (-v << 1n) - 1n;
    let x = zz;
    do {
      let byte = Number(x & 0x7fn);
      x >>= 7n;
      if (x > 0n) byte |= 0x80;
      this.cur[this.used++] = byte;
    } while (x > 0n);
    return this;
  }
  finish(): Buffer {
    this.chunks.push(this.cur.subarray(0, this.used));
    const out = Buffer.concat(this.chunks);
    this.chunks = [];
    this.cur = Buffer.alloc(0);
    this.used = 0;
    return out;
  }
}

// The core lossless guarantee: a column is stored in a typed form ONLY
// when every non-empty cell can be reproduced exactly from it. Detection
// runs over the WHOLE column (no sampling). Anything that cannot
// round-trip falls back to strings, which always can. Empty cells are
// nulls — tracked in a bitmap, never coerced to a value.
function encodeColumn(sink: ByteSink, values: string[]): number {
  const n = values.length;

  // Null bitmap: bit i set => row i is an empty cell.
  const nullBits = Buffer.alloc(Math.ceil(n / 8));
  let nn = 0;
  for (let i = 0; i < n; i++) {
    if (values[i] === "") nullBits[i >> 3] |= 1 << (i % 8);
    else nn++;
  }

  // Whole-column type detection with exact round-trip requirements.
  let allBool = true;
  let allInt = true;
  let allFloat = true;
  if (nn === 0) {
    allBool = allInt = allFloat = false;
  } else {
    for (let i = 0; i < n; i++) {
      const v = values[i];
      if (v === "") continue;
      if (v !== "true" && v !== "false") allBool = false;
      if (!INT_RE.test(v)) allInt = false;
      const num = Number(v);
      // "85.50", "007", "1e5", " 5", "+5" all fail this and stay strings.
      if (!Number.isFinite(num) || String(num) !== v) {
        allFloat = false;
        allInt = false;
      }
    }
  }

  // Parse integers once; verify canonical form + int64 range.
  let ints: (bigint | null)[] | null = null;
  let monotonic = true;
  if (allInt) {
    const arr: (bigint | null)[] = new Array(n);
    let ok = true;
    let prev: bigint | null = null;
    for (let i = 0; i < n; i++) {
      const v = values[i];
      if (v === "") {
        arr[i] = null;
        continue;
      }
      const b = BigInt(v);
      if (String(b) !== v || b < INT64_MIN || b > INT64_MAX) {
        ok = false;
        break;
      }
      arr[i] = b;
      if (prev !== null && b < prev) monotonic = false;
      prev = b;
    }
    if (ok) ints = arr;
    else allInt = false;
  }

  if (allBool) {
    const packed = Buffer.alloc(Math.ceil(nn / 8));
    let k = 0;
    for (let i = 0; i < n; i++) {
      const v = values[i];
      if (v === "") continue;
      if (v === "true") packed[k >> 3] |= 1 << (k % 8);
      k++;
    }
    sink.pushByte(TAG_BOOL).pushBuf(nullBits).pushBuf(packed);
    return TAG_BOOL;
  }

  if (allInt && ints) {
    if (monotonic) {
      // Delta chain: monotonic ids / row numbers compress to ~1 byte/row.
      let first = 0n;
      let firstIdx = -1;
      for (let i = 0; i < n; i++) {
        if (ints[i] !== null) {
          first = ints[i]!;
          firstIdx = i;
          break;
        }
      }
      const seed = Buffer.alloc(8);
      seed.writeBigInt64BE(first);
      sink.pushByte(TAG_INT_DELTA).pushBuf(nullBits).pushBuf(seed);
      let prev = first;
      for (let i = firstIdx + 1; i < n; i++) {
        const cur = ints[i];
        if (cur === null) continue;
        sink.pushSvar(cur - prev);
        prev = cur;
      }
      return TAG_INT_DELTA;
    }
    sink.pushByte(TAG_INT_DIRECT).pushBuf(nullBits);
    for (let i = 0; i < n; i++) {
      const b = ints[i];
      if (b === null) continue;
      sink.pushSvar(b);
    }
    return TAG_INT_DIRECT;
  }

  if (allFloat) {
    const buf = Buffer.alloc(8 * nn);
    let k = 0;
    for (let i = 0; i < n; i++) {
      const v = values[i];
      if (v === "") continue;
      buf.writeDoubleBE(Number(v), k * 8);
      k++;
    }
    sink.pushByte(TAG_FLOAT).pushBuf(nullBits).pushBuf(buf);
    return TAG_FLOAT;
  }

  // Strings: dictionary when repetitive, otherwise length-prefixed.
  const uniq = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    const v = values[i];
    if (v === "") continue;
    if (!uniq.has(v)) uniq.set(v, uniq.size);
  }
  if (uniq.size > 0 && uniq.size <= Math.max(64, Math.floor(n * 0.1))) {
    sink.pushByte(TAG_DICT).pushBuf(nullBits).pushUvar(uniq.size);
    for (const s of uniq.keys()) {
      const b = Buffer.from(s, "utf-8");
      sink.pushUvar(b.length).pushBuf(b);
    }
    for (let i = 0; i < n; i++) {
      const v = values[i];
      if (v === "") continue;
      sink.pushUvar(uniq.get(v)!);
    }
    return TAG_DICT;
  }
  sink.pushByte(TAG_PLAIN).pushBuf(nullBits);
  for (let i = 0; i < n; i++) {
    const v = values[i];
    if (v === "") continue;
    const b = Buffer.from(v, "utf-8");
    sink.pushUvar(b.length).pushBuf(b);
  }
  return TAG_PLAIN;
}

function encodeTableCsv(csvText: string): { n: number; columns: string[]; body: Buffer } {
  const lines = splitCsvLines(csvText);
  if (lines.length === 0) return { n: 0, columns: [], body: Buffer.alloc(0) };
  const header = parseCsvLine(lines[0]);
  const n = lines.length - 1;
  const cols: string[][] = header.map(() => []);
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    for (let j = 0; j < header.length; j++) cols[j].push(cells[j] ?? "");
  }
  const sink = new ByteSink();
  for (let j = 0; j < header.length; j++) {
    const nb = Buffer.from(header[j], "utf-8");
    sink.pushUvar(nb.length).pushBuf(nb);
    encodeColumn(sink, cols[j]);
  }
  return { n, columns: header, body: zlib.deflateSync(sink.finish(), { level: 9 }) };
}

async function readDayFile(table: string, date: string): Promise<Buffer | null> {
  const csvFp = path.join(ARCHIVE_ROOT, table, `${date}.csv`);
  const gzFp = path.join(ARCHIVE_ROOT, table, `${date}.csv.gz`);
  if (fs.existsSync(csvFp)) return fs.readFileSync(csvFp);
  if (fs.existsSync(gzFp)) return zlib.gunzipSync(fs.readFileSync(gzFp));
  return null;
}

export const Route = createFileRoute("/api/public/hooks/export-binary")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204 }),
      GET: async () => {
        const local = await isLocalRuntime();
        return json({ local, reason: local ? null : "PROD" });
      },
      POST: async ({ request }) => {
        const local = await isLocalRuntime();
        if (!local) return json({ ok: false, local: false, reason: "PROD" }, 200);

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ ok: false, local: true, reason: "BAD_JSON" }, 400);
        }
        const parsed = BodySchema.safeParse(raw);
        if (!parsed.success) return json({ ok: false, local: true, reason: "BAD_BODY" }, 400);
        const tables = expandTables(parsed.data.tables);
        if (tables.length === 0) return json({ ok: false, local: true, reason: "NO_TABLE" }, 400);
        if (parsed.data.start > parsed.data.end)
          return json({ ok: false, local: true, reason: "INVALID_RANGE" }, 400);

        const dates: string[] = [];
        let cur = parsed.data.start;
        while (cur <= parsed.data.end) {
          dates.push(cur);
          cur = isoAddDays(cur, 1);
        }

        // Pull-based streaming: pull() runs only when the client is ready
        // for more bytes, so at most ONE day file is parsed/encoded at a
        // time and nothing accumulates server-side — year-long ranges are
        // as safe as single-day ones.
        let tableIdx = 0;
        let dateIdx = 0;
        let wroteMagic = false;
        let closed = false;
        // STAGE D: after all table-day sections, append ONE extra section named
        // "_quality" containing the per-symbol data-quality companion CSV for
        // the whole range (self-describing: the existing decoder emits it as
        // _quality__{start}.csv without any changes — purely additive).
        let qualityQueued = false;

        const stream = new ReadableStream<Uint8Array>({
          async pull(controller) {
            try {
              if (!wroteMagic) {
                wroteMagic = true;
                controller.enqueue(new Uint8Array(MAGIC));
                return;
              }
              while (tableIdx < tables.length) {
                const table = tables[tableIdx];
                const date = dates[dateIdx];
                dateIdx++;
                if (dateIdx >= dates.length) {
                  dateIdx = 0;
                  tableIdx++;
                }
                const buf = await readDayFile(table, date);
                if (!buf) continue; // day absent from the archive: skip
                const enc = encodeTableCsv(buf.toString("utf-8"));
                if (enc.columns.length === 0) continue; // 0-byte file: skip
                const nameB = Buffer.from(table, "utf-8");
                const dateB = Buffer.from(date, "utf-8");
                const section = Buffer.concat([
                  uvarint(nameB.length),
                  nameB,
                  uvarint(dateB.length),
                  dateB,
                  uvarint(enc.n),
                  uvarint(enc.columns.length),
                  uvarint(enc.body.length),
                  enc.body,
                ]);
                controller.enqueue(
                  new Uint8Array(section.buffer, section.byteOffset, section.byteLength),
                );
                return;
              }
              if (!closed) {
                if (!qualityQueued) {
                  qualityQueued = true;
                  // Build the quality companion CSV for this export range from
                  // the {date}.quality.json companions (same shape as the
                  // unified export's qualityCsv, but ONE section for the
                  // entire range). If none exist, skip the section entirely.
                  const qRows: string[] = [];
                  for (const table of tables) {
                    for (const date of dates) {
                      const qp = path.join(ARCHIVE_ROOT, table, `${date}.quality.json`);
                      if (!fs.existsSync(qp)) continue;
                      try {
                        const q = JSON.parse(fs.readFileSync(qp, "utf-8")) as {
                          symbols?: Array<{
                            symbol: string; firstTickCairo: string | null; lastTickCairo: string | null;
                            openReliable: boolean; closeReliable: boolean;
                            fullSessionReliable: boolean; likelyReason: string | null;
                          }>;
                        };
                        for (const s of q.symbols ?? []) {
                          qRows.push([
                            date, table, s.symbol,
                            s.firstTickCairo ?? "", s.lastTickCairo ?? "",
                            s.openReliable, s.closeReliable, s.fullSessionReliable,
                            s.likelyReason ?? "",
                          ].join(","));
                        }
                      } catch { /* malformed: skip */ }
                    }
                  }
                  if (qRows.length > 0) {
                    const qCsv = [
                      "date,table,symbol,first_tick,last_tick,open_reliable,close_reliable,full_session_reliable,likely_reason",
                      ...qRows,
                    ].join("\n") + "\n";
                    const enc = encodeTableCsv(qCsv);
                    const nameB = Buffer.from("_quality", "utf-8");
                    const dateB = Buffer.from(parsed.data.start, "utf-8");
                    const section = Buffer.concat([
                      uvarint(nameB.length),
                      nameB,
                      uvarint(dateB.length),
                      dateB,
                      uvarint(enc.n),
                      uvarint(enc.columns.length),
                      uvarint(enc.body.length),
                      enc.body,
                    ]);
                    controller.enqueue(
                      new Uint8Array(section.buffer, section.byteOffset, section.byteLength),
                    );
                    return;
                  }
                }
                closed = true;
                controller.close();
              }
            } catch (e) {
              if (!closed) {
                closed = true;
                controller.error(e);
              }
            }
          },
        });

        const headers: Record<string, string> = {
          "Content-Type": "application/octet-stream",
          "Cache-Control": "no-store",
          "Content-Disposition": 'attachment; filename="historical_export.mkb2"',
        };
        return new Response(stream as any, { status: 200, headers });
      },
    },
  },
});
