# -*- coding: utf-8 -*-
"""Top-up MMAT (9 jobs) with fixed writer + verify."""
import csv, os, sys, time, datetime
sys.path.insert(0, r"C:\Users\Mekawey\AppData\Local\Temp\opencode")
from tv_fetch2 import fetch_bars
BASE = r"D:\EGX_DATA"
JOBS = [("1D", "01_daily"), ("1", "05_intraday/1m"), ("5", "05_intraday/5m"),
        ("15", "05_intraday/15m"), ("30", "05_intraday/30m"), ("60", "05_intraday/60m"),
        ("240", "05_intraday/240m"), ("1W", "03_weekly"), ("1M", "04_monthly")]

def write_res(path, bars):
    rows = []
    for ts in sorted(bars):
        if ts < 315532800:
            continue
        v = bars[ts]
        o, h, l, c = v[0], v[1], v[2], v[3]
        vol = v[4] if len(v) > 4 else 0.0
        dt = datetime.datetime.fromtimestamp(ts, datetime.timezone.utc).strftime("%Y-%m-%d %H:%M")
        rows.append([int(ts), dt, "%.6f" % o, "%.6f" % h, "%.6f" % l, "%.6f" % c, "%.2f" % vol])
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["time", "datetime_utc", "open", "high", "low", "close", "volume"])
        w.writerows(rows)
    os.replace(tmp, path)
    return len(rows)

for res, sub in JOBS:
    ok = False
    for att in range(3):
        try:
            bars, meta = fetch_bars("EGX:MMAT", res=res, count=300000, timeout=90)
            if meta.get("resolved") and bars:
                n = write_res(os.path.join(BASE, sub, "EGX_MMAT.csv"), bars)
                print("OK %s n=%d" % (res, n), flush=True)
                ok = True
                break
            print("retry %s att=%d" % (res, att), flush=True)
        except Exception as e:
            print("EXC %s %s" % (res, str(e)[:60]), flush=True)
        time.sleep(8)
    if not ok:
        print("FAIL " + res, flush=True)
    time.sleep(12)
print("MMAT DONE", flush=True)
