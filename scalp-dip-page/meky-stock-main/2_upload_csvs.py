#!/usr/bin/env python3
"""2_upload_csvs.py - Upload CSV files from D:\\files into Supabase project."""

import os, sys, time, traceback
from pathlib import Path
from uuid import uuid4
import pandas as pd
from supabase import create_client

CSV_DIR = Path(r"D:\files")
BATCH_SIZE = 5000
MAX_RETRIES = 3


def load_dotenv_if_needed():
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
    load_dotenv_if_needed()
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("ERROR: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set.")
        sys.exit(1)
    return create_client(url, key)

def sf(v):
    if v is None or v == "" or (isinstance(v, float) and pd.isna(v)):
        return None
    try:
        return float(v)
    except (ValueError, TypeError):
        return None

def si(v):
    f = sf(v)
    return int(f) if f is not None else None

def ss(v):
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return None
    s = str(v).strip()
    return s if s else None

def sb(v):
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return None
    return str(v).strip().lower() in ("true", "1", "yes", "t")

def nts(v):
    if v is None or v == "":
        return None
    try:
        return pd.to_datetime(v).isoformat()
    except Exception:
        return None

def upload_batches(client, table, rows, desc, upsert=False, on_conflict=None):
    total = len(rows)
    if total == 0:
        print(f"  SKIP: {desc} (0 rows)")
        return 0
    inserted = 0
    for start in range(0, total, BATCH_SIZE):
        chunk = rows[start:start + BATCH_SIZE]
        for attempt in range(MAX_RETRIES):
            try:
                if upsert:
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
        print(f"  {desc}: {inserted:,}/{total} ({pct}%)")
    print(f"  DONE: {desc} -> {inserted:,} rows in '{table}'")
    return inserted


def up_depth(client):
    p = CSV_DIR / "depth_imbalance.csv"
    if not p.exists() or p.stat().st_size == 0:
        print("  SKIP: depth_imbalance.csv empty/missing")
        return 0
    print(f"\n  {p.name} -> seed_depth_imbalance")
    df = pd.read_csv(p, dtype=str, low_memory=False)
    print(f"  {len(df):,} rows")
    rows = []
    for _, r in df.iterrows():
        rows.append({
            "symbol": ss(r.get("symbol")),
            "ts": nts(r.get("ts")),
            "best_bid": sf(r.get("best_bid")),
            "best_bid_qty": sf(r.get("total_bid_qty")),
            "best_ask": sf(r.get("best_ask")),
            "best_ask_qty": sf(r.get("total_ask_qty")),
            "last_price": sf(r.get("best_ask")),
            "bids_depth": {"bid_ask_ratio": sf(r.get("bid_ask_ratio")), "bid_levels": si(r.get("bid_levels"))},
            "asks_depth": {"ask_levels": si(r.get("ask_levels"))},
            "source": "depth_imbalance_csv",
        })
    rows = [x for x in rows if x["symbol"] and x["ts"]]
    return upload_batches(client, "seed_depth_imbalance", rows, "seed_depth_imbalance")


def up_news(client):
    p = CSV_DIR / "news_near_signal.csv"
    if not p.exists() or p.stat().st_size == 0:
        print("  SKIP: news_near_signal.csv empty/missing")
        return 0
    print(f"\n  {p.name} -> seed_news_sentiment")
    df = pd.read_csv(p, dtype=str, encoding="utf-8-sig", low_memory=False)
    print(f"  {len(df):,} rows")
    rows = []
    for _, r in df.iterrows():
        score = sf(r.get("sentiment_score"))
        if score is not None:
            s = "positive" if score > 0.1 else ("negative" if score < -0.1 else "neutral")
        else:
            s = "neutral"
        rows.append({
            "symbol": ss(r.get("symbol")),
            "headline": ss(r.get("headline")),
            "published_at": nts(r.get("news_ts")),
            "sentiment": s,
            "sentiment_score": score,
            "impact_level": "medium",
            "source_name": ss(r.get("news_id")),
            "ai_model": ss(r.get("signal_id")),
            "summary_ar": f"price={ss(r.get('last_price'))} decision={ss(r.get('decision'))}",
        })
    rows = [x for x in rows if x["symbol"] and x["headline"]]
    return upload_batches(client, "seed_news_sentiment", rows, "seed_news_sentiment")


