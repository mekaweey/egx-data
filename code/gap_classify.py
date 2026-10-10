# -*- coding: utf-8 -*-
"""Classify gaps: constant-ratio (corporate action) vs Yahoo-stale (flat/zero-volume)."""
import csv, os
import requests
from datetime import datetime, timezone
from collections import defaultdict
BASE = r"D:\EGX_DATA"

def ours(sym):
    dd = {}
    with open(os.path.join(BASE, "01_daily", "EGX_" + sym + ".csv"), encoding="utf-8", errors="replace", newline="") as fh:
        rd = csv.reader(fh)
        h = [x.strip().lower() for x in next(rd)]
        di = h.index("date") if "date" in h else h.index("datetime_utc")
        ci = h.index("close")
        for r in rd:
            if len(r) > max(di, ci):
                try:
                    dd[r[di][:10]] = float(r[ci])
                except Exception:
                    pass
    return dd

for sym in ["AMES", "EFID", "POUL", "MTIE", "NCCW", "SKPC", "MPCO", "MCRO"]:
    try:
        r = requests.get("https://query1.finance.yahoo.com/v8/finance/chart/" + sym + ".CA",
                         params={"period1": "1754000000", "period2": "1791400000", "interval": "1d"},
                         headers={"User-Agent": "Mozilla/5.0"}, timeout=40)
        d = r.json()["chart"]["result"][0]
        ts = d.get("timestamp", [])
        cl = d["indicators"]["quote"][0].get("close", [])
        vo = d["indicators"]["quote"][0].get("volume", [])
    except Exception as e:
        print(sym, "fetch fail", flush=True)
        continue
    o = ours(sym)
    bym = defaultdict(list)
    flat_runs = 0
    prev = None
    run = 0
    for i, t in enumerate(ts):
        dt = datetime.fromtimestamp(t, tz=timezone.utc).date().isoformat()
        yc, yv = cl[i], (vo[i] if vo else None)
        oc = o.get(dt)
        if yc and oc and oc > 0:
            bym[dt[:7]].append(yc / oc)
        if yc == prev and yc:
            run += 1
        else:
            if run >= 4:
                flat_runs += 1
            run = 0
        prev = yc
    if run >= 4:
        flat_runs += 1
    print("====" + sym + " flat5d-runs=" + str(flat_runs), flush=True)
    for m in sorted(bym)[-4:]:
        v = sorted(bym[m])
        print("  " + m + " n=" + str(len(v)) + " med-ratio=" + str(round(v[len(v)//2], 4)), flush=True)
    import time
    time.sleep(1)
