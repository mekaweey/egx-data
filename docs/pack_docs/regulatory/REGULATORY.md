# Regulatory & market-structure notes — EGX (compiled 2026-10-09 from public sources; verify current rules with EGX/broker before trading)

## Settlement
- EGX official cycle: **T+2** (EGX Clearing/Settlement page; Thndr: "regular orders take two days to settle — T2").
- Same-day settlement exists as a broker product (Thndr offers it), NOT as the market default.
- Our backtests model an optional T+2 cash-availability lag; results barely change (26 skipped picks / 9 years).

## Price limits & circuit breakers (history)
- Since 1996: strict price limits (SPL) ±5% (PhD thesis on EGX regimes).
- ~2001/2002: actively traded stocks CB ±10%, price limits ±20% (intraday VWAP-based).
- After Jan-2011: CB reduced to **±5%**, price limits **±10%** on order price; EGX100 index halt ±5% (30 min) / ±10% (day).
- Later: FRA approved **ceasing circuit breaker on EGX100** (EGX news).
- Working rule used in our checks: ±10% daily stock limits (locked-entry scan threshold 9.5%/10%).
- WARNING: percentages changed multiple times — confirm the CURRENT table with EGX before live trading.

## Taxes/fees (Egypt, general — confirm with broker/tax advisor)
- Brokerage commission varies by broker (user reports 0.05%/side on his account).
- Exchange + clearing + depository micro-fees per transaction.
- Capital-gains tax on EGX: legislated and changed in 2023-2024 reforms — confirm current rate.
- Dividend withholding tax applies — confirm current rate.

## Sharia universe
- Current halal list in universe_halal.csv (97 names, 95 with data; BIOQ/IUFO never had data).
- Constituent ENTRY/EXIT history: NOT available from any reachable source. SHARIAH index daily included from 2022 only. Any backtest on "halal" before list date carries survivorship/selection bias — disclosed, not hidden.

## Delisted / suspended / renamed (survivorship scope)
- Pack covers every symbol TradingView lists for EGX today, INCLUDING dead/suspended ones (ACRO, EIUD, MKIT, KASABF, MEGM-data-ends-2022-04, SEIGA-ends-2022-01, ISIN-named EGS48271C018 flat at 0.15).
- Names delisted BEFORE our fetch window and absent from TV lists are NOT covered. No public machine-readable delisted-history found.
- Renames: TV keeps one continuous series per current ticker (verify per-symbol if suspicious).

## Data quirks found
- `01_daily` "open" == previous close in 52-99% of days (2017+: 99%+) — NOT a real opening print. Use intraday first-bar opens (2021+) or closes.
- GRCA Sep-2026: 4:3 split applied to daily but NOT to intraday (0.75x). Exclude GRCA intraday after 2026-09-07.
- EGBE metadata currency says USD (provider quirk?) — price series in EGP scale; flag.
- COMI pre-2026: flat 10% TV-vs-Yahoo gap (one vendor missed a 2025 bonus/split). EAST pre-2023 similar. EFID Sep-2026, POUL pre-Oct-2026 similar.
