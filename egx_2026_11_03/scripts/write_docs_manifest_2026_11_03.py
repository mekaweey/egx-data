# -*- coding: utf-8 -*-
"""Write README, checklist, dictionary, missing-data notes and MANIFEST.csv."""
from __future__ import annotations

import gzip
import hashlib
import json
import shutil
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
D = ROOT / "strategy-lab" / "outputs" / "egx_2026_11_03"
DATA = D / "data"
CUTOFF = "2026-11-03"
NOW = datetime.now(ZoneInfo("Africa/Cairo")).isoformat(timespec="seconds")

# ---------------------------------------------------------------------------
# Curated build/validation scripts (provenance, not required to use the data).
# ---------------------------------------------------------------------------
SCRIPTS = [
    "build_delivery_2026_11_03.py",
    "build_sqlite_2026_11_03.py",
    "extract_live_actual_2026_11_03.py",
    "build_investor_report_2026_11_02.py",
    "fix_universe_scope_2026_11_03.py",
    "inspect_2026_11_03.py",
    "validate_delivery_2026_11_03.py",
    "write_docs_manifest_2026_11_03.py",
    "verify_delivery_2026_11_03.py",
]
sdir = D / "scripts"
sdir.mkdir(parents=True, exist_ok=True)
for old in sdir.glob("*.py"):
    old.unlink()
for name in SCRIPTS:
    src = ROOT / "strategy-lab" / name
    if src.exists():
        shutil.copy2(src, sdir / name)
    else:
        print("script missing", name, flush=True)
(sdir / "README.md").write_text(
    "# Scripts\n\n"
    "These are the cutoff build, extraction, validation and manifest scripts used for this package.\n"
    "They are provenance, not a requirement for using the data. The upstream 2026-11-04 collection/build\n"
    "scripts remain in the project's `strategy-lab/` directory and are not duplicated here.\n\n"
    "- `build_delivery_2026_11_03.py` filters the source build to 2026-11-03 and rebuilds live/coverage/universe tables.\n"
    "- `build_investor_report_2026_11_02.py` records the latest available official daily investor report (2026-11-02).\n"
    "- `fix_universe_scope_2026_11_03.py` keeps the stock universe at 306 and documents the 20 non-stock/index daily rows.\n"
    "- `build_sqlite_2026_11_03.py` builds the compact SQLite database.\n"
    "- `write_docs_manifest_2026_11_03.py` writes the documentation and SHA256 manifest.\n"
    "- `verify_delivery_2026_11_03.py` verifies manifest hashes, cutoff, counts and known gaps.\n"
    "- `inspect_2026_11_03.py` / `validate_delivery_2026_11_03.py` are read-only inspection helpers.\n",
    encoding="utf-8",
)

# ---------------------------------------------------------------------------
# Counts (computed from the delivered files).
# ---------------------------------------------------------------------------
def basic(path: Path, date_col: str, symbol_col: str = "symbol") -> dict:
    x = pd.read_csv(path, usecols=[symbol_col, date_col], low_memory=False)
    return {
        "rows": int(len(x)),
        "symbols": int(x[symbol_col].nunique()),
        "first": str(x[date_col].min()),
        "last": str(x[date_col].max()),
    }

daily = basic(DATA / "prices" / "egx_daily_2023_2026_2026_11_03.csv.gz", "date")
daily_full = basic(DATA / "prices" / "egx_daily_full_2013_2026_2026_11_03.csv.gz", "date")
archive = basic(DATA / "prices" / "egx_daily_2013_2022_archive.csv.gz", "date")
ref = basic(DATA / "reference" / "egx_daily_egx_data_pack_69_2022_2026.csv.gz", "date")
m1 = basic(DATA / "prices" / "egx_1m_2026_H2.csv.gz", "date_cairo")
m5 = basic(DATA / "prices" / "egx_5m_2023_2026.csv.gz", "date_cairo")
m60 = basic(DATA / "prices" / "egx_60m_2023_2026.csv.gz", "date_cairo")
# 1m full history: coverage rows; first/last from files.
cov1 = pd.read_csv(DATA / "coverage" / "coverage_1m.csv", low_memory=False)
cov5 = pd.read_csv(DATA / "coverage" / "coverage_5m.csv", low_memory=False)
cov60 = pd.read_csv(DATA / "coverage" / "coverage_60m.csv", low_memory=False)
m1_full = {"rows": int(cov1["rows"].sum()), "symbols": int(cov1["symbol"].nunique()), "first": str(cov1["first_date"].min()), "last": str(cov1["last_date"].max())}
m5_full = {"rows": int(cov5["rows"].sum()), "symbols": int(cov5["symbol"].nunique()), "first": str(cov5["first_date"].min()), "last": str(cov5["last_date"].max())}
m60_full = {"rows": int(cov60["rows"].sum()), "symbols": int(cov60["symbol"].nunique()), "first": str(cov60["first_date"].min()), "last": str(cov60["last_date"].max())}

h2 = pd.read_csv(DATA / "prices" / "egx_1m_2026_H2.csv.gz", usecols=["symbol", "date_cairo"], low_memory=False)
h2d = h2[h2["date_cairo"] == CUTOFF]
m1_day = {"rows": int(len(h2d)), "symbols": int(h2d["symbol"].nunique())}
m5d = pd.read_csv(DATA / "prices" / "egx_5m_2023_2026.csv.gz", usecols=["symbol", "date_cairo"], low_memory=False)
m5d = m5d[m5d["date_cairo"] == CUTOFF]
m5_day = {"rows": int(len(m5d)), "symbols": int(m5d["symbol"].nunique())}
m60d = pd.read_csv(DATA / "prices" / "egx_60m_2023_2026.csv.gz", usecols=["symbol", "date_cairo"], low_memory=False)
m60d = m60d[m60d["date_cairo"] == CUTOFF]
m60_day = {"rows": int(len(m60d)), "symbols": int(m60d["symbol"].nunique())}

daily_last = pd.read_csv(DATA / "prices" / "egx_daily_2026_11_03.csv", low_memory=False)
last_sources = daily_last["source"].value_counts().to_dict()
news = pd.read_csv(DATA / "news" / "news_2026_11_01_2026_11_03.csv", low_memory=False)
news_full = pd.read_csv(DATA / "news" / "egx_official_disclosures_2022_2026_2026_11_03.csv.gz", usecols=["published_cairo"], low_memory=False)
macro = pd.read_csv(DATA / "macro" / "macro_daily_2022_2026_2026_11_03.csv", low_memory=False)
macro_long = pd.read_csv(DATA / "macro" / "macro_long_2022_2026_2026_11_03.csv", low_memory=False)
idx = pd.read_csv(DATA / "indices" / "indices_daily_2023_2026_2026_11_03.csv", low_memory=False)
idx_last = idx[idx["date"] == CUTOFF].iloc[0]
macro_last = macro[macro["date"] == CUTOFF].iloc[0]
live_counts = {t: len(pd.read_csv(DATA / "live" / f"live_snapshots_2026_11_03_{t}.csv")) for t in ["0955", "1355", "1405"]}
inv_cum = pd.read_csv(DATA / "official" / "egx_investor_cumulative_2026_11_03.csv", low_memory=False)
inv_daily = pd.read_csv(DATA / "official" / "egx_daily_investor_report_2026_11_02.csv", low_memory=False)
uni = json.loads((DATA / "universe" / "universe_summary.json").read_text(encoding="utf-8"))
bidask = json.loads((DATA / "official" / "bidask_history_summary.json").read_text(encoding="utf-8"))
db_bytes = (D / "db" / "egx_2026_11_03.sqlite").stat().st_size

S = {
    "daily": daily, "daily_full": daily_full, "archive": archive, "ref": ref,
    "m1": m1_full, "m5": m5_full, "m60": m60_full,
    "m1_day": m1_day, "m5_day": m5_day, "m60_day": m60_day,
    "daily_last": len(daily_last), "daily_last_symbols": int(daily_last["symbol"].nunique()),
    "last_sources": last_sources,
    "news": len(news), "news_first": str(news["published_cairo"].min()), "news_last": str(news["published_cairo"].max()),
    "news_03": int((news["published_cairo"].astype(str).str[:10] == CUTOFF).sum()),
    "news_full": len(news_full), "news_full_first": str(news_full["published_cairo"].min()), "news_full_last": str(news_full["published_cairo"].max()),
    "macro": len(macro), "macro_series": int(macro_long["indicator"].nunique()), "macro_first": str(macro["date"].min()), "macro_last_date": str(macro["date"].max()),
    "idx": len(idx), "idx_first": str(idx["date"].min()), "idx_last": str(idx["date"].max()),
    "idx30": float(idx_last["egx30"]), "idx70": float(idx_last["egx70"]), "idx100": float(idx_last["egx100"]), "idxsh": float(idx_last["shariah"]),
    "live": live_counts, "live_total": sum(live_counts.values()),
    "inv_cum": len(inv_cum), "inv_daily": len(inv_daily), "inv_daily_derived": int(inv_daily["is_derived"].sum()),
    "uni": uni, "bidask": bidask, "db_mb": db_bytes / 1024 / 1024,
    "macro_last": macro_last,
}

