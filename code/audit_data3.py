# -*- coding: utf-8 -*-
"""Find files with non-time values in col0 + list fetch infra."""
import os, csv
base = os.path.join("D:", "EGX_DATA", "05_intraday")
for tf in ["1m", "5m", "15m", "30m", "60m", "240m"]:
    d = os.path.join(base, tf)
    nfiles = 0
    for f in sorted(os.listdir(d)):
        if not f.endswith(".csv"):
            continue
        nfiles += 1
        with open(os.path.join(d, f), encoding="utf-8", errors="replace", newline="") as fh:
            rd = csv.reader(fh)
            h = next(rd, None)
            for r in rd:
                if not r:
                    continue
                v = (r[0] or "").strip()
                ok = False
                if v[:4].isdigit():
                    if "-" in v[:10] or "/" in v[:10]:
                        ok = True
                    elif v.replace(".", "", 1).isdigit() and len(v) >= 9:
                        ok = True
                if not ok:
                    print(tf + " " + f + " odd=" + str(r[:4]), flush=True)
                    break
    print(tf + " checked=" + str(nfiles), flush=True)

print("== fetch infra ==", flush=True)
for p in [os.path.join("D:", "EGX_DATA"), r"C:\Users\Mekawey\AppData\Local\Temp\opencode"]:
    for e in sorted(os.listdir(p)):
        l = e.lower()
        if l.endswith(".py") and any(k in l for k in ["fetch", "update", "tv_", "ws_", "scan"]):
            print(p + " :: " + e, flush=True)
