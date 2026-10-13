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

async function check() {
  const tables = [
    { name: 'live_quotes', sort: 'ts' },
    { name: 'live_ticks', sort: 'ts' },
    { name: 'orderbook_snapshots', sort: 'created_at' },
    { name: 'marketwatch_snapshots', sort: 'captured_at' },
    { name: 'thunder_tape', sort: 'captured_at' },
    { name: 'extension_diag', sort: 'ts' }
  ];

  for (const t of tables) {
    try {
      const url = `${env.SUPABASE_URL}/rest/v1/${t.name}?limit=3&order=${t.sort}.desc`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        console.log(`[${t.name}] HTTP ${res.status}: ${await res.text()}`);
      } else {
        const data = await res.json();
        console.log(`\n=== [${t.name}] (${data.length} rows) ===`);
        data.forEach((row, i) => {
          console.log(`  Row ${i+1}: symbol=${row.symbol || row.source || ''} | time=${row.ts || row.captured_at || row.created_at || row.last_seen}`);
          console.log(`         details:`, JSON.stringify(row).slice(0, 160));
        });
      }
    } catch (e) {
      console.log(`[${t.name}] Error:`, e.message);
    }
  }

  // Print full latest extension_diag
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/extension_diag?limit=1&order=ts.desc`, { headers });
    const data = await res.json();
    console.log("\n=== LATEST EXTENSION_DIAG FULL ===");
    console.log(JSON.stringify(data[0], null, 2));
  } catch (e) {
    console.log('diag err:', e.message);
  }
}

check();
