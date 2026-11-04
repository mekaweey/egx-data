# Data dictionary

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
`ask_qty`, `in_clean_union`, `source`, `snapshot_status`, `data_quality`,
`bidask_status`, `is_live_capture`, `bars_used`, `first_bar_time`,
`last_bar_time`, `last_bar_timestamp_cairo`, `prev_close`, `reference_date`.

- `target_time`: `09:55`, `13:55`, `14:05`.
- `snapshot_status`:
  - `preopen_reference_previous_session_daily_ohlcv` for 09:55 (no 1m bar before
    the 10:00 open; uses 2026-11-02 daily OHLCV).
  - `reconstructed_from_1m_last_completed_bar_before_target` for 13:55/14:05.
- `is_live_capture=0` for every row.
- `bid`, `ask`, `bid_qty`, `ask_qty` are null; `bidask_status` is
  `unavailable_source_null`.
- `bars_used` is the number of 1m bars aggregated; 0 for 09:55.
- `change_pct` is `last_price / prev_close - 1` in percent; null for 09:55.

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
