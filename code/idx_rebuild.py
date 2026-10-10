# -*- coding: utf-8 -*-
"""Rebuild every _index.csv from actual current files (rows/first/last)."""
import csv, os
BASE = r"D:\EGX_DATA"
count = 0
for sub in ["01_daily", "02_daily_divadj", "03_weekly", "04_monthly",
            "05_intraday/1m", "05_intraday/5m", "05_intraday/15m",
            "05_intraday/30m", "05_intraday/60m", "05_intraday/240m",
            "09_indices"]:
    d = os.path.join(BASE, sub)
    rows = []
    for f in sorted(os.listdir(d)):
        if not (f.endswith(".csv") and not f.startswith("ALL_") and f != "_index.csv"):
            continue
        try:
            with open(os.path.join(d, f), encoding="utf-8", errors="replace", newline="") as fh:
                rd = csv.reader(fh)
                h = [x.strip().lower() for x in (next(rd, None) or [])]
                di = h.index("date") if "date" in h else (h.index("datetime_utc") if "datetime_utc" in h else 0)
                data = [r for r in rd if len(r) > di]
                if not data:
                    continue
                sym = f[len("EGX_"):-4] if f.startswith("EGX_") else f[:-4]
                rows.append((sym, len(data), data[0][di][:16], data[-1][di][:16]))
        except Exception:
            continue
    with open(os.path.join(d, "_index.csv"), "w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["symbol", "rows", "first", "last"])
        w.writerows(sorted(rows))
    count += 1
    print("indexed " + sub + " files=" + str(len(rows)), flush=True)
print("INDEX REBUILD DONE folders=" + str(count), flush=True)
