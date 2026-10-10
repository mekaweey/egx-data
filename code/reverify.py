# -*- coding: utf-8 -*-
"""Independent re-verification (pandas-based): repaired tails, indices/FX, funds, required files."""
import os
import pandas as pd
BASE = r"D:\EGX_DATA"
ok = fail = 0
notes = []

# 1) repaired symbols tails (daily+intraday from repair lists) via pandas
for sym in ["AALR", "CANA", "AMES", "BONY", "CCAP", "APPC", "AREH"]:
    for sub in ["01_daily", "05_intraday/60m", "05_intraday/1m"]:
        p = os.path.join(BASE, sub, "EGX_" + sym + ".csv")
        try:
            df = pd.read_csv(p)
            assert list(df.columns)[:7] == ["time", "datetime_utc", "open", "high", "low", "close", "volume"], "cols"
            assert (df["high"] >= df[["open", "close"]].max(axis=1) - 1e-6).all(), "H"
            assert (df["low"] <= df[["open", "close"]].min(axis=1) + 1e-6).all(), "L"
            assert (df["volume"] >= 0).all(), "V"
            ok += 1
        except Exception as e:
            fail += 1
            notes.append("%s %s FAIL %s" % (sym, sub, str(e)[:70]))
print("repaired-files pandas check: ok=%d fail=%d" % (ok, fail), flush=True)

# 2) indices/FX tails sane
for p, cmin, cmax in [(os.path.join(BASE, "09_indices", "EGX30_daily.csv"), 20000, 100000),
                      (os.path.join(BASE, "09_indices", "EGX70EWI_daily.csv"), 5000, 50000),
                      (os.path.join(BASE, "_fx", "USDEGP_daily_tv.csv"), 15, 60)]:
    try:
        df = pd.read_csv(p)
        last = df.iloc[-1]
        assert cmin <= float(last["close"]) <= cmax, "close-range %s" % last["close"]
        assert str(last["datetime_utc"])[:10] >= "2026-10-07", "stale " + str(last["datetime_utc"])
        print("OK %s last=%s close=%s" % (os.path.basename(p), last["datetime_utc"], last["close"]), flush=True)
    except Exception as e:
        print("FAIL %s %s" % (p, str(e)[:80]), flush=True)

# 3) funds live completeness
try:
    df = pd.read_csv(os.path.join(BASE, "07_fundamentals", "fund_wide_live.csv"))
    print("fund live rows=%d null-close=%d" % (len(df), int(df["close"].isna().sum())), flush=True)
except Exception as e:
    print("fund FAIL %s" % str(e)[:80], flush=True)

# 4) required pack inputs presence
need = [os.path.join(BASE, "09_indices", "EGX30_daily.csv"),
        os.path.join(BASE, "_backtest", "universe_halal.csv"),
        os.path.join(BASE, "11_reference", "data_quality_flags.csv"),
        os.path.join(BASE, "07_fundamentals", "fundamentals_wide.csv"),
        os.path.join(BASE, "07_fundamentals", "dividends_summary.csv")]
for p in need:
    print(("OK  " if os.path.exists(p) else "MISS") + " " + p, flush=True)
for n in notes[:10]:
    print("NOTE:", n, flush=True)
print("REVERIFY DONE", flush=True)
