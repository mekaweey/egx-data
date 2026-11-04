# Supplementary actual 09:56 pre-open snapshot - 2026-11-03

The main delivery uses a **2026-11-02 daily pre-open reference** for the 09:55
target because no 09:55 live source exists.  The earliest actual tick in
PostgreSQL `tv_ticks` on 2026-11-03 is **2026-11-03T09:56:24+02:00**, one minute after the
requested target.

This folder adds that actual tick as a clearly labelled supplement.  It does
**not** replace the main 09:55 file and it does not claim to be a 09:55
snapshot.

## File

- `live_snapshots_2026_11_03_0956_actual_tv_ticks.csv` - 297 symbols.

## What is actual

- `last_price`, `volume`, `prev_close` (2026-11-02 close), `change_pct`.
- `captured_at_cairo` = 2026-11-03T09:56:24+02:00.
- `source` = `postgres:tv_ticks`.
- `snapshot_status` = `actual_preopen_tick_0956`.
- `is_live_capture` = 0 (pre-open tick, not a continuous-session live trade).

## What is null

- `open`, `high`, `low`: no 09:56 OHLC source; marketwatch starts at 10:00.
- `bid`, `ask`, `bid_qty`, `ask_qty`: no 09:56 quote source; orderbook starts
  at 09:58:52 and covers AALR only.

## Coverage

- 297 symbols, 239 in the 248-symbol clean union, 58 outside.
- 98/100 top-100 liquidity symbols.
- 92/97 halal-list symbols.
- 204/209 official intraday symbols.

The main delivery's `MANIFEST.csv` intentionally does not include this
supplement; this folder has its own `MANIFEST.csv`.

No 2026-11-04 data is included.  No fill or execution is claimed.
