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

async function apply() {
  const sql = fs.readFileSync('supabase/migrations/20260918000001_decision_audit_log.sql', 'utf8');
  await pool.query(sql);
  console.log('Migration applied successfully!');
  const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'decision_audit_log'");
  console.log('Verified table:', res.rows);
  await pool.end();
}

apply().catch(e => {
  console.error('Migration error:', e.message);
  pool.end();
});
