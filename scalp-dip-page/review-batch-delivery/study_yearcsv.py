import json, csv
from collections import defaultdict
MOD = json.load(open('C:/Users/Mekawey\AppData\Local\Temp\opencode/study_modern.json'.replace('\\', '/'), encoding='utf-8'))
MID = json.load(open('C:/Users/Mekawey/AppData/Local/Temp/opencode/study_mid.json', encoding='utf-8'))
EAR = json.load(open('C:/Users/Mekawey/AppData/Local/Temp/opencode/study_early.json', encoding='utf-8'))
TRS = [x for x in MOD if x.get('mode') == 'TRADE']
R = [x['weekly'] for x in TRS]
c2 = [sum(R[i:i + 2]) for i in range(len(R) - 1)]
print('P(2wk<=-10%%)=%.4f (%d/%d)' % (sum(1 for v in c2 if v <= -0.10) / len(c2), sum(1 for v in c2 if v <= -0.10), len(c2)))
yy = defaultdict(list)
for x in TRS:
    yy[x['ed'][:4]].append(x['weekly'])
for y in sorted(yy):
    rest = [v for yy2, vv in yy.items() if yy2 != y for v in vv]
    print('ex_%s: n=%d mean=%+.5f' % (y, len(rest), sum(rest) / len(rest)))
with open('D:/meky-stock-main/followup-oct4-delivery/B4_per_year.csv', 'w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['year', 'era', 'weeks', 'win_rate', 'mean', 'median', 'ex_top2', 'worst'])
    import math
    for tag, data in (('modern', MOD), ('mid', MID), ('early', EAR)):
        d = defaultdict(list)
        for x in data:
            if x.get('mode') == 'TRADE':
                d[x['ed'][:4]].append(x['weekly'])
        for y in sorted(d):
            r = d[y]
            s2 = sorted(r)
            w.writerow([y, tag, len(r), round(sum(1 for v in r if v > 0) / len(r), 3), round(sum(r) / len(r), 5),
                        round(sorted(r)[len(r) // 2], 5),
                        round((sum(s2) - s2[-1] - s2[-2]) / (len(s2) - 2), 5) if len(s2) > 2 else 0, round(s2[0], 5)])
print('per-year CSV written')
