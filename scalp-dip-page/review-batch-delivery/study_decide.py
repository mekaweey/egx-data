import json, math, random
from collections import defaultdict
MOD = json.load(open('C:/Users/Mekawey/AppData/Local/Temp/opencode/study_modern.json', encoding='utf-8'))
MID = json.load(open('C:/Users/Mekawey/AppData/Local/Temp/opencode/study_mid.json', encoding='utf-8'))
EAR = json.load(open('C:/Users/Mekawey/AppData/Local/Temp/opencode/study_early.json', encoding='utf-8'))
ALL = MOD + MID + EAR
yy = defaultdict(list)
for x in ALL:
    if x.get('mode') != 'TRADE':
        continue
    nfill = sum(1 for p in x['picks'] if p.get('st') == 'ok')
    adj = x['weekly'] - 0.0025 * nfill / 5
    yy[x['ed'][:4]].append(adj)
years = sorted(yy)
ymeans = dict((y, sum(yy[y]) / len(yy[y])) for y in years)
print('years:', len(years))
pooled = sum(ymeans.values()) / len(ymeans)
print('POOLED@0.3pct mean=%+.5f' % pooled)
random.seed(7)
bs = []
for _ in range(2000):
    samp = [random.choice(years) for _ in years]
    bs.append(sum(ymeans[y] for y in samp) / len(samp))
bs.sort()
print('BOOTSTRAP years: lower95=%+.5f median=%+.5f' % (bs[50], bs[1000]))
print('RULE-I: mean>0.005?', pooled > 0.005, ' lower>0?', bs[50] > 0)
print('RULE-III: modern win 0.539>=0.55?', 0.539 >= 0.55)
print('RULE-IV: p10=0.42>=0.45? False (B4.2 modern rolling-26)')
wy = {}
for x in ALL:
    if x.get('mode') == 'TRADE':
        wy.setdefault(x['ed'][:4], []).append(x['weekly'])
over70 = sum(1 for y, v in wy.items() if sum(1 for r in v if r > 0) / len(v) >= 0.70)
print('YEARS>=70pct: %d/%d -> 70-in-75pct? %s' % (over70, len(wy), over70 / len(wy) >= 0.75))
