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
  console.log('=== extension_diag: per hour today vs yesterday ===');
  const q1 = await p.query(`SELECT to_char(ts AT TIME ZONE 'Africa/Cairo','MM-DD HH24:00') h, count(*) c, count(DISTINCT client_id) cl, count(DISTINCT symbol) syms, max(depth_count_30s) maxdepth
    FROM extension_diag WHERE ts > now() - interval '40 hours' GROUP BY 1 ORDER BY 1 DESC`);
  for (const r of q1.rows) console.log(' ', r.h, 'rows=' + r.c, 'clients=' + r.cl, 'symbols=' + r.syms, 'maxDepth30s=' + r.maxdepth);

  console.log('\n=== extension_diag yesterday 10:00-14:00 sample (healthy baseline) ===');
  const q2 = await p.query(`SELECT ts AT TIME ZONE 'Africa/Cairo' t, client_id, symbol, visibility_state, depth_count_30s, last_depth_age_ms
    FROM extension_diag WHERE ts BETWEEN (now() - interval '40 hours') AND (now() - interval '24 hours')
    ORDER BY ts DESC LIMIT 6`);
  for (const r of q2.rows) console.log(' ', r.t.toISOString?.() || r.t, r.client_id?.slice(0,10), r.symbol, r.visibility_state, 'd30s=' + r.depth_count_30s, 'age=' + r.last_depth_age_ms);

  console.log('\n=== extension_tab_telemetry columns ===');
  const c = await p.query(`SELECT column_name FROM information_schema.columns WHERE table_name='extension_tab_telemetry' ORDER BY ordinal_position`);
  console.log(' ', c.rows.map(r=>r.column_name).join(','));

  console.log('\n=== extension_tab_telemetry last 12 ===');
  const q3 = await p.query(`SELECT * FROM extension_tab_telemetry ORDER BY ts DESC LIMIT 6`);
  for (const r of q3.rows) console.log(' ', JSON.stringify(r).slice(0,600));

  console.log('\n=== thunder_watchlist_snapshots / tape / orderbook counts by hour (30h) ===');
  const cols = await p.query(`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('thunder_tape','orderbook_snapshots','thunder_watchlist_snapshots','live_quotes') ORDER BY table_name, ordinal_position`);
  const map = {};
  for (const r of cols.rows) { map[r.table_name] = map[r.table_name] || []; map[r.table_name].push(r.column_name); }
  console.log(JSON.stringify(map));
  for (const [tbl, tcol] of [['thunder_tape','captured_at'],['orderbook_snapshots','ts'],['thunder_watchlist_snapshots','captured_at']]) {
    try {
      const q = await p.query(`SELECT to_char(${tcol} AT TIME ZONE 'Africa/Cairo','MM-DD HH24:00') h, count(*) c FROM ${tbl} WHERE ${tcol} > now() - interval '30 hours' GROUP BY 1 ORDER BY 1 DESC`);
      console.log(` ${tbl} (${tcol}):`);
      for (const r of q.rows) console.log('   ', r.h, r.c);
    } catch (e) { console.log(` ${tbl}: ${e.message}`); }
  }
  await p.end();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
