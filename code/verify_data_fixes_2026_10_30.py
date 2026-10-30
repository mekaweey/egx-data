"""Verify the 2026-10-30 EGX data fixes on the GitHub working tree.

Run from the repository root:
    python code/verify_data_fixes_2026_10_30.py

The script checks the committed data files, not the local data_fixed_2026_10_30
staging folder. It exits non-zero if any check fails.
"""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
CHECKS: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: object = "") -> None:
    CHECKS.append((name, bool(ok), str(detail)))
    print(("PASS " if ok else "FAIL ") + name + (f" | {detail}" if detail != "" else ""))


def close(a, b, tol: float = 1e-6) -> bool:
    return bool(np.allclose(np.asarray(a, dtype=float), np.asarray(b, dtype=float),
                            equal_nan=True, atol=tol, rtol=0))


def verify_all(name: str, path: Path, rows: int, symbols: int, true_n: int,
               fake_n: int, up_n: int, down_n: int, no_trade_n: int,
               usable_n: int, date_min: str, date_max: str,
               has_source: bool = True) -> pd.DataFrame:
    d = pd.read_csv(path, low_memory=False)
    check(f"{name}: rows", len(d) == rows, len(d))
    check(f"{name}: symbols", d["symbol"].nunique() == symbols, d["symbol"].nunique())
    check(f"{name}: no duplicate symbol/time", not d.duplicated(["symbol", "time"]).any(),
          int(d.duplicated(["symbol", "time"]).sum()))
    check(f"{name}: date range", str(d["date"].min())[:10] == date_min and
          str(d["date"].max())[:10] == date_max, (str(d["date"].min())[:10], str(d["date"].max())[:10]))
    check(f"{name}: open == open_true", close(d["open"], d["open_true"]),
          int((~np.isclose(d["open"], d["open_true"], equal_nan=True)).sum()))
    check(f"{name}: open NaN where no true open",
          d.loc[d["has_true_open"] == 0, "open"].isna().all(),
          int(d.loc[d["has_true_open"] == 0, "open"].notna().sum()))
    check(f"{name}: open_true NaN where no true open",
          d.loc[d["has_true_open"] == 0, "open_true"].isna().all(),
          int(d.loc[d["has_true_open"] == 0, "open_true"].notna().sum()))
    check(f"{name}: open_raw not null", d["open_raw"].notna().all(),
          int(d["open_raw"].isna().sum()))
    check(f"{name}: has_true_open", int(d["has_true_open"].sum()) == true_n,
          int(d["has_true_open"].sum()))
    check(f"{name}: open_is_fake", int(d["open_is_fake"].sum()) == fake_n,
          int(d["open_is_fake"].sum()))
    check(f"{name}: limit up", int(d["limit_up_locked_10"].sum()) == up_n,
          int(d["limit_up_locked_10"].sum()))
    check(f"{name}: limit down", int(d["limit_down_locked_10"].sum()) == down_n,
          int(d["limit_down_locked_10"].sum()))
    check(f"{name}: no_trade", int(d["no_trade"].sum()) == no_trade_n,
          int(d["no_trade"].sum()))
    check(f"{name}: is_usable", int(d["is_usable"].sum()) == usable_n,
          int(d["is_usable"].sum()))
    check(f"{name}: file under 100 MiB", path.stat().st_size < 100 * 1024 * 1024,
          path.stat().st_size)
    if has_source:
        check(f"{name}: source column present", "source" in d.columns, list(d.columns))
    return d


