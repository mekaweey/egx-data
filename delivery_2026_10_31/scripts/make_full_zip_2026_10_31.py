# -*- coding: utf-8 -*-
"""Create a single full local zip of the 2026-10-31 package.

Includes the raw data/news/pulse/reports/scripts and root manifests. Excludes the
two Git clones (`egx_data_repo`, `github_repo`) and temporary files. Writes a
`FULL_ZIP_MANIFEST.csv` inside the zip with path, bytes and SHA-256.

Usage:
    python make_full_zip_2026_10_31.py
"""
from __future__ import annotations

import csv
import hashlib
import os
import zipfile
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT.parent / "deliverables_2026_10_31_FULL.zip"

INCLUDE_DIRS = [
    "data",
    "news",
    "pulse_news_2026_10_31",
    "reports",
    "scripts",
]
INCLUDE_ROOT_FILES = [
    "README.md",
    "CHECKLIST.md",
    "MANIFEST.csv",
    "MANIFEST.md",
    "GITHUB_MANIFEST.csv",
    "real_trades_template.csv",
    "verification_summary_2026_10_31.json",
]
EXCLUDE_DIR_NAMES = {
    "egx_data_repo",
    "github_repo",
    "__pycache__",
    ".git",
}
EXCLUDE_SUFFIXES = {".tmp", ".out", ".log"}


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def iter_files() -> list[tuple[Path, str]]:
    files: list[tuple[Path, str]] = []
    for d in INCLUDE_DIRS:
        base = ROOT / d
        if not base.exists():
            continue
        for dirpath, dirnames, filenames in os.walk(base):
            dirnames[:] = [x for x in dirnames if x not in EXCLUDE_DIR_NAMES]
            for name in filenames:
                p = Path(dirpath) / name
                if p.suffix.lower() in EXCLUDE_SUFFIXES:
                    continue
                if p.name.startswith("~$"):
                    continue
                files.append((p, p.relative_to(ROOT).as_posix()))
    for name in INCLUDE_ROOT_FILES:
        p = ROOT / name
        if p.exists() and p.is_file():
            files.append((p, name))
    files.sort(key=lambda x: x[1])
    return files


def main() -> None:
    files = iter_files()
    total = sum(p.stat().st_size for p, _ in files)
    print(f"files={len(files)} raw={total/(1024*1024):.1f} MiB -> {OUT}")
    manifest_rows: list[dict] = []
    with zipfile.ZipFile(OUT, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for i, (p, arc) in enumerate(files, 1):
            z.write(p, arc)
            manifest_rows.append(
                {
                    "path": arc,
                    "bytes": p.stat().st_size,
                    "sha256": sha256(p),
                }
            )
            if i % 100 == 0 or i == len(files):
                print(f"  {i}/{len(files)}")
        # Add the manifest last.
        import io

        buf = io.StringIO()
        w = csv.DictWriter(buf, fieldnames=["path", "bytes", "sha256"])
        w.writeheader()
        w.writerows(manifest_rows)
        z.writestr("FULL_ZIP_MANIFEST.csv", buf.getvalue().encode("utf-8-sig"))
    size = OUT.stat().st_size
    print(f"zip={size/(1024*1024):.1f} MiB at {OUT}")
    print(f"manifest rows={len(manifest_rows)}")


if __name__ == "__main__":
    main()
