# -*- coding: utf-8 -*-
"""Scrape Mubasher EGX stock-news pulse pages 1..N (cards only).

The pulse page is server-rendered. Each card is a `div.mi-article-media-block`
with a date, title link, first paragraph and optional image. This script saves
one row per card and is safe to re-run (it overwrites the output).
"""
from __future__ import annotations

import csv
import re
import time
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "pulse_news_2026_10_31"
OUT.mkdir(parents=True, exist_ok=True)
CARDS = OUT / "pulse_cards_pages_1_222.csv"

BASE = "https://www.mubasher.info/news/eg/pulse/stocks//{page}"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "ar,en;q=0.8",
}


def clean(s: str | None) -> str:
    if not s:
        return ""
    return re.sub(r"\s+", " ", s).strip()


def main() -> None:
    session = requests.Session()
    session.headers.update(HEADERS)
    rows: list[dict] = []
    for page in range(1, 223):
        url = BASE.format(page=page)
        for attempt in range(3):
            try:
                r = session.get(url, timeout=30)
                if r.status_code == 200:
                    break
                time.sleep(1.5 * (attempt + 1))
            except Exception:
                time.sleep(1.5 * (attempt + 1))
        else:
            print(f"page {page}: FAILED")
            continue
        soup = BeautifulSoup(r.text, "html.parser")
        blocks = soup.select("div.mi-article-media-block")
        for rank, b in enumerate(blocks, 1):
            date_el = b.select_one(".mi-article-media-block__date")
            title_el = b.select_one("a.mi-article-media-block__title")
            text_el = b.select_one(".mi-article-media-block__text")
            img_el = b.select_one("img")
            href = title_el.get("href", "") if title_el else ""
            if href:
                href = urljoin("https://www.mubasher.info", href)
            m = re.search(r"/news/(\d+)/", href)
            rows.append(
                {
                    "page": page,
                    "rank": rank,
                    "article_id": m.group(1) if m else "",
                    "date_text": clean(date_el.get_text(" ", strip=True) if date_el else ""),
                    "title": clean(title_el.get_text(" ", strip=True) if title_el else ""),
                    "url": href,
                    "first_paragraph": clean(text_el.get_text(" ", strip=True) if text_el else ""),
                    "image": img_el.get("src", "") if img_el else "",
                }
            )
        if page % 20 == 0 or page == 1:
            print(f"page {page}: {len(blocks)} cards, total {len(rows)}")
        time.sleep(0.12)

    # de-duplicate by article id while keeping the first (highest) page/rank
    seen: set[str] = set()
    unique: list[dict] = []
    for row in rows:
        key = row["article_id"] or row["url"]
        if key in seen:
            continue
        seen.add(key)
        unique.append(row)

    with CARDS.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(unique[0].keys()))
        w.writeheader()
        w.writerows(unique)

    print(f"cards: {len(rows)} raw, {len(unique)} unique")
    print(f"first: {unique[0] if unique else None}")
    print(f"last: {unique[-1] if unique else None}")


if __name__ == "__main__":
    main()
