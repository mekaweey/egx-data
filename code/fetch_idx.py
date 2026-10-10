# -*- coding: utf-8 -*-
"""Spaced indices+FX refresh: 1 connect per ~25s. Env creds. Prints each result."""
import csv, os, sys, time, datetime
sys.path.insert(0, r"C:\Users\Mekawey\AppData\Local\Temp\opencode")
from tv_fetch2 import fetch_bars
BASE = r"D:\EGX_DATA"

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

JOBS = [("EGX:EGX30", "1D", os.path.join(BASE, "09_indices", "EGX30_daily.csv"), 300000),
        ("EGX:EGX70EWI", "1D", os.path.join(BASE, "09_indices", "EGX70EWI_daily.csv"), 300000),
        ("EGX:EGX100EWI", "1D", os.path.join(BASE, "09_indices", "EGX100EWI_daily.csv"), 300000),
        ("FX_IDC:USDEGP", "1D", os.path.join(BASE, "_fx", "USDEGP_daily_tv.csv"), 300000)]
os.makedirs(os.path.join(BASE, "_fx"), exist_ok=True)
for tvsym, res, path, cnt in JOBS:
    ok = False
    for att in range(3):
        try:
            bars, meta = fetch_bars(tvsym, res=res, count=cnt, timeout=90)
            if meta.get("resolved") and bars:
                n = write_res(path, bars)
                ts = sorted(bars)
                print("OK %s n=%d last=%s close=%s" % (
                    tvsym, n,
                    datetime.datetime.fromtimestamp(ts[-1], datetime.timezone.utc).date(),
                    bars[ts[-1]][3]), flush=True)
                ok = True
                break
            print("retry %s att=%d err=%s" % (tvsym, att, str(meta.get("error"))[:80]), flush=True)
        except Exception:
            import traceback
            try:
                with open(r"D:\EGX_DATA\_logs\fetch_errors.log", "a", encoding="utf-8") as fh:
                    fh.write(datetime.datetime.now().isoformat(timespec="seconds") + " " + tvsym + " " + res + "\n" + traceback.format_exc() + "\n")
            except Exception:
                pass
            print("retry %s att=EXC (trace logged)" % tvsym, flush=True)
        time.sleep(10)
    if not ok:
        print("FAIL " + tvsym, flush=True)
    time.sleep(20)
print("INDICES DONE", flush=True)
