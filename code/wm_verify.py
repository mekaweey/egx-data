# -*- coding: utf-8 -*-
"""Validate offline weekly/monthly rebuild vs TV files on overlap. Proves method before use."""
import csv, os
from datetime import datetime, timezone
BASE = r"D:\EGX_DATA"

def load_daily(sym):
    rows = []
    with open(os.path.join(BASE, "01_daily", "EGX_" + sym + ".csv"), encoding="utf-8", errors="replace", newline="") as fh:
        rd = csv.reader(fh)
        h = [x.strip().lower() for x in next(rd)]
        di = h.index("date") if "date" in h else h.index("datetime_utc")
        oi, hi, li, ci, vi = h.index("open"), h.index("high"), h.index("low"), h.index("close"), h.index("volume")
        for r in rd:
            if len(r) > max(di, oi, hi, li, ci, vi):
                rows.append(r)
    return rows, (di, oi, hi, li, ci, vi)

def load_tv(path):
    dd = {}
    with open(path, encoding="utf-8", errors="replace", newline="") as fh:
        rd = csv.reader(fh)
        h = [x.strip().lower() for x in next(rd)]
        di = h.index("date") if "date" in h else h.index("datetime_utc")
        oi, hi, li, ci, vi = h.index("open"), h.index("high"), h.index("low"), h.index("close"), h.index("volume")
        for r in rd:
            if len(r) > max(di, oi, hi, li, ci, vi):
                dd[r[di][:10]] = (r[oi], r[hi], r[li], r[ci], r[vi])
    return dd

def build_weekly(rows, idx):
    di, oi, hi, li, ci, vi = idx
    weeks = {}
    for r in rows:
        dt = r[di][:10]
        d = datetime.strptime(dt, "%Y-%m-%d").date()
        sun = d.fromordinal(d.toordinal() - ((d.weekday() + 1) % 7))
        w = weeks.setdefault(sun.isoformat(), [])
        w.append(r)
    out = {}
    for sun, rs in weeks.items():
        rs.sort(key=lambda x: x[di])
        try:
            out[sun] = (rs[0][oi], max(float(x[hi]) for x in rs), min(float(x[li]) for x in rs),
                        rs[-1][ci], sum(float(x[vi]) for x in rs))
        except Exception:
            pass
    return out

def build_monthly(rows, idx):
    di, oi, hi, li, ci, vi = idx
    out = {}
    for r in rows:
        m = r[di][:7]
        d = out.setdefault(m, [])
        d.append(r)
    res = {}
    for m, rs in out.items():
        rs.sort(key=lambda x: x[di])
        try:
            res[m + "-01"] = (rs[0][oi], max(float(x[hi]) for x in rs), min(float(x[li]) for x in rs),
                              rs[-1][ci], sum(float(x[vi]) for x in rs))
        except Exception:
            pass
    return res

tot = dev = 0
tested = 0
for sym in ["COMI", "ABUK", "EAST", "FWRY", "HRHO", "TMGH", "SKPC", "ORAS", "SWDY", "CIRA"]:
    rows, idx = load_daily(sym)
    wmine = build_weekly(rows, idx)
    wtv = load_tv(os.path.join(BASE, "03_weekly", "EGX_" + sym + ".csv"))
    for sun, (o, h, l, c, v) in wmine.items():
        t = wtv.get(sun)
        if t is None:
            continue
        tot += 1
        try:
            if abs(float(t[0]) - float(o)) > 1e-4 or abs(float(t[3]) - float(c)) > 1e-4 or abs(float(t[4]) - v) > max(v * 1e-6, 0.01):
                dev += 1
                if dev <= 5:
                    print("WDEV", sym, sun, "mine", (o, c, v), "tv", (t[0], t[3], t[4]), flush=True)
        except Exception:
            dev += 1
    mmine = build_monthly(rows, idx)
    mtv = load_tv(os.path.join(BASE, "04_monthly", "EGX_" + sym + ".csv"))
    for m, (o, h, l, c, v) in mmine.items():
        t = mtv.get(m)
        if t is None:
            continue
        tot += 1
        try:
            if abs(float(t[0]) - float(o)) > 1e-4 or abs(float(t[3]) - float(c)) > 1e-4:
                dev += 1
                if dev <= 8:
                    print("MDEV", sym, m, "mine", (o, c), "tv", (t[0], t[3]), flush=True)
        except Exception:
            dev += 1
    tested += 1
print("compared=%d devs=%d syms=%d" % (tot, dev, tested), flush=True)
