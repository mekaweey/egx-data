"""Structurally-different families on DEV 2001-2023. Pre-listed. NO TUNING.
T1 trailing-stop exits; T2 gap+trend both directions; T3 index-drawdown timing;
T4 turtle breakout; T5 unconditional intraday drift; T6 gap+TOM combo."""
import json
from collections import defaultdict
import datetime as dt
from datetime import timedelta
from bisect import bisect_right
import pickle
TMP = 'C:/Users/Mekawey/AppData/Local/Temp/opencode/'
P = pickle.load(open(TMP + 'study_panel.pkl', 'rb'))
HALAL = set(l.strip().upper() for l in open('D:/meky-stock-main/meky-stock-main/halal-symbols.txt', encoding='utf-8') if l.strip())
UNI = sorted(s for s in HALAL if s in P)
SESS = sorted({d for s, m in P.items() for d in m
               if '2001' <= d[:4] <= '2023' and dt.date.fromisoformat(d).weekday() in (6, 0, 1, 2, 3)})
SD = {s: sorted(m) for s, m in P.items()}
import sys
sys.path.insert(0, TMP)
from study_lib import year_floor
vals2025 = []
for s in HALAL:
    for d, r in P.get(s, {}).items():
        if d.startswith('2025') and r[3] > 0:
            vals2025.append(r[3] * (r[4] or 0))
