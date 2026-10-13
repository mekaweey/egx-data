#!/usr/bin/env python3
"""3_upload_core_tables.py - Upload core CSVs to matching Supabase tables."""
import os, sys, time, json
from pathlib import Path
import pandas as pd
from supabase import create_client

CSV_DIR = Path(r"D:\aaaa\supabase_export")
BATCH_SIZE = 5000
MAX_RETRIES = 3

# Conflict target for upsert (UNIQUE constraint columns, not PK if CSV IDs differ)
TABLE_KEYS = {
    "daily_candles": "symbol,date",
    "daily_intelligence": "id",
    "daily_picks": "id",
    "ensemble_votes": "id",
    "execution_quality_log": "id",
    "extension_config": "key",
    "fundamentals": "id",
    "intraday_candles": "symbol,bucket_ts,interval_min",
    "live_ticks": "id",
    "macro_indicators": "id",
    "market_snapshots": "id",
    "news_near_signal": None,
    "news_sentiment": "id",
    "pick_notifications": "id",
    "scalp_feasibility_report": "id",
    "scalp_signal_log": "id",
    "scans": "id",
    "sniper_picks": "id",
    "stock_snapshots": "id",
    "stocks": "symbol",
    "strategy_settings": "key",
    "walk_forward_days": "id",
    "walk_forward_runs": "id",
}

# Deduplication keys for tables with duplicates in CSV
DEDUP_KEYS = {
    "intraday_candles": ["symbol", "bucket_ts", "interval_min"],
    "scalp_signal_log": ["id"],
}

# JSONB columns (need JSON parsing from string)
JSON_COLUMNS = {
    "live_ticks": ["meta"],
    "walk_forward_days": ["picks"],
    "fundamentals": ["raw_data"],
}

def load_env():
    p = Path(r"D:\meky-stock-main\meky-stock-main\.env")
    if not p.exists() or "SUPABASE_URL" in os.environ:
        return
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        v = v.strip().strip(chr(34)).strip(chr(39))
        os.environ.setdefault(k.strip(), v)

def get_supabase():
    load_env()
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("ERROR: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set.")
        sys.exit(1)
    return create_client(url, key)

def clean_value(v):
    if v is None:
        return None
    if isinstance(v, float) and pd.isna(v):
        return None
    if isinstance(v, str):
        s = v.strip()
        if s == "" or s.lower() == "nan" or s.lower() == "none" or s == "None":
            return None
        return s
    return v

def try_parse_json(v):
    if v is None:
        return None
    s = str(v).strip()
    if not s or s.lower() == "nan" or s.lower() == "none":
        return None
    try:
        return json.loads(s)
    except (json.JSONDecodeError, TypeError):
        return None

def upload_batches(client, table, rows, on_conflict=None):
    total = len(rows)
    if total == 0:
        print("  SKIP: 0 rows")
        return 0
    inserted = 0
    for start in range(0, total, BATCH_SIZE):
        chunk = rows[start:start + BATCH_SIZE]
        for attempt in range(MAX_RETRIES):
            try:
                if on_conflict:
                    client.from_(table).upsert(chunk, on_conflict=on_conflict).execute()
                else:
                    client.from_(table).insert(chunk).execute()
                inserted += len(chunk)
                break
            except Exception as e:
                if attempt < MAX_RETRIES - 1:
                    print(f"    retry {attempt+1}/{MAX_RETRIES}: {e}")
                    time.sleep(2 ** attempt)
                else:
                    print(f"    FAIL: {e}")
                    if chunk:
                    print(f"    sample: {chunk[0]}")
        pct = int((start + len(chunk)) / total * 100)
        print(f"  {inserted:,}/{total} ({pct}%)")
    print(f"  DONE: {inserted:,} rows")
    return inserted

def clean_row(r, csv_cols, table):
    json_cols = JSON_COLUMNS.get(table, [])
    result = {}
    for col in csv_cols:
        val = r.get(col)
        if col in json_cols:
            result[col] = try_parse_json(val)
        else:
                    result[col] = clean_value(val)
    return result

def main():
    print("=" * 70)
    print("  3_upload_core_tables.py -- Core Table CSV Uploader")
    print("=" * 70)
    print(f"  CSV Directory: {CSV_DIR}")
    print(f"  Batch Size:    {BATCH_SIZE}")
    print()

    if not CSV_DIR.exists():
        print(f"ERROR: CSV directory not found: {CSV_DIR}")
        sys.exit(1)

    print("Connecting to Supabase...")
    client = get_supabase()
    print(f"  Connected to: {os.environ.get('SUPABASE_URL')}")
    print()

    csv_files = sorted(f for f in os.listdir(CSV_DIR) if f.endswith(".csv"))
    print(f"Found {len(csv_files)} CSV files:")
    for f in csv_files:
        table = f.replace(".csv", "")
        fpath = CSV_DIR / f
        size = fpath.stat().st_size
        print(f"  {f} -> table {table} ({size:,} bytes)")
    print()

    total_all = 0
    failed = 0

    for fname in csv_files:
        table = fname.replace(".csv", "")
        fpath = CSV_DIR / fname

        try:
            r_before = client.table(table).select("*", count="exact").limit(0).execute()
            before = r_before.count if r_before.count else 0
        except Exception:
            before = 0

        print(f"\n  {fname} -> {table}")
        print(f"  Existing rows: {before:,}")

        try:
            df = pd.read_csv(fpath, dtype=str, low_memory=False)
        except Exception as e:
            print(f"  ERROR reading CSV: {e}")
            failed += 1
            continue

        # Deduplicate if needed
        dedup_cols = DEDUP_KEYS.get(table)
        if dedup_cols:
            before_dedup = len(df)
            df = df.drop_duplicates(subset=dedup_cols, keep="first")
            after_dedup = len(df)
            if before_dedup != after_dedup:
                removed = before_dedup - after_dedup
                print(f"  Dedup: {before_dedup:,} -> {after_dedup:,} (removed {removed:,})")

        # Filter live_ticks to only thunder_ext (CHECK constraint)
        if table == "live_ticks" and "source" in df.columns:
            before_filter = len(df)
            df = df[df["source"] == "thunder_ext"]
            print(f"  Filtered: {before_filter:,} -> {len(df):,} (thunder_ext only)")

        row_count = len(df)
        print(f"  CSV rows: {row_count:,}")

        if row_count == 0:
            print(f"  SKIP: {fname} is empty")
            continue

        csv_cols = list(df.columns)
        rows = []
        for _, r in df.iterrows():
            rows.append(clean_row(r, csv_cols, table))

        on_conflict = TABLE_KEYS.get(table)
        inserted = upload_batches(client, table, rows, on_conflict=on_conflict)
        total_all += inserted

        try:
            r_after = client.table(table).select("*", count="exact").limit(0).execute()
            after = r_after.count if r_after.count else 0
            print(f"  Verified: {after:,} total rows in {table}")
        except Exception:
            pass

    print()
    print("=" * 70)
    print(f"  TOTAL ROWS UPLOADED: {total_all:,}")
    print(f"  FAILED FILES:        {failed}")
    print("=" * 70)

if __name__ == "__main__":
    main()