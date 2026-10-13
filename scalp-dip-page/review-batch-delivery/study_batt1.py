"""B4 battery + decision rules. Reads era JSONs. Seeds fixed. NO TUNING."""
import json, math, random
from collections import defaultdict
import datetime as dt

MOD = json.load(open('C:/Users/Mekawey/AppData/Local/Temp/opencode/study_modern.json', encoding='utf-8'))
MID = json.load(open('C:/Users/Mekawey/AppData/Local/Temp/opencode/study_mid.json', encoding='utf-8'))
EAR = json.load(open('C:/Users/Mekawey/AppData/Local/Temp/opencode/study_early.json', encoding='utf-8'))

def wilson(w, n, z=1.96):
    if not n:
        return (0, 0, 0)
    p = w / n
    den = 1 + z * z / n
    ctr = (p + z * z / (2 * n)) / den
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / den
    return (p, ctr - half, ctr + half)

def year_table(weeks, tag):
    print('=== B4.1 %s ===' % tag)
    yy = defaultdict(list)
    pk = defaultdict(list)
    for x in weeks:
        if x.get('mode') != 'TRADE':
            continue
        yy[x['ed'][:4]].append(x['weekly'])
        for p in x['picks']:
            if p.get('st') == 'ok':
                pk[x['ed'][:4]].append(p['r'])
    print('year weeks win wilson_lo wilson_hi mean median ex_top2 worst pickwin')
    for y in sorted(yy):
        r = yy[y]
        w = sum(1 for v in r if v > 0)
        p, lo, hi = wilson(w, len(r))
        s2 = sorted(r)
        ext2 = (sum(s2) - s2[-1] - s2[-2]) / (len(s2) - 2) if len(s2) > 2 else 0
        pr = pk[y]
        pw = sum(1 for v in pr if v > 0) / len(pr) if pr else 0
        print('%s %d %.2f %.2f %.2f %+.4f %+.4f %+.4f %+.4f %.2f' % (y, len(r), p, lo, hi, sum(r) / len(r), sorted(r)[len(r) // 2], ext2, s2[0], pw))
    return yy

def rolling(weeks, tag):
    rets = [x['weekly'] for x in weeks if x.get('mode') == 'TRADE']
    print('=== B4.2 %s n=%d ===' % (tag, len(rets)))
    for L in (13, 26, 52):
        if len(rets) < L:
            print('L=%d too short' % L)
            continue
        wins = []
        for i in range(len(rets) - L + 1):
            w = rets[i:i + L]
            wins.append(sum(1 for v in w if v > 0) / L)
        wins.sort()
        import statistics as st
        print('L=%d windows=%d >=70%%:%.2f >=60%%:%.2f >=50%%:%.2f p10=%.2f median=%.2f' % (
            L, len(wins), sum(1 for v in wins if v >= 0.7) / len(wins),
            sum(1 for v in wins if v >= 0.6) / len(wins), sum(1 for v in wins if v >= 0.5) / len(wins),
            wins[len(wins) // 10], wins[len(wins) // 2]))
    return rets

if __name__ == '__main__':
    for weeks, tag in ((MOD, 'modern21-26'), (MID, 'mid16-20'), (EAR, 'early01-15')):
        tr = [x for x in weeks if x.get('mode') == 'TRADE']
        print('#### ERA %s weeks=%d traded=%d' % (tag, len(weeks), len(tr)))
        if tr:
            year_table(weeks, tag)
            rolling(weeks, tag)
