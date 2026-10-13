/**
 * Server-only module: Supabase archival with gzip compression and progress streaming.
 * Mirrors scripts/daily-archive.ts logic — exports old rows to CSV + .csv.gz, then deletes.
 *
 * SAFETY CONTRACT:
 *   * Always exports to CSV + .csv.gz BEFORE deleting from Supabase.
 *   * Never deletes rows that weren't successfully exported.
 *   * Supports dry-run mode (no deletions).
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ARCHIVE_ROOT } from "@/lib/history-export.server";
import { DATA_TABLES, DATA_TABLE_NAMES } from "@/lib/data-tables.config";

// --- Table configs (single source of truth: data-tables.config.ts) ---
const TARGET_TABLES: string[] = DATA_TABLE_NAMES;

const EXPORT_LOG_PATH = ARCHIVE_ROOT + "/_exports_log.csv";

// --- Lazy module loading (mirrors history-export.server.ts pattern) ---
// This ensures node:fs is only loaded in a Node.js runtime, not in edge/browser builds.
let _fsP: Promise<typeof import("node:fs")> | null = null;
let _pathP: Promise<typeof import("node:path")> | null = null;
let _zlibP: Promise<typeof import("node:zlib")> | null = null;

async function fs(): Promise<typeof import("node:fs")> {
  if (!_fsP) {
    _fsP = Promise.resolve()
      .then(() => import("node:fs"))
      .catch(() => import("fs")) as Promise<typeof import("node:fs")>;
  }
  return _fsP;
}

async function pth(): Promise<typeof import("node:path")> {
  if (!_pathP) {
    _pathP = Promise.resolve().then(() => import("node:path")) as Promise<
      typeof import("node:path")
    >;
  }
  return _pathP;
}

async function zlib(): Promise<typeof import("node:zlib")> {
  if (!_zlibP) {
    _zlibP = Promise.resolve()
      .then(() => import("node:zlib"))
      .catch(() => import("zlib")) as Promise<typeof import("node:zlib")>;
  }
  return _zlibP;
}

// --- Progress event types ---
export interface DbSizeInfo {
  pretty: string;
  bytes: number;
}

export interface TableSummary {
  table: string;
  totalInDb: number;
  olderThan2Days: number;
  rowsExported: number;
  rowsDeleted: number;
  partitionsAffected: string[];
  errors?: string;
  /**
   * Absolute path to a JSON file containing the EXACT list of deleted row
   * IDs for this table on this run. Populated only when rowsDeleted > 0
   * and dryRun=false. Required for future ID-level audits.
   */
  idsLogPath?: string;
}

export interface ArchiveSummary {
  success: boolean;
  startTime: string;
  endTime: string;
  cutoffDate: string;
  dbSizeBefore: DbSizeInfo;
  dbSizeAfter: DbSizeInfo;
  spaceFreedBytes: number;
  tables: TableSummary[];
  archiveDir: string;
  vacuumSuccess?: boolean;
  vacuumTables?: Array<{
    table: string;
    vacuumed: boolean;
    message?: string;
  }>;
}

export interface ProgressEvent {
  type: "table_start" | "table_progress" | "table_done" | "all_done" | "error";
  table?: string;
  phase?: "fetch" | "export" | "verify" | "delete" | "vacuum";
  totalRows?: number;
  eligibleRows?: number;
  fetchedRows?: number;
  exportedRows?: number;
  deletedRows?: number;
  currentTable?: number;
  totalTables?: number;
  dbSize?: DbSizeInfo;
  summary?: ArchiveSummary;
  error?: string;
}

export type ProgressCallback = (event: ProgressEvent) => void;

// --- CSV helpers (identical to scripts/daily-archive.ts) ---
function formatCSVValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "object") {
    const json = JSON.stringify(val);
    return '"' + json.replace(/"/g, '""') + '"';
  }
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        result.push(cur);
        cur = "";
      } else {
        cur += c;
      }
    }
  }
  result.push(cur);
  return result;
}

interface ExistingSignatures {
  headers: string[];
  keys: Set<string>;
}

