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
  console.log('=== all public tables ===');
  const t = await p.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1`);
  console.log(t.rows.map(r => r.table_name).join(', '));

  console.log('\n=== marketwatch per minute today 09:40-11:30 Cairo ===');
  const mw = await p.query(`
    SELECT to_char(captured_at AT TIME ZONE 'Africa/Cairo','HH24:MI') m, count(*) c
    FROM marketwatch_snapshots
    WHERE captured_at AT TIME ZONE 'Africa/Cairo' BETWEEN (CURRENT_DATE + time '09:40') AND (CURRENT_DATE + time '11:30')
    GROUP BY 1 ORDER BY 1`);
  for (const r of mw.rows) console.log(' ', r.m, r.c);

  console.log('\n=== marketwatch 14:30-14:45 Cairo today ===');
  const mw2 = await p.query(`
    SELECT to_char(captured_at AT TIME ZONE 'Africa/Cairo','HH24:MI') m, count(*) c
    FROM marketwatch_snapshots
    WHERE captured_at AT TIME ZONE 'Africa/Cairo' >= CURRENT_DATE + time '14:30'
    GROUP BY 1 ORDER BY 1`);
  for (const r of mw2.rows) console.log(' ', r.m, r.c);

  console.log('\n=== today live_ticks raw rows (all 7) ===');
  const lt = await p.query(`
    SELECT symbol, price, source, ts AT TIME ZONE 'Africa/Cairo' ts_cairo
    FROM live_ticks WHERE ts > now() - interval '24 hours' ORDER BY ts`);
  for (const r of lt.rows) console.log(' ', r.symbol, r.price, r.source, r.ts_cairo.toISOString?.() || r.ts_cairo);

  console.log('\n=== extension_heartbeat / presence tables recent ===');
  for (const cand of ['extension_heartbeats','extension_heartbeat','extension_presence','extension_status','extension_stats','extension_versions']) {
    try {
      const q = await p.query(`SELECT * FROM ${cand} ORDER BY 1 DESC LIMIT 3`);
      console.log(` ${cand}:`);
      for (const r of q.rows) console.log('   ', JSON.stringify(r).slice(0, 400));
    } catch {}
  }
  await p.end();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