# ---------------------------------------------------------------------------
# README
# ---------------------------------------------------------------------------
readme = f"""# EGX consolidated dataset - cutoff 2026-11-03

Built on 2026-11-04. **Data cutoff: 2026-11-03 (end of day).** The partial
2026-11-04 session and its live snapshots, provisional indices and preliminary
investor report are intentionally excluded.

This is a data delivery, not an execution record. **No actual fills are claimed
or verified.**

## What is included

| Category | Main file(s) | Rows | Symbols / series | Range | Notes |
|---|---|---|---|---|---|
| Daily OHLCV, 2023-2026 | `data/prices/egx_daily_2023_2026_2026_11_03.csv.gz` | {daily['rows']:,} | {daily['symbols']} | {daily['first']} .. {daily['last']} | CSV.gz is canonical |
| Daily OHLCV, full | `data/prices/egx_daily_full_2013_2026_2026_11_03.csv.gz` | {daily_full['rows']:,} | {daily_full['symbols']} | {daily_full['first']} .. {daily_full['last']} | 2013-2022 archive included |
| Daily OHLCV, 2013-2022 | `data/prices/egx_daily_2013_2022_archive.csv.gz` | {archive['rows']:,} | {archive['symbols']} | {archive['first']} .. {archive['last']} | archive |
| Last day, daily | `data/prices/egx_daily_2026_11_03.csv` | {S['daily_last']:,} | {S['daily_last_symbols']} | {CUTOFF} | {last_sources.get('daily_candles_db', 0)} DB + {last_sources.get('aggregated_60m', 0)} aggregated_60m; all `is_partial=0` |
| 1-minute OHLCV | `data/prices/egx_1m_2026_H2.csv.gz` + 2023/2024/2025/H1 | {m1_full['rows']:,} | {m1_full['symbols']} | {m1_full['first']} .. {m1_full['last']} | {m1_day['rows']:,} rows / {m1_day['symbols']} symbols on {CUTOFF} |
| 5-minute OHLCV | `data/prices/egx_5m_2023_2026.csv.gz` | {m5_full['rows']:,} | {m5_full['symbols']} | {m5_full['first']} .. {m5_full['last']} | {m5_day['rows']:,} rows / {m5_day['symbols']} symbols on {CUTOFF} |
| 60-minute OHLCV | `data/prices/egx_60m_2023_2026.csv.gz` | {m60_full['rows']:,} | {m60_full['symbols']} | {m60_full['first']} .. {m60_full['last']} | {m60_day['rows']:,} rows / {m60_day['symbols']} symbols on {CUTOFF} |
| Reference daily (69 symbols) | `data/reference/egx_daily_egx_data_pack_69_2022_2026.csv.gz` | {ref['rows']:,} | {ref['symbols']} | {ref['first']} .. {ref['last']} | separate vendor reference pack |
| Live snapshots (actual + pre-open) | `data/live/live_snapshots_2026_11_03_*.csv` | {S['live_total']:,} | 245 + 237 + 237 | {CUTOFF} 09:55 / 13:55 / 14:05 | 13:55/14:05 **actual marketwatch**; 09:55 pre-open; bid/ask AALR only |
| News and disclosures, recent | `data/news/news_2026_11_01_2026_11_03.csv` | {S['news']:,} | - | {S['news_first']} .. {S['news_last']} | {S['news_03']} published on {CUTOFF}; actual `seen_at_cairo` |
| Official disclosures, full | `data/news/egx_official_disclosures_2022_2026_2026_11_03.csv.gz` | {S['news_full']:,} | - | {S['news_full_first']} .. {S['news_full_last']} | 2022-2026 history |
| Macro | `data/macro/macro_daily_2022_2026_2026_11_03.csv` | {S['macro']:,} | {S['macro_series']} series | {S['macro_first']} .. {S['macro_last_date']} | USD/EGP, S&P 500, VIX, Brent, gold, DXY, US10Y |
| Indices | `data/indices/indices_daily_2023_2026_2026_11_03.csv` | {S['idx']:,} | 4 indices | {S['idx_first']} .. {S['idx_last']} | EGX30, EGX70, EGX100, Sharia; 2026-11-03 final |
| Bid/ask history | `data/official/bidask_snapshots_2026_08_23_2026_10_01.csv.gz` | {bidask['valid_rows']:,} | {bidask['symbols']} | 2026-08-23 .. 2026-10-01 | history only; 2026-11-03 AALR live is in `data/live/` |
| Investor cumulative | `data/official/egx_investor_cumulative_2026_11_03.csv` | {S['inv_cum']:,} | 12 scopes | assumed through 2026-11-03 | period field is `cumulative_or_period_unspecified` |
| Latest official daily investor report | `data/official/egx_daily_investor_report_2026_11_02.csv` | {S['inv_daily']:,} | 3 tables | 2026-11-02 | **not 2026-11-03**; {S['inv_daily_derived']} derived rows |
| Universe / coverage | `data/universe/`, `data/coverage/` | {uni['all_stocks']} stocks | - | through {CUTOFF} | 248 clean union, 243 intraday, 238 bid/ask |
| SQLite | `db/egx_2026_11_03.sqlite` | - | 15 tables | through {CUTOFF} | compact queryable copy, {S['db_mb']:.1f} MiB |

**Last values on 2026-11-03:** USD/EGP {macro_last['usdegp']:.4f}; S&P 500 {macro_last['sp500']:.2f};
VIX {macro_last['vix']:.2f}; Brent {macro_last['brent']:.2f}; gold {macro_last['gold']:.2f};
DXY {macro_last['dxy']:.2f}; US10Y {macro_last['us10y']:.3f}.
Indices: EGX30 {S['idx30']:,.2f}; EGX70 {S['idx70']:,.2f}; EGX100 {S['idx100']:,.2f}; Sharia {S['idxsh']:,.2f}.

## Critical caveats - read before use

1. **Live snapshots: 13:55/14:05 actual, 09:55 pre-open.** The live extension
   database contains `marketwatch_snapshots` at 2026-11-03 13:55:00 and
   14:05:02 Cairo (237 symbols each; 14:05 is two seconds after the target).
   `09:55` is before the 10:00 open, so it is a **pre-open reference using
   2026-11-02 daily OHLCV**. The actual snapshots have `is_live_capture=1`; the
   09:55 reference has `is_live_capture=0`. Bid/ask is actual only for AALR
   (from `orderbook_snapshots`); all other symbols have null bid/ask because no
   verified quote source exists. `open` is the actual 2026-11-03 daily open
   because the marketwatch `open_price` column is null.
2. **The official 2026-11-03 daily investor report is missing.** The EGX beta
   daily page is current-day only; when fetched on 2026-11-04 it showed the
   2026-11-04 preliminary values. The latest official daily report available is
   2026-11-02 (PDF ID 1022, published 03-11-2026), included and labelled. The
   cumulative snapshot fetched 2026-11-04 08:06 UTC is included with
   `as_of_status=assumed_cumulative_through_previous_session`; its period field is
   unspecified. **No 2026-11-03 daily values were invented.**
3. **2026-11-03 bid/ask is actual for AALR only.** The bid/ask history ends
   2026-10-01. For 2026-11-03, AALR has an actual `orderbook_snapshots` quote at
   13:55:00 and 14:05:00; all other symbols have null bid/ask and quantities
   because no verified quote source exists.
4. **The exact T0 216-symbol list was not found.** The documented 248-symbol
   clean union is used as a superset: 221 official symbolType C, 97 halal symbols
   (the 98th was not identified), 100 top-liquidity symbols, and the union.
   243 symbols have intraday history; 232 have 1-minute bars on 2026-11-03.
   The actual 13:55/14:05 snapshots cover 237 symbols (231 clean union + 6
   outside, flagged); 09:55 covers 245 clean-union symbols. Actual top-100
   coverage is 98/100: FCMD has no 2026-11-03 daily/1m/marketwatch row; HALN has
   a 1m reconstruction in the fallback file. Top-100 liquidity: 100/100 have
   1-minute history. Halal: 94/97 have 1-minute
   history. The stock universe is 306; the daily file has 323 symbols because it
   also contains 20 index/ETF/ISIN/right/other rows that are not stocks.
5. **1-minute coverage is uneven.** 2023 has {basic(DATA / 'prices' / 'egx_1m_2023.csv.gz', 'date_cairo')['rows']:,}
   rows, 2024 {basic(DATA / 'prices' / 'egx_1m_2024.csv.gz', 'date_cairo')['rows']:,}, 2025
   {basic(DATA / 'prices' / 'egx_1m_2025.csv.gz', 'date_cairo')['rows']:,}, 2026 H1
   {basic(DATA / 'prices' / 'egx_1m_2026_H1.csv.gz', 'date_cairo')['rows']:,}, 2026 H2
   {basic(DATA / 'prices' / 'egx_1m_2026_H2.csv.gz', 'date_cairo')['rows']:,}.
   2023-2024 are sparse. 2026-09-10 1-minute data is missing outside the 69-symbol
   reference pack. Five clean-union symbols have no 1-minute history at all:
   AIHC, BIOQ, EEI, IUFO, NAPR. Sixteen clean-union symbols have no 1-minute bar
   on 2026-11-03: AIHC, APPC, BIDI, BIOQ, DEIN, EEI, EITP, EPPK, FCMD, GTHE,
   IUFO, MISR, MKIT, NAPR, NCGC, PACH.
6. **Three universe symbols have no daily row:** BIOQ, EEI, IUFO.
7. **No actual fills.** This package contains market data and live/pre-open
   snapshots only. It does not contain broker fills, order acknowledgements,
   partial-fill records, or settlement. Any strategy result must be labelled a
   simulation, not an execution.
8. **2026-11-04 is excluded on purpose.** No 2026-11-04 price, news, macro,
   index, live or investor row is included. The 2026-11-04 source build remains
   untouched in `strategy-lab/outputs/egx_2026_11_04/` for audit.
9. **CSV.gz is canonical.** Parquet duplicates and raw source archives are not
   included; they are redundant/raw, not missing data. The SQLite database is a
   convenience subset (recent intraday window, not full 1-minute history).

## File layout

```
egx_2026_11_03/
  README.md
  CHECKLIST.md
  DATA_DICTIONARY.md
  MISSING.md
  MANIFEST.csv                 SHA256 + bytes + rows for every delivered file
  data/
    prices/                    daily, 1m, 5m, 60m, reference
    live/                      09:55 pre-open + actual 13:55/14:05 + fallbacks + summary
    news/                      recent + full disclosures
    macro/                     long, wide, sources, summary
    indices/                   daily + sources + summary
    official/                  bid/ask, investor cumulative, latest daily investor, missing note
    universe/                  lists, flags, T0 attempt, summary
    coverage/                  per-symbol and per-timeframe coverage
    reference/                 69-symbol vendor reference pack
  db/egx_2026_11_03.sqlite
  scripts/                     cutoff build/validation scripts
  docs/                        build notes and (after upload) upload verification
```

## Verification

- `MANIFEST.csv` contains SHA256, byte size and row count for every delivered
  file (excluding the manifest itself and post-upload status files).
- Run `python scripts/verify_delivery_2026_11_03.py` from the package root.
- Local checks cover: manifest hashes, cutoff (no 2026-11-04 rows), daily last-day
  completeness, news/macro/index maxima, live actual/pre-open labels and
  AALR-only bid/ask, investor labels, universe/coverage counts, bid/ask range
  and SQLite table counts.
- Remote upload verification is in `docs/UPLOAD_VERIFICATION.md` and
  `UPLOAD_STATUS.json` after upload.

## Sources

- Prices: vendor `tvdatafeed` / `tv_ticks` / EGX daily candles database, as
  recorded in each row's `source` column.
- News and disclosures: EGX beta news-search API (`beta.egx.com.eg`).
- Macro: Yahoo Finance chart API v8.
- Indices: `beta.egx.com.eg` index data + intervalIndex.
- Live snapshots: `postgres:marketwatch_snapshots` (13:55/14:05 actual).
- Bid/ask: `D:\\BIDASK_FINAL\\snapshots` history; 2026-11-03 AALR live from
  `postgres:orderbook_snapshots`.
- Investor cumulative: `beta.egx.com.eg/api/bff/egx/investor-full-statistics`.
- Latest daily investor report: official EGX PDF ID 1022 (2026-11-02).
- Universe: official EGX market watch, `halal-symbols.txt`, TV symbols and the
  filtered 60-minute liquidity ranking.

## Rebuild

The cutoff build is reproducible from `scripts/build_delivery_2026_11_03.py`
using the source build in `strategy-lab/outputs/egx_2026_11_04/`. The source
build is not modified. The 13:55/14:05 actual live files are extracted by
`scripts/extract_live_actual_2026_11_03.py` from the live PostgreSQL source
(requires `DATABASE_URL`); it also preserves the 1m reconstructions as
fallbacks. The 09:55 pre-open reference remains from the cutoff build. The
SQLite database is rebuilt by `scripts/build_sqlite_2026_11_03.py`. The manifest
is regenerated by `scripts/write_docs_manifest_2026_11_03.py`.

## Honest status

Data cutoff is complete for prices, news, macro, indices, bid/ask history and
universe/coverage. The 2026-11-03 **daily investor report** is missing. Live
13:55/14:05 snapshots are actual; 09:55 is a pre-open reference; bid/ask is
actual only for AALR. Gaps are documented, not filled with invented values. No
execution is claimed.
"""
(D / "README.md").write_text(readme, encoding="utf-8")

