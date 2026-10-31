# -*- coding: utf-8 -*-
"""Fetch the official EGX beta market-watch snapshot.

This is the official current quote table (last trade / OHLCV / ISIN / Reuters
code / sector).  It is not a historical intraday feed and it has no bid/ask.
It is useful for:
  * mapping official disclosure ISIN/Reuters codes to EGX symbols,
  * cross-checking the latest Mubasher close,
  * an official current snapshot.

No scheduler and no orders are installed or placed.
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import pandas as pd
import requests

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "deliverables_2026_10_31" / "data" / "egx_official"
API = "https://beta.egx.com.eg/api/bff/egx/market-watch"
UTC = ZoneInfo("UTC")
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept": "application/json",
    "x-egx-bff-request": "1",
    "Origin": "https://beta.egx.com.eg",
    "Referer": "https://beta.egx.com.eg/en",
    "Accept-Language": "en,ar;q=0.8",
}
FIELDS = [
    "marketCode", "reuters", "isin", "name", "nameA", "sector", "sectorA",
    "lastPrice", "openPrice", "high", "low", "prevClose", "closePrice",
    "chgPer", "volume", "value", "trades", "lastTradeDate", "writeTime",
    "mc", "mcMillion", "egx30", "egx70", "egx100", "shariah", "symbolType",
    "intraday", "withHistory", "secId", "case30", "egx20", "egx50",
]


def fetch_page(session: requests.Session, page: int, size: int = 500) -> dict:
    r = session.get(
        API,
        headers=HEADERS,
        params={"Page": page, "PageSize": size, "SortBy": "Volume", "SortDescending": "true"},
        timeout=90,
    )
    r.raise_for_status()
    j = r.json()
    if not j.get("success"):
        raise RuntimeError(j.get("message") or "API failure")
    return j


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(OUT))
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    first = fetch_page(session, 1)
    data = first.get("data") or {}
    items = list(data.get("data") or [])
    pages = int(data.get("totalPages") or first.get("totalPages") or 1)
    for page in range(2, pages + 1):
        j = fetch_page(session, page)
        items.extend((j.get("data") or {}).get("data") or [])
    # marketCode is a board/segment code (e.g. NOPL repeats for most rows);
    # reuters is the actual ticker (ARAB.CA).  Deduplicate on reuters/isin.
    seen = set()
    rows = []
    for item in items:
        reuters = (item.get("reuters") or "").strip()
        key = reuters or (item.get("isin") or "").strip() or (item.get("name") or "").strip()
        if not key or key in seen:
            continue
        seen.add(key)
        row = {k: item.get(k) for k in FIELDS}
        row["symbol"] = reuters.replace(".CA", "") if reuters else ""
        rows.append(row)
    df = pd.DataFrame(rows).sort_values("symbol")
    csv_path = out / "egx_official_market_watch_2026_10_31.csv"
    df.to_csv(csv_path, index=False, encoding="utf-8-sig")
    summary = {
        "rows": int(len(df)),
        "unique_symbols": int(df["symbol"].replace("", pd.NA).dropna().nunique()),
        "unique_marketcodes": int(df["marketCode"].nunique()),
        "pages": pages,
        "last_trade_date_counts": df["lastTradeDate"].fillna("").value_counts().head(20).to_dict(),
        "sectors": df["sector"].fillna("").value_counts().to_dict(),
        "missing_isin": int(df["isin"].fillna("").eq("").sum()),
        "missing_reuters": int(df["reuters"].fillna("").eq("").sum()),
        "min_last_trade_date": str(df["lastTradeDate"].dropna().min()),
        "max_last_trade_date": str(df["lastTradeDate"].dropna().max()),
        "max_write_time": str(df["writeTime"].dropna().max()),
        "source": API,
        "note": (
            "Official current market-watch snapshot. It is not historical and has no bid/ask. "
            "lastTradeDate can be older than the snapshot date for non-traded symbols."
        ),
        "fetched_at_utc": datetime.now(UTC).isoformat(timespec="seconds"),
    }
    (out / "egx_official_market_watch_summary_2026_10_31.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print("wrote", csv_path)


if __name__ == "__main__":
    main()
