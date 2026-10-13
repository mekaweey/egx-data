import os
import sys
import time
import math
import json
import pandas as pd
import numpy as np
from supabase import create_client

# ================= Configuration =================
ENV_FILE = r"D:\meky-stock-main\meky-stock-main\.env"
FOLDER_1 = r"D:\aaaa\supabase_export"
FOLDER_2 = r"F:\4.2million-44files"

def load_env(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ[k.strip()] = v.strip().strip('"').strip("'")

load_env(ENV_FILE)
URL = os.environ.get("SUPABASE_URL")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not URL or not KEY:
    print("❌ ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from .env")
    sys.exit(1)

sb = create_client(URL, KEY)

def clean_record(val):
    if pd.isna(val):
        return None
    if isinstance(val, (np.floating, float)):
        if math.isnan(val) or math.isinf(val):
            return None
        if float(val).is_integer():
            return int(val)
        return float(val)
    if isinstance(val, (np.integer, int)):
        return int(val)
    if isinstance(val, (np.bool_, bool)):
        return bool(val)
    if isinstance(val, str):
        val_str = val.strip()
        if (val_str.startswith("{") and val_str.endswith("}")) or (val_str.startswith("[") and val_str.endswith("]")):
            try:
                return json.loads(val_str)
            except Exception:
                return val
        return val
    return val

# Mapping of unique conflict keys per table
ON_CONFLICT_MAP = {
    "stocks": "symbol",
    "daily_candles": "symbol,date",
    "intraday_candles": "symbol,bucket_ts,interval_min",
    "fundamentals": "symbol,as_of",
    "macro_indicators": "as_of",
    "market_snapshots": "index_symbol,date",
    "pick_notifications": "pick_date,symbol,kind",
    "extension_config": "key",
    "strategy_settings": "key",
    "scalp_feasibility_report": "signal_id",
    "live_ticks": "id",
    "scalp_signal_log": "id",
    "news_sentiment": "id",
    "stock_snapshots": "id",
    "marketwatch_snapshots": "id",
    "daily_intelligence": "id",
    "daily_picks": "id",
    "ensemble_votes": "id",
    "execution_quality_log": "id",
    "scans": "id",
    "sniper_picks": "id",
    "walk_forward_days": "id",
    "walk_forward_runs": "id",
    "news_near_signal": "id",
}

EXCLUDE_ID_TABLES = {
    "daily_candles", "intraday_candles", "fundamentals", "macro_indicators",
    "market_snapshots", "pick_notifications", "extension_config",
    "strategy_settings", "scalp_feasibility_report"
}

def sanitize_dict(d, table_name=""):
    exclude_id = table_name in EXCLUDE_ID_TABLES
    return {k: clean_record(v) for k, v in d.items() if not (exclude_id and k == "id")}

def upload_dataframe(table_name, df, batch_size=2000, max_retries=4):
    total = len(df)
    if total == 0:
        print(f"  ⏭️ {table_name}: empty dataframe, skipping.")
        return 0

    on_conflict = ON_CONFLICT_MAP.get(table_name)
    print(f"\n🚀 Uploading {total:,} rows to table '{table_name}' (batch size: {batch_size:,}, on_conflict={on_conflict})...")
    start_time = time.time()
    uploaded = 0

    for i in range(0, total, batch_size):
        chunk = df.iloc[i : i + batch_size]
        records = chunk.to_dict(orient="records")
        records = [sanitize_dict(r, table_name) for r in records]

        success = False
        for attempt in range(1, max_retries + 1):
            try:
                if on_conflict:
                    sb.table(table_name).upsert(records, on_conflict=on_conflict).execute()
                else:
                    sb.table(table_name).upsert(records).execute()
                uploaded += len(records)
                success = True
                break
            except Exception as e:
                err_msg = str(e)
                if attempt == max_retries:
                    print(f"\n  ❌ Failed batch {i:,}-{i+len(records):,} on {table_name}: {err_msg[:200]}")
                else:
                    time.sleep(1.5 * attempt)

        pct = (uploaded / total) * 100
        elapsed = time.time() - start_time
        rate = uploaded / elapsed if elapsed > 0 else 0
        print(f"\r  📊 {table_name}: {uploaded:,}/{total:,} ({pct:.1f}%) - {rate:,.0f} rows/s", end="", flush=True)

    print(f"\n  ✅ Completed {table_name}: {uploaded:,} rows in {time.time() - start_time:.1f}s")
    return uploaded

def run_migration():
    print("=================================================================")
    print("📦 SUPABASE FULL DATA MIGRATION: FOLDER 1 & FOLDER 2 -> NEW DB")
    print(f"🎯 Target Project: {URL}")
    print("=================================================================")

    # 1. Stocks first
    stocks_path = os.path.join(FOLDER_1, "stocks.csv")
    if os.path.exists(stocks_path):
        df_stocks = pd.read_csv(stocks_path)
        upload_dataframe("stocks", df_stocks, batch_size=500)

    # 2. Priority list for Folder 1
    folder1_files = sorted(os.listdir(FOLDER_1))
    summary = {}

    for f in folder1_files:
        if not f.endswith(".csv") or f == "stocks.csv":
            continue
        table_name = f[:-4]
        file_path = os.path.join(FOLDER_1, f)
        try:
            df = pd.read_csv(file_path, low_memory=False)
            
            # Table-specific preprocessing
            if table_name == "live_ticks":
                df["source"] = "thunder_ext"
                if "id" in df.columns:
                    df = df.drop_duplicates(subset=["id"])
            elif table_name == "intraday_candles":
                df = df.drop_duplicates(subset=["symbol", "bucket_ts", "interval_min"])
            elif table_name == "daily_candles":
                df = df.drop_duplicates(subset=["symbol", "date"])
            elif table_name == "fundamentals":
                df = df.drop_duplicates(subset=["symbol", "as_of"])
            elif table_name == "market_snapshots":
                df = df.drop_duplicates(subset=["index_symbol", "date"])
            elif table_name == "macro_indicators":
                df = df.drop_duplicates(subset=["as_of"])
            elif table_name == "pick_notifications":
                df = df.drop_duplicates(subset=["pick_date", "symbol", "kind"])
            elif table_name in ("extension_config", "strategy_settings"):
                df = df.drop_duplicates(subset=["key"])
            elif table_name == "scalp_feasibility_report":
                df = df.drop_duplicates(subset=["signal_id"])
            elif "id" in df.columns:
                df = df.drop_duplicates(subset=["id"])

            cnt = upload_dataframe(table_name, df, batch_size=2500)
            summary[table_name] = cnt
        except Exception as e:
            print(f"❌ Error processing {f}: {e}")
            summary[table_name] = f"ERROR: {e}"

    # 3. Marketwatch Snapshots from Folder 2 (8 files)
    print("\n=================================================================")
    print("📦 PROCESSING FOLDER 2: marketwatch_snapshots (8 batch files)")
    print("=================================================================")
    f2_files = sorted(os.listdir(FOLDER_2))
    mw_total = 0

    for f in f2_files:
        if not f.endswith(".csv"):
            continue
        file_path = os.path.join(FOLDER_2, f)
        print(f"\n📂 Reading {f}...")
        try:
            # Semicolon separated
            df_mw = pd.read_csv(file_path, sep=";", low_memory=False)
            cnt = upload_dataframe("marketwatch_snapshots", df_mw, batch_size=3000)
            mw_total += cnt
        except Exception as e:
            print(f"❌ Error processing {f}: {e}")

    summary["marketwatch_snapshots"] = mw_total

    print("\n=================================================================")
    print("📋 FINAL MIGRATION VERIFICATION & SUMMARY")
    print("=================================================================")
    for tbl, count in summary.items():
        print(f"  • {tbl:30}: {count:,}" if isinstance(count, int) else f"  • {tbl:30}: {count}")

if __name__ == "__main__":
    run_migration()
