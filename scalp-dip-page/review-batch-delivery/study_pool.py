"""Pooled equal-year evaluation + GO/NO-GO decision rules. Reads era JSONs."""
import json, math
from collections import defaultdict
MOD = json.load(open('C:/Users/Mekawey/AppData/Local/Temp/opencode/study_modern.json', encoding='utf-8'))
MID = json.load(open('C:/Users/Mekawey/AppData/Local/Temp/opencode/study_mid.json', encoding='utf-8'))
EAR = json.load(open('C:/Users/Mekawey/AppData/Local/Temp/opencode/study_early.json', encoding='utf-8'))

def wilson(w, n, z=1.96):
    p = w / n if n else 0
    den = 1 + z * z / n if n else 1
    ctr = (p + z * z / (2 * n)) / den if n else 0
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / den if n else 0
    return (p, ctr - half, ctr + half)

ALL = MOD + MID + EAR
yy = defaultdict(list)
for x in ALL:
    if x.get('mode') == 'TRADE':
        yy[x['ed'][:4]].append(x['weekly'])
print('YEAR n win mean')
ymeans = {}
for y in sorted(yy):
    r = yy[y]
    w = sum(1 for v in r if v > 0)
    p, lo, hi = wilson(w, len(r))
    print('%s %d %.2f %+.4f' % (y, len(r), p, sum(r) / len(r)))
    ymeans[y] = sum(r) / len(r)
years = sorted(ymeans)
pooled = sum(ymeans.values()) / len(ymeans)
print('POOLED equal-year mean=%+.5f over %d years' % (pooled, len(years)))
# era splits
for tag, y0, y1 in (('modern21-26', 2021, 2026), ('mid16-20', 2016, 2020), ('early01-15', 2001, 2015)):
    sel = [v for y, v in ymeans.items() if y0 <= int(y) <= y1]
    rrs = [v for y, vv in yy.items() if y0 <= int(y) <= y1 for v in vv]
    w = sum(1 for v in rrs if v > 0)
    p, lo, hi = wilson(w, len(rrs))
    print('%s: years=%d weeks=%d win=%.3f CI=[%.3f,%.3f] mean=%+.5f' % (
        tag, len(sel), len(rrs), p, lo, hi, sum(rrs) / len(rrs) if rrs else 0))
