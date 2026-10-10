# fundamentals/ — company fundamentals (TradingView snapshot 2026-10-06 + live refresh)
- fundamentals_wide.csv (254 syms x ~200 fields: EPS TTM, net_income, revenue, total_debt, D/E, yields, payout, ex-dates recent/upcoming, forecasts, technicals) + per_symbol/ + fundamentals_long.csv.
- fund_wide_live.csv: HTTP-scanner refresh (264 rows; 7 symbols unscannable: ACRO, ARBLAND, EGX30ETF, EIUD, FCMD, KASABF, MKIT).
- dividends_summary.csv: amountRecent + yield (ex-date columns EMPTY at source).
- GAP: historical quarterly statements with announcement dates UNAVAILABLE (financials_wide empty at source). Snapshot only — backtests using it carry look-ahead unless lagged.
