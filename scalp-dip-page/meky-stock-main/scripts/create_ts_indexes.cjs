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

async function fix() {
  console.log("Adding missing ts DESC indexes to live_quotes and orderbook_snapshots...");
  
  const t0 = Date.now();
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_live_quotes_ts_desc ON public.live_quotes (ts DESC);`);
  console.log("Created idx_live_quotes_ts_desc in", Date.now() - t0, "ms");
  
  const t1 = Date.now();
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_orderbook_snapshots_ts_desc ON public.orderbook_snapshots (ts DESC);`);
  console.log("Created idx_orderbook_snapshots_ts_desc in", Date.now() - t1, "ms");
  
  // Test query speeds now
  const t2 = Date.now();
  const q1 = await pool.query("SELECT ts, symbol, bid, ask FROM live_quotes ORDER BY ts DESC LIMIT 1;");
  console.log("live_quotes latest query:", q1.rows[0], "in", Date.now() - t2, "ms (WAS 57,000ms!)");
  
  const t3 = Date.now();
  const q2 = await pool.query("SELECT ts, symbol, best_bid, best_ask FROM orderbook_snapshots ORDER BY ts DESC LIMIT 1;");
  console.log("orderbook_snapshots latest query:", q2.rows[0], "in", Date.now() - t3, "ms (WAS 34,000ms!)");

  await pool.end();
}

fix().catch(e => {
  console.error("Index creation error:", e.message);
  pool.end();
});