function loadExistingSignatures(
  filePath: string,
  headerCols: string[],
  pkCols: string[],
  fsModule: typeof import("node:fs"),
): ExistingSignatures {
  if (!fsModule.existsSync(filePath)) {
    return { headers: headerCols, keys: new Set() };
  }
  const content = fsModule.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { headers: headerCols, keys: new Set() };
  }

  const existingHeaders = parseCSVLine(lines[0]);
  const pkIndices = pkCols.map((pk) => existingHeaders.indexOf(pk));
  const hasAllPks = pkIndices.every((idx) => idx !== -1);

  const keys = new Set<string>();
  for (let i = 1; i < lines.length; i++) {
    const parsed = parseCSVLine(lines[i]);
    if (hasAllPks) {
      const key = pkIndices.map((idx) => parsed[idx] ?? "").join(":::");
      keys.add(key);
    } else {
      keys.add(lines[i]);
    }
  }
  return { headers: existingHeaders, keys };
}

// --- Format bytes to human-readable ---
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// --- Get current database size via Supabase RPC ---
async function getDbSize(): Promise<DbSizeInfo> {
  try {
    const { data, error } = await supabaseAdmin.rpc("get_db_size" as any);
    if (error) {
      console.log(`  [archive] get_db_size error: ${error.message}`);
      return { pretty: "N/A", bytes: 0 };
    }
    const row = (data ?? [])[0] as { total_bytes: number; human_size: string } | undefined;
    if (!row) {
      return { pretty: "N/A", bytes: 0 };
    }
    return {
      pretty: row.human_size ?? formatBytes(row.total_bytes),
      bytes: row.total_bytes,
    };
  } catch (e) {
    console.log(`  [archive] get_db_size exception: ${e}`);
    return { pretty: "N/A", bytes: 0 };
  }
}

// --- Write gzip-compressed copy alongside CSV ---
function writeGzipCopy(
  csvPath: string,
  csvContent: string,
  fsModule: typeof import("node:fs"),
  zlibModule: typeof import("node:zlib"),
): string {
  const gzPath = csvPath + ".gz";
  const compressed = zlibModule.gzipSync(Buffer.from(csvContent, "utf-8"));
  fsModule.writeFileSync(gzPath, compressed);
  return gzPath;
}

// --- Append archive log entry ---
function appendExportLog(
  logPath: string,
  entries: TableSummary[],
  runTimestamp: string,
  dryRun: boolean,
  fsModule: typeof import("node:fs"),
): void {
  const headers =
    "run_timestamp,table_name,total_db_rows,older_than_2_days,rows_exported,rows_deleted,dry_run,partitions_affected,ids_log_path\n";
  const rows =
    entries
      .map((s) =>
        [
          runTimestamp,
          s.table,
          s.totalInDb,
          s.olderThan2Days,
          s.rowsExported,
          s.rowsDeleted,
          dryRun ? "TRUE" : "FALSE",
          '"' + (s.partitionsAffected ?? []).join(";") + '"',
          '"' + (s.idsLogPath ?? "") + '"',
        ].join(","),
      )
      .join("\n") + "\n";

  if (!fsModule.existsSync(logPath)) {
    fsModule.writeFileSync(logPath, headers + rows, "utf-8");
  } else {
    fsModule.appendFileSync(logPath, rows, "utf-8");
  }
}

/**
 * Write the exact list of deleted row IDs to a JSON file in the archive root.
 * Required for future ID-level verification (set-level proof is not enough).
 *
 * File format:
 *   {
 *     runTimestamp: ISO,
 *     table: string,
 *     cutoffDate: ISO,
 *     deletedCount: number,
 *     deletedIds: number[]
 *   }
 *
 * Returns the absolute path to the written file.
 */
function writeDeletedIdsLog(
  fsModule: typeof import("node:fs"),
  archiveRoot: string,
  runTimestamp: string,
  tableName: string,
  cutoffIso: string,
  deletedIds: number[],
): string {
  const dir = `${archiveRoot}/_deleted_ids`;
  if (!fsModule.existsSync(dir)) fsModule.mkdirSync(dir, { recursive: true });
  // Sanitize runTimestamp for filename:
  //   2026-08-27T13:30:19.708Z -> 20260827T133019708Z
  const safeTs = runTimestamp
    .replace(/[-:]/g, "")
    .replace(/\./g, "")
    .replace(/Z$/, "Z");
  const filePath = `${dir}/${tableName}_${safeTs}.json`;
  const payload = {
    runTimestamp,
    table: tableName,
    cutoffDate: cutoffIso,
    deletedCount: deletedIds.length,
    deletedIds,
  };
  fsModule.writeFileSync(filePath, JSON.stringify(payload), "utf-8");
  return filePath;
}

