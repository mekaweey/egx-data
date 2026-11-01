# EGX slippage dataset — 2026-11-01

Extraction time: **2026-11-01 14:44:33 EET**.

One consolidated extraction for the **97-symbol halal list** at the requested Cairo times:

`10:00, 10:05, 10:15, 13:55, 14:00, 14:05, 14:15, 14:25`

## What is in this folder

- `egx_slippage_2026_11_01.sqlite` — **one database with all tables** (quotes, actual trades, unverified orders, coverage, symbols, sources, manifest, notes).
- `egx_slippage_2026_11_01_quotes.csv` — the main long-format table (same as `quotes` in SQLite).
- `actual_trades.csv` — verified actual orders/fills only. **It is empty: no verified actual trades were found.**
- `unverified_orders.csv` — pending orders and paper/unverified signals, clearly marked `verified_actual=false`.
- `coverage_by_date_target.csv`, `coverage_by_date.csv`, `symbol_coverage.csv` — what exists and what is missing. In `coverage_by_date.csv`, `targets_present` = at least one usable row, `targets_partial` = some symbols missing, `targets_missing` = no usable row at all.
- `source_inventory.csv` — every database table and file inspected, with row counts and coverage.
- Historical bid/ask rows come from `data/BIDASK_FINAL/snapshots/` in the same repo (`dataset=hist_bidask`; 277 raw per-symbol CSVs, not copied again) and from `D:\meky-stock-main\...\public\rich_data_export\` (`dataset=rich_snapshot`; only `type=snapshot` rows with positive bid/ask).
- `MANIFEST.csv` — every file except itself, with size and SHA-256; the SQLite `manifest` table omits the SQLite file's own hash because a file cannot contain its own final hash.
- `tradingview_1m/` — all 221 TradingView 1-minute OHLCV exports (165.7 MiB), copied byte-for-byte from `D:\TradingView data`. 87 of them are the halal symbols used in `quotes`; the rest are preserved originals and are not used in `quotes`.
- `README.md`, `CHECKLIST.md`.

## Coverage (verified from the sources)

- **Live bid/ask**: only `2026-11-01` exists in `marketwatch_snapshots` (776 rows for the 97 symbols; 741 rows with both bid and ask).
- **Next morning**: `2026-11-02` live data does not exist yet (the extraction date is `2026-11-01`). The 10:00/10:05/10:15 rows are historical 1m only, for dates that have 1m data.
- **Historical bid/ask**: two sources.
  - `BIDASK_FINAL/snapshots` in the same repo, dates `2026-08-23..2026-10-01` (16,296 extracted rows; 12,349 rows with both bid and ask). Per-symbol CSV, captured_at in UTC.
  - `rich_data_export` raw daily CSV in `D:/meky-stock-main`, dates `2026-07-26..2026-08-04` (5,432 extracted rows; 1,917 rows with both bid and ask). Only `type=snapshot` rows with positive bid and ask are used.
  - Dates/times outside those ranges have **no bid/ask**.
- **TradingView 1m**: 151,232 target rows from 87 halal symbols with a 1m file; dates 2023-01-02..2026-09-09.
  - 2026 ranges 35–87 halal symbols per day (not all 97; 10 symbols have no 1m file). Coverage is not full-market.
  - 2023–2025 is sparse: only 2–36 halal symbols per day. Do not treat it as full-market 1m data.
  - 1m data ends **2026-09-09**; there is no 1m data for 2026-09-10..2026-10-31.
- **tv_ticks**: source dates 2026-10-29, 2026-11-01; 2026-10-29 has only one 16:54 Cairo snapshot (237 symbols), so there are no rows at the requested times and tv_ticks is not included in `quotes`; 2026-11-01 tv_ticks is covered by `live_quote`; no bid/ask.
- **Missing 1m symbols**: APPC, COSG, EITP, FAITA, GTHE, IUFO, MISR, MKIT, NCGC, PACH.
- **Aliases**: BIOQ→BIOC and EEI→EEII are inferred because the exact halal-list tickers are absent from the sources. FAITA is **not** mapped to FAIT: they are different price series.

## Exact method

### Live quotes (`marketwatch_snapshots`)

For each symbol and target time, the nearest snapshot within **±600 seconds** is selected. If any snapshot in that window has a positive, non-crossed bid and ask, the nearest such row is preferred; if only crossed quotes exist, the nearest crossed row is used and flagged; otherwise the nearest row with a positive last price is used. `delta_sec = snapshot_ts − target_ts` is stored, so positive means the snapshot was after the target. `last_trade_age_sec` is the age of the last trade at the snapshot. Crossed quotes and stale quotes are flagged, not silently fixed.

The marketwatch feed is uneven: a row with bid/ask often has `last_price=0`, while a row with last/volume has null bid/ask. In that case the fields are combined inside the same ±600s window: `snapshot_ts_cairo`/`delta_sec` describe the last price and volume, while `bidask_ts_cairo`/`bidask_delta_sec` describe the bid/ask. `source` and `source_detail` record the combination. `quote_status=no_last_trade` means valid bid/ask but no last trade; `is_zero=true` means neither a last price nor a bid/ask. For strict time matching, filter `abs(delta_sec) <= 60` and `abs(bidask_delta_sec) <= 60` (or leave blank when the field is absent).

### Historical bid/ask (`hist_bidask`)

The already-delivered `data/BIDASK_FINAL/snapshots/*.csv` files are the only source for the `hist_bidask` dataset; the separate `rich_snapshot` dataset covers `2026-07-26..2026-08-04`. Each file is one symbol; `captured_at` is UTC and is converted to Cairo. Rows are limited to 09:45–14:35 Cairo and deduplicated by `(captured_at, symbol)`. For each target, the nearest snapshot within **±600 seconds** is selected, preferring a non-crossed row with a positive bid and ask; if only crossed quotes exist, the nearest crossed row is used and flagged. `delta_sec` is stored. `last_price` and `cum_volume` come from the same row, `highest_bid_qty`/`lowest_ask_qty` are the displayed sizes, and crossed/stale/zero rows are flagged, not repaired. There is no fallback source for this dataset; a target with no snapshot in the window is `missing`.

### Raw rich snapshots (`rich_snapshot`)

`D:/meky-stock-main/meky-stock-main/public/rich_data_export/YYYY-MM-DD.csv` contains `symbol,type,price,volume,bid,bid_qty,ask,ask_qty,timestamp_cairo`. Only `type=snapshot` rows with `bid>0` and `ask>0` are used; `tick` rows are not quotes. `timestamp_cairo` is parsed as Cairo wall time, rows outside 09:45–14:35 are dropped, and exact duplicates are removed. For each target, the nearest snapshot within **±600 seconds** is selected, preferring a non-crossed row with a positive bid and ask; if only crossed quotes exist, the nearest crossed row is used and flagged. `price` is `last_price`, `volume` is `cum_volume`, and `bid_qty`/`ask_qty` are the displayed sizes.

### 1-minute bars (`tv_1m`)

For each symbol/date with a 1m bar:

- `last_price` and `cum_volume` use the **last completed 1m bar strictly before** the target. This avoids look-ahead.
- If there is no completed bar before the target (for example 10:00), the **first bar open** is used and `cum_volume=0`; `price_basis=first_bar_open`.
- `next_bar_open` / `next_bar_ts_cairo` / `next_bar_delta_sec` expose the first bar at or after the target as an execution proxy.
- `cum_volume_after_target_bar` is also provided for convenience, but it includes the target bar and is **not** known at the target time.
- There is **no bid/ask** in 1m data; `bid_ask_available=false` and the bid/ask fields are blank.
- `is_stale=true` when the last completed bar ended more than 300 seconds before the target.

### Actual trades

The execution-ledger tables `extension_trades`, `order_lifecycle` and `positions` are **empty**. `pending_orders` are still `pending` with `confirmed_at=null`; `overnight_signals.mode=paper`. Therefore:

- `actual_trades.csv` is empty.
- `unverified_orders.csv` contains pending/paper/unverified rows for transparency, all with `verified_actual=false`.
- Do **not** use those rows as real fills.

## Joining the datasets

`(date, symbol, target_time)` is unique **within** a dataset, not across datasets. `tv_1m` overlaps `hist_bidask` on 2026-08-23..2026-09-09 and `rich_snapshot` on 2026-07-26..2026-08-04. Join on `(date, symbol, target_time)`, prefer `hist_bidask`/`rich_snapshot` for bid/ask and `tv_1m` for the 1m last/volume, and keep both timestamps (`snapshot_ts_cairo`, `bidask_ts_cairo`). Do **not** sum or average rows across datasets.

## Important limitations

- Historical bid/ask is limited to `2026-08-23..2026-10-01` (`BIDASK_FINAL`), `2026-07-26..2026-08-04` (`rich_data_export`), and `2026-11-01` (live). For other dates the 1m dataset supports last-price/volume proxies only, **not spread or queue slippage**.
- Live coverage is limited to the dates listed above. The file records what existed at extraction time (2026-11-01 14:44:33 EET); any target with no snapshot in its ±600s window is marked `missing`.
- `marketwatch_snapshots` contains duplicate `(captured_at, symbol)` groups; they are deduplicated by keeping the last id. Crossed quotes are flagged, not repaired.
- Some symbols are illiquid and appear only once or twice in the day (for example 10:01 and 13:14); targets with no snapshot in the window are marked `missing`, not filled with a distant quote. A symbol with a valid bid/ask but no last trade is `no_last_trade`, not `zero_price`.
- No verified real fills. Any real-money decision needs an actual execution check.
- This is data, not investment advice, and it does not guarantee any strategy result.
