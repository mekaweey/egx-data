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

## Delivery 2026-10-31
- `delivery_2026_10_31/` — organized, compressed delivery of the 2026-10-31 data work. Start with `delivery_2026_10_31/README.md` and `CHECKLIST.md`; every file is listed in `delivery_2026_10_31/MANIFEST.csv` with size, row count and SHA-256.
- Highlights: `open_valid` panel + 222 suspicious cases; unified corporate actions + adjusted prices + rights; 23,573 per-symbol Mubasher news rows + 5,515 full-text pulse articles (pages 1-221; 5,486 in the requested range); 72,056 official EGX disclosures; Mubasher daily/intraday/snapshots; limits/halts; sectors; macro 2022-2026; earnings/insider/announcements.
- The full raw local package (including the 186.3 MB official-disclosures CSV and the raw per-symbol source files) will be attached to the GitHub Release `delivery-2026-10-31`, because a single 186 MB file exceeds GitHub's 100 MB file limit and duplicating the existing daily/intraday tree would push the repository over its size limit.
- Caveats: real fills are unverified; no free 1m data for 2023-2024, no historical bid/ask, no pre-2026-10-29 snapshots; the 222 list is the closest 222 by severity, not an exact reconstruction of the earlier list; the 10%/20% limits are inferred from observed limit days, not an official per-symbol/per-day classification.
