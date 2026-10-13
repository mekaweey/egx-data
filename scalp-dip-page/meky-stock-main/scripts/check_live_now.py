import os
import sys
from supabase import create_client

sys.stdout.reconfigure(encoding='utf-8')

def load_env(env_path):
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ[k.strip()] = v.strip().strip('"').strip("'")

load_env(r"D:\meky-stock-main\meky-stock-main\.env")
sb = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_ROLE_KEY'])

print("=== Checking latest rows across live tables ===")

# Check recent marketwatch_snapshots
mw = sb.table('marketwatch_snapshots').select('symbol, last_price, total_volume, captured_at').order('captured_at', desc=True).limit(5).execute()
print('\n--- Recent marketwatch_snapshots ---')
for r in mw.data:
    print(r)

# Check recent live_ticks
ticks = sb.table('live_ticks').select('symbol, price, volume, ts').order('ts', desc=True).limit(5).execute()
print('\n--- Recent live_ticks ---')
for r in ticks.data:
    print(r)

# Check recent live_quotes
quotes = sb.table('live_quotes').select('symbol, bid, ask, ts').order('ts', desc=True).limit(5).execute()
print('\n--- Recent live_quotes ---')
for r in quotes.data:
    print(r)

# Check recent extension_diag
diag = sb.table('extension_diag').select('*').order('created_at', desc=True).limit(3).execute()
print('\n--- Recent extension_diag ---')
for r in diag.data:
    print(r)

# Check recent ingest_diag
idiag = sb.table('ingest_diag').select('*').order('last_seen', desc=True).limit(3).execute()
print('\n--- Recent ingest_diag ---')
for r in idiag.data:
    print(r)
