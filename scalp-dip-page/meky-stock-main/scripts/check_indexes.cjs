const fs = require('fs');
const { Pool } = require('pg');

const env = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(l => {
  if (l.includes('=') && !l.startsWith('#')) {
    const i = l.indexOf('=');
    env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
});

const pool = new Pool({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 10000 });

async function run() {
  console.log("Checking indexes on live_ticks, live_quotes, marketwatch_snapshots...");
  
  const res = await pool.query(`
    SELECT tablename, indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename IN ('live_ticks', 'live_quotes', 'marketwatch_snapshots', 'orderbook_snapshots')
    ORDER BY tablename, indexname;
  `);
  
  console.table(res.rows);
  await pool.end();
}

run().catch(e => {
  console.error("Index check error:", e.message);
  pool.end();
});
