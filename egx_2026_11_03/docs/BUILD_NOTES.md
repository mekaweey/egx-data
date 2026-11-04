# Build notes

- Build date: 2026-11-04T12:15:57+02:00.
- Data cutoff: 2026-11-03.
- Source build: `strategy-lab/outputs/egx_2026_11_04/` (untouched).
- Output: `strategy-lab/outputs/egx_2026_11_03/`.

## Filtering

All time series were filtered by the first 10 characters of their date column
(`date` or `date_cairo`) to `<= 2026-11-03`. The 2026-11-04 rows removed were:

- 1m H2: 12,189 rows (2026-11-04 10:00-10:50).
- 5m: 2,629 rows.
- 60m: 239 rows.
- Daily 2023-2026: 307 rows.
- Daily full 2013-2026: 307 rows.
- News recent: 11 rows; full disclosures: 11 rows.
- Macro: 5 rows across series.
- Indices: 1 provisional row.

## Live reconstruction

- 09:55: no 1m bar before 10:00; previous session (2026-11-02) daily OHLCV used
  as a pre-open reference for the 245 clean-union symbols that have a 2026-11-02
  daily row.
- 13:55 / 14:05: filter 1m bars with `time_cairo < target`, group by symbol:
  first open, max high, min low, last close, sum volume, count bars, last bar
  time. 232 symbols each.
- All rows: `is_live_capture=0`, bid/ask null, `bidask_status=unavailable_source_null`.

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
- 15 tables; 63.8 MB (under the 100 MB per-file limit).
- The 2013-2022 daily archive and full news history remain in CSV.gz only.

## Verification

- `MANIFEST.csv` has SHA256/bytes/rows for every delivered file (excluding itself
  and post-upload status files).
- `scripts/verify_delivery_2026_11_03.py` checks hashes, cutoff, counts, live
  labels, investor labels, universe/coverage, bid/ask and SQLite.
- Remote git blob SHA1 comparison is recorded in `docs/UPLOAD_VERIFICATION.md`
  after upload.