# ---------------------------------------------------------------------------
# CHECKLIST
# ---------------------------------------------------------------------------
checklist = f"""# Delivery checklist - 2026-11-03 cutoff

Status legend: **DONE** = delivered and verified; **PARTIAL** = delivered with a
documented limitation; **MISSING** = not available, not invented; **SEE STATUS** =
post-upload item recorded in `UPLOAD_STATUS.json`; **LOCAL PASS** = local checks
passed, remote verification recorded after upload.

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Daily candles through 2026-11-03 | **DONE** | {daily['rows']:,} rows / {daily['symbols']} symbols / {daily['first']}..{daily['last']}; 2026-11-03 has {S['daily_last']} rows and all `is_partial=0` |
| 2 | Hourly candles through 2026-11-03 | **DONE** | {m60_full['rows']:,} rows / {m60_full['symbols']} symbols; 2026-11-03 {m60_day['rows']:,} rows / {m60_day['symbols']} symbols |
| 3 | 1-minute candles through 2026-11-03 | **PARTIAL** | {m1_full['rows']:,} rows / {m1_full['symbols']} symbols; 2026-11-03 {m1_day['rows']:,} rows / {m1_day['symbols']} symbols; 2023-2024 sparse and 16 clean-union symbols have no 2026-11-03 bar |
| 4 | 5-minute candles through 2026-11-03 | **DONE** | {m5_full['rows']:,} rows / {m5_full['symbols']} symbols; 2026-11-03 {m5_day['rows']:,} rows / {m5_day['symbols']} symbols |
| 5 | All T0 stocks (user target 216) | **PARTIAL** | Exact 216 list not found; 248-symbol clean union is the documented superset; 243 have intraday; 232 have 2026-11-03 1m; 100/100 top-liquidity have 1m |
| 6 | At least 98 halal stocks | **PARTIAL** | 97 found in `halal-symbols.txt`; the 98th was not identified; 94/97 have 1m history; 3 have no daily row (BIOQ, EEI, IUFO) |
| 7 | Top 100 by liquidity | **DONE** | Recomputed from filtered 60m over the last 60 sessions; 100/100 have 1m history |
| 8 | News through 2026-11-03 with actual seen time | **DONE** | {S['news']:,} recent rows ({S['news_03']} on 2026-11-03); `seen_at_cairo` records the actual fetch time (2026-11-04 for the recent batch); full disclosures {S['news_full']:,} rows |
| 9 | Official disclosures through 2026-11-03 | **DONE** | Full 2022-2026 file filtered to 2026-11-03; 2026-11-04 rows excluded |
| 10 | Macro through 2026-11-03 | **DONE** | {S['macro']:,} rows / {S['macro_series']} series; last date {S['macro_last_date']}; all last rows `is_partial=0` |
| 11 | Daily indices through 2026-11-03 | **DONE** | {S['idx']:,} rows / 4 indices; 2026-11-03 `is_final=1`; 2026-11-04 provisional row excluded |
| 12 | EGX daily investor report through 2026-11-03 | **MISSING** | Official 2026-11-03 daily report not published/available at build time; cumulative snapshot through 2026-11-03 included with unspecified-period label; latest official daily report is 2026-11-02 (clearly labelled, not a substitute) |
| 13 | Live snapshots 09:55 / 13:55 / 14:05 | **PARTIAL** | 245 / 237 / 237 rows; 09:55 is a 2026-11-02 pre-open reference; 13:55/14:05 are actual marketwatch snapshots (14:05 captured 14:05:02); bid/ask AALR only |
| 14 | Bid/ask for 2026-11-03 | **PARTIAL** | AALR actual orderbook at 13:55/14:05; all other symbols null (no verified source); history ends 2026-10-01 |
| 15 | Preserve the existing 2026-11-01 dataset | **DONE** | `slippage_2026_11_01` was not modified; source `egx_2026_11_04` is untouched |
| 16 | Exclude 2026-11-04 partial data | **DONE** | All price/news/macro/index maxima are 2026-11-03; no 2026-11-04 data filenames |
| 17 | Upload to GitHub without omissions | **SEE STATUS** | `UPLOAD_STATUS.json` and `docs/UPLOAD_VERIFICATION.md` are written after upload |
| 18 | Verify before and after upload | **LOCAL PASS** | 104 local checks passed; remote verification is in `UPLOAD_STATUS.json` |
| 19 | No fabricated values / no false execution claims | **DONE** | Missing items are labelled; no fills; no 2026-11-03 daily investor values invented |

## Known gaps

- 2026-11-03 daily investor report: missing (see `MISSING.md`).
- 2026-11-03 live captures: 13:55/14:05 actual; 09:55 pre-open reference.
- 2026-11-03 bid/ask: AALR only; all other symbols missing.
- Exact T0 216 and 98th halal symbol: not found.
- 1m gaps: 2023-2024 sparse; 2026-09-10 missing outside the 69-symbol pack; 5 clean-union symbols have no 1m history; 16 have no 2026-11-03 1m bar.
- 3 universe symbols have no daily row: BIOQ, EEI, IUFO.
- Actual fills: none.
"""
(D / "CHECKLIST.md").write_text(checklist, encoding="utf-8")

