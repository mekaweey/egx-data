# -*- coding: utf-8 -*-
"""Keep the stock universe at 306 rows; document the 20 non-stock/index rows.

The filtered daily file contains 323 symbols, including indices (EGX30,
SHARIAH, ...), ETFs (EGX30ETF), ISIN-like rows and right/other instruments.
Those are not stocks and must not be counted in `all_stocks`.  This script
removes the 20 rows added by the previous patch and records the distinction.
"""
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
D = ROOT / "strategy-lab" / "outputs" / "egx_2026_11_03"
DATA = D / "data"
NOW = datetime.now(ZoneInfo("Africa/Cairo")).isoformat(timespec="seconds")

non_stock = {
    "EGS30AJ1C016-EGP", "EGS370O1C013", "EGS385S1C012", "EGS3E071C013-EGP",
    "EGS3I0S1C019", "EGS48271C018-EGP", "EGS65101C015", "EGS65621C012",
    "EGS65861C014", "EGS659O1C015", "EGS72L31C011", "EGX30", "EGX30ETF",
    "EGX35-LV", "FADGI", "FADX15", "FADXI15", "KORA_R1", "SHARIAH", "TAMAYUZ",
}

for rel in ["universe/universe_all.csv", "coverage/coverage_by_symbol.csv"]:
    p = DATA / rel
    df = pd.read_csv(p, low_memory=False)
    before = len(df)
    df = df[~df["symbol"].astype(str).str.upper().str.strip().isin(non_stock)].copy()
    df.to_csv(p, index=False, encoding="utf-8-sig")
    print(rel, before, "->", len(df))

u = pd.read_csv(DATA / "universe" / "universe_all.csv", low_memory=False)
pd.DataFrame({"symbol": sorted(u["symbol"].astype(str))}).to_csv(
    DATA / "universe" / "all_stocks.csv", index=False, encoding="utf-8-sig"
)

daily_symbols = set(pd.read_csv(
    DATA / "prices" / "egx_daily_2023_2026_2026_11_03.csv.gz",
    usecols=["symbol"], low_memory=False,
)["symbol"].astype(str).str.upper().str.strip())
missing_daily = sorted(set(u["symbol"].astype(str)) - daily_symbols)
summary = {
    "cutoff": "2026-11-03",
    "generated_at_cairo": NOW,
    "all_stocks": int(len(u)),
    "clean_union_248": int(u["in_clean_union_248"].sum()),
    "official_C": int(u["in_official_C"].sum()),
    "halal_97": int(u["in_halal_97"].sum()),
    "top100": int(u["in_top100_liquidity"].sum()),
    "with_1m": int(u["1m_rows"].notna().sum()),
    "with_5m": int(u["5m_rows"].notna().sum()),
    "with_60m": int(u["60m_rows"].notna().sum()),
    "with_bidask": int(u["bidask_rows"].notna().sum()),
    "in_daily_323": int(u["in_daily_323"].sum()),
    "daily_file_symbols": int(len(daily_symbols)),
    "daily_non_stock_or_index_symbols": int(len(non_stock)),
    "universe_symbols_without_daily": missing_daily,
    "exact_t0_216": "unverified",
    "halal_98": "unresolved_97_found",
    "note": ("The stock universe is 306 symbols. The daily file has 323 symbols: 303 universe stocks plus "
             "20 index/ETF/ISIN/right/other rows that are not stocks and are excluded from all_stocks. "
             "Three universe symbols have no daily row in the filtered history: " + ", ".join(missing_daily) + ". "
             "The exact T0 216 list was not found; the 248-symbol clean union is the documented superset."),
}
(DATA / "universe" / "universe_summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

t0 = pd.read_csv(DATA / "universe" / "universe_t0_attempt.csv")
if "all_stocks" in set(t0["item"]):
    t0.loc[t0["item"] == "all_stocks", "count"] = int(len(u))
    t0.loc[t0["item"] == "all_stocks", "note"] = "stock universe only; 20 index/ETF/ISIN/right rows in the daily file are excluded"
else:
    t0 = pd.concat([t0, pd.DataFrame([{
        "item": "all_stocks", "count": int(len(u)),
        "source": "stock universe (daily + clean union + top100)",
        "note": "20 index/ETF/ISIN/right rows in the daily file are excluded from all_stocks",
    }])], ignore_index=True)
t0.to_csv(DATA / "universe" / "universe_t0_attempt.csv", index=False, encoding="utf-8-sig")
print("universe", len(u), "daily flag", int(u["in_daily_323"].sum()), "missing daily", missing_daily)
