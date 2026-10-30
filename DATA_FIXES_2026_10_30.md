# EGX data fixes — 2026-10-30

This commit applies the verified local data fixes to the GitHub repository. It is not a claim that every data gap is solved. The exact limits are listed at the end.

## 1. Daily open (the main fix)

`data/01_daily/ALL_daily.csv`

- 996,010 rows / 271 symbols / 1997-02-12..2026-10-07 / 84.39 MiB.
- `open` is now **true open only**. It is the first 60-minute bar open from the intraday data. There is **no fallback** to the old value.
- `open_true` is the same true open (kept for explicit use).
- `open_raw` preserves the old `open` value. It is **not valid for execution**; do not use it as an entry price.
- `open_is_fake` marks rows where the old open was detected as a fake open (usually equal to the previous close).
- `has_true_open` marks rows with a real first-bar open.
- `limit_up_locked_10` / `limit_down_locked_10`: flat high=low=close, zero volume, >=9.5% move (10% limit proxy).
- `limit_locked_no_volume`: either limit lock.
- `no_trade` / `is_suspended_row`: zero-volume, no-trade row.
- `is_usable`: has a true open and is not a limit lock / no-trade row.

Counts:

| item | rows |
|---|---:|
| total | 996,010 |
| has_true_open | 572,715 |
| open_is_fake | 533,301 |
| limit_up_locked_10 | 56 |
| limit_down_locked_10 | 24 |
| limit_locked_no_volume | 80 |
| no_trade / is_suspended_row | 80,018 |
| is_usable | 568,460 |
| open is NaN (no true open) | 423,295 |

`data/01_daily/ALL_daily_full.parquet` is the full 30-column corrected daily table (38.8 MB) for users who want every audit column.

All 271 `data/01_daily/EGX_*.csv` files were regenerated with the same true-only `open`, `open_raw`, `open_true`, and flags. The three files that use `date` instead of `datetime_utc` (ACRO, EIUD, FCMD) keep their original schema.

## 2. Dividend-adjusted and higher timeframes

- `data/02_daily_divadj/ALL_divadj.csv` (990,897 rows, 85.27 MiB) and its 271 per-symbol files now have true-only `open`. The adjusted true open is derived as `raw true open * (adjusted close / raw close)`; `open_raw` preserves the old adjusted open. This is a derived adjusted open, not an auction print.
  - has_true_open 572,715; open_is_fake 531,355; limit up 55 / down 24; no_trade 79,558; is_usable 568,460.
  - The adjusted file has 5,113 fewer rows than the raw file, so its flag totals are slightly lower.
- `data/03_weekly/ALL_weekly.csv` (224,960 rows, 20.1 MiB) and 271 per-symbol files: `open` is the first daily true open in the week; `open_raw` preserves the old weekly open. 272 files; 126,195 true opens; 116,321 fake flags.
- `data/04_monthly/ALL_monthly.csv` (53,873 rows, 4.86 MiB) and 271 per-symbol files: same rule at month level. 272 files; 29,712 true opens; 27,566 fake flags.
- `open` can be NaN in all four timeframes. That is deliberate: no true open means no usable open.

## 3. Metadata, ISIN, settlement, suspended names

`data/08_metadata/symbols_metadata.csv` now has 271 rows and 30 columns.

- 267 valid ISIN check digits; 4 missing: BIOQ, EEI, IUFO (no market data) and EIUD (daily only).
- FCMD and MKIT descriptions/ISINs added:
  - FCMD: International Company for Medical Industries (ICMI), EGS3I0S1C019.
  - MKIT: Egyptian Kuwaiti for Investment & Trade, EGS659O1C015.
- APPC, EITP, FCMD, GTHE, MKIT, NCGC, PACH all have valid ISINs.
- BIOQ, IUFO, EEI are marked `no_market_data`.
- `thndr_t0_tag` is `UNVERIFIED` for all 271 rows. The Thndr source has no per-symbol T0 tag; it is not filled with a guess.
- 69 rows have a February-2026 settlement board record; all say `T0 / T1 / T2`. 34 are marked T1-eligible by the 2023 category; 202 rows have no settlement record.
- `pit_2024_2026` is `unavailable` for all 271 rows. The 2023 category is known for 34 symbols only.
- `symbol_registry.csv` (271 rows, 40 columns) is the full registry behind the metadata.
- `settlement_mapping_2026_02.csv` (69 rows) and `suspended_or_no_data.csv` (33 rows) are included.
- `isin_fixes.csv` documents the 10 ISIN changes/checks.

## 4. Dividends and splits

`data/07_fundamentals/dividends_summary.csv` (247 rows):

