# -*- coding: utf-8 -*-
"""Add rights terms found in EGX *Listing Announcements* to the official set.

The first all-sections parser only kept rows with the structured labels
``Entitled to Rights Issue till`` / ``Subscription Price`` / ``Number of Shares
Prior...``.  Several EGX listing notices express the same terms in prose
(``issued rights amounted to ... capital increase from EGP ... to EGP ...``),
so they were missed and the rights audit labelled them ``unmatched``.

This script writes a separate, auditable addendum.  It does not overwrite the
original official-rights file.  Each row records the exact source code and the
terms source; ambiguous / restricted events are flagged in
``not_applicable_reason``.
"""
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "deliverables_2026_10_31" / "data" / "egx_official"
BASE = DATA / "official_rights_terms_all_sections_2022_2026_2026_10_31.csv"
OUT = DATA / "official_rights_terms_listing_addendum_2026_10_31.csv"
SUMMARY = DATA / "official_rights_terms_listing_addendum_summary_2026_10_31.json"


ROWS = [
    {
        "company_name": "Barbary Investment Group (BIG)",
        "isin": "EGS551D1C017",
        "reuters_code": "BIGP.CA",
        "action_type": "rights",
        "entitled_till": "2022-01-02",
        "rights_ratio_new_per_old": 2.0,
        "subscription_price": 0.10,
        "subscription_currency": "EGP",
        "shares_before": 150_820_370,
        "shares_after": 452_461_110,
        "shares_increase": 301_640_740,
        "parse_notes": (
            "Listing Announcement 218845: 301,640,740 rights; capital increase "
            "EGP 15,082,037 -> 45,246,111; par EGP 0.10 plus issuance costs "
            "EGP 0.0025; 200% of shares owned. Subscription price recorded as "
            "par 0.10 (costs not included)."
        ),
        "source_code": "218845",
        "published_cairo": "2022-01-02T11:02:04+02:00",
        "heading": "Listing the Rights Issue of Barbary Investment Group -BIG-2 (BIGP_r2.CA) Separately from the Underlying Shares of the Company",
        "section": "Listing Announcements",
        "terms_source": "official_listing_announcement",
        "not_applicable_reason": "",
    },
    {
        "company_name": "El Nasr Clothes & Textiles (Kabo)",
        "isin": "EGS33061C010",
        "reuters_code": "KABO.CA",
        "action_type": "rights",
        "entitled_till": "2025-03-17",
        "rights_ratio_new_per_old": 100_000_000 / 464_693_841,
        "subscription_price": 1.00,
        "subscription_currency": "EGP",
        "shares_before": 464_693_841,
        "shares_after": 564_693_841,
        "shares_increase": 100_000_000,
        "parse_notes": (
            "Listing Announcement 267161: 100,000,000 rights; capital increase "
            "EGP 464,693,841 -> 564,693,841; par EGP 1.00; 0.215 new share per "
            "outstanding share."
        ),
        "source_code": "267161",
        "published_cairo": "2025-03-17T09:46:43+02:00",
        "heading": "Listing the Rights Issue El Nasr Clothes & Textiles (Kabo) Separately from its Underlying Shares of the Company",
        "section": "Listing Announcements",
        "terms_source": "official_listing_announcement",
        "not_applicable_reason": "",
    },
    {
        "company_name": "Kafr El Zayat Pesticides & Chemicals",
        "isin": "EGS38411C012",
        "reuters_code": "KZPC.CA",
        "action_type": "rights",
        "entitled_till": "2023-02-26",
        "rights_ratio_new_per_old": 60_022_350 / 120_044_700,
        "subscription_price": 1.00,
        "subscription_currency": "EGP",
        "shares_before": 120_044_700,
        "shares_after": 180_067_050,
        "shares_increase": 60_022_350,
        "parse_notes": (
            "Listing Announcement 234791: 60,022,350 rights; capital increase "
            "EGP 120,044,700 -> 180,067,050; within 50% of current stake. "
            "Subscription price recorded as par EGP 1.00; Mubasher news "
            "2023-04-05 says subscriptions at EGP 1 plus fees."
        ),
        "source_code": "234791",
        "published_cairo": "2023-02-23T09:34:53+02:00",
        "heading": "Listing and Trading the Rights Issue of Kafr El Zayat Pesticides & Chemicals-2, Separately from Its Underlying Shares",
        "section": "Listing Announcements",
        "terms_source": "official_listing_announcement",
        "not_applicable_reason": "",
    },
    {
        "company_name": "El Obour Real Estate Investment",
        "isin": "EGS65551C011",
        "reuters_code": "OBRI.CA",
        "action_type": "rights",
        "entitled_till": "2024-02-26",
        "rights_ratio_new_per_old": 22_371_493 / 17_628_507,
        "subscription_price": 5.00,
        "subscription_currency": "EGP",
        "shares_before": 17_628_507,
        "shares_after": 40_000_000,
        "shares_increase": 22_371_493,
        "parse_notes": (
            "Listing Announcement 249454: 22,371,493 rights; capital increase "
            "EGP 88,142,535 -> 200,000,000; 22,371,493 shares at par EGP 5.00; "
            "paid in cash through existing shareholders."
        ),
        "source_code": "249454",
        "published_cairo": "2024-02-21T15:00:54+02:00",
        "heading": "Listing the Rights Issue Of El Obour Real Estate Investment -3, Separately from its Underlying Shares of the Company",
        "section": "Listing Announcements",
        "terms_source": "official_listing_announcement",
        "not_applicable_reason": "",
    },
    {
        "company_name": "Banque Du Caire",
        "isin": "EGS600K1C019",
        "reuters_code": "BQDC.CA",
        "action_type": "rights",
        "entitled_till": "2023-01-15",
        "rights_ratio_new_per_old": 2_375_000_000 / 2_625_000_000,
        "subscription_price": 2.00,
        "subscription_currency": "EGP",
        "shares_before": 2_625_000_000,
        "shares_after": 5_000_000_000,
        "shares_increase": 2_375_000_000,
        "parse_notes": (
            "Listing Announcement 233396: capital increase EGP 5.25bn -> 10bn; "
            "2.375bn shares at par EGP 2.00 paid in cash through existing "
            "shareholders. No Mubasher daily prices for BQDC, so no adjustment "
            "can be tested."
        ),
        "source_code": "233396",
        "published_cairo": "2023-01-11T09:50:19+02:00",
        "heading": "Capital Increase for Banque Du Caire (BQDC.CA)",
        "section": "Listing Announcements",
        "terms_source": "official_listing_announcement",
        "not_applicable_reason": "",
    },
    {
        "company_name": "Bonyan for Development and Trade",
        "isin": "EGS656M1C010",
        "reuters_code": "BONY.CA",
        "action_type": "rights",
        "entitled_till": "2025-11-16",
        "rights_ratio_new_per_old": 50_403_226 / 1_654_000_000,
        "subscription_price": 4.96,
        "subscription_currency": "EGP",
        "shares_before": 1_654_000_000,
        "shares_after": 1_704_403_226,
        "shares_increase": 50_403_226,
        "parse_notes": (
            "Listing Announcement 279036: capital increase EGP 1,654,000,000 -> "
            "1,704,403,226; 50,403,226 shares at EGP 4.96; subscription restricted "
            "to shareholders who sold at the offering; non-selling holders waived "
            "preemptive rights. Subscription price 4.96 is above the cum close "
            "3.85, so the theoretical factor is out of the money; no adjustment."
        ),
        "source_code": "279036",
        "published_cairo": "2025-11-13T10:27:23+02:00",
        "heading": "Cash Capital Increase for Bonyan for Development and Trade",
        "section": "Listing Announcements",
        "terms_source": "official_listing_announcement",
        "not_applicable_reason": "restricted_offering_non_selling_shareholders_waived",
    },
    {
        "company_name": "QALA For Financial Investments",
        "isin": "EGS73541C012",
        "reuters_code": "CCAP.CA",
        "action_type": "rights",
        "entitled_till": "2025-08-20",
        "rights_ratio_new_per_old": 2_800_000_000 / 1_820_000_000,
        "subscription_price": 5.00,
        "subscription_currency": "EGP",
        "shares_before": 1_820_000_000,
        "shares_after": 4_620_000_000,
        "shares_increase": 2_800_000_000,
        "parse_notes": (
            "FRA release 274476 says the subscription right is for holders until "
            "20/08/2025; the 9.5 MB prospectus is not accessible from the blocked "
            "old EGX domain. Mubasher news 2025-08-12/20 reports 2.8bn rights "
            "(2.18bn common + 618.05m preferred) at EGP 5.00; the exchange later "
            "decided not to trade the rights because the market price was not "
            "above the subscription price. Cum close 2.75 < 5.00, so the factor "
            "is out of the money; no adjustment. Ratio shown is total rights / "
            "common shares before and is not used to adjust because OTM."
        ),
        "source_code": "274476",
        "published_cairo": "2025-08-12T15:27:43+03:00",
        "heading": "QALA For Financial Investments (CCAP.CA - CCAPP.CA) - Release from FRA",
        "section": "General",
        "terms_source": "official_listing_announcement+mubasher_news",
        "not_applicable_reason": "",
    },
]


def main() -> None:
    base = pd.read_csv(BASE)
    cols = list(base.columns)
    add = pd.DataFrame(ROWS)
    for c in cols:
        if c not in add.columns:
            add[c] = None
    add = add[cols + [c for c in ["terms_source", "not_applicable_reason"] if c not in cols]]
    add.to_csv(OUT, index=False, encoding="utf-8-sig")

    summary = {
        "addendum_rows": int(len(add)),
        "symbols": sorted(add["reuters_code"].tolist()),
        "sections": add["section"].value_counts().to_dict(),
        "terms_sources": add["terms_source"].value_counts().to_dict(),
        "not_applicable": int(add["not_applicable_reason"].fillna("").ne("").sum()),
        "source_base": str(BASE),
        "output": str(OUT),
        "note": (
            "Rights terms recovered from EGX Listing Announcements / FRA releases "
            "that the structured all-sections parser missed. Each row cites its "
            "source code. Rows with not_applicable_reason are not used to adjust "
            "prices. The original official-rights file is not modified."
        ),
        "generated_at_utc": datetime.now().astimezone().isoformat(timespec="seconds"),
    }
    SUMMARY.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print("wrote", OUT)


if __name__ == "__main__":
    main()
