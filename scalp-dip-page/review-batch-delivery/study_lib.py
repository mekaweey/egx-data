"""Study lib: frozen panel, official calendar, agreed-rule screens. NO TUNING."""
import json, pickle
from datetime import date, timedelta
import datetime as dt

P = pickle.load(open('C:/Users/Mekawey/AppData/Local/Temp/opencode/study_panel.pkl', 'rb'))
HALAL = set(l.strip().upper() for l in open('D:/meky-stock-main/meky-stock-main/halal-symbols.txt', encoding='utf-8') if l.strip())
BIGSTEPS = json.load(open('C:/Users/Mekawey/AppData/Local/Temp/opencode/bigsteps.json', 'rb'))
EVSET = set()
for s, d, x in BIGSTEPS:
    EVSET.add((s, d))
# confirmed DOWN gaps (splits/bonus/rights) from consecutive-session scan
DOWN = json.load(open('C:/Users/Mekawey/AppData/Local/Temp/opencode/corpactions.json', 'rb'))
for s, d0, d1, g in DOWN['confirmed']:
    if g < -0.20:
        EVSET.add((s, d1))
for s, d0, d1, g in DOWN['unverified']:
    if g < -0.20:
        EVSET.add((s, d1))

HOL_2026 = {'2026-04-12', '2026-05-07', '2026-05-26', '2026-05-27', '2026-05-28',
            '2026-05-31', '2026-06-18', '2026-07-02', '2026-07-23', '2026-08-27', '2026-10-08'}
SEP_HOLE = '2026-09-17'

def build_calendar():
    bydate = {}
    for s, m in P.items():
        for d in m:
            bydate.setdefault(d, set()).add(s)
    years = {}
    for d, ss in bydate.items():
        years.setdefault(d[:4], []).append((d, len(ss)))
    sess = []
    for y, lst in years.items():
        act = sorted(s for s, m in P.items() if sum(1 for d in m if d.startswith(str(y))) >= 100)
        n = len(act)
        for d, c in lst:
            wd = dt.date.fromisoformat(d).weekday()
            if wd in (6, 0, 1, 2, 3) and n and c >= 0.5 * n:
                sess.append(d)
    return sorted(sess)

SESS = build_calendar()

def lastn(ref, n):
    out, cur = [], dt.date.fromisoformat(ref)
    while len(out) < n:
        iso = str(cur)
        if iso in SESS:
            out.append(iso)
        cur -= timedelta(days=1)
    return sorted(out)

def entry_exit(sun):
    nxt = sorted(d for d in SESS if d >= sun)
    if not nxt:
        return None, None
    ed = nxt[0]
    esun = dt.date.fromisoformat(ed) + timedelta(days=7 - ((dt.date.fromisoformat(ed).weekday() + 1) % 7))
    ext = sorted(d for d in SESS if d >= str(esun))
    if not ext:
        return None, None
    return ed, ext[0]

def year_floor(year, med2025):
    vals = []
    for s in HALAL:
        for d, r in P.get(s, {}).items():
            if d.startswith(str(year)) and r[3] > 0:
                vals.append(r[3] * (r[4] or 0))
    vals.sort()
    med = vals[len(vals) // 2] if vals else 1
    return 200000 * med / med2025

def has_event(sym, d0, d1):
    for (s, d) in EVSET:
        if s == sym and d0 <= d <= d1:
            return True
    return False
