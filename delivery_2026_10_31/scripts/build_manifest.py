# -*- coding: utf-8 -*-
"""Generate a manifest of the delivery folder with sizes and row counts."""
from __future__ import annotations

from pathlib import Path

import pandas as pd
import pyarrow.parquet as pq

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "deliverables_2026_10_31"


def rows_for(path: Path) -> int | None:
    try:
        if path.suffix.lower() == ".parquet":
            return pq.ParquetFile(path).metadata.num_rows
        if path.suffix.lower() == ".csv":
            # Fast line count minus header; quoted newlines are rare in these files.
            with path.open("rb") as f:
                n = sum(1 for _ in f)
            return max(0, n - 1)
    except Exception:
        return None
    return None


def main() -> None:
    files = []
    for p in sorted(OUT.rglob("*")):
        if not p.is_file():
            continue
        rel = p.relative_to(OUT).as_posix()
        if rel.startswith("github_repo/") or rel.startswith("news/parts_backup/"):
            continue
        if p.name.startswith("tmp_"):
            continue
        if rel in ("MANIFEST.md", "MANIFEST.csv"):
            continue
        files.append((rel, p.stat().st_size, rows_for(p)))

    lines = [
        "# بيان ملفات التسليم",
        "",
        f"إجمالي الملفات المدرجة: {len(files)}",
        "",
        f"الملفان `MANIFEST.md` و`MANIFEST.csv` ليسا ضمن القائمة لأنهما بيانان ذاتيان؛ بإضافتهما يصبح إجمالي ملفات المجلد {len(files) + 2}.",
        "",
    ]
    lines.append("| الملف | الحجم (م.ب) | الصفوف |")
    lines.append("|---|---:|---:|")
    for rel, size, rows in files:
        r = "" if rows is None else f"{rows:,}"
        lines.append(f"| `{rel}` | {size / 1024 / 1024:.2f} | {r} |")
    lines.append("")
    lines.append("**ملاحظة:** لا يشمل البيان مجلد `github_repo` (نسخة مرفوعة) ولا نسخة الأجزاء القديمة `news/parts_backup`.")
    (OUT / "MANIFEST.md").write_text("\n".join(lines), encoding="utf-8")
    pd.DataFrame(files, columns=["path", "bytes", "rows"]).to_csv(
        OUT / "MANIFEST.csv", index=False, encoding="utf-8-sig"
    )
    print("files", len(files))
    print("wrote", OUT / "MANIFEST.md")
    print("wrote", OUT / "MANIFEST.csv")


if __name__ == "__main__":
    main()
