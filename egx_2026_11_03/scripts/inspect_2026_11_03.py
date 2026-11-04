# -*- coding: utf-8 -*-
"""Read-only inventory of the 2026-11-04 build to plan the 2026-11-03 cutoff."""
from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
D = ROOT / "strategy-lab" / "outputs" / "egx_2026_11_04"
DATA = D / "data"


def main() -> None:
    print("### daily")
    daily = pd.read_csv(DATA / "prices" / "egx_daily_2023_2026_2026_11_04.csv.gz", low_memory=False)
    print(daily.shape, daily.symbol.nunique(), daily.date.min(), daily.date.max())
    print(daily.groupby("date").size().tail(5).to_string())
    for d in ["2026-11-02", "2026-11-03", "2026-11-04"]:
        x = daily[daily.date == d]
        print(d, len(x), x.symbol.nunique(), x.source.value_counts().to_dict(), x.is_partial.value_counts().to_dict())

    print("\n### 1m")
    m1 = pd.concat([
        pd.read_csv(DATA / "prices" / "egx_1m_2026_H1.csv.gz", low_memory=False),
        pd.read_csv(DATA / "prices" / "egx_1m_2026_H2.csv.gz", low_memory=False),
    ], ignore_index=True)
    print(m1.shape, m1.symbol.nunique(), m1.date_cairo.min(), m1.date_cairo.max())
    print(m1.groupby("date_cairo").size().tail(6).to_string())
    for d in ["2026-11-02", "2026-11-03", "2026-11-04"]:
        x = m1[m1.date_cairo == d]
        print(d, len(x), x.symbol.nunique(), x.time_cairo.min(), x.time_cairo.max(), x.source.value_counts().to_dict())

    print("\n### 5m / 60m")
    for tf in ["5m", "60m"]:
        x = pd.read_csv(DATA / "prices" / f"egx_{tf}_2023_2026.csv.gz", low_memory=False)
        print(tf, x.shape, x.symbol.nunique(), x.date_cairo.min(), x.date_cairo.max())
        print(x.groupby("date_cairo").size().tail(5).to_string())
        for d in ["2026-11-02", "2026-11-03", "2026-11-04"]:
            y = x[x.date_cairo == d]
            print(tf, d, len(y), y.symbol.nunique(), y.source.value_counts().to_dict())

    print("\n### news")
    news = pd.read_csv(DATA / "news" / "news_2026_11_01_2026_11_04.csv", low_memory=False)
    news["pub_date"] = news["published_cairo"].astype(str).str[:10]
    print(news.shape, news.published_cairo.min(), news.published_cairo.max(), news.seen_at_cairo.min(), news.seen_at_cairo.max())
    print(news.groupby("pub_date").size().to_string())
    full = pd.read_csv(DATA / "news" / "egx_official_disclosures_2022_2026_2026_11_04.csv.gz", low_memory=False, usecols=["code", "published_cairo", "seen_at_cairo"])
    full["pub_date"] = full["published_cairo"].astype(str).str[:10]
    print("full", full.shape, full.published_cairo.min(), full.published_cairo.max())
    print(full.groupby("pub_date").size().tail(6).to_string())

    print("\n### macro")
    macro = pd.read_csv(DATA / "macro" / "macro_long_2022_2026_2026_11_04.csv", low_memory=False)
    print(macro.groupby("indicator").agg(rows=("date", "size"), first=("date", "min"), last=("date", "max")).to_string())

    print("\n### indices")
    idx = pd.read_csv(DATA / "indices" / "indices_daily_2023_2026_2026_11_04.csv", low_memory=False)
    print(idx.shape, idx.date.min(), idx.date.max())
    print(idx.tail(6).to_string(index=False))

    print("\n### investor")
    inv = pd.read_csv(DATA / "official" / "egx_daily_investor_flows_1045.csv", low_memory=False)
    print(inv.shape)
    print(inv[["report_date", "table", "nationality", "net_value_egp", "page_last_updated", "is_final"]].to_string(index=False))

    print("\n### live")
    for p in sorted((DATA / "live").glob("*.csv")):
        x = pd.read_csv(p)
        print(p.name, x.shape, x.captured_at_cairo.min(), x.captured_at_cairo.max(), x.get("snapshot_status", pd.Series(dtype=str)).value_counts().to_dict())

    print("\n### bidask")
    b = pd.read_csv(DATA / "official" / "bidask_snapshots_2026_08_23_2026_10_01.csv.gz", usecols=["symbol", "captured_at_utc"])
    print(b.shape, b.symbol.nunique(), b.captured_at_utc.min(), b.captured_at_utc.max())

    print("\n### universe / coverage")
    print((DATA / "universe" / "universe_summary.json").read_text(encoding="utf-8"))
    cov = pd.read_csv(DATA / "coverage" / "coverage_by_symbol_timeframe.csv", low_memory=False)
    print(cov.groupby("timeframe").agg(rows=("rows", "sum"), symbols=("symbol", "nunique"), first=("first_date", "min"), last=("last_date", "max")).to_string())


if __name__ == "__main__":
    main()