def verify_per_symbol(name: str, folder: Path, all_rows: int, all_true: int,
                      all_fake: int, all_up: int, all_down: int,
                      all_no_trade: int, all_usable: int) -> None:
    files = sorted(folder.glob("EGX_*.csv"))
    check(f"{name}: 271 per-symbol files", len(files) == 271, len(files))
    total = 0
    true_n = fake_n = up_n = down_n = no_trade_n = usable_n = 0
    bad_open = 0
    max_size = 0
    dup = 0
    for f in files:
        d = pd.read_csv(f, usecols=["time", "open", "open_true", "has_true_open",
                                    "open_is_fake", "limit_up_locked_10",
                                    "limit_down_locked_10", "no_trade", "is_usable"])
        total += len(d)
        true_n += int(d["has_true_open"].sum())
        fake_n += int(d["open_is_fake"].sum())
        up_n += int(d["limit_up_locked_10"].sum())
        down_n += int(d["limit_down_locked_10"].sum())
        no_trade_n += int(d["no_trade"].sum())
        usable_n += int(d["is_usable"].sum())
        bad_open += int((~np.isclose(d["open"], d["open_true"], equal_nan=True)).sum())
        dup += int(d.duplicated(["time"]).sum())
        max_size = max(max_size, f.stat().st_size)
    check(f"{name}: per-symbol rows", total == all_rows, total)
    check(f"{name}: per-symbol open == open_true", bad_open == 0, bad_open)
    check(f"{name}: per-symbol no duplicate time", dup == 0, dup)
    check(f"{name}: per-symbol has_true_open", true_n == all_true, true_n)
    check(f"{name}: per-symbol open_is_fake", fake_n == all_fake, fake_n)
    check(f"{name}: per-symbol limit up", up_n == all_up, up_n)
    check(f"{name}: per-symbol limit down", down_n == all_down, down_n)
    check(f"{name}: per-symbol no_trade", no_trade_n == all_no_trade, no_trade_n)
    check(f"{name}: per-symbol is_usable", usable_n == all_usable, usable_n)
    check(f"{name}: per-symbol max file under 1 MiB", max_size < 1024 * 1024, max_size)