/**
 * Run a full archival cycle: fetch old rows → export to CSV + .csv.gz → delete from Supabase.
 *
 * @param opts.dryRun         If true, no deletions and no file writes (read-only simulation).
 * @param opts.olderThanHours Rows older than this many hours are eligible (default 48 / 2 days).
 * @param opts.onProgress     Called with real-time progress events for SSE streaming.
 */
/**
 * Run VACUUM FULL ANALYZE on all target data tables via Supabase RPC.
 * Reclaims disk space after bulk deletions. Errors are logged but do not
 * fail the archive — export + delete are the critical steps.
 */
async function runVacuumFull(): Promise<{
  success: boolean;
  tables: Array<{ table: string; vacuumed: boolean; message?: string }>;
}> {
  const vacuumTables: Array<{ table: string; vacuumed: boolean; message?: string }> = [];
  let overallSuccess = true;

  const { data, error } = await supabaseAdmin.rpc("vacuum_full_data_tables" as any);

  if (error) {
    console.log(`  [archive] VACUUM FULL RPC error: ${error.message}`);
    for (const tableName of TARGET_TABLES) {
      vacuumTables.push({ table: tableName, vacuumed: false, message: error.message });
    }
    return { success: false, tables: vacuumTables };
  }

  if (data && Array.isArray(data)) {
    for (const row of data as Array<{ table_name: string; vacuumed: boolean; message?: string }>) {
      vacuumTables.push({
        table: row.table_name,
        vacuumed: row.vacuumed,
        message: row.message,
      });
      if (!row.vacuumed) overallSuccess = false;
    }
  }

  if (vacuumTables.length === 0) {
    vacuumTables.push({ table: "all", vacuumed: true });
  }

  return { success: overallSuccess, tables: vacuumTables };
}