def up_opening_range(client):
    p = CSV_DIR / "opening_range.csv"
    if not p.exists() or p.stat().st_size == 0:
        print("  SKIP: opening_range.csv empty/missing")
        return 0
    print(f"\n  {p.name} -> seed_opening_range")
    df = pd.read_csv(p, dtype=str, low_memory=False)
    print(f"  {len(df):,} rows")
    rows = []
    for _, r in df.iterrows():
        st = nts(r.get("or_start_ts"))
        et = nts(r.get("or_end_ts"))
        interval = 0
        if st and et:
            try:
                interval = int((pd.to_datetime(et) - pd.to_datetime(st)).total_seconds() / 60)
            except Exception:
                interval = 0
        oh = sf(r.get("or_high"))
        ol = sf(r.get("or_low"))
        rows.append({
            "symbol": ss(r.get("symbol")),
            "trade_date": str(r.get("trade_date")),
            "bucket_ts": st,
            "interval_min": max(interval, 1),
            "open": ol if ol is not None else 0,
            "high": oh if oh is not None else 0,
            "low": ol if ol is not None else 0,
            "close": oh if oh is not None else 0,
            "volume": si(r.get("or_volume")) or 0,
            "tick_count": si(r.get("ticks_in_range")) or 0,
        })
    rows = [x for x in rows if x["symbol"] and x["trade_date"]]
    return upload_batches(client, "seed_opening_range", rows, "seed_opening_range", upsert=True, on_conflict="symbol,bucket_ts,interval_min")


def up_paper_trades(client):
    p = CSV_DIR / "paper_trades_analytics.csv"
    if not p.exists() or p.stat().st_size == 0:
        print("  SKIP: paper_trades_analytics.csv empty/missing")
        return 0
    print(f"\n  {p.name} -> seed_paper_trades_analytics")
    df = pd.read_csv(p, dtype=str, low_memory=False)
    print(f"  {len(df):,} rows")
    rows = []
    for _, r in df.iterrows():
        rows.append({
            "trade_date": str(r.get("trade_date")),
            "strategy": ss(r.get("strategy")),
            "symbol": ss(r.get("symbol")),
            "trades": si(r.get("trades")),
            "total_pnl": sf(r.get("total_pnl")),
            "avg_pnl": sf(r.get("avg_pnl")),
            "avg_pnl_pct": sf(r.get("avg_pnl_pct")),
            "avg_hold_sec": sf(r.get("avg_hold_sec")),
            "wins": si(r.get("wins")),
            "losses": si(r.get("losses")),
            "win_rate_pct": sf(r.get("win_rate_pct")),
            "tp_hits": si(r.get("tp_hits")),
            "sl_hits": si(r.get("sl_hits")),
            "trail_exits": si(r.get("trail_exits")),
            "time_exits": si(r.get("time_exits")),
            "eod_exits": si(r.get("eod_exits")),
        })
    rows = [x for x in rows if x["trade_date"] and x["strategy"] and x["symbol"]]
    return upload_batches(client, "seed_paper_trades_analytics", rows, "seed_paper_trades_analytics")


def up_reversals(client):
    p = CSV_DIR / "signal_reversal_check.csv"
    if not p.exists() or p.stat().st_size == 0:
        print("  SKIP: signal_reversal_check.csv empty/missing")
        return 0
    print(f"\n  {p.name} -> seed_signal_reversal_check")
    df = pd.read_csv(p, dtype=str, low_memory=False)
    print(f"  {len(df):,} rows")
    rows = []
    for _, r in df.iterrows():
        rows.append({
            "trade_id": ss(r.get("trade_id")),
            "symbol": ss(r.get("symbol")),
            "strategy": ss(r.get("strategy")),
            "entry_ts": nts(r.get("entry_ts")),
            "exit_price": sf(r.get("exit_price")),
            "exit_ts": nts(r.get("exit_ts")),
            "max_price_next_5min": sf(r.get("max_price_next_5min")),
            "min_price_next_5min": sf(r.get("min_price_next_5min")),
            "pnl": sf(r.get("pnl")),
            "reversed_below_exit": sb(r.get("reversed_below_exit")),
        })
    rows = [x for x in rows if x["symbol"]]
    return upload_batches(client, "seed_signal_reversal_check", rows, "seed_signal_reversal_check")