# ---------------------------------------------------------------------------
# DATA_DICTIONARY
# ---------------------------------------------------------------------------
dictionary = """# Data dictionary

All timestamps are ISO-8601 with the Cairo offset where the column name says
`cairo`; UTC columns end in `Z`/`+00:00`. `date_cairo` is the Cairo trading date.
Prices are EGP; volume is shares unless the source column says otherwise. No
currency conversion or inflation adjustment is applied.

## Prices (`data/prices/`)

### Daily files
`symbol`, `date`, `open`, `high`, `low`, `close`, `volume`, `bars`,
`first_time`, `last_time`, `source_tf`, `source`, `volume_available`,
`volume_complete`, `open_raw`, `high_raw`, `low_raw`, `close_raw`, `volume_raw`,
`ohlc_valid_raw`, `ohlc_valid`, `ohlc_repaired`, `quality`, `priority`,
`is_partial`, `source_created_at`.

- `source`: `daily_candles_db`, `aggregated_60m`, `egx_data_daily`.
- `quality`: `vendor_daily`, `vendor_daily_repaired`, `aggregated_60m`,
  `vendor_egx_pack_reference_scale`.
- `is_partial=0` for every delivered row.
- `ohlc_repaired=1` means the raw OHLC was repaired to satisfy high >= max(open,
  close) and low <= min(open, close); `ohlc_valid=1` for all delivered rows.

### Intraday files (1m / 5m / 60m)
`symbol`, `timestamp_cairo`, `timestamp_utc`, `date_cairo`, `time_cairo`,
`open`, `high`, `low`, `close`, `volume`, `volume_available`, `source`,
`quality`, `is_partial`, plus source-specific columns.

- `time_cairo` is the bar start time (HH:MM); the session is 10:00-14:30.
- `source`: `tvdatafeed`, `tv_ticks`, `collector_15s` (only in the excluded
  2026-11-04 source build), etc.
- `volume_available=0` means the source did not provide a usable volume; the
  row is kept and flagged, not silently dropped.
- `quality` values are source-specific; check the column before aggregating.

### Reference pack
`data/reference/egx_daily_egx_data_pack_69_2022_2026.csv.gz` is a separate
69-symbol vendor daily reference, 2022-01-02..2026-11-03. It is not the main
daily file and should not be concatenated without de-duplication.

## Live snapshots (`data/live/`)

`symbol`, `scanner_symbol`, `target_time`, `captured_at_cairo`, `last_price`,
`open`, `high`, `low`, `volume`, `change_pct`, `bid`, `ask`, `bid_qty`,
`ask_qty`, `in_clean_union`, `source`, `open_source`, `bidask_source`,
`bidask_captured_at_cairo`, `snapshot_status`, `data_quality`, `bidask_status`,
`is_live_capture`, `bars_used`, `first_bar_time`, `last_bar_time`,
`last_bar_timestamp_cairo`, `prev_close`, `reference_date`.

- `target_time`: `09:55`, `13:55`, `14:05`.
- `snapshot_status`:
  - `preopen_reference_previous_session_daily_ohlcv` for 09:55 (no 1m bar before
    the 10:00 open; uses 2026-11-02 daily OHLCV).
  - `actual_marketwatch_snapshot` for 13:55/14:05 (actual live source).
  - `reconstructed_from_1m_last_completed_bar_before_target` only in the
    `*_reconstructed_1m.csv` fallback files.
- `is_live_capture`: 0 for 09:55; 1 for 13:55/14:05.
- `bid`, `ask`, `bid_qty`, `ask_qty` are actual for AALR only at 13:55/14:05
  (`bidask_status=actual_orderbook_snapshot_AALR_only`); all other symbols have
  nulls and `bidask_status=unavailable_source_null`.
- `open_source`: `egx_daily_2026_11_03` for actual snapshots;
  `previous_session_daily_2026_11_02` for 09:55; `egx_1m_2026_H2.csv.gz` for
  the reconstructed fallbacks.
- `bidask_captured_at_cairo`: actual order-book time for AALR; null elsewhere.
- `bars_used` is 0 for actual/pre-open rows; the reconstructed fallbacks record
  the number of 1m bars aggregated.
- `change_pct` is the actual marketwatch `last_change_prc` for 13:55/14:05; null
  for 09:55.
- `captured_at_cairo` is the actual capture time; the 14:05 target was captured
  at 14:05:02 Cairo.
- `source` is `postgres:marketwatch_snapshots` for actual rows;
  `egx_daily_2023_2026_2026_11_03.csv.gz` for the 09:55 reference; and
  `egx_1m_2026_H2.csv.gz` for the reconstructed fallbacks.

## News (`data/news/`)

Recent file columns: `code`, `published_cairo`, `published_utc`, `heading`,
`heading_arabic`, `section`, `section_arabic`, `company_name_ar`,
`company_name_en`, `reuters_code`, `content_text`, `content_arabic_text`, `url`,
`url_ar`, `seen_at_utc`, `seen_at_cairo`.

Full disclosure file adds: `date_stamp_raw`, `sec_id`, `material`, `egx`, `isin`,
`sector_id`, `attachment_links`, `attachment_urls_beta`, `attachments_json`,
`content_html`, `content_arabic_html`, `seen_at_status`, `source_api`.

- `seen_at_cairo` is when the collector actually saw the item; for the recent
  batch it is 2026-11-04, even for items published on 2026-11-03.
- `seen_at_status=not_recorded_prior_2026_10_31` means the historical archive
  predates the seen-time recording; do not interpret it as a publication time.

## Macro (`data/macro/`)

- `macro_long_...csv`: `date`, `indicator`, `value`, `yahoo_symbol`,
  `is_partial`, `source`.
- `macro_daily_...csv`: one column per indicator (`usdegp`, `sp500`, `vix`,
  `brent`, `gold`, `dxy`, `us10y`), plus `date`, `is_partial_2026_11_04`,
  `source`, `fetched_at_utc`.
- `macro_sources.csv`: row counts, first/last dates, last value, partial flag,
  Yahoo symbol, source and cutoff.
- `is_partial=0` on every delivered last row; 2026-11-04 rows are excluded.

## Indices (`data/indices/`)

`date`, `egx30`, `egx70`, `egx100`, `shariah`, `source`, `fetched_at_utc`,
`is_final`.

- 2023-11-05..2026-11-03, 727 rows.
- 2026-11-03 has `is_final=1`; the 2026-11-04 provisional row is excluded.
- `indices_sources.csv` records last close and final flag per index.

## Official (`data/official/`)

### Bid/ask
`bidask_snapshots_2026_08_23_2026_10_01.csv.gz` contains non-null, non-crossed
best bid/ask snapshots. `bidask_history_summary.json` records 2,298,634 valid
rows / 238 symbols / 2026-08-23..2026-10-01. No 2026-11-03 quotes.

### Investor cumulative
`egx_investor_cumulative_2026_11_03.csv`: 48 rows, 12 scopes (`all_types`,
`no_bonds`, `bonds`, `bills`, individuals/institutions variants), columns
`scope`, `client_type`, `client_type_ar`, `buy_value`, `sell_value`, `net_value`,
`buy_perc`, `sell_perc`, `total_perc`, `period`, `source`, `fetched_at_utc`,
`nationality`, `nationality_ar`, `as_of_date`, `as_of_status`, `cutoff`, `note`.

- `period=cumulative_or_period_unspecified` in the source.
- `as_of_status=assumed_cumulative_through_previous_session_fetched_before_2026_11_04_open`.
- It is not a daily 2026-11-03 report.

### Latest official daily investor report
`egx_daily_investor_report_2026_11_02.csv`: 12 rows, `report_date=2026-11-02`,
tables `institutions`, `individuals`, `all_investors`, values in EGP million and
EGP, `is_derived` for derived rows, source PDF ID 1022. **Not 2026-11-03.**

## Universe and coverage (`data/universe/`, `data/coverage/`)

- `universe_all.csv`: 306 stocks, 62 columns including membership flags,
  official metadata, 1m/5m/60m/bidask/daily coverage, top-100 rank/value,
  T0/halal notes.
- `clean_union.csv`: 248 symbols (documented superset).
- `official_c.csv`: 221 official symbolType C.
- `halal.csv`: 97 halal symbols (98th not identified).
- `top100_liquidity.csv`: 100 symbols ranked by mean daily value proxy over the
  last 60 filtered sessions.
- `universe_t0_attempt.csv`: counts and status of the T0/halal/top100 attempt.
- `universe_summary.json`: final counts and known gaps.
- `coverage_by_symbol.csv`: one row per stock with per-timeframe coverage.
- `coverage_by_symbol_timeframe.csv`: long format (729 rows = 243 symbols x 3).
- `coverage_summary.json`: per-timeframe totals.

## SQLite (`db/egx_2026_11_03.sqlite`)

Tables: `daily_2023_2026`, `daily_2026_11_03`, `intraday_60m_recent`,
`intraday_5m_recent`, `intraday_1m_recent`, `live_snapshots`, `news_recent`,
`macro_daily`, `indices_daily`, `universe`, `coverage`, `bidask_daily_sample`,
`investor_cumulative`, `investor_daily_latest_available`, `metadata`.

- The 2013-2022 daily archive and full news history are in CSV.gz only.
- The 1m table is the 2026-11-03 window (39,302 rows), not the full history.
- `bidask_daily_sample` is the last valid quote per symbol/date.
- `metadata` records cutoff, live/investor/bidask/T0/fills status.

## Manifest

`MANIFEST.csv`: `path`, `category`, `bytes`, `sha256`, `rows`, `description`.
`rows` is the logical CSV row count where available, else blank. The manifest
excludes itself and post-upload status files.
"""
(D / "DATA_DICTIONARY.md").write_text(dictionary, encoding="utf-8")

