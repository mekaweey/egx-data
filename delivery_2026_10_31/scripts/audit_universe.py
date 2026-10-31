# -*- coding: utf-8 -*-
"""Audit the Mubasher news universe against the local EGX main-market list."""
from __future__ import annotations

import re
from pathlib import Path

import pandas as pd
import requests

ROOT = Path(__file__).resolve().parents[2]
NEWS = ROOT / "strategy-lab" / "outputs" / "mubasher_news_by_symbol_2026_10_31.csv"
SYMS = ROOT / "strategy-lab" / "outputs" / "all_symbols_2026_10_31.txt"
UNIV = ROOT / "strategy-audit" / "data_raw" / "universe.csv"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "ar,en;q=0.8",
}


def main() -> None:
    news = pd.read_csv(NEWS)
    news_syms = set(news["symbol"].astype(str).str.upper())
    all_syms = [s.strip().upper() for s in SYMS.read_text(encoding="utf-8").splitlines() if s.strip()]
    univ = pd.read_csv(UNIV)
    main = set(univ.loc[univ["in_main"].astype(bool), "symbol"].astype(str).str.upper())
    print(f"news symbols: {len(news_syms)}")
    print(f"all_symbols file: {len(all_syms)} unique={len(set(all_syms))}")
    print(f"universe in_main: {len(main)}")
    print(f"in all_symbols, missing from news: {sorted(set(all_syms) - news_syms)}")
    print(f"in news, missing from all_symbols: {sorted(news_syms - set(all_syms))}")
    print(f"in universe main, missing from all_symbols: {sorted(main - set(all_syms))}")
    print(f"in all_symbols, missing from universe main: {sorted(set(all_syms) - main)}")

    missing = sorted(set(all_syms) - news_syms)
    for sym in missing:
        url = f"https://www.mubasher.info/markets/EGX/stocks/{sym}/news"
        try:
            r = requests.get(url, headers=HEADERS, timeout=35)
            ids = set(re.findall(r"/news/(\d+)/", r.text))
            print(f"{sym}: status={r.status_code} len={len(r.text)} news_ids={len(ids)}")
        except Exception as e:
            print(f"{sym}: ERROR {e!r}")


if __name__ == "__main__":
    main()
