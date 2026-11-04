# -*- coding: utf-8 -*-
"""Verify the 2026-11-03 delivery locally against the manifest and scope rules."""
from __future__ import annotations

import csv
import gzip
import hashlib
import json
import sqlite3
import sys
from pathlib import Path

import pandas as pd

HERE = Path(__file__).resolve()
if HERE.parent.name == "scripts" and (HERE.parent.parent / "MANIFEST.csv").exists():
    D = HERE.parent.parent
else:
    D = HERE.parents[1] / "strategy-lab" / "outputs" / "egx_2026_11_03"
DATA = D / "data"
CUTOFF = "2026-11-03"
errors: list[str] = []
checks: list[str] = []


def check(ok: bool, label: str, detail: str = "") -> None:
    if ok:
        checks.append(f"PASS {label} {detail}".strip())
    else:
        errors.append(f"FAIL {label} {detail}".strip())


def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def rows_physical(p: Path) -> int:
    if p.suffix == ".gz":
        with gzip.open(p, "rt", encoding="utf-8-sig", errors="replace") as f:
            return max(0, sum(1 for _ in f) - 1)
    with p.open("r", encoding="utf-8-sig", errors="replace") as f:
        return max(0, sum(1 for _ in f) - 1)


# Manifest integrity.
man_path = D / "MANIFEST.csv"
check(man_path.exists(), "manifest_exists")
if man_path.exists():
    man = pd.read_csv(man_path)
    check(len(man) > 0, "manifest_nonempty", str(len(man)))
    missing = []
    bad_size = []
    bad_hash = []
    for r in man.itertuples():
        p = D / str(r.path)
        if not p.exists():
            missing.append(str(r.path))
            continue
        if p.stat().st_size != int(r.bytes):
            bad_size.append(str(r.path))
        if sha256(p) != str(r.sha256):
            bad_hash.append(str(r.path))
    check(not missing, "manifest_files_exist", str(len(missing)))
    check(not bad_size, "manifest_sizes", str(len(bad_size)))
    check(not bad_hash, "manifest_sha256", str(len(bad_hash)))
    if missing:
        errors.append("missing paths: " + ", ".join(missing[:10]))
    if bad_size:
        errors.append("bad sizes: " + ", ".join(bad_size[:10]))
    if bad_hash:
        errors.append("bad hashes: " + ", ".join(bad_hash[:10]))

    manifest_paths = set(man["path"].astype(str))
    actual = {
        str(p.relative_to(D)).replace("\\", "/")
        for p in D.rglob("*")
        if p.is_file()
    }
    allowed_extra = {"MANIFEST.csv", "UPLOAD_STATUS.json", "docs/UPLOAD_VERIFICATION.md"}
    extra = actual - manifest_paths - allowed_extra
    check(not extra, "no_unmanifested_files", str(len(extra)))
    if extra:
        errors.append("extra files: " + ", ".join(sorted(extra)[:10]))

# Price cutoff.
price_files = {
    "daily": (DATA / "prices" / "egx_daily_2023_2026_2026_11_03.csv.gz", "date"),
    "daily_full": (DATA / "prices" / "egx_daily_full_2013_2026_2026_11_03.csv.gz", "date"),
    "m1_h2": (DATA / "prices" / "egx_1m_2026_H2.csv.gz", "date_cairo"),
    "m5": (DATA / "prices" / "egx_5m_2023_2026.csv.gz", "date_cairo"),
    "m60": (DATA / "prices" / "egx_60m_2023_2026.csv.gz", "date_cairo"),
}
for name, (p, col) in price_files.items():
    x = pd.read_csv(p, usecols=[col], low_memory=False)
    s = x[col].astype(str)
    check(s.max() <= CUTOFF, f"{name}_max_date", s.max())
    check(not (s.str[:10] == "2026-11-04").any(), f"{name}_no_2026_11_04")

