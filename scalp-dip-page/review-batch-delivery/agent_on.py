import json
from collections import defaultdict
import datetime as dt
from datetime import timedelta
import pickle
TMP = 'C:/Users/Mekawey/AppData/Local/Temp/opencode/'
P = pickle.load(open(TMP + 'study_panel.pkl', 'rb'))
HALAL = set(l.strip().upper() for l in open('D:/meky-stock-main/meky-stock-main/halal-symbols.txt', encoding='utf-8') if l.strip())
UNI = sorted(s for s in HALAL if s in P)
SESS = sorted({d for s, m in P.items() for d in m
               if '2001' <= d[:4] <= '2023' and dt.date.fromisoformat(d).weekday() in (6, 0, 1, 2, 3)})
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

def v20(s, ref):
    m = P.get(s, {})
    ds = sorted(d for d in m if d <= ref)[-20:]
    if len(ds) < 18:
        return 0, 0
    return sum(m[d][3] * (m[d][4] or 0) for d in ds) / 20, len(ds)

trades = []
for d in SESS:
    cands = []
    for s in UNI:
        m = P.get(s, {})
        if d not in m or m[d][3] <= 0:
            continue
        v, cnt = v20(s, d)
        if cnt < 18 or v < FLOORS.get(int(d[:4]), 200000) or m[d][3] < 0.5:
            continue
        if not ((m[d][4] or 0) > 0):
            continue
        cands.append(s)
    picks = sorted(cands)[:20]
    nxt = sorted(x for x in SESS if x > d)
    if not nxt:
        continue
    nd = nxt[0]
    for s in picks:
        m = P.get(s, {})
        if nd not in m or not (m[nd][0] > 0):
            continue
        r = m[nd][0] / m[d][3] - 1 - 0.0005
        trades.append((d, s, round(r, 5), nd))
json.dump(trades, open(TMP + 'agent_overnight.json', 'w'))
byw = defaultdict(float)
for d, s, r, xd in trades:
    dd = dt.date.fromisoformat(xd)
    sun = str(dd - timedelta(days=(dd.weekday() + 1) % 7))
    byw[sun] += r * 0.05
wr = sorted(byw.items())
R = [r for _, r in wr]
n = len(R)
print('OVERNIGHT weeks=%d win=%.3f mean=%+.5f trades=%d' % (
    n, sum(1 for r in R if r > 0) / n, sum(R) / n, len(trades)))
