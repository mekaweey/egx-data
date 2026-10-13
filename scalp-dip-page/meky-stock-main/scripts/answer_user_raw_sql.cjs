const fs = require('fs');
const { Pool } = require('pg');

const env = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(l => {
  if (l.includes('=') && !l.startsWith('#')) {
    const i = l.indexOf('=');
    env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
});

const pool = new Pool({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 15000 });

async function answerQueries() {
  console.log("==================== POINT 1: RAW QUERIES ====================");
  
  // 1. live_ticks distinct in last 5 min
  const q1 = await pool.query(`SELECT count(DISTINCT symbol) as count FROM live_ticks WHERE ts > now() - interval '5 minutes';`);
  console.log("SELECT count(DISTINCT symbol) FROM live_ticks WHERE ts > now() - interval '5 minutes':", q1.rows[0].count);
  
  const q1_syms = await pool.query(`SELECT DISTINCT symbol FROM live_ticks WHERE ts > now() - interval '5 minutes';`);
  console.log("Symbols in live_ticks (last 5 min):", q1_syms.rows.map(r => r.symbol));

  // live_quotes distinct in last 5 min
  const q2 = await pool.query(`SELECT count(DISTINCT symbol) as count FROM live_quotes WHERE ts > now() - interval '5 minutes';`);
  console.log("\nSELECT count(DISTINCT symbol) FROM live_quotes WHERE ts > now() - interval '5 minutes':", q2.rows[0].count);
  
  const q2_syms = await pool.query(`SELECT DISTINCT symbol FROM live_quotes WHERE ts > now() - interval '5 minutes' LIMIT 20;`);
  console.log("Sample symbols in live_quotes (last 5 min):", q2_syms.rows.map(r => r.symbol));

  console.log("\n==================== POINT 2: ORDERBOOK_SNAPSHOTS ====================");
  
  // Check orderbook_snapshots column name for time (is it ts or captured_at or created_at?)
  const colRes = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'orderbook_snapshots';`);
  console.log("Columns of orderbook_snapshots:", colRes.rows.map(r => r.column_name));

  const timeCol = colRes.rows.some(r => r.column_name === 'ts') ? 'ts' : 'created_at';
  const q3 = await pool.query(`SELECT count(DISTINCT symbol) as count FROM orderbook_snapshots WHERE ${timeCol} > now() - interval '5 minutes';`);
  console.log(`SELECT count(DISTINCT symbol) FROM orderbook_snapshots WHERE ${timeCol} > now() - interval '5 minutes':`, q3.rows[0].count);

  const q3_syms = await pool.query(`SELECT DISTINCT symbol FROM orderbook_snapshots WHERE ${timeCol} > now() - interval '5 minutes';`);
  console.log("Distinct symbols in orderbook_snapshots (last 5 min):", q3_syms.rows.map(r => r.symbol));

  // Let's also check marketwatch_snapshots
  const q4 = await pool.query(`SELECT count(DISTINCT symbol) as count FROM marketwatch_snapshots WHERE captured_at > now() - interval '5 minutes';`);
  console.log(`\nSELECT count(DISTINCT symbol) FROM marketwatch_snapshots WHERE captured_at > now() - interval '5 minutes':`, q4.rows[0].count);

  await pool.end();
}

answerQueries().catch(e => {
  console.error("SQL Error:", e.message);
  pool.end();
});