daily_last = pd.read_csv(DATA / "prices" / "egx_daily_2026_11_03.csv", low_memory=False)
check(len(daily_last) == 309, "daily_last_rows", str(len(daily_last)))
check(daily_last["date"].astype(str).eq(CUTOFF).all(), "daily_last_date")
check(daily_last["is_partial"].eq(0).all(), "daily_last_not_partial")
check(daily_last["symbol"].nunique() == 309, "daily_last_symbols", str(daily_last["symbol"].nunique()))

# News.
news = pd.read_csv(DATA / "news" / "news_2026_11_01_2026_11_03.csv", low_memory=False)
check(len(news) == 227, "news_recent_rows", str(len(news)))
check(news["published_cairo"].astype(str).str[:10].max() == CUTOFF, "news_recent_max")
check(int((news["published_cairo"].astype(str).str[:10] == CUTOFF).sum()) == 53, "news_recent_03_rows")
full_news = pd.read_csv(DATA / "news" / "egx_official_disclosures_2022_2026_2026_11_03.csv.gz", usecols=["published_cairo"], low_memory=False)
check(len(full_news) == 72283, "news_full_rows", str(len(full_news)))
check(full_news["published_cairo"].astype(str).str[:10].max() == CUTOFF, "news_full_max")
check(int((full_news["published_cairo"].astype(str).str[:10] == CUTOFF).sum()) == 53, "news_full_03_rows")
check(not (full_news["published_cairo"].astype(str).str[:10] == "2026-11-04").any(), "news_full_no_2026_11_04")

# Macro.
macro = pd.read_csv(DATA / "macro" / "macro_daily_2022_2026_2026_11_03.csv", low_memory=False)
check(len(macro) == 1514, "macro_rows", str(len(macro)))
check(macro["date"].astype(str).max() == CUTOFF, "macro_max")
check(not (macro["date"].astype(str) == "2026-11-04").any(), "macro_no_2026_11_04")
check(macro["usdegp"].notna().sum() > 0 and macro["us10y"].notna().sum() > 0, "macro_series_present")

# Indices.
idx = pd.read_csv(DATA / "indices" / "indices_daily_2023_2026_2026_11_03.csv", low_memory=False)
check(len(idx) == 727, "indices_rows", str(len(idx)))
check(idx["date"].astype(str).max() == CUTOFF, "indices_max")
last_idx = idx[idx["date"].astype(str) == CUTOFF]
check(len(last_idx) == 1 and int(last_idx["is_final"].iloc[0]) == 1, "indices_last_final")
check(not (idx["date"].astype(str) == "2026-11-04").any(), "indices_no_2026_11_04")

# Live.
live_expected = {"0955": 245, "1355": 232, "1405": 232}
for tag, n in live_expected.items():
    p = DATA / "live" / f"live_snapshots_2026_11_03_{tag}.csv"
    x = pd.read_csv(p)
    check(len(x) == n, f"live_{tag}_rows", str(len(x)))
    check(x["bid"].isna().all() and x["ask"].isna().all(), f"live_{tag}_bidask_null")
    check(x["is_live_capture"].eq(0).all(), f"live_{tag}_not_live_capture")
    check(x["target_time"].eq(f"{tag[:2]}:{tag[2:]}").all(), f"live_{tag}_target")
live_all = pd.read_csv(DATA / "live" / "live_snapshots_2026_11_03_all.csv")
check(len(live_all) == 709, "live_all_rows", str(len(live_all)))
check(live_all["bid"].isna().all() and live_all["ask"].isna().all(), "live_all_bidask_null")
check(live_all["is_live_capture"].eq(0).all(), "live_all_not_live_capture")
check(live_all["snapshot_status"].str.contains("reconstructed|preopen_reference").all(), "live_all_status")
check(live_all.loc[live_all.target_time == "13:55", "last_bar_time"].astype(str).str[:5].max() < "13:55", "live_1355_last_bar_before")
check(live_all.loc[live_all.target_time == "14:05", "last_bar_time"].astype(str).str[:5].max() < "14:05", "live_1405_last_bar_before")

