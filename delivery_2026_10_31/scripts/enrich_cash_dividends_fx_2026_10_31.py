# -*- coding: utf-8 -*-
"""Add currency and EGP-equivalent columns to official cash-dividend actions.

The existing `cash_dividend_per_share` column stores the native amount, but it
does not record whether that amount is EGP or USD.  This script detects the
currency from the official English text, parses the five USD rows that were
previously blank, and converts USD amounts with the daily USD/EGP rate.

It writes a NEW file and does not overwrite the original corporate-actions CSV.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "deliverables_2026_10_31" / "data"
CA = DATA / "egx_official" / "official_corporate_actions_2022_2026_2026_10_31.csv"
MACRO = DATA / "macro_daily_2022_2026_2026_10_31.csv"
OUT = DATA / "egx_official" / "official_corporate_actions_with_fx_2022_2026_2026_10_31.csv"
SUMMARY = DATA / "egx_official" / "official_cash_dividend_fx_summary_2026_10_31.json"


def num(text: str) -> float:
    m = re.search(r"([\d,]+(?:\.\s*\d+)?)", text or "")
    if not m:
        return np.nan
    try:
        return float(re.sub(r"[\s,]", "", m.group(1)))
    except ValueError:
        return np.nan


def detect_currency(text: str) -> str:
    t = text or ""
    # Inspect the 120 characters after the amount label first.
    for label in [r"Dividend\s*per\s*(?:EGP\s*)?Share", r"Coupon\s*Value"]:
        m = re.search(label + r".{0,140}", t, re.I | re.S)
        if m:
            seg = m.group(0)
            if re.search(r"\bPiaster(s)?\b", seg, re.I):
                return "PIASTER"
            if re.search(r"EGP\s*[\d]", seg, re.I) or re.search(r"\b(EGP|LE|L\.E\.?)\b", seg, re.I):
                return "EGP"
            if re.search(r"(USD|US\s*\$|US\$|Dollar|Dollars)", seg, re.I):
                return "USD"
            if re.search(r"\bCent\b", seg, re.I):
                return "CENT_AMBIGUOUS"
    if re.search(r"\bPiaster(s)?\b", t, re.I):
        return "PIASTER"
    if re.search(r"EGP\s*[\d]", t, re.I) or re.search(r"\b(EGP|LE|L\.E\.?)\b", t, re.I):
        return "EGP"
    if re.search(r"(USD|US\s*\$|US\$|Dollar|Dollars)", t, re.I):
        return "USD"
    if re.search(r"\bCent\b", t, re.I):
        return "CENT_AMBIGUOUS"
    return "UNKNOWN"


def parse_amount(text: str, currency: str) -> float:
    t = text or ""
    if currency == "USD":
        patterns = [
            r"(?:USD|US\s*\$|US\$|Dollar|Dollars)\s*([\d,]+(?:\.\s*\d+)?)",
            r"([\d,]+(?:\.\s*\d+)?)\s*(?:USD|US\s*\$|US\$|Dollar|Dollars)",
        ]
    elif currency == "EGP":
        patterns = [
            r"(?:EGP|LE|L\.E\.?)\s*([\d,]+(?:\.\s*\d+)?)",
            r"([\d,]+(?:\.\s*\d+)?)\s*(?:EGP|LE|L\.E\.?)",
        ]
    elif currency == "PIASTER":
        patterns = [
            r"(?:Piaster|Piasters)\s*([\d,]+(?:\.\s*\d+)?)",
            r"([\d,]+(?:\.\s*\d+)?)\s*(?:Piaster|Piasters)",
        ]
    elif currency == "CENT_AMBIGUOUS":
        patterns = [r"([\d,]+(?:\.\s*\d+)?)\s*Cent"]
    else:
        patterns = []
    for p in patterns:
        m = re.search(p, t, re.I)
        if m:
            return num(m.group(1))
    return np.nan


def main() -> None:
    ca = pd.read_csv(CA)
    macro = pd.read_csv(MACRO, parse_dates=["date"])
    macro = macro[["date", "usdegp"]].dropna().sort_values("date")

    ca["cash_dividend_currency"] = ""
    ca["cash_dividend_per_share_native"] = np.nan
    ca["cash_dividend_per_share_egp"] = np.nan
    ca["fx_rate"] = np.nan
    ca["fx_rate_date"] = ""
    ca["fx_note"] = ""

    cash = ca["action_type"].eq("cash_dividend")
    for idx, row in ca[cash].iterrows():
        text = "" if pd.isna(row.get("content_text")) else str(row.get("content_text"))
        currency = detect_currency(text)
        existing = row.get("cash_dividend_per_share")
        native = existing if pd.notna(existing) else parse_amount(text, currency)
        ca.at[idx, "cash_dividend_currency"] = currency
        ca.at[idx, "cash_dividend_per_share_native"] = native

    # Use the ex-date; if absent, use the publication date.
    ca["_ex_dt"] = pd.to_datetime(ca["ex_date"], errors="coerce")
    ca["_pub_dt"] = pd.to_datetime(ca["published_cairo"], errors="coerce", utc=True).dt.tz_localize(None).dt.normalize()
    ca["_rate_dt"] = ca["_ex_dt"].fillna(ca["_pub_dt"])
    left = ca.sort_values("_rate_dt").copy()
    merged = pd.merge_asof(
        left,
        macro,
        left_on="_rate_dt",
        right_on="date",
        direction="backward",
        tolerance=pd.Timedelta(days=7),
    )
    ca = merged.sort_index()
    # merge_asof returns a fresh RangeIndex, so recompute the mask after the merge.
    cash = ca["action_type"].eq("cash_dividend")

    for idx, row in ca[cash].iterrows():
        currency = row["cash_dividend_currency"]
        native = row["cash_dividend_per_share_native"]
        rate = row["usdegp"]
        rate_date = row["date"]
        if currency == "EGP" and pd.notna(native):
            ca.at[idx, "cash_dividend_per_share_egp"] = native
            ca.at[idx, "fx_note"] = "egp_native"
        elif currency == "PIASTER" and pd.notna(native):
            ca.at[idx, "cash_dividend_per_share_egp"] = native / 100.0
            ca.at[idx, "fx_note"] = "converted_from_piaster"
        elif currency == "USD" and pd.notna(native) and pd.notna(rate):
            ca.at[idx, "cash_dividend_per_share_egp"] = native * rate
            ca.at[idx, "fx_rate"] = rate
            ca.at[idx, "fx_rate_date"] = "" if pd.isna(rate_date) else pd.Timestamp(rate_date).date().isoformat()
            ca.at[idx, "fx_note"] = "converted_at_usdegp"
        elif currency == "USD" and pd.notna(native) and pd.isna(rate):
            ca.at[idx, "fx_note"] = "missing_usdegp"
        elif currency == "CENT_AMBIGUOUS":
            ca.at[idx, "fx_note"] = "ambiguous_cent_not_converted"
        elif pd.isna(native):
            ca.at[idx, "fx_note"] = "missing_amount"
        else:
            ca.at[idx, "fx_note"] = "unknown_currency"

    # Drop helper columns, keep the source order.
    ca = ca.drop(columns=[c for c in ["_ex_dt", "_pub_dt", "_rate_dt", "date", "usdegp"] if c in ca.columns])
    ca.to_csv(OUT, index=False, encoding="utf-8-sig")

    cash_df = ca[ca["action_type"].eq("cash_dividend")]
    summary = {
        "rows_total": int(len(ca)),
        "cash_rows": int(len(cash_df)),
        "currency_counts": {str(k): int(v) for k, v in cash_df["cash_dividend_currency"].value_counts(dropna=False).items()},
        "native_amount_missing": int(cash_df["cash_dividend_per_share_native"].isna().sum()),
        "egp_equiv_missing": int(cash_df["cash_dividend_per_share_egp"].isna().sum()),
        "usd_rows": int(cash_df["cash_dividend_currency"].eq("USD").sum()),
        "usd_rows_converted": int(cash_df["fx_note"].eq("converted_at_usdegp").sum()),
        "fx_note_counts": {str(k): int(v) for k, v in cash_df["fx_note"].value_counts(dropna=False).items()},
        "source": str(CA),
        "macro_source": str(MACRO),
        "output": str(OUT),
        "note": "cash_dividend_per_share remains the native amount; cash_dividend_per_share_egp is the converted EGP equivalent. USD conversion uses the last available usdegp on/before the ex-date (max 7 days back).",
    }
    SUMMARY.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print("wrote", OUT)


if __name__ == "__main__":
    main()
