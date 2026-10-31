# -*- coding: utf-8 -*-
"""Scrape Mubasher's EGX market-announcement feed.

The official EGX disclosure site returns ERR_EMPTY_RESPONSE from this machine.
This feed is the closest usable substitute: it carries EGX market announcements
with a UTC publish timestamp, source, title and article URL.
"""
from __future__ import annotations

import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import pandas as pd
import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "deliverables_2026_10_31" / "data"
OUT.mkdir(parents=True, exist_ok=True)
BASE = "https://www.mubasher.info/news/eg/now/announcements"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept-Language": "ar,en;q=0.8",
}


def fetch(page: int) -> tuple[int, str | None]:
    url = BASE if page == 1 else f"{BASE}/{page}"
    for attempt in range(3):
        try:
            r = requests.get(url, headers=HEADERS, timeout=40)
            if r.status_code == 200 and len(r.text) > 10_000:
                return page, r.text
            time.sleep(0.5 * (attempt + 1))
        except Exception:
            time.sleep(0.7 * (attempt + 1))
    return page, None


def parse(page: int, html: str) -> list[dict]:
    s = BeautifulSoup(html, "html.parser")
    rows = []
    for item in s.select("div.mi-news-results--media-block__item"):
        a = item.select_one("a[href*='/news/']")
        if not a:
            continue
        href = a.get("href", "")
        m = re.search(r"/news/(\d+)/", href)
        if not m:
            continue
        date_el = item.select_one(".mi-announcement__date")
        src_el = item.select_one(".mi-announcement__source")
        rows.append(
            {
                "page": page,
                "news_id": m.group(1),
                "published_utc": date_el.get("data-publish-date") if date_el else None,
                "source": src_el.get_text(" ", strip=True) if src_el else "",
                "title": a.get_text(" ", strip=True),
                "url": "https://www.mubasher.info" + href if href.startswith("/") else href,
            }
        )
    return rows


def main() -> None:
    # Read the declared page count from page 1.
    _, first = fetch(1)
    if not first:
        raise SystemExit("page 1 failed")
    m = re.search(r"numPages\s*=\s*(\d+)", first)
    pages = int(m.group(1)) if m else 1
    print("pages", pages, flush=True)

    all_rows = parse(1, first)
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = {ex.submit(fetch, p): p for p in range(2, pages + 1)}
        for i, fut in enumerate(as_completed(futs), 2):
            p, html = fut.result()
            if html:
                all_rows.extend(parse(p, html))
            if i % 20 == 0:
                print(f"fetched {i}/{pages} rows={len(all_rows):,}", flush=True)

    df = pd.DataFrame(all_rows)
    df = df.drop_duplicates("news_id").sort_values("published_utc")
    df.to_csv(OUT / "mubasher_market_announcements_2026_10_31.csv", index=False, encoding="utf-8-sig")
    print("rows", len(df), "date", df.published_utc.min(), df.published_utc.max())
    print(df.source.value_counts().head(10).to_string())
    print("wrote", OUT / "mubasher_market_announcements_2026_10_31.csv")


if __name__ == "__main__":
    main()
