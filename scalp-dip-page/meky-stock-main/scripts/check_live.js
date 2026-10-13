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
    { name: 'orderbook_snapshots', sort: 'captured_at' },
    { name: 'marketwatch_snapshots', sort: 'captured_at' },
    { name: 'thunder_tape', sort: 'captured_at' },
    { name: 'extension_diag', sort: 'created_at' },
    { name: 'ingest_diag', sort: 'last_seen' }
  ];

  for (const t of tables) {
    try {
      const url = `${env.SUPABASE_URL}/rest/v1/${t.name}?limit=3&order=${t.sort}.desc`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        console.log(`[${t.name}] HTTP ${res.status}: ${await res.text()}`);
      } else {
        const data = await res.json();
        console.log(`\n=== [${t.name}] (Total returned: ${data.length}) ===`);
        data.forEach((row, i) => {
          console.log(`  Row ${i+1}:`, JSON.stringify(row));
        });
      }
    } catch (e) {
      console.log(`[${t.name}] Error:`, e.message);
    }
  }
}

check();
