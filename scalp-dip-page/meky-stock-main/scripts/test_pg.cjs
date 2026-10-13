const fs = require('fs');
const { Pool } = require('pg');

const env = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(l => {
  if (l.includes('=') && !l.startsWith('#')) {
    const i = l.indexOf('=');
    env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
});

const pool = new Pool({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 5000 });

async function check() {
  console.log("Connecting to PostgreSQL...");
  const t0 = Date.now();
  const res = await pool.query("SELECT count(*) FROM marketwatch_snapshots;");
  console.log("Total marketwatch_snapshots:", res.rows[0].count, "Time:", Date.now() - t0, "ms");
  
  const t1 = Date.now();
  const latest = await pool.query("SELECT captured_at FROM marketwatch_snapshots ORDER BY captured_at DESC LIMIT 1;");
  console.log("Latest captured_at:", latest.rows[0].captured_at, "Time:", Date.now() - t1, "ms");
  
  // Check index on captured_at
  const idx = await pool.query("SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'marketwatch_snapshots';");
  console.log("Indexes on marketwatch_snapshots:", idx.rows.map(r => r.indexname));
  
  await pool.end();
}

check().catch(e => {
  console.error("PG Error:", e.message);
  pool.end();
});
