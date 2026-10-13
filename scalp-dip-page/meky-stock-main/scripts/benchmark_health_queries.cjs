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

async function timeQuery(name, url) {
  const t0 = Date.now();
  try {
    const res = await fetch(url, { headers });
    const ms = Date.now() - t0;
    console.log(`[${name}] status: ${res.status} | time: ${ms}ms`);
    return { ok: res.ok, ms };
  } catch (e) {
    console.log(`[${name}] ERROR: ${e.message} | time: ${Date.now() - t0}ms`);
  }
}

async function benchmark() {
  const now = new Date();
  const t60 = new Date(now.getTime() - 150_000).toISOString();
  const tCov = new Date(now.getTime() - 15 * 60_000).toISOString();
  const t5m = new Date(now.getTime() - 5 * 60_000).toISOString();
  
  console.log("=== BENCHMARKING INDIVIDUAL SUPABASE QUERIES ===");
  
  await timeQuery("1. latestRow captured_at", `${env.SUPABASE_URL}/rest/v1/marketwatch_snapshots?select=captured_at&order=captured_at.desc&limit=1`);
  await timeQuery("2. count last 5m", `${env.SUPABASE_URL}/rest/v1/marketwatch_snapshots?captured_at=gte.${t5m}&select=*&head=true`);
  await timeQuery("3. live_ticks latest", `${env.SUPABASE_URL}/rest/v1/live_ticks?select=ts&order=ts.desc&limit=1`);
  await timeQuery("4. live_ticks 60s", `${env.SUPABASE_URL}/rest/v1/live_ticks?select=symbol,price,volume,ts&ts=gte.${t60}`);
  await timeQuery("5. orderbook latest", `${env.SUPABASE_URL}/rest/v1/orderbook_snapshots?select=ts,symbol,best_bid,best_ask&order=ts.desc&limit=1`);
  await timeQuery("6. orderbook 60s", `${env.SUPABASE_URL}/rest/v1/orderbook_snapshots?select=symbol,best_bid,best_ask,ts&ts=gte.${t60}`);
  await timeQuery("7. live_quotes latest", `${env.SUPABASE_URL}/rest/v1/live_quotes?select=ts,symbol,bid,ask&order=ts.desc&limit=1`);
  await timeQuery("8. live_quotes 60s", `${env.SUPABASE_URL}/rest/v1/live_quotes?select=symbol,bid,ask,ts&ts=gte.${t60}`);
  await timeQuery("9. covMw (15m)", `${env.SUPABASE_URL}/rest/v1/marketwatch_snapshots?select=symbol,captured_at&captured_at=gte.${tCov}`);
  await timeQuery("10. covQ (15m)", `${env.SUPABASE_URL}/rest/v1/live_quotes?select=symbol,ts&ts=gte.${tCov}`);
  await timeQuery("11. covT (15m)", `${env.SUPABASE_URL}/rest/v1/live_ticks?select=symbol,ts&ts=gte.${tCov}`);
}

benchmark();
