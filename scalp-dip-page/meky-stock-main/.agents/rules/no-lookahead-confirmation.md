# Mandatory Rule: No Look-ahead Bias in Intraday Confirmation Filters

## Rule Definition
In any backtest or strategy idea of the form:
> "If the stock confirms positive behavior in the first X minutes, buy it"

The entry price used in backtesting and simulation **MUST** be the actual price at the exact moment of confirmation (after X minutes, e.g. `price_at_minute_X`), and **NEVER** the original opening price (`day_open`).

## Core Principle
If a backtest uses the open price while relying on information revealed minutes later, this is **Look-ahead Bias**. The backtest result is 100% invalid, misleading, and unusable, regardless of how attractive the performance numbers appear.

## The Reality Check
Always apply the screen reality test:
> "If I am sitting live in front of the screen and observe this confirmation after X minutes, can I execute at the old opening price?"
> **Answer: Never. You must execute at the current market price.**

## Execution Guidelines
1. `entry_price` in any intraday confirmation scenario must be indexed to the confirmation timestamp (e.g. `p_15` for 15-minute confirmation).
2. Never compare strategy filters using open price when the filter condition happens after open.
3. Treat any metric produced with look-ahead entry as void and unpublishable.
