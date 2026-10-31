# -*- coding: utf-8 -*-
"""Rebuild all Mubasher news timestamps from the displayed Cairo-local time.

The first scraper version subtracted one hour before localizing to Africa/Cairo.
The old general snapshot shows that was wrong: 5,886 overlapping IDs match
exactly when the displayed time is treated as Cairo local.  This script
recomputes the parts, the combined delivery file, and the legacy combined file.
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
PARTS = ROOT / "strategy-lab" / "outputs" / "mubasher_news_parts"
OUT_DELIVERY = ROOT / "deliverables_2026_10_31" / "news" / "mubasher_news_full_2026_10_31.csv"
OUT_LEGACY = ROOT / "strategy-lab" / "outputs" / "mubasher_news_by_symbol_2026_10_31.csv"


def fix_part(path: Path) -> int:
    df = pd.read_csv(path, encoding="utf-8-sig")
    if df.empty:
        return 0
    naive = pd.to_datetime(df["published_list_dt"], errors="coerce")
    # Ambiguous/nonexistent wall times are rare; choose the DST/first fold and
    # shift nonexistent times forward, which is the normal zoneinfo behaviour.
    cairo = naive.dt.tz_localize("Africa/Cairo", ambiguous=True, nonexistent="shift_forward")
    utc = cairo.dt.tz_convert("UTC")
    df["published_cairo"] = cairo.dt.strftime("%Y-%m-%d %H:%M:%S%z")
    df["published_utc"] = utc.dt.strftime("%Y-%m-%d %H:%M:%S+00:00")
    df = df.drop_duplicates(subset=["symbol", "news_id"])
    df.to_csv(path, index=False, encoding="utf-8-sig")
    return len(df)


def main() -> None:
    parts = sorted(PARTS.glob("*.csv"))
    total = 0
    for i, p in enumerate(parts, 1):
        n = fix_part(p)
        total += n
        if i % 50 == 0 or i == len(parts):
            print(f"fixed {i}/{len(parts)} parts, rows={total:,}", flush=True)

    frames = [pd.read_csv(p, encoding="utf-8-sig") for p in parts]
    df = pd.concat(frames, ignore_index=True)
    df = df.drop_duplicates(subset=["symbol", "news_id"]).sort_values(
        ["published_utc", "symbol", "news_id"]
    )
    OUT_DELIVERY.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT_DELIVERY, index=False, encoding="utf-8-sig")
    df.to_csv(OUT_LEGACY, index=False, encoding="utf-8-sig")
    print(f"combined rows={len(df):,} symbols={df.symbol.nunique()}")
    print("utc range", df.published_utc.min(), df.published_utc.max())
    print("null utc", int(df.published_utc.isna().sum()))
    print("wrote", OUT_DELIVERY)
    print("wrote", OUT_LEGACY)


if __name__ == "__main__":
    main()
