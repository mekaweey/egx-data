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

async function checkCov() {
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  
  // 1. covMw: marketwatch_snapshots
  const mwRes = await fetch(`${env.SUPABASE_URL}/rest/v1/marketwatch_snapshots?select=symbol&captured_at=gte.${fifteenMinAgo}&limit=2000`, { headers });
  const mw = new Set((await mwRes.json() || []).map(r => String(r.symbol).toUpperCase()));
  
  // 2. covQ: live_quotes
  const qRes = await fetch(`${env.SUPABASE_URL}/rest/v1/live_quotes?select=symbol&ts=gte.${fifteenMinAgo}&limit=2000`, { headers });
  const q = new Set((await qRes.json() || []).map(r => String(r.symbol).toUpperCase()));
  
  // 3. covT: live_ticks
  const tRes = await fetch(`${env.SUPABASE_URL}/rest/v1/live_ticks?select=symbol&ts=gte.${fifteenMinAgo}&limit=2000`, { headers });
  const t = new Set((await tRes.json() || []).map(r => String(r.symbol).toUpperCase()));
  
  const all = new Set([...mw, ...q, ...t]);
  
  console.log(`covMw (marketwatch): ${mw.size}`);
  console.log(`covQ (live_quotes):   ${q.size}`);
  console.log(`covT (live_ticks):    ${t.size}`);
  console.log(`covAll (UNION):       ${all.size}`);
  
  // Check live_quotes symbols: why are there so many in live_quotes?
  console.log(`\nWhat is in live_quotes?`);
  console.log(`Sample symbols in live_quotes (${q.size} total):`, [...q].slice(0, 30).join(', '));
  
  // Who is inserting into live_quotes?
  const qLatestRes = await fetch(`${env.SUPABASE_URL}/rest/v1/live_quotes?order=ts.desc&limit=5`, { headers });
  console.log(`\nLatest rows in live_quotes:`);
  console.log(await qLatestRes.json());
}

checkCov();