- 48 ex-dividend dates filled from StockAnalysis/S&P Global (secondary source).
- 198 rows have no verified ex-date; 1 row (GRCA) has no dividend record.
- COMI: amount 6.00, ex-date 2026-04-07, yield 4.98.
- EAST: amount 1.45, ex-date 2026-05-21, yield 8.79.
- GRCA: no dividend record (yield 0).
- Official EGX/exchange ex-dates are still not available. The secondary dates are marked as such.

`data/07_fundamentals/corporate_actions_2026_10_30.csv` (440 events) and `split_events_derived.csv` (142 derived split events) are included. Derived splits are not official split records.

## 5. Halal list

`data/11_reference/halal_stocks_list.csv` (97 rows):

- 67 `thndr_unverified`, 24 `islamicly`, 6 `egx33`.
- 3 symbols have no 2023-2026 price data: BIOQ, EEI, IUFO.
- 19 rows in the old file were marked "no price" but do have 2023-2026 data; the corrected primary `has_price_data` column is fixed, and `has_price_data_original` preserves the old value.
- `historical_status` is `current_only_unverified` for all 97. There is no 2022 halal snapshot, so a 2022 backtest cannot claim historical halal membership.

## 6. Limit locks and suspension gaps

- `data/01_daily/limit_lock_events.csv`: 80 events (56 up / 24 down), 2013-2023. These are flat, zero-volume, >=9.5% moves; a 10% limit proxy, not an official EGX limit record.
- `data/01_daily/limit_lock_by_year.csv`: yearly counts.
- `data/01_daily/suspension_gaps.csv`: 8,568 missing-session gaps across 243 symbols, 218,481 missing sessions. A gap means no row versus the union calendar; it can be illiquidity, suspension, delisting or a data gap. It is not an official EGX suspension notice.
- `data/08_metadata/suspended_or_no_data.csv`: 33 rows; 24 common stocks; 11 survivorship-bias candidates; 9 absent common names (6 unverified with no symbol, BQDC, ESRS, SIMO).

## 7. Bid/ask

`data/BIDASK_FINAL/spread_by_group_fixed.csv` uses the only available window, 2026-07-06..2026-09-08:

| window | group | median spread |
|---|---|---:|
| entry | T1 (most active 34) | 0.3149% |
| entry | non-T1 all | 0.4054% |
| exit | T1 | 0.5410% |
| exit | non-T1 all | 0.5420% |

The data cannot split T0 vs T2 because there is no per-symbol settlement tag. The old 0.36% T0 / 1.1% T2 estimates are not supported by this file. Longer bid/ask history is still unavailable.

## 8. Timezone / DST / closing window

- `data/05_intraday/timezone_audit_1m.csv` and `timezone_audit_60m.csv`: 267/267 files aligned to the 10:00-14:30 Cairo session with +02/+03 offsets; zero bars outside the session.
- `dst_transitions_observed.csv`: observed 2014 and 2023-2026 DST transitions. The 2026 end transition is after the data end (2026-10-07), so it is not observed.
- First-window / last-window medians: 1m 89.66% / 93.02%; 60m 97.31% / 88.29%. These are data-completeness numbers, not DST errors.
- `closing_window_summary.csv`: 10.34% median 14:25-14:29 coverage; no ticks and no closing-auction data. The data cannot say whether a closing auction fill was possible.
- 1m full-window alignment is strict for 65/267 symbols; 60m for 108/267. Gaps are data completeness.

## 9. Verification

Run:

```bash
python code/verify_data_fixes_2026_10_30.py
```

The script checks row counts, symbols, duplicates, open semantics, flag counts, metadata/ISIN/settlement, dividends, halal, suspension, bid/ask, timezone, file-size limits, and the SHA-256 manifest. It exits non-zero on failure.

Result on 2026-10-30: **189/189 checks passed**.

Local pre-commit checks also confirmed that `open_raw` preserves the original old open for every row in `01_daily`, `02_daily_divadj`, `03_weekly` and `04_monthly` (ALL files) and for sampled per-symbol files.

## 10. Not fixed / not verifiable for free

- Full 1m/5m history for 2022-2024. The 240m coverage is not "600-1000 rows/year": 2013 has 11,689 rows across 85 tickers; 2017 has 37,301 across 202.
- Opening-auction prints and closing-auction ticks.
- Bid/ask before 2026-07.
- Official EGX ex-dividend/split dates (secondary/derived only).
- A 2022 halal snapshot.
- Point-in-time T0/T1/T2 membership for 2024-2026.
- The 6 absent common stocks and the 9 absent common names in the suspended table.
- Real fills and real T+1 Advanced Limit Order execution. All strategy numbers are simulations; real fills are unverified.

## 11. Rollback

The original files remain in git history. This commit can be reverted with:

```bash
git revert <commit>
```

Local-only backups of the replaced originals are in `data_fixed_2026_10_30/github/originals/` (not committed).
