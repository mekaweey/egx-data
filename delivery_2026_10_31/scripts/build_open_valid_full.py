# -*- coding: utf-8 -*-
"""Full open_valid build: true open inside [low, high] AND inside the daily limit.

Outputs
-------
data/daily_open_valid_full_2026_10_31.parquet
data/open_suspicious_full_2026_10_31.csv
data/open_suspicious_222_candidates_2026_10_31.csv
reports/open_valid_report_2026_10_31.md
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
FIXED = ROOT / "strategy-audit" / "data_derived" / "daily_fixed_2026_10_31.parquet"
UNIFIED = ROOT / "strategy-audit" / "data_derived" / "daily_unified_2026_10_30.parquet"
OUT = ROOT / "deliverables_2026_10_31"
DATA = OUT / "data"
REPORTS = OUT / "reports"
DATA.mkdir(parents=True, exist_ok=True)
REPORTS.mkdir(parents=True, exist_ok=True)

FIXED_COLS = [
    "symbol", "date", "open_used", "open_true", "has_true_open", "open_is_fake",
    "high", "low", "close", "prev_close", "volume", "limit_pct_est",
    "limit_pct_source", "halt_flag", "limit_close_flag", "close_limit_up",
    "close_limit_up_derived", "limit_up_locked", "limit_down_locked", "no_trade",
    "is_tradable", "sector_en", "sector_ar", "industry", "sector_source",
]
UNIFIED_COLS = [
    "symbol", "date", "open", "open_raw", "open_used_is_fallback", "is_valid",
    "is_range_valid", "is_clean", "is_t1", "is_stock", "is_usable", "flags",
]


def main() -> None:
    d = pd.read_parquet(FIXED, columns=FIXED_COLS)
    d["date"] = pd.to_datetime(d["date"])
    u = pd.read_parquet(UNIFIED, columns=UNIFIED_COLS)
    u["date"] = pd.to_datetime(u["date"])
    u = u[u["is_stock"].fillna(False)]
    d = d.merge(u, on=["symbol", "date"], how="left", validate="one_to_one")
    d = d[(d.date >= "2022-01-01") & (d.date <= "2026-10-31")].copy()

    # 1) true open exists and is inside the day's high/low range
    range_ok = (
        d["open_true"].notna()
        & (d["open_true"] > 0)
        & d["low"].notna()
        & d["high"].notna()
        & (d["open_true"] >= d["low"] * 0.999)
        & (d["open_true"] <= d["high"] * 1.001)
    )
    # 2) true open is inside the daily price limit around the previous close
    lim = d["limit_pct_est"].fillna(0.10).clip(0.05, 0.20)
    d["limit_up_price"] = d["prev_close"] * (1.0 + lim)
    d["limit_down_price"] = d["prev_close"] * (1.0 - lim)
    limit_ok = (
        d["open_true"].notna()
        & d["prev_close"].notna()
        & (d["open_true"] >= d["limit_down_price"] * 0.995)
        & (d["open_true"] <= d["limit_up_price"] * 1.005)
    )
    base_ok = d["is_tradable"].fillna(False) & ~d["no_trade"].fillna(False)
    true_ok = d["has_true_open"].fillna(False) & range_ok & limit_ok

    d["open_valid"] = base_ok & true_ok
    d["daily_open_fake"] = d["open_is_fake"].fillna(False)
    d["open_valid_reason"] = np.select(
        [
            ~base_ok,
            ~d["has_true_open"].fillna(False),
            d["prev_close"].isna(),
            ~range_ok,
            ~limit_ok,
        ],
        [
            "NOT_TRADABLE_OR_NO_TRADE",
            "NO_TRUE_OPEN",
            "NO_PREV_CLOSE",
            "OPEN_OUT_OF_RANGE",
            "OPEN_BEYOND_LIMIT",
        ],
        default="OK",
    )
    d["open_true_vs_used_pct"] = np.where(
        d["open_used"].notna() & (d["open_used"] != 0),
        (d["open_true"] / d["open_used"] - 1.0) * 100.0,
        np.nan,
    )
    d["limit_breach_pct"] = np.maximum.reduce(
        [
            np.where(d["limit_up_price"].notna() & (d["limit_up_price"] > 0),
                     (d["open_true"] / d["limit_up_price"] - 1.0) * 100.0, 0.0),
            np.where(d["limit_down_price"].notna() & (d["open_true"] > 0),
                     (d["limit_down_price"] / d["open_true"] - 1.0) * 100.0, 0.0),
            np.zeros(len(d)),
        ]
    )

    keep = [
        "symbol", "date", "open", "open_raw", "open_used", "open_true",
        "has_true_open", "open_is_fake", "open_used_is_fallback", "high", "low",
        "close", "prev_close", "limit_pct_est", "limit_pct_source",
        "limit_up_price", "limit_down_price", "limit_breach_pct",
        "open_true_vs_used_pct", "open_valid", "daily_open_fake",
        "open_valid_reason", "halt_flag", "limit_close_flag", "close_limit_up",
        "close_limit_up_derived", "limit_up_locked", "limit_down_locked",
        "no_trade", "is_tradable", "is_valid", "is_range_valid", "is_clean",
        "is_t1", "is_usable", "flags", "sector_en", "sector_ar", "industry",
        "sector_source",
    ]
    d[keep].to_parquet(DATA / "daily_open_valid_full_2026_10_31.parquet", index=False)

    # Suspicious list: every tradable row with a bad/missing true open, bad range,
    # bad limit, fake daily open, or fallback open.  Reasons are ordered by severity.
    susp_mask = base_ok & (
        ~d["has_true_open"].fillna(False)
        | ~range_ok
        | ~limit_ok
        | d["open_is_fake"].fillna(False)
        | d["open_used_is_fallback"].fillna(False)
    )
    susp = d[susp_mask].copy()
    susp["reason"] = np.select(
        [
            ~susp["has_true_open"].fillna(False),
            ~range_ok.loc[susp.index],
            ~limit_ok.loc[susp.index],
            susp["prev_close"].isna(),
            susp["open_used_is_fallback"].fillna(False),
            susp["open_is_fake"].fillna(False),
        ],
        [
            "NO_TRUE_OPEN",
            "OPEN_OUT_OF_RANGE",
            "OPEN_BEYOND_LIMIT",
            "NO_PREV_CLOSE",
            "FALLBACK_OPEN",
            "DAILY_OPEN_FAKE",
        ],
        default="OTHER",
    )
    susp["severity"] = np.select(
        [
            susp["reason"].eq("OPEN_OUT_OF_RANGE"),
            susp["reason"].eq("OPEN_BEYOND_LIMIT") & (susp["limit_breach_pct"] >= 2.0),
            susp["reason"].eq("OPEN_BEYOND_LIMIT"),
            susp["reason"].isin(["NO_TRUE_OPEN", "NO_PREV_CLOSE"]),
        ],
        [4, 3, 2, 1],
        default=0,
    )
    susp = susp.sort_values(
        ["severity", "limit_breach_pct", "date", "symbol"],
        ascending=[False, False, False, True],
    )
    susp.to_csv(DATA / "open_suspicious_full_2026_10_31.csv", index=False, encoding="utf-8-sig")

    top222 = susp.head(222).copy()
    top222["candidate_note"] = (
        "أقرب ٢٢٢ حالة مشبوهة حسب الشدة؛ العدد الأصلي ٢٢٢ غير قابل للتكرار من اللوحة الحالية"
    )
    top222.to_csv(
        DATA / "open_suspicious_222_candidates_2026_10_31.csv",
        index=False,
        encoding="utf-8-sig",
    )

    # Report
    lines: list[str] = []
    lines.append("# تقرير صلاحية الافتتاح ٢٠٢٢-٢٠٢٦\n")
    lines.append(f"- الصفوف: {len(d):,}")
    lines.append(f"- الافتتاح الصالح: {int(d.open_valid.sum()):,} ({d.open_valid.mean():.1%})")
    lines.append(f"- الافتتاح اليومي الوهمي: {int(d.daily_open_fake.sum()):,} ({d.daily_open_fake.mean():.1%})")
    lines.append(f"- بلا افتتاح حقيقي: {int((~d.has_true_open.fillna(False)).sum()):,}")
    lines.append(f"- بلا إغلاق سابق: {int(d.prev_close.isna().sum()):,}")
    lines.append(f"- خارج المدى: {int((d.open_true.notna() & ~range_ok).sum()):,}")
    lines.append(f"- خارج حد التغير: {int((d.open_true.notna() & d.prev_close.notna() & ~limit_ok).sum()):,}")
    lines.append(f"- قائمة المشبوهين: {len(susp):,}")
    lines.append("")
    lines.append("## أسباب صلاحية الافتتاح\n")
    lines.append(d.open_valid_reason.value_counts().to_string())
    lines.append("")
    lines.append("## أسباب القائمة المشبوهة\n")
    lines.append(susp.reason.value_counts().to_string())
    lines.append("")
    lines.append("## أعلى ٢٢٢ حالة (أول ٢٠)\n")
    cols = ["symbol", "date", "reason", "open_true", "open_used", "low", "high",
            "prev_close", "limit_breach_pct", "severity"]
    lines.append(top222[cols].head(20).to_string(index=False))
    lines.append("")
    lines.append("**ملاحظة:** العدد ٢٢٢ المذكور سابقاً غير قابل للتكرار؛ الملف أعلاه هو أقرب ٢٢٢ حالة حسب الشدة، وليس القائمة الأصلية.")
    (REPORTS / "open_valid_report_2026_10_31.md").write_text("\n".join(lines), encoding="utf-8")

    print("\n".join(lines))
    print("\nwrote", DATA / "daily_open_valid_full_2026_10_31.parquet")
    print("wrote", DATA / "open_suspicious_full_2026_10_31.csv")
    print("wrote", DATA / "open_suspicious_222_candidates_2026_10_31.csv")


if __name__ == "__main__":
    main()