# ---------------------------------------------------------------------------
# MISSING
# ---------------------------------------------------------------------------
missing = f"""# Missing / limited items - 2026-11-03 cutoff

Nothing in this file was filled with an invented value. Each gap says exactly
what is missing and what is included instead.

## 1. Official 2026-11-03 daily investor report - MISSING

- The EGX beta daily investor page (`/en/market/investors`) is current-day only.
  When fetched on 2026-11-04 at 10:17 Cairo it showed the **2026-11-04
  preliminary** values.
- The official daily report PDF for **2026-11-03** was not published/available
  at build time. The latest available official daily report is **2026-11-02**
  (PDF ID 1022, published 03-11-2026). Its `Trading Date` is 02/11/2026.
- Included instead:
  - `data/official/egx_daily_investor_report_2026_11_02.csv` - latest official
    daily report, explicitly labelled `report_date=2026-11-02`; not a substitute
    for 2026-11-03.
  - `data/official/egx_investor_cumulative_2026_11_03.csv` - official cumulative
    snapshot fetched 2026-11-04 08:06 UTC before the session; period field is
    `cumulative_or_period_unspecified`; `as_of_status` says the through-date is
    assumed.
- No 2026-11-03 Egyptians/foreigners/institutions/individuals daily values were
  fabricated.

## 2. 2026-11-03 live snapshots - PARTIAL

- `09:55` has no 1-minute bar before the 10:00 open. The delivered 09:55 file is
  a **pre-open reference using 2026-11-02 daily OHLCV** (245 clean-union symbols
  with a 2026-11-02 daily row); `is_live_capture=0`.
- `13:55` and `14:05` are **actual `marketwatch_snapshots`** from the live
  PostgreSQL source: 237 symbols each, 231 clean-union + 6 outside (ALEX,
  EGS370O1C013, EGS3I0S1C019, SAIB, SPHT, UTOP; `in_clean_union=0`).
- The 14:05 target was captured at 14:05:02 Cairo; `captured_at_cairo` records
  the actual time.
- Actual top-100 coverage is 98/100: FCMD has no 2026-11-03 daily/1m/marketwatch
  row; HALN has a 1m reconstruction in `*_reconstructed_1m.csv`.
- The old 1m reconstructions are preserved as
  `live_snapshots_2026_11_03_1355_reconstructed_1m.csv` and
  `..._1405_reconstructed_1m.csv` (232 symbols each) as fallbacks; they are not
  part of `live_snapshots_2026_11_03_all.csv`.

## 3. 2026-11-03 bid/ask - PARTIAL (AALR only)

- The bid/ask history ends 2026-10-01 (2,298,634 rows / 238 symbols).
- AALR has actual `orderbook_snapshots` at 13:55:00 and 14:05:00; the live files
  use those values.
- The other 236 symbols have null bid/ask and quantities because no verified
  2026-11-03 quote source exists; `bidask_status=unavailable_source_null`.

## 4. Exact T0 216 list - UNVERIFIED

- The exact 216-symbol list was not found in project files, the database or web
  searches.
- The documented 248-symbol clean union is used as a superset: 221 official
  symbolType C + 97 halal + 100 top-liquidity + other TV/union symbols.
- 243 symbols have intraday history; 232 have 2026-11-03 1m bars; 100/100
  top-liquidity symbols have 1m history; 94/97 halal symbols have 1m history.
- The stock universe is 306. The daily file has 323 symbols because it also
  contains 20 index/ETF/ISIN/right/other rows that are not stocks.

## 5. 98th halal symbol - UNRESOLVED

- 97 halal symbols were found; the user's target is 98. The 98th was not
  identified; no symbol was invented to reach 98.

## 6. 1-minute coverage gaps

- 2023: 27,343 rows; 2024: 76,485; 2025: 479,315; 2026 H1: 2,116,026; 2026 H2:
  3,030,336. 2023-2024 are sparse compared with 2025-2026.
- 2026-09-10 1-minute data is missing outside the 69-symbol
  `EGX_DATA_2022_2026` reference pack.
- Five clean-union symbols have no 1-minute history at all: AIHC, BIOQ, EEI,
  IUFO, NAPR.
- Sixteen clean-union symbols have no 2026-11-03 1-minute bar: AIHC, APPC, BIDI,
  BIOQ, DEIN, EEI, EITP, EPPK, FCMD, GTHE, IUFO, MISR, MKIT, NAPR, NCGC, PACH.

## 7. Three universe symbols have no daily row

- BIOQ, EEI, IUFO. They remain in the universe with coverage flags showing the
  absence; no daily row was fabricated.

## 8. Actual fills / execution - NOT PRESENT

- This package contains no broker fills, order acknowledgements, partial-fill
  records, cancellations, rejections, settlement records or fees.
- Any strategy result derived from this data is a simulation and must be labelled
  as such. **التنفيذات الحقيقية غير متحققة.**

## 9. Intentionally excluded

- 2026-11-04 prices, news, macro, index and investor rows: excluded by cutoff.
- 2026-11-04 live snapshots and the preliminary 2026-11-04 investor report:
  excluded.
- Parquet duplicates and raw source archives: not included; CSV.gz is canonical
  and contains the candles. The raw 2026-11-04 source build remains in
  `strategy-lab/outputs/egx_2026_11_04/` for audit.
"""
(D / "MISSING.md").write_text(missing, encoding="utf-8")

