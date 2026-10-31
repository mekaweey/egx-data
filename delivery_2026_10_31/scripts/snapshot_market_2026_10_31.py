# -*- coding: utf-8 -*-
"""Capture a Mubasher EGX near-close/open snapshot.

Run this once at each target time (Cairo):
  10:00, 10:05, 14:00, 14:25, 14:31

It reads the public Mubasher stock page and stores last price, change, open,
previous close, high, low, volume, value, and the page's last-update text.
Mubasher itself says the data is delayed 15 minutes during the session.

This script does NOT install a scheduler or a background watcher.  The owner
runs it manually or wires it to their own scheduler.
"""
from __future__ import annotations

import argparse
import csv
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SYMS = ROOT / "strategy-lab" / "outputs" / "all_symbols_2026_10_31.txt"
DEFAULT_OUT = ROOT / "strategy-audit" / "data_derived" / "snapshots"
BASE = "https://www.mubasher.info/markets/EGX/stocks/{symbol}"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept-Language": "ar,en;q=0.8",
}
CAIRO = ZoneInfo("Africa/Cairo")


def num(text: str | None) -> float | None:
    if not text:
        return None
    s = text.replace(",", "").replace("%", "").strip()
    s = re.sub(r"[^\d.\-]", "", s)
    if s in {"", "-", ".", "-."}:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def parse_page(html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    out: dict = {}
    el = soup.select_one(".market-summary__last-price")
    out["last_price"] = num(el.get_text(" ", strip=True)) if el else None
    el = soup.select_one(".market-summary__change")
    out["change"] = num(el.get_text(" ", strip=True)) if el else None
    el = soup.select_one(".market-summary__change-percentage")
    out["change_pct"] = num(el.get_text(" ", strip=True)) if el else None
    el = soup.select_one(".market-summary__date")
    out["last_update_text"] = el.get_text(" ", strip=True) if el else None

    labels = {
        "فتح": "open",
        "إغلاق سابق": "prev_close",
        "أعلى": "high",
        "أدنى": "low",
        "حجم التداول": "volume",
        "قيمة التداول": "value",
    }
    for row in soup.select(".market-summary__block-row"):
        txt = row.get_text(" ", strip=True)
        for ar, key in labels.items():
            if txt.startswith(ar):
                val = txt[len(ar):].strip()
                out[key] = num(val)
                break
    return out


def fetch_one(symbol: str, timeout: int) -> dict:
    url = BASE.format(symbol=symbol)
    row = {
        "symbol": symbol,
        "captured_at_cairo": datetime.now(CAIRO).isoformat(timespec="seconds"),
        "url": url,
        "http_status": None,
        "error": "",
    }
    for attempt in range(2):
        try:
            r = requests.get(url, headers=HEADERS, timeout=timeout)
            row["http_status"] = r.status_code
            if r.status_code != 200:
                row["error"] = f"http_{r.status_code}"
                return row
            row.update(parse_page(r.text))
            return row
        except Exception as exc:  # noqa: BLE001
            row["error"] = repr(exc)[:200]
            if attempt == 0:
                time.sleep(1.0)
    return row


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--symbols-file", default=str(DEFAULT_SYMS))
    ap.add_argument("--out-dir", default=str(DEFAULT_OUT))
    ap.add_argument("--label", required=True, help="e.g. 1000, 1005, 1400, 1425, 1431")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--timeout", type=int, default=20)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    syms = [s.strip().upper() for s in Path(args.symbols_file).read_text(encoding="utf-8").splitlines() if s.strip()]
    if args.limit:
        syms = syms[: args.limit]
    if not syms:
        sys.exit("no symbols")

    rows = []
    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as ex:
        futs = {ex.submit(fetch_one, s, args.timeout): s for s in syms}
        for i, fut in enumerate(as_completed(futs), 1):
            rows.append(fut.result())
            if i % 10 == 0 or i == len(syms):
                print(f"[{i}/{len(syms)}] captured", flush=True)

    rows.sort(key=lambda r: r["symbol"])
    fieldnames = [
        "symbol", "captured_at_cairo", "label", "last_update_text", "last_price",
        "change", "change_pct", "open", "prev_close", "high", "low", "volume",
        "value", "http_status", "error", "url",
    ]
    for r in rows:
        r["label"] = args.label

    if args.dry_run:
        for r in rows[:5]:
            print(r)
        print(f"dry-run rows={len(rows)}")
        return

    outdir = Path(args.out_dir)
    outdir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(CAIRO).strftime("%Y%m%d_%H%M%S")
    out = outdir / f"snapshot_{args.label}_{stamp}.csv"
    with out.open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)

    master = outdir / "snapshots_master.csv"
    write_header = not master.exists()
    with master.open("a", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        if write_header:
            w.writeheader()
        w.writerows(rows)

    ok = sum(1 for r in rows if r.get("last_price") is not None)
    print(f"wrote {out} rows={len(rows)} with_price={ok}")
    print(f"appended {master}")


if __name__ == "__main__":
    main()
