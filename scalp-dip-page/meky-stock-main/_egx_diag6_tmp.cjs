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
  console.log('=== live_ticks sources, last 72h by day+hour ===');
  const q = await p.query(`SELECT to_char(ts AT TIME ZONE 'Africa/Cairo','MM-DD HH24:00') h, source, count(*) c
    FROM live_ticks WHERE ts > now() - interval '72 hours' GROUP BY 1,2 ORDER BY 1 DESC`);
  for (const r of q.rows) console.log(' ', r.h, r.source, r.c);

  console.log('\n=== thunder_auth_events last 7d ===');
  const q2 = await p.query(`SELECT ts AT TIME ZONE 'Africa/Cairo' t, kind, message FROM thunder_auth_events WHERE ts > now() - interval '7 days' ORDER BY ts DESC LIMIT 20`);
  for (const r of q2.rows) console.log(' ', r.t.toISOString?.() || r.t, r.kind, (r.message||'').slice(0,100));

  console.log('\n=== live_quotes last rows ===');
  const q3 = await p.query(`SELECT symbol, bid, ask, ts AT TIME ZONE 'Africa/Cairo' t, source FROM live_quotes ORDER BY ts DESC LIMIT 8`);
  for (const r of q3.rows) console.log(' ', r.symbol, r.bid, r.ask, r.t.toISOString?.() || r.t, r.source);

  console.log('\n=== live_quotes count by hour today vs yesterday ===');
  const q4 = await p.query(`SELECT to_char(ts AT TIME ZONE 'Africa/Cairo','MM-DD HH24:00') h, count(*) c FROM live_quotes WHERE ts > now() - interval '40 hours' GROUP BY 1 ORDER BY 1 DESC`);
  for (const r of q4.rows) console.log(' ', r.h, r.c);
  await p.end();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
