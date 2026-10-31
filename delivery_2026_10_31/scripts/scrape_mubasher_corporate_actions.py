# -*- coding: utf-8 -*-
"""Scrape Mubasher's EGX corporate-action and capital-increase APIs.

The public table pages are Angular templates; the JSON endpoints are:
  /api/1/corporate-actions?country=eg&start=...&size=...
  /api/1/capital-increase?country=eg&start=...&size=...
"""
from __future__ import annotations

import json
import re
import time
from pathlib import Path

import pandas as pd
import requests

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "deliverables_2026_10_31" / "data"
OUT.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept-Language": "ar,en;q=0.8",
    "Referer": "https://www.mubasher.info/countries/eg/corporate-action",
}
BASE = "https://www.mubasher.info"
MONTHS = {
    "يناير": 1, "فبراير": 2, "مارس": 3, "أبريل": 4, "ابريل": 4,
    "مايو": 5, "يونيو": 6, "يوليو": 7, "أغسطس": 8, "اغسطس": 8,
    "سبتمبر": 9, "أكتوبر": 10, "اكتوبر": 10, "نوفمبر": 11, "ديسمبر": 12,
}
DATE_RE = re.compile(r"(\d{1,2})\s+(\S+)\s+(\d{4})")


def parse_ar_date(s: object):
    if not isinstance(s, str):
        return pd.NaT
    m = DATE_RE.search(s.strip())
    if not m:
        return pd.NaT
    day, month_name, year = m.groups()
    month = MONTHS.get(month_name)
    if not month:
        return pd.NaT
    try:
        return pd.Timestamp(year=int(year), month=month, day=int(day))
    except ValueError:
        return pd.NaT


def fetch_all(endpoint: str, referer: str, size: int = 1000) -> list[dict]:
    rows: list[dict] = []
    start = 0
    pages = 1
    while start // size < pages:
        r = requests.get(
            BASE + endpoint,
            params={"country": "eg", "start": start, "size": size},
            headers={**HEADERS, "Referer": referer},
            timeout=60,
        )
        r.raise_for_status()
        j = r.json()
        chunk = j.get("rows", [])
        rows.extend(chunk)
        pages = int(j.get("numberOfPages") or 1)
        print(f"{endpoint} start={start} got={len(chunk)} pages={pages}", flush=True)
        if not chunk:
            break
        start += size
        time.sleep(0.25)
    return rows


def category(action_type: object, title: object = "", desc: object = "") -> str:
    t = " ".join(str(x) for x in [action_type, title, desc] if x)
    if "توزيع أرباح نقدية" in t or "أرباح نقدية" in t or "مقسومات نقدية" in t:
        return "dividend"
    if "أسهم منحة" in t or "أسهم مجانية" in t or "منحة" in t:
        return "bonus_shares"
    if "تجزئة" in t or "تقسيم" in t:
        return "split"
    if "زيادة رأس مال" in t:
        return "capital_increase"
    if "حق اكتتاب" in t or "اكتتاب" in t:
        return "rights"
    return "other"


def main() -> None:
    ca = fetch_all(
        "/api/1/corporate-actions",
        "https://www.mubasher.info/countries/eg/corporate-action",
    )
    ci = fetch_all(
        "/api/1/capital-increase",
        "https://www.mubasher.info/countries/eg/ipos/capital-increase",
    )
    (OUT / "mubasher_corporate_actions_raw_2026_10_31.json").write_text(
        json.dumps({"corporate_actions": ca, "capital_increase": ci}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    df = pd.DataFrame(ca)
    if not df.empty:
        df["symbol"] = df["url"].fillna("").str.extract(r"/stocks/([A-Z0-9]+)")[0]
        df["announced_date"] = df["announcedAt"].map(parse_ar_date)
        df["effective_date"] = df["effectiveFrom"].map(parse_ar_date)
        df["action_category"] = [
            category(t, ti, d) for t, ti, d in zip(df["type"], df["title"], df["description"])
        ]
        df["source"] = "mubasher"
        df["is_official"] = False
        df = df.sort_values(["effective_date", "symbol", "type"], na_position="last")
        df.to_csv(OUT / "mubasher_corporate_actions_2026_10_31.csv", index=False, encoding="utf-8-sig")
        print("corporate actions", len(df), "symbols", df.symbol.nunique())
        print("date range", df.effective_date.min(), df.effective_date.max())
        print(df.action_category.value_counts().to_string())
        print(df.type.value_counts().head(20).to_string())

    ci_df = pd.DataFrame(ci)
    if not ci_df.empty:
        ci_df["symbol"] = ci_df["url"].fillna("").str.extract(r"/stocks/([A-Z0-9]+)")[0]
        ci_df["start_date"] = ci_df["start"].map(parse_ar_date)
        ci_df["end_date"] = ci_df["end"].map(parse_ar_date)
        ci_df["source"] = "mubasher"
        ci_df["is_official"] = False
        ci_df.to_csv(OUT / "mubasher_capital_increase_2026_10_31.csv", index=False, encoding="utf-8-sig")
        print("capital increase", len(ci_df), "symbols", ci_df.symbol.nunique())
        print("date range", ci_df.start_date.min(), ci_df.start_date.max())
        print(ci_df.status.value_counts().to_string())

    print("wrote", OUT / "mubasher_corporate_actions_2026_10_31.csv")
    print("wrote", OUT / "mubasher_capital_increase_2026_10_31.csv")


if __name__ == "__main__":
    main()