export async function runArchive(opts?: {
  olderThanHours?: number;
  onProgress?: ProgressCallback;
  dryRun?: boolean;
}): Promise<ArchiveSummary> {
  const dryRun = opts?.dryRun ?? true;
  const olderThanHours = opts?.olderThanHours ?? 48;
  const onProgress = opts?.onProgress;
  const startTime = new Date().toISOString();

  const m = await fs();
  const p = await pth();
  const z = await zlib();

  if (!m.existsSync(ARCHIVE_ROOT)) {
    m.mkdirSync(ARCHIVE_ROOT, { recursive: true });
  }

  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);
  const cutoffIso = cutoffDate.toISOString();

  const dbSizeBefore = await getDbSize();
  onProgress?.({ type: "table_progress", dbSize: dbSizeBefore });

  const tableSummaries: TableSummary[] = [];

  for (let tableIdx = 0; tableIdx < TARGET_TABLES.length; tableIdx++) {
    const tableName = TARGET_TABLES[tableIdx];
    const dataCfg = DATA_TABLES[tableName] || { timestampCol: "created_at" };
    const cfg = { timestampCol: dataCfg.timestampCol, pkCols: ["id"] };

    onProgress?.({
      type: "table_start",
      table: tableName,
      currentTable: tableIdx + 1,
      totalTables: TARGET_TABLES.length,
    });

    const tableDir = p.join(ARCHIVE_ROOT, tableName);
    if (!m.existsSync(tableDir)) {
      m.mkdirSync(tableDir, { recursive: true });
    }

    let tsCol = cfg.timestampCol;

    // 1. Total count
    let { count: totalDbCount, error: countErr } = await supabaseAdmin
      .from(tableName as any)
      .select("*", { count: "exact", head: true });

    onProgress?.({
      type: "table_progress",
      table: tableName,
      phase: "fetch",
      totalRows: totalDbCount ?? 0,
    });

    if (countErr) {
      console.log(`  [archive] Error querying total count for ${tableName}: ${countErr.message}`);
      tableSummaries.push({
        table: tableName,
        totalInDb: -1,
        olderThan2Days: 0,
        rowsExported: 0,
        rowsDeleted: 0,
        partitionsAffected: [],
        errors: countErr.message,
      });
      onProgress?.({
        type: "table_done",
        table: tableName,
        totalRows: 0,
        eligibleRows: 0,
        exportedRows: 0,
        deletedRows: 0,
      });
      continue;
    }

    if (!totalDbCount || totalDbCount === 0) {
      tableSummaries.push({
        table: tableName,
        totalInDb: totalDbCount ?? 0,
        olderThan2Days: 0,
        rowsExported: 0,
        rowsDeleted: 0,
        partitionsAffected: [],
      });
      onProgress?.({
        type: "table_done",
        table: tableName,
        totalRows: totalDbCount ?? 0,
        eligibleRows: 0,
        exportedRows: 0,
        deletedRows: 0,
      });
      continue;
    }

    // 2. Eligible count (rows older than cutoff)
    let { count: oldRowsCount, error: oldErr } = await supabaseAdmin
      .from(tableName as any)
      .select("*", { count: "exact", head: true })
      .lt(tsCol, cutoffIso);

    // Fallback: try created_at if configured column doesn't work
    if (oldErr && tsCol !== "created_at") {
      const fallback = await supabaseAdmin
        .from(tableName as any)
        .select("*", { count: "exact", head: true })
        .lt("created_at", cutoffIso);
      if (!fallback.error) {
        tsCol = "created_at";
        oldRowsCount = fallback.count;
        oldErr = null;
      }
    }

    onProgress?.({
      type: "table_progress",
      table: tableName,
      phase: "fetch",
      eligibleRows: oldRowsCount ?? 0,
    });

    if (oldErr) {
      console.log(`  [archive] Error querying older rows for ${tableName}: ${oldErr.message}`);
      tableSummaries.push({
        table: tableName,
        totalInDb: totalDbCount ?? 0,
        olderThan2Days: 0,
        rowsExported: 0,
        rowsDeleted: 0,
        partitionsAffected: [],
        errors: oldErr.message,
      });
      onProgress?.({
        type: "table_done",
        table: tableName,
        totalRows: totalDbCount ?? 0,
        eligibleRows: 0,
        exportedRows: 0,
        deletedRows: 0,
      });
      continue;
    }

    if (!oldRowsCount || oldRowsCount === 0) {
      tableSummaries.push({
        table: tableName,
        totalInDb: totalDbCount ?? 0,
        olderThan2Days: 0,
        rowsExported: 0,
        rowsDeleted: 0,
        partitionsAffected: [],
      });
      onProgress?.({
        type: "table_done",
        table: tableName,
        totalRows: totalDbCount ?? 0,
        eligibleRows: 0,
        exportedRows: 0,
        deletedRows: 0,
      });
      continue;
    }

    // 3. Fetch all eligible rows (paginated, 1000 per page)
    const PAGE_SIZE = 1000;
    let fetched = 0;
    const allEligibleRows: Record<string, unknown>[] = [];

    while (fetched < oldRowsCount!) {
      const { data: pageData, error: pageErr } = await supabaseAdmin
        .from(tableName as any)
        .select("*")
        .lt(tsCol, cutoffIso)
        .order(tsCol, { ascending: true })
        .range(fetched, fetched + PAGE_SIZE - 1);

      if (pageErr) {
        console.log(`  [archive] Fetch error at ${fetched} for ${tableName}: ${pageErr.message}`);
        onProgress?.({
          type: "table_progress",
          table: tableName,
          phase: "fetch",
          fetchedRows: fetched,
          error: pageErr.message,
        });
        break;
      }
      if (!pageData || pageData.length === 0) break;
      for (let i = 0; i < pageData.length; i++) {
        allEligibleRows[allEligibleRows.length] = pageData[i] as unknown as Record<string, unknown>;
      }
      fetched += pageData.length;
      onProgress?.({
        type: "table_progress",
        table: tableName,
        phase: "fetch",
        fetchedRows: fetched,
        eligibleRows: oldRowsCount ?? 0,
      });
    }

    // 4. Partition by date
    const groupedByDate = new Map<string, Record<string, unknown>[]>();
    for (const row of allEligibleRows) {
      const rawDate =
        (row as any)[tsCol] ||
        (row as any)["created_at"] ||
        (row as any)["captured_at"] ||
        (row as any)["timestamp"];
      let dateKey = "unknown_date";
      if (rawDate) {
        try {
          dateKey = new Date(String(rawDate)).toISOString().slice(0, 10);
        } catch {
          dateKey = String(rawDate).slice(0, 10);
        }
      }
      if (!groupedByDate.has(dateKey)) groupedByDate.set(dateKey, []);
      groupedByDate.get(dateKey)!.push(row);
    }

    // 5. Export each partition to a TEMPORARY file (with dedup against the
    //    existing canonical CSV). The canonical file is NOT written until
    //    after the safety check at step 6 confirms every target id is
    //    present in the temp file. This is the structural fix for the
    //    "export-before-delete with meaningless self-verify" bug.
    let totalExportedForTable = 0;
    const affectedPartitions: string[] = [];
    // runId: unique per invocation so concurrent archival runs cannot
    // collide on the same .tmp path.
    const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    // pendingTmpFiles: map of tmpPath -> { canonicalPath, fullContent }.
    // Held until the safety check passes, then atomically renamed to the
    // canonical path. On any failure, kept on disk for forensics.
    const pendingTmpFiles: Array<{ tmpPath: string; canonicalPath: string; fullContent: string }> = [];

    for (const [dateStr, rows] of groupedByDate.entries()) {
      const partitionFileName = `${dateStr}.csv`;
      const partitionFilePath = p.join(tableDir, partitionFileName);
      affectedPartitions.push(partitionFileName);

      const sampleRow = rows[0];
      const headerCols = Object.keys(sampleRow);
      // Load existing sigs from the CANONICAL file (so we dedup against
      // prior exports), but never WRITE to it here.
      const sigs = loadExistingSignatures(partitionFilePath, headerCols, cfg.pkCols, m);
      const targetHeaders = sigs.headers.length > 0 ? sigs.headers : headerCols;
      const newLines: string[] = [];

      for (const r of rows) {
        const pkIndices = cfg.pkCols.map((pk) => targetHeaders.indexOf(pk));
        const hasAllPks = pkIndices.every((idx) => idx !== -1);
        let rowKey = "";
        if (hasAllPks) rowKey = cfg.pkCols.map((pk) => String((r as any)[pk] ?? "")).join(":::");
        const isDup = hasAllPks
          ? sigs.keys.has(rowKey)
          : sigs.keys.has(targetHeaders.map((h) => formatCSVValue((r as any)[h] ?? "")).join(","));
        if (!isDup) {
          newLines.push(targetHeaders.map((h) => formatCSVValue((r as any)[h])).join(","));
          if (hasAllPks) sigs.keys.add(rowKey);
          else
            sigs.keys.add(targetHeaders.map((h) => formatCSVValue((r as any)[h] ?? "")).join(","));
          totalExportedForTable++;
        }
      }

      // ── WRITE TO .tmp ONLY. Canonical file is not touched. ──
      if (!dryRun && newLines.length > 0) {
        let fullContent: string;
        if (!m.existsSync(partitionFilePath)) {
          fullContent = targetHeaders.join(",") + "\n" + newLines.join("\n") + "\n";
        } else {
          // Re-read the canonical file's content (it has the prior exports)
          // and append the new lines. We never write to canonical directly.
          const existing = m.readFileSync(partitionFilePath, "utf-8");
          // Preserve existing content as-is (assumes prior export wrote with
          // a trailing newline). Append the new lines.
          const sep = existing.endsWith("\n") ? "" : "\n";
          fullContent = existing + sep + newLines.join("\n") + "\n";
        }
        const tmpPath = `${partitionFilePath}.tmp.${runId}`;
        m.writeFileSync(tmpPath, fullContent, "utf-8");
        pendingTmpFiles.push({ tmpPath, canonicalPath: partitionFilePath, fullContent });
      }

      onProgress?.({
        type: "table_progress",
        table: tableName,
        phase: "export",
        exportedRows: totalExportedForTable,
        fetchedRows: allEligibleRows.length,
      });
    }

    // 6. Delete (not in dry-run mode)
    let deletedCount = 0;
    if (!dryRun) {
      onProgress?.({ type: "table_progress", table: tableName, phase: "delete", deletedRows: 0 });
      const idsToDelete = allEligibleRows
        .map((r) => (r as any).id)
        .filter((id) => id !== undefined);

      // ── MANDATORY PRE-DELETE VERIFICATION (added 2026-08-27; fixed 2026-08-27) ──
      // Refuse to delete any rows unless every single id in `idsToDelete`
      // can be found in the TEMPORARY .tmp file written during the export
      // phase. The canonical {date}.csv is NOT read or written here — the
      // .tmp file is the only thing that exists, and we verify against it.
      // On success, the .tmp is atomically renamed to the canonical path
      // (which makes the backup visible to future runs and to manual
      // inspection) BEFORE the DELETE runs. On any failure, the .tmp
      // file is kept on disk for forensics and no rows are deleted.
      const m = await fs();
      const p = await pth();
      const tableDir = p.join(ARCHIVE_ROOT, tableName);
      const existingCsvIds = new Set<string>();
      const csvFilesScanned: string[] = [];
      for (const partFile of affectedPartitions) {
        // Find the matching .tmp for this partition (the file we just wrote).
        const matchingTmp = pendingTmpFiles.find(
          (t) => p.basename(t.canonicalPath) === partFile,
        );
        if (!matchingTmp) {
          // No new rows exported for this partition → no .tmp exists.
          // The canonical file may have prior data; do NOT consult it
          // (that would be the old broken behavior). The only way we
          // can have idsToDelete targeting rows NOT in the .tmp is if
          // those rows are already covered by an earlier export. To be
          // safe, we ALSO scan the canonical file for prior coverage.
          const canonical = p.join(tableDir, partFile);
          if (m.existsSync(canonical)) {
            const text = m.readFileSync(canonical, "utf-8");
            const lines = text.split(/\r?\n/);
            if (lines.length >= 2) {
              const header = lines[0].split(",");
              const idIdx = header.indexOf("id");
              if (idIdx >= 0) {
                csvFilesScanned.push(partFile + " (canonical, prior export)");
                for (let li = 1; li < lines.length; li++) {
                  if (!lines[li]) continue;
                  const cols = lines[li].split(",");
                  const id = cols[idIdx];
                  if (id) existingCsvIds.add(id);
                }
              }
            }
          }
          continue;
        }
        const tmpPath = matchingTmp.tmpPath;
        if (!m.existsSync(tmpPath)) {
          throw new Error(
            `[archive] SAFETY ABORT: temp CSV missing for ${tableName}: ${tmpPath}. ` +
            `Refusing to delete ${idsToDelete.length} rows without confirmed backup.`
          );
        }
        const text = m.readFileSync(tmpPath, "utf-8");
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) {
          throw new Error(
            `[archive] SAFETY ABORT: ${tmpPath} is empty (no header). Refusing to delete.`
          );
        }
        const header = lines[0].split(",");
        const idIdx = header.indexOf("id");
        if (idIdx < 0) {
          throw new Error(
            `[archive] SAFETY ABORT: ${tmpPath} has no 'id' column. Refusing to delete.`
          );
        }
        csvFilesScanned.push(partFile + " (tmp)");
        for (let li = 1; li < lines.length; li++) {
          if (!lines[li]) continue;
          const cols = lines[li].split(",");
          const id = cols[idIdx];
          if (id) existingCsvIds.add(id);
        }
      }

      const missingFromBackup: Array<unknown> = [];
      const sampleSize = Math.min(idsToDelete.length, 20);
      const sampleMissing: unknown[] = [];
      for (const id of idsToDelete) {
        if (!existingCsvIds.has(String(id))) {
          missingFromBackup.push(id);
          if (sampleMissing.length < sampleSize) sampleMissing.push(id);
        }
      }
      if (missingFromBackup.length > 0) {
        // Leave .tmp files on disk for forensics. Do NOT delete them.
        throw new Error(
          `[archive] SAFETY ABORT: ${missingFromBackup.length} of ${idsToDelete.length} ` +
          `rows in ${tableName} are NOT in the archive CSVs (scanned: ${csvFilesScanned.join(", ")}). ` +
          `First ${sampleSize} missing ids: ${JSON.stringify(sampleMissing)}. ` +
          `Refusing to delete ANY rows. Temp files preserved at: ${pendingTmpFiles.map((t) => t.tmpPath).join(", ")}.`
        );
      }

      // ── SAFETY CHECK PASSED ──
      // Atomically rename each .tmp to its canonical path, then write
      // the .csv.gz. Only AFTER both succeed do we proceed to DELETE.
      onProgress?.({
        type: "table_progress",
        table: tableName,
        phase: "verify",
        deletedRows: 0,
        exportedRows: totalExportedForTable,
      });
      for (const t of pendingTmpFiles) {
        m.renameSync(t.tmpPath, t.canonicalPath);
        writeGzipCopy(t.canonicalPath, t.fullContent, m, z);
      }
      // ── END MANDATORY PRE-DELETE VERIFICATION ──

      onProgress?.({
        type: "table_progress",
        table: tableName,
        phase: "delete",
        deletedRows: 0,
        exportedRows: totalExportedForTable,
      });

      if (idsToDelete.length > 0) {
        // ── ID-level logging: write the exact list of IDs about to be deleted
        // BEFORE any DELETE fires. This is the audit trail the user requires.
        const pthMod = await pth();
        const fsMod = await import("node:fs");
        const idsLogPath = pthMod.join(
          ARCHIVE_ROOT,
          `deleted_ids_${tableName}_${startTime.replace(/[:.]/g, "-")}.json`,
        );
        try {
          fsMod.writeFileSync(
            idsLogPath,
            JSON.stringify(
              {
                table: tableName,
                startedAt: startTime,
                cutoffIso,
                rowCount: idsToDelete.length,
                ids: idsToDelete,
              },
              null,
              2,
            ),
            "utf8",
          );
          tableSummaries[tableIdx].idsLogPath = idsLogPath;
          console.log(
            `    [archive] Pre-delete ID log: ${idsLogPath} (${idsToDelete.length} ids)`,
          );
        } catch (e) {
          // If we cannot write the audit log, REFUSE to delete. No log = no delete.
          console.error(
            `    [archive] FATAL: failed to write pre-delete ID log: ${(e as Error).message}`,
          );
          throw new Error(
            `Pre-delete ID log could not be written to ${idsLogPath}: ${(e as Error).message}. ` +
              `Aborting delete to prevent unlogged data loss.`,
          );
        }

        const DEL_BATCH = 200;
        for (let i = 0; i < idsToDelete.length; i += DEL_BATCH) {
          const batch = idsToDelete.slice(i, i + DEL_BATCH);
          const { error: delErr } = await supabaseAdmin
            .from(tableName as any)
            .delete()
            .in("id", batch);
          if (delErr)
            console.log(
              `    [archive] Delete batch ${i}-${i + batch.length} error: ${delErr.message}`,
            );
          else {
            deletedCount += batch.length;
            onProgress?.({
              type: "table_progress",
              table: tableName,
              phase: "delete",
              deletedRows: deletedCount,
            });
          }
        }
      } else {
        const { error: delErr } = await supabaseAdmin
          .from(tableName as any)
          .delete()
          .lt(tsCol, cutoffIso);
        if (delErr) console.log(`    [archive] Delete by ts error: ${delErr.message}`);
        else {
          deletedCount = allEligibleRows.length;
          onProgress?.({
            type: "table_progress",
            table: tableName,
            phase: "delete",
            deletedRows: deletedCount,
          });
        }
      }
    } else {
      deletedCount = oldRowsCount ?? 0;
    }

    tableSummaries.push({
      table: tableName,
      totalInDb: totalDbCount ?? 0,
      olderThan2Days: oldRowsCount ?? 0,
      rowsExported: totalExportedForTable,
      rowsDeleted: deletedCount,
      partitionsAffected: affectedPartitions,
    });

    onProgress?.({
      type: "table_done",
      table: tableName,
      totalRows: totalDbCount ?? 0,
      eligibleRows: oldRowsCount ?? 0,
      exportedRows: totalExportedForTable,
      deletedRows: deletedCount,
    });
  }

    // 7. VACUUM FULL after deletion to reclaim disk space (not in dry-run mode)
  let vacuumResult: { success: boolean; tables: Array<{ table: string; vacuumed: boolean; message?: string }> } | null = null;
  if (!dryRun) {
    onProgress?.({ type: "table_progress", phase: "vacuum", table: "all", fetchedRows: 0 });
    vacuumResult = await runVacuumFull();
    onProgress?.({
      type: "table_progress",
      phase: "vacuum",
      table: "all",
      fetchedRows: vacuumResult.tables.length,
      deletedRows: vacuumResult.success ? vacuumResult.tables.length : 0,
    });
    if (!vacuumResult.success) {
      console.log("  [archive] VACUUM FULL completed with errors - archiving is still successful");
    }
  }

  // DB size after + final summary
  const dbSizeAfter = await getDbSize();
  const spaceFreedBytes = Math.max(0, dbSizeBefore.bytes - dbSizeAfter.bytes);
  const endTime = new Date().toISOString();

  appendExportLog(EXPORT_LOG_PATH, tableSummaries, startTime, dryRun, m);

  const summary: ArchiveSummary = {
    success: true,
    startTime,
    endTime,
    cutoffDate: cutoffIso,
    dbSizeBefore,
    dbSizeAfter,
    spaceFreedBytes,
    tables: tableSummaries,
    archiveDir: ARCHIVE_ROOT,
    vacuumSuccess: vacuumResult?.success ?? true,
    vacuumTables: vacuumResult?.tables,
  };

  onProgress?.({ type: 'all_done', summary });

  return summary;
}


