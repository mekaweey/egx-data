# -*- coding: utf-8 -*-
"""Download Mubasher's free per-symbol daily history and last-session 1m bars.

Mubasher stock pages expose two public CSV URLs:
  * historical-data-url: daily OHLCV from IPO to the latest session
  * intraday-data-url:   1-minute OHLCV for the latest session only

The intraday file is overwritten by Mubasher each session.  It is not a
historical intraday archive, so this script can only capture the latest
session.  Run it manually after the close to build a forward archive.

No scheduler and no orders are installed or placed.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, time as dtime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import pandas as pd
import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SYMBOLS = ROOT / "strategy-lab" / "outputs" / "all_symbols_2026_10_31.txt"
DEFAULT_OUT = ROOT / "deliverables_2026_10_31" / "data" / "mubasher"
CAIRO = ZoneInfo("Africa/Cairo")
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "ar,en;q=0.8",
}
SNAPSHOT_TIMES = [
    ("10:00", dtime(10, 0)),
    ("10:05", dtime(10, 5)),
    ("14:00", dtime(14, 0)),
    ("14:25", dtime(14, 25)),
    ("14:28", dtime(14, 28)),
    ("14:31", dtime(14, 31)),
]


def read_symbols(path: Path) -> list[str]:
    return [x.strip() for x in path.read_text(encoding="utf-8-sig").splitlines() if x.strip()]


def fetch(session: requests.Session, url: str, retries: int = 3, timeout: int = 60) -> requests.Response:
    last = None
    for attempt in range(1, retries + 1):
        try:
            r = session.get(url, headers=HEADERS, timeout=timeout)
            if r.status_code == 200 and len(r.content) > 100:
                return r
            last = f"http_{r.status_code}"
        except Exception as exc:  # noqa: BLE001
            last = repr(exc)[:160]
        time.sleep(0.5 * attempt)
    raise RuntimeError(last or "unknown")


def page_links(session: requests.Session, symbol: str) -> dict:
    url = f"https://www.mubasher.info/markets/EGX/stocks/{symbol}"
    row = {
        "symbol": symbol,
        "page_url": url,
        "page_status": "",
        "page_title": "",
        "historical_url": "",
        "intraday_url": "",
        "error": "",
    }
    try:
        r = fetch(session, url)
        row["page_status"] = r.status_code
        soup = BeautifulSoup(r.text, "html.parser")
        row["page_title"] = soup.title.string.strip() if soup.title and soup.title.string else ""
        hist = soup.find(attrs={"historical-data-url": True})
        intr = soup.find(attrs={"intraday-data-url": True})
        if hist:
            row["historical_url"] = hist.get("historical-data-url") or ""
        if intr:
            row["intraday_url"] = intr.get("intraday-data-url") or ""
        if row["intraday_url"].startswith("/"):
            row["intraday_url"] = "https://www.mubasher.info" + row["intraday_url"]
        if not row["historical_url"] and not row["intraday_url"]:
            row["error"] = "no_chart_urls"
    except Exception as exc:  # noqa: BLE001
        row["error"] = repr(exc)[:200]
    return row


def download_csv(session: requests.Session, url: str, path: Path, retries: int = 3) -> tuple[bool, str]:
    if path.exists() and path.stat().st_size > 100:
        return True, "cached"
    try:
        r = fetch(session, url, retries=retries, timeout=90)
        path.write_bytes(r.content)
        first = r.content[:80].decode("utf-8-sig", errors="replace")
        if "/" not in first or "," not in first:
            path.unlink(missing_ok=True)
            return False, f"bad_csv: {first[:80]!r}"
        return True, f"{len(r.content)} bytes"
    except Exception as exc:  # noqa: BLE001
        return False, repr(exc)[:200]


def parse_daily(path: Path, symbol: str) -> pd.DataFrame:
    # Mubasher's historical CSV first column is the PREVIOUS CLOSE, not the
    # session open.  Verified on COMI: the 2026-10-29 first value 119.90 equals
    # the 2026-10-28 close, while the 1m file opens at 120.97.  Naming it
    # "open" produced impossible OHLC rows, so it is kept as prev_close.
    df = pd.read_csv(path, header=None, names=["dt", "prev_close", "high", "low", "close", "volume"])
    df["date"] = pd.to_datetime(df["dt"].astype(str).str.split("/").str[0], errors="coerce")
    for c in ["prev_close", "high", "low", "close", "volume"]:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    df = df.dropna(subset=["date", "prev_close", "high", "low", "close"]).copy()
    df["symbol"] = symbol
    df["source"] = "mubasher_historical_csv"
    return df[["symbol", "date", "prev_close", "high", "low", "close", "volume", "source"]]


def parse_intraday(path: Path, symbol: str) -> pd.DataFrame:
    df = pd.read_csv(path, header=None, names=["dt", "open", "high", "low", "close", "volume"])
    raw = df["dt"].astype(str).str.strip()
    # Mubasher uses YYYY-MM-DD/HH:MM:SS
    parts = raw.str.split("/", n=1, expand=True)
    df["date_raw"] = pd.to_datetime(parts[0], errors="coerce")
    df["time_raw"] = parts[1] if parts.shape[1] > 1 else ""
    for c in ["open", "high", "low", "close", "volume"]:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    df = df.dropna(subset=["date_raw", "open", "high", "low", "close"]).copy()
    # Build a naive datetime from the raw date/time.
    dt_raw = pd.to_datetime(
        df["date_raw"].dt.strftime("%Y-%m-%d") + " " + df["time_raw"].astype(str),
        errors="coerce",
    )
    df["datetime_raw"] = dt_raw
    df = df.dropna(subset=["datetime_raw"]).copy()
    # Calibrate the fixed offset from the first bar to the 10:00 Cairo open.
    # On 2026-10-29 the file starts at 09:00 while the EGX opens at 10:00,
    # so the file is one hour behind Cairo (UTC+2 vs Cairo UTC+3).
    first_t = df["datetime_raw"].min()
    offset = timedelta(0)
    if pd.notna(first_t):
        first_clock = first_t.time()
        target = dtime(10, 0)
        if first_clock < target:
            offset = datetime.combine(first_t.date(), target) - datetime.combine(first_t.date(), first_clock)
        elif first_clock > target:
            # A late first bar: do not guess an offset.
            offset = timedelta(0)
    df["datetime_cairo"] = df["datetime_raw"] + offset
    df["symbol"] = symbol
    df["source"] = "mubasher_intraday_csv"
    return df[["symbol", "datetime_raw", "datetime_cairo", "open", "high", "low", "close", "volume", "source"]]


def build_snapshots(intraday: pd.DataFrame, requested_date: str) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Build snapshots for the requested session and a separate stale-session file.

    Each Mubasher intraday file contains only one session, but halted/illiquid
    symbols can have a last session older than the requested date.  Those are
    kept separately and labelled with their true session date; they are never
    passed off as the requested date.
    """
    requested = pd.Timestamp(requested_date).date()
    rows = []
    stale_rows = []
    for symbol, g in intraday.groupby("symbol", sort=False):
        g = g.sort_values("datetime_cairo")
        if g.empty:
            continue
        last = g.iloc[-1]
        session_date = last["datetime_cairo"].date()
        is_requested = bool(session_date == requested)
        target_date = requested_date if is_requested else session_date.isoformat()
        dest = rows if is_requested else stale_rows
        cum = g.set_index("datetime_cairo")["volume"].cumsum()
        for label, target in SNAPSHOT_TIMES:
            target_dt = pd.Timestamp(f"{target_date} {label}:00")
            eligible = g[g["datetime_cairo"] <= target_dt]
            if eligible.empty:
                continue
            bar = eligible.iloc[-1]
            bar_time = bar["datetime_cairo"]
            stale = int((target_dt - bar_time).total_seconds() // 60)
            dest.append({
                "symbol": symbol,
                "requested_snapshot_date": requested_date,
                "session_date": target_date,
                "snapshot_time_cairo": f"{target_date} {label}:00",
                "bar_time_cairo": bar_time.isoformat(sep=" "),
                "price": float(bar["close"]),
                "bar_open": float(bar["open"]),
                "bar_high": float(bar["high"]),
                "bar_low": float(bar["low"]),
                "bar_volume": float(bar["volume"]),
                "cum_volume": float(cum.loc[bar_time]),
                "is_exact": bool(stale == 0),
                "stale_minutes": stale,
                "is_requested_session": is_requested,
                "last_session_bar": last["datetime_cairo"].isoformat(sep=" "),
                "source": "mubasher_intraday_csv",
            })
    return pd.DataFrame(rows), pd.DataFrame(stale_rows)


def attach_official_close(frame: pd.DataFrame, daily: pd.DataFrame) -> pd.DataFrame:
    """Attach Mubasher's official daily close for the same session.

    The 1m file ends at 14:28 Cairo, so its last price can differ from the
    official closing auction price.  Keeping both is the honest comparison.
    """
    if frame.empty or daily.empty:
        return frame
    d = daily[["symbol", "date", "close", "prev_close", "high", "low", "volume"]].copy()
    d["session_date"] = d["date"].dt.strftime("%Y-%m-%d")
    d = d.rename(
        columns={
            "close": "official_close",
            "prev_close": "official_prev_close",
            "high": "official_high",
            "low": "official_low",
            "volume": "official_volume",
        }
    ).drop(columns=["date"])
    out = frame.merge(d, on=["symbol", "session_date"], how="left")
    out["last_price_vs_official_close_pct"] = (
        (out["price"] / out["official_close"] - 1.0) * 100.0
    )
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--symbols", default=str(DEFAULT_SYMBOLS))
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--snapshot-date", default="2026-10-29")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--build-only", action="store_true", help="Rebuild combined files from cached raw CSVs without downloading")
    args = ap.parse_args()

    out = Path(args.out)
    raw = out / "raw"
    raw.mkdir(parents=True, exist_ok=True)
    symbols = read_symbols(Path(args.symbols))
    print(f"symbols={len(symbols)} out={out}", flush=True)

    links_path = out / "mubasher_symbol_links_2026_10_31.csv"
    if args.build_only:
        if not links_path.exists():
            raise SystemExit(f"build-only needs cached links: {links_path}")
        links = pd.read_csv(links_path, dtype=str).fillna("")
        print(f"links cached rows={len(links)} (build-only)", flush=True)
    elif links_path.exists() and not args.force:
        links = pd.read_csv(links_path, dtype=str).fillna("")
        print(f"links cached rows={len(links)}", flush=True)
    else:
        session = requests.Session()
        rows = []
        with ThreadPoolExecutor(max_workers=args.workers) as ex:
            futs = {ex.submit(page_links, session, s): s for s in symbols}
            for i, fut in enumerate(as_completed(futs), 1):
                rows.append(fut.result())
                if i % 20 == 0 or i == len(futs):
                    print(f"pages {i}/{len(futs)}", flush=True)
        links = pd.DataFrame(rows).sort_values("symbol")
        links.to_csv(links_path, index=False, encoding="utf-8-sig")
        print(f"wrote {links_path} rows={len(links)}", flush=True)

    ok_hist = 0
    ok_intra = 0
    errors = []
    if not args.build_only:
        session = requests.Session()
        jobs = []
        for _, row in links.iterrows():
            sym = row["symbol"]
            if row.get("historical_url"):
                jobs.append(("hist", sym, row["historical_url"], raw / f"{sym}_historical.csv"))
            if row.get("intraday_url"):
                jobs.append(("intra", sym, row["intraday_url"], raw / f"{sym}_intraday.csv"))
        with ThreadPoolExecutor(max_workers=args.workers) as ex:
            futs = {
                ex.submit(download_csv, session, url, path): (kind, sym, url, path)
                for kind, sym, url, path in jobs
            }
            for i, fut in enumerate(as_completed(futs), 1):
                kind, sym, url, path = futs[fut]
                ok, msg = fut.result()
                if ok:
                    if kind == "hist":
                        ok_hist += 1
                    else:
                        ok_intra += 1
                else:
                    errors.append({"symbol": sym, "kind": kind, "url": url, "error": msg})
                if i % 40 == 0 or i == len(futs):
                    print(f"downloads {i}/{len(futs)} hist={ok_hist} intra={ok_intra}", flush=True)

    daily_frames = []
    intra_frames = []
    parse_errors = []
    for _, row in links.iterrows():
        sym = row["symbol"]
        hp = raw / f"{sym}_historical.csv"
        ip = raw / f"{sym}_intraday.csv"
        if hp.exists() and hp.stat().st_size > 100:
            try:
                daily_frames.append(parse_daily(hp, sym))
            except Exception as exc:  # noqa: BLE001
                parse_errors.append({"symbol": sym, "kind": "hist", "error": repr(exc)[:200]})
        if ip.exists() and ip.stat().st_size > 100:
            try:
                intra_frames.append(parse_intraday(ip, sym))
            except Exception as exc:  # noqa: BLE001
                parse_errors.append({"symbol": sym, "kind": "intra", "error": repr(exc)[:200]})

    daily = pd.concat(daily_frames, ignore_index=True) if daily_frames else pd.DataFrame()
    intra = pd.concat(intra_frames, ignore_index=True) if intra_frames else pd.DataFrame()

    daily_raw_rows = int(len(daily))
    daily_zero_close_all_history = int((daily["close"] <= 0).sum()) if not daily.empty else 0
    daily_rows_in_scope_before_drop = 0
    daily_zero_close_in_scope = 0
    if not daily.empty:
        daily = daily[(daily["date"] >= "2022-01-01") & (daily["date"] <= "2026-10-31")].copy()
        daily_rows_in_scope_before_drop = int(len(daily))
        daily_zero_close_in_scope = int((daily["close"] <= 0).sum())
        daily = daily[daily["close"] > 0].copy()
        daily = daily.drop_duplicates(["symbol", "date"]).sort_values(["symbol", "date"])
        daily["close_outside_range"] = (daily["close"] > daily["high"]) | (daily["close"] < daily["low"])
        daily["high_lt_low"] = daily["high"] < daily["low"]
        daily["prior_close"] = daily.groupby("symbol")["close"].shift(1)
        daily["prev_close_matches_prior"] = (
            (daily["prev_close"] - daily["prior_close"]).abs() <= 1e-6
        )
        daily.to_parquet(out / "mubasher_daily_raw_2022_2026_2026_10_31.parquet", index=False)
        daily.to_csv(out / "mubasher_daily_raw_2022_2026_2026_10_31.csv", index=False, encoding="utf-8-sig")
    if not intra.empty:
        intra = intra.drop_duplicates(["symbol", "datetime_raw"]).sort_values(["symbol", "datetime_cairo"])
        intra.to_parquet(out / "mubasher_intraday_1m_latest_2026_10_31.parquet", index=False)
        intra.to_csv(out / "mubasher_intraday_1m_latest_2026_10_31.csv", index=False, encoding="utf-8-sig")
        snaps, stale_snaps = build_snapshots(intra, args.snapshot_date)
        snaps = attach_official_close(snaps, daily)
        stale_snaps = attach_official_close(stale_snaps, daily)
        snaps.to_csv(out / f"mubasher_snapshots_{args.snapshot_date.replace('-', '_')}.csv", index=False, encoding="utf-8-sig")
        stale_snaps.to_csv(
            out / f"mubasher_snapshots_stale_symbols_{args.snapshot_date.replace('-', '_')}.csv",
            index=False,
            encoding="utf-8-sig",
        )
    else:
        snaps = pd.DataFrame()
        stale_snaps = pd.DataFrame()

    hist_files = sum(1 for p in raw.glob("*_historical.csv") if p.stat().st_size > 100)
    intra_files = sum(1 for p in raw.glob("*_intraday.csv") if p.stat().st_size > 100)
    requested_day = pd.Timestamp(args.snapshot_date).date()
    requested_symbols = (
        int(intra[pd.to_datetime(intra["datetime_cairo"]).dt.date.eq(requested_day)]["symbol"].nunique())
        if not intra.empty
        else 0
    )
    stale_symbols = (
        sorted(stale_snaps["symbol"].unique().tolist()) if not stale_snaps.empty else []
    )
    summary = {
        "symbols_requested": len(symbols),
        "symbols_with_links": int((links[["historical_url", "intraday_url"]].fillna("") != "").any(axis=1).sum()),
        "symbols_with_historical": int(links["historical_url"].fillna("").ne("").sum()),
        "symbols_with_intraday": int(links["intraday_url"].fillna("").ne("").sum()),
        "historical_files_ok": int(hist_files),
        "intraday_files_ok": int(intra_files),
        "historical_downloads_this_run": int(ok_hist),
        "intraday_downloads_this_run": int(ok_intra),
        "daily_raw_rows_all_history": daily_raw_rows,
        "daily_rows_in_scope_before_drop": daily_rows_in_scope_before_drop,
        "daily_rows": int(len(daily)),
        "daily_zero_close_dropped": daily_zero_close_in_scope,
        "daily_zero_close_all_history": daily_zero_close_all_history,
        "daily_symbols": int(daily["symbol"].nunique()) if not daily.empty else 0,
        "daily_min_date": str(daily["date"].min().date()) if not daily.empty else "",
        "daily_max_date": str(daily["date"].max().date()) if not daily.empty else "",
        "daily_close_outside_range": int(daily["close_outside_range"].sum()) if not daily.empty else 0,
        "daily_high_lt_low": int(daily["high_lt_low"].sum()) if not daily.empty else 0,
        "daily_prev_close_matches_prior_pct": (
            round(float(daily["prev_close_matches_prior"].mean()) * 100, 3) if not daily.empty else None
        ),
        "intraday_rows": int(len(intra)),
        "intraday_symbols": int(intra["symbol"].nunique()) if not intra.empty else 0,
        "intraday_min_cairo": str(intra["datetime_cairo"].min()) if not intra.empty else "",
        "intraday_max_cairo": str(intra["datetime_cairo"].max()) if not intra.empty else "",
        "requested_snapshot_date": args.snapshot_date,
        "requested_date_symbols": requested_symbols,
        "snapshot_rows": int(len(snaps)),
        "snapshot_symbols": int(snaps["symbol"].nunique()) if not snaps.empty else 0,
        "snapshot_exact_rows": int(snaps["is_exact"].sum()) if not snaps.empty else 0,
        "snapshot_proxy_rows": int((~snaps["is_exact"]).sum()) if not snaps.empty else 0,
        "snapshot_1431_proxy_rows": int(
            snaps["snapshot_time_cairo"].astype(str).str.contains("14:31").sum()
        ) if not snaps.empty else 0,
        "stale_session_rows": int(len(stale_snaps)),
        "stale_session_symbols": int(stale_snaps["symbol"].nunique()) if not stale_snaps.empty else 0,
        "stale_symbols": stale_symbols,
        "errors": errors[:100],
        "parse_errors": parse_errors[:100],
        "note": (
            "Mubasher historical CSV is raw (not dividend-adjusted) and the intraday "
            "CSV is the latest session only; it is not a historical intraday archive. "
            "The intraday clock is calibrated to the 10:00 Cairo open."
        ),
        "generated_at_utc": datetime.now(ZoneInfo("UTC")).isoformat(timespec="seconds"),
    }
    (out / "mubasher_daily_intraday_summary_2026_10_31.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2), flush=True)


if __name__ == "__main__":
    main()
