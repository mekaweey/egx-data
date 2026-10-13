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
  console.log('=== extension_diag 09:00-15:00 Cairo today, per 10 min: rows, avg depth30s ===');
  const q = await p.query(`
    SELECT to_char(ts AT TIME ZONE 'Africa/Cairo','HH24:MI') t10,
           count(*) rows_n, round(avg(depth_count_30s),1) avg_depth, max(depth_count_30s) max_depth
    FROM extension_diag
    WHERE ts AT TIME ZONE 'Africa/Cairo' BETWEEN (CURRENT_DATE + time '09:00') AND (CURRENT_DATE + time '15:00')
    GROUP BY 1
    ORDER BY 1`);
  for (const r of q.rows) console.log(' ', r.t10, 'rows=' + r.rows_n, 'avgDepth=' + r.avg_depth, 'maxDepth=' + r.max_depth);

  console.log('\n=== yesterday same window (baseline) ===');
  const q2 = await p.query(`
    SELECT to_char(ts AT TIME ZONE 'Africa/Cairo','HH24:MI') t10,
           count(*) rows_n, round(avg(depth_count_30s),1) avg_depth
    FROM extension_diag
    WHERE ts AT TIME ZONE 'Africa/Cairo' BETWEEN ((CURRENT_DATE - 1) + time '09:00') AND ((CURRENT_DATE - 1) + time '15:00')
    GROUP BY 1
    ORDER BY 1`);
  for (const r of q2.rows) console.log(' ', r.t10, 'rows=' + r.rows_n, 'avgDepth=' + r.avg_depth);

  console.log('\n=== thunder_tick_archive today vs yesterday (hourly) ===');
  try {
    const q3 = await p.query(`SELECT to_char(ts AT TIME ZONE 'Africa/Cairo','MM-DD HH24:00') h, count(*) c, count(DISTINCT symbol) syms FROM thunder_tick_archive WHERE ts > now() - interval '40 hours' GROUP BY 1 ORDER BY 1 DESC`);
    for (const r of q3.rows) console.log(' ', r.h, 'rows=' + r.c, 'symbols=' + r.syms);
  } catch (e) { console.log('  archive:', e.message); }
  await p.end();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
