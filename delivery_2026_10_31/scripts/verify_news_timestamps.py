# -*- coding: utf-8 -*-
"""Verify the per-company Mubasher news timestamps against the old general snapshot."""
from __future__ import annotations

from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "deliverables_2026_10_31"
NEWS = OUT / "news" / "mubasher_news_full_2026_10_31.csv"
OLD = Path(r"D:\mubasher_all_news.csv")
VER = OUT / "news" / "verification_vs_old_snapshot_2026_10_31.csv"


def norm(s: object) -> str:
    return " ".join(str(s).split()) if pd.notna(s) else ""


def main() -> None:
    new = pd.read_csv(NEWS)
    old = pd.read_csv(OLD)
    new["published_utc"] = pd.to_datetime(new["published_utc"], utc=True, errors="coerce")
    old["published_at"] = pd.to_datetime(old["published_at"], utc=True, errors="coerce")
    old = old.rename(columns={"id": "news_id"})
    old = old.drop_duplicates("news_id")
    new = new.drop_duplicates("news_id")
    m = old.merge(
        new[["news_id", "published_utc", "title", "url", "symbol"]],
        on="news_id",
        how="left",
        suffixes=("_old", "_new"),
    )
    m["diff_hours"] = (m["published_utc"] - m["published_at"]).dt.total_seconds() / 3600.0
    m["same_title"] = [norm(a) == norm(b) for a, b in zip(m["title_old"], m["title_new"])]
    m["same_url"] = [norm(a) == norm(b) for a, b in zip(m["url_old"], m["url_new"])]
    m.to_csv(VER, index=False, encoding="utf-8-sig")

    matched = m["published_utc"].notna()
    print("old rows", len(old))
    print("new rows", len(new))
    print("old ids found in new", int(matched.sum()))
    print("old ids missing from new", int((~matched).sum()))
    print("timestamp exact (0h)", int((m.loc[matched, "diff_hours"].abs() < 1e-9).sum()))
    print("timestamp within 1h", int((m.loc[matched, "diff_hours"].abs() <= 1.0).sum()))
    print("max abs diff hours", float(m.loc[matched, "diff_hours"].abs().max()))
    print("same title", int(m.loc[matched, "same_title"].sum()))
    print("same url", int(m.loc[matched, "same_url"].sum()))
    print("diff distribution")
    print(m.loc[matched, "diff_hours"].round(3).value_counts().head(10).to_string())
    print("wrote", VER)


if __name__ == "__main__":
    main()
