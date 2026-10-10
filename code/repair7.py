# -*- coding: utf-8 -*-
"""Repair the 7 shifted symbols: refetch daily+6TF with FIXED writer, verify each file.
Spaced 15s. Env creds."""
import csv, os, sys, time, datetime
sys.path.insert(0, r"C:\Users\Mekawey\AppData\Local\Temp\opencode")
from tv_fetch2 import fetch_bars
BASE = r"D:\EGX_DATA"
SYMS = ["AALR", "ABUK", "ACAMD", "ACAP", "ACGC", "ACTF", "ADIB"]
JOBS = [("1D", "01_daily"), ("1", "05_intraday/1m"), ("5", "05_intraday/5m"),
        ("15", "05_intraday/15m"), ("30", "05_intraday/30m"), ("60", "05_intraday/60m"),
        ("240", "05_intraday/240m")]

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

def verify(path):
    bad = 0
    n = 0
    with open(path, encoding="utf-8", errors="replace", newline="") as fh:
        rd = csv.reader(fh)
        next(rd, None)
        for r in rd:
            if len(r) < 7:
                bad += 1
                continue
            n += 1
            try:
                o, h, l, c = float(r[2]), float(r[3]), float(r[4]), float(r[5])
                if not (h >= max(o, c) - 1e-9 and l <= min(o, c) + 1e-9 and h >= l):
                    bad += 1
            except Exception:
                bad += 1
    return n, bad

for sym in SYMS:
    for res, sub in JOBS:
        ok = False
        for att in range(3):
            try:
                bars, meta = fetch_bars("EGX:" + sym, res=res, count=300000, timeout=90)
                if meta.get("resolved") and bars:
                    n = write_res(os.path.join(BASE, sub, "EGX_" + sym + ".csv"), bars)
                    vn, vb = verify(os.path.join(BASE, sub, "EGX_" + sym + ".csv"))
                    print("OK %s %s n=%d verified=%d bad=%d" % (sym, res, n, vn, vb), flush=True)
                    ok = True
                    break
                print("retry %s %s att=%d" % (sym, res, att), flush=True)
            except Exception as e:
                print("retry %s %s EXC %s" % (sym, res, str(e)[:80]), flush=True)
            time.sleep(10)
        if not ok:
            print("FAIL " + sym + " " + res, flush=True)
        time.sleep(15)
print("REPAIR DONE", flush=True)
