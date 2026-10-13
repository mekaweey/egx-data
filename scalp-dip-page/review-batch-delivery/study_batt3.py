"""B4.3 splits / B4.4 clusters / benchmarks / dependence / bootstrap. Weekly series only."""
import json, math
import pickle
P = pickle.load(open('C:/Users/Mekawey/AppData/Local/Temp/opencode/study_panel.pkl', 'rb'))
MOD = json.load(open('C:/Users/Mekawey/AppData/Local/Temp/opencode/study_modern.json', encoding='utf-8'))

# market weekly EW series (full panel, Sun-week first->last close)
import datetime as dt
from datetime import timedelta
from collections import defaultdict
bydate = defaultdict(dict)
for s, m in P.items():
    for d, r in m.items():
        bydate[d][s] = r
sess = sorted(d for d, ss in bydate.items()
              if dt.date.fromisoformat(d).weekday() in (6, 0, 1, 2, 3) and len(ss) >= 50)
mkt = {}
weeks = []
for d in sess:
    dd = dt.date.fromisoformat(d)
    sun = str(dd - timedelta(days=(dd.weekday() + 1) % 7))
    if weeks and weeks[-1][0] == sun:
        weeks[-1][1].append(d)
    else:
        weeks.append([sun, [d]])
MKT = {}
for sun, ds in weeks:
    if len(ds) < 2:
        continue
    a, b = ds[0], ds[-1]
    rs = [bydate[b][s][3] / bydate[a][s][3] - 1 for s in bydate[b]
          if s in bydate[a] and bydate[a][s][3] > 0 and bydate[b][s][3] > 0]
    if len(rs) >= 50:
        MKT[sun] = sum(rs) / len(rs)
print('market weeks=', len(MKT))

TRS = [x for x in MOD if x.get('mode') == 'TRADE']
R = [(x['ed'], x['weekly']) for x in TRS]
print('== B4.3 up/down split ==')
up = [r for d, r in R if MKT.get(str(dt.date.fromisoformat(d) - timedelta(days=(dt.date.fromisoformat(d).weekday() + 1) % 7)), 0) > 0]
dn = [r for d, r in R if MKT.get(str(dt.date.fromisoformat(d) - timedelta(days=(dt.date.fromisoformat(d).weekday() + 1) % 7)), 0) <= 0]
for tag, v in (('UP', up), ('DN', dn)):
    print('%s n=%d win=%.2f mean=%+.4f' % (tag, len(v), sum(1 for x in v if x > 0) / len(v) if v else 0, sum(v) / len(v) if v else 0))
print('== B4.4 clusters ==')
rets = [r for _, r in R]
cc = sum(1 for i in range(1, len(rets)) if rets[i] <= 0 and rets[i - 1] <= 0)
print('P(2 consec losses)=%.3f (%d/%d)' % (cc / (len(rets) - 1), cc, len(rets) - 1))
for L in (2, 4):
    cs = [sum(rets[i:i + L]) for i in range(len(rets) - L + 1)]
    cs.sort()
    print('L=%d min=%.4f p10=%.4f P(<=-8%%)=%.3f P(<=-13%%)=%.3f' % (
        L, cs[0], cs[len(cs) // 10], sum(1 for v in cs if v <= -0.08) / len(cs), sum(1 for v in cs if v <= -0.13) / len(cs)))
streak, longest, cur = 0, 0, 0
for v in rets:
    cur = cur + 1 if v <= 0 else 0
    longest = max(longest, cur)
print('longest losing streak=%d' % longest)
print('== beta vs EW ==')
pairs = [(r, MKT.get(str(dt.date.fromisoformat(d) - timedelta(days=(dt.date.fromisoformat(d).weekday() + 1) % 7)))) for d, r in R]
pairs = [(a, b) for a, b in pairs if b is not None]
mx = sum(p[1] for p in pairs) / len(pairs)
my = sum(p[0] for p in pairs) / len(pairs)
cov = sum((a - my) * (b - mx) for a, b in pairs)
var = sum((b - mx) ** 2 for b, _ in [(p[1], p[0]) for p in pairs])
print('beta=%.3f n=%d | EW mean=%.5f' % (cov / var, len(pairs), mx))
json.dump({'mkt': MKT}, open('C:/Users/Mekawey/AppData/Local/Temp/opencode/mkt.json', 'w'))
