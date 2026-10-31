# -*- coding: utf-8 -*-
"""Rebuild the delivery manifest and a GitHub upload manifest.

The full manifest keeps the 186.3 MB disclosures CSV (it is part of the local
delivery), while the GitHub manifest marks it as not uploadable because GitHub
rejects individual files above 100 MB.  The compressed .csv.gz is uploaded.
"""
from __future__ import annotations

import csv
import gzip
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OLD = ROOT / "MANIFEST.csv"
OUT = ROOT / "MANIFEST.csv"
OUT_MD = ROOT / "MANIFEST.md"
GH = ROOT / "GITHUB_MANIFEST.csv"

NEW_FILES = [
    "data/egx_official/official_corporate_actions_with_fx_2022_2026_2026_10_31.csv",
    "data/egx_official/official_cash_dividend_fx_summary_2026_10_31.json",
    "data/egx_official/official_rights_terms_listing_addendum_2026_10_31.csv",
    "data/egx_official/official_rights_terms_listing_addendum_summary_2026_10_31.json",
    "data/egx_official/official_trading_notices_parsed_2022_2026_2026_10_31.csv",
    "data/egx_official/official_trading_notices_summary_2026_10_31.json",
    "data/egx_official/official_trading_notices_impact_2026_10_31.json",
    "data/rights_unmatched_evidence_2026_10_31.csv",
    "data/free_source_checks_2026_10_31.json",
    "reports/free_source_checks_2026_10_31.md",
    "reports/trading_notices_2026_10_31.md",
    "scripts/enrich_cash_dividends_fx_2026_10_31.py",
    "scripts/add_listing_rights_terms_2026_10_31.py",
    "scripts/parse_trading_notices_2026_10_31.py",
    "scripts/audit_trading_notices_impact_2026_10_31.py",
    "scripts/update_manifest_2026_10_31.py",
]


def count_rows(p: Path) -> int | str:
    try:
        if p.suffix == ".csv":
            with p.open("r", encoding="utf-8-sig", errors="replace", newline="") as f:
                return max(0, sum(1 for _ in f) - 1)
        if p.name.endswith(".csv.gz"):
            with gzip.open(p, "rt", encoding="utf-8", errors="replace") as f:
                return max(0, sum(1 for _ in f) - 1)
        if p.suffix == ".parquet":
            import pyarrow.parquet as pq

            return int(pq.ParquetFile(p).metadata.num_rows)
    except Exception as exc:  # noqa: BLE001 - keep the manifest usable
        print(f"row-count warning: {p}: {exc}")
    return ""


def main() -> None:
    paths: list[str] = []
    if OLD.exists():
        with OLD.open("r", encoding="utf-8-sig", newline="") as f:
            for row in csv.DictReader(f):
                p = (row.get("path") or "").strip().replace("\\", "/")
                if p and "__pycache__" not in p and not p.endswith(".pyc"):
                    paths.append(p)
    paths.extend(NEW_FILES)
    paths = sorted(set(paths))

    rows = []
    missing = []
    for rel in paths:
        p = ROOT / rel
        if not p.exists():
            missing.append(rel)
            continue
        rows.append({"path": rel, "bytes": p.stat().st_size, "rows": count_rows(p)})

    with OUT.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["path", "bytes", "rows"])
        w.writeheader()
        w.writerows(rows)

    gh_rows = []
    for r in rows:
        upload = int(r["bytes"]) <= 100 * 1024 * 1024
        gh_rows.append({**r, "github_path": f"delivery_2026_10_31/{r['path']}", "upload": upload})
    with GH.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["path", "bytes", "rows", "github_path", "upload"])
        w.writeheader()
        w.writerows(gh_rows)

    total = sum(int(r["bytes"]) for r in rows)
    up = [r for r in gh_rows if r["upload"]]
    up_total = sum(int(r["bytes"]) for r in up)
    over = [r for r in gh_rows if not r["upload"]]

    md = [
        "# بيان ملفات التسليم",
        "",
        f"إجمالي الملفات المدرجة: {len(rows)}",
        "",
        f"إجمالي الحجم: {total / (1024 * 1024):.2f} ميجابايت.",
        "",
        "`MANIFEST.md` و`MANIFEST.csv` ليسا جزءًا من العدد المدرج؛ هما بيانان إضافيان.",
        "",
        "## ملاحظة الرفع إلى GitHub",
        "",
        f"- الملفات القابلة للرفع: {len(up)} بحجم {up_total / (1024 * 1024):.2f} ميجابايت.",
        "- الملفات الأكبر من 100 ميجابايت لا يرفعها GitHub:",
    ]
    for r in over:
        md.append(f"  - `{r['path']}` ({int(r['bytes']) / (1024 * 1024):.2f} ميجابايت)")
    md += [
        "- النسخة المضغوطة `data/egx_official/egx_official_disclosures_2022_2026_2026_10_31.csv.gz` مرفوعة بدلًا من الملف الخام الكبير.",
        "",
        "## الملفات",
        "",
        "| الملف | الحجم (ميجابايت) | الصفوف |",
        "|---|---:|---:|",
    ]
    for r in rows:
        size = int(r["bytes"]) / (1024 * 1024)
        md.append(f"| `{r['path']}` | {size:.2f} | {r['rows']} |")
    md += [
        "",
        "## ملفات غير موجودة",
        "",
    ]
    md += [f"- `{m}`" for m in missing] or ["- لا شيء."]
    md += ["", "**التنفيذات الحقيقية غير متحققة.**", ""]
    OUT_MD.write_text("\n".join(md), encoding="utf-8")

    print(f"manifest rows: {len(rows)}")
    print(f"total MB: {total / (1024 * 1024):.2f}")
    print(f"github upload rows: {len(up)}")
    print(f"github upload MB: {up_total / (1024 * 1024):.2f}")
    print(f"excluded >100MB: {len(over)}")
    for r in over:
        print(f"  {r['path']} {int(r['bytes']) / (1024 * 1024):.2f} MB")
    print(f"missing: {len(missing)}")
    for m in missing:
        print(f"  {m}")


if __name__ == "__main__":
    main()