def up_strategy_overview(client):
    p = CSV_DIR / "strategy_overview.csv"
    if not p.exists() or p.stat().st_size == 0:
        print("  SKIP: strategy_overview.csv empty/missing")
        return 0
    print(f"\n  {p.name} -> seed_strategy_overview")
    df = pd.read_csv(p, dtype=str, low_memory=False)
    print(f"  {len(df):,} rows")
    rows = []
    for _, r in df.iterrows():
        fd = str(r.get("first_date"))
        td = str(r.get("last_date"))
        rows.append({
            "strategy_version": ss(r.get("strategy")),
            "from_date": fd if fd and fd != "nan" else None,
            "to_date": td if td and td != "nan" else None,
            "min_confidence": 0,
            "symbols_count": si(r.get("symbols_traded")),
            "total_trades": si(r.get("total_trades")),
            "wins": si(r.get("wins")),
            "losses": si(r.get("losses")),
            "open_trades": 0,
            "win_rate": sf(r.get("win_rate_pct")),
            "avg_win_pct": sf(r.get("avg_win")),
            "avg_loss_pct": sf(r.get("avg_loss")),
            "profit_factor": None,
            "expectancy_pct": sf(r.get("avg_pnl")),
            "max_drawdown_pct": None,
            "sharpe": None,
            "total_return_pct": sf(r.get("total_pnl")),
            "best_trade_pct": sf(r.get("best_trade")),
            "worst_trade_pct": sf(r.get("worst_trade")),
            "avg_days_held": (sf(r.get("avg_hold_sec")) or 0) / 86400.0,
            "error_message": None,
        })
    rows = [x for x in rows if x.get("from_date") and x.get("strategy_version")]
    return upload_batches(client, "seed_strategy_overview", rows, "seed_strategy_overview", upsert=True, on_conflict="strategy_version,from_date")


def up_rankings(client):
    p = CSV_DIR / "strategy_symbol_ranking.csv"
    if not p.exists() or p.stat().st_size == 0:
        print("  SKIP: strategy_symbol_ranking.csv empty/missing")
        return 0
    print(f"\n  {p.name} -> seed_strategy_symbol_ranking")
    df = pd.read_csv(p, dtype=str, low_memory=False)
    print(f"  {len(df):,} rows")
    rows = []
    for _, r in df.iterrows():
        rows.append({
            "strategy": ss(r.get("strategy")),
            "symbol": ss(r.get("symbol")),
            "total_pnl": sf(r.get("total_pnl")),
            "avg_pnl": sf(r.get("avg_pnl")),
            "trades": si(r.get("trades")),
            "win_rate_pct": sf(r.get("win_rate_pct")),
            "wins": si(r.get("wins")),
        })
    rows = [x for x in rows if x["strategy"] and x["symbol"]]
    return upload_batches(client, "seed_strategy_symbol_ranking", rows, "seed_strategy_symbol_ranking", upsert=True, on_conflict="strategy,symbol")


def up_vwap(client):
    p = CSV_DIR / "symbol_vwap_daily.csv"
    if not p.exists() or p.stat().st_size == 0:
        print("  SKIP: symbol_vwap_daily.csv empty/missing")
        return 0
    print(f"\n  {p.name} -> seed_symbol_vwap_daily")
    df = pd.read_csv(p, dtype=str, low_memory=False)
    print(f"  {len(df):,} rows")
    rows = []
    for _, r in df.iterrows():
        ap = sf(r.get("avg_price"))
        vwap = sf(r.get("vwap"))
        rows.append({
            "symbol": ss(r.get("symbol")),
            "date": str(r.get("trade_date")),
            "open": ap,
            "high": sf(r.get("day_high")),
            "low": sf(r.get("day_low")),
            "close": vwap if vwap is not None else ap,
            "volume": si(r.get("total_volume")) or 0,
        })
    rows = [x for x in rows if x["symbol"] and x["date"]]
    return upload_batches(client, "seed_symbol_vwap_daily", rows, "seed_symbol_vwap_daily", upsert=True, on_conflict="symbol,date")


def main():
    print("=" * 70)
    print("  2_upload_csvs.py -- CSV Uploader")
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

    uploaders = [
        up_depth,
        up_news,
        up_opening_range,
        up_paper_trades,
        up_reversals,
        up_strategy_overview,
        up_rankings,
        up_vwap,
    ]

    total = 0
    failed = 0
    for up in uploaders:
        try:
            total += up(client)
        except Exception as e:
            print(f"  FAILED: {up.__name__}: {e}")
            traceback.print_exc()
            failed += 1

    print()
    print("=" * 70)
    print(f"  TOTAL INSERTED: {total:,} rows")
    print(f"  FAILED FILES:   {failed}")
    print("=" * 70)


if __name__ == "__main__":
    main()

