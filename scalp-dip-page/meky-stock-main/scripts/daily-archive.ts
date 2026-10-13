import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load .env manually — resolution order (compiled-exe / scheduled-task safe):
// 1. ARCHIVE_ENV_PATH env var (set by the Task Scheduler wrapper)
// 2. absolute project path (works no matter the CWD, incl. compiled .exe)
// 3. import.meta.dir (source-tree runs under `bun scripts/...`)
// 4. process.cwd() (legacy behavior)
// NOTE: in `bun build --compile` output, import.meta.dir resolves to a
// virtual B:\~BUN\root sandbox, so absolute paths are what make the
// scheduled task reliable.
const envCandidates = [
  process.env.ARCHIVE_ENV_PATH,
  'D:/meky-stock-main/meky-stock-main/.env',
  path.join(import.meta.dir, '.env'),
  path.join(import.meta.dir, '..', '.env'),
  path.join(process.cwd(), '.env'),
].filter(Boolean) as string[];
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valParts] = trimmed.split('=');
        const val = valParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key.trim()] = val;
      }
    }
    break; // first existing candidate wins
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zeranlkxpioondyluzgl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const TARGET_DIR = 'D:\\1All Data';
const EXPORT_LOG_PATH = path.join(TARGET_DIR, '_exports_log.csv');

const TARGET_TABLES = [
  'live_ticks',
  'marketwatch_snapshots',
  'orderbook_snapshots',
  'live_quotes',
  'smart_exit_log',
  'thunder_auth_events'
];

interface TableConfig {
  timestampCol: string;
  pkCols: string[];
}

const TABLE_CONFIGS: Record<string, TableConfig> = {
  live_ticks: { timestampCol: 'created_at', pkCols: ['id'] },
  marketwatch_snapshots: { timestampCol: 'captured_at', pkCols: ['id'] },
  orderbook_snapshots: { timestampCol: 'created_at', pkCols: ['id'] },
  live_quotes: { timestampCol: 'ts', pkCols: ['id'] }, // FIXED Sep 2: live_quotes has NO created_at column — real columns: id, symbol, uuid, bid, ask, spread, ts, received_at, source. The old 'created_at' value silently failed the count query (empty error message) and the fallback at line ~200 never fired because tsCol === 'created_at'.
  smart_exit_log: { timestampCol: 'ts', pkCols: ['id'] }, // FIXED Sep 2: real cols are trade_date, ts — no created_at
  thunder_auth_events: { timestampCol: 'ts', pkCols: ['id'] } // FIXED Sep 2: real col is ts — no created_at
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function formatCSVValue(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    const json = JSON.stringify(val);
    return `"${json.replace(/"/g, '""')}"`;
  }
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
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
      } else if (c === ',') {
        result.push(cur);
        cur = '';
      } else {
        cur += c;
      }
    }
  }
  result.push(cur);
  return result;
}

