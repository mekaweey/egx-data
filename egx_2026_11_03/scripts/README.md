# Scripts

These are the cutoff build, extraction, validation and manifest scripts used for this package.
They are provenance, not a requirement for using the data. The upstream 2026-11-04 collection/build
scripts remain in the project's `strategy-lab/` directory and are not duplicated here.

- `build_delivery_2026_11_03.py` filters the source build to 2026-11-03 and rebuilds live/coverage/universe tables.
- `build_investor_report_2026_11_02.py` records the latest available official daily investor report (2026-11-02).
- `fix_universe_scope_2026_11_03.py` keeps the stock universe at 306 and documents the 20 non-stock/index daily rows.
- `build_sqlite_2026_11_03.py` builds the compact SQLite database.
- `write_docs_manifest_2026_11_03.py` writes the documentation and SHA256 manifest.
- `verify_delivery_2026_11_03.py` verifies manifest hashes, cutoff, counts and known gaps.
- `inspect_2026_11_03.py` / `validate_delivery_2026_11_03.py` are read-only inspection helpers.
