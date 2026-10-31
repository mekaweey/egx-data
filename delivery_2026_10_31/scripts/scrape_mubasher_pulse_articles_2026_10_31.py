# -*- coding: utf-8 -*-
"""Scrape full Mubasher pulse articles (pages 1..221) with symbols and exact time.

Reads `pulse_cards_pages_1_222.csv`, fetches each article page, and writes a
resumable JSONL cache plus final CSV/JSONL files. The article page contains the
full body, the localized Cairo publication time, the section/source labels and
the linked EGX symbols.

Usage:
    python scrape_mubasher_pulse_articles_2026_10_31.py --workers 6
    python scrape_mubasher_pulse_articles_2026_10_31.py --limit 20 --workers 4
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "pulse_news_2026_10_31"
CARDS = OUT / "pulse_cards_pages_1_222.csv"
CACHE = OUT / "pulse_articles_cache.jsonl"
FINAL_CSV = OUT / "pulse_articles_full.csv"
FINAL_JSONL = OUT / "pulse_articles_full.jsonl"
LINKS_CSV = OUT / "pulse_article_symbols.csv"
ERRORS = OUT / "pulse_article_errors.csv"
LOG = OUT / "articles_scrape.log"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "ar,en;q=0.8",
}

AR_MONTHS = {
    "يناير": 1,
    "فبراير": 2,
    "مارس": 3,
    "أبريل": 4,
    "ابريل": 4,
    "إبريل": 4,
    "مايو": 5,
    "يونيو": 6,
    "يوليو": 7,
    "أغسطس": 8,
    "اغسطس": 8,
    "سبتمبر": 9,
    "أكتوبر": 10,
    "اكتوبر": 10,
    "نوفمبر": 11,
    "ديسمبر": 12,
}

DATE_RE = re.compile(
    r"(\d{1,2})\s+([^\s]+)\s+(\d{4})\s+(\d{1,2}):(\d{2})\s*([صم])"
)

_print_lock = threading.Lock()
_write_lock = threading.Lock()


def log(msg: str) -> None:
    with _print_lock:
        line = f"{datetime.now().strftime('%H:%M:%S')} {msg}"
        print(line, flush=True)
        with LOG.open("a", encoding="utf-8") as f:
            f.write(line + "\n")


def clean(s: str | None) -> str:
    if not s:
        return ""
    return re.sub(r"\s+", " ", s).strip()


def parse_ar_date(text: str) -> tuple[datetime | None, str]:
    """Return (naive Cairo local datetime, ISO with Cairo offset) from Arabic text."""
    m = DATE_RE.search(text or "")
    if not m:
        return None, ""
    day, month_name, year, hour, minute, ampm = m.groups()
    month = AR_MONTHS.get(month_name)
    if not month:
        return None, ""
    h = int(hour)
    if ampm == "م" and h != 12:
        h += 12
    if ampm == "ص" and h == 12:
        h = 0
    try:
        naive = datetime(int(year), month, int(day), h, int(minute))
        aware = naive.replace(tzinfo=ZoneInfo("Africa/Cairo"))
        return naive, aware.isoformat()
    except Exception:
        return None, ""


def to_utc(naive: datetime | None) -> str:
    if naive is None:
        return ""
    try:
        aware = naive.replace(tzinfo=ZoneInfo("Africa/Cairo"))
        return aware.astimezone(timezone.utc).isoformat()
    except Exception:
        return ""


def get_session() -> requests.Session:
    s = requests.Session()
    s.headers.update(HEADERS)
    return s


def parse_article(html: str, url: str, page: int, rank: int, card: dict) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    article_id = card.get("article_id", "")
    if not article_id:
        m = re.search(r"/news/(\d+)/", url)
        article_id = m.group(1) if m else ""

    title = ""
    h1 = soup.select_one("h1")
    if h1:
        title = clean(h1.get_text(" ", strip=True))
    if not title:
        og = soup.select_one('meta[property="og:title"]')
        title = clean(og.get("content")) if og else ""

    published_text = ""
    t = soup.select_one('time[itemprop="datePublished"]')
    if t:
        published_text = clean(t.get_text(" ", strip=True))
    if not published_text:
        p = soup.select_one(".mi-article__published-at")
        published_text = clean(p.get_text(" ", strip=True)) if p else ""
    naive, cairo_iso = parse_ar_date(published_text)

    # Category / source
    category = ""
    labels = soup.select_one(".mi-article__labels_padding")
    if labels:
        # First anchor is the main section; source is after "المصدر"
        a = labels.select_one("a")
        if a:
            category = clean(a.get_text(" ", strip=True))
        if not category:
            txt = clean(labels.get_text(" ", strip=True))
            category = txt.split("المصدر")[0].strip(" :-")
    source = ""
    if labels:
        txt = clean(labels.get_text(" ", strip=True))
        m = re.search(r"المصدر\s*:?\s*(.+)$", txt)
        if m:
            source = clean(m.group(1))

    # Symbols: all market links in the stock block (EGX and others).
    # Extract BEFORE cleaning the body, because the stock block sits inside it.
    symbols: list[dict] = []
    seen_sym: set[tuple[str, str]] = set()
    for a in soup.select('.mi-article__stocks a[href*="/markets/"]'):
        href = a.get("href", "")
        m = re.search(r"/markets/([A-Za-z]+)/stocks/([^/?#]+)", href)
        if not m:
            continue
        market, ticker = m.group(1).upper(), m.group(2)
        if (market, ticker) in seen_sym:
            continue
        seen_sym.add((market, ticker))
        name = clean(a.get_text(" ", strip=True))
        # Remove the trailing ticker from the display name when present
        name = re.sub(rf"\s*{re.escape(ticker)}\s*$", "", name).strip()
        symbols.append(
            {
                "market": market,
                "ticker": ticker,
                "name": name,
                "href": urljoin("https://www.mubasher.info", href),
            }
        )

    # Full body
    body = soup.select_one(".mi-article__content") or soup.select_one(
        '[itemprop="articleBody"]'
    )
    has_subscription_timer = bool(
        soup.select_one(".mi-article__article-needs-subscription-timer")
    )
    full_text = ""
    if body:
        for bad in body.select(
            ".mi-article__stocks, .mi-article__attachments, "
            ".mi-article__article-needs-subscription-timer, .mi-article-chart, "
            ".stock-price-block, script, style, noscript"
        ):
            bad.decompose()
        parts: list[str] = []
        for el in body.select("p, h2, h3, h4, li"):
            txt = clean(el.get_text(" ", strip=True))
            if txt and txt not in parts:
                parts.append(txt)
        full_text = "\n".join(parts).strip()
        if len(full_text) < 80:
            full_text = clean(body.get_text("\n", strip=True))

    # The subscription timer is present in the page template even when the
    # article body is fully rendered. Treat it as a real paywall only when the
    # extracted text is implausibly short.
    paywall = bool(has_subscription_timer and len(full_text) < 200)

    summary = ""
    for sel in ['meta[name="description"]', 'meta[property="og:description"]']:
        m = soup.select_one(sel)
        if m and m.get("content"):
            summary = clean(m.get("content"))
            break

    # Attachments
    attachments: list[dict] = []
    for a in soup.select(".mi-article__attachments a[href]"):
        href = urljoin("https://www.mubasher.info", a.get("href", ""))
        attachments.append({"url": href, "text": clean(a.get_text(" ", strip=True))})

    # Image
    image = ""
    ogimg = soup.select_one('meta[property="og:image"]')
    if ogimg:
        image = ogimg.get("content", "")

    return {
        "article_id": article_id,
        "page": page,
        "rank": rank,
        "url": url,
        "title": title,
        "published_text": published_text,
        "published_cairo": naive.isoformat() if naive else "",
        "published_cairo_tz": cairo_iso,
        "published_utc": to_utc(naive),
        "category": category,
        "source": source,
        "summary": summary,
        "full_text": full_text,
        "text_length": len(full_text),
        "paywall_flag": paywall,
        "has_subscription_timer": has_subscription_timer,
        "symbols": symbols,
        "attachments": attachments,
        "image": image,
        "first_paragraph": card.get("first_paragraph", ""),
        "date_text_card": card.get("date_text", ""),
    }


def fetch_one(session: requests.Session, card: dict) -> dict:
    url = card["url"]
    last_err = ""
    for attempt in range(4):
        try:
            r = session.get(url, timeout=35)
            if r.status_code == 200:
                return parse_article(
                    r.text, url, int(card["page"]), int(card["rank"]), card
                )
            last_err = f"HTTP {r.status_code}"
            if r.status_code in (429, 500, 502, 503, 504):
                time.sleep(1.2 * (attempt + 1))
                continue
            break
        except Exception as e:
            last_err = f"{type(e).__name__}: {e}"
            time.sleep(1.0 * (attempt + 1))
    return {
        "article_id": card.get("article_id", ""),
        "page": int(card["page"]),
        "rank": int(card["rank"]),
        "url": url,
        "error": last_err,
        "title": card.get("title", ""),
        "date_text_card": card.get("date_text", ""),
    }


def load_cache() -> dict[str, dict]:
    cache: dict[str, dict] = {}
    if CACHE.exists():
        with CACHE.open(encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except Exception:
                    continue
                key = obj.get("article_id") or obj.get("url")
                if key:
                    cache[key] = obj
    return cache


def write_jsonl(obj: dict) -> None:
    with _write_lock:
        with CACHE.open("a", encoding="utf-8") as f:
            f.write(json.dumps(obj, ensure_ascii=False) + "\n")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--start-page", type=int, default=1)
    ap.add_argument("--end-page", type=int, default=221)
    args = ap.parse_args()

    OUT.mkdir(parents=True, exist_ok=True)
    cards: list[dict] = []
    with CARDS.open(encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            page = int(row["page"])
            if args.start_page <= page <= args.end_page:
                cards.append(row)
    if args.limit:
        cards = cards[: args.limit]

    cache = load_cache()
    todo = [
        c
        for c in cards
        if (c.get("article_id") or c.get("url")) not in cache
    ]
    log(
        f"cards={len(cards)} cached={len(cards)-len(todo)} todo={len(todo)} "
        f"workers={args.workers} pages={args.start_page}..{args.end_page}"
    )

    if not todo:
        log("nothing to fetch")
    else:
        sessions = [get_session() for _ in range(max(1, args.workers))]
        with ThreadPoolExecutor(max_workers=max(1, args.workers)) as ex:
            futs = {
                ex.submit(fetch_one, sessions[i % len(sessions)], c): c
                for i, c in enumerate(todo)
            }
            done = 0
            for fut in as_completed(futs):
                card = futs[fut]
                try:
                    obj = fut.result()
                except Exception as e:
                    obj = {
                        "article_id": card.get("article_id", ""),
                        "page": int(card["page"]),
                        "rank": int(card["rank"]),
                        "url": card.get("url", ""),
                        "error": f"future: {e}",
                        "title": card.get("title", ""),
                        "date_text_card": card.get("date_text", ""),
                    }
                write_jsonl(obj)
                done += 1
                if done % 50 == 0 or done == len(todo):
                    ok = sum(1 for o in cache.values() if not o.get("error"))
                    log(f"done {done}/{len(todo)} (cache {len(cache)+done})")

    # Build final outputs from cache
    cache = load_cache()
    rows: list[dict] = []
    links: list[dict] = []
    errors: list[dict] = []
    for obj in cache.values():
        if obj.get("error"):
            errors.append(obj)
            continue
        row = {
            "article_id": obj.get("article_id", ""),
            "page": obj.get("page", ""),
            "rank": obj.get("rank", ""),
            "published_cairo": obj.get("published_cairo", ""),
            "published_cairo_tz": obj.get("published_cairo_tz", ""),
            "published_utc": obj.get("published_utc", ""),
            "published_text": obj.get("published_text", ""),
            "date_text_card": obj.get("date_text_card", ""),
            "title": obj.get("title", ""),
            "category": obj.get("category", ""),
            "source": obj.get("source", ""),
            "url": obj.get("url", ""),
            "first_paragraph": obj.get("first_paragraph", ""),
            "summary": obj.get("summary", ""),
            "full_text": obj.get("full_text", ""),
            "text_length": obj.get("text_length", 0),
            "paywall_flag": obj.get("paywall_flag", False),
            "has_subscription_timer": obj.get("has_subscription_timer", False),
            "symbols": ";".join(
                f"{s['market']}:{s['ticker']}" for s in obj.get("symbols", [])
            ),
            "symbol_names": ";".join(
                f"{s['market']}:{s['ticker']}={s['name']}"
                for s in obj.get("symbols", [])
            ),
            "attachment_count": len(obj.get("attachments", [])),
            "attachments": ";".join(
                a.get("url", "") for a in obj.get("attachments", [])
            ),
            "image": obj.get("image", ""),
        }
        rows.append(row)
        for s in obj.get("symbols", []):
            links.append(
                {
                    "article_id": obj.get("article_id", ""),
                    "published_cairo": obj.get("published_cairo", ""),
                    "page": obj.get("page", ""),
                    "market": s.get("market", ""),
                    "ticker": s.get("ticker", ""),
                    "name": s.get("name", ""),
                    "href": s.get("href", ""),
                    "title": obj.get("title", ""),
                    "url": obj.get("url", ""),
                }
            )

    rows.sort(key=lambda r: (str(r["published_cairo"]), str(r["article_id"])), reverse=True)
    fields = list(rows[0].keys()) if rows else []
    with FINAL_CSV.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    with FINAL_JSONL.open("w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    with LINKS_CSV.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "article_id",
                "published_cairo",
                "page",
                "market",
                "ticker",
                "name",
                "href",
                "title",
                "url",
            ],
        )
        w.writeheader()
        w.writerows(links)
    with ERRORS.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "article_id",
                "page",
                "rank",
                "url",
                "error",
                "title",
                "date_text_card",
            ],
            extrasaction="ignore",
        )
        w.writeheader()
        w.writerows(errors)

    log(
        f"final rows={len(rows)} links={len(links)} errors={len(errors)} "
        f"paywall={sum(1 for r in rows if r['paywall_flag'])}"
    )
    if rows:
        log(f"newest={rows[0]['published_cairo']} {rows[0]['title'][:80]}")
        log(f"oldest={rows[-1]['published_cairo']} {rows[-1]['title'][:80]}")


if __name__ == "__main__":
    main()
