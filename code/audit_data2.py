# -*- coding: utf-8 -*-
"""Careful per-timeframe audit: parse time col properly (epoch or ISO), global min/max, row counts."""
import os, csv
from datetime import datetime, timezone
BASE = os.path.join("D:", "EGX_DATA", "05_intraday")

def ptime(v):
    v = (v or "").strip()
    if not v:
        return None
    if v[0].isdigit() and len(v) >= 9 and v.replace(".", "", 1).replace("-", "", 1).isdigit() and "-" not in v and "/" not in v and ":" not in v:
        try:
            return datetime.fromtimestamp(int(float(v)), tz=timezone.utc).date().isoformat()
        except Exception:
            return None
    return v[:10]

for tf in ["1m", "5m", "15m", "30m", "60m", "240m"]:
    d = os.path.join(BASE, tf)
    fs = sorted([f for f in os.listdir(d) if f.endswith(".csv")])
    gmin, gmax, totrows, badfiles = None, None, 0, []
    for f in fs:
        try:
            with open(os.path.join(d, f), encoding="utf-8", errors="replace", newline="") as fh:
                rd = csv.reader(fh)
                h = next(rd, None)
                if not h:
                    badfiles.append(f + ":empty")
                    continue
                # find time col
                hl = [x.strip().lower() for x in h]
                ti = hl.index("time") if "time" in hl else 0
                n = 0
                fmin, fmax = None, None
                for r in rd:
                    if len(r) <= ti:
                        continue
                    dt = ptime(r[ti])
                    if not dt or len(dt) < 8:
                        continue
                    n += 1
                    if fmin is None or dt < fmin:
                        fmin = dt
                    if fmax is None or dt > fmax:
                        fmax = dt
                totrows += n
                if fmin and (gmin is None or fmin < gmin):
                    gmin = fmin
                if fmax and (gmax is None or fmax > gmax):
                    gmax = fmax
                if n == 0:
                    badfiles.append(f + ":0rows")
        except Exception as e:
            badfiles.append(f + ":" + str(e)[:60])
    print(tf + " files=" + str(len(fs)) + " totalrows=" + str(totrows) +
          " range=" + str(gmin) + "->" + str(gmax), flush=True)
    if badfiles[:5]:
        print("  bad: " + str(badfiles[:5]), flush=True)

# fundamentals content
print("== fundamentals content ==", flush=True)
for f in ["fundamentals_long.csv", "fundamentals_wide.csv", "dividends_summary.csv", "financials_wide.csv", "quotes_snapshot.csv"]:
    p = os.path.join(BASE, "..", "07_fundamentals", f)
    p = os.path.normpath(p)
    if not os.path.exists(p):
        print(f + " MISSING", flush=True)
        continue
    with open(p, encoding="utf-8", errors="replace", newline="") as fh:
        rd = csv.reader(fh)
        h = next(rd, None)
        n = sum(1 for _ in rd)
    print(f + " rows=" + str(n) + " cols=" + str(h), flush=True)
ps = os.path.join(BASE, "..", "07_fundamentals", "per_symbol")
if os.path.exists(ps):
    fs = os.listdir(ps)
    print("per_symbol files=" + str(len(fs)) + " sample=" + str(sorted(fs)[:5]), flush=True)
fp = os.path.join(BASE, "..", "07_fundamentals", "financials_pages")
if os.path.exists(fp):
    print("financials_pages entries=" + str(len(os.listdir(fp))), flush=True)

# indices ranges
print("== indices ranges ==", flush=True)
for f in ["EGX30_daily.csv", "EGX70EWI_daily.csv", "SHARIAH_daily.csv"]:
    p = os.path.join(BASE, "..", "09_indices", f)
    p = os.path.normpath(p)
    with open(p, encoding="utf-8", errors="replace", newline="") as fh:
        rd = csv.reader(fh)
        h = [x.strip().lower() for x in (next(rd, None) or [])]
        di = h.index("date") if "date" in h else 0
        rows = [r for r in rd if len(r) > di]
    print(f + " rows=" + str(len(rows)) + " range=" +
          (rows[0][di][:10] + "->" + rows[-1][di][:10] if rows else "?") + " cols=" + str(h), flush=True)

# FX hunt
print("== FX hunt ==", flush=True)
for root, _, files in os.walk(r"C:\Users\Mekawey\AppData\Local\Temp\opencode"):
    for fn in files:
        l = fn.lower()
        if any(k in l for k in ["usd", "fx", "curr", "egp"]) and l.endswith(".json"):
            print("  TEMP: " + fn, flush=True)
    break
ws = r"C:\Users\Mekawey\.zcode\workspace\default\data"
if os.path.exists(ws):
    for e in sorted(os.listdir(ws))[:30]:
        print("  WSDATA: " + e, flush=True)
