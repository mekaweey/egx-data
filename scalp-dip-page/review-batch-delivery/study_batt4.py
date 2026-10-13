"""Bootstrap (seed 7), dependence, CSVs. Weekly/pick series only."""
import json, math, random, csv
MOD = json.load(open('C:/Users/Mekawey/AppData/Local/Temp/opencode/study_modern.json', encoding='utf-8'))
TRS = [x for x in MOD if x.get('mode') == 'TRADE']
R = [x['weekly'] for x in TRS]
print('== block bootstrap 6-wk, seed 7, 2000 resamples ==')
random.seed(7)
bm, bw = [], []
n = len(R)
for _ in range(2000):
    s = []
    while len(s) < n:
        i = random.randrange(0, n - 5)
        s.extend(R[i:i + 6])
    s = s[:n]
    bm.append(sum(s) / n)
    bw.append(sum(1 for v in s if v > 0) / n)
bm.sort()
bw.sort()
print('mean CI95=[%.5f, %.5f] win CI95=[%.3f, %.3f]' % (bm[50], bm[1950], bw[50], bw[1950]))
print('== dependence ==')
s2 = sorted(R)
print('ex_top2 mean=%+.5f' % ((sum(s2) - s2[-1] - s2[-2]) / (n - 2)))
yy = {}
for x in TRS:
    yy.setdefault(x['ed'][:4], []).append(x['weekly'])
means = {y: sum(v) / len(v) for y, v in yy.items()}
besty = max(means, key=means.get)
rest = [v for y, v in yy.items() if y != besty for v in [v][0]]
print('ex_best_year(%s): n=%d mean=%+.5f' % (besty, len(rest), sum(rest) / len(rest)))
from collections import defaultdict
sp = defaultdict(list)
for x in TRS:
    for p in x['picks']:
        if p.get('st') == 'ok':
            sp[p['s']].append(p['r'])
tot = {s: sum(v) for s, v in sp.items()}
top5 = sorted(tot, key=tot.get, reverse=True)[:5]
print('top5 stocks:', [(s, round(tot[s], 3)) for s in top5])
nor = [x['weekly'] for x in TRS for p in x['picks'] if False]
# weekly returns recomputed without top-5-stock picks (cap-weighted rescale)
rw = []
for x in TRS:
    rs = [p['r'] for p in x['picks'] if p.get('st') == 'ok' and p['s'] not in top5]
    k = len([p for p in x['picks'] if p.get('st') == 'ok'])
    rw.append(sum(rs) * (20000 / 100000) if rs else 0.0)
print('ex_5stocks: n=%d mean=%+.5f win=%.3f' % (len(rw), sum(rw) / len(rw), sum(1 for v in rw if v > 0) / len(rw)))
# ex devaluation windows (2022-03 + 2022-10..2023-01 + 2024-03/04)
def in_deval(ed):
    return ed.startswith('2022-03') or '2022-10' <= ed[:7] <= '2023-01' or ed.startswith('2024-03') or ed.startswith('2024-04')
nd = [x['weekly'] for x in TRS if not in_deval(x['ed'])]
print('ex_deval: n=%d mean=%+.5f win=%.3f' % (len(nd), sum(nd) / len(nd), sum(1 for v in nd if v > 0) / len(nd)))
# CSVs
with open('D:/meky-stock-main/followup-oct4-delivery/B4_per_week.csv', 'w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['entry', 'signal', 'exit', 'mode', 'weekly_ret', 'n_filled'])
    for x in MOD:
        if x.get('mode') == 'TRADE':
            w.writerow([x['ed'], x['sig'], x['xd'], 'TRADE', x['weekly'], sum(1 for p in x['picks'] if p.get('st') == 'ok')])
        elif x.get('mode') == 'CASH':
            w.writerow(['', x.get('sig', ''), '', 'CASH', 0, 0])
with open('D:/meky-stock-main/followup-oct4-delivery/B4_per_pick.csv', 'w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['entry', 'symbol', 'status', 'ret'])
    for x in TRS:
        for p in x['picks']:
            w.writerow([x['ed'], p['s'], p.get('st'), p.get('r', '')])
print('CSVs written')
