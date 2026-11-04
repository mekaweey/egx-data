# -*- coding: utf-8 -*-
"""Build the consolidated EGX delivery with a hard data cutoff of 2026-11-03.

The source is the 2026-11-04 build.  Every time series is filtered to
2026-11-03, the 2026-11-04 partial rows are removed, and all derived tables
(coverage, universe, live snapshots, summaries) are rebuilt from the filtered
data.  No missing bar, quote, or investor value is invented.
"""
from __future__ import annotations

import gc
import gzip
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "strategy-lab" / "outputs" / "egx_2026_11_04"
DST = ROOT / "strategy-lab" / "outputs" / "egx_2026_11_03"
CUTOFF = "2026-11-03"
PREV = "2026-11-02"
CAIRO = ZoneInfo("Africa/Cairo")
NOW_CAIRO = datetime.now(CAIRO).isoformat(timespec="seconds")
NOW_UTC = datetime.now(timezone.utc).isoformat(timespec="seconds")


def ensure_dirs() -> None:
    for p in [
        "data/prices", "data/news", "data/official", "data/macro",
        "data/indices", "data/universe", "data/coverage", "data/live",
        "data/reference", "db", "scripts", "docs",
    ]:
        (DST / p).mkdir(parents=True, exist_ok=True)


def write_csv(df: pd.DataFrame, path: Path, gz: bool | None = None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if gz is None:
        gz = path.name.endswith(".gz")
    df.to_csv(path, index=False, encoding="utf-8-sig", compression="gzip" if gz else None)
    print("wrote", path.relative_to(DST), df.shape, flush=True)


def filter_frame(src: Path, dst: Path, col: str, cutoff: str = CUTOFF) -> pd.DataFrame:
    df = pd.read_csv(src, low_memory=False)
    before = len(df)
    df = df[df[col].astype(str).str[:10] <= cutoff].copy()
    write_csv(df, dst)
    print("filter", src.name, before, "->", len(df), flush=True)
    return df


def filter_chunks(src: Path, dst: Path, col: str, cutoff: str = CUTOFF,
                  chunksize: int = 100_000, encoding: str = "utf-8-sig") -> tuple[int, int]:
    """Filter a CSV/CSV.gz by the first 10 chars of a date column, chunked."""
    gz = dst.name.endswith(".gz")
    opener = gzip.open if gz else open
    total = kept = 0
    first = True
    columns: list[str] = []
    dst.parent.mkdir(parents=True, exist_ok=True)
    with opener(dst, "wt", encoding=encoding, newline="") as f:
        for chunk in pd.read_csv(src, chunksize=chunksize, low_memory=False):
            if not columns:
                columns = list(chunk.columns)
            total += len(chunk)
            mask = chunk[col].astype(str).str[:10] <= cutoff
            chunk = chunk.loc[mask]
            kept += len(chunk)
            if chunk.empty:
                continue
            chunk.to_csv(f, header=first, index=False)
            first = False
        if first:
            pd.DataFrame(columns=columns).to_csv(f, index=False)
    print("filter_chunks", src.name, total, "->", kept, "->", dst.name, flush=True)
    return total, kept


def copy_file(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)
    print("copy", src.name, "->", dst.relative_to(DST), flush=True)


def main() -> None:
    ensure_dirs()

    # ------------------------------------------------------------------
    # Prices
    # ------------------------------------------------------------------
    src_prices = SRC / "data" / "prices"
    dst_prices = DST / "data" / "prices"

    # 1m: 2023-2025 and 2026 H1 have no 2026-11-04 rows; copy. H2 is filtered.
    for name in ["egx_1m_2023.csv.gz", "egx_1m_2024.csv.gz", "egx_1m_2025.csv.gz", "egx_1m_2026_H1.csv.gz"]:
        copy_file(src_prices / name, dst_prices / name)
    filter_chunks(src_prices / "egx_1m_2026_H2.csv.gz", dst_prices / "egx_1m_2026_H2.csv.gz", "date_cairo", chunksize=100_000)

    # 5m and 60m.
    filter_chunks(src_prices / "egx_5m_2023_2026.csv.gz", dst_prices / "egx_5m_2023_2026.csv.gz", "date_cairo", chunksize=100_000)
    filter_chunks(src_prices / "egx_60m_2023_2026.csv.gz", dst_prices / "egx_60m_2023_2026.csv.gz", "date_cairo", chunksize=100_000)

    # Daily.
    daily = filter_frame(src_prices / "egx_daily_2023_2026_2026_11_04.csv.gz", dst_prices / "egx_daily_2023_2026_2026_11_03.csv.gz", "date")
    daily_last = daily[daily["date"].astype(str) == CUTOFF].copy()
    write_csv(daily_last, dst_prices / "egx_daily_2026_11_03.csv")
    filter_frame(src_prices / "egx_daily_full_2013_2026_2026_11_04.csv.gz", dst_prices / "egx_daily_full_2013_2026_2026_11_03.csv.gz", "date")
    copy_file(src_prices / "egx_daily_2013_2022_archive.csv.gz", dst_prices / "egx_daily_2013_2022_archive.csv.gz")
    filter_frame(SRC / "data" / "reference" / "egx_daily_egx_data_pack_69_2022_2026.csv.gz", DST / "data" / "reference" / "egx_daily_egx_data_pack_69_2022_2026.csv.gz", "date")

    # Daily quality summary.
    q = {
        "cutoff": CUTOFF,
        "generated_at_cairo": NOW_CAIRO,
        "rows": int(len(daily)),
        "symbols": int(daily["symbol"].nunique()),
        "first_date": str(daily["date"].min()),
        "last_date": str(daily["date"].max()),
        "source_counts": {str(k): int(v) for k, v in daily["source"].value_counts(dropna=False).items()},
        "quality_counts": {str(k): int(v) for k, v in daily["quality"].value_counts(dropna=False).items()},
        "is_partial_counts": {str(k): int(v) for k, v in daily["is_partial"].value_counts(dropna=False).items()},
        "ohlc_valid_counts": {str(k): int(v) for k, v in daily["ohlc_valid"].value_counts(dropna=False).items()},
        "ohlc_repaired_counts": {str(k): int(v) for k, v in daily["ohlc_repaired"].value_counts(dropna=False).items()},
        "last_5_dates": {str(k): int(v) for k, v in daily["date"].astype(str).value_counts().sort_index().tail(5).items()},
        "last_date_sources": {str(k): int(v) for k, v in daily_last["source"].value_counts(dropna=False).items()},
        "note": "2026-11-04 rows were removed. 2026-11-03 has no is_partial=1 rows; two rows come from aggregated_60m.",
    }
    (dst_prices / "daily_quality_summary.json").write_text(json.dumps(q, ensure_ascii=False, indent=2), encoding="utf-8")
    print("wrote daily_quality_summary.json", flush=True)

    # ------------------------------------------------------------------
    # News
    # ------------------------------------------------------------------
    src_news = SRC / "data" / "news"
    dst_news = DST / "data" / "news"
    news_recent = pd.read_csv(src_news / "news_2026_11_01_2026_11_04.csv", low_memory=False)
    news_recent = news_recent[news_recent["published_cairo"].astype(str).str[:10] <= CUTOFF].copy()
    write_csv(news_recent, dst_news / "news_2026_11_01_2026_11_03.csv")
    filter_chunks(src_news / "egx_official_disclosures_2022_2026_2026_11_04.csv.gz",
                  dst_news / "egx_official_disclosures_2022_2026_2026_11_03.csv.gz",
                  "published_cairo", chunksize=2_000)
    news_summary = {
        "cutoff": CUTOFF,
        "generated_at_cairo": NOW_CAIRO,
        "recent_rows": int(len(news_recent)),
        "recent_first_published_cairo": str(news_recent["published_cairo"].min()),
        "recent_last_published_cairo": str(news_recent["published_cairo"].max()),
        "recent_seen_at_recorded": int(news_recent["seen_at_cairo"].notna().sum()),
        "recent_seen_at_missing": int(news_recent["seen_at_cairo"].isna().sum()),
        "cutoff_day_rows": int((news_recent["published_cairo"].astype(str).str[:10] == CUTOFF).sum()),
        "excluded_2026_11_04_rows": int((pd.read_csv(src_news / "news_2026_11_01_2026_11_04.csv", usecols=["published_cairo"])["published_cairo"].astype(str).str[:10] == "2026-11-04").sum()),
        "source": "EGX beta news-search API (official egx.com.eg backend)",
        "note": "Rows published after 2026-11-03 were removed. Prior rows before 2026-10-31 keep seen_at_status=not_recorded_prior_2026_10_31; recent rows carry the actual seen_at_utc/seen_at_cairo.",
    }
    (dst_news / "news_disclosures_summary_2026_11_03.json").write_text(json.dumps(news_summary, ensure_ascii=False, indent=2), encoding="utf-8")

    # ------------------------------------------------------------------
    # Macro
    # ------------------------------------------------------------------
    src_macro = SRC / "data" / "macro"
    dst_macro = DST / "data" / "macro"
    macro_long = filter_frame(src_macro / "macro_long_2022_2026_2026_11_04.csv", dst_macro / "macro_long_2022_2026_2026_11_03.csv", "date")
    macro_daily = filter_frame(src_macro / "macro_daily_2022_2026_2026_11_04.csv", dst_macro / "macro_daily_2022_2026_2026_11_03.csv", "date")
    last = macro_long.sort_values("date").groupby("indicator", as_index=False).tail(1)
    g = macro_long.groupby("indicator", as_index=False).agg(rows=("date", "size"), first_date=("date", "min"), last_date=("date", "max"))
    g = g.merge(last[["indicator", "value", "is_partial", "yahoo_symbol", "source"]], on="indicator", how="left")
    g = g.rename(columns={"value": "last_value", "is_partial": "is_partial_last"})
    g["cutoff"] = CUTOFF
    write_csv(g, dst_macro / "macro_sources.csv")
    macro_summary = {
        "cutoff": CUTOFF,
        "generated_at_cairo": NOW_CAIRO,
        "rows": int(len(macro_long)),
        "series": {str(r.indicator): {"rows": int(r.rows), "first": str(r.first_date), "last": str(r.last_date), "last_value": float(r.last_value), "is_partial_last": int(r.is_partial_last)} for r in g.itertuples()},
        "note": "2026-11-04 partial macro rows were removed. US10Y last date is 2026-11-03; USD/EGP, Brent, gold and DXY are filtered to 2026-11-03.",
    }
    (dst_macro / "macro_summary.json").write_text(json.dumps(macro_summary, ensure_ascii=False, indent=2), encoding="utf-8")

    # ------------------------------------------------------------------
    # Indices
    # ------------------------------------------------------------------
    src_idx = SRC / "data" / "indices"
    dst_idx = DST / "data" / "indices"
    idx = filter_frame(src_idx / "indices_daily_2023_2026_2026_11_04.csv", dst_idx / "indices_daily_2023_2026_2026_11_03.csv", "date")
    mapping = [
        ("egx30", "CASE30", "EGX30"),
        ("egx70", "EGX70_EWI", "EGX70 (EGX70 EWI)"),
        ("egx100", "EGX100_EWI", "EGX100 (EGX100 EWI)"),
        ("shariah", "EGX_SHARIAH", "EGX SHARIAH"),
    ]
    rows = []
    for col, code, label in mapping:
        s = idx[["date", col]].dropna()
        if s.empty:
            continue
        last_row = s.sort_values("date").tail(1).iloc[0]
        rows.append({
            "indicator": col, "api_code": code, "label": label,
            "rows": int(len(s)), "first_date": str(s["date"].min()),
            "last_date": str(last_row["date"]), "last_close": float(last_row[col]),
            "is_final": int(idx.loc[idx["date"] == last_row["date"], "is_final"].iloc[0]),
            "source": "beta.egx.com.eg index-data + intervalIndex",
            "fetched_at_utc": NOW_UTC, "cutoff": CUTOFF,
        })
    idx_sources = pd.DataFrame(rows)
    write_csv(idx_sources, dst_idx / "indices_sources.csv")
    idx_last = idx[idx["date"].astype(str) == CUTOFF].copy()
    idx_summary = {
        "cutoff": CUTOFF,
        "generated_at_cairo": NOW_CAIRO,
        "rows": int(len(idx)),
        "first_date": str(idx["date"].min()),
        "last_date": str(idx["date"].max()),
        "last_date_is_final": int(idx_last["is_final"].iloc[0]) if len(idx_last) else None,
        "last_values": {c: (float(idx_last[c].iloc[0]) if len(idx_last) and pd.notna(idx_last[c].iloc[0]) else None) for c in ["egx30", "egx70", "egx100", "shariah"]},
        "note": "The 2026-11-04 provisional index row was removed. 2026-11-03 is final.",
    }
    (dst_idx / "indices_summary.json").write_text(json.dumps(idx_summary, ensure_ascii=False, indent=2), encoding="utf-8")

    # ------------------------------------------------------------------
    # Official bid/ask and investor cumulative snapshot
    # ------------------------------------------------------------------
    src_off = SRC / "data" / "official"
    dst_off = DST / "data" / "official"
    copy_file(src_off / "bidask_snapshots_2026_08_23_2026_10_01.csv.gz", dst_off / "bidask_snapshots_2026_08_23_2026_10_01.csv.gz")
    copy_file(src_off / "bidask_history_summary.json", dst_off / "bidask_history_summary.json")
    copy_file(src_off / "egx_official_market_watch_1011.csv", dst_off / "egx_official_market_watch_1011.csv")
    copy_file(src_off / "egx_official_market_watch_summary_1011.json", dst_off / "egx_official_market_watch_summary_1011.json")

    cum = pd.read_csv(src_off / "egx_investor_statistics_cumulative_1011.csv")
    cum["as_of_date"] = CUTOFF
    cum["as_of_status"] = "assumed_cumulative_through_previous_session_fetched_before_2026_11_04_open"
    cum["cutoff"] = CUTOFF
    cum["note"] = ("Official beta investor-full-statistics cumulative snapshot fetched 2026-11-04T08:06:35Z, "
                   "before the 2026-11-04 session. The API period field is cumulative_or_period_unspecified. "
                   "This is not a daily 2026-11-03 investor report.")
    write_csv(cum, dst_off / "egx_investor_cumulative_2026_11_03.csv")
    inv_summary = {
        "cutoff": CUTOFF,
        "generated_at_cairo": NOW_CAIRO,
        "rows": int(len(cum)),
        "scopes": {str(k): int(v) for k, v in cum["scope"].value_counts().items()},
        "fetched_at_utc": str(cum["fetched_at_utc"].iloc[0]),
        "as_of_status": "assumed_cumulative_through_previous_session_fetched_before_2026_11_04_open",
        "daily_report_2026_11_03": "missing_not_available_at_build_time",
        "note": "The official daily investor page showed 2026-11-04 preliminary values when fetched on 2026-11-04. The 2026-11-03 daily report was not available; no daily values were fabricated.",
    }
    (dst_off / "investor_cumulative_summary.json").write_text(json.dumps(inv_summary, ensure_ascii=False, indent=2), encoding="utf-8")
    (dst_off / "MISSING_2026_11_03_DAILY_INVESTOR.md").write_text(
        "# Missing: 2026-11-03 daily investor-flow report\n\n"
        "The official EGX beta daily investor page (`/en/market/investors`) showed the **2026-11-04 preliminary**\n"
        "values when fetched on 2026-11-04 at 10:17 Cairo. The page is current-day only and its API\n"
        "(`/api/bff/egx/investor-full-statistics`) does not accept a historical date parameter.\n\n"
        "The official daily report PDF for 2026-11-03 was not published/indexed at build time; the latest\n"
        "indexed daily report was 2026-11-02 (ID 1022). No daily 2026-11-03 values were invented.\n\n"
        "Included instead: `egx_investor_cumulative_2026_11_03.csv`, the official cumulative snapshot\n"
        "fetched 2026-11-04T08:06:35Z before the 2026-11-04 session. It is labelled\n"
        "`cumulative_or_period_unspecified`; it is not a daily report.\n\n"
        "To complete this item later, fetch the official 2026-11-03 daily report PDF/page after publication\n"
        "and append it without changing the rest of this dataset.\n",
        encoding="utf-8",
    )

    # ------------------------------------------------------------------
    # Live snapshots reconstructed from 1m + previous-session daily
    # ------------------------------------------------------------------
    m1_cols = ["symbol", "timestamp_cairo", "timestamp_utc", "date_cairo", "time_cairo", "open", "high", "low", "close", "volume", "source"]
    m1 = pd.read_csv(dst_prices / "egx_1m_2026_H2.csv.gz", usecols=m1_cols, low_memory=False)
    m1 = m1[m1["date_cairo"].astype(str) == CUTOFF].copy()
    m1["time_cairo"] = m1["time_cairo"].astype(str).str[:5]
    prev = daily[daily["date"].astype(str) == PREV][["symbol", "close"]].rename(columns={"close": "prev_close"})
    clean = pd.read_csv(SRC / "data" / "universe" / "clean_union.csv")["symbol"].astype(str).str.upper().str.strip()
    clean_set = set(clean)

    live_frames = []

    # 09:55: pre-open reference = previous session daily OHLCV (no 1m bar exists before 10:00).
    p = daily[daily["date"].astype(str) == PREV].copy()
    p = p[p["symbol"].isin(clean_set)].copy()
    p["scanner_symbol"] = "EGX:" + p["symbol"].astype(str)
    p["target_time"] = "09:55"
    p["captured_at_cairo"] = f"{CUTOFF}T09:55:00+02:00"
    p["last_price"] = p["close"]
    p["volume"] = p["volume"]
    p["change_pct"] = np.nan
    p["bid"] = np.nan
    p["ask"] = np.nan
    p["bid_qty"] = np.nan
    p["ask_qty"] = np.nan
    p["in_clean_union"] = 1
    p["source"] = "egx_daily_2023_2026_2026_11_03.csv.gz"
    p["snapshot_status"] = "preopen_reference_previous_session_daily_ohlcv"
    p["data_quality"] = "previous_session_daily_ohlcv_not_2026_11_03"
    p["bidask_status"] = "unavailable_source_null"
    p["is_live_capture"] = 0
    p["bars_used"] = 0
    p["first_bar_time"] = None
    p["last_bar_time"] = None
    p["last_bar_timestamp_cairo"] = None
    p["prev_close"] = np.nan
    p["reference_date"] = PREV
    p = p[["symbol", "scanner_symbol", "target_time", "captured_at_cairo", "last_price", "open", "high", "low", "volume",
           "change_pct", "bid", "ask", "bid_qty", "ask_qty", "in_clean_union", "source", "snapshot_status",
           "data_quality", "bidask_status", "is_live_capture", "bars_used", "first_bar_time", "last_bar_time",
           "last_bar_timestamp_cairo", "prev_close", "reference_date"]].copy()
    live_frames.append(p)
    write_csv(p, DST / "data" / "live" / "live_snapshots_2026_11_03_0955.csv")

    for target in ["13:55", "14:05"]:
        bars = m1[m1["time_cairo"] < target].copy()
        bars = bars.sort_values(["symbol", "time_cairo"])
        g = bars.groupby("symbol", as_index=False).agg(
            open=("open", "first"), high=("high", "max"), low=("low", "min"),
            last_price=("close", "last"), volume=("volume", "sum"),
            bars_used=("close", "size"), first_bar_time=("time_cairo", "first"),
            last_bar_time=("time_cairo", "last"),
            sources=("source", lambda s: "|".join(sorted({str(x) for x in s}))),
        )
        g = g.merge(prev, on="symbol", how="left")
        g["scanner_symbol"] = "EGX:" + g["symbol"].astype(str)
        g["target_time"] = target
        g["captured_at_cairo"] = f"{CUTOFF}T{target}:00+02:00"
        g["change_pct"] = (g["last_price"] / g["prev_close"] - 1.0) * 100.0
        g["bid"] = np.nan
        g["ask"] = np.nan
        g["bid_qty"] = np.nan
        g["ask_qty"] = np.nan
        g["in_clean_union"] = g["symbol"].isin(clean_set).astype(int)
        g["source"] = "egx_1m_2026_H2.csv.gz"
        g["snapshot_status"] = "reconstructed_from_1m_last_completed_bar_before_target"
        g["data_quality"] = "1m_ohlcv_aggregate"
        g["bidask_status"] = "unavailable_source_null"
        g["is_live_capture"] = 0
        g["last_bar_timestamp_cairo"] = f"{CUTOFF}T" + g["last_bar_time"].astype(str) + ":00+02:00"
        g["reference_date"] = CUTOFF
        g = g[["symbol", "scanner_symbol", "target_time", "captured_at_cairo", "last_price", "open", "high", "low", "volume",
               "change_pct", "bid", "ask", "bid_qty", "ask_qty", "in_clean_union", "source", "snapshot_status",
               "data_quality", "bidask_status", "is_live_capture", "bars_used", "first_bar_time", "last_bar_time",
               "last_bar_timestamp_cairo", "prev_close", "reference_date"]].copy()
        live_frames.append(g)
        write_csv(g, DST / "data" / "live" / f"live_snapshots_2026_11_03_{target.replace(':', '')}.csv")

    live_all = pd.concat(live_frames, ignore_index=True)
    write_csv(live_all, DST / "data" / "live" / "live_snapshots_2026_11_03_all.csv")
    live_summary = {
        "snapshot_date": CUTOFF,
        "generated_at_cairo": NOW_CAIRO,
        "bidask": "unavailable_source_null",
        "is_live_capture": 0,
        "targets": {},
        "caveat": ("These are NOT live captures. 09:55 has no 1m bar before the 10:00 open, so it uses the "
                   "previous session (2026-11-02) daily OHLCV as a pre-open reference. 13:55 and 14:05 are "
                   "reconstructed from the last completed 1m bar before the target. Bid/ask and quantities are null "
                   "because no verified order-book source was available. No quote was invented."),
    }
    for target, frame in zip(["09:55", "13:55", "14:05"], live_frames):
        live_summary["targets"][target] = {
            "rows": int(len(frame)),
            "symbols": int(frame["symbol"].nunique()),
            "method": str(frame["snapshot_status"].iloc[0]) if len(frame) else None,
            "reference_date": str(frame["reference_date"].iloc[0]) if len(frame) else None,
            "bars_used_min": int(frame["bars_used"].min()) if len(frame) else None,
            "bars_used_max": int(frame["bars_used"].max()) if len(frame) else None,
        }
    (DST / "data" / "live" / "live_snapshot_summary.json").write_text(json.dumps(live_summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print("wrote live summaries", flush=True)

    # ------------------------------------------------------------------
    # Coverage from the filtered files
    # ------------------------------------------------------------------
    def coverage_from_frames(frames: list[pd.DataFrame], tf: str) -> pd.DataFrame:
        parts = []
        for df in frames:
            if df.empty:
                continue
            d = df.copy()
            d["volume_num"] = pd.to_numeric(d["volume"], errors="coerce")
            g = d.groupby("symbol", as_index=False).agg(
                rows=("date_cairo", "size"),
                first_date=("date_cairo", "min"),
                last_date=("date_cairo", "max"),
                volume_rows=("volume_num", lambda s: int(s.notna().sum())),
                no_volume_rows=("volume_num", lambda s: int(s.isna().sum())),
                sources=("source", lambda s: str(sorted({str(x) for x in s}))),
            )
            parts.append(g)
        if not parts:
            return pd.DataFrame(columns=["symbol", "rows", "first_date", "last_date", "volume_rows", "no_volume_rows", "sources", "timeframe"])
        out = pd.concat(parts, ignore_index=True)
        out = out.groupby("symbol", as_index=False).agg(
            rows=("rows", "sum"), first_date=("first_date", "min"), last_date=("last_date", "max"),
            volume_rows=("volume_rows", "sum"), no_volume_rows=("no_volume_rows", "sum"),
            sources=("sources", lambda s: str(sorted({x for part in s for x in eval(part)}))),
        )
        out["timeframe"] = tf
        return out

    # 1m coverage from each file (use only needed columns to control memory).
    one_frames = []
    for name in ["egx_1m_2023.csv.gz", "egx_1m_2024.csv.gz", "egx_1m_2025.csv.gz", "egx_1m_2026_H1.csv.gz", "egx_1m_2026_H2.csv.gz"]:
        d = pd.read_csv(dst_prices / name, usecols=["symbol", "date_cairo", "volume", "source"], low_memory=False)
        one_frames.append(d)
    cov1 = coverage_from_frames(one_frames, "1m")
    write_csv(cov1, DST / "data" / "coverage" / "coverage_1m.csv")
    del one_frames, m1
    gc.collect()

    cov5 = coverage_from_frames([pd.read_csv(dst_prices / "egx_5m_2023_2026.csv.gz", usecols=["symbol", "date_cairo", "volume", "source"], low_memory=False)], "5m")
    write_csv(cov5, DST / "data" / "coverage" / "coverage_5m.csv")
    cov60 = coverage_from_frames([pd.read_csv(dst_prices / "egx_60m_2023_2026.csv.gz", usecols=["symbol", "date_cairo", "volume", "source"], low_memory=False)], "60m")
    write_csv(cov60, DST / "data" / "coverage" / "coverage_60m.csv")

    cov_long = pd.concat([cov1, cov5, cov60], ignore_index=True)
    cov_long = cov_long[["symbol", "timeframe", "rows", "first_date", "last_date", "volume_rows", "no_volume_rows", "sources"]]
    write_csv(cov_long, DST / "data" / "coverage" / "coverage_by_symbol_timeframe.csv")
    cov_summary = {
        "cutoff": CUTOFF,
        "generated_at_cairo": NOW_CAIRO,
        "timeframes": {
            tf: {
                "rows": int(cov_long[cov_long.timeframe == tf]["rows"].sum()),
                "symbols": int(cov_long[cov_long.timeframe == tf]["symbol"].nunique()),
                "first_date": str(cov_long[cov_long.timeframe == tf]["first_date"].min()),
                "last_date": str(cov_long[cov_long.timeframe == tf]["last_date"].max()),
            } for tf in ["1m", "5m", "60m"]
        },
        "note": "Coverage is computed only from the filtered files; no 2026-11-04 rows are counted.",
    }
    (DST / "data" / "coverage" / "coverage_summary.json").write_text(json.dumps(cov_summary, ensure_ascii=False, indent=2), encoding="utf-8")

    # ------------------------------------------------------------------
    # Universe and per-symbol coverage
    # ------------------------------------------------------------------
    # Recompute the top-100 liquidity list from the filtered 60m data (last 60 sessions).
    m60 = pd.read_csv(dst_prices / "egx_60m_2023_2026.csv.gz", usecols=["symbol", "date_cairo", "close", "volume"], low_memory=False)
    m60["value"] = pd.to_numeric(m60["close"], errors="coerce") * pd.to_numeric(m60["volume"], errors="coerce")
    d = m60.groupby(["symbol", "date_cairo"], as_index=False)["value"].sum()
    dates = sorted(d["date_cairo"].unique())[-60:]
    d = d[d["date_cairo"].isin(dates)]
    top = d.groupby("symbol", as_index=False)["value"].mean().sort_values("value", ascending=False).head(100).reset_index(drop=True)
    top = top.rename(columns={"value": "avg_value_proxy_60s"})
    top["rank"] = range(1, len(top) + 1)
    top = top[["symbol", "rank", "avg_value_proxy_60s"]]
    write_csv(top, DST / "data" / "universe" / "top100_liquidity.csv")

    # Static lists from the source delivery / source universe.
    copy_file(SRC / "data" / "universe" / "clean_union.csv", DST / "data" / "universe" / "clean_union.csv")
    copy_file(SRC / "data" / "universe" / "missing_from_tvdatafeed.csv", DST / "data" / "universe" / "missing_from_tvdatafeed.csv")
    copy_file(SRC / "data" / "universe" / "union_symbols.csv", DST / "data" / "universe" / "union_symbols.csv")

    base = pd.read_csv(SRC / "data" / "coverage" / "coverage_by_symbol.csv", low_memory=False)
    base["symbol"] = base["symbol"].astype(str).str.upper().str.strip()
    clean_set2 = set(pd.read_csv(DST / "data" / "universe" / "clean_union.csv")["symbol"].astype(str).str.upper().str.strip())
    top_set = set(top["symbol"].astype(str).str.upper().str.strip())
    all_symbols = sorted(set(base["symbol"]) | clean_set2 | top_set)
    base = base.drop_duplicates("symbol").set_index("symbol").reindex(all_symbols).reset_index()

    # Drop old coverage columns; keep official metadata and notes.
    drop_prefixes = ("1m_", "5m_", "60m_", "daily_", "bidask_")
    drop_cols = [c for c in base.columns if c.startswith(drop_prefixes)]
    drop_cols += [c for c in ["in_top100_liquidity", "top100_rank", "avg_value_proxy_60s"] if c in base.columns]
    base = base.drop(columns=drop_cols, errors="ignore")

    for tf, cov in [("1m", cov1), ("5m", cov5), ("60m", cov60)]:
        c = cov.rename(columns={
            "rows": f"{tf}_rows", "first_date": f"{tf}_first", "last_date": f"{tf}_last",
            "volume_rows": f"{tf}_volume_rows", "no_volume_rows": f"{tf}_no_volume_rows", "sources": f"{tf}_sources",
        })
        base = base.merge(c, on="symbol", how="left")

    dcov = daily.groupby("symbol", as_index=False).agg(daily_rows=("date", "size"), daily_first=("date", "min"), daily_last=("date", "max"))
    base = base.merge(dcov, on="symbol", how="left")
    b = pd.read_csv(SRC / "data" / "official" / "bidask_snapshots_2026_08_23_2026_10_01.csv.gz", usecols=["symbol", "captured_at_utc"], low_memory=False)
    b["symbol"] = b["symbol"].astype(str).str.upper().str.strip()
    b["date"] = b["captured_at_utc"].astype(str).str[:10]
    bcov = b.groupby("symbol", as_index=False).agg(bidask_rows=("date", "size"), bidask_first=("date", "min"), bidask_last=("date", "max"))
    base = base.merge(bcov, on="symbol", how="left")

    top_map = top.set_index("symbol")
    base["in_top100_liquidity"] = base["symbol"].isin(top_set).astype(int)
    base["top100_rank"] = base["symbol"].map(top_map["rank"])
    base["avg_value_proxy_60s"] = base["symbol"].map(top_map["avg_value_proxy_60s"])
    base["in_clean_union_248"] = base["symbol"].isin(clean_set2).astype(int)
    base["in_daily_323"] = base["symbol"].isin(set(daily["symbol"])).astype(int)
    if "in_halal_97" not in base.columns:
        base["in_halal_97"] = 0
    if "in_official_C" not in base.columns:
        base["in_official_C"] = 0
    base["in_halal_97"] = base["in_halal_97"].fillna(0).astype(int)
    base["in_official_C"] = base["in_official_C"].fillna(0).astype(int)

    base = base.sort_values(["in_clean_union_248", "in_official_C", "in_halal_97", "in_top100_liquidity", "symbol"], ascending=[False, False, False, False, True])
    write_csv(base, DST / "data" / "coverage" / "coverage_by_symbol.csv")
    write_csv(base, DST / "data" / "universe" / "universe_all.csv")
    write_csv(base[base["in_halal_97"] == 1].copy(), DST / "data" / "universe" / "universe_halal_97.csv")
    write_csv(base[base["in_top100_liquidity"] == 1].sort_values("top100_rank").copy(), DST / "data" / "universe" / "universe_top100_liquidity.csv")

    # Plain lists.
    write_csv(pd.DataFrame({"symbol": sorted(base["symbol"])}), DST / "data" / "universe" / "all_stocks.csv")
    write_csv(pd.DataFrame({"symbol": sorted(base.loc[base["in_official_C"] == 1, "symbol"])}), DST / "data" / "universe" / "official_c.csv")
    write_csv(pd.DataFrame({"symbol": sorted(base.loc[base["in_halal_97"] == 1, "symbol"])}), DST / "data" / "universe" / "halal.csv")

    t0 = pd.DataFrame([
        {"item": "user_target", "count": 216, "source": "user request", "note": "exact T0 list requested"},
        {"item": "official_symbolType_C", "count": int(base["in_official_C"].sum()), "source": "official EGX market watch", "note": "documented superset; exact 216 unverified"},
        {"item": "halal_97", "count": int(base["in_halal_97"].sum()), "source": "halal-symbols.txt", "note": "97 found; 98th not identified"},
        {"item": "top100_liquidity", "count": int(base["in_top100_liquidity"].sum()), "source": "filtered 60m, last 60 sessions", "note": "recomputed at cutoff"},
        {"item": "clean_union", "count": int(base["in_clean_union_248"].sum()), "source": "official C + halal + top100 + raw TV + tvdatafeed", "note": "documented superset used"},
        {"item": "with_1m", "count": int(base["1m_rows"].notna().sum()), "source": "filtered 1m coverage", "note": "at least one 1m bar"},
        {"item": "with_5m", "count": int(base["5m_rows"].notna().sum()), "source": "filtered 5m coverage", "note": "at least one 5m bar"},
        {"item": "with_60m", "count": int(base["60m_rows"].notna().sum()), "source": "filtered 60m coverage", "note": "at least one 60m bar"},
        {"item": "with_bidask", "count": int(base["bidask_rows"].notna().sum()), "source": "bid/ask history through 2026-10-01", "note": "no 2026-11-03 bid/ask"},
        {"item": "exact_216_found", "count": 0, "source": "project files, DB, web searches", "note": "not found; no 216-symbol list verified"},
    ])
    write_csv(t0, DST / "data" / "universe" / "universe_t0_attempt.csv")
    uni_summary = {
        "cutoff": CUTOFF,
        "generated_at_cairo": NOW_CAIRO,
        "all_stocks": int(len(base)),
        "clean_union_248": int(base["in_clean_union_248"].sum()),
        "official_C": int(base["in_official_C"].sum()),
        "halal_97": int(base["in_halal_97"].sum()),
        "top100": int(base["in_top100_liquidity"].sum()),
        "with_1m": int(base["1m_rows"].notna().sum()),
        "with_5m": int(base["5m_rows"].notna().sum()),
        "with_60m": int(base["60m_rows"].notna().sum()),
        "with_bidask": int(base["bidask_rows"].notna().sum()),
        "exact_t0_216": "unverified",
        "halal_98": "unresolved_97_found",
        "note": "The exact T0 216 list was not found. The 248-symbol clean union is the documented superset; coverage is reported honestly.",
    }
    (DST / "data" / "universe" / "universe_summary.json").write_text(json.dumps(uni_summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print("wrote universe", flush=True)

    # ------------------------------------------------------------------
    # Scripts (provenance) and basic docs directory
    # ------------------------------------------------------------------
    for p in sorted((ROOT / "strategy-lab").glob("*.py")):
        copy_file(p, DST / "scripts" / p.name)

    print("BUILD DONE", DST, flush=True)


if __name__ == "__main__":
    main()
