const fs = require('fs');

const env = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
  }
});

const headers = {
  'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
  'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY
};

async function audit() {
  console.log("=== LIVE AUDIT ON SUNDAY SESSION (2026-09-20) ===");
  
  // 1. Check marketwatch_snapshots for today
  try {
    const url = `${env.SUPABASE_URL}/rest/v1/marketwatch_snapshots?captured_at=gte.2026-09-20T00:00:00Z&order=captured_at.desc&limit=10`;
    const res = await fetch(url, { headers });
    const data = await res.json();
    console.log(`\n1. Marketwatch Snapshots today: found ${data.length} latest rows`);
    if (data.length > 0) {
      console.log(`   Latest captured_at: ${data[0].captured_at}`);
      data.slice(0, 5).forEach(r => {
        console.log(`   Symbol: ${r.symbol} | Last: ${r.last_price} | Vol: ${r.volume_traded || r.volume} | Bid: ${r.highest_bid} x ${r.highest_bid_qty} | Ask: ${r.lowest_ask} x ${r.lowest_ask_qty}`);
      });
    }
    
    // Count distinct symbols in marketwatch_snapshots today
    const countUrl = `${env.SUPABASE_URL}/rest/v1/marketwatch_snapshots?select=symbol&captured_at=gte.2026-09-20T00:00:00Z`;
    const cRes = await fetch(countUrl, { headers: { ...headers, 'Range': '0-999' } });
    const cData = await cRes.json();
    const syms = new Set((cData || []).map(r => r.symbol));
    console.log(`   Distinct symbols in marketwatch_snapshots today: ${syms.size}`);
  } catch (e) {
    console.log("Error checking marketwatch:", e.message);
  }

  // 2. Check live_ticks for today
  try {
    const url = `${env.SUPABASE_URL}/rest/v1/live_ticks?ts=gte.2026-09-20T00:00:00Z&order=ts.desc&limit=5`;
    const res = await fetch(url, { headers });
    const data = await res.json();
    console.log(`\n2. Live Ticks today: found ${data.length} rows`);
    if (data.length > 0) {
      console.log(`   Latest tick ts: ${data[0].ts} for ${data[0].symbol}`);
    }
  } catch (e) {
    console.log("Error checking live_ticks:", e.message);
  }

  // 3. Check orderbook_snapshots for today
  try {
    const url = `${env.SUPABASE_URL}/rest/v1/orderbook_snapshots?created_at=gte.2026-09-20T00:00:00Z&order=created_at.desc&limit=5`;
    const res = await fetch(url, { headers });
    const data = await res.json();
    console.log(`\n3. Orderbook Snapshots today: found ${data.length} rows`);
    if (data.length > 0) {
      console.log(`   Latest OB ts: ${data[0].created_at} for ${data[0].symbol}`);
    }
  } catch (e) {
    console.log("Error checking orderbook:", e.message);
  }

  // 4. Check extension_diag
  try {
    const url = `${env.SUPABASE_URL}/rest/v1/extension_diag?order=ts.desc&limit=1`;
    const res = await fetch(url, { headers });
    const data = await res.json();
    console.log(`\n4. Latest Extension Diag:`);
    if (data.length > 0) {
      console.log(`   Diag ts: ${data[0].ts}`);
      console.log(`   Details:`, JSON.stringify(data[0]));
    }
  } catch (e) {
    console.log("Error checking diag:", e.message);
  }
}

audit();
