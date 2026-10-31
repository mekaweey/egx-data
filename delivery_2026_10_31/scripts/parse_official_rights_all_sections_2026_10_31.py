# -*- coding: utf-8 -*-
"""Parse rights-issue terms from *all* official EGX disclosure sections.

The official ``Corporate Actions`` section only contains a subset of rights
issues.  Many companies publish the same structured terms under ``General`` or
``Listing Announcements`` (subscription price, shares before/increase, entitled
date).  This script scans every disclosure row for those labels and keeps only
rows with the complete term set, so the rights adjustment can use primary-source
terms instead of guessing.
"""
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

import pandas as pd

from parse_official_corporate_actions_2026_10_31 import clean, parse_text

ROOT = Path(__file__).resolve().parents[2]
INP = ROOT / "deliverables_2026_10_31" / "data" / "egx_official" / "egx_official_disclosures_2022_2026_2026_10_31.csv"
OUT = ROOT / "deliverables_2026_10_31" / "data" / "egx_official"


def main() -> None:
    df = pd.read_csv(
        INP,
        usecols=[
            "code",
            "published_cairo",
            "heading",
            "heading_arabic",
            "section",
            "company_name_en",
            "company_name_ar",
            "isin",
            "reuters_code",
            "content_text",
            "content_arabic_text",
        ],
    )
    # Cheap pre-filter before the full parser: the structured labels are unique
    # enough that this avoids running 72k regex-heavy parses.
    mask = (
        df["content_text"].fillna("").str.contains("Entitled to Rights Issue", case=False, regex=False)
        | df["content_text"].fillna("").str.contains("Subscription Price", case=False, regex=False)
        | df["content_arabic_text"].fillna("").str.contains("اكتتاب", regex=False)
    )
    cand = df[mask].copy()
    rows = []
    for _, r in cand.iterrows():
        parsed = parse_text(r.get("content_text", ""))
        if parsed["action_type"] != "rights":
            continue
        # Require the complete term set; otherwise the factor would be guessed.
        if not (
            parsed["entitled_till"]
            and parsed["subscription_price"] is not None
            and parsed["shares_before"] is not None
            and parsed["shares_increase"] is not None
        ):
            continue
        parsed.update(
            {
                "source_code": r.get("code"),
                "published_cairo": r.get("published_cairo"),
                "heading": r.get("heading"),
                "heading_arabic": r.get("heading_arabic"),
                "section": r.get("section"),
                "source_company_name_en": r.get("company_name_en"),
                "source_company_name_ar": r.get("company_name_ar"),
                "source_isin": r.get("isin"),
                "source_reuters_code": r.get("reuters_code"),
                "content_text": r.get("content_text"),
            }
        )
        if not parsed["isin"]:
            parsed["isin"] = clean(r.get("isin"))
        if not parsed["reuters_code"]:
            parsed["reuters_code"] = clean(r.get("reuters_code"))
        rows.append(parsed)

    res = pd.DataFrame(rows)
    # Drop exact duplicates caused by the same disclosure being repeated in
    # multiple sections, keeping the earliest publication.
    if len(res):
        res["published"] = pd.to_datetime(
            res["published_cairo"], errors="coerce", utc=True
        ).dt.tz_convert("Africa/Cairo").dt.tz_localize(None)
        res = (
            res.sort_values("published")
            .drop_duplicates(
                subset=[
                    "reuters_code",
                    "isin",
                    "entitled_till",
                    "subscription_price",
                    "shares_before",
                    "shares_increase",
                ],
                keep="first",
            )
            .drop(columns=["published"])
        )
    res = res.sort_values(["entitled_till", "reuters_code"]).reset_index(drop=True)
    out_path = OUT / "official_rights_terms_all_sections_2022_2026_2026_10_31.csv"
    res.to_csv(out_path, index=False, encoding="utf-8-sig")
    summary = {
        "candidate_rows_with_labels": int(len(cand)),
        "complete_rights_rows": int(len(res)),
        "symbols": int(res["reuters_code"].fillna("").replace("", pd.NA).nunique()),
        "sections": res["section"].value_counts().to_dict(),
        "date_min": str(res["entitled_till"].min()) if len(res) else None,
        "date_max": str(res["entitled_till"].max()) if len(res) else None,
        "source": str(INP),
        "note": "Rights terms parsed from all official EGX sections; only complete term sets kept.",
        "generated_at_utc": datetime.now().astimezone().isoformat(timespec="seconds"),
    }
    (OUT / "official_rights_terms_all_sections_summary_2026_10_31.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print("wrote", out_path)


if __name__ == "__main__":
    main()
