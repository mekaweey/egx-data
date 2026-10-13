// Query actual database size and table counts via Supabase REST API + RPC
const https = require('https');
const fs = require('fs');

const env = {};
fs.readFileSync('.env', 'utf8').split(/\r?\n/).forEach((l) => {
  const m = l.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, '');
});

const PROJECT_ID = env.SUPABASE_PROJECT_ID || 'zeranlkxpioondyluzgl';
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const BASE_URL = `https://${PROJECT_ID}.supabase.co`;
const ARCHIVE_LOG = 'D:/1All Data/_exports_log.csv';

function rpc(fn, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body || {});
    const options = {
      hostname: `${PROJECT_ID}.supabase.co`,
      port: 443,
      path: `/rest/v1/rpc/${fn}`,
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(options, (res) => {
      let b = '';
      res.on('data', (chunk) => (b += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(b)); } catch (e) { resolve(b); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function supabaseGetRowCount(table) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: `${PROJECT_ID}.supabase.co`,
      port: 443,
      path: `/rest/v1/${table}?select=id&limit=1`,
      method: 'GET',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Prefer: 'count=exact',
        Accept: 'application/json',
      },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        const countHeader = res.headers['content-range'];
        let totalCount = null;
        if (countHeader) {
          const parts = countHeader.split('/');
          totalCount = parts.length > 1 ? parseInt(parts[1], 10) : null;
        }
        resolve({ status: res.statusCode, totalCount, body });
      });
    });
    req.on('error', reject);
    req.end();
  });
}



function parseArchiveLog(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split(/\r?\n/);
    const runs = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      if (cols.length >= 7) {
        const timestamp = cols[0];
        const table = cols[1];
        const totalDbRows = parseInt(cols[2], 10);
        const deleted = parseInt(cols[5], 10);
        const dryRun = cols[6].toLowerCase() === 'true';
        if (!runs.length || runs[runs.length - 1].timestamp !== timestamp) {
          runs.push({ timestamp, dryRun, entries: [] });
        }
        runs[runs.length - 1].entries.push({ table, totalDbRows, deleted });
      }
    }
    return [...runs].reverse().find((r) => !r.dryRun) || null;
  } catch { return null; }
}

async function run() {
  console.log('Querying Supabase for actual database size and table counts...');
  console.log('Base URL:', BASE_URL);
  console.log('');

  // 1. Actual DB size via get_db_size() RPC (pg_database_size)
  console.log('=== ACTUAL SQL: pg_database_size(current_database()) ===');
  try {
    const sizeData = await rpc('get_db_size', {});
    const row = Array.isArray(sizeData) && sizeData[0] ? sizeData[0] : null;
    if (row) {
      const bytes = row.total_bytes;
      const mb = (bytes / 1024 / 1024).toFixed(1);
      const pretty = row.human_size || mb + ' MB';
      console.log(`  Database size: ${pretty} (${bytes} bytes, ~${mb} MB)`);
    } else {
      console.log('  Response:', JSON.stringify(sizeData));
    }
  } catch (e) {
    console.log('  ERROR calling get_db_size():', e.message);
  }

  // 2. Live table counts
  console.log('');
  console.log('=== Table Row Counts (live via REST API) ===');
  const tables = ['live_ticks', 'marketwatch_snapshots', 'orderbook_snapshots', 'live_quotes'];
  let total = 0;
  const counts = {};
  for (const table of tables) {
    try {
      const r = await supabaseGetRowCount(table);
      const count = r.totalCount || 0;
      counts[table] = count;
      total += count;
      console.log(`  ${table}: ${count} rows (HTTP ${r.status})`);
    } catch (e) {
      console.log(`  ${table}: ERROR - ${e.message}`);
      counts[table] = 0;
    }
  }
  console.log(`  Total: ${total} rows`);

  // 3. Archive log analysis
  console.log('');
  console.log('=== Archive Log Analysis ===');
  const archiveRun = parseArchiveLog(ARCHIVE_LOG);
  if (archiveRun) {
    console.log(`  Last real archive run: ${archiveRun.timestamp}`);
    console.log(`  (dry_run=FALSE)`);
    let totalDeleted = 0;
    for (const e of archiveRun.entries) {
      console.log(`  ${e.table}: ${e.totalDbRows} total before -> ${e.deleted} deleted`);
      totalDeleted += e.deleted;
    }
    console.log(`  Total rows deleted in last run: ${totalDeleted}`);
  } else {
    console.log('  No real (non-dry-run) archive found in log.');
  }

  // 4. New data since archive
  console.log('');
  console.log('=== New Data Since Archive ===');
  if (archiveRun) {
    for (const e of archiveRun.entries) {
      const remaining = e.totalDbRows - e.deleted;
      const current = counts[e.table] || 0;
      const delta = current - remaining;
      if (delta > 0) console.log(`  ${e.table}: +${delta} new rows (${remaining} -> ${current})`);
    }
  }

  // 5. Storage context
  console.log('');
  console.log('=== Storage Context ===');
  console.log('  Supabase Free tier limit: 500 MB');
  console.log('  NOTE: PostgreSQL does NOT shrink the DB file on DELETE.');
  console.log('  Auto-VACUUM marks dead tuples for reuse (not disk reclaim).');
  console.log('  The safety-net cron job (cleanup_if_needed at 03:00 UTC)');
  console.log('  handles VACUUM FULL if size exceeds 495MB.');
}

run().catch((e) => console.error('Fatal:', e.message));
