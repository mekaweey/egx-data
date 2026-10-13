// generate-quality.ts — STAGE C runner: scan D:\1All Data\{table}\{date}.csv(.gz)
// and write companion {date}.quality.json next to each partition.
// Usage: bun scripts/generate-quality.ts [--tables=t1,t2] [--days=2026-09-01,...]
//        (no args = all archived days of all DATA_TABLES with files on disk)
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import * as readline from 'readline';
import {
  computeDayQuality,
  type DayQuality,
} from '../src/lib/data-quality.server';

const ROOT = 'D:\\1All Data';

// Column indexes per archive table (verified against real files):
//   live_ticks:           id,symbol,price,volume,source,ts,meta,created_at
//   marketwatch_snapshots: id,captured_at,symbol,asset_id,ref_price,last_price,avg_change_prc,total_volume,total_trades,...
//   orderbook_snapshots:  id,symbol,ts,...
//   live_quotes:          id,symbol,uuid,bid,ask,spread,ts,received_at,source
const CFG: Record<string, { tsIdx: number; symIdx: number }> = {
  live_ticks: { tsIdx: 5, symIdx: 1 },
  marketwatch_snapshots: { tsIdx: 1, symIdx: 2 },
  orderbook_snapshots: { tsIdx: 2, symIdx: 1 },
  live_quotes: { tsIdx: 6, symIdx: 1 },
};
const TABLES = Object.keys(CFG);

const TS_RE = /(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.\d+)?(?:\+00:00|Z)?/;

function openDay(table: string, date: string) {
  const csv = path.join(ROOT, table, date + '.csv');
  if (fs.existsSync(csv)) return fs.createReadStream(csv);
  const gz = path.join(ROOT, table, date + '.csv.gz');
  if (fs.existsSync(gz)) return fs.createReadStream(gz).pipe(zlib.createGunzip());
  return null;
}

async function readRows(table: string, date: string) {
  const stream = openDay(table, date);
  if (!stream) return null;
  const cfg = CFG[table];
  const rl = readline.createInterface({ crlfDelay: Infinity, input: stream });
  const rows: Array<{ symbol: string; tsMs: number }> = [];
  for await (const line of rl) {
    if (!line || line.startsWith('id,')) continue;
    const c = line.split(',');
    const sym = c[cfg.symIdx];
    if (!sym) continue;
    const m = TS_RE.exec(c[cfg.tsIdx] || '');
    if (!m) continue;
    const t = Date.parse(m[1] + 'T' + m[2] + 'Z');
    if (!isFinite(t)) continue;
    rows.push({ symbol: sym, tsMs: t });
  }
  return rows;
}

// marketwatch evidence map: per-symbol last snapshot time + flat-volume-since
async function mwEvidence(date: string) {
  const rows = await readRows('marketwatch_snapshots', date);
  if (!rows) return undefined;
  const stream = openDay('marketwatch_snapshots', date)!;
  const rl = readline.createInterface({ crlfDelay: Infinity, input: stream });
  const per = new Map<string, { lastMs: number; flatSinceMs: number | null; prevVol: string; prevTr: string }>();
  for await (const line of rl) {
    if (!line || line.startsWith('id,')) continue;
    const c = line.split(',');
    const sym = c[2];
    const m = TS_RE.exec(c[1] || '');
    if (!sym || !m) continue;
    const t = Date.parse(m[1] + 'T' + m[2] + 'Z');
    const vol = c[7], tr = c[8];
    let e = per.get(sym);
    if (!e) { e = { lastMs: t, flatSinceMs: null, prevVol: '', prevTr: '' }; per.set(sym, e); }
    if (e.prevVol && e.prevTr && vol === e.prevVol && tr === e.prevTr && e.flatSinceMs === null) {
      e.flatSinceMs = t;
    }
    e.prevVol = vol; e.prevTr = tr; e.lastMs = t;
  }
  const out = new Map<string, { lastMs: number; flatSinceMs: number | null }>();
  for (const [k, v] of per) out.set(k, { lastMs: v.lastMs, flatSinceMs: v.flatSinceMs });
  return out;
}

function listedDays(table: string): string[] {
  const dir = path.join(ROOT, table);
  if (!fs.existsSync(dir)) return [];
  const days = new Set<string>();
  for (const f of fs.readdirSync(dir)) {
    const m = /^(\d{4}-\d{2}-\d{2})\.csv(\.gz)?$/.exec(f);
    if (m) days.add(m[1]);
  }
  return [...days].sort();
}

(async () => {
  const argTables = process.argv.find(a => a.startsWith('--tables='));
  const argDays = process.argv.find(a => a.startsWith('--days='));
  const tables = argTables ? argTables.split('=')[1].split(',') : TABLES;
  const dayFilter = argDays ? new Set(argDays.split('=')[1].split(',')) : null;

  let mwCache: Map<string, { lastMs: number; flatSinceMs: number | null }> | undefined;
  let mwCacheDay = '';

  for (const table of tables) {
    const days = listedDays(table);
    const todo = dayFilter ? days.filter(d => dayFilter.has(d)) : days;
    if (todo.length === 0) { console.log(`[${table}] no matching archived days`); continue; }
    for (const date of todo) {
      const rows = await readRows(table, date);
      if (!rows || rows.length === 0) { console.log(`[${table}] ${date}: no rows, skipping`); continue; }
      // marketwatch evidence is per-day; refresh when date changes
      if (mwCacheDay !== date) { mwCache = await mwEvidence(date); mwCacheDay = date; }
      const q: DayQuality = computeDayQuality({ table, dateUtc: date, rows, mwBySymbol: mwCache });
      const outPath = path.join(ROOT, table, date + '.quality.json');
      fs.writeFileSync(outPath, JSON.stringify(q, null, 1), 'utf-8');
      const full = q.symbols.filter(s => s.fullSessionReliable).length;
      console.log(
        `[${table}] ${date}: ${q.symbols.length} symbols, FULL_RELIABLE=${full} ` +
        `(${q.marketWideLateStart ? 'LATE-DAY ' : ''}${q.cairoOffsetMinutes >= 0 ? '+' : ''}${q.cairoOffsetMinutes / 60} Cairo) -> ${outPath}`
      );
    }
  }
})();
