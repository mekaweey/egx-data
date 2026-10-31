# -*- coding: utf-8 -*-
"""Unify Mubasher + Yahoo corporate actions and export the adjusted price panel."""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "deliverables_2026_10_31" / "data"
REPORTS = ROOT / "deliverables_2026_10_31" / "reports"
DATA.mkdir(parents=True, exist_ok=True)
REPORTS.mkdir(parents=True, exist_ok=True)

MUB = DATA / "mubasher_corporate_actions_2026_10_31.csv"
YAH = ROOT / "strategy-audit" / "data_derived" / "yahoo_actions_all_2026_10_31.csv"
MASTER = ROOT / "strategy-audit" / "data_raw" / "egx_master_daily.parquet"


def recategorize(row: pd.Series) -> str:
    t = " ".join(str(row.get(c, "")) for c in ["type", "title", "description"])
    if "إصدار حقوق أولوية" in t or "حق اكتشاف" in t or "حق اكتتاب" in t:
        return "rights"
    if "توزيع أرباح نقدية" in t or "أرباح نقدية" in t or "مقسومات نقدية" in t:
        return "dividend"
    if "أسهم منحة" in t or "أسهم مجانية" in t or "منحة" in t:
        return "bonus_shares"
    if "تجزئة" in t or "تقسيم" in t:
        return "split"
    if "زيادة رأس مال" in t:
        return "capital_increase"
    return "other"


def main() -> None:
    mub = pd.read_csv(MUB)
    mub["action_category"] = mub.apply(recategorize, axis=1)
    mub.to_csv(MUB, index=False, encoding="utf-8-sig")
    mub = mub.rename(columns={"effective_date": "ex_date", "announced_date": "announced_date"})
    mub["ex_date"] = pd.to_datetime(mub["ex_date"], errors="coerce")
    mub["announced_date"] = pd.to_datetime(mub["announced_date"], errors="coerce")
    mub["value"] = np.nan
    mub["source"] = "mubasher"
    mub["is_official"] = False
    mub_out = mub[[
        "symbol", "ex_date", "announced_date", "action_category", "type", "title",
        "description", "name", "sector", "url", "value", "source", "is_official",
    ]].copy()

    yah = pd.read_csv(YAH)
    yah["ex_date"] = pd.to_datetime(yah["date"], errors="coerce")
    yah["announced_date"] = pd.NaT
    yah["action_category"] = yah["type"].map({"dividend": "dividend", "split": "split"}).fillna("other")
    yah["title"] = yah["type"]
    yah["description"] = ""
    yah["name"] = ""
    yah["sector"] = ""
    yah["url"] = ""
    yah["is_official"] = False
    yah_out = yah[[
        "symbol", "ex_date", "announced_date", "action_category", "type", "title",
        "description", "name", "sector", "url", "value", "source", "is_official",
    ]].copy()

    all_actions = pd.concat([mub_out, yah_out], ignore_index=True)
    all_actions["symbol"] = all_actions["symbol"].astype(str).str.upper().str.strip()
    all_actions = all_actions.dropna(subset=["ex_date"])
    all_actions = all_actions.sort_values(["symbol", "ex_date", "source", "action_category"])
    all_actions.to_csv(DATA / "corporate_actions_unified_all_2026_10_31.csv", index=False, encoding="utf-8-sig")

    recent = all_actions[(all_actions.ex_date >= "2022-01-01") & (all_actions.ex_date <= "2026-12-31")].copy()
    # Prefer Mubasher for exact symbol/date/category duplicates.
    recent["source_rank"] = recent["source"].map({"mubasher": 0, "yahoo": 1}).fillna(2)
    recent = recent.sort_values(["symbol", "ex_date", "action_category", "source_rank"])
    recent = recent.drop_duplicates(subset=["symbol", "ex_date", "action_category"], keep="first")
    recent.to_csv(DATA / "corporate_actions_unified_2022_2026_2026_10_31.csv", index=False, encoding="utf-8-sig")

    # Adjusted price panel from the master's total-return series.
    m = pd.read_parquet(
        MASTER,
        columns=[
            "symbol", "date", "close", "close_raw", "close_unadj", "close_tr",
            "div_factor", "ca_factor", "corp_action_day", "is_stock", "is_tradable",
        ],
    )
    m["date"] = pd.to_datetime(m["date"])
    m = m[(m.date >= "2022-01-01") & (m.date <= "2026-10-31") & m.is_stock.fillna(False)].copy()
    calc = m["close_unadj"] * m["div_factor"] * m["ca_factor"]
    m["close_adj"] = m["close_tr"].where(m["close_tr"].notna(), calc)
    m["adj_method"] = np.where(m["close_tr"].notna(), "master_close_tr", "product_factors")
    m["adj_check_pct"] = np.where(
        m["close_adj"].notna() & (m["close_adj"] != 0),
        (calc / m["close_adj"] - 1.0) * 100.0,
        np.nan,
    )
    keep = [
        "symbol", "date", "close", "close_raw", "close_unadj", "close_tr",
        "close_adj", "adj_method", "div_factor", "ca_factor", "corp_action_day",
        "is_tradable", "adj_check_pct",
    ]
    m[keep].to_parquet(DATA / "egx_adjusted_prices_2022_2026_2026_10_31.parquet", index=False)

    # Report
    lines = []
    lines.append("# الإجراءات المؤسسية والأسعار المعدلة\n")
    lines.append(f"- إجراءات مباشر: {len(mub):,}، الرموز: {mub.symbol.nunique()}")
    lines.append(f"- إجراءات ياهو: {len(yah):,}، الرموز: {yah.symbol.nunique()}")
    lines.append(f"- الإجراءات الموحدة ٢٠٢٢-٢٠٢٦: {len(recent):,}، الرموز: {recent.symbol.nunique()}")
    lines.append(f"- الأسعار المعدلة: {len(m):,} صفاً، {m.symbol.nunique()} رمزاً")
    lines.append(f"- أقصى فرق تحقق للأسعار المعدلة: {m.adj_check_pct.abs().max():.4f}%")
    lines.append(f"- صفوف بفرق > ٠.١٪: {int((m.adj_check_pct.abs() > 0.1).sum()):,}")
    lines.append("")
    lines.append("## توزيع الإجراءات ٢٠٢٢-٢٠٢٦\n")
    lines.append(recent.action_category.value_counts().to_string())
    lines.append("")
    lines.append("## حسب المصدر\n")
    lines.append(recent.source.value_counts().to_string())
    lines.append("")
    lines.append("## حسب السنة\n")
    lines.append(recent.groupby(recent.ex_date.dt.year).size().to_string())
    lines.append("")
    lines.append("**ملاحظة:** تواريخ مباشر هي تواريخ سريان/نهاية الحق، وليست بالضرورة ex-date رسمياً. الحقوق وزيادات رأس المال موجودة الآن في ملف مباشر، لكن تعديل السعر الكامل للحقوق لم يُبنَ بعد؛ `close_tr` هو السلسلة المعدلة المتاحة من اللوحة الأساسية.")
    (REPORTS / "corporate_actions_report_2026_10_31.md").write_text("\n".join(lines), encoding="utf-8")
    print("\n".join(lines))
    print("wrote", DATA / "corporate_actions_unified_2022_2026_2026_10_31.csv")
    print("wrote", DATA / "egx_adjusted_prices_2022_2026_2026_10_31.parquet")


if __name__ == "__main__":
    main()
