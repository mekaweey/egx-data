# -*- coding: utf-8 -*-
"""Full-power local audit shard (CPU only, no network).
Usage: audit_shard.py <shard> <nshards>. Checks daily+divadj+intraday integrity per symbol."""
import csv, os, sys, json
SHARD, NSHARD = int(sys.argv[1]), int(sys.argv[2])
BASE = r"D:\EGX_DATA"
syms = sorted(f[len("EGX_"):-4] for f in os.listdir(os.path.join(BASE, "01_daily"))
              if f.startswith("EGX_") and f.endswith(".csv"))
mine = [s for i, s in enumerate(syms) if i % NSHARD == SHARD]

def read_daily(path):
    rows = []
    with open(path, encoding="utf-8", errors="replace", newline="") as fh:
        rd = csv.reader(fh)
        h = [x.strip().lower() for x in (next(rd, None) or [])]
        try:
            di = h.index("date") if "date" in h else h.index("datetime_utc")
            oi, hi, li, ci, vi = h.index("open"), h.index("high"), h.index("low"), h.index("close"), h.index("volume")
        except ValueError:
            return None, ["bad-header"]
        for r in rd:
            if len(r) <= max(di, oi, hi, li, ci, vi):
                return rows, ["short-row"]
            rows.append(r)
    return rows, []

def f(x, d=0.0):
    try:
        return float(x)
    except Exception:
        return d

out = []
for sym in mine:
    rep = {"sym": sym, "issues": []}
    rows, err = read_daily(os.path.join(BASE, "01_daily", "EGX_" + sym + ".csv"))
    if rows is None:
        rep["issues"] += err
        out.append(rep)
        continue
    dates = [r[0][:10] for r in rows]
    # locate date col index
    with open(os.path.join(BASE, "01_daily", "EGX_" + sym + ".csv"), encoding="utf-8", errors="replace", newline="") as fh:
        h = [x.strip().lower() for x in next(csv.reader(fh))]
    di = h.index("date") if "date" in h else h.index("datetime_utc")
    oi, hi, li, ci, vi = h.index("open"), h.index("high"), h.index("low"), h.index("close"), h.index("volume")
    dates = [r[di][:10] for r in rows]
    if len(dates) != len(set(dates)):
        rep["issues"].append("dup-dates")
    if dates != sorted(dates):
        rep["issues"].append("unsorted")
    bad_ohlc = 0
    negvol = 0
    for r in rows:
        o, hh, l, c = f(r[oi]), f(r[hi]), f(r[li]), f(r[ci])
        if not (hh >= max(o, c) - 1e-6 and l <= min(o, c) + 1e-6 and hh >= l):
            bad_ohlc += 1
        if f(r[vi]) < 0:
            negvol += 1
    if bad_ohlc:
        rep["issues"].append("bad-ohlc:%d/%d" % (bad_ohlc, len(rows)))
    if negvol:
        rep["issues"].append("negvol:%d" % negvol)
    # divadj file presence + ratio sanity (divadj/splits in [0,1.000001])
    pB = os.path.join(BASE, "02_daily_divadj", "EGX_" + sym + ".csv")
    if os.path.exists(pB):
        bws, _ = read_daily(pB)
        if bws is not None:
            bd = {}
            for r in bws:
                bd[r[di][:10]] = f(r[ci])
            weird = 0
            for r in rows:
                a = f(r[ci])
                b = bd.get(r[di][:10])
                if a > 0 and b is not None and b > 0:
                    rr = b / a
                    if not (0 < rr <= 1.000001):
                        weird += 1
                        if weird < 4:
                            rep.setdefault("ratio_ex", []).append((r[di][:10], round(rr, 4)))
            if weird:
                rep["issues"].append("ratio-weird:%d" % weird)
    # intraday day-range vs daily H/L (60m + 1m sample)
    for tf in ["60m", "1m"]:
        p = os.path.join(BASE, "05_intraday", tf, "EGX_" + sym + ".csv")
        if not os.path.exists(p):
            rep["issues"].append("missing-" + tf)
            continue
        day = {}
        with open(p, encoding="utf-8", errors="replace", newline="") as fh:
            rd = csv.reader(fh)
            hh = [x.strip().lower() for x in (next(rd, None) or [])]
            try:
                ti = hh.index("time")
                oi2, hi2, li2, ci2 = hh.index("open"), hh.index("high"), hh.index("low"), hh.index("close")
            except ValueError:
                rep["issues"].append(tf + "-bad-header")
                continue
            from datetime import datetime, timezone
            for r in rd:
                if len(r) <= max(ti, oi2, hi2, li2, ci2):
                    continue
                try:
                    dt = datetime.fromtimestamp(int(float(r[ti])), tz=timezone.utc).date().isoformat()
                except Exception:
                    continue
                d = day.setdefault(dt, [0, 0, 0, 0, 0])
                try:
                    o2, h2, l2, c2 = float(r[oi2]), float(r[hi2]), float(r[li2]), float(r[ci2])
                except Exception:
                    continue
                if d[4] == 0:
                    d[0] = o2
                d[1] = max(d[1], h2)
                d[2] = l2 if d[4] == 0 else min(d[2], l2)
                d[3] = c2
                d[4] += 1
        # compare ~30 sampled days
        import random
        random.seed(7)
        keys = sorted(day)
        samp = [keys[i] for i in range(0, len(keys), max(1, len(keys) // 30))]
        dmap = {r[di][:10]: r for r in rows}
        narrow = 0
        contra = 0
        for dt in samp:
            r = dmap.get(dt)
            if r is None:
                continue
            H, L = f(r[hi]), f(r[li])
            ih, il = day[dt][1], day[dt][2]
            if H > 0 and (abs(ih - H) / H > 0.005 or (L > 0 and abs(il - L) / L > 0.005)):
                # within (intraday narrower = partial coverage, benign) vs contradiction (exceeds daily)
                if ih <= H * 1.000001 and (L <= 0 or il >= L * 0.999999):
                    narrow += 1
                else:
                    contra += 1
        if narrow:
            rep["issues"].append(tf + "-narrower:%d/%d" % (narrow, len(samp)))
        if contra:
            rep["issues"].append(tf + "-CONTRADICTION:%d/%d" % (contra, len(samp)))
    out.append(rep)
    print("audited " + sym + " issues=" + str(rep["issues"][:3]), flush=True)
with open(os.path.join(BASE, "_logs", "audit_%d.json" % SHARD), "w", encoding="utf-8") as fh:
    json.dump(out, fh, ensure_ascii=False, indent=0)
nbad = sum(1 for r in out if r["issues"])
print("SHARD %d DONE syms=%d with-issues=%d" % (SHARD, len(out), nbad), flush=True)
