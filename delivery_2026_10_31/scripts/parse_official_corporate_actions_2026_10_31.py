# -*- coding: utf-8 -*-
"""Parse official EGX Corporate Actions disclosures into structured terms.

The official beta disclosures contain the exact rights subscription price,
share counts, stock-dividend ratio and ex-dates.  This script turns the
free-text English/Arabic disclosure into one row per action so the rights and
bonus adjustments can be rebuilt from primary-source terms.

It does not guess missing terms.  Unparsed fields stay blank and are counted.
"""
from __future__ import annotations

import argparse
import json
import re
from datetime import datetime
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_IN = ROOT / "deliverables_2026_10_31" / "data" / "egx_official" / "egx_official_disclosures_2022_2026_2026_10_31.csv"
DEFAULT_OUT = ROOT / "deliverables_2026_10_31" / "data" / "egx_official"


def clean(value) -> str:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def parse_date(text: str, labels: list[str]) -> str:
    for label in labels:
        # Allow short intervening words, e.g. "Beginning Date Of Subscription
        # to Rights Issue : 18/10/2026".
        m = re.search(label + r"[^0-9]{0,80}(\d{1,2}/\d{1,2}/\d{4})", text, re.I)
        if m:
            try:
                return datetime.strptime(m.group(1), "%d/%m/%Y").date().isoformat()
            except ValueError:
                return ""
    return ""


def parse_num(text: str, labels: list[str]) -> float | None:
    for label in labels:
        m = re.search(label + r"\s*:?\s*(?:EGP|USD|LE|L\.E\.?)?\s*([\d,]+(?:\.\s*\d+)?)", text, re.I)
        if m:
            try:
                return float(re.sub(r"[\s,]", "", m.group(1)))
            except ValueError:
                return None
    return None


