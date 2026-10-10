# -*- coding: utf-8 -*-
"""Audit: intraday coverage, fundamentals, indices, FX, dividends. Read-only."""
import os, csv
from datetime import datetime, timezone
BASE = os.path.join("D:", "EGX_DATA")

def span(d, sample_n=1000000):
    fs = sorted([f for f in os.listdir(d) if f.endswith(".csv")]) if os.path.exists(d) else []
    if not fs:
        return (0, None, None)
    mn, mx = None, None
    # scan first, middle, last file fully; others: first+last row only
    idx = set([0, len(fs) // 2, len(fs) - 1])
    for k, f in enumerate(fs):
        with open(os.path.join(d, f), encoding="utf-8", errors="replace", newline="") as fh:
            rd = csv.reader(fh)
            try:
                h = next(rd)
            except StopIteration:
                continue
            di = 0
            first = last = None
            for r in rd:
                if not r:
                    continue
                v = r[di]
                if first is None:
                    first = v
                last = v
        if first and last:
            if mn is None or first < mn:
                mn = first
            if mx is None or last > mx:
                mx = last
    return (len(fs), mn, mx)

def epoch_to_date(e):
    try:
        return datetime.fromtimestamp(int(float(e)), tz=timezone.utc).date().isoformat()
    except Exception:
        return str(e)[:10]

print("== intraday ==")
for tf in ["1m", "5m", "15m", "30m", "60m", "240m", "1D"]:
    d = os.path.join(BASE, "05_intraday", tf)
    n, mn, mx = span(d)
    print(tf + " files=" + str(n) +
          (" range=" + epoch_to_date(mn) + "->" + epoch_to_date(mx) if mn else ""), flush=True)

def lsdir(p):
    if not os.path.exists(p):
        return ["MISSING DIR"]
    out = []
    for e in sorted(os.listdir(p))[:40]:
        fp = os.path.join(p, e)
        out.append(e + (" [DIR]" if os.path.isdir(fp) else " (%dk)" % (os.path.getsize(fp) // 1024)))
    return out

print("== 07_fundamentals ==", flush=True)
for line in lsdir(os.path.join(BASE, "07_fundamentals")):
    print("  " + line, flush=True)
print("== 09_indices ==", flush=True)
for line in lsdir(os.path.join(BASE, "09_indices")):
    print("  " + line, flush=True)
print("== root files (fx/div related) ==", flush=True)
for e in sorted(os.listdir(BASE)):
    l = e.lower()
    if any(k in l for k in ["usd", "egp", "fx", "curr", "div", "index", "idx"]) and not e.startswith("0") and not e.startswith("1"):
        print("  " + e, flush=True)
print("== workspace default (old project) ==", flush=True)
for line in lsdir(r"C:\Users\Mekawey\.zcode\workspace\default"):
    print("  " + line, flush=True)
