const fs = require('fs');

const env = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
  const t = line.trim();
  if (t && !t.startsWith('#') && t.includes('=')) {
    const idx = t.indexOf('=');
    env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
  }
});

const headers = {
  'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
  'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY
};

async function test() {
  const url = `${env.SUPABASE_URL}/rest/v1/marketwatch_snapshots?select=symbol,last_price,highest_bid,lowest_ask,total_volume,captured_at&order=captured_at.desc&limit=15`;
  const res = await fetch(url, { headers });
  const rows = await res.json();
  console.log("=== LATEST 15 ROWS RECORDED IN SUPABASE RIGHT NOW ===");
  console.table(rows);
}

test();