# ---------------------------------------------------------------------------
# BUILD_NOTES
# ---------------------------------------------------------------------------
build_notes = f"""# Build notes

- Build date: {NOW}.
- Data cutoff: {CUTOFF}.
- Source build: `strategy-lab/outputs/egx_2026_11_04/` (untouched).
- Output: `strategy-lab/outputs/egx_2026_11_03/`.

## Filtering

All time series were filtered by the first 10 characters of their date column
(`date` or `date_cairo`) to `<= {CUTOFF}`. The 2026-11-04 rows removed were:

- 1m H2: 12,189 rows (2026-11-04 10:00-10:50).
- 5m: 2,629 rows.
- 60m: 239 rows.
- Daily 2023-2026: 307 rows.
- Daily full 2013-2026: 307 rows.
- News recent: 11 rows; full disclosures: 11 rows.
- Macro: 5 rows across series.
- Indices: 1 provisional row.

## Live snapshots

- 09:55: no 1m bar before 10:00; previous session (2026-11-02) daily OHLCV used
  as a pre-open reference for the 245 clean-union symbols that have a 2026-11-02
  daily row. `is_live_capture=0`.
- 13:55 / 14:05: actual `marketwatch_snapshots` from the live PostgreSQL source,
  237 symbols each; 14:05 captured at 14:05:02 Cairo. `open` comes from the
  actual 2026-11-03 daily open because marketwatch `open_price` is null. Six
  symbols outside the clean union are included with `in_clean_union=0`.
- Bid/ask: AALR actual `orderbook_snapshots` at both targets; all other symbols
  null because no verified quote source exists.
- The old 1m reconstructions are preserved as `*_reconstructed_1m.csv` fallbacks
  (232 symbols each); they are not in the combined actual file.

## Investor data

- Cumulative snapshot: official beta API, fetched 2026-11-04T08:06:35Z before the
  session; period field unspecified; labelled as assumed cumulative through
  2026-11-03.
- Latest daily report: official PDF ID 1022, trading date 2026-11-02, published
  03-11-2026; transcribed with derived rows marked.
- 2026-11-03 daily report: not available; see `MISSING.md`.

## Universe

- Static lists from the source universe: clean union 248, official C 221, halal
  97, top-100 recomputed from the filtered 60m data over the last 60 sessions.
- 306 stock rows. The daily file has 323 symbols; 20 are index/ETF/ISIN/right/
  other rows excluded from `all_stocks`. Three universe stocks have no daily row:
  BIOQ, EEI, IUFO.

## SQLite

- Built from the filtered CSVs with the same cutoff.
- 15 tables; 60.9 MiB / 63.9 MB (under the 100 MB per-file limit).
- The 2013-2022 daily archive and full news history remain in CSV.gz only.

## Verification

- `MANIFEST.csv` has SHA256/bytes/rows for every delivered file (excluding itself
  and post-upload status files).
- `scripts/verify_delivery_2026_11_03.py` checks hashes, cutoff, counts, live
  labels, investor labels, universe/coverage, bid/ask and SQLite.
- Remote git blob SHA1 comparison is recorded in `docs/UPLOAD_VERIFICATION.md`
  after upload.
"""
(D / "docs" / "BUILD_NOTES.md").write_text(build_notes, encoding="utf-8")

# ---------------------------------------------------------------------------
# MANIFEST
# ---------------------------------------------------------------------------
# Git normalizes text files to LF.  Normalize the generated Markdown/JSON here
# as well so the SHA256 manifest describes the bytes that are actually stored
# in the repository (CSV/CSV.gz/SQLite are left untouched).
for p in D.rglob("*"):
    if p.is_file() and p.suffix.lower() in {".md", ".json"}:
        data = p.read_bytes()
        if b"\r\n" in data:
            p.write_bytes(data.replace(b"\r\n", b"\n"))


def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def line_rows(p: Path) -> int | None:
    try:
        if p.suffix == ".gz":
            with gzip.open(p, "rt", encoding="utf-8-sig", errors="replace") as f:
                return max(0, sum(1 for _ in f) - 1)
        with p.open("r", encoding="utf-8-sig", errors="replace") as f:
            return max(0, sum(1 for _ in f) - 1)
    except Exception:
        return None


ROW_OVERRIDES = {
    "data/news/news_2026_11_01_2026_11_03.csv": 227,
    "data/news/egx_official_disclosures_2022_2026_2026_11_03.csv.gz": 72283,
}


