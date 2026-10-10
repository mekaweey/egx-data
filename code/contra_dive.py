# -*- coding: utf-8 -*-
"""Deep-dive contradictions: print the actual days+values both sides. Plus missing-TF check."""
import csv, os
from datetime import datetime, timezone
BASE = r"D:\EGX_DATA"

def daily_map(sym):
    dd = {}
    with open(os.path.join(BASE, "01_daily", "EGX_" + sym + ".csv"), encoding="utf-8", errors="replace", newline="") as fh:
        rd = csv.reader(fh)
        h = [x.strip().lower() for x in next(rd)]
        di = h.index("date") if "date" in h else h.index("datetime_utc")
        oi, hi, li, ci, vi = h.index("open"), h.index("high"), h.index("low"), h.index("close"), h.index("volume")
        for r in rd:
            if len(r) > max(di, oi, hi, li, ci, vi):
                dd[r[di][:10]] = (r[oi], r[hi], r[li], r[ci], r[vi])
    return dd

def intra_day(sym, tf):
    day = {}
    with open(os.path.join(BASE, "05_intraday", tf, "EGX_" + sym + ".csv"), encoding="utf-8", errors="replace", newline="") as fh:
        rd = csv.reader(fh)
        h = [x.strip().lower() for x in next(rd)]
        ti, oi, hi, li, ci, vi = h.index("time"), h.index("open"), h.index("high"), h.index("low"), h.index("close"), h.index("volume")
        for r in rd:
            if len(r) <= max(ti, oi, hi, li, ci, vi):
                continue
            try:
                dt = datetime.fromtimestamp(int(float(r[ti])), tz=timezone.utc).date().isoformat()
            except Exception:
                continue
            d = day.setdefault(dt, [])
            try:
                d.append((float(r[oi]), float(r[hi]), float(r[li]), float(r[ci]), float(r[vi]), r[ti]))
            except Exception:
                pass
    return day

for sym, tf in [("GRCA", "60m"), ("GRCA", "1m"), ("SAIB", "60m"), ("DEIN", "60m"), ("VERT", "60m"), ("SPHT", "60m")]:
    dm = daily_map(sym)
    iday = intra_day(sym, tf)
    print("====" + sym + " " + tf + " daily-rows=" + str(len(dm)) + " intradays=" + str(len(iday)), flush=True)
    shown = 0
    for dt in sorted(iday):
        r = dm.get(dt)
        if r is None:
            continue
        H, L = float(r[1]), float(r[2])
        bars = iday[dt]
        ih = max(b[1] for b in bars)
        il = min(b[2] for b in bars)
        dev_h = abs(ih - H) / H if H > 0 else 0
        dev_l = abs(il - L) / L if L > 0 else 0
        if dev_h > 0.005 or dev_l > 0.005:
            print(dt + " daily(H,L)=(" + r[1] + "," + r[2] + ") intra(H,L)=(" + str(ih) + "," + str(il) +
                  ") nbars=" + str(len(bars)) + " vol_d=" + r[4] +
                  " vol_i=" + str(round(sum(b[4] for b in bars), 1)), flush=True)
            shown += 1
            if shown >= 4:
                break
print("== missing-TF check ==", flush=True)
for sym in ["HALN", "RMTV", "ACRO", "EIUD"]:
    row = [sym]
    for tf in ["1m", "5m", "15m", "30m", "60m", "240m"]:
        row.append(tf + "=" + ("Y" if os.path.exists(os.path.join(BASE, "05_intraday", tf, "EGX_" + sym + ".csv")) else "-"))
    print(" ".join(row), flush=True)
