# egx-data

Egyptian Exchange full dataset + research code (private).

Built 2026-10-06..10 from TradingView (account), Yahoo (cross-checks/FX fallback), FRED (macro).

## Layout
- `data/` full EGX_DATA tree (daily, intraday 6 TFs, indices, FX, fundamentals, news, reference, backtest proofs+logs)
- `code/` fetch/verify/merge/audit scripts
- `docs/pack_docs/` per-folder READMEs + MANIFEST + VERIFICATION + REGULATORY + trader template
- `docs/review_pack/` strategy review + methods inventory

## Integrity
- Every data file passed OHLC write-gates; see docs/pack_docs/VERIFICATION.md
- Known open flags: COMI/EAST vendor adjustment gaps, GRCA Sep-2026 split basis, halal-history gap

## Data fixes 2026-10-30
- `data/01_daily/ALL_daily.csv` now has true-only `open`, `open_raw` (old value, invalid for execution), `open_true`, `open_is_fake`, limit-lock, no-trade and usable flags. 996,010 rows / 271 symbols; 84.4 MiB. Full 30-column table: `data/01_daily/ALL_daily_full.parquet`.
- All 271 `data/01_daily/EGX_*.csv` files were regenerated with the same semantics. `02_daily_divadj`, `03_weekly` and `04_monthly` were also corrected (02 is a derived adjusted open; 03/04 use the first daily true open).
- Metadata (271 rows), dividends (247), halal (97), settlement (69), suspended/no-data (33), bid/ask spread and timezone/DST audits were updated.
- `open` may be NaN when no true open exists; there is no fallback. Do not use `open_raw` for execution.
- Details: `DATA_FIXES_2026_10_30.md`. Verify with `python code/verify_data_fixes_2026_10_30.py`.

## Secrets
- No credentials in this repo (verified by scan before push).
