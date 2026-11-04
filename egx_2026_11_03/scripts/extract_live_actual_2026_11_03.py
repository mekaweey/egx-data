# -*- coding: utf-8 -*-
"""Extract the actual 2026-11-03 live snapshots from the live PostgreSQL source.

The live extension DB contains `marketwatch_snapshots` for 2026-11-03 at
13:55:00 and 14:05:02 Cairo (237 symbols each).  It also contains AALR-only
`orderbook_snapshots` with best bid/ask.  No other symbol has a verified
2026-11-03 bid/ask, so those fields stay null rather than being invented.

The 09:55 target is before the 10:00 open and has no live snapshot; its
previous-session pre-open reference is kept unchanged.

This script overwrites the reconstructed 13:55/14:05 files with actual
snapshots and preserves the old reconstructed versions as
`*_reconstructed_1m.csv` fallbacks.
"""
from __future__ import annotations

import json
import shutil
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import pandas as pd
import psycopg2

ROOT = Path(__file__).resolve().parents[1]
DST = ROOT / "strategy-lab" / "outputs" / "egx_2026_11_03"
LIVE = DST / "data" / "live"
PRICES = DST / "data" / "prices"
CAIRO = ZoneInfo("Africa/Cairo")
CUTOFF = "2026-11-03"
ENV_PATH = Path(r"D:\meky-stock-main\meky-stock-main\.env")

COLUMNS = [
    "symbol", "scanner_symbol", "target_time", "captured_at_cairo", "last_price",
    "open", "high", "low", "volume", "change_pct", "bid", "ask", "bid_qty", "ask_qty",
    "in_clean_union", "source", "open_source", "bidask_source", "bidask_captured_at_cairo",
    "snapshot_status", "data_quality", "bidask_status", "is_live_capture", "bars_used",
    "first_bar_time", "last_bar_time", "last_bar_timestamp_cairo", "prev_close", "reference_date",
]


def load_env(path: Path) -> dict[str, str]:
    env = {}
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def write_csv(df: pd.DataFrame, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, index=False, encoding="utf-8", lineterminator="\n")


ENV = load_env(ENV_PATH)
CON = psycopg2.connect(ENV["DATABASE_URL"])
try:
    actual = pd.read_sql(
        """
        select
            symbol,
            to_char(captured_at at time zone 'Africa/Cairo','YYYY-MM-DD"T"HH24:MI:SS') || '+02:00' as captured_at_cairo,
            to_char(captured_at at time zone 'Africa/Cairo','HH24:MI') as target_time,
            last_price, open_price, high_price, low_price, total_volume,
            previous_close, last_change_prc,
            highest_bid, lowest_ask, highest_bid_qty, lowest_ask_qty,
            total_trades, total_value, symbol_state, is_same_day
        from marketwatch_snapshots
        where (captured_at at time zone 'Africa/Cairo')::date = date '2026-11-03'
          and to_char(captured_at at time zone 'Africa/Cairo','HH24:MI') in ('13:55','14:05')
        order by symbol, captured_at
        """,
        CON,
    )
    aalr = pd.read_sql(
        """
        select
            to_char(ts at time zone 'Africa/Cairo','YYYY-MM-DD"T"HH24:MI:SS') || '+02:00' as bidask_captured_at_cairo,
            to_char(ts at time zone 'Africa/Cairo','HH24:MI') as target_time,
            best_bid, best_bid_qty, best_ask, best_ask_qty, last_price, spread
        from orderbook_snapshots
        where (ts at time zone 'Africa/Cairo')::date = date '2026-11-03'
          and symbol = 'AALR'
          and to_char(ts at time zone 'Africa/Cairo','HH24:MI') in ('13:55','14:05')
        order by ts
        """,
        CON,
    )
finally:
    CON.close()

if actual.empty:
    raise SystemExit("No actual marketwatch rows for 2026-11-03")
if actual.groupby(["target_time", "symbol"]).size().max() > 1:
    raise SystemExit("Duplicate symbol at a target time; refine the query")

# Daily open is the actual opening price of the 2026-11-03 session.  The
# marketwatch open_price column is null for these snapshots.
daily = pd.read_csv(PRICES / "egx_daily_2026_11_03.csv", usecols=["symbol", "open"], low_memory=False)
daily["symbol"] = daily["symbol"].astype(str).str.upper().str.strip()
open_map = daily.drop_duplicates("symbol").set_index("symbol")["open"]

