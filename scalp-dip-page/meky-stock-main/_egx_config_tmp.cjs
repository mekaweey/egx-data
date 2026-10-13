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
  console.log('=== extension_config (all rows) ===');
  const q = await p.query(`SELECT key, value FROM extension_config ORDER BY key`);
  for (const r of q.rows) console.log(' ', r.key, '=', JSON.stringify(r.value));
  await p.end();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
