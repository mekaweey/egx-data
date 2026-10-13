"""Consensus system: GAP + MOM-weekly + ON + F2 agents vote daily; trade symbols
picked by >=2 agents (SYS1) + variants. One pass over dev days. Frozen specs."""
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
SIX = {d: i for i, d in enumerate(SESS)}
def prev_sess(d):
    i = SIX.get(d, -1)
    return SESS[i - 1] if i > 0 else None
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

from bisect import bisect_right
def v20(s, ref):
    m = P.get(s, {})
    ds = SD.get(s, [])
    i = bisect_right(ds, ref)
    win = ds[max(0, i - 20):i]
    if len(win) < 18:
        return 0, 0
    return sum(m[d][3] * (m[d][4] or 0) for d in win) / 20, len(win)

V0W = json.load(open(TMP + 'var_V0.json', encoding='utf-8'))
MOMHOLD = defaultdict(set)
for x in V0W:
    if x.get('mode') != 'TRADE':
        continue
    for p in x['picks']:
        if p.get('st') != 'ok':
            continue
        ds = sorted(d for d in SESS if x['ed'] <= d <= x['xd'])
        for d in ds:
            MOMHOLD[d].add(p['s'] + '|MOM')

def gapset(d):
    out = set()
    pd = prev_sess(d)
    if not pd:
        return out
    for s in UNI:
        m = P.get(s, {})
        if d not in m or m[d][0] <= 0:
            continue
        if pd not in m or m[pd][3] <= 0:
            continue
        gap = m[d][0] / m[pd][3] - 1
        if not (-0.04 <= gap <= -0.01):
            continue
        v, cnt = v20(s, pd)
        if cnt < 18 or v < FLOORS.get(int(d[:4]), 200000):
            continue
        if not ((m[d][4] or 0) > 0):
            continue
        dayval = m[d][3] * (m[d][4] or 0)
        if dayval <= 0 or 20000 / dayval > 0.05:
            continue
        out.add(s + '|GAP')
    return out

def onset(d):
    liq = []
    for s in UNI:
        m = P.get(s, {})
        if d not in m or m[d][3] <= 0:
            continue
        v, cnt = v20(s, d)
        if cnt < 18 or v < FLOORS.get(int(d[:4]), 200000) or m[d][3] < 0.5:
            continue
        if not ((m[d][4] or 0) > 0):
            continue
        liq.append((v, s))
    liq.sort(reverse=True)
    return set(s + '|ON' for _, s in liq[:20])

def f2set(d):
    out = set()
    for s in UNI:
        m = P.get(s, {})
        if d not in m or m[d][3] <= 0:
            continue
        ds = sorted(x for x in m if x <= d)
        if len(ds) < 51:
            continue
        ma50 = sum(m[x][3] for x in ds[-50:]) / 50
        if m[d][3] <= ma50:
            continue
        r1 = m[d][3] / m[ds[-2]][3] - 1 if m[ds[-2]][3] > 0 else 0
        r3 = m[d][3] / m[ds[-4]][3] - 1 if len(ds) >= 4 and m[ds[-4]][3] > 0 else 0
        if not (r1 <= -0.05 or r3 <= -0.08):
            continue
        v, cnt = v20(s, d)
        if cnt < 18 or v < FLOORS.get(int(d[:4]), 200000):
            continue
        out.add(s + '|F2')
    return out

def run_sys(mode):
    trades = []
    for d in SESS:
        votes = defaultdict(list)
        for tagged in gapset(d) | MOMHOLD.get(d, set()) | onset(d) | f2set(d):
            s, a = tagged.split('|')
            votes[s].append(a)
        if mode == 'SYS1':
            agreed = [s for s, v in votes.items() if len(set(v)) >= 2]
        elif mode == 'SYS2':
            agreed = [s for s, v in votes.items() if 'GAP' in v and 'MOM' in v]
        else:
            agreed = []
        fut = SESS[SIX[d] + 1:SIX[d] + 2]
        if len(fut) < 1:
            continue
        xd = fut[0]
        for s in sorted(agreed)[:5]:
            m = P.get(s, {})
            if xd not in m or not (m[xd][3] > 0):
                continue
            if has_event(s, d, xd):
                continue
            # clean filters
            if not ((m[d][4] or 0) > 0):
                continue
            dayval = m[d][3] * (m[d][4] or 0)
            if dayval <= 0 or 20000 / dayval > 0.05:
                continue
            r = m[xd][3] / m[d][0] - 1 - 0.0005
            trades.append((d, s, round(r, 5), xd))
    return trades

if __name__ == '__main__':
    import sys as _s
    mode = _s.argv[1]
    tr = run_sys(mode)
    json.dump(tr, open(TMP + 'sys_%s.json' % mode, 'w'))
    print(mode, 'trades=%d' % len(tr), flush=True)
