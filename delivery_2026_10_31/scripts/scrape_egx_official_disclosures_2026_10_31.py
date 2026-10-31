# -*- coding: utf-8 -*-
"""Scrape official EGX disclosures/news from the public beta.egx.com.eg BFF API.

The old www.egx.com.eg pages are blocked from this machine, but the public
beta site exposes the same news archive through a JSON endpoint:
  POST https://beta.egx.com.eg/api/bff/egx/news-search

The archive is paginated and accepts dateFrom/dateTo (YYYY-MM-DD).  We scrape
month by month, save raw JSON per month, then build one CSV.

This is a data-collection script.  It does not install a scheduler and does not
place any orders.
"""
from __future__ import annotations

import argparse
import csv
import html
import json
import re
import time
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "deliverables_2026_10_31" / "data" / "egx_official"
RAW = OUT / "raw"
API = "https://beta.egx.com.eg/api/bff/egx/news-search"
CAIRO = ZoneInfo("Africa/Cairo")
UTC = ZoneInfo("UTC")

# Disclosure + members + listing categories.  secId 9 is the live market
# session feed and is deliberately excluded.
SEC_IDS = [3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 16]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept": "application/json",
    "Content-Type": "application/json",
    "x-egx-bff-request": "1",
    "Origin": "https://beta.egx.com.eg",
    "Referer": "https://beta.egx.com.eg/en/media-center?tab=disclosure",
    "Accept-Language": "en,ar;q=0.8",
}

MONTH_NAMES = {
    1: "January", 2: "February", 3: "March", 4: "April", 5: "May", 6: "June",
    7: "July", 8: "August", 9: "September", 10: "October", 11: "November",
    12: "December",
}


def month_iter(start: str, end: str):
    y, m = map(int, start.split("-"))
    ey, em = map(int, end.split("-"))
    while (y, m) <= (ey, em):
        yield y, m
        m += 1
        if m == 13:
            y += 1
            m = 1


def last_day(y: int, m: int) -> int:
    if m == 12:
        return 31
    return (date(y, m + 1, 1) - date(y, m, 1)).days


def text_of(value: str | None) -> str:
    if not value:
        return ""
    return BeautifulSoup(value, "html.parser").get_text(" ", strip=True)


def links_of(value: str | None) -> list[str]:
    if not value:
        return []
    soup = BeautifulSoup(value, "html.parser")
    out = []
    for a in soup.find_all("a", href=True):
        href = html.unescape(a["href"]).strip()
        if href and href not in out:
            out.append(href)
    return out


def post_json(session: requests.Session, payload: dict, retries: int, sleep: float) -> dict:
    last = None
    for attempt in range(1, retries + 1):
        try:
            r = session.post(API, headers=HEADERS, json=payload, timeout=90)
            if r.status_code == 200 and r.text.lstrip().startswith("{"):
                return r.json()
            last = f"http_{r.status_code}: {r.text[:180]}"
        except Exception as exc:  # noqa: BLE001
            last = repr(exc)[:200]
        time.sleep(sleep * attempt * 2)
    raise RuntimeError(f"request failed after {retries} tries: {last}")


def scrape_month(session: requests.Session, y: int, m: int, sleep: float, retries: int) -> tuple[list[dict], dict]:
    payload = {
        "marketSessionNews": False,
        "secIds": SEC_IDS,
        "interval": 100,
        "pageNumber": 1,
        "pageSize": 100,
        "count": 100,
        "dateFrom": f"{y:04d}-{m:02d}-01",
        "dateTo": f"{y:04d}-{m:02d}-{last_day(y, m):02d}",
    }
    first = post_json(session, payload, retries, sleep)
    if not first.get("success"):
        raise RuntimeError(f"API failure: {first.get('message')}")
    pages = int(first.get("totalPages") or 1)
    items: list[dict] = list(first.get("data") or [])
    for page in range(2, pages + 1):
        payload["pageNumber"] = page
        j = post_json(session, payload, retries, sleep)
        if not j.get("success"):
            raise RuntimeError(f"API failure page {page}: {j.get('message')}")
        items.extend(j.get("data") or [])
        time.sleep(sleep)
    # Deduplicate by code, preserving first occurrence.
    seen = set()
    unique = []
    for item in items:
        code = item.get("code")
        if code in seen:
            continue
        seen.add(code)
        unique.append(item)
    meta = {
        "year": y,
        "month": m,
        "date_from": payload["dateFrom"],
        "date_to": payload["dateTo"],
        "total_count": first.get("totalCount"),
        "total_pages": pages,
        "scraped_rows": len(unique),
        "scraped_at_utc": datetime.now(UTC).isoformat(timespec="seconds"),
    }
    return unique, meta


def split_company_names(first: str, second: str) -> tuple[str, str]:
    """Return (Arabic, English) regardless of which API field holds which.

    The beta API is inconsistent: for some rows companyName is English and
    companyNameArabic is Arabic, for others the two fields are reversed.
    Script detection is therefore safer than trusting the field names.
    """
    first = (first or "").strip()
    second = (second or "").strip()
    arabic_re = re.compile(r"[\u0600-\u06FF]")
    first_ar = bool(arabic_re.search(first))
    second_ar = bool(arabic_re.search(second))
    if first_ar and not second_ar:
        return first, second
    if second_ar and not first_ar:
        return second, first
    # Both or neither contain Arabic: keep the documented field order.
    return second, first


