'use strict';
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('D:/meky-stock-main/meky-stock-main/.env', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, '');
}
const { Pool } = require('pg');
const p = new Pool({ connectionString: env.DATABASE_URL });
(async () => {
  console.log('=== thunder_watchlist_snapshots: rows + distinct symbols by hour ===');
  const q = await p.query(`SELECT to_char(ts AT TIME ZONE 'Africa/Cairo','MM-DD HH24:00') h, count(*) c, count(DISTINCT symbol) syms
    FROM thunder_watchlist_snapshots WHERE ts > now() - interval '40 hours' GROUP BY 1 ORDER BY 1 DESC`);
  for (const r of q.rows) console.log(' ', r.h, 'rows=' + r.c, 'symbols=' + r.syms);

  console.log('\n=== today watchlist symbols (distinct) ===');
  const q2 = await p.query(`SELECT DISTINCT symbol FROM thunder_watchlist_snapshots WHERE ts > now() - interval '8 hours' ORDER BY 1`);
  console.log(' ', q2.rows.map(r=>r.symbol).join(','));

  console.log('\n=== yesterday watchlist symbols count ===');
  const q3 = await p.query(`SELECT count(DISTINCT symbol) c FROM thunder_watchlist_snapshots WHERE ts BETWEEN (now() - interval '40 hours') AND (now() - interval '20 hours')`);
  console.log(' ', q3.rows[0].c);

  console.log('\n=== thunder_tape distinct symbols by hour ===');
  const q4 = await p.query(`SELECT to_char(captured_at AT TIME ZONE 'Africa/Cairo','MM-DD HH24:00') h, count(*) c, count(DISTINCT symbol) syms, string_agg(DISTINCT symbol, ',') symlist
    FROM thunder_tape WHERE captured_at > now() - interval '40 hours' GROUP BY 1 ORDER BY 1 DESC`);
  for (const r of q4.rows) console.log(' ', r.h, 'rows=' + r.c, 'symbols=' + r.syms, (r.symlist||'').slice(0,120));

  console.log('\n=== marketwatch distinct symbols by hour ===');
  const q5 = await p.query(`SELECT to_char(captured_at AT TIME ZONE 'Africa/Cairo','MM-DD HH24:00') h, count(*) c, count(DISTINCT symbol) syms
    FROM marketwatch_snapshots WHERE captured_at > now() - interval '40 hours' GROUP BY 1 ORDER BY 1 DESC`);
  for (const r of q5.rows) console.log(' ', r.h, 'rows=' + r.c, 'symbols=' + r.syms);
  await p.end();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
