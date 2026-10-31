# -*- coding: utf-8 -*-
"""Build the 2026-10-31 delivery folder inside the egx-data repository.

Copies the new, non-duplicate datasets into a clean top-level folder, gzips the
large CSV/JSON files, and writes MANIFEST.csv, README.md and CHECKLIST.md.
The source package remains untouched in `deliverables_2026_10_31`.

Run from the project root:
    python deliverables_2026_10_31/scripts/build_delivery_repo_2026_10_31.py
"""
from __future__ import annotations

import csv
import gzip
import hashlib
import json
import shutil
from datetime import datetime
from pathlib import Path

import pandas as pd
import pyarrow.parquet as pq

PROJECT = Path(__file__).resolve().parents[2]
SRC = PROJECT / "deliverables_2026_10_31"
REPO = SRC / "egx_data_repo"
DST = REPO / "delivery_2026_10_31"

# (source relative to SRC, destination relative to DST, gzip?, note)
FILES: list[tuple[str, str, bool, str]] = [
    # --- open_valid ---
    ("data/daily_open_valid_full_2026_10_31.parquet", "data/open_valid/daily_open_valid_full_2026_10_31.parquet", False, "open_valid panel, 257,663 rows x 40 cols"),
    ("data/open_suspicious_222_candidates_2026_10_31.csv", "data/open_valid/open_suspicious_222_candidates_2026_10_31.csv", False, "222 closest suspicious cases with reason/severity"),
    ("data/open_suspicious_222_candidates_with_reason_detail_2026_10_31.csv", "data/open_valid/open_suspicious_222_candidates_with_reason_detail_2026_10_31.csv", False, "222 cases with derived reason_detail (side, OHLC repair, no raw/true diff)"),
    ("reports/open_valid_report_2026_10_31.md", "reports/open_valid_report_2026_10_31.md", False, "open_valid method and counts"),
    # --- corporate actions ---
    ("data/corporate_actions_unified_2022_2026_2026_10_31.csv", "data/corporate_actions/corporate_actions_unified_2022_2026_2026_10_31.csv", False, "1,066 unified actions 2022-2026"),
    ("data/corporate_actions_unified_all_2026_10_31.csv", "data/corporate_actions/corporate_actions_unified_all_2026_10_31.csv", False, "6,506 unified actions, full history"),
    ("data/egx_adjusted_prices_2022_2026_2026_10_31.parquet", "data/corporate_actions/egx_adjusted_prices_2022_2026_2026_10_31.parquet", False, "adjusted price series, 257,663 rows"),
    ("data/mubasher_daily_rights_adjusted_2022_2026_2026_10_31.parquet", "data/corporate_actions/mubasher_daily_rights_adjusted_2022_2026_2026_10_31.parquet", False, "Mubasher daily with rights adjustment, 250,154 rows"),
    ("data/rights_adjustment_factors_2022_2026_2026_10_31.csv", "data/corporate_actions/rights_adjustment_factors_2022_2026_2026_10_31.csv", False, "rights adjustment factors"),
    ("data/rights_adjustment_summary_2026_10_31.json", "data/corporate_actions/rights_adjustment_summary_2026_10_31.json", False, "rights adjustment summary"),
    ("data/rights_adjustment_validation_2026_10_31.csv", "data/corporate_actions/rights_adjustment_validation_2026_10_31.csv", False, "rights adjustment validation"),
    ("data/rights_unmatched_evidence_2026_10_31.csv", "data/corporate_actions/rights_unmatched_evidence_2026_10_31.csv", False, "unmatched rights evidence"),
    ("data/mubasher_corporate_actions_2026_10_31.csv", "data/corporate_actions/mubasher_corporate_actions_2026_10_31.csv", False, "Mubasher corporate actions"),
    ("data/mubasher_capital_increase_2026_10_31.csv", "data/corporate_actions/mubasher_capital_increase_2026_10_31.csv", False, "Mubasher capital increases"),
    ("data/mubasher_corporate_actions_raw_2026_10_31.json", "data/corporate_actions/mubasher_corporate_actions_raw_2026_10_31.json.gz", True, "raw Mubasher corporate actions JSON"),
    ("reports/corporate_actions_report_2026_10_31.md", "reports/corporate_actions_report_2026_10_31.md", False, "corporate actions report"),
    ("reports/rights_adjustment_2026_10_31.md", "reports/rights_adjustment_2026_10_31.md", False, "rights adjustment report"),
    # --- existing per-symbol news package ---
    ("news/mubasher_news_full_2026_10_31.csv.gz", "data/news/mubasher_full/mubasher_news_full_2026_10_31.csv.gz", False, "23,573 symbol-news rows (gzip)"),
    ("news/mubasher_news_unique_2026_10_31.csv.gz", "data/news/mubasher_full/mubasher_news_unique_2026_10_31.csv.gz", False, "22,357 unique articles (gzip)"),
    ("news/mubasher_news_symbol_links_2026_10_31.csv", "data/news/mubasher_full/mubasher_news_symbol_links_2026_10_31.csv.gz", True, "article-symbol links"),
    ("news/mubasher_news_parts_corrected_2026_10_31.zip", "data/news/mubasher_full/mubasher_news_parts_corrected_2026_10_31.zip", False, "252 per-symbol CSVs (zip)"),
    ("news/news_readme_ar.md", "data/news/mubasher_full/news_readme_ar.md", False, "Arabic news README"),
    ("news/news_metadata_2026_10_31.json", "data/news/mubasher_full/news_metadata_2026_10_31.json", False, "news metadata"),
    ("news/news_category_counts_2026_10_31.csv", "data/news/mubasher_full/news_category_counts_2026_10_31.csv", False, "category counts"),
    ("news/news_symbol_coverage_2026_10_31.csv", "data/news/mubasher_full/news_symbol_coverage_2026_10_31.csv", False, "symbol coverage"),
    ("news/news_year_counts_2026_10_31.csv", "data/news/mubasher_full/news_year_counts_2026_10_31.csv", False, "year counts"),
    ("news/news_symbols_2026_10_31.txt", "data/news/mubasher_full/news_symbols_2026_10_31.txt", False, "symbol list"),
    ("news/requested_symbols_2026_10_31.txt", "data/news/mubasher_full/requested_symbols_2026_10_31.txt", False, "requested symbols"),
    ("news/verification_vs_old_snapshot_2026_10_31.csv", "data/news/mubasher_full/verification_vs_old_snapshot_2026_10_31.csv.gz", True, "verification vs old snapshot"),
    # --- official EGX ---
    ("data/egx_official/egx_official_disclosures_2022_2026_2026_10_31.csv.gz", "data/official/egx_official_disclosures_2022_2026_2026_10_31.csv.gz", False, "72,056 official disclosures 2022-2026 (gzip)"),
    ("data/egx_official/egx_official_disclosures_enriched_2022_2026_2026_10_31.csv", "data/official/egx_official_disclosures_enriched_2022_2026_2026_10_31.csv.gz", True, "enriched official disclosures"),
    ("data/egx_official/egx_official_disclosures_symbol_map_2026_10_31.csv", "data/official/egx_official_disclosures_symbol_map_2026_10_31.csv", False, "disclosure-symbol map"),
    ("data/egx_official/egx_official_market_watch_2026_10_31.csv", "data/official/egx_official_market_watch_2026_10_31.csv", False, "official market watch"),
    ("data/egx_official/official_corporate_actions_with_fx_2022_2026_2026_10_31.csv", "data/official/official_corporate_actions_with_fx_2022_2026_2026_10_31.csv", False, "697 official actions with FX enrichment"),
    ("data/egx_official/official_rights_terms_all_sections_2022_2026_2026_10_31.csv", "data/official/official_rights_terms_all_sections_2022_2026_2026_10_31.csv", False, "rights terms, all sections"),
    ("data/egx_official/official_rights_terms_listing_addendum_2026_10_31.csv", "data/official/official_rights_terms_listing_addendum_2026_10_31.csv", False, "rights listing addendum"),
    ("data/egx_official/official_trading_notices_parsed_2022_2026_2026_10_31.csv", "data/official/official_trading_notices_parsed_2022_2026_2026_10_31.csv", False, "979 trading notices parsed"),
    ("data/egx_official/official_event_study_trades_2026_10_31.csv", "data/official/official_event_study_trades_2026_10_31.csv.gz", True, "24,181 event-study trades"),
    ("data/egx_official/official_event_study_summary_2026_10_31.csv", "data/official/official_event_study_summary_2026_10_31.csv", False, "event study summary"),
    ("data/egx_official/official_event_study_key_results_2026_10_31.csv", "data/official/official_event_study_key_results_2026_10_31.csv", False, "event study key results"),
    ("data/egx_official/official_event_study_summary_2026_10_31.json", "data/official/official_event_study_summary_2026_10_31.json", False, "event study summary JSON"),
    ("data/egx_official/official_trading_notices_impact_2026_10_31.json", "data/official/official_trading_notices_impact_2026_10_31.json", False, "trading notice impact"),
    ("data/egx_official/official_trading_notices_summary_2026_10_31.json", "data/official/official_trading_notices_summary_2026_10_31.json", False, "trading notice summary"),
    ("data/egx_official/official_corporate_actions_summary_2026_10_31.json", "data/official/official_corporate_actions_summary_2026_10_31.json", False, "official actions summary"),
    ("data/egx_official/official_rights_terms_all_sections_summary_2026_10_31.json", "data/official/official_rights_terms_all_sections_summary_2026_10_31.json", False, "rights summary"),
    ("data/egx_official/official_rights_terms_listing_addendum_summary_2026_10_31.json", "data/official/official_rights_terms_listing_addendum_summary_2026_10_31.json", False, "rights addendum summary"),
    ("data/egx_official/egx_official_disclosures_summary_2026_10_31.json", "data/official/egx_official_disclosures_summary_2026_10_31.json", False, "disclosures summary"),
    ("data/egx_official/egx_official_disclosures_enriched_summary_2026_10_31.json", "data/official/egx_official_disclosures_enriched_summary_2026_10_31.json", False, "enriched disclosures summary"),
    ("data/egx_official/official_cash_dividend_fx_summary_2026_10_31.json", "data/official/official_cash_dividend_fx_summary_2026_10_31.json", False, "cash dividend FX summary"),
    ("data/egx_official/egx_official_market_watch_summary_2026_10_31.json", "data/official/egx_official_market_watch_summary_2026_10_31.json", False, "market watch summary"),
    ("reports/official_event_study_2026_10_31.md", "reports/official_event_study_2026_10_31.md", False, "official event study report"),
    ("reports/trading_notices_2026_10_31.md", "reports/trading_notices_2026_10_31.md", False, "trading notices report"),
    # --- Mubasher daily / intraday / snapshots ---
    ("data/mubasher/mubasher_daily_raw_2022_2026_2026_10_31.parquet", "data/mubasher/mubasher_daily_raw_2022_2026_2026_10_31.parquet", False, "250,154 daily rows"),
    ("data/mubasher/mubasher_intraday_1m_latest_2026_10_31.parquet", "data/mubasher/mubasher_intraday_1m_latest_2026_10_31.parquet", False, "32,184 latest 1m bars"),
    ("data/mubasher/mubasher_snapshots_2026_10_29.csv", "data/mubasher/mubasher_snapshots_2026_10_29.csv", False, "1,346 snapshots at 6 times"),
    ("data/mubasher/mubasher_snapshots_stale_symbols_2026_10_29.csv", "data/mubasher/mubasher_snapshots_stale_symbols_2026_10_29.csv", False, "stale snapshot symbols"),
    ("data/mubasher/mubasher_symbol_links_2026_10_31.csv", "data/mubasher/mubasher_symbol_links_2026_10_31.csv", False, "Mubasher symbol links"),
    ("data/mubasher/mubasher_daily_intraday_summary_2026_10_31.json", "data/mubasher/mubasher_daily_intraday_summary_2026_10_31.json", False, "Mubasher summary"),
    ("data/snapshots/snapshots_master.csv", "data/snapshots/snapshots_master.csv", False, "closed-market snapshot master"),
    ("data/snapshots/snapshot_closed_20261031_*.csv", "data/snapshots/snapshot_closed_20261031.csv", False, "closed snapshot 2026-10-31"),
    # --- macro / sectors / limits / spread ---
    ("data/macro_daily_2022_2026_2026_10_31.csv", "data/macro/macro_daily_2022_2026_2026_10_31.csv", False, "USD/gold/Brent/S&P 500/VIX/US10Y/DXY"),
    ("data/macro_egx_aligned_2026_10_31.csv", "data/macro/macro_egx_aligned_2026_10_31.csv", False, "macro aligned to EGX sessions"),
    ("data/sector_map_full_2026_10_31.csv", "data/sectors/sector_map_full_2026_10_31.csv", False, "318-symbol sector map"),
    ("data/sector_map_news_symbols_2026_10_31.csv", "data/sectors/sector_map_news_symbols_2026_10_31.csv", False, "news-symbol sector map (250)"),
    ("data/sector_map_news_symbols_252_2026_10_31.csv", "data/sectors/sector_map_news_symbols_252_2026_10_31.csv", False, "complete 252-symbol sector map (AIHC/HCFI unclassified)"),
    ("data/limits_halts_2022_2026_2026_10_31.csv", "data/limits_halts/limits_halts_2022_2026_2026_10_31.csv.gz", True, "257,663 rows of limits/halts flags"),
    ("data/spread_cs_daily_2022_2026_2026_10_30.parquet", "data/spread/spread_cs_daily_2022_2026_2026_10_30.parquet", False, "Corwin-Schultz daily spread, 261,324 rows"),
    ("data/bidask_spread_summary_2026_10_30.csv", "data/spread/bidask_spread_summary_2026_10_30.csv", False, "measured bid/ask spread summary"),
    # --- earnings / insider / announcements ---
    ("data/mubasher_earnings_2026_10_31.csv", "data/earnings/mubasher_earnings_2026_10_31.csv", False, "11,500 earnings rows"),
    ("data/mubasher_insider_trades_2026_10_31.csv", "data/earnings/mubasher_insider_trades_2026_10_31.csv", False, "4,000 insider/tahweel rows"),
    ("data/mubasher_earnings_insider_raw_2026_10_31.json", "data/earnings/mubasher_earnings_insider_raw_2026_10_31.json.gz", True, "raw earnings/insider JSON"),
    ("data/mubasher_market_announcements_2026_10_31.csv", "data/announcements/mubasher_market_announcements_2026_10_31.csv", False, "2,586 market announcements"),
    # --- real trades template (no personal data) ---
    ("real_trades_template.csv", "data/real_trades/real_trades_template.csv", False, "empty template for the owner's 5-10 real trades"),
    # --- reference / checks ---
    ("data/free_source_checks_2026_10_31.json", "data/reference/free_source_checks_2026_10_31.json", False, "free-source availability checks"),
    ("verification_summary_2026_10_31.json", "data/reference/verification_summary_2026_10_31.json", False, "counts/date ranges recomputed from the delivered files"),
    ("reports/free_source_checks_2026_10_31.md", "reports/free_source_checks_2026_10_31.md", False, "free-source checks report"),
    ("reports/REALISM_CONTRACT.md", "docs/REALISM_CONTRACT.md", False, "realism contract"),
]

