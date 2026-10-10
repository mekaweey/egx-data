# -*- coding: utf-8 -*-
"""Tripwire: watches refresh logs; kills workers on fail-storm; spot-checks fresh files.
Runs until DONE file appears or 8h. Logs to _logs/tripwire.log"""
import csv, os, sys, time, datetime, re, subprocess
BASE = r"D:\EGX_DATA"
LOG = os.path.join(BASE, "_logs", "tripwire.log")

def log(m):
    line = datetime.datetime.now().isoformat(timespec="seconds") + " " + m
    print(line, flush=True)
    with open(LOG, "a", encoding="utf-8") as fh:
        fh.write(line + "\n")

def tail_stats(path):
    try:
        with open(path, encoding="utf-8", errors="replace") as fh:
            lines = fh.read().strip().splitlines()
    except Exception:
        return None
    oks = fails = 0
    for l in lines[-6:]:
        m = re.search(r"'ok':\s*(\d+).*?'fail':\s*(\d+)", l)
        if m:
            oks, fails = int(m.group(1)), int(m.group(2))
    return oks, fails

def kill_workers():
    try:
        ps = ("Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'refresh_worker' -and $_.Name -match '^python' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }; echo killed")
        subprocess.run(["powershell", "-NoProfile", "-Command", ps], timeout=60)
    except Exception as e:
        log("kill-failed " + str(e)[:80])

def spot_check():
    # newest 3 daily files: OHLC gates
    d = os.path.join(BASE, "01_daily")
    files = sorted(((os.path.getmtime(os.path.join(d, f)), f) for f in os.listdir(d) if f.startswith("EGX_")),
                   reverse=True)[:3]
    bad = 0
    for _, f in files:
        try:
            with open(os.path.join(d, f), encoding="utf-8", errors="replace", newline="") as fh:
                rd = csv.reader(fh)
                h = [x.strip().lower() for x in next(rd)]
                oi, hi, li, ci = h.index("open"), h.index("high"), h.index("low"), h.index("close")
                for r in list(rd)[-5:]:
                    o, hh, l, c = float(r[oi]), float(r[hi]), float(r[li]), float(r[ci])
                    if not (hh >= max(o, c) - 1e-6 and l <= min(o, c) + 1e-6):
                        bad += 1
        except Exception:
            bad += 1
    return bad

t0 = time.time()
killed = False
last_ok = (0, 0)
while time.time() - t0 < 8 * 3600:
    s0 = tail_stats(os.path.join(BASE, "_logs", "refresh_0.log"))
    s1 = tail_stats(os.path.join(BASE, "_logs", "refresh_1.log"))
    cur = ((s0 or (0, 0))[0] + (s1 or (0, 0))[0], (s0 or (0, 0))[1] + (s1 or (0, 0))[1])
    snap = "ok=%d fail=%d" % cur
    # fail-storm: fails grew by >=30 with ok growth <=2 since last check
    dok = cur[0] - last_ok[0]
    dfl = cur[1] - last_ok[1]
    if dfl >= 30 and dok <= 2 and not killed:
        log("TRIPWIRE-TRIPPED fail-storm (" + snap + ") -> killing workers")
        kill_workers()
        killed = True
    else:
        log("watch " + snap)
    bad = spot_check()
    log("spotcheck bad-rows=%d" % bad)
    if bad > 0:
        log("SPOTCHECK-FAIL -> killing workers")
        kill_workers()
        killed = True
        break
    last_ok = cur
    time.sleep(120)
log("tripwire exit")