clean = pd.read_csv(DST / "data" / "universe" / "clean_union.csv")["symbol"].astype(str).str.upper().str.strip()
clean_set = set(clean)
top100 = pd.read_csv(DST / "data" / "universe" / "top100_liquidity.csv")["symbol"].astype(str).str.upper().str.strip()
top100_set = set(top100)

# AALR orderbook: choose the closest row to the target minute (earliest at/after
# the target, otherwise the last before it).
aalr = aalr.copy()
aalr["target_time"] = aalr["target_time"].astype(str)
aalr_by_target: dict[str, pd.Series] = {}
for target in ["13:55", "14:05"]:
    sub = aalr[aalr["target_time"] == target].copy()
    if sub.empty:
        continue
    # Prefer the earliest row at/after the target minute; the 13:55:00 row is
    # exact, the 14:05 rows start at 14:05:00/14:05:02.
    aalr_by_target[target] = sub.iloc[0]

frames = []
for target in ["13:55", "14:05"]:
    g = actual[actual["target_time"].astype(str) == target].copy()
    if g.empty:
        raise SystemExit(f"No actual rows for {target}")
    g["symbol"] = g["symbol"].astype(str).str.upper().str.strip()
    g["scanner_symbol"] = "EGX:" + g["symbol"]
    g["captured_at_cairo"] = g["captured_at_cairo"].astype(str)
    g["last_price"] = pd.to_numeric(g["last_price"], errors="coerce")
    g["open"] = g["symbol"].map(open_map)
    g["high"] = pd.to_numeric(g["high_price"], errors="coerce")
    g["low"] = pd.to_numeric(g["low_price"], errors="coerce")
    g["volume"] = pd.to_numeric(g["total_volume"], errors="coerce")
    g["change_pct"] = pd.to_numeric(g["last_change_prc"], errors="coerce")
    g["bid"] = pd.to_numeric(g["highest_bid"], errors="coerce")
    g["ask"] = pd.to_numeric(g["lowest_ask"], errors="coerce")
    g["bid_qty"] = pd.to_numeric(g["highest_bid_qty"], errors="coerce")
    g["ask_qty"] = pd.to_numeric(g["lowest_ask_qty"], errors="coerce")
    g["in_clean_union"] = g["symbol"].isin(clean_set).astype(int)
    g["source"] = "postgres:marketwatch_snapshots"
    g["open_source"] = "egx_daily_2026_11_03"
    g["bidask_source"] = None
    g["bidask_captured_at_cairo"] = None
    g["snapshot_status"] = "actual_marketwatch_snapshot"
    g["data_quality"] = "actual_live_snapshot_marketwatch"
    g["bidask_status"] = "unavailable_source_null"
    g["is_live_capture"] = 1
    g["bars_used"] = 0
    g["first_bar_time"] = None
    g["last_bar_time"] = None
    g["last_bar_timestamp_cairo"] = g["captured_at_cairo"]
    g["prev_close"] = pd.to_numeric(g["previous_close"], errors="coerce")
    g["reference_date"] = CUTOFF

    # AALR is the only symbol with a verified order-book snapshot.
    if target in aalr_by_target:
        row = aalr_by_target[target]
        mask = g["symbol"] == "AALR"
        g.loc[mask, "bid"] = row["best_bid"]
        g.loc[mask, "ask"] = row["best_ask"]
        g.loc[mask, "bid_qty"] = row["best_bid_qty"]
        g.loc[mask, "ask_qty"] = row["best_ask_qty"]
        g.loc[mask, "bidask_source"] = "postgres:orderbook_snapshots"
        g.loc[mask, "bidask_captured_at_cairo"] = row["bidask_captured_at_cairo"]
        g.loc[mask, "bidask_status"] = "actual_orderbook_snapshot_AALR_only"

    frames.append(g[COLUMNS].copy())

# Preserve the old reconstructed 13:55/14:05 files before overwriting them.
for target in ["1355", "1405"]:
    src = LIVE / f"live_snapshots_2026_11_03_{target}.csv"
    dst = LIVE / f"live_snapshots_2026_11_03_{target}_reconstructed_1m.csv"
    if src.exists() and not dst.exists():
        shutil.copy2(src, dst)

# 09:55 stays the previous-session pre-open reference; add the new source columns.
p = pd.read_csv(LIVE / "live_snapshots_2026_11_03_0955.csv")
p["open_source"] = "previous_session_daily_2026_11_02"
p["bidask_source"] = None
p["bidask_captured_at_cairo"] = None
p = p[COLUMNS].copy()