# Investor.
inv_cum = pd.read_csv(DATA / "official" / "egx_investor_cumulative_2026_11_03.csv", low_memory=False)
check(len(inv_cum) == 48, "investor_cumulative_rows", str(len(inv_cum)))
check(inv_cum["as_of_status"].str.contains("assumed_cumulative").all(), "investor_cumulative_label")
inv_daily = pd.read_csv(DATA / "official" / "egx_daily_investor_report_2026_11_02.csv", low_memory=False)
check(len(inv_daily) == 12, "investor_daily_latest_rows", str(len(inv_daily)))
check(inv_daily["report_date"].eq("2026-11-02").all(), "investor_daily_latest_date")
check((DATA / "official" / "MISSING_2026_11_03_DAILY_INVESTOR.md").exists(), "missing_investor_note")

# Universe/coverage.
u = pd.read_csv(DATA / "universe" / "universe_all.csv", low_memory=False)
check(len(u) == 306, "universe_rows", str(len(u)))
for col, n in [("in_clean_union_248", 248), ("in_official_C", 221), ("in_halal_97", 97), ("in_top100_liquidity", 100)]:
    check(int(u[col].sum()) == n, f"universe_{col}", str(int(u[col].sum())))
for col, n in [("1m_rows", 243), ("5m_rows", 243), ("60m_rows", 243), ("bidask_rows", 238)]:
    check(int(u[col].notna().sum()) == n, f"universe_{col}", str(int(u[col].notna().sum())))
check(int(u["in_daily_323"].sum()) == 303, "universe_daily_303", str(int(u["in_daily_323"].sum())))
cov = pd.read_csv(DATA / "coverage" / "coverage_by_symbol_timeframe.csv", low_memory=False)
check(len(cov) == 729, "coverage_rows", str(len(cov)))

# Bid/ask.
b = pd.read_csv(DATA / "official" / "bidask_snapshots_2026_08_23_2026_10_01.csv.gz", low_memory=False, usecols=["captured_at_utc"])
check(len(b) == 2298634, "bidask_rows", str(len(b)))
check(b["captured_at_utc"].astype(str).str[:10].max() == "2026-10-01", "bidask_last")

# SQLite.
db = D / "db" / "egx_2026_11_03.sqlite"
check(db.exists(), "db_exists")
check(db.stat().st_size < 100 * 1024 * 1024, "db_under_100mb", str(db.stat().st_size))
con = sqlite3.connect(db)
expected_tables = {
    "daily_2023_2026": 206545, "daily_2026_11_03": 309,
    "intraday_1m_recent": 39302, "intraday_5m_recent": 54335, "intraday_60m_recent": 27325,
    "live_snapshots": 709, "news_recent": 227, "macro_daily": 1514, "indices_daily": 727,
    "universe": 306, "coverage": 729, "bidask_daily_sample": 4931,
    "investor_cumulative": 48, "investor_daily_latest_available": 12, "metadata": 9,
}
for t, n in expected_tables.items():
    got = con.execute(f'select count(*) from "{t}"').fetchone()[0]
    check(got == n, f"db_{t}", str(got))
meta = dict(con.execute("select key, value from metadata").fetchall())
con.close()
check(meta.get("data_cutoff") == CUTOFF, "db_metadata_cutoff", str(meta.get("data_cutoff")))

# No 2026-11-04 filenames in data.
bad_names = [str(p.relative_to(D)) for p in D.rglob("*") if p.is_file() and "2026_11_04" in p.name]
check(not bad_names, "no_2026_11_04_filenames", str(len(bad_names)))

print("CHECKS", len(checks), "ERRORS", len(errors))
for c in checks:
    print(c)
for e in errors:
    print(e)
if errors:
    sys.exit(1)
print("ALL CHECKS PASSED")