function ensureDirSync(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadExistingSignatures(filePath: string, headerCols: string[], pkCols: string[]): { headers: string[]; keys: Set<string> } {
  if (!fs.existsSync(filePath)) {
    return { headers: headerCols, keys: new Set() };
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) {
    return { headers: headerCols, keys: new Set() };
  }

  const existingHeaders = parseCSVLine(lines[0]);
  const pkIndices = pkCols.map(pk => existingHeaders.indexOf(pk));
  const hasAllPks = pkIndices.every(idx => idx !== -1);

  const keys = new Set<string>();
  for (let i = 1; i < lines.length; i++) {
    const parsed = parseCSVLine(lines[i]);
    if (hasAllPks) {
      const key = pkIndices.map(idx => parsed[idx] ?? '').join(':::');
      keys.add(key);
    } else {
      keys.add(lines[i]);
    }
  }
  return { headers: existingHeaders, keys };
}

export async function runDailyArchive(dryRun: boolean = true, exportOnly: boolean = false) {
  const runTimestamp = new Date().toISOString();
  console.log(`=======================================================`);
  console.log(`DAILY ARCHIVE RUN: ${runTimestamp}`);
  console.log(`Project URL: ${SUPABASE_URL}`);
  console.log(`Target Dir:  ${TARGET_DIR}`);
  console.log(`Dry Run:     ${dryRun ? 'YES (READ-ONLY)' : 'NO (LIVE DELETIONS ENABLED)'}`);
  console.log(`Mode:        ${exportOnly ? 'EXPORT-ONLY (no deletions ever, cutoff = NOW)' : 'ARCHIVE (cutoff = start of today)'}`);
  console.log(`=======================================================\n`);

  ensureDirSync(TARGET_DIR);

  // Cutoff selection:
  //  - ARCHIVE mode (default): start of today (00:00 local). Rows strictly
  //    before it are exported then deleted; today's rows stay live.
  //  - EXPORT-ONLY mode (--export-only): cutoff = NOW. Exports every row up
  //    to the current moment — including today's still-accumulating data —
  //    and NEVER deletes from Supabase. Safe to run repeatedly; the
  //    existing ID-based dedup-on-append guarantees the day's CSV ends up
  //    as the union of all runs with zero duplicate ids. A later normal
  //    --live run for the same day merges cleanly through the same dedup.
  const cutoffDate = new Date();
  if (!exportOnly) cutoffDate.setHours(0, 0, 0, 0);
  const cutoffIso = cutoffDate.toISOString();
  console.log(`Cutoff (${exportOnly ? 'now — export everything up to this moment' : 'start of today, anything older gets archived'}): ${cutoffIso}\n`);

  const runSummary: Array<{
    table: string;
    totalInDb: number;
    olderThan2Days: number;
    rowsExported: number;
    rowsDeletedOrWouldDelete: number;
    partitionsAffected: string[];
  }> = [];

  for (const tableName of TARGET_TABLES) {
    console.log(`-------------------------------------------------------`);
    console.log(`Processing table: [${tableName}]`);
    const cfg = TABLE_CONFIGS[tableName] || { timestampCol: 'created_at', pkCols: ['id'] };
    const tableDir = path.join(TARGET_DIR, tableName);
    ensureDirSync(tableDir);

    const { count: totalDbCount, error: countErr } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (countErr) {
      console.log(`  ❌ Error querying total count for ${tableName}: ${countErr.message}`);
      runSummary.push({
        table: tableName,
        totalInDb: -1,
        olderThan2Days: 0,
        rowsExported: 0,
        rowsDeletedOrWouldDelete: 0,
        partitionsAffected: []
      });
      continue;
    }

    console.log(`  Total rows in Supabase: ${totalDbCount ?? 0}`);

    if (totalDbCount === 0 || totalDbCount === null) {
      console.log(`  ℹ️ Table is empty in Supabase.`);
      runSummary.push({
        table: tableName,
        totalInDb: totalDbCount ?? 0,
        olderThan2Days: 0,
        rowsExported: 0,
        rowsDeletedOrWouldDelete: 0,
        partitionsAffected: []
      });
      continue;
    }

    let tsCol = cfg.timestampCol;
    let { count: oldRowsCount, error: oldErr } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .lt(tsCol, cutoffIso);

    if (oldErr && tsCol !== 'created_at') {
      const fallback = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .lt('created_at', cutoffIso);
      if (!fallback.error) {
        tsCol = 'created_at';
        oldRowsCount = fallback.count;
        oldErr = null;
      }
    }

    if (oldErr) {
      console.log(`  ❌ Error querying older rows for ${tableName}: ${oldErr.message}`);
      runSummary.push({
        table: tableName,
        totalInDb: totalDbCount ?? 0,
        olderThan2Days: 0,
        rowsExported: 0,
        rowsDeletedOrWouldDelete: 0,
        partitionsAffected: []
      });
      continue;
    }

    console.log(`  Rows older than 2 days (< ${cutoffIso}): ${oldRowsCount ?? 0}`);

    if (!oldRowsCount || oldRowsCount === 0) {
      console.log(`  ℹ️ No eligible rows to export.`);
      runSummary.push({
        table: tableName,
        totalInDb: totalDbCount ?? 0,
        olderThan2Days: 0,
        rowsExported: 0,
        rowsDeletedOrWouldDelete: 0,
        partitionsAffected: []
      });
      continue;
    }

    const PAGE_SIZE = 1000;
    let fetched = 0;
    const allEligibleRows: any[] = [];

    // KEYSET PAGINATION (id > lastMaxId):
    // The previous OFFSET-based pagination (.range(fetched, fetched+N))
    // degrades linearly with depth — on a CPU-saturated Supabase instance it
    // hit "statement timeout" at ~534k rows, silently truncating exports
    // (the Sep-2 gap of 239k rows). Keyset pagination on the primary key
    // keeps every page O(1) regardless of depth, and ordering by (id) is
    // stable even while the extension concurrently inserts new rows.
    let lastMaxId = -1;
    let keysetErr: string | null = null;
    for (;;) {
      let q = supabase.from(tableName).select('*').lt(tsCol, cutoffIso).gt('id', lastMaxId).order('id', { ascending: true });
      const { data: pageData, error: pageErr } = await q.range(0, PAGE_SIZE - 1);

      if (pageErr) {
        // Retry once after a pause — Supabase under load throws transient
        // pooler errors (EAUTHQUERY etc.); one retry heals most of them.
        console.log(`  ⏳ Fetch retry at id>${lastMaxId}: ${pageErr.message}`);
        await new Promise((res) => setTimeout(res, 5000));
        const retry = await supabase.from(tableName).select('*').lt(tsCol, cutoffIso).gt('id', lastMaxId).order('id', { ascending: true }).range(0, PAGE_SIZE - 1);
        if (retry.error) {
          console.log(`  ❌ Error fetching batch after id>${lastMaxId}: ${retry.error.message}`);
          keysetErr = retry.error.message;
          break;
        }
        if (!retry.data || retry.data.length === 0) break;
        for (const r of retry.data) allEligibleRows.push(r);
        lastMaxId = retry.data[retry.data.length - 1].id;
        fetched += retry.data.length;
        continue;
      }
      if (!pageData || pageData.length === 0) break;

      for (const r of pageData) allEligibleRows.push(r);
      lastMaxId = pageData[pageData.length - 1].id;
      fetched += pageData.length;
    }

    // In export-only / archive modes we must NEVER proceed to delete unless
    // we fetched EVERYTHING eligible. A short fetch (timeout mid-way) with a
    // delete would lose data that was never exported. This guard hard-stops
    // the delete phase if the fetch came up short.
    if (keysetErr && fetched < (oldRowsCount ?? 0) && !exportOnly) {
      console.log(`  🛑 FETCH INCOMPLETE (${fetched}/${oldRowsCount}) — deletions are blocked for this table this run.`);
      runSummary.push({
        table: tableName,
        totalInDb: totalDbCount ?? 0,
        olderThan2Days: oldRowsCount ?? 0,
        rowsExported: 0,
        rowsDeletedOrWouldDelete: 0,
        partitionsAffected: [],
      });
      continue;
    }
    if (keysetErr) {
      console.log(`  ⚠️ Fetch ended early after ${fetched} rows (export-only mode: partial export kept, no deletions possible).`);
    }

    console.log(`  Fetched ${allEligibleRows.length} rows for archiving.`);

    const groupedByDate = new Map<string, any[]>();
    for (const row of allEligibleRows) {
      const rawDate = row[tsCol] || row['created_at'] || row['captured_at'] || row['timestamp'];
      let dateKey = 'unknown_date';
      if (rawDate) {
        try {
          dateKey = new Date(rawDate).toISOString().slice(0, 10);
        } catch {
          dateKey = String(rawDate).slice(0, 10);
        }
      }
      if (!groupedByDate.has(dateKey)) {
        groupedByDate.set(dateKey, []);
      }
      groupedByDate.get(dateKey)!.push(row);
    }

    let totalExportedForTable = 0;
    const affectedPartitions: string[] = [];
    // pendingTmpFiles: written during export, read by safety check, renamed
    // to canonical only after the safety check passes. This is the
    // structural fix for the "export-before-delete with meaningless
    // self-verify" bug class.
    const pendingTmpFiles: Array<{ tmpPath: string; canonicalPath: string; fullContent: string }> = [];

    for (const [dateStr, rows] of groupedByDate.entries()) {
      const partitionFileName = `${dateStr}.csv`;
      const partitionFilePath = path.join(tableDir, partitionFileName);
      affectedPartitions.push(partitionFileName);

      const sampleRow = rows[0];
      const headerCols = Object.keys(sampleRow);
      const { headers: existingHeaders, keys: existingKeys } = loadExistingSignatures(
        partitionFilePath,
        headerCols,
        cfg.pkCols
      );

      const targetHeaders = existingHeaders.length > 0 ? existingHeaders : headerCols;
      const newLines: string[] = [];

      for (const r of rows) {
        const pkIndices = cfg.pkCols.map(pk => targetHeaders.indexOf(pk));
        const hasAllPks = pkIndices.every(idx => idx !== -1);
        let rowKey = '';
        if (hasAllPks) {
          rowKey = cfg.pkCols.map(pk => String(r[pk] ?? '')).join(':::');
        }

        const isDuplicate = hasAllPks
          ? existingKeys.has(rowKey)
          : existingKeys.has(targetHeaders.map(h => formatCSVValue(r[h])).join(','));

        if (!isDuplicate) {
          const rowCsv = targetHeaders.map(h => formatCSVValue(r[h])).join(',');
          newLines.push(rowCsv);
          if (hasAllPks) {
            existingKeys.add(rowKey);
          } else {
            existingKeys.add(rowCsv);
          }
          totalExportedForTable++;
        }
      }

      // ── WRITE TO .tmp ONLY (structural fix, 2026-08-27) ──
      // The canonical {date}.csv is NOT touched here. We write to a
      // unique .tmp file and rename atomically only AFTER the safety
      // check at step 6 confirms every target id is present in that
      // .tmp file. This prevents the "export-before-delete with
      // meaningless self-verify" bug class.
      if (!dryRun && newLines.length > 0) {
        let fullContent: string;
        if (!fs.existsSync(partitionFilePath)) {
          fullContent = targetHeaders.join(',') + '\n' + newLines.join('\n') + '\n';
        } else {
          const existing = fs.readFileSync(partitionFilePath, 'utf-8');
          const sep = existing.endsWith('\n') ? '' : '\n';
          fullContent = existing + sep + newLines.join('\n') + '\n';
        }
        const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const tmpPath = `${partitionFilePath}.tmp.${runId}`;
        fs.writeFileSync(tmpPath, fullContent, 'utf-8');
        pendingTmpFiles.push({ tmpPath, canonicalPath: partitionFilePath, fullContent });
      }

      console.log(`    Partition [${partitionFileName}]: ${rows.length} fetched, ${newLines.length} new lines deduped.`);
    }

    let deletedCount = 0;
    if (exportOnly) {
      // EXPORT-ONLY MODE: never delete from Supabase. The .tmp files written
      // above contain existing-canonical + new-deduped rows; rename them into
      // place so the day's CSV is the union of every run (id-deduped). No ID
      // log, no DELETE, nothing else.
      console.log(`  [export-only] Skipping Supabase deletion entirely.`);
      for (const t of pendingTmpFiles) {
        fs.renameSync(t.tmpPath, t.canonicalPath);
      }
    } else if (!dryRun) {
      console.log(`  Deleting ${allEligibleRows.length} archived rows from Supabase...`);
      const idsToDelete = allEligibleRows.map(r => r.id).filter(id => id !== undefined);

      // ── MANDATORY PRE-DELETE VERIFICATION (added 2026-08-27; structural fix 2026-08-27) ──
      // Refuse to delete any rows unless every id in `idsToDelete` is found
      // in the .tmp file(s) written by the export phase above. The
      // canonical CSV is NOT consulted here (that was the old broken
      // behavior — it always passed because the export just wrote to it).
      // On success, .tmp is renamed to canonical, then DELETE runs.
      // On any failure, .tmp is kept on disk for forensics.
      const existingCsvIds = new Set<string>();
      const csvFilesScanned: string[] = [];
      for (const partFile of affectedPartitions) {
        const matchingTmp = pendingTmpFiles.find(t => path.basename(t.canonicalPath) === partFile);
        if (!matchingTmp) {
          // No new rows exported for this partition → no .tmp exists.
          // Fall back to scanning the canonical file for prior coverage
          // (rows from earlier runs that haven't been deleted yet).
          const canonical = path.join(tableDir, partFile);
          if (fs.existsSync(canonical)) {
            const text = fs.readFileSync(canonical, 'utf-8');
            const lines = text.split(/\r?\n/);
            if (lines.length >= 2) {
              const header = lines[0].split(',');
              const idIdx = header.indexOf('id');
              if (idIdx >= 0) {
                csvFilesScanned.push(partFile + ' (canonical, prior export)');
                for (let li = 1; li < lines.length; li++) {
                  if (!lines[li]) continue;
                  const cols = lines[li].split(',');
                  const id = cols[idIdx];
                  if (id) existingCsvIds.add(id);
                }
              }
            }
          }
          continue;
        }
        const tmpPath = matchingTmp.tmpPath;
        if (!fs.existsSync(tmpPath)) {
          throw new Error(
            `[daily-archive] SAFETY ABORT: temp CSV missing for ${tableName}: ${tmpPath}. ` +
            `Refusing to delete ${idsToDelete.length} rows without confirmed backup.`
          );
        }
        const text = fs.readFileSync(tmpPath, 'utf-8');
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) {
          throw new Error(
            `[daily-archive] SAFETY ABORT: ${tmpPath} is empty (no header). Refusing to delete.`
          );
        }
        const header = lines[0].split(',');
        const idIdx = header.indexOf('id');
        if (idIdx < 0) {
          throw new Error(
            `[daily-archive] SAFETY ABORT: ${tmpPath} has no 'id' column. Refusing to delete.`
          );
        }
        csvFilesScanned.push(partFile + ' (tmp)');
        for (let li = 1; li < lines.length; li++) {
          if (!lines[li]) continue;
          const cols = lines[li].split(',');
          const id = cols[idIdx];
          if (id) existingCsvIds.add(id);
        }
      }
      const missing: string[] = [];
      const sampleSize = Math.min(idsToDelete.length, 20);
      const sampleMissing: string[] = [];
      for (const id of idsToDelete) {
        if (!existingCsvIds.has(String(id))) {
          missing.push(String(id));
          if (sampleMissing.length < sampleSize) sampleMissing.push(String(id));
        }
      }
      if (missing.length > 0) {
        // Leave .tmp files on disk for forensics. Do NOT rename them.
        throw new Error(
          `[daily-archive] SAFETY ABORT: ${missing.length} of ${idsToDelete.length} ` +
          `rows in ${tableName} are NOT in the archive CSVs (scanned: ${csvFilesScanned.join(', ')}). ` +
          `First ${sampleSize} missing ids: ${JSON.stringify(sampleMissing)}. ` +
          `Refusing to delete ANY rows. Temp files preserved at: ${pendingTmpFiles.map(t => t.tmpPath).join(', ')}.`
        );
      }
      console.log(`  [safety] Verified all ${idsToDelete.length} ids are present in archive CSVs (${existingCsvIds.size} distinct ids scanned; files: ${csvFilesScanned.join(', ')}).`);

      // ── SAFETY CHECK PASSED — atomically rename .tmp to canonical ──
      for (const t of pendingTmpFiles) {
        fs.renameSync(t.tmpPath, t.canonicalPath);
        // Optional: gzip copy is a UI feature; not in this script.
      }
      // ── END MANDATORY PRE-DELETE VERIFICATION ──

      if (idsToDelete.length > 0) {
        // ── MANDATORY PRE-DELETE ID LOG (added 2026-08-27) ──
        // Write the exact list of IDs about to be deleted BEFORE any DELETE fires.
        // If the log cannot be written, REFUSE to delete (no log = no delete).
        const startTime = new Date().toISOString();
        const idsLogPath = path.join(
          tableDir,
          `deleted_ids_${tableName}_${startTime.replace(/[:.]/g, '-')}.json`,
        );
        try {
          fs.writeFileSync(
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
            'utf-8',
          );
          console.log(`  [archive] Pre-delete ID log: ${idsLogPath} (${idsToDelete.length} ids)`);
        } catch (e) {
          console.error(`  [archive] FATAL: failed to write pre-delete ID log: ${(e as Error).message}`);
          throw new Error(
            `Pre-delete ID log could not be written to ${idsLogPath}: ${(e as Error).message}. ` +
              `Aborting delete to prevent unlogged data loss.`,
          );
        }

        const DEL_BATCH = 200;
        for (let i = 0; i < idsToDelete.length; i += DEL_BATCH) {
          const batch = idsToDelete.slice(i, i + DEL_BATCH);
          const { error: delErr } = await supabase.from(tableName).delete().in('id', batch);
          if (delErr) {
            console.log(`    ❌ Error deleting batch ${i}-${i + batch.length}: ${delErr.message}`);
          } else {
            deletedCount += batch.length;
          }
        }
      } else {
        const { error: delErr } = await supabase.from(tableName).delete().lt(tsCol, cutoffIso);
        if (delErr) {
          console.log(`    ❌ Error deleting by timestamp: ${delErr.message}`);
        } else {
          deletedCount = allEligibleRows.length;
        }
      }
      console.log(`  Deleted ${deletedCount} rows from Supabase.`);
    } else {
      console.log(`  [DRY-RUN] Would delete ${allEligibleRows.length} rows from Supabase table ${tableName}. (No actual deletion performed).`);
    }

    runSummary.push({
      table: tableName,
      totalInDb: totalDbCount ?? 0,
      olderThan2Days: oldRowsCount ?? 0,
      rowsExported: totalExportedForTable,
      rowsDeletedOrWouldDelete: exportOnly ? 0 : (dryRun ? (oldRowsCount ?? 0) : deletedCount),
      partitionsAffected: affectedPartitions
    });
  }

  const modeTag = exportOnly ? 'EXPORT_ONLY' : (dryRun ? 'TRUE' : 'FALSE');
  const logHeaders = 'run_timestamp,table_name,total_db_rows,older_than_2_days,rows_exported,rows_deleted,dry_run,partitions_affected\n';
  const logRows = runSummary.map(s =>
    [
      runTimestamp,
      s.table,
      s.totalInDb,
      s.olderThan2Days,
      s.rowsExported,
      s.rowsDeletedOrWouldDelete,
      modeTag,
      `"${s.partitionsAffected.join(';')}"`
    ].join(',')
  ).join('\n') + '\n';

  if (!fs.existsSync(EXPORT_LOG_PATH)) {
    fs.writeFileSync(EXPORT_LOG_PATH, logHeaders + logRows, 'utf-8');
  } else {
    fs.appendFileSync(EXPORT_LOG_PATH, logRows, 'utf-8');
  }

  console.log(`\n=======================================================`);
  console.log(`SUMMARY LOGGED TO: ${EXPORT_LOG_PATH}`);
  console.table(runSummary.map(s => ({
    Table: s.table,
    'DB Total': s.totalInDb,
    'Eligible (cutoff)': s.olderThan2Days,
    'Exported (New)': s.rowsExported,
    'Deleted/WouldDel': s.rowsDeletedOrWouldDelete,
    'Mode': modeTag
  })));
  console.log(`=======================================================`);
}

const isLive = process.argv.includes('--live');
const exportOnly = process.argv.includes('--export-only');
const dryRun = !isLive && !exportOnly;

runDailyArchive(dryRun, exportOnly).catch(err => {
  console.error('Fatal error in daily archive:', err);
  process.exit(1);
});
