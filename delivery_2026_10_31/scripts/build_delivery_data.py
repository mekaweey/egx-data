# -*- coding: utf-8 -*-
"""Assemble the delivery data folder and the real-trades template."""
from __future__ import annotations

import shutil
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "deliverables_2026_10_31"
DATA = OUT / "data"
REPORTS = OUT / "reports"
SCRIPTS = OUT / "scripts"
DATA.mkdir(parents=True, exist_ok=True)
REPORTS.mkdir(parents=True, exist_ok=True)
SCRIPTS.mkdir(parents=True, exist_ok=True)

COPIES = {
    ROOT / "strategy-audit" / "data_derived" / "daily_fixed_2026_10_31.parquet": DATA / "daily_fixed_2026_10_31.parquet",
    ROOT / "strategy-audit" / "data_derived" / "macro_daily_2022_2026_2026_10_31.csv": DATA / "macro_daily_2022_2026_2026_10_31.csv",
    ROOT / "strategy-audit" / "data_derived" / "macro_egx_aligned_2026_10_31.csv": DATA / "macro_egx_aligned_2026_10_31.csv",
    ROOT / "strategy-audit" / "data_derived" / "bidask_spread_summary_2026_10_30.csv": DATA / "bidask_spread_summary_2026_10_30.csv",
    ROOT / "strategy-audit" / "data_derived" / "spread_cs_daily_2022_2026_2026_10_30.parquet": DATA / "spread_cs_daily_2022_2026_2026_10_30.parquet",
    ROOT / "strategy-lab" / "outputs" / "DATA_FIXES_REPORT_2026_10_31.md": REPORTS / "DATA_FIXES_REPORT_2026_10_31.md",
    ROOT / "strategy-lab" / "snapshot_market_2026_10_31.py": SCRIPTS / "snapshot_market_2026_10_31.py",
    ROOT / "strategy-lab" / "scrape_mubasher_news_2026_10_31.py": SCRIPTS / "scrape_mubasher_news_2026_10_31.py",
    ROOT / "rules" / "REALISM_CONTRACT.md": REPORTS / "REALISM_CONTRACT.md",
}

STRATEGY_FILES = [
    "news_insider_5d_2026_10_31.csv",
    "news_insider_5d_excess_2026_10_31.csv",
    "news_insider_5d_liquid69_2026_10_31.csv",
    "news_insider_positive_2026_10_31.csv",
    "news_ma_5d_2026_10_31.csv",
    "news_portfolio_5d_full_2026_10_31.csv",
    "news_portfolio_5d_best_trades_2026_10_31.csv",
    "news_portfolio_5d_best_daily_2026_10_31.csv",
    "news_portfolio_5d_score5_trades_2026_10_31.csv",
    "news_portfolio_5d_split_2026_10_31.csv",
    "news_portfolio_best_trades_2026_10_31.csv",
    "news_portfolio_best_daily_2026_10_31.csv",
    "news_portfolio_full_2026_10_31.csv",
    "news_portfolio_split_2026_10_31.csv",
    "news_summary_category_2026_10_31.csv",
    "news_summary_material_2026_10_31.csv",
    "news_summary_sent_timing_2026_10_31.csv",
    "news_summary_sentiment_2026_10_31.csv",
    "daily_signals_2023_2026_2026_10_31.csv",
    "final_summary.csv",
    "final_yearly.csv",
]


def main() -> None:
    for src, dst in COPIES.items():
        if not src.exists():
            print("MISSING", src)
            continue
        shutil.copy2(src, dst)
        print("copied", dst.name, dst.stat().st_size)

    for name in STRATEGY_FILES:
        src = ROOT / "strategy-lab" / "outputs" / name
        if not src.exists():
            print("MISSING", src)
            continue
        dst = REPORTS / "strategy" / name
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        print("copied", dst.relative_to(OUT))

    # Limits/halts extract for 2022-2026.
    d = pd.read_parquet(DATA / "daily_fixed_2026_10_31.parquet")
    d["date"] = pd.to_datetime(d["date"])
    d = d[(d.date >= "2022-01-01") & (d.date <= "2026-10-31")].copy()
    cols = [
        "symbol", "date", "limit_pct_est", "limit_pct_source", "halt_flag",
        "limit_close_flag", "close_limit_up", "close_limit_up_derived",
        "limit_up_locked", "limit_down_locked", "no_trade", "is_tradable",
    ]
    d[cols].to_csv(DATA / "limits_halts_2022_2026_2026_10_31.csv", index=False, encoding="utf-8-sig")
    print("limits rows", len(d), "halt", int(d.halt_flag.sum()), "limit_close", int(d.limit_close_flag.sum()))

    # Template for the user's 5-10 real trades.
    template = pd.DataFrame(
        columns=[
            "trade_id", "date", "symbol", "side", "quantity", "order_price",
            "execution_price", "execution_time", "commission_egp", "other_fees_egp", "notes",
        ]
    )
    template.to_csv(OUT / "real_trades_template.csv", index=False, encoding="utf-8-sig")
    print("wrote", OUT / "real_trades_template.csv")


if __name__ == "__main__":
    main()
