# -*- coding: utf-8 -*-
"""Foreground batch refresh: sequential, polite, VISIBLE. Usage: batch_refresh.py <start> <count>.
Env: TVSID, TVSIGN (set inline in same command)."""
import csv, os, sys, time, datetime
sys.path.insert(0, r"C:\Users\Mekawey\AppData\Local\Temp\opencode")
from tv_fetch2 import fetch_bars
START, COUNT = int(sys.argv[1]), int(sys.argv[2])
BASE = r"D:\EGX_DATA"
syms = sorted(f[len("EGX_"):-4] for f in os.listdir(os.path.join(BASE, "01_daily"))
              if f.startswith("EGX_") and f.endswith(".csv"))
JOBS = [("1D", "01_daily"), ("1", "05_intraday/1m"), ("5", "05_intraday/5m"),
        ("15", "05_intraday/15m"), ("30", "05_intraday/30m"), ("60", "05_intraday/60m"),
        ("240", "05_intraday/240m"), ("1W", "03_weekly"), ("1M", "04_monthly")]

def write_res(path, bars):
    rows = []
    for ts in sorted(bars):
        if ts < 315532800:
            continue
        # bars values are 5-elem [o,h,l,c,v] (0-based!)
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

ok = fail = 0
for sym in syms[START:START + COUNT]:
    for res, sub in JOBS:
        good = False
        for att in range(2):
            try:
                bars, meta = fetch_bars("EGX:" + sym, res=res, count=300000, timeout=60)
                if meta.get("resolved") and bars:
                    n = write_res(os.path.join(BASE, sub, "EGX_" + sym + ".csv"), bars)
                    ok += 1
                    good = True
                    break
            except Exception:
                pass
            time.sleep(3)
        if not good:
            fail += 1
        time.sleep(2)
    print("done %s ok=%d fail=%d" % (sym, ok, fail), flush=True)
print("BATCH DONE ok=%d fail=%d" % (ok, fail), flush=True)
