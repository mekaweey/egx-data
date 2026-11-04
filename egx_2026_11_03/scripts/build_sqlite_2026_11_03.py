# -*- coding: utf-8 -*-
"""Build the compact queryable SQLite database for the 2026-11-03 cutoff."""
from __future__ import annotations

import sqlite3
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "strategy-lab" / "outputs" / "egx_2026_11_03"
DATA = OUT / "data"
DB = OUT / "db" / "egx_2026_11_03.sqlite"
DB.parent.mkdir(parents=True, exist_ok=True)
if DB.exists():
    DB.unlink()

conn = sqlite3.connect(DB)
conn.execute("PRAGMA page_size=4096")
conn.execute("PRAGMA journal_mode=WAL")
conn.execute("PRAGMA synchronous=NORMAL")


def load(path: Path, **kwargs) -> pd.DataFrame:
    if not path.exists():
        print("missing", path, flush=True)
        return pd.DataFrame()
    print("read", path.name, flush=True)
    return pd.read_csv(path, low_memory=False, **kwargs)


def put(name: str, df: pd.DataFrame, index_cols: list[str] | None = None) -> None:
    if df.empty:
        print("skip empty", name, flush=True)
        return
    df.to_sql(name, conn, if_exists="replace", index=False, chunksize=20_000)
    if index_cols:
        cols = ", ".join(f'"{c}"' for c in index_cols)
        conn.execute(f'CREATE INDEX IF NOT EXISTS "ix_{name}" ON "{name}" ({cols})')
    print("table", name, df.shape, flush=True)


# Daily. The 2013-2022 archive stays in CSV.gz only.
put("daily_2023_2026", load(DATA / "prices" / "egx_daily_2023_2026_2026_11_03.csv.gz"), ["symbol", "date"])
put("daily_2026_11_03", load(DATA / "prices" / "egx_daily_2026_11_03.csv"), ["symbol"])

# Recent intraday windows.
m60 = load(DATA / "prices" / "egx_60m_2023_2026.csv.gz", usecols=[
    "symbol", "timestamp_cairo", "timestamp_utc", "date_cairo", "time_cairo",
    "open", "high", "low", "close", "volume", "volume_available", "source", "quality",
])
if not m60.empty:
    put("intraday_60m_recent", m60[m60["date_cairo"] >= "2026-10-01"], ["symbol", "date_cairo", "time_cairo"])

m5 = load(DATA / "prices" / "egx_5m_2023_2026.csv.gz", usecols=[
    "symbol", "timestamp_cairo", "timestamp_utc", "date_cairo", "time_cairo",
    "open", "high", "low", "close", "volume", "volume_available", "source", "quality",
])
if not m5.empty:
    put("intraday_5m_recent", m5[m5["date_cairo"] >= "2026-10-28"], ["symbol", "date_cairo", "time_cairo"])

m1_parts = []
for p in [DATA / "prices" / "egx_1m_2026_H1.csv.gz", DATA / "prices" / "egx_1m_2026_H2.csv.gz"]:
    if p.exists():
        m1_parts.append(pd.read_csv(p, low_memory=False))
if m1_parts:
    m1 = pd.concat(m1_parts, ignore_index=True)
    put("intraday_1m_recent", m1[m1["date_cairo"] >= "2026-11-03"], ["symbol", "date_cairo", "time_cairo"])

# Live snapshots (reconstructed; not live captures).
live = load(DATA / "live" / "live_snapshots_2026_11_03_all.csv")
put("live_snapshots", live, ["target_time", "symbol"])

# News (recent only; full history is in the CSV.gz).
news = load(DATA / "news" / "news_2026_11_01_2026_11_03.csv", usecols=[
    "code", "published_cairo", "published_utc", "heading", "heading_arabic", "section",
    "company_name_ar", "company_name_en", "reuters_code", "url", "seen_at_utc", "seen_at_cairo",
])
put("news_recent", news, ["published_utc"])

# Macro and indices.
put("macro_daily", load(DATA / "macro" / "macro_daily_2022_2026_2026_11_03.csv"), ["date"])
put("indices_daily", load(DATA / "indices" / "indices_daily_2023_2026_2026_11_03.csv"), ["date"])

# Universe and coverage.
put("universe", load(DATA / "universe" / "universe_all.csv"), ["symbol"])
put("coverage", load(DATA / "coverage" / "coverage_by_symbol_timeframe.csv"), ["symbol", "timeframe"])

# Bid/ask daily sample: last valid quote per symbol/date (history ends 2026-10-01).
bidask_path = DATA / "official" / "bidask_snapshots_2026_08_23_2026_10_01.csv.gz"
if bidask_path.exists():
    b = pd.read_csv(bidask_path, low_memory=False)
    b["date"] = b["captured_at_utc"].astype(str).str[:10]
    b = b.sort_values(["symbol", "date", "captured_at_utc"]).drop_duplicates(["symbol", "date"], keep="last")
    put("bidask_daily_sample", b, ["symbol", "date"])

# Official investor cumulative snapshot (through 2026-11-03, period unspecified).
put("investor_cumulative", load(DATA / "official" / "egx_investor_cumulative_2026_11_03.csv"), ["scope", "client_type"])

# Latest available official daily investor report: 2026-11-02 (not 2026-11-03).
inv_daily = load(DATA / "official" / "egx_daily_investor_report_2026_11_02.csv")
put("investor_daily_latest_available", inv_daily, ["table", "nationality"])

# Explicit metadata about gaps and scope.
meta = pd.DataFrame([
    ("data_cutoff", "2026-11-03"),
    ("build_date", "2026-11-04"),
    ("live_snapshots", "reconstructed_from_1m_and_previous_session_daily_not_live_capture"),
    ("bidask_2026_11_03", "unavailable_source_null"),
    ("daily_investor_2026_11_03", "missing_not_available_at_build_time"),
    ("investor_daily_latest_available", "2026-11-02_official_pdf_ID_1022"),
    ("exact_t0_216", "unverified_clean_union_248_used"),
    ("halal_98", "unresolved_97_found"),
    ("actual_fills", "unverified_no_execution_claim"),
], columns=["key", "value"])
put("metadata", meta, ["key"])

conn.commit()
conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
conn.execute("VACUUM")
conn.close()

print("db bytes", DB.stat().st_size, flush=True)
con = sqlite3.connect(DB)
for (name,) in con.execute("select name from sqlite_master where type='table' order by name"):
    n = con.execute(f"select count(*) from {name}").fetchone()[0]
    print(name, n)
con.close()
