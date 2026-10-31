# -*- coding: utf-8 -*-
"""Filter the full Mubasher pulse scrape to the owner's requested range.

Range: 2026-10-28 15:02 Cairo (first news) .. 2025-06-18 09:17 Cairo
(the last pulse card; 09:17 Cairo = 08:17 in UTC+2, the time the owner quoted).

The full 5,515-card file is kept; this script writes the filtered files and a
small summary.
"""
from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "pulse_news_2026_10_31"
FULL = OUT / "pulse_articles_full.csv"
LINKS = OUT / "pulse_article_symbols.csv"
RANGE_CSV = OUT / "pulse_articles_range_2025_06_18_to_2026_10_28.csv"
RANGE_JSONL = OUT / "pulse_articles_range_2025_06_18_to_2026_10_28.jsonl"
RANGE_LINKS = OUT / "pulse_article_symbols_range.csv"
SUMMARY = OUT / "pulse_range_summary_2026_10_31.json"

START = "2026-10-28T15:02:00"
END = "2025-06-18T09:17:00"


def main() -> None:
    df = pd.read_csv(FULL)
    df["published_cairo"] = df["published_cairo"].astype(str)
    mask = (df["published_cairo"] >= END) & (df["published_cairo"] <= START)
    r = df[mask].copy()
    r = r.sort_values("published_cairo", ascending=False)
    r.to_csv(RANGE_CSV, index=False, encoding="utf-8-sig")
    with RANGE_JSONL.open("w", encoding="utf-8") as f:
        for rec in r.to_dict("records"):
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    links = pd.read_csv(LINKS)
    links["published_cairo"] = links["published_cairo"].astype(str)
    lmask = (links["published_cairo"] >= END) & (links["published_cairo"] <= START)
    links[lmask].to_csv(RANGE_LINKS, index=False, encoding="utf-8-sig")

    summary = {
        "range_start_cairo": START,
        "range_end_cairo": END,
        "range_end_note": "The last pulse card is 2025-06-18 09:17 Cairo = 08:17 UTC+2; page 222 is empty.",
        "full_rows": int(len(df)),
        "range_rows": int(len(r)),
        "excluded_rows": int(len(df) - len(r)),
        "first_row": r.iloc[0][["article_id", "published_cairo", "title"]].to_dict() if len(r) else None,
        "last_row": r.iloc[-1][["article_id", "published_cairo", "title"]].to_dict() if len(r) else None,
        "full_text_nonempty": int((r["full_text"].fillna("").str.len() > 0).sum()),
        "full_text_median_chars": float(r["full_text"].fillna("").str.len().median()) if len(r) else 0,
        "with_egx_symbol": int(r["symbols"].fillna("").str.contains("EGX:").sum()),
        "with_any_symbol": int(r["symbols"].fillna("").str.len().gt(0).sum()),
        "paywall_flag_true": int(r["paywall_flag"].fillna(False).sum()),
        "article_symbol_links": int(lmask.sum()),
        "symbols_unique": sorted(
            {
                s.split(":", 1)[1]
                for row in r["symbols"].fillna("")
                for s in str(row).split(";")
                if s.startswith("EGX:")
            }
        ),
    }
    SUMMARY.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2)[:4000])


if __name__ == "__main__":
    main()
