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
  console.log('=== live_ticks per hour, last 30h (Cairo tz) ===');
  const r1 = await p.query(`
    SELECT to_char(ts AT TIME ZONE 'Africa/Cairo', 'MM-DD HH24:00') h, count(*) c, count(DISTINCT symbol) syms
    FROM live_ticks WHERE ts > now() - interval '30 hours'
    GROUP BY 1 ORDER BY 1 DESC`);
  for (const r of r1.rows) console.log(' ', r.h, 'ticks=' + r.c, 'symbols=' + r.syms);

  console.log('=== live_ticks per minute 07:00-11:45 UTC today ===');
  const r2 = await p.query(`
    SELECT to_char(ts AT TIME ZONE 'UTC', 'HH24:MI') m, count(*) c
    FROM live_ticks
    WHERE ts AT TIME ZONE 'UTC' BETWEEN (CURRENT_DATE + time '06:30') AND now()
    GROUP BY 1 ORDER BY 1`);
  let prev = null;
  for (const r of r2.rows) { console.log(' ', r.m, r.c); }

  console.log('=== sources breakdown last 24h ===');
  const r3 = await p.query(`SELECT source, count(*) c, max(ts) last FROM live_ticks WHERE ts > now() - interval '24 hours' GROUP BY 1`);
  for (const r of r3.rows) console.log(' ', r.source, r.c, r.last?.toISOString());

  console.log('=== marketwatch_snapshots per hour last 30h ===');
  const r4 = await p.query(`
    SELECT to_char(captured_at AT TIME ZONE 'Africa/Cairo', 'MM-DD HH24:00') h, count(*) c
    FROM marketwatch_snapshots WHERE captured_at > now() - interval '30 hours'
    GROUP BY 1 ORDER BY 1 DESC`);
  for (const r of r4.rows) console.log(' ', r.h, r.c);

  console.log('=== extension telemetry last errors (last 24h) ===');
  try {
    const r5 = await p.query(`
      SELECT to_char(created_at AT TIME ZONE 'Africa/Cairo','MM-DD HH24:MI') t, payload
      FROM extension_telemetry WHERE created_at > now() - interval '24 hours'
      ORDER BY created_at DESC LIMIT 12`);
    for (const r of r5.rows) {
      const pl = typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload;
      console.log(' ', r.t, JSON.stringify(pl).slice(0, 300));
    }
  } catch (e) { console.log('  telemetry query failed:', e.message); }
  await p.end();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
