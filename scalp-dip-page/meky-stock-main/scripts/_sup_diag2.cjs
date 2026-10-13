'use strict';
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync(require('path').join(__dirname,'..','.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, '');
}
const { Pool } = require('pg');
const p = new Pool({ connectionString: env.DATABASE_URL });
(async () => {
  const jobs = await p.query('SELECT jobid, jobname, schedule, active FROM cron.job ORDER BY jobname');
  console.log('--- cron.job ---');
  for (const j of jobs.rows) console.log(`${j.jobname} | ${j.schedule} | active=${j.active}`);
  const r = await p.query(`SELECT max(captured_at) last, count(*) c FROM marketwatch_snapshots WHERE captured_at > now() - interval '1 day'`);
  console.log('SNAP last 24h:', JSON.stringify(r.rows[0]));
  const r2 = await p.query('SELECT captured_at FROM marketwatch_snapshots ORDER BY captured_at DESC LIMIT 5');
  console.log('LAST 5 SNAPS:');
  for (const x of r2.rows) console.log('  ' + x.captured_at.toISOString());
  await p.end();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
