const fs = require('fs');
const { Pool } = require('pg');

const env = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(l => {
  if (l.includes('=') && !l.startsWith('#')) {
    const i = l.indexOf('=');
    env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
});

const pool = new Pool({ connectionString: env.DATABASE_URL });

async function check() {
  const res = await pool.query(`
    SELECT source, count(*), count(DISTINCT symbol) as distinct_symbols 
    FROM live_quotes 
    WHERE ts > now() - interval '5 minutes' 
    GROUP BY source;
  `);
  console.table(res.rows);
  await pool.end();
}

check().catch(e => { console.error(e); pool.end(); });
