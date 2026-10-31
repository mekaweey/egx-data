# -*- coding: utf-8 -*-
"""Map official EGX disclosures to Mubasher symbols.

Mapping order:
  1. Reuters code (normalized: upper-case, strip ``.CA`` / ``_r2`` suffixes)
  2. ISIN (from the official market-watch snapshot)

Rows with neither a matched Reuters code nor a matched ISIN stay unmapped; they
are mostly market-wide notices with no company code.  No name-only guessing is
used, so a blank symbol always means "not verified", not "unknown company".
"""
from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "deliverables_2026_10_31" / "data"
OFF = DATA / "egx_official" / "egx_official_disclosures_2022_2026_2026_10_31.csv"
MW = DATA / "egx_official" / "egx_official_market_watch_2026_10_31.csv"
OUT = DATA / "egx_official"


def norm_reuters(value) -> str:
    if not isinstance(value, str):
        return ""
    x = value.strip().upper()
    x = re.sub(r"\.CA$", "", x)
    x = re.sub(r"_R\d+$", "", x)
    x = re.sub(r"[^A-Z0-9].*$", "", x)
    return x


def main() -> None:
    mw = pd.read_csv(MW)
    reuters_map: dict[str, str] = {}
    isin_map: dict[str, str] = {}
    for _, r in mw.iterrows():
        sym = str(r["symbol"]).strip().upper()
        rn = norm_reuters(r.get("reuters"))
        if rn:
            # Prefer an exact symbol/reuters match; otherwise keep the first.
            if rn not in reuters_map or rn == sym:
                reuters_map[rn] = sym
        isin = str(r.get("isin") or "").strip().upper()
        if isin:
            isin_map[isin] = sym

    cols = [
        "code",
        "published_cairo",
        "section",
        "heading",
        "heading_arabic",
        "company_name_en",
        "company_name_ar",
        "reuters_code",
        "isin",
        "url",
        "content_text",
        "content_arabic_text",
    ]
    df = pd.read_csv(OFF, usecols=cols)
    df["reuters_norm"] = df["reuters_code"].map(norm_reuters)
    df["isin_norm"] = df["isin"].fillna("").astype(str).str.strip().str.upper()
    df["symbol"] = df["reuters_norm"].map(reuters_map)
    df["mapping_method"] = "reuters"
    missing = df["symbol"].isna()
    df.loc[missing, "symbol"] = df.loc[missing, "isin_norm"].map(isin_map)
    df.loc[missing & df["symbol"].notna(), "mapping_method"] = "isin"
    df.loc[df["symbol"].isna(), "mapping_method"] = "unmapped"
    df.loc[df["symbol"].isna(), "symbol"] = ""

    compact_cols = [
        "code",
        "published_cairo",
        "section",
        "heading",
        "heading_arabic",
        "company_name_en",
        "company_name_ar",
        "reuters_code",
        "isin",
        "symbol",
        "mapping_method",
        "url",
    ]
    compact = df[compact_cols].copy()
    compact["content_chars"] = df["content_text"].fillna("").str.len()
    compact["content_arabic_chars"] = df["content_arabic_text"].fillna("").str.len()
    out_csv = OUT / "egx_official_disclosures_enriched_2022_2026_2026_10_31.csv"
    compact.to_csv(out_csv, index=False, encoding="utf-8-sig")

    # Unique mapping table for reuse.
    mapping = (
        df[["reuters_code", "reuters_norm", "isin", "isin_norm", "company_name_en", "company_name_ar", "symbol", "mapping_method"]]
        .drop_duplicates(subset=["reuters_code", "isin", "company_name_en", "company_name_ar"])
        .sort_values(["symbol", "reuters_code", "isin"])
    )
    map_csv = OUT / "egx_official_disclosures_symbol_map_2026_10_31.csv"
    mapping.to_csv(map_csv, index=False, encoding="utf-8-sig")

    # Verification for the two symbols that were missing from Mubasher news.
    checks = {}
    for sym, isin in {"GOUR": "EGS540S1C014", "AMII": "EGS3E1E1C013"}.items():
        rows = df[(df["reuters_norm"].eq(sym)) | (df["isin_norm"].eq(isin))]
        checks[sym] = {
            "official_rows": int(len(rows)),
            "mapped_symbols": sorted(rows["symbol"].dropna().unique().tolist()),
            "sections": rows["section"].value_counts().to_dict(),
            "min_date": str(rows["published_cairo"].min()) if len(rows) else None,
            "max_date": str(rows["published_cairo"].max()) if len(rows) else None,
            "ok": bool(len(rows) and set(rows["symbol"].dropna().unique()) == {sym}),
        }

    summary = {
        "rows": int(len(df)),
        "mapped_rows": int((df["mapping_method"] != "unmapped").sum()),
        "unmapped_rows": int((df["mapping_method"] == "unmapped").sum()),
        "mapping_methods": df["mapping_method"].value_counts().to_dict(),
        "unique_symbols": int(df.loc[df["symbol"].ne(""), "symbol"].nunique()),
        "unique_reuters": int(df["reuters_norm"].replace("", pd.NA).nunique()),
        "unique_isins": int(df["isin_norm"].replace("", pd.NA).nunique()),
        "market_watch_symbols": int(mw["symbol"].nunique()),
        "gour_amii_checks": checks,
        "outputs": {
            "enriched": str(out_csv),
            "symbol_map": str(map_csv),
        },
        "note": (
            "Reuters mapping is normalized and primary; ISIN is the fallback. "
            "Rows with no matched code stay blank rather than being guessed by name. "
            "The full text remains in the original disclosures CSV; the enriched "
            "file keeps key columns plus symbol/mapping_method."
        ),
        "generated_at_utc": datetime.now().astimezone().isoformat(timespec="seconds"),
    }
    (OUT / "egx_official_disclosures_enriched_summary_2026_10_31.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print("wrote", out_csv)
    print("wrote", map_csv)


if __name__ == "__main__":
    main()