# Pulse files, added only when the scrape has produced them.
PULSE_FILES: list[tuple[str, str, bool, str]] = [
    ("pulse_news_2026_10_31/pulse_articles_full.csv", "data/news/pulse_2025_2026/pulse_articles_full.csv", False, "full text + symbols for every pulse article (5,515)"),
    ("pulse_news_2026_10_31/pulse_article_symbols.csv", "data/news/pulse_2025_2026/pulse_article_symbols.csv", False, "article-symbol links (5,805)"),
    ("pulse_news_2026_10_31/pulse_cards_pages_1_222.csv", "data/news/pulse_2025_2026/pulse_cards_pages_1_222.csv", False, "raw cards pages 1..221 (5,515)"),
    ("pulse_news_2026_10_31/pulse_article_errors.csv", "data/news/pulse_2025_2026/pulse_article_errors.csv", False, "failed article fetches (0)"),
    ("pulse_news_2026_10_31/pulse_articles_range_2025_06_18_to_2026_10_28.csv", "data/news/pulse_2025_2026/pulse_articles_range_2025_06_18_to_2026_10_28.csv", False, "filtered owner range (5,486)"),
    ("pulse_news_2026_10_31/pulse_range_summary_2026_10_31.json", "data/news/pulse_2025_2026/pulse_range_summary_2026_10_31.json", False, "range summary"),
]


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def count_rows(path: Path) -> str:
    try:
        if path.suffix == ".parquet":
            return str(pq.ParquetFile(path).metadata.num_rows)
        if path.suffix == ".gz" and path.with_suffix("").suffix == ".csv":
            with gzip.open(
                path, "rt", encoding="utf-8-sig", errors="replace", newline=""
            ) as f:
                return str(max(0, sum(1 for _ in csv.reader(f)) - 1))
        if path.suffix == ".csv":
            with path.open(
                encoding="utf-8-sig", errors="replace", newline=""
            ) as f:
                return str(max(0, sum(1 for _ in csv.reader(f)) - 1))
        if path.suffix == ".zip":
            import zipfile

            with zipfile.ZipFile(path) as z:
                return str(len(z.namelist()))
    except Exception as e:
        return f"ERR:{e}"
    return "-"