# Add the same columns to the preserved reconstructed fallbacks for a
# consistent schema.
for target in ["1355", "1405"]:
    path = LIVE / f"live_snapshots_2026_11_03_{target}_reconstructed_1m.csv"
    if path.exists():
        r = pd.read_csv(path)
        r["open_source"] = "egx_1m_2026_H2.csv.gz"
        r["bidask_source"] = None
        r["bidask_captured_at_cairo"] = None
        r = r[COLUMNS].copy()
        write_csv(r, path)

actual_1355, actual_1405 = frames
write_csv(p, LIVE / "live_snapshots_2026_11_03_0955.csv")
write_csv(actual_1355, LIVE / "live_snapshots_2026_11_03_1355.csv")
write_csv(actual_1405, LIVE / "live_snapshots_2026_11_03_1405.csv")
live_all = pd.concat([p, actual_1355, actual_1405], ignore_index=True)
write_csv(live_all, LIVE / "live_snapshots_2026_11_03_all.csv")

summary = {
    "snapshot_date": CUTOFF,
    "generated_at_cairo": datetime.now(CAIRO).isoformat(timespec="seconds"),
    "bidask": "actual_AALR_only_others_null",
    "is_live_capture": "mixed",
    "targets": {
        "09:55": {
            "rows": int(len(p)),
            "symbols": int(p["symbol"].nunique()),
            "method": "preopen_reference_previous_session_daily_ohlcv",
            "is_live_capture": 0,
            "reference_date": "2026-11-02",
            "bidask_symbols": 0,
        },
        "13:55": {
            "rows": int(len(actual_1355)),
            "symbols": int(actual_1355["symbol"].nunique()),
            "method": "actual_marketwatch_snapshot",
            "is_live_capture": 1,
            "captured_at_cairo": str(actual_1355["captured_at_cairo"].iloc[0]),
            "in_clean_union": int(actual_1355["in_clean_union"].sum()),
            "outside_clean_union": int((actual_1355["in_clean_union"] == 0).sum()),
            "clean_missing_count": int(len(clean_set - set(actual_1355["symbol"]))),
            "top100_actual": int(actual_1355["symbol"].isin(top100_set).sum()),
            "top100_missing": sorted(top100_set - set(actual_1355["symbol"])),
            "bidask_symbols": int(actual_1355["bid"].notna().sum()),
            "open_source": "egx_daily_2026_11_03",
        },
        "14:05": {
            "rows": int(len(actual_1405)),
            "symbols": int(actual_1405["symbol"].nunique()),
            "method": "actual_marketwatch_snapshot",
            "is_live_capture": 1,
            "captured_at_cairo": str(actual_1405["captured_at_cairo"].iloc[0]),
            "in_clean_union": int(actual_1405["in_clean_union"].sum()),
            "outside_clean_union": int((actual_1405["in_clean_union"] == 0).sum()),
            "clean_missing_count": int(len(clean_set - set(actual_1405["symbol"]))),
            "top100_actual": int(actual_1405["symbol"].isin(top100_set).sum()),
            "top100_missing": sorted(top100_set - set(actual_1405["symbol"])),
            "bidask_symbols": int(actual_1405["bid"].notna().sum()),
            "open_source": "egx_daily_2026_11_03",
        },
    },
    "fallback": {
        "note": "The old 1m reconstructions are preserved as *_reconstructed_1m.csv for the 232 symbols that have 1m bars; the main files are actual snapshots.",
        "reconstructed_1355_rows": 232,
        "reconstructed_1405_rows": 232,
    },
    "caveat": (
        "09:55 is a pre-open reference using 2026-11-02 daily OHLCV, not a live capture. "
        "13:55 and 14:05 are actual marketwatch snapshots from the live PostgreSQL source "
        "(237 symbols each; 14:05 was captured at 14:05:02 Cairo). The marketwatch open_price "
        "column is null; open is taken from the actual 2026-11-03 daily open. Bid/ask and "
        "quantities are available only for AALR from orderbook_snapshots; all other symbols "
        "have null bid/ask because no verified 2026-11-03 quote source exists. No quote or "
        "price was invented. No 2026-11-04 data is included."
    ),
}
(LIVE / "live_snapshot_summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

print("actual rows:", len(actual_1355), len(actual_1405))
print("symbols:", actual_1355["symbol"].nunique(), actual_1405["symbol"].nunique())
print("clean union:", int(actual_1355["in_clean_union"].sum()), "outside:", int((actual_1355["in_clean_union"] == 0).sum()))
print("bid/ask non-null:", int(actual_1355["bid"].notna().sum()), int(actual_1405["bid"].notna().sum()))
print("09:55 rows:", len(p))
print("all rows:", len(live_all))
print("written:", LIVE)
