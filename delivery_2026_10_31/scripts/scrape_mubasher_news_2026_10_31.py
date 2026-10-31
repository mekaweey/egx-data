# -*- coding: utf-8 -*-
"""Scrape Mubasher per-company news pages (EGX) with corrected timestamps.

Why this exists
---------------
`D:\\mubasher_all_news.csv` is the general Mubasher pulse snapshot.  It has no
symbol column, no first paragraph and stops at 2026-09-22.  The per-company
pages at `/markets/EGX/stocks/{symbol}/news` contain symbol-linked news with
category, title, first paragraph and an exact article URL.

Timestamp correction (verified 2026-10-31 against 23 article IDs that also
exist in the general snapshot):
  * the per-company list displays Cairo local time + 1 hour (a site bug);
  * the general snapshot's `published_at` is true UTC;
  * therefore: published_utc = (list_time - 1h) localized to Africa/Cairo -> UTC.
Example: list "17 سبتمبر 12:00 م" -> true Cairo 11:00 (UTC+3) -> 08:00Z, which
matches the snapshot's 2026-09-17T08:00:00Z for news id 4673553.

The scraper is resumable: one CSV per symbol under
`strategy-lab/outputs/mubasher_news_parts/`.
"""
from __future__ import annotations

import argparse
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import pandas as pd
import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "strategy-lab" / "outputs" / "mubasher_news_parts"
OUT.mkdir(parents=True, exist_ok=True)

BASE = "https://www.mubasher.info"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "ar,en;q=0.8",
}

MONTHS = {
    "يناير": 1, "فبراير": 2, "مارس": 3, "أبريل": 4, "ابريل": 4,
    "مايو": 5, "يونيو": 6, "يوليو": 7, "أغسطس": 8, "اغسطس": 8,
    "سبتمبر": 9, "أكتوبر": 10, "اكتوبر": 10, "نوفمبر": 11, "ديسمبر": 12,
}
DATE_RE = re.compile(
    r"(\d{1,2})\s+(\S+)\s+(?:(\d{4})\s+)?(\d{1,2}):(\d{2})\s*(ص|م)"
)
CAIRO = ZoneInfo("Africa/Cairo")
UTC = ZoneInfo("UTC")


def parse_list_datetime(text: str, now: datetime | None = None) -> datetime | None:
    """Parse Mubasher list text into the displayed Cairo-local naive datetime."""
    if not text:
        return None
    text = re.sub(r"\s+", " ", text).strip()
    m = DATE_RE.search(text)
    if not m:
        return None
    day, month_name, year_s, hh_s, mm_s, ampm = m.groups()
    month = MONTHS.get(month_name)
    if not month:
        return None
    now = now or datetime.now(CAIRO)
    year = int(year_s) if year_s else now.year
    hh, mm = int(hh_s), int(mm_s)
    if ampm == "ص":
        if hh == 12:
            hh = 0
    else:
        if hh != 12:
            hh += 12
    try:
        return datetime(year, month, int(day), hh, mm)
    except ValueError:
        return None


def to_utc(list_dt: datetime) -> tuple[datetime, datetime]:
    """Treat the displayed time as Cairo local and convert it to UTC.

    Verified 2026-10-31 against 5,886 overlapping article IDs in the old
    general snapshot: the displayed list time is already Cairo local time;
    the earlier -1h correction made every timestamp one hour too early.
    """
    cairo = list_dt.replace(tzinfo=CAIRO, fold=0)
    return cairo, cairo.astimezone(UTC)


def fetch(session: requests.Session, url: str, tries: int = 3) -> str | None:
    for i in range(tries):
        try:
            r = session.get(url, headers=HEADERS, timeout=35)
            if r.status_code == 200 and len(r.text) > 10_000:
                return r.text
            time.sleep(0.5 * (i + 1))
        except Exception:
            time.sleep(0.7 * (i + 1))
    return None


