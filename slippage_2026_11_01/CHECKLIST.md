# Checklist — EGX slippage dataset 2026-11-01

| Request | Status | Evidence |
|---|---|---|
| All 97 halal symbols | Included in live/1m coverage tables; 10 have no 1m file | `symbol_coverage.csv` |
| 13:55, 14:00, 14:05 | Live rows for 2026-11-01; historical 1m rows for 2023-01-02..2026-09-09 | `quotes` |
| 14:15, 14:25 | Same as above | `quotes` |
| Next morning 10:00, 10:05, 10:15 | Historical 1m rows for all dates; **2026-11-02 live data does not exist yet** (extraction is 2026-11-01) | `quotes` |
| Last trade price | Live: `last_price`; 1m: last completed bar close / first bar open | `price_basis` |
| Best bid / best ask | Live, `hist_bidask`, `rich_snapshot`; blank for 1m | `bid_ask_available` |
| Bid/ask quantities | Live, `hist_bidask`, `rich_snapshot`; blank for 1m | `best_bid_qty`, `best_ask_qty` |
| Historical bid/ask | `BIDASK_FINAL` 2026-08-23..2026-10-01 (12,349/16,296 with both sides) and `rich_data_export` 2026-07-26..2026-08-04 (1,917/5,432) | `hist_bidask`, `rich_snapshot` |
| Cumulative volume | Live: `total_volume`; 1m: sum of completed bars | `volume_basis` |
| Actual bought orders (price/time/fill) | **None verified** | `actual_trades.csv` empty; `unverified_orders.csv` marked false |
| Every day with data | 1m dates 2023-01-02..2026-09-09; hist_bidask 2026-08-23..2026-10-01; rich_snapshot 2026-07-26..2026-08-04; live 2026-11-01; tv_ticks: source dates 2026-10-29, 2026-11-01; 2026-10-29 has only one 16:54 Cairo snapshot (237 symbols), so there are no rows at the requested times and tv_ticks is not included in `quotes`; 2026-11-01 tv_ticks is covered by `live_quote` | `coverage_by_date.csv` |
| One folder on the same GitHub repo | `slippage_2026_11_01/` | remote verification |
| No invented/missing values | Missing values are blank + status flags | `quote_status`, `notes` |
| Original files preserved | Raw 1m copied, source hashes verified | `MANIFEST.csv` |

## Live target coverage

             rows  with_price  with_bid_ask
target_time                                
10:00          97          95            94
10:05          97          95            94
10:15          97          90            90
13:55          97          90            93
14:00          97          90            92
14:05          97          90            92
14:15          97          90            93
14:25          97          90            93

## Historical bid/ask target coverage

             rows  with_price  with_bid_ask
target_time                                
10:00        2037        1243          1386
10:05        2037        1339          1479
10:15        2037        1198          1287
13:55        2037        1607          1638
14:00        2037        1608          1637
14:05        2037        1609          1632
14:15        2037        1610          1643
14:25        2037        1613          1647

## Rich snapshot target coverage

             rows  with_price  with_bid_ask
target_time                                
10:00         679           0             0
10:05         679           0             0
10:15         679          86            92
13:55         679         352           363
14:00         679         352           363
14:05         679         352           363
14:15         679         357           368
14:25         679         357           368

## Required caveat

Real fills are unverified. This dataset is an extraction/simulation input, not proof of executable fills.