vals2025.sort()
MED2025 = vals2025[len(vals2025) // 2]
FLOORS = {y: year_floor(y, MED2025) for y in range(2001, 2027)}
ADJ = json.load(open(TMP + 'adjustments.json', encoding='utf-8'))
EV = set()
for _s, _v in ADJ.items():
    for _d, _x in _v:
        if abs(_x) >= 0.15:
            EV.add((_s, _d))

def has_event(sym, d0, d1):
    for (s, d) in EV:
        if s == sym and d0 <= d <= d1:
            return True
    return False

def v20(s, ref):
    m = P.get(s, {})
    ds = sorted(d for d in m if d <= ref)[-20:]
    if len(ds) < 18:
        return 0, 0
    return sum(m[d][3] * (m[d][4] or 0) for d in ds) / 20, len(ds)

def liquid_ok(s, ref):
    v, cnt = v20(s, ref)
    m = P.get(s, {})
    ds = sorted(d for d in m if d <= ref)
    if not ds or m[ds[-1]][3] < 0.5:
        return False
    if not ((m[ds[-1]][4] or 0) > 0):
        return False
    return cnt >= 18 and v >= FLOORS.get(int(ref[:4]), 200000)

MKT = {}
for d in SESS:
    dd = dt.date.fromisoformat(d)
    sun = str(dd - timedelta(days=(dd.weekday() + 1) % 7))
    MKT.setdefault(sun, []).append(d)
MKTC = {}
for sun, ds in MKT.items():
    if len(ds) < 2:
        continue
    a, b = ds[0], ds[-1]
    rs = []
    for s in UNI:
        m = P.get(s, {})
        if a in m and b in m and m[a][3] > 0 and m[b][3] > 0:
            rs.append(m[b][3] / m[a][3] - 1)
    if len(rs) >= 15:
        MKTC[sun] = sum(rs) / len(rs)

def idx_dd(ref, look=60):
    ds = sorted(d for d in SESS if d <= ref)[-look:]
    if len(ds) < 20:
        return 0
    cl = []
    for d in ds:
        rs = []
        for s in UNI:
            m = P.get(s, {})
            if d in m and m[d][3] > 0:
                rs.append(m[d][3])
        cl.append(sum(rs) / len(rs) if rs else 0)
    mx = max(cl)
    return cl[-1] / mx - 1 if mx > 0 else 0

def run(name):
    tr = []
    if name == 'T4':
        for d in SESS:
            cands = []
            for s in UNI:
                m = P.get(s, {})
                ds = sorted(x for x in m if x <= d)[-20:]
                if len(ds) < 20:
                    continue
                if not liquid_ok(s, d):
                    continue
                # signal confirmed at today's CLOSE; entry is NEXT open (no lookahead)
                if d not in m or m[d][3] < max(m[x][3] for x in ds):
                    continue
                cands.append(s)
            fut = sorted(x for x in SESS if x > d)
            if len(fut) < 6:
                continue
            ed, xd = fut[0], fut[5]
            for s in sorted(cands)[:5]:
                m = P.get(s, {})
                if ed not in m or xd not in m or m[ed][0] <= 0 or m[xd][0] <= 0:
                    continue
                if has_event(s, d, xd):
                    continue
                tr.append((ed, s, round(m[xd][0] / m[ed][0] - 1 - 0.0005, 5), xd))
        return tr
    if name == 'T5':
        for d in SESS:
            cands = []
            for s in UNI:
                m = P.get(s, {})
                if d not in m or m[d][0] <= 0 or m[d][3] <= 0:
                    continue
                if not liquid_ok(s, d):
                    continue
                if not ((m[d][4] or 0) > 0):
                    continue
                dayval = m[d][3] * m[d][4]
                if 20000 / dayval > 0.05:
                    continue
                cands.append(s)
            for s in sorted(cands)[:10]:
                m = P.get(s, {})
                tr.append((d, s, round(m[d][3] / m[d][0] - 1 - 0.0005, 5), d))
        return tr
    if name == 'T3':
        for d in SESS:
            dd = idx_dd(d)
            if dd > -0.05:
                continue
            cands = []
            for s in UNI:
                m = P.get(s, {})
                if d not in m or m[d][0] <= 0:
                    continue
                if not liquid_ok(s, d):
                    continue
                if not ((m[d][4] or 0) > 0):
                    continue
                dayval = m[d][3] * (m[d][4] or 0)
                if 20000 / dayval > 0.05:
                    continue
                cands.append(s)
            for s in sorted(cands)[:10]:
                fut = sorted(x for x in SESS if x > d)
                if len(fut) < 10:
                    continue
                xd = fut[9]
                m = P.get(s, {})
                if xd not in m or m[xd][3] <= 0:
                    continue
                if has_event(s, d, xd):
                    continue
                tr.append((d, s, round(m[xd][3] / m[d][0] - 1 - 0.0005, 5), xd))
        return tr
    # T1 trailing / T2 trenddir / T6 gap+TOM use gap base
    for d in SESS:
        prev = sorted(x for x in SESS if x < d)
        if not prev:
            continue
        pd = prev[-1]
        cands = []
        for s in UNI:
            m = P.get(s, {})
            if d not in m or pd not in m or m[d][0] <= 0 or m[pd][3] <= 0:
                continue
            gap = m[d][0] / m[pd][3] - 1
            if not (-0.04 <= gap <= -0.01):
                continue
            if not liquid_ok(s, pd):
                continue
            if not ((m[d][4] or 0) > 0):
                continue
            dayval = m[d][3] * (m[d][4] or 0)
            if 20000 / dayval > 0.05:
                continue
            if name == 'T2':
                ds = sorted(x for x in m if x <= pd)[-50:]
                if len(ds) < 50:
                    continue
                ma50 = sum(m[x][3] for x in ds) / 50
                tr50 = m[pd][3] / ma50 - 1
                cands.append((s, gap, tr50))
            elif name == 'T6':
                mdays = sorted(x for x in SESS if x[:7] == d[:7])
                if d not in mdays[:3] and d not in mdays[-3:]:
                    continue
                cands.append((s, gap, 0))
            else:
                cands.append((s, gap, 0))
        cands.sort(key=lambda x: x[1])
        picks = [s for s, g, _ in cands[:5]]
        if name == 'T2':
            ups = [s for s, g, t in cands[:10] if t > 0][:5]
            dns = [s for s, g, t in cands[:10] if t <= 0][:5]
            picks = ups + dns
            picks = picks[:5]
        fut = sorted(x for x in SESS if x > d)
        hold = 2
        if len(fut) < hold:
            continue
        for s in picks:
            m = P.get(s, {})
            entry = m[d][0]
            if name == 'T1':
                # trailing: track closes, stop trails 4% below running max, max 5 sessions
                path = [m[x][3] for x in ([d] + [f for f in fut[:5] if f in m]) if x in m and m[x][3] > 0]
                peak = entry
                r = None
                for p in path[1:6]:
                    peak = max(peak, p)
                    if p / peak - 1 <= -0.04:
                        r = p / entry - 1 - 0.0005
                        break
                if r is None:
                    last = path[5] if len(path) > 5 else path[-1]
                    r = last / entry - 1 - 0.0005
                    xd = ([d] + [f for f in fut[:5] if f in m])[min(5, len(path) - 1)]
                else:
                    xd = d
                if has_event(s, d, xd):
                    continue
                tr.append((d, s, round(r, 5), xd))
            else:
                xd = fut[hold - 1]
                if xd not in m or not (m[xd][3] > 0):
                    continue
                if has_event(s, d, xd):
                    continue
                tr.append((d, s, round(m[xd][3] / m[d][0] - 1 - 0.0005, 5), xd))
    return tr

if __name__ == '__main__':
    import sys as _s
    name = _s.argv[1]
    tr = run(name)
    json.dump(tr, open(TMP + 'ag3_%s.json' % name, 'w'))
    print(name, 'trades=%d' % len(tr), flush=True)
