# Missing / limited items - 2026-11-03 cutoff

Nothing in this file was filled with an invented value. Each gap says exactly
what is missing and what is included instead.

## 1. Official 2026-11-03 daily investor report - MISSING

- The EGX beta daily investor page (`/en/market/investors`) is current-day only.
  When fetched on 2026-11-04 at 10:17 Cairo it showed the **2026-11-04
  preliminary** values.
- The official daily report PDF for **2026-11-03** was not published/available
  at build time. The latest available official daily report is **2026-11-02**
  (PDF ID 1022, published 03-11-2026). Its `Trading Date` is 02/11/2026.
- Included instead:
  - `data/official/egx_daily_investor_report_2026_11_02.csv` - latest official
    daily report, explicitly labelled `report_date=2026-11-02`; not a substitute
    for 2026-11-03.
  - `data/official/egx_investor_cumulative_2026_11_03.csv` - official cumulative
    snapshot fetched 2026-11-04 08:06 UTC before the session; period field is
    `cumulative_or_period_unspecified`; `as_of_status` says the through-date is
    assumed.
- No 2026-11-03 Egyptians/foreigners/institutions/individuals daily values were
  fabricated.

## 2. Verified 2026-11-03 live captures - MISSING

- No verified live capture files exist for 2026-11-03.
- `09:55` has no 1-minute bar before the 10:00 open. The delivered 09:55 file is
  a **pre-open reference using 2026-11-02 daily OHLCV** (245 clean-union symbols
  with a 2026-11-02 daily row).
- `13:55` and `14:05` are reconstructed from the last completed 1-minute bar
  before the target (232 symbols each).
- All rows have `is_live_capture=0`; bid/ask and quantities are null.

## 3. 2026-11-03 bid/ask - MISSING

- The bid/ask history ends 2026-10-01 (2,298,634 rows / 238 symbols).
- No verified 2026-11-03 quotes were available; the live files use nulls and
  `bidask_status=unavailable_source_null`.

## 4. Exact T0 216 list - UNVERIFIED

- The exact 216-symbol list was not found in project files, the database or web
  searches.
- The documented 248-symbol clean union is used as a superset: 221 official
  symbolType C + 97 halal + 100 top-liquidity + other TV/union symbols.
- 243 symbols have intraday history; 232 have 2026-11-03 1m bars; 100/100
  top-liquidity symbols have 1m history; 94/97 halal symbols have 1m history.
- The stock universe is 306. The daily file has 323 symbols because it also
  contains 20 index/ETF/ISIN/right/other rows that are not stocks.

## 5. 98th halal symbol - UNRESOLVED

- 97 halal symbols were found; the user's target is 98. The 98th was not
  identified; no symbol was invented to reach 98.

## 6. 1-minute coverage gaps

- 2023: 27,343 rows; 2024: 76,485; 2025: 479,315; 2026 H1: 2,116,026; 2026 H2:
  3,030,336. 2023-2024 are sparse compared with 2025-2026.
- 2026-09-10 1-minute data is missing outside the 69-symbol
  `EGX_DATA_2022_2026` reference pack.
- Five clean-union symbols have no 1-minute history at all: AIHC, BIOQ, EEI,
  IUFO, NAPR.
- Sixteen clean-union symbols have no 2026-11-03 1-minute bar: AIHC, APPC, BIDI,
  BIOQ, DEIN, EEI, EITP, EPPK, FCMD, GTHE, IUFO, MISR, MKIT, NAPR, NCGC, PACH.

## 7. Three universe symbols have no daily row

- BIOQ, EEI, IUFO. They remain in the universe with coverage flags showing the
  absence; no daily row was fabricated.

## 8. Actual fills / execution - NOT PRESENT

- This package contains no broker fills, order acknowledgements, partial-fill
  records, cancellations, rejections, settlement records or fees.
- Any strategy result derived from this data is a simulation and must be labelled
  as such. **التنفيذات الحقيقية غير متحققة.**

## 9. Intentionally excluded

- 2026-11-04 prices, news, macro, index and investor rows: excluded by cutoff.
- 2026-11-04 live snapshots and the preliminary 2026-11-04 investor report:
  excluded.
- Parquet duplicates and raw source archives: not included; CSV.gz is canonical
  and contains the candles. The raw 2026-11-04 source build remains in
  `strategy-lab/outputs/egx_2026_11_04/` for audit.
