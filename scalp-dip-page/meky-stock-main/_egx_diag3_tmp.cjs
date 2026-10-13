'use strict';
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('D:/meky-stock-main/meky-stock-main/.env', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, '');
}
const { Pool } = require('pg');
const p = new Pool({ connectionString: env.DATABASE_URL });
const one = (v) => JSON.stringify(v)?.slice(0, 500);
(async () => {
  for (const [tbl, col] of [['thunder_auth_events','created_at'],['extension_diag','created_at'],['extension_tab_telemetry','created_at'],['data_source_logs','created_at'],['session_ingest_audit','created_at']]) {
    try {
      const cols = await p.query(`SELECT column_name FROM information_schema.columns WHERE table_name='${tbl}' AND table_schema='public' ORDER BY ordinal_position`);
      console.log(`\n=== ${tbl} === columns: ${cols.rows.map(r=>r.column_name).join(',')}`);
      const q = await p.query(`SELECT * FROM ${tbl} WHERE ${col} > now() - interval '30 hours' ORDER BY ${col} DESC LIMIT 8`);
      for (const r of q.rows) console.log(' ', one(r));
    } catch (e) { console.log(` ${tbl}: ${e.message}`); }
  }

  console.log('\n=== per-hour counts: thunder_tape / orderbook / watchlist today vs yesterday ===');
  for (const tbl of ['thunder_tape','orderbook_snapshots','thunder_watchlist_snapshots','live_quotes']) {
    try {
      const tcol = { thunder_tape: 'ts', orderbook_snapshots: 'captured_at', thunder_watchlist_snapshots: 'captured_at', live_quotes: 'updated_at' }[tbl] || 'created_at';
      const q = await p.query(`SELECT to_char(${tcol} AT TIME ZONE 'Africa/Cairo','MM-DD HH24:00') h, count(*) c FROM ${tbl} WHERE ${tcol} > now() - interval '30 hours' GROUP BY 1 ORDER BY 1 DESC LIMIT 12`);
      console.log(` ${tbl}:`);
      for (const r of q.rows) console.log('   ', r.h, r.c);
    } catch (e) { console.log(` ${tbl}: ${e.message}`); }
  }
  await p.end();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
