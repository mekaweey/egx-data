'use strict';
const fs = require('fs');
const path = require('path');
const env = {};
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, '');
}
const { Pool } = require('pg');
const p = new Pool({ connectionString: env.DATABASE_URL });
(async () => {
  // Check recency of every thunder/extension-related table
  const tables = [
    'thunder_tape', 'thunder_watchlist_snapshots', 'marketwatch_snapshots',
  ];
  for (const t of tables) {
    try {
      const cols = await p.query(`SELECT column_name FROM information_schema.columns WHERE table_name=$1 AND table_schema='public' ORDER BY ordinal_position`, [t]);
      if (!cols.rows.length) { console.log(t + ': TABLE NOT FOUND'); continue; }
      const colNames = cols.rows.map(r => r.column_name);
      const tsCol = colNames.find(c => /ts$|_at$|^ts/.test(c));
      if (!tsCol) { console.log(t + ': no ts col; cols=' + colNames.join(',')); continue; }
      const r = await p.query(`SELECT max("${tsCol}") mx, count(*) c FROM "${t}" WHERE "${tsCol}" > now() - interval '6 hours'`);
      console.log(`${t} [${tsCol}]: last6h=${r.rows[0].c} last=${r.rows[0].mx ? new Date(r.rows[0].mx).toISOString() : 'none'}`);
    } catch (e) { console.log(t + ': ERR ' + e.message); }
  }
  await p.end();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