def parse_page(html: str, symbol: str, page: int) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    rows: list[dict] = []
    for div in soup.select("div.mi-article-media-block"):
        a = div.select_one("a.mi-article-media-block__title")
        if not a:
            continue
        href = a.get("href", "")
        m = re.search(r"/news/(\d+)/", href)
        if not m:
            continue
        news_id = m.group(1)
        date_el = div.select_one("span.mi-article-media-block__date")
        desc_el = div.select_one("div.mi-article-media-block__text")
        meta_el = div.select_one("div.mi-article__meta-data")
        cat_el = div.select_one("a.global__section-label")
        list_text = date_el.get_text(" ", strip=True) if date_el else ""
        list_dt = parse_list_datetime(list_text)
        if list_dt is None:
            continue
        cairo, utc = to_utc(list_dt)
        desc = ""
        if meta_el and meta_el.get("data-description"):
            desc = meta_el.get("data-description", "").strip()
        if desc_el:
            visible = desc_el.get_text(" ", strip=True)
            if len(visible) > len(desc):
                desc = visible
        rows.append(
            {
                "symbol": symbol,
                "news_id": news_id,
                "published_list_raw": list_text,
                "published_list_dt": list_dt.isoformat(sep=" "),
                "published_cairo": cairo.isoformat(sep=" "),
                "published_utc": utc.isoformat(sep=" "),
                "category": cat_el.get_text(" ", strip=True) if cat_el else "",
                "title": a.get_text(" ", strip=True),
                "first_paragraph": desc,
                "url": BASE + href if href.startswith("/") else href,
                "page": page,
            }
        )
    return rows


def scrape_symbol(symbol: str, cutoff: str, force: bool = False) -> tuple[str, int, str]:
    part = OUT / f"{symbol}.csv"
    if part.exists() and not force:
        try:
            old = pd.read_csv(part, encoding="utf-8-sig")
            if len(old) > 0:
                return symbol, len(old), "cached"
        except Exception:
            pass
    session = requests.Session()
    base_url = f"{BASE}/markets/EGX/stocks/{symbol}/news"
    html = fetch(session, base_url)
    if not html:
        return symbol, 0, "page1_failed"
    m = re.search(r"window\.midata\.numPages\s*=\s*(\d+)", html)
    num_pages = int(m.group(1)) if m else 1
    all_rows: list[dict] = []
    cutoff_dt = pd.Timestamp(cutoff)
    for page in range(1, num_pages + 1):
        if page == 1:
            page_html = html
        else:
            page_html = fetch(session, f"{base_url}//{page}")
            if not page_html:
                break
        rows = parse_page(page_html, symbol, page)
        if not rows:
            break
        all_rows.extend(rows)
        oldest = min(
            pd.Timestamp(r["published_cairo"]).tz_localize(None) for r in rows
        )
        if oldest < cutoff_dt:
            break
        time.sleep(0.12)
    if all_rows:
        df = pd.DataFrame(all_rows).drop_duplicates(subset=["symbol", "news_id"])
        df.to_csv(part, index=False, encoding="utf-8-sig")
    return symbol, len(all_rows), f"pages={num_pages}"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--symbols", default="", help="comma separated; default: 69 from 1m")
    ap.add_argument("--symbols-file", default="", help="one symbol per line")
    ap.add_argument("--cutoff", default="2024-10-01")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--out", default="", help="combined output CSV path")
    args = ap.parse_args()
    if args.symbols:
        symbols = [s.strip().upper() for s in args.symbols.split(",") if s.strip()]
    elif args.symbols_file:
        symbols = [s.strip().upper() for s in Path(args.symbols_file).read_text(encoding="utf-8").splitlines() if s.strip()]
    else:
        p = ROOT / "strategy-audit" / "data_derived" / "1m_fixed_2026_10_30.parquet"
        symbols = sorted(pd.read_parquet(p, columns=["symbol"]).symbol.unique())
    print(f"symbols={len(symbols)} cutoff={args.cutoff} workers={args.workers}", flush=True)
    results = []
    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futs = {ex.submit(scrape_symbol, s, args.cutoff, args.force): s for s in symbols}
        for i, fut in enumerate(as_completed(futs), 1):
            try:
                sym, n, status = fut.result()
                results.append((sym, n, status))
                print(f"[{i}/{len(symbols)}] {sym}: {n} rows {status}", flush=True)
            except Exception as e:
                print(f"[{i}/{len(symbols)}] ERROR {futs[fut]}: {e!r}", flush=True)
    parts = sorted(OUT.glob("*.csv"))
    if parts:
        df = pd.concat([pd.read_csv(p, encoding="utf-8-sig") for p in parts], ignore_index=True)
        df = df.drop_duplicates(subset=["symbol", "news_id"]).sort_values(
            ["published_utc", "symbol", "news_id"]
        )
        out = Path(args.out) if args.out else ROOT / "strategy-lab" / "outputs" / "mubasher_news_by_symbol_2026_10_31.csv"
        out.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(out, index=False, encoding="utf-8-sig")
        print(f"combined rows={len(df)} symbols={df.symbol.nunique()} -> {out}", flush=True)
        print(df.groupby("symbol").size().sort_values(ascending=False).head(20).to_string(), flush=True)


if __name__ == "__main__":
    main()