def parse_text(text: str) -> dict:
    t = clean(text)
    out = {
        "company_name": "",
        "isin": "",
        "reuters_code": "",
        "action_type": "",
        "ex_date": "",
        "ex_date_source": "",
        "record_date": "",
        "payment_date": "",
        "listing_date": "",
        "distribution_date": "",
        "entitled_till": "",
        "subscription_start": "",
        "subscription_end": "",
        "cash_dividend_per_share": None,
        "stock_dividend_ratio": None,
        "rights_ratio_new_per_old": None,
        "subscription_price": None,
        "subscription_currency": "",
        "shares_before": None,
        "shares_after": None,
        "shares_increase": None,
        "coupon_no": "",
        "parse_notes": "",
    }
    m = re.search(r"Company\s*Name\s*:?\s*(.+?)\s+ISIN", t, re.I)
    if not m:
        m = re.search(r"^Name\s*:?\s*(.+?)\s+ISIN", t, re.I)
    if m:
        out["company_name"] = m.group(1).strip(" :;-")
    m = re.search(r"ISIN\s*Code\s*:?\s*([A-Z]{2}[A-Z0-9]{9}[0-9])", t, re.I)
    if m:
        out["isin"] = m.group(1).upper()
    m = re.search(r"Reuters\s*Code\s*:?\s*([A-Z0-9]+\.CA)", t, re.I)
    if not m:
        m = re.search(r"Stock\s*Symbol\s*\(ticker\)\s*:?\s*([A-Z0-9]+\.CA)", t, re.I)
    if m:
        out["reuters_code"] = m.group(1).upper()

    out["ex_date"] = parse_date(t, [r"Ex[-\s]*Dividend\s*Date", r"Ex[-\s]*Rights\s*Date"])
    if out["ex_date"]:
        out["ex_date_source"] = "explicit"
    out["record_date"] = parse_date(t, [r"Dividend\s*\(Due\)\s*Date", r"Record\s*Date", r"Entitled\s*Date"])
    out["payment_date"] = parse_date(t, [r"Payment\s*Date"])
    out["listing_date"] = parse_date(t, [r"Listing\s*Date"])
    out["distribution_date"] = parse_date(t, [r"Distribution\s*Date"])
    out["entitled_till"] = parse_date(t, [r"Entitled\s*to\s*Rights\s*Issue\s*till"])
    out["subscription_start"] = parse_date(t, [r"Beginning\s*Date\s*Of\s*Subscription"])
    out["subscription_end"] = parse_date(t, [r"Ending\s*Date\s*of\s*Subscription"])
    out["coupon_no"] = ""
    m = re.search(r"Coupon\s*No\.?\s*:?\s*([A-Za-z0-9/-]+)", t, re.I)
    if m:
        out["coupon_no"] = m.group(1)

    if re.search(r"Rights\s*Issue|Subscription\s*Price|Rights?\s*Offering", t, re.I):
        out["action_type"] = "rights"
        out["subscription_price"] = parse_num(t, [r"Subscription\s*Price"])
        m = re.search(r"Subscription\s*Price\s*:?\s*(EGP|USD|LE|L\.E\.?)", t, re.I)
        if m:
            out["subscription_currency"] = "EGP" if m.group(1).upper() in {"LE", "L.E.", "L.E"} else m.group(1).upper()
        out["shares_before"] = parse_num(t, [r"Number\s*of\s*Shares\s*Prior\s*to\s*Rights?\s*Offering"])
        out["shares_after"] = parse_num(t, [r"Number\s*of\s*Shares\s*Pursuant\s*to\s*Rights?\s*Offering"])
        out["shares_increase"] = parse_num(t, [r"Number\s*of\s*Shares\s*Increased"])
        if out["shares_before"] and out["shares_increase"] is not None:
            out["rights_ratio_new_per_old"] = out["shares_increase"] / out["shares_before"]
    elif re.search(r"Stock\s*Dividends|Share\s*for\s*each\s*Underlying\s*Share", t, re.I):
        out["action_type"] = "stock_dividend"
        m = re.search(r"Dividend\s*:?\s*([\d.]+)\s*Share\s*for\s*each\s*Underlying\s*Share", t, re.I)
        if m:
            out["stock_dividend_ratio"] = float(m.group(1))
        if not out["ex_date"]:
            out["ex_date"] = parse_date(t, [r"Dividend\s*Date"])
            if out["ex_date"]:
                out["ex_date_source"] = "dividend_date"
    elif re.search(r"Cash\s*Dividends|Dividend\s*per\s*Share", t, re.I):
        out["action_type"] = "cash_dividend"
        # Official notices use several phrasings.  USD/Dollar amounts are
        # deliberately not stored in this EGP-denominated field; they remain
        # missing and are documented rather than mixed with EGP values.
        out["cash_dividend_per_share"] = parse_num(
            t,
            [
                r"Dividend\s*per\s*Share\s*first\s*installment",
                r"Dividend\s*per\s*EGP\s*Share",
                r"Dividend\s*per\s*Share",
                r"Coupon\s*Value",
            ],
        )
        if not out["ex_date"]:
            # Some official cash-dividend notices say "Dividend Date" instead
            # of "Ex-Dividend Date".  In the EGX notices the "Dividend Date"
            # is the last cum date; the ex-date is the next trading day.
            out["ex_date"] = parse_date(t, [r"Dividend\s*Date"])
            if out["ex_date"]:
                out["ex_date_source"] = "dividend_date"
    elif re.search(r"Split|Stock\s*Split", t, re.I):
        out["action_type"] = "split"
    else:
        out["action_type"] = "other"

    missing = []
    if not out["isin"]:
        missing.append("isin")
    if not out["reuters_code"]:
        missing.append("reuters_code")
    if out["action_type"] == "rights":
        for key in ["subscription_price", "shares_before", "shares_increase", "entitled_till"]:
            if out[key] in (None, ""):
                missing.append(key)
    elif out["action_type"] == "stock_dividend":
        if out["stock_dividend_ratio"] is None:
            missing.append("stock_dividend_ratio")
        if not out["ex_date"]:
            missing.append("ex_date")
    elif out["action_type"] == "cash_dividend":
        if out["cash_dividend_per_share"] is None:
            missing.append("cash_dividend_per_share")
    out["parse_notes"] = "|".join(missing)
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", default=str(DEFAULT_IN))
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    ap.add_argument("--only-corporate-actions", action="store_true", default=True)
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    df = pd.read_csv(args.inp)
    if args.only_corporate_actions:
        df = df[df["section"].fillna("").eq("Corporate Actions")].copy()
    rows = []
    for _, r in df.iterrows():
        parsed = parse_text(r.get("content_text", ""))
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
                "content_arabic_text": r.get("content_arabic_text"),
            }
        )
        # Prefer the official structured columns if the free text parser missed.
        if not parsed["isin"]:
            parsed["isin"] = clean(r.get("isin"))
        if not parsed["reuters_code"]:
            parsed["reuters_code"] = clean(r.get("reuters_code"))
        if not parsed["company_name"]:
            parsed["company_name"] = clean(r.get("company_name_en"))
        rows.append(parsed)
    res = pd.DataFrame(rows)
    csv_path = out / "official_corporate_actions_2022_2026_2026_10_31.csv"
    res.to_csv(csv_path, index=False, encoding="utf-8-sig")
    summary = {
        "rows": int(len(res)),
        "action_types": res["action_type"].value_counts().to_dict(),
        "with_isin": int(res["isin"].fillna("").ne("").sum()),
        "with_reuters": int(res["reuters_code"].fillna("").ne("").sum()),
        "parse_notes": res["parse_notes"].fillna("").value_counts().head(20).to_dict(),
        "rights_rows": int(res["action_type"].eq("rights").sum()),
        "stock_dividend_rows": int(res["action_type"].eq("stock_dividend").sum()),
        "cash_dividend_rows": int(res["action_type"].eq("cash_dividend").sum()),
        "source": args.inp,
        "note": "Parsed from official EGX Corporate Actions disclosures; missing terms are left blank.",
        "generated_at_utc": datetime.now().astimezone().isoformat(timespec="seconds"),
    }
    (out / "official_corporate_actions_summary_2026_10_31.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print("wrote", csv_path)


if __name__ == "__main__":
    main()
