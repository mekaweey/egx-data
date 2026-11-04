# EGX consolidated dataset - cutoff 2026-11-03

Built on 2026-11-04. **Data cutoff: 2026-11-03 (end of day).** The partial
2026-11-04 session and its live snapshots, provisional indices and preliminary
investor report are intentionally excluded.

This is a data delivery, not an execution record. **No actual fills are claimed
or verified.**

## What is included

| Category | Main file(s) | Rows | Symbols / series | Range | Notes |
|---|---|---|---|---|---|
| Daily OHLCV, 2023-2026 | `data/prices/egx_daily_2023_2026_2026_11_03.csv.gz` | 206,545 | 323 | 2023-01-02 .. 2026-11-03 | CSV.gz is canonical |
| Daily OHLCV, full | `data/prices/egx_daily_full_2013_2026_2026_11_03.csv.gz` | 433,658 | 323 | 2013-10-13 .. 2026-11-03 | 2013-2022 archive included |
| Daily OHLCV, 2013-2022 | `data/prices/egx_daily_2013_2022_archive.csv.gz` | 227,113 | 190 | 2013-10-13 .. 2022-12-29 | archive |
| Last day, daily | `data/prices/egx_daily_2026_11_03.csv` | 309 | 309 | 2026-11-03 | 307 DB + 2 aggregated_60m; all `is_partial=0` |
| 1-minute OHLCV | `data/prices/egx_1m_2026_H2.csv.gz` + 2023/2024/2025/H1 | 5,729,505 | 243 | 2023-01-02 .. 2026-11-03 | 39,302 rows / 232 symbols on 2026-11-03 |
| 5-minute OHLCV | `data/prices/egx_5m_2023_2026.csv.gz` | 2,019,692 | 243 | 2023-01-02 .. 2026-11-03 | 11,148 rows / 232 symbols on 2026-11-03 |
| 60-minute OHLCV | `data/prices/egx_60m_2023_2026.csv.gz` | 945,502 | 243 | 2023-01-02 .. 2026-11-03 | 1,139 rows / 232 symbols on 2026-11-03 |
| Reference daily (69 symbols) | `data/reference/egx_daily_egx_data_pack_69_2022_2026.csv.gz` | 76,679 | 69 | 2022-01-02 .. 2026-10-07 | separate vendor reference pack |
| Live snapshots (actual + pre-open) | `data/live/live_snapshots_2026_11_03_*.csv` | 719 | 245 + 237 + 237 | 2026-11-03 09:55 / 13:55 / 14:05 | 13:55/14:05 **actual marketwatch**; 09:55 pre-open; bid/ask AALR only |
| News and disclosures, recent | `data/news/news_2026_11_01_2026_11_03.csv` | 227 | - | 2026-11-01T09:14:10+02:00 .. 2026-11-03T15:50:39+02:00 | 53 published on 2026-11-03; actual `seen_at_cairo` |
| Official disclosures, full | `data/news/egx_official_disclosures_2022_2026_2026_11_03.csv.gz` | 72,283 | - | 2022-01-02T10:12:52+02:00 .. 2026-11-03T15:50:39+02:00 | 2022-2026 history |
| Macro | `data/macro/macro_daily_2022_2026_2026_11_03.csv` | 1,514 | 7 series | 2022-01-03 .. 2026-11-03 | USD/EGP, S&P 500, VIX, Brent, gold, DXY, US10Y |
| Indices | `data/indices/indices_daily_2023_2026_2026_11_03.csv` | 727 | 4 indices | 2023-11-05 .. 2026-11-03 | EGX30, EGX70, EGX100, Sharia; 2026-11-03 final |
| Bid/ask history | `data/official/bidask_snapshots_2026_08_23_2026_10_01.csv.gz` | 2,298,634 | 238 | 2026-08-23 .. 2026-10-01 | history only; 2026-11-03 AALR live is in `data/live/` |
| Investor cumulative | `data/official/egx_investor_cumulative_2026_11_03.csv` | 48 | 12 scopes | assumed through 2026-11-03 | period field is `cumulative_or_period_unspecified` |
| Latest official daily investor report | `data/official/egx_daily_investor_report_2026_11_02.csv` | 12 | 3 tables | 2026-11-02 | **not 2026-11-03**; 6 derived rows |
| Universe / coverage | `data/universe/`, `data/coverage/` | 306 stocks | - | through 2026-11-03 | 248 clean union, 243 intraday, 238 bid/ask |
| SQLite | `db/egx_2026_11_03.sqlite` | - | 15 tables | through 2026-11-03 | compact queryable copy, 60.9 MiB |

**Last values on 2026-11-03:** USD/EGP 55.3204; S&P 500 7568.92;
VIX 20.83; Brent 103.60; gold 3940.40;
DXY 101.87; US10Y 4.952.
Indices: EGX30 49,255.66; EGX70 16,648.16; EGX100 22,344.10; Sharia 5,907.64.

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
5. **1-minute coverage is uneven.** 2023 has 27,343
   rows, 2024 76,485, 2025
   479,315, 2026 H1
   2,116,026, 2026 H2
   3,030,336.
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
- Bid/ask: `D:\BIDASK_FINAL\snapshots` history; 2026-11-03 AALR live from
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