// --- Full Archive: export ALL data from Supabase to disk, then VACUUM FULL ---
// Used by the 'تنظيف شامل + أرشفة' button in marketwatch-health.

export interface FullArchiveSummary extends Omit<ArchiveSummary, 'vacuumSuccess' | 'vacuumTables'> {
  vacuumSuccess: boolean;
  vacuumTables: Array<{ table: string; vacuumed: boolean; message?: string }>;
}

export async function runFullArchive(opts?: {
  dryRun?: boolean;
  cutoffDays?: number;
  onProgress?: (event: unknown) => void;
}): Promise<FullArchiveSummary> {
  const cutoffDays = opts?.cutoffDays ?? 2;
  const dryRun = opts?.dryRun ?? true;

  const startTime = new Date().toISOString();
  const cutoffDate = new Date(Date.now() - cutoffDays * 86400 * 1000);
  const cutoffIso = cutoffDate.toISOString();

  opts?.onProgress?.({
    type: 'phase',
    phase: 'archiving',
    message: `Full archive: rows older than ${cutoffIso}...`
  });

  // Run the standard archive (export + delete)
  const archiveResult = await runArchive({
    dryRun,
    olderThanHours: cutoffDays * 24,
    onProgress: opts?.onProgress,
  });

  opts?.onProgress?.({
    type: 'phase',
    phase: 'vacuum',
    message: 'Running VACUUM FULL to reclaim disk space...'
  });

  // Run VACUUM FULL on all tables
  let vacuumResult: { success: boolean; tables: Array<{ table: string; vacuumed: boolean; message?: string }> } = {
    success: true,
    tables: [],
  };

  const vacTables = ['marketwatch_snapshots', 'live_ticks', 'orderbook_snapshots', 'live_quotes', 'smart_exit_log', 'thunder_auth_events'];
  for (const tbl of vacTables) {
    try {
      await runVacuumFull();
      vacuumResult.tables.push({ table: tbl, vacuumed: true });
    } catch (e) {
      const msg = String((e as Error)?.message || e).slice(0, 200);
      vacuumResult.tables.push({ table: tbl, vacuumed: false, message: msg });
      vacuumResult.success = false;
    }
  }

  // DB size after
  const dbSizeAfter = await getDbSize();
  const spaceFreedBytes = Math.max(0, archiveResult.dbSizeBefore.bytes - dbSizeAfter.bytes);

  const endTime = new Date().toISOString();
  const fullSummary: FullArchiveSummary = {
    success: true,
    startTime,
    endTime,
    cutoffDate: cutoffIso,
    dbSizeBefore: archiveResult.dbSizeBefore,
    dbSizeAfter,
    spaceFreedBytes,
    tables: archiveResult.tables,
    archiveDir: ARCHIVE_ROOT,
    vacuumSuccess: vacuumResult.success,
    vacuumTables: vacuumResult.tables,
  };

  opts?.onProgress?.({ type: 'all_done', summary: fullSummary });

  return fullSummary;
}

// --- Full Archive: export ALL data from Supabase to disk, then VACUUM FULL ---
// Used by the 'تنظيف شامل + أرشفة' button in marketwatch-health.

export interface FullArchiveSummary {
  success: boolean;
  startTime: string;
  endTime: string;
  dbSizeBefore: DbSizeInfo;
  dbSizeAfter: DbSizeInfo;
  spaceFreedBytes: number;
  tables: TableSummary[];
  vacuumSuccess: boolean;
  vacuumTables: Array<{ table: string; vacuumed: boolean; message?: string }>;
}
