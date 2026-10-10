# intraday/ — minute bars (TradingView, max history served)
- Files: `1m|5m|15m|30m|60m|240m/EGX_<SYM>.csv` (268 symbols each) + `_index.csv` per TF (symbol, rows, first, last).
- Columns: time (epoch UTC), datetime_utc (UTC!), open, high, low, close, volume.
- TIMEZONE: timestamps are UTC. EGX session ≈ 10:00-14:30 Cairo (UTC+2, +3 in summer). Map UTC date->Cairo session date carefully for first/last bars.
- ADJUSTED OR RAW: intraday appears UNADJUSTED (GRCA Sep-2026 4:3 split missing here while daily has it). Treat intraday as RAW prints.
- Coverage: 1m from 2026-08-23, 5m 2026-05, 15m 2025-08, 30m 2024-01, 60m 2021-01, 240m 2013-01 (per-symbol detail in _index.csv). Older 1m does not exist on TV.
- Gaps: HALN/RMTV/ACRO/EIUD have NO intraday (suspended/delisted).
