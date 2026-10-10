# daily_raw/ + daily_adj/ — daily bars
- daily_adj/EGX_<SYM>.csv: TradingView splits-adjusted (01_daily). 2001 -> 2026-10-09. Columns: time, datetime_utc, open, high, low, close, volume. WARNING: `open` == prev close in 52-99% of days (2017+: ~99%) — not a real print.
- daily_raw/EGX_<SYM>.csv: UNADJUSTED closes from Yahoo (.CA) where available (see yahoo_coverage.txt for the list); symbols without Yahoo coverage are absent here, NOT fabricated.
- dividends/: dividend_exdates_derived.csv (2041 events/187 syms: symbol, ex_date, yield_pct, amount_egp_est, method=splits-vs-divadj-ratio-jump) + splits_bonuses_derived.csv (14 downward jumps). Cross-validated 98/100 payers (2 missing are delisted).
- corp_actions/: same dividend files + note: rights issues/cap increases need EGX disclosure feed (not available) — ex-dates of cash dividends only.