def main() -> int:
    # ---------------- 01 daily
    d1 = verify_all(
        "01_daily/ALL_daily", DATA / "01_daily" / "ALL_daily.csv",
        rows=996010, symbols=271, true_n=572715, fake_n=533301,
        up_n=56, down_n=24, no_trade_n=80018, usable_n=568460,
        date_min="1997-02-12", date_max="2026-10-07",
    )
    check("01_daily: open is NaN count", int(d1["open"].isna().sum()) == 423295,
          int(d1["open"].isna().sum()))
    check("01_daily: limit_locked_no_volume", int(d1["limit_locked_no_volume"].sum()) == 80,
          int(d1["limit_locked_no_volume"].sum()))
    verify_per_symbol("01_daily", DATA / "01_daily", 996010, 572715, 533301,
                      56, 24, 80018, 568460)

    parquet = DATA / "01_daily" / "ALL_daily_full.parquet"
    p = pd.read_parquet(parquet)
    check("01_daily/parquet: rows", len(p) == 996010, len(p))
    check("01_daily/parquet: 30 columns", len(p.columns) == 30, len(p.columns))
    check("01_daily/parquet: open == open_true", close(p["open"], p["open_true"]),
          int((~np.isclose(p["open"], p["open_true"], equal_nan=True)).sum()))
    check("01_daily/parquet: file under 100 MiB",
          parquet.stat().st_size < 100 * 1024 * 1024, parquet.stat().st_size)

    # ---------------- 02 adjusted daily
    verify_all(
        "02_daily_divadj/ALL_divadj", DATA / "02_daily_divadj" / "ALL_divadj.csv",
        rows=990897, symbols=271, true_n=572715, fake_n=531355,
        up_n=55, down_n=24, no_trade_n=79558, usable_n=568460,
        date_min="1997-02-12", date_max="2026-10-07",
    )
    verify_per_symbol("02_daily_divadj", DATA / "02_daily_divadj", 990897, 572715,
                      531355, 55, 24, 79558, 568460)

    # ---------------- 03 weekly
    verify_all(
        "03_weekly/ALL_weekly", DATA / "03_weekly" / "ALL_weekly.csv",
        rows=224960, symbols=271, true_n=126195, fake_n=116321,
        up_n=55, down_n=24, no_trade_n=9405, usable_n=125691,
        date_min="1997-02-09", date_max="2026-10-04",
    )
    verify_per_symbol("03_weekly", DATA / "03_weekly", 224960, 126195, 116321,
                      55, 24, 9405, 125691)

    # ---------------- 04 monthly
    verify_all(
        "04_monthly/ALL_monthly", DATA / "04_monthly" / "ALL_monthly.csv",
        rows=53873, symbols=271, true_n=29712, fake_n=27566,
        up_n=53, down_n=23, no_trade_n=1407, usable_n=29582,
        date_min="1997-02-01", date_max="2026-10-05",
    )
    verify_per_symbol("04_monthly", DATA / "04_monthly", 53873, 29712, 27566,
                      53, 23, 1407, 29582)

    # ---------------- metadata
    m = pd.read_csv(DATA / "08_metadata" / "symbols_metadata.csv")
    check("metadata: 271 rows", len(m) == 271, len(m))
    check("metadata: 30 columns", len(m.columns) == 30, len(m.columns))
    check("metadata: 267 valid ISIN", int(m["isin_status"].eq("valid_check_digit").sum()) == 267,
          int(m["isin_status"].eq("valid_check_digit").sum()))
    check("metadata: 4 missing ISIN", int(m["isin_status"].eq("missing").sum()) == 4,
          int(m["isin_status"].eq("missing").sum()))
    missing = set(m.loc[m["isin_status"].eq("missing"), "symbol"])
    check("metadata: missing ISIN set", missing == {"BIOQ", "EEI", "IUFO", "EIUD"}, missing)
    check("metadata: no_market_data set",
          set(m.loc[m["data_status"].eq("no_market_data"), "symbol"]) == {"BIOQ", "EEI", "IUFO"},
          set(m.loc[m["data_status"].eq("no_market_data"), "symbol"]))
    check("metadata: data status counts",
          m["data_status"].value_counts().to_dict() ==
          {"daily_and_intraday": 264, "daily_only": 4, "no_market_data": 3},
          m["data_status"].value_counts().to_dict())
    check("metadata: FCMD/MKIT valid",
          m.loc[m["symbol"].isin(["FCMD", "MKIT"]), "isin_status"].eq("valid_check_digit").all(),
          m.loc[m["symbol"].isin(["FCMD", "MKIT"]), ["symbol", "isin_status"]].to_dict("records"))
    named = {"APPC", "EITP", "FCMD", "GTHE", "MKIT", "NCGC", "PACH"}
    check("metadata: 7 named symbols valid",
          m.loc[m["symbol"].isin(named), "isin_status"].eq("valid_check_digit").all(),
          m.loc[m["symbol"].isin(named), ["symbol", "isin_status"]].to_dict("records"))
    check("metadata: T0 tag all UNVERIFIED",
          m["thndr_t0_tag"].nunique() == 1 and m["thndr_t0_tag"].iloc[0] == "UNVERIFIED",
          m["thndr_t0_tag"].value_counts().to_dict())
    check("metadata: 34 T1 eligible", int(m["is_t1_eligible"].sum()) == 34,
          int(m["is_t1_eligible"].sum()))
    check("metadata: settlement 69/202",
          m["settlement_status"].value_counts().to_dict() ==
          {"no_settlement_record": 202, "board_list_T0_T1_T2_only": 69},
          m["settlement_status"].value_counts().to_dict())
    check("metadata: PIT unavailable",
          m["pit_2024_2026"].nunique() == 1 and m["pit_2024_2026"].iloc[0] == "unavailable",
          m["pit_2024_2026"].value_counts().to_dict())

    s = pd.read_csv(DATA / "08_metadata" / "settlement_mapping_2026_02.csv")
    check("settlement: 69 rows", len(s) == 69, len(s))
    check("settlement: 34 T1 eligible", int(s["is_t1_eligible"].sum()) == 34,
          int(s["is_t1_eligible"].sum()))
    check("settlement: T0 tag UNVERIFIED",
          s["thndr_t0_tag"].nunique() == 1 and s["thndr_t0_tag"].iloc[0] == "UNVERIFIED",
          s["thndr_t0_tag"].value_counts().to_dict())
    check("settlement: all board T0/T1/T2",
          s["settlement_status"].nunique() == 1 and
          s["settlement_status"].iloc[0] == "board_list_T0_T1_T2_only",
          s["settlement_status"].value_counts().to_dict())

    su = pd.read_csv(DATA / "08_metadata" / "suspended_or_no_data.csv")
    check("suspended: 33 rows", len(su) == 33, len(su))
    check("suspended: 24 common stocks", int(su["common_stock"].sum()) == 24,
          int(su["common_stock"].sum()))
    check("suspended: 11 survivorship", int(su["survivorship_bias"].sum()) == 11,
          int(su["survivorship_bias"].sum()))
    check("suspended: status counts",
          su["status"].value_counts().to_dict() ==
          {"no_2023_2024_rows": 18, "non_stock_instrument": 6,
           "absent_master_unverified": 6, "absent_master_suspended_reipo": 1,
           "absent_master_delisted": 1, "absent_master_listed_illiquid": 1},
          su["status"].value_counts().to_dict())

    reg = pd.read_csv(DATA / "08_metadata" / "symbol_registry.csv")
    check("registry: 271 rows / 40 columns", len(reg) == 271 and len(reg.columns) == 40,
          (len(reg), len(reg.columns)))
    check("registry: 267 valid ISIN",
          int(reg["isin_status"].eq("valid_check_digit").sum()) == 267,
          int(reg["isin_status"].eq("valid_check_digit").sum()))
    isin = pd.read_csv(DATA / "08_metadata" / "isin_fixes.csv")
    check("isin_fixes: 10 rows", len(isin) == 10, len(isin))

    # ---------------- dividends / corporate actions
    dv = pd.read_csv(DATA / "07_fundamentals" / "dividends_summary.csv")
    check("dividends: 247 rows", len(dv) == 247, len(dv))
    check("dividends: 48 ex-dates", int(dv["exDateRecent"].notna().sum()) == 48,
          int(dv["exDateRecent"].notna().sum()))
    check("dividends: 198 no verified", int(dv["ex_date_status"].eq("no_verified_ex_date").sum()) == 198,
          int(dv["ex_date_status"].eq("no_verified_ex_date").sum()))
    check("dividends: 1 no record", int(dv["ex_date_status"].eq("no_dividend_record").sum()) == 1,
          int(dv["ex_date_status"].eq("no_dividend_record").sum()))
    for sym, amount, exdate, yld in [("COMI", 6.0, "2026-04-07", 4.98),
                                     ("EAST", 1.45, "2026-05-21", 8.79)]:
        row = dv[dv["symbol"] == sym]
        ok = len(row) == 1 and close(row["amountRecent"].iloc[0], amount) and \
            str(row["exDateRecent"].iloc[0])[:10] == exdate and close(row["yield"].iloc[0], yld)
        check(f"dividends: {sym}", ok, row[["amountRecent", "exDateRecent", "yield"]].to_dict("records"))
    grca = dv[dv["symbol"] == "GRCA"]
    check("dividends: GRCA no record",
          len(grca) == 1 and grca["ex_date_status"].iloc[0] == "no_dividend_record" and
          pd.isna(grca["exDateRecent"].iloc[0]), grca[["exDateRecent", "ex_date_status"]].to_dict("records"))

    ca = pd.read_csv(DATA / "07_fundamentals" / "corporate_actions_2026_10_30.csv")
    check("corporate_actions: 440 rows", len(ca) == 440, len(ca))
    sp = pd.read_csv(DATA / "07_fundamentals" / "split_events_derived.csv")
    check("split_events: 142 rows", len(sp) == 142, len(sp))

    # ---------------- halal
    h = pd.read_csv(DATA / "11_reference" / "halal_stocks_list.csv")
    check("halal: 97 rows", len(h) == 97, len(h))
    check("halal: source counts",
          h["sharia_source"].value_counts().to_dict() ==
          {"thndr_unverified": 67, "islamicly": 24, "egx33": 6},
          h["sharia_source"].value_counts().to_dict())
    check("halal: 3 no price", int(h["has_price_data"].eq("no").sum()) == 3,
          int(h["has_price_data"].eq("no").sum()))
    check("halal: no-price set",
          set(h.loc[h["has_price_data"].eq("no"), "symbol"]) == {"BIOQ", "EEI", "IUFO"},
          set(h.loc[h["has_price_data"].eq("no"), "symbol"]))
    check("halal: original 22 no", int(h["has_price_data_original"].eq("no").sum()) == 22,
          int(h["has_price_data_original"].eq("no").sum()))
    check("halal: 19 corrected", int(h["was_wrong"].sum()) == 19,
          int(h["was_wrong"].sum()))
    check("halal: current only",
          h["historical_status"].nunique() == 1 and
          h["historical_status"].iloc[0] == "current_only_unverified",
          h["historical_status"].value_counts().to_dict())
    symbols = [x.strip() for x in (DATA / "11_reference" / "halal_symbols.txt").read_text(encoding="utf-8").splitlines() if x.strip()]
    check("halal: symbols file 97", len(symbols) == 97, len(symbols))

    # ---------------- bid/ask
    b = pd.read_csv(DATA / "BIDASK_FINAL" / "spread_by_group_fixed.csv")
    check("bidask: 4 rows", len(b) == 4, len(b))
    for win, is_t1, med in [("entry", True, 0.314875), ("entry", False, 0.405420),
                            ("exit", True, 0.541010), ("exit", False, 0.542005)]:
        row = b[(b["window"] == win) & (b["is_t1"] == is_t1)]
        check(f"bidask: {win} T1={is_t1}", len(row) == 1 and close(row["median"].iloc[0], med, 1e-5),
              row[["median"]].to_dict("records"))
    check("bidask: two months only",
          b["history_status"].nunique() == 1 and b["history_status"].iloc[0] == "two_months_2026_only",
          b["history_status"].value_counts().to_dict())
    check("bidask: no T0/T2 split",
          b["t0_t2_split"].nunique() == 1 and
          b["t0_t2_split"].iloc[0] == "not_possible_no_per_symbol_settlement",
          b["t0_t2_split"].value_counts().to_dict())

    # ---------------- timezone / closing
    t = pd.read_csv(DATA / "05_intraday" / "timezone_summary.csv")
    check("timezone: 2 timeframes", len(t) == 2, len(t))
    check("timezone: 267/267 aligned", int(t["timezone_aligned"].sum()) == 534,
          int(t["timezone_aligned"].sum()))
    check("timezone: zero outside-session rows", int(t["outside_session_rows"].sum()) == 0,
          int(t["outside_session_rows"].sum()))
    c = pd.read_csv(DATA / "05_intraday" / "closing_window_summary.csv")
    check("closing: 1 row", len(c) == 1, len(c))
    check("closing: auction unavailable",
          c["auction_data_available"].nunique() == 1 and
          c["auction_data_available"].iloc[0] == "NO",
          c["auction_data_available"].value_counts().to_dict())
    check("closing: 10.34% median", close(c["median_coverage"].iloc[0], 0.103448, 1e-6),
          c["median_coverage"].iloc[0])
    for f, n in [("timezone_audit_1m.csv", 267), ("timezone_audit_60m.csv", 267),
                 ("closing_window_coverage.csv", 267)]:
        x = pd.read_csv(DATA / "05_intraday" / f)
        check(f"timezone: {f} rows", len(x) == n, len(x))
    dst = pd.read_csv(DATA / "05_intraday" / "dst_transitions_observed.csv")
    check("timezone: DST observed rows", len(dst) == 11, len(dst))
    for date in ["2023-04-30", "2023-10-29", "2024-04-28", "2024-11-03",
                 "2025-04-27", "2025-11-02", "2026-04-26"]:
        check(f"timezone: DST {date}", date in set(dst["date"].astype(str)), date)

    # ---------------- suspension gaps / limit events
    g = pd.read_csv(DATA / "01_daily" / "suspension_gaps.csv")
    check("gaps: 8568 rows", len(g) == 8568, len(g))
    check("gaps: 243 symbols", g["symbol"].nunique() == 243, g["symbol"].nunique())
    check("gaps: 218481 missing sessions", int(g["missing_sessions"].sum()) == 218481,
          int(g["missing_sessions"].sum()))
    le = pd.read_csv(DATA / "01_daily" / "limit_lock_events.csv")
    check("limit events: 80 rows", len(le) == 80, len(le))
    ly = pd.read_csv(DATA / "01_daily" / "limit_lock_by_year.csv")
    check("limit by year: 10 rows", len(ly) == 10, len(ly))
    check("limit by year: 56 up / 24 down",
          int(ly["UP"].sum()) == 56 and int(ly["DOWN"].sum()) == 24,
          (int(ly["UP"].sum()), int(ly["DOWN"].sum())))

    # ---------------- manifest
    manifest = ROOT / "DATA_FIXES_MANIFEST.csv"
    check("manifest: exists", manifest.exists(), manifest)
    if manifest.exists():
        man = pd.read_csv(manifest)
        check("manifest: has rows", len(man) > 0, len(man))
        bad_hash = []
        bad_size = []
        for _, row in man.iterrows():
            p = ROOT / str(row["path"])
            if not p.exists():
                bad_hash.append(f"{row['path']}: missing")
                continue
            # Git normalizes text to LF; compare canonical LF content so the
            # manifest works on Windows (CRLF checkout) and Linux (LF checkout).
            raw = p.read_bytes()
            if p.suffix != ".parquet":
                raw = raw.replace(b"\r\n", b"\n")
            if len(raw) != int(row["bytes"]):
                bad_size.append(f"{row['path']}: {len(raw)} != {row['bytes']}")
            h = hashlib.sha256(raw).hexdigest()
            if h != str(row["sha256"]):
                bad_hash.append(f"{row['path']}: hash")
        check("manifest: all sizes match", not bad_size, bad_size[:3])
        check("manifest: all hashes match", not bad_hash, bad_hash[:3])

    # ---------------- summary
    failed = [c for c in CHECKS if not c[1]]
    print("\n" + "=" * 70)
    print(f"TOTAL {len(CHECKS)}  PASS {len(CHECKS) - len(failed)}  FAIL {len(failed)}")
    if failed:
        print("FAILURES:")
        for name, _, detail in failed:
            print(f"  - {name} | {detail}")
        return 1
    print("ALL CHECKS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