def parse_item(item: dict) -> dict:
    content = item.get("content") or ""
    content_ar = item.get("contentArabic") or ""
    heading = item.get("heading") or ""
    heading_ar = item.get("headingArabic") or ""
    all_text = " ".join([heading, content, heading_ar, content_ar])
    m = re.search(r"\b([A-Z0-9]{2,8})\.CA\b", all_text)
    reuters = m.group(1) if m else ""
    stamp = item.get("dateStamp") or ""
    published_cairo = ""
    published_utc = ""
    if stamp:
        try:
            dt = datetime.fromisoformat(stamp)
            cairo = dt.replace(tzinfo=CAIRO)
            published_cairo = cairo.isoformat(timespec="seconds")
            published_utc = cairo.astimezone(UTC).isoformat(timespec="seconds")
        except ValueError:
            published_cairo = stamp
    links = links_of(content) + [x for x in links_of(content_ar) if x not in links_of(content)]
    beta_links = [
        "https://beta.egx.com.eg" + x if x.startswith("/") else x
        for x in links
    ]
    company_ar, company_en = split_company_names(
        item.get("companyName"), item.get("companyNameArabic")
    )
    return {
        "code": item.get("code"),
        "published_cairo": published_cairo,
        "published_utc": published_utc,
        "date_stamp_raw": stamp,
        "heading": heading,
        "heading_arabic": heading_ar,
        "section": (item.get("section") or "").strip(),
        "section_arabic": (item.get("sectionArabic") or "").strip(),
        "sec_id": item.get("secId"),
        "material": item.get("material"),
        "egx": item.get("egx"),
        "isin": item.get("isin") or "",
        "company_name_ar": company_ar,
        "company_name_en": company_en,
        "sector_id": item.get("sectorId"),
        "reuters_code": reuters,
        "content_html": content,
        "content_arabic_html": content_ar,
        "content_text": text_of(content),
        "content_arabic_text": text_of(content_ar),
        "attachment_links": " | ".join(links),
        "attachment_urls_beta": " | ".join(beta_links),
        "attachments_json": json.dumps(item.get("attachments") or [], ensure_ascii=False),
        "url": f"https://beta.egx.com.eg/en/news/{item.get('code')}",
        "url_ar": f"https://beta.egx.com.eg/ar/news/{item.get('code')}",
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--start", default="2022-01")
    ap.add_argument("--end", default="2026-10")
    ap.add_argument("--sleep", type=float, default=0.55)
    ap.add_argument("--retries", type=int, default=6)
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    OUT.mkdir(parents=True, exist_ok=True)
    RAW.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers.update(HEADERS)

    all_items: list[dict] = []
    missing: list[str] = []
    for y, m in month_iter(args.start, args.end):
        path = RAW / f"egx_official_{y:04d}_{m:02d}.json"
        if path.exists() and not args.force:
            j = json.loads(path.read_text(encoding="utf-8"))
            items = j.get("data") or []
            print(f"[skip] {y}-{m:02d} rows={len(items)}", flush=True)
        else:
            print(f"[fetch] {y}-{m:02d} ...", flush=True)
            try:
                items, meta = scrape_month(session, y, m, args.sleep, args.retries)
                path.write_text(
                    json.dumps({"meta": meta, "data": items}, ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )
                print(f"[ok] {y}-{m:02d} rows={len(items)} pages={meta['total_pages']}", flush=True)
            except Exception as exc:  # noqa: BLE001
                print(f"[fail] {y}-{m:02d}: {exc}", flush=True)
                missing.append(f"{y:04d}-{m:02d}")
                continue
        all_items.extend(items)
        time.sleep(args.sleep)

    # Deduplicate globally.
    seen = set()
    unique = []
    for item in all_items:
        code = item.get("code")
        if code in seen:
            continue
        seen.add(code)
        unique.append(item)

    rows = [parse_item(x) for x in unique]
    rows.sort(key=lambda r: (r["published_utc"] or "", r["code"] or 0))

    fields = [
        "code", "published_cairo", "published_utc", "date_stamp_raw",
        "heading", "heading_arabic", "section", "section_arabic", "sec_id",
        "material", "egx", "isin", "company_name_ar", "company_name_en",
        "sector_id", "reuters_code", "content_text", "content_arabic_text",
        "attachment_links", "attachment_urls_beta", "attachments_json",
        "content_html", "content_arabic_html", "url", "url_ar",
    ]
    csv_path = OUT / "egx_official_disclosures_2022_2026_2026_10_31.csv"
    with csv_path.open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)

    summary = {
        "rows": len(rows),
        "unique_codes": len({r["code"] for r in rows if r["code"] is not None}),
        "min_published_utc": min((r["published_utc"] for r in rows if r["published_utc"]), default=""),
        "max_published_utc": max((r["published_utc"] for r in rows if r["published_utc"]), default=""),
        "sections": {},
        "missing_months": missing,
        "scraped_at_utc": datetime.now(UTC).isoformat(timespec="seconds"),
        "source": API,
        "sec_ids": SEC_IDS,
        "note": "Official EGX beta BFF news archive; dateStamp treated as Cairo local time.",
    }
    for r in rows:
        key = r["section"] or "UNKNOWN"
        summary["sections"][key] = summary["sections"].get(key, 0) + 1
    (OUT / "egx_official_disclosures_summary_2026_10_31.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print("wrote", csv_path)


if __name__ == "__main__":
    main()
