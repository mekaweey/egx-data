# -*- coding: utf-8 -*-
"""Record the latest available official EGX daily investor report (2026-11-02).

The official 2026-11-03 daily report was not published/available at build time.
The EGX Reports page lists the 2026-11-02 daily report PDF (ID 1022, published
03-11-2026) as the latest available.  Its investor tables are transcribed here
with explicit labels; derived totals are marked is_derived=1.  Values are EGP
million as printed (one decimal).  This file is NOT the 2026-11-03 report.
"""
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "strategy-lab" / "outputs" / "egx_2026_11_03" / "data" / "official"
OUT.mkdir(parents=True, exist_ok=True)
NOW = datetime.now(ZoneInfo("Africa/Cairo")).isoformat(timespec="seconds")
URL = "https://www.egx.com.eg/get_pdf.aspx?Lang=ENG&ID=1022"

rows = [
    # table, nationality, buy, sell, net, derived, note
    ("institutions", "Egyptians", 1410.0, 1415.3, -5.4, 0, "Institutions total row, listed stocks including deals."),
    ("institutions", "Arabs", 3.8, 13.2, -9.4, 0, "Institutions total row, listed stocks including deals."),
    ("institutions", "Foreigners", 836.1, 1074.3, -238.3, 0, "Institutions total row, listed stocks including deals."),
    ("institutions", "Total", None, None, -253.1, 1, "Derived sum of the three nationality rows; rounding -0.2 vs buy-sell."),
    ("individuals", "Egyptians", 5965.5, 5736.2, 229.3, 0, "Retail total row, listed stocks including deals."),
    ("individuals", "Arabs", None, None, 13.7, 1, "Derived: all-investor Arabs +4.3 minus institutions Arabs -9.4."),
    ("individuals", "Foreigners", 13.9, 3.9, 10.0, 0, "Retail total row, listed stocks including deals."),
    ("individuals", "Total", None, None, 253.0, 1, "Derived sum of the three nationality rows."),
    ("all_investors", "Egyptians", None, None, 223.9, 1, "Derived: institutions -5.4 + individuals +229.3; report headline rounds to +224.0."),
    ("all_investors", "Arabs", None, None, 4.3, 0, "Report text: Arabs were net buyers by EGP 4.3 million."),
    ("all_investors", "Foreigners", None, None, -228.3, 1, "Derived: institutions -238.3 + individuals +10.0; report text says -228.3."),
    ("all_investors", "Total", None, None, -0.1, 1, "Rounding residual across the three nationality rows."),
]
df = pd.DataFrame(rows, columns=["table", "nationality", "buy_value_egp_million", "sell_value_egp_million", "net_value_egp_million", "is_derived", "row_note"])
df["net_value_egp"] = df["net_value_egp_million"] * 1_000_000.0
df["report_date"] = "2026-11-02"
df["source_table"] = "listed_stocks_including_deals"
df["source_url"] = URL
df["source_id"] = 1022
df["source_title"] = "EGX Daily Report 02/11/2026 (published 03-11-2026)"
df["via"] = "official_pdf_text_via_search_index"
df["is_final"] = 1
df["fetched_at_cairo"] = NOW
df["page_last_updated"] = "2026-11-02 16:06:22"
df["note"] = ("Latest official daily investor report available at build time. It is for 2026-11-02, "
              "NOT 2026-11-03. The 2026-11-03 daily report was not published/available when this dataset was built.")
df["extraction_note"] = ("Values are EGP million, one decimal, read from the official PDF text returned by the "
                         "search index. Buy/sell values are as printed for the institutions and individuals rows; "
                         "derived rows are marked is_derived=1.")
df = df[["report_date", "table", "nationality", "buy_value_egp_million", "sell_value_egp_million",
         "net_value_egp_million", "net_value_egp", "source_table", "source_url", "source_id", "source_title",
         "via", "is_final", "is_derived", "fetched_at_cairo", "page_last_updated", "note", "extraction_note", "row_note"]]
df.to_csv(OUT / "egx_daily_investor_report_2026_11_02.csv", index=False, encoding="utf-8-sig")
summary = {
    "report_date": "2026-11-02",
    "is_latest_available": True,
    "is_2026_11_03": False,
    "rows": int(len(df)),
    "source": URL,
    "source_id": 1022,
    "via": "official_pdf_text_via_search_index",
    "is_final": 1,
    "note": ("The official 2026-11-03 daily investor report was not available at build time. "
             "This 2026-11-02 report is included as the latest available official daily report, clearly labelled. "
             "It is not a substitute for 2026-11-03 and must not be used as such."),
    "derived_rows": int(df["is_derived"].sum()),
}
(OUT / "investor_daily_latest_available_summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
print("wrote", OUT / "egx_daily_investor_report_2026_11_02.csv", df.shape)
