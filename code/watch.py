# -*- coding: utf-8 -*-
"""Heartbeat watcher: updates STATUS_LIVE.md every 30s + balloon on finish/stall.
Usage: watch.py <nshards>   (expects refresh_0..N logs with DONE lines)"""
import os, sys, time, datetime

NSHARD = int(sys.argv[1]) if len(sys.argv) > 1 else 1
STATUS = r"C:\Users\Mekawey\OneDrive\Documents\Default Project\STATUS_LIVE.md"
LOGD = r"D:\EGX_DATA\_logs"

def balloon(title, text):
    try:
        import subprocess
        ps = ("Import-Module BurntToast; "
              "New-BurntToastNotification -Text '" + title + "', '" + text + "'")
        subprocess.run(["powershell", "-NoProfile", "-Command", ps], timeout=60)
    except Exception:
        pass

def readlog(i):
    p = os.path.join(LOGD, "refresh_%d.log" % i)
    if not os.path.exists(p):
        return "", 0
    with open(p, encoding="utf-8", errors="replace") as fh:
        s = fh.read()
    return s, os.path.getmtime(p)

def write(state, extra=""):
    now = datetime.datetime.now().isoformat(timespec="seconds")
    with open(STATUS, "w", encoding="utf-8") as fh:
        fh.write("# 🟢 LIVE STATUS — نبض العمل (كل ~30 ثانية)\n"
                 "- state: " + state + "\n- updated: " + now + "\n" + extra)

t0 = time.time()
last_change = time.time()
notified = False
while time.time() - t0 < 6 * 3600:
    dones, progs, changed = 0, [], False
    for i in range(NSHARD):
        s, mt = readlog(i)
        if mt > last_change:
            changed = True
        if "DONE" in s:
            dones += 1
        lines = [l for l in s.strip().splitlines() if l.strip()]
        progs.append("shard%d: %s" % (i, lines[-1][11:] if lines else "no-log"))
    if changed:
        last_change = time.time()
    now = datetime.datetime.now().isoformat(timespec="seconds")
    if dones == NSHARD:
        write("DONE ✅", "- updated: " + now + "\n- shards: %d/%d done\n" % (dones, NSHARD)
              + "".join("- " + p + "\n" for p in progs))
        balloon("OpenCode", "انتهى التحديث (%d/%d) — راجع النتائج" % (dones, NSHARD))
        break
    stalled = (time.time() - last_change > 20 * 60)
    write("WORKING 🔄" if not stalled else "STALLED ⚠️ (no log change 20min)",
          "- updated: " + now + "\n" + "".join("- " + p + "\n" for p in progs))
    time.sleep(30)
else:
    write("TIMEOUT ⛔ (6h)")
    balloon("OpenCode", "انتهت مهلة المراقبة 6 ساعات")
