# -*- coding: utf-8 -*-
"""Fill the sector map from Mubasher corporate-action metadata."""
from __future__ import annotations

from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "deliverables_2026_10_31" / "data"
SECTOR = ROOT / "strategy-audit" / "data_derived" / "sector_map_2026_10_31.csv"
MUB = DATA / "mubasher_corporate_actions_2026_10_31.csv"
NEWS = ROOT / "strategy-lab" / "outputs" / "mubasher_news_by_symbol_2026_10_31.csv"

EN = {
    "بنوك": "Banks",
    "خدمات مالية": "Financial Services",
    "عقارات": "Real Estate",
    "اتصالات": "Telecommunications",
    "أغذية و مشروبات و تبغ": "Food, Beverages & Tobacco",
    "موارد أساسية": "Basic Resources",
    "مقاولات و إنشاءات هندسية": "Construction & Engineering",
    "خدمات و منتجات صناعية وسيارات": "Industrial Goods & Services",
    "رعاية صحية وأدوية": "Health Care",
    "كيماويات": "Chemicals",
    "سياحة و ترفيه": "Travel & Leisure",
    "تجارة وموزعون": "Retail",
    "مرافق": "Utilities",
    "طاقة": "Energy",
    "تأمين": "Insurance",
    "نقل": "Transportation",
    "منسوجات": "Textiles",
    "أخرى": "Other",
}


def main() -> None:
    sec = pd.read_csv(SECTOR)
    mub = pd.read_csv(MUB)
    mub = mub[mub["sector"].notna() & (mub["sector"].astype(str).str.strip() != "")].copy()
    top = (
        mub.groupby(["symbol", "sector"]).size().reset_index(name="n")
        .sort_values(["symbol", "n"], ascending=[True, False])
        .drop_duplicates("symbol")
        .set_index("symbol")["sector"]
    )
    sec["symbol"] = sec["symbol"].astype(str).str.upper()
    sec["sector_ar_filled"] = sec["sector_ar"].where(
        sec["sector_ar"].notna() & (sec["sector_ar"].astype(str) != "غير مصنف"),
        sec["symbol"].map(top),
    )
    sec["sector_ar_filled"] = sec["sector_ar_filled"].fillna("غير مصنف")
    sec["sector_en_filled"] = sec["sector_en"].where(
        sec["sector_en"].notna() & (sec["sector_en"].astype(str) != ""),
        sec["sector_ar_filled"].map(EN),
    )
    sec["sector_en_filled"] = sec["sector_en_filled"].fillna("Unclassified")
    sec["sector_source_filled"] = sec["sector_source"].fillna("")
    mask = sec["sector_source_filled"].eq("") | sec["sector_source_filled"].eq("unclassified")
    sec.loc[mask, "sector_source_filled"] = sec.loc[mask, "symbol"].map(
        lambda s: "mubasher_corporate_actions" if s in top.index else "unclassified"
    )
    sec.to_csv(DATA / "sector_map_full_2026_10_31.csv", index=False, encoding="utf-8-sig")

    news_syms = set(pd.read_csv(NEWS)["symbol"].astype(str).str.upper())
    ns = sec[sec.symbol.isin(news_syms)].copy()
    ns.to_csv(DATA / "sector_map_news_symbols_2026_10_31.csv", index=False, encoding="utf-8-sig")

    print("sector rows", len(sec))
    print("classified", int((sec.sector_ar_filled != "غير مصنف").sum()))
    print("unclassified", int((sec.sector_ar_filled == "غير مصنف").sum()))
    print("news symbols", len(ns), "classified", int((ns.sector_ar_filled != "غير مصنف").sum()))
    print(ns.sector_ar_filled.value_counts().head(20).to_string())
    print("wrote", DATA / "sector_map_full_2026_10_31.csv")
    print("wrote", DATA / "sector_map_news_symbols_2026_10_31.csv")


if __name__ == "__main__":
    main()