def describe(rel: str) -> str:
    name = Path(rel).name
    if rel.startswith("data/prices/"):
        if "daily_2026_11_03" in name:
            return "Daily OHLCV for 2026-11-03 (309 symbols; 307 DB + 2 aggregated_60m; is_partial=0)"
        if "daily_quality" in name:
            return "Daily quality summary for the cutoff"
        if "daily_full" in name:
            return "Daily OHLCV, full history, cutoff 2026-11-03"
        if "daily_2013_2022" in name:
            return "Daily OHLCV archive 2013-2022"
        if "daily_2023_2026" in name:
            return "Daily OHLCV 2023-2026, cutoff 2026-11-03"
        if "1m_2023" in name:
            return "1-minute OHLCV 2023"
        if "1m_2024" in name:
            return "1-minute OHLCV 2024"
        if "1m_2025" in name:
            return "1-minute OHLCV 2025"
        if "1m_2026_H1" in name:
            return "1-minute OHLCV 2026 H1"
        if "1m_2026_H2" in name:
            return "1-minute OHLCV 2026 H2, cutoff 2026-11-03"
        if "5m_2023_2026" in name:
            return "5-minute OHLCV 2023-2026, cutoff 2026-11-03"
        if "60m_2023_2026" in name:
            return "60-minute OHLCV 2023-2026, cutoff 2026-11-03"
    if rel.startswith("data/live/"):
        if "summary" in name:
            return "Live snapshot summary (09:55 pre-open + actual 13:55/14:05)"
        if "all" in name:
            return "All live snapshots: 09:55 pre-open + actual 13:55/14:05"
        if "0955" in name:
            return "09:55 pre-open reference (2026-11-02 daily OHLCV; not live)"
        if "reconstructed" in name and "1355" in name:
            return "13:55 1m reconstruction fallback (not live)"
        if "reconstructed" in name and "1405" in name:
            return "14:05 1m reconstruction fallback (not live)"
        if "1355" in name:
            return "13:55 actual marketwatch snapshot (237 symbols)"
        if "1405" in name:
            return "14:05 actual marketwatch snapshot (captured 14:05:02; 237 symbols)"
    if rel.startswith("data/news/"):
        if "summary" in name:
            return "News/disclosures summary for the cutoff"
        if "news_2026_11_01" in name:
            return "Recent news/disclosures 2026-11-01..2026-11-03 (actual seen_at)"
        if "egx_official_disclosures" in name:
            return "Official EGX disclosures 2022-2026, cutoff 2026-11-03"
    if rel.startswith("data/macro/"):
        if "summary" in name:
            return "Macro summary for the cutoff"
        if "sources" in name:
            return "Macro source/coverage table"
        if "long" in name:
            return "Macro long format, cutoff 2026-11-03"
        if "daily" in name:
            return "Macro wide daily format, cutoff 2026-11-03"
    if rel.startswith("data/indices/"):
        if "summary" in name:
            return "Indices summary for the cutoff"
        if "sources" in name:
            return "Index source/coverage table"
        if "indices_daily" in name:
            return "Daily indices 2023-2026, cutoff 2026-11-03"
    if rel.startswith("data/official/"):
        if "MISSING" in name:
            return "Missing 2026-11-03 daily investor report note"
        if "bidask_history_summary" in name:
            return "Bid/ask history summary"
        if "bidask_snapshots" in name:
            return "Bid/ask history 2026-08-23..2026-10-01 (no 2026-11-03)"
        if "egx_daily_investor_report_2026_11_02" in name:
            return "Latest official daily investor report (2026-11-02; NOT 2026-11-03)"
        if "investor_daily_latest_available_summary" in name:
            return "Summary of the latest available daily investor report"
        if "egx_investor_cumulative" in name:
            return "Official cumulative investor snapshot (period unspecified; assumed through 2026-11-03)"
        if "investor_cumulative_summary" in name:
            return "Cumulative investor snapshot summary"
        if "egx_official_market_watch" in name:
            return "Official market-watch snapshot (0 rows at fetch time)"
    if rel.startswith("data/universe/"):
        if "summary" in name:
            return "Universe summary and known gaps"
        if "t0_attempt" in name:
            return "T0/halal/top100 attempt counts"
        if "top100" in name:
            return "Top-100 liquidity list (filtered 60m, last 60 sessions)"
        if "halal" in name:
            return "Halal universe list (97 found)"
        if "official_c" in name:
            return "Official symbolType C list (221)"
        if "clean_union" in name:
            return "Clean union list (248)"
        if "all_stocks" in name:
            return "All stock symbols (306)"
        if "missing_from_tvdatafeed" in name:
            return "Symbols missing from tvdatafeed"
        if "union_symbols" in name:
            return "Union symbol list"
        if "universe_all" in name:
            return "Universe with flags and coverage (306 stocks)"
    if rel.startswith("data/coverage/"):
        if "summary" in name:
            return "Coverage summary"
        if "by_symbol_timeframe" in name:
            return "Coverage long format (729 rows)"
        if "by_symbol" in name:
            return "Per-symbol coverage and metadata (306 stocks)"
        if "coverage_1m" in name:
            return "1-minute coverage per symbol"
        if "coverage_5m" in name:
            return "5-minute coverage per symbol"
        if "coverage_60m" in name:
            return "60-minute coverage per symbol"
    if rel.startswith("data/reference/"):
        return "69-symbol vendor daily reference pack, cutoff 2026-11-03"
    if rel.startswith("db/"):
        return "Compact SQLite database (15 tables; recent intraday window)"
    if rel.startswith("scripts/"):
        return "Cutoff build/validation script"
    if rel.startswith("docs/"):
        return "Build/upload documentation"
    if rel == "README.md":
        return "Main README"
    if rel == "CHECKLIST.md":
        return "Requirement checklist"
    if rel == "DATA_DICTIONARY.md":
        return "Column and table dictionary"
    if rel == "MISSING.md":
        return "Missing/limited items"
    return ""


EXCLUDE_FROM_MANIFEST = {"UPLOAD_STATUS.json", "docs/UPLOAD_VERIFICATION.md"}
files = sorted(
    p for p in D.rglob("*")
    if p.is_file()
    and p.name != "MANIFEST.csv"
    and str(p.relative_to(D)).replace("\\", "/") not in EXCLUDE_FROM_MANIFEST
)
rows = []
for p in files:
    rel = str(p.relative_to(D)).replace("\\", "/")
    if p.suffix in {".csv", ".gz"}:
        n = ROW_OVERRIDES.get(rel, line_rows(p))
    else:
        n = None
    category = rel.split("/")[0] if "/" in rel else "root"
    if category == "data":
        category = "data/" + rel.split("/")[1]
    rows.append({
        "path": rel,
        "category": category,
        "bytes": p.stat().st_size,
        "sha256": sha256(p),
        "rows": n,
        "description": describe(rel),
    })
man = pd.DataFrame(rows)
man.to_csv(D / "MANIFEST.csv", index=False, encoding="utf-8-sig")
print("manifest files", len(man), "bytes", int(man["bytes"].sum()), "mb", round(man["bytes"].sum() / 1024 / 1024, 1))
print("docs written", NOW)
