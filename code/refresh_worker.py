# -*- coding: utf-8 -*-
"""Refresh worker: full-history fetch per shard. Writes files atomically. No secrets printed.
Usage: refresh_worker.py <shard> <nshards>
Env: TVSID, TVSIGN."""
import asyncio, csv, json, os, sys, time, datetime
sys.path.insert(0, r"C:\Users\Mekawey\AppData\Local\Temp\opencode")
from tv_fetch2 import fetch_bars

SHARD = int(sys.argv[1])
NSHARD = int(sys.argv[2])
BASE = r"D:\EGX_DATA"
LOG = os.path.join(BASE, "_logs", "refresh_%d.log" % SHARD)

def log(m):
    with open(LOG, "a", encoding="utf-8") as fh:
        fh.write(datetime.datetime.now().isoformat(timespec="seconds") + " " + m + "\n")
    print(m, flush=True)

def load_symbols():
    d = os.path.join(BASE, "01_daily")
    return sorted(f[len("EGX_"):-4] for f in os.listdir(d)
                  if f.startswith("EGX_") and f.endswith(".csv"))

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

def do_fetch(tvsym, res, path, count):
    last_err = ""
    for att in range(1, 3):
        try:
            bars, meta = fetch_bars(tvsym, res=res, count=count, timeout=60)
            if meta.get("resolved") and bars:
                return write_res(path, bars)
            last_err = "resolved=%s n=%s err=%s" % (meta.get("resolved"), meta.get("n"), str(meta.get("error"))[:100])
            err = str(meta.get("error") or "")
            if "invalid symbol" in err:
                return 0
        except Exception as e:
            last_err = "EXC " + str(e)[:100]
        time.sleep(3 * att)
    try:
        with open(os.path.join(BASE, "_logs", "fetch_errors.log"), "a", encoding="utf-8") as fh:
            fh.write(datetime.datetime.now().isoformat(timespec="seconds") + " " + tvsym + " " + res + " " + last_err + "\n")
    except Exception:
        pass
    return -1

def main():
    syms = load_symbols()
    mine = [s for i, s in enumerate(syms) if i % NSHARD == SHARD]
    log("shard %d/%d syms=%d" % (SHARD, NSHARD, len(mine)))
    stats = {"ok": 0, "empty": 0, "fail": 0}
    for k, sym in enumerate(mine):
        # 1W/1M rebuilt offline from refreshed daily (verified vs TV on overlap) - not fetched
        jobs = [("1D", "01_daily"), ("1", "05_intraday/1m"), ("5", "05_intraday/5m"),
                ("15", "05_intraday/15m"), ("30", "05_intraday/30m"), ("60", "05_intraday/60m"),
                ("240", "05_intraday/240m")]
        consec = 0
        for res, sub in jobs:
            p = os.path.join(BASE, sub, "EGX_" + sym + ".csv")
            try:
                # resume-safe: skip only if file TAIL already has fresh data (>= 2026-10-08)
                if os.path.exists(p):
                    with open(p, "rb") as fh:
                        fh.seek(-400, 2)
                        tail = fh.read().decode("utf-8", errors="replace")
                    lastline = [l for l in tail.strip().splitlines() if l.strip()][-1]
                    cols = lastline.split(",")
                    dt = cols[1][:10] if len(cols) > 1 else ""
                    # TV's latest EGX session is 2026-10-07 (verified live); tails there = COMPLETE
                    if dt >= "2026-10-07":
                        stats["skip"] = stats.get("skip", 0) + 1
                        continue
            except Exception:
                pass
            n = do_fetch("EGX:" + sym, res, p, 300000)
            if n > 0:
                stats["ok"] += 1
                consec = 0
            elif n == 0:
                stats["empty"] += 1
                consec = 0
            else:
                stats["fail"] += 1
                consec += 1
                if consec >= 3:
                    log("cooldown 120s (throttle?)")
                    time.sleep(120)
                    consec = 0
            time.sleep(12)
        if (k + 1) % 10 == 0:
            log("progress %d/%d %s" % (k + 1, len(mine), stats))
        elif (k + 1) % 2 == 0:
            log("sym %d/%d %s last=%s" % (k + 1, len(mine), stats, sym))
        time.sleep(3)
    # shard 0 also does indices + FX
    if SHARD == 0:
        for tvsym, fn in [("EGX:EGX30", "EGX30_daily.csv"), ("EGX:EGX70EWI", "EGX70EWI_daily.csv"),
                          ("EGX:EGX100EWI", "EGX100EWI_daily.csv"),
                          ("EGX:EGX30CAPPED", "EGX30CAPPED_daily.csv"),
                          ("EGX:SHARIAH", "SHARIAH_daily.csv"),
                          ("EGX:TAMAYUZ", "TAMAYUZ_daily.csv"),
                          ("EGX:EGX35-LV", "EGX35-LV_daily.csv"),
                          ("FX:USDEGP", None)]:
            if fn is None:
                p = os.path.join(BASE, "_fx", "USDEGP_daily_tv.csv")
                os.makedirs(os.path.dirname(p), exist_ok=True)
                n = do_fetch(tvsym, "1D", p, 300000)
            else:
                p = os.path.join(BASE, "09_indices", fn)
                n = do_fetch(tvsym, "1D", p, 300000)
            log("index %s -> %s" % (tvsym, n))
    log("DONE %s" % stats)

main()