def gzip_copy(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    with src.open("rb") as fi, gzip.GzipFile(
        filename="", mode="wb", fileobj=dst.open("wb"), mtime=0
    ) as fo:
        shutil.copyfileobj(fi, fo, length=1024 * 1024)


def copy_one(src_rel: str, dst_rel: str, do_gzip: bool, note: str) -> dict | None:
    src = SRC / src_rel
    if not src.exists():
        # Support a glob in the source name (only one match expected).
        matches = list(SRC.glob(src_rel))
        if len(matches) == 1:
            src = matches[0]
        else:
            print(f"MISSING: {src_rel}")
            return None
    dst = DST / dst_rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    if do_gzip:
        if not dst.exists() or dst.stat().st_mtime < src.stat().st_mtime:
            gzip_copy(src, dst)
    else:
        if not dst.exists() or dst.stat().st_size != src.stat().st_size:
            shutil.copy2(src, dst)
    return {
        "path": dst_rel.replace("\\", "/"),
        "bytes": dst.stat().st_size,
        "rows": count_rows(dst),
        "sha256": sha256(dst),
        "note": note,
    }


def main() -> None:
    DST.mkdir(parents=True, exist_ok=True)
    for d in [
        "data/open_valid",
        "data/corporate_actions",
        "data/news/mubasher_full",
        "data/news/pulse_2025_2026",
        "data/official",
        "data/mubasher",
        "data/snapshots",
        "data/macro",
        "data/sectors",
        "data/limits_halts",
        "data/spread",
        "data/earnings",
        "data/announcements",
        "data/real_trades",
        "data/reference",
        "scripts",
        "reports",
        "docs",
    ]:
        (DST / d).mkdir(parents=True, exist_ok=True)

    rows: list[dict] = []
    for src_rel, dst_rel, do_gzip, note in FILES + PULSE_FILES:
        r = copy_one(src_rel, dst_rel, do_gzip, note)
        if r:
            rows.append(r)

    # Copy all scripts and reports (small, reproducible).
    for folder, dest in [("scripts", "scripts"), ("reports", "reports")]:
        src_dir = SRC / folder
        for p in sorted(src_dir.rglob("*")):
            if not p.is_file():
                continue
            if "__pycache__" in p.parts or p.suffix.lower() in {
                ".pyc",
                ".log",
                ".tmp",
                ".out",
            }:
                continue
            rel = p.relative_to(src_dir)
            dst = DST / dest / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            if not dst.exists() or dst.stat().st_size != p.stat().st_size:
                shutil.copy2(p, dst)
            rows.append(
                {
                    "path": f"{dest}/{rel.as_posix()}",
                    "bytes": dst.stat().st_size,
                    "rows": count_rows(dst),
                    "sha256": sha256(dst),
                    "note": f"{folder} file",
                }
            )

    # Delivery-level docs (already written, not copied from the source package).
    doc_paths = [DST / "README.md", DST / "CHECKLIST.md"]
    docs_dir = DST / "docs"
    if docs_dir.exists():
        doc_paths.extend(sorted(p for p in docs_dir.iterdir() if p.is_file()))
    for p in doc_paths:
        if p.is_file():
            rows.append(
                {
                    "path": p.relative_to(DST).as_posix(),
                    "bytes": p.stat().st_size,
                    "rows": count_rows(p),
                    "sha256": sha256(p),
                    "note": "delivery documentation",
                }
            )

    # Deduplicate manifest paths, keeping the first.
    seen: set[str] = set()
    unique_rows: list[dict] = []
    for r in rows:
        if r["path"] in seen:
            continue
        seen.add(r["path"])
        unique_rows.append(r)
    unique_rows.sort(key=lambda r: r["path"])

    with (DST / "MANIFEST.csv").open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["path", "bytes", "rows", "sha256", "note"])
        w.writeheader()
        w.writerows(unique_rows)

    total_bytes = sum(int(r["bytes"]) for r in unique_rows)
    print(f"files={len(unique_rows)} total={total_bytes/(1024*1024):.1f} MiB")
    print(f"manifest={DST/'MANIFEST.csv'}")


if __name__ == "__main__":
    main()
