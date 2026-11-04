# Delivery checklist - 2026-11-03 cutoff

Status legend: **DONE** = delivered and verified; **PARTIAL** = delivered with a
documented limitation; **MISSING** = not available, not invented; **SEE STATUS** =
post-upload item recorded in `UPLOAD_STATUS.json`; **LOCAL PASS** = local checks
passed, remote verification recorded after upload.

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Daily candles through 2026-11-03 | **DONE** | 206,545 rows / 323 symbols / 2023-01-02..2026-11-03; 2026-11-03 has 309 rows and all `is_partial=0` |
| 2 | Hourly candles through 2026-11-03 | **DONE** | 945,502 rows / 243 symbols; 2026-11-03 1,139 rows / 232 symbols |
| 3 | 1-minute candles through 2026-11-03 | **PARTIAL** | 5,729,505 rows / 243 symbols; 2026-11-03 39,302 rows / 232 symbols; 2023-2024 sparse and 16 clean-union symbols have no 2026-11-03 bar |
| 4 | 5-minute candles through 2026-11-03 | **DONE** | 2,019,692 rows / 243 symbols; 2026-11-03 11,148 rows / 232 symbols |
| 5 | All T0 stocks (user target 216) | **PARTIAL** | Exact 216 list not found; 248-symbol clean union is the documented superset; 243 have intraday; 232 have 2026-11-03 1m; 100/100 top-liquidity have 1m |
| 6 | At least 98 halal stocks | **PARTIAL** | 97 found in `halal-symbols.txt`; the 98th was not identified; 94/97 have 1m history; 3 have no daily row (BIOQ, EEI, IUFO) |
| 7 | Top 100 by liquidity | **DONE** | Recomputed from filtered 60m over the last 60 sessions; 100/100 have 1m history |
| 8 | News through 2026-11-03 with actual seen time | **DONE** | 227 recent rows (53 on 2026-11-03); `seen_at_cairo` records the actual fetch time (2026-11-04 for the recent batch); full disclosures 72,283 rows |
| 9 | Official disclosures through 2026-11-03 | **DONE** | Full 2022-2026 file filtered to 2026-11-03; 2026-11-04 rows excluded |
| 10 | Macro through 2026-11-03 | **DONE** | 1,514 rows / 7 series; last date 2026-11-03; all last rows `is_partial=0` |
| 11 | Daily indices through 2026-11-03 | **DONE** | 727 rows / 4 indices; 2026-11-03 `is_final=1`; 2026-11-04 provisional row excluded |
| 12 | EGX daily investor report through 2026-11-03 | **MISSING** | Official 2026-11-03 daily report not published/available at build time; cumulative snapshot through 2026-11-03 included with unspecified-period label; latest official daily report is 2026-11-02 (clearly labelled, not a substitute) |
| 13 | Live snapshots 09:55 / 13:55 / 14:05 | **PARTIAL** | 245 / 232 / 232 rows; reconstructed, not live; 09:55 is a 2026-11-02 pre-open reference; 13:55/14:05 use the last completed 1m bar; bid/ask null |
| 14 | Bid/ask for 2026-11-03 | **MISSING** | History ends 2026-10-01; no verified 2026-11-03 quotes; nulls, not invented |
| 15 | Preserve the existing 2026-11-01 dataset | **DONE** | `slippage_2026_11_01` was not modified; source `egx_2026_11_04` is untouched |
| 16 | Exclude 2026-11-04 partial data | **DONE** | All price/news/macro/index maxima are 2026-11-03; no 2026-11-04 data filenames |
| 17 | Upload to GitHub without omissions | **SEE STATUS** | `UPLOAD_STATUS.json` and `docs/UPLOAD_VERIFICATION.md` are written after upload |
| 18 | Verify before and after upload | **LOCAL PASS** | 90 local checks passed; remote verification is in `UPLOAD_STATUS.json` |
| 19 | No fabricated values / no false execution claims | **DONE** | Missing items are labelled; no fills; no 2026-11-03 daily investor values invented |

## Known gaps

- 2026-11-03 daily investor report: missing (see `MISSING.md`).
- 2026-11-03 live captures: not available; reconstructed only.
- 2026-11-03 bid/ask: not available.
- Exact T0 216 and 98th halal symbol: not found.
- 1m gaps: 2023-2024 sparse; 2026-09-10 missing outside the 69-symbol pack; 5 clean-union symbols have no 1m history; 16 have no 2026-11-03 1m bar.
- 3 universe symbols have no daily row: BIOQ, EEI, IUFO.
- Actual fills: none.
