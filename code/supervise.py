# -*- coding: utf-8 -*-
"""Supervisor: every cycle checks workers/tripwire/watcher; relaunches missing ones.
Designed to run from Windows Task Scheduler every 15 min (env TVSID/TVSIGN provided by launcher).
Logs to _logs/supervisor.log. Exits after one cycle."""
import os, sys, time, datetime, subprocess, glob

BASE = r"D:\EGX_DATA"
LOGD = os.path.join(BASE, "_logs")
TMP = r"C:\Users\Mekawey\AppData\Local\Temp\opencode"
STALE_WORKER = 25 * 60
STALE_HB = 10 * 60

def log(m):
    line = datetime.datetime.now().isoformat(timespec="seconds") + " " + m
    print(line, flush=True)
    with open(os.path.join(LOGD, "supervisor.log"), "a", encoding="utf-8") as fh:
        fh.write(line + "\n")

def live_procs():
    """PIDs of live python workers by script+arg (prevents duplicate launches)."""
    found = set()
    try:
        import subprocess as sp
        out = sp.run(["powershell", "-NoProfile", "-Command",
                      "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'refresh_worker|tripwire|watch\\.py|merge_dry|merge_all' -and $_.Name -match '^python' } | ForEach-Object { $_.CommandLine }"],
                     capture_output=True, text=True, timeout=60)
        for line in out.stdout.splitlines():
            m = None
            import re
            m = re.search(r"refresh_worker\.py\"\s+(\d)\s+(\d)", line) or re.search(r"refresh_worker\.py\s+(\d)\s+(\d)", line)
            if m:
                found.add(("refresh", int(m.group(1))))
            if "tripwire.py" in line:
                found.add(("tripwire", -1))
            if "watch.py" in line:
                found.add(("watch", -1))
            if "merge_dry.py" in line:
                found.add(("merge", 0))
            if "merge_all.py" in line:
                found.add(("merge", 1))
    except Exception as e:
        log("proc-scan-fail " + str(e)[:80])
    return found

def mtime(p):
    try:
        return os.path.getmtime(p)
    except Exception:
        return 0

def launch(cmd):
    try:
        subprocess.Popen(["powershell", "-NoProfile", "-Command", cmd],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except Exception as e:
        log("launch-fail " + str(e)[:100])
        return False

def log_done(i):
    try:
        with open(os.path.join(LOGD, "refresh_%d.log" % i), encoding="utf-8", errors="replace") as fh:
            return "DONE" in fh.read()
    except Exception:
        return False

def main():
    now = time.time()
    live = live_procs()
    log("live: " + str(sorted(live)))
    # 1) refresh shards — PRIMARY signal is process liveness (a fresh log with a dead
    # process must relaunch IMMEDIATELY, not after 25 min)
    for i in (0, 1):
        lp = os.path.join(LOGD, "refresh_%d.log" % i)
        if log_done(i):
            log("shard %d DONE, skip" % i)
            continue
        age = now - mtime(lp)
        if ("refresh", i) in live:
            log("shard %d process ALIVE (log age %.1f min) - no action" % (i, age / 60))
        else:
            log("shard %d process DEAD (log age %.1f min) -> relaunch NOW" % (i, age / 60))
            if launch("python3 \"%s\\refresh_worker.py\" %d 2" % (TMP, i)):
                log("shard %d relaunched" % i)
    # 2) tripwire heartbeat
    tp = os.path.join(LOGD, "tripwire.log")
    try:
        with open(tp, encoding="utf-8", errors="replace") as fh:
            tdata = fh.read()
    except Exception:
        tdata = ""
    if (now - mtime(tp) > STALE_HB) and ("tripwire exit" not in tdata[-500:]):
        if ("tripwire", -1) in live:
            log("tripwire process ALIVE - no action")
        else:
            log("tripwire stale+dead -> relaunch")
            launch("python3 \"%s\\tripwire.py\"" % TMP)
    else:
        log("tripwire alive-or-done")
    # 3) watcher heartbeat
    sp = r"C:\Users\Mekawey\OneDrive\Documents\Default Project\STATUS_LIVE.md"
    if now - mtime(sp) > STALE_HB:
        if ("watch", -1) in live:
            log("watcher process ALIVE - no action")
        else:
            log("watcher stale+dead -> relaunch")
            launch("python3 \"%s\\watch.py\" 2" % TMP)
    else:
        log("watcher alive")
    # 4) merge guard: started-but-dead needs a human decision (dry vs real), never auto-relaunch
    mp = os.path.join(LOGD, "merge.log")
    try:
        with open(mp, encoding="utf-8", errors="replace") as fh:
            mdata = fh.read()
    except Exception:
        mdata = ""
    mrunning = ("merge", 0) in live or ("merge", 1) in live
    if "MERGE DONE" in mdata:
        log("merge done")
        # chain: launch pack build once (marker prevents loops)
        pkdone = os.path.join(LOGD, "pack.done")
        pkrun = os.path.join(LOGD, "pack.running")
        if not os.path.exists(pkdone) and not os.path.exists(pkrun):
            try:
                open(pkrun, "w").write(datetime.datetime.now().isoformat())
            except Exception:
                pass
            log("launching pack build")
            launch("python3 \"%s\\pack_build.py\"" % TMP)
        elif os.path.exists(pkdone):
            log("pack done")
        else:
            log("pack running")
    elif mrunning:
        log("merge process alive")
    elif "merge start" in mdata or "MODE:REAL" in mdata:
        # real merge started-but-dead: safe to relaunch (idempotent + resume-skip)
        log("merge REAL started-but-dead -> relaunch")
        launch("python3 \"%s\\merge_all.py\"" % TMP)
    elif "merge start" in mdata:
        log("merge STARTED-BUT-DEAD -> human decision needed, NOT auto-relaunching")
    else:
        log("merge not started")
    log("cycle done")

main()
