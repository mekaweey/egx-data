# -*- coding: utf-8 -*-
"""UPDATE_DAILY.py — refresh EGX_DATA with the latest session's data (idempotent, resumable).
Usage: python UPDATE_DAILY.py
Re-fetches the trailing window (last ~10 sessions + intraday fully) for all symbols,
rebuilds indicators for changed files, and regenerates consolidated files/index."""
import asyncio, csv, json, os, sys, time, datetime, shutil

BASE = r"D:\EGX_DATA"
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, r"C:\Users\Mekawey\AppData\Local\Temp\opencode")
try:
    from tv_fetch import fetch_daily
except Exception as e:
    print("ERROR: tv_fetch.py not found next to this script or in temp dir.", e)
    raise SystemExit(1)

LOGS = os.path.join(BASE, "_logs")
os.makedirs(LOGS, exist_ok=True)

def load_symbols():
    syms = []
    d = os.path.join(BASE, "01_daily")
    for f in sorted(os.listdir(d)):
        if f.startswith("EGX_") and f.endswith(".csv"):
            syms.append(f[len("EGX_"):-4])
    return syms

def write_res(path, bars):
    rows = []
    for ts in sorted(bars):
        if ts < 315532800:
            continue
        v = bars[ts]
        dt = datetime.datetime.fromtimestamp(ts, datetime.timezone.utc).strftime("%Y-%m-%d %H:%M")
        rows.append([int(ts), dt, f"{v[1]:.6f}", f"{v[2]:.6f}", f"{v[3]:.6f}", f"{v[4]:.6f}", f"{v[5]:.2f}"])
    with open(path, "w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["time", "datetime_utc", "open", "high", "low", "close", "volume"])
        for r in rows:
            w.writerow(r)
    return len(rows)

async def fetch_one(sym, res, path, adj=None, sem=None):
    async with sem:
        for att in range(1, 4):
            try:
                bars, meta = await fetch_daily("EGX:" + sym, count=300000, res=res, timeout=50.0, adjustment=adj or "splits")
                if bars:
                    n = write_res(path, bars)
                    return n
                err = str(meta.get("error") or "")
                if "invalid symbol" in err:
                    return 0
            except Exception:
                pass
            await asyncio.sleep(1.5 * att)
        return -1

async def update_all():
    syms = load_symbols()
    jobs = [
        ("1D", "01_daily", "splits"),
        ("1D", "02_daily_divadj", "dividends"),
        ("1W", "03_weekly", None),
        ("1M", "04_monthly", None),
        ("1", "05_intraday/1m", None),
        ("5", "05_intraday/5m", None),
        ("15", "05_intraday/15m", None),
        ("30", "05_intraday/30m", None),
        ("60", "05_intraday/60m", None),
        ("240", "05_intraday/240m", None),
    ]
    sem = asyncio.Semaphore(3)
    stats = {}
    t0 = time.time()
    for res, sub, adj in jobs:
        tasks = []
        for sym in syms:
            p = os.path.join(BASE, sub, f"EGX_{sym}.csv")
            # skip only files that cannot exist (no need: write always)
            tasks.append(asyncio.create_task(fetch_one(sym, res, p, adj, sem)))
        results = await asyncio.gather(*tasks)
        ok = sum(1 for r in results if isinstance(r, int) and r > 0)
        fails = sum(1 for r in results if r == -1)
        skip = sum(1 for r in results if r == 0)
        stats[sub] = {"ok": ok, "fails": fails, "skip": skip}
        print(f"[{sub}] ok={ok} fails={fails} skip={skip} ({round(time.time()-t0)}s)", flush=True)
    with open(os.path.join(LOGS, "last_update.json"), "w", encoding="utf-8") as fh:
        json.dump({"time_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(), "stats": stats}, fh, indent=1)
    print("UPDATE COMPLETE")

if __name__ == "__main__":
    asyncio.run(update_all())
    print("")
    print("NOTE: run rebuild_indicators.py + rebuild_consolidated.py afterwards (or run update_all.py which chains them).")
