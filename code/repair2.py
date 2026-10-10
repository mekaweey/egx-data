# -*- coding: utf-8 -*-
"""Repair pass: refetch possibly-shifted files with FIXED writer + verify every file.
Usage: repair2.py <shard> <nshards>. Env creds."""
import csv, os, sys, time, datetime
sys.path.insert(0, r"C:\Users\Mekawey\AppData\Local\Temp\opencode")
from tv_fetch2 import fetch_bars
SHARD, NSHARD = int(sys.argv[1]), int(sys.argv[2])
BASE = r"D:\EGX_DATA"
EVENS = "AALR,ACAMD,ACGC,ACTF,ADIB,ADRI,AFMC,AIFI,AJWA,ALEX,AMER,AMIA,AMOC,APPC,ARAB,ARCC,ASCM,ATLC,AXPH,BIGP,BIOC,BTFH,CANA,CCAPP,CEFM,CFGH".split(",")
ODDS = "ABUK,ACAP,ACRO,ADCI,ADPC,AFDI,AIDC,AIH,ALCN,ALUM,AMES,AMII,AMPI,APSW,ARBLAND,AREH,ASPI,ATQA,BIDI,BINV,BONY,CAED,CCAP".split(",")
FIXED7 = {"AALR", "ABUK", "ACAMD", "ACAP", "ACGC", "ACTF", "ADIB"}
ALLJ = [("1D", "01_daily"), ("1", "05_intraday/1m"), ("5", "05_intraday/5m"),
        ("15", "05_intraday/15m"), ("30", "05_intraday/30m"), ("60", "05_intraday/60m"),
        ("240", "05_intraday/240m"), ("1W", "03_weekly"), ("1M", "04_monthly")]
WM = [("1W", "03_weekly"), ("1M", "04_monthly")]
TARGETS = []
for s in EVENS + ODDS:
    TARGETS.append((s, WM if s in FIXED7 else ALLJ))
MINE = [t for i, t in enumerate(TARGETS) if i % NSHARD == SHARD]
print("repair shard %d/%d targets=%d" % (SHARD, NSHARD, len(MINE)), flush=True)

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
    bad = n = 0
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
                if not (h >= max(o, c) - 1e-6 and l <= min(o, c) + 1e-6 and h >= l):
                    bad += 1
            except Exception:
                bad += 1
    return n, bad

ok = fail = 0
for sym, jobs in MINE:
    for res, sub in jobs:
        good = False
        for att in range(3):
            try:
                bars, meta = fetch_bars("EGX:" + sym, res=res, count=300000, timeout=90)
                if meta.get("resolved") and bars:
                    p = os.path.join(BASE, sub, "EGX_" + sym + ".csv")
                    n = write_res(p, bars)
                    vn, vb = verify(p)
                    if vb == 0 and vn == n:
                        ok += 1
                        good = True
                        break
                    print("VERIFY-FAIL %s %s n=%d bad=%d" % (sym, res, n, vb), flush=True)
            except Exception as e:
                print("EXC %s %s %s" % (sym, res, str(e)[:60]), flush=True)
            time.sleep(8)
        if not good:
            fail += 1
            print("FAIL " + sym + " " + res, flush=True)
        time.sleep(12)
    print("repaired %s ok=%d fail=%d" % (sym, ok, fail), flush=True)
print("REPAIR SHARD %d DONE ok=%d fail=%d" % (SHARD, ok, fail), flush=True)
