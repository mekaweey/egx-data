# -*- coding: utf-8 -*-
"""Scrape Mubasher's EGX earnings and insider-trade tables."""
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
}
MONTHS = {
    "يناير": 1, "فبراير": 2, "مارس": 3, "أبريل": 4, "ابريل": 4,
    "مايو": 5, "يونيو": 6, "يوليو": 7, "أغسطس": 8, "اغسطس": 8,
    "سبتمبر": 9, "أكتوبر": 10, "اكتوبر": 10, "نوفمبر": 11, "ديسمبر": 12,
}
DATE_RE = re.compile(r"(\d{1,2})\s+(\S+)\s+(\d{4})")


def parse_ar_date(s: object):
    if not isinstance(s, str):
        return pd.NaT
    m = DATE_RE.search(s)
    if not m:
        return pd.NaT
    day, mon, year = m.groups()
    month = MONTHS.get(mon)
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
            "https://www.mubasher.info" + endpoint,
            params={"country": "eg", "start": start, "size": size},
            headers={**HEADERS, "Referer": referer},
            timeout=60,
        )
        if r.status_code != 200:
            print(f"{endpoint} STOP at start={start}: HTTP {r.status_code}", flush=True)
            break
        j = r.json()
        chunk = j.get("rows", [])
        rows.extend(chunk)
        pages = int(j.get("numberOfPages") or 1)
        print(f"{endpoint} start={start} got={len(chunk)} pages={pages}", flush=True)
        if not chunk:
            break
        start += size
        time.sleep(0.2)
    return rows


def main() -> None:
    earnings = fetch_all("/api/1/earnings", "https://www.mubasher.info/countries/eg/earnings", size=500)
    insider = fetch_all("/api/1/insider-trades", "https://www.mubasher.info/countries/eg/insider-trades", size=500)
    (OUT / "mubasher_earnings_insider_raw_2026_10_31.json").write_text(
        json.dumps({"earnings": earnings, "insider_trades": insider}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    e = pd.DataFrame(earnings)
    if not e.empty:
        e["symbol"] = e["url"].fillna("").str.extract(r"/stocks/([A-Z0-9]+)")[0]
        e.to_csv(OUT / "mubasher_earnings_2026_10_31.csv", index=False, encoding="utf-8-sig")
        print("earnings", len(e), "symbols", e.symbol.nunique())
        print(e.year.value_counts().head(10).to_string())

    i = pd.DataFrame(insider)
    if not i.empty:
        i["symbol"] = i["url"].fillna("").str.extract(r"/stocks/([A-Z0-9]+)")[0]
        i["date"] = i["updatedAt"].map(parse_ar_date)
        i["value"] = i["volume"] * i["price"]
        i["side"] = i["type"].map({"شراء": "buy", "بيع": "sell"}).fillna(i["type"])
        i = i.sort_values(["date", "symbol"], ascending=[False, True])
        i.to_csv(OUT / "mubasher_insider_trades_2026_10_31.csv", index=False, encoding="utf-8-sig")
        print("insider", len(i), "symbols", i.symbol.nunique())
        print("date range", i.date.min(), i.date.max())
        print(i.side.value_counts().to_string())

    print("wrote", OUT / "mubasher_earnings_2026_10_31.csv")
    print("wrote", OUT / "mubasher_insider_trades_2026_10_31.csv")


if __name__ == "__main__":
    main()
