"""Frozen strategy runner. NO TUNING. Base config + documented variants only."""
import json, math, sys
from datetime import date, timedelta
import datetime as dt
sys.path.insert(0, 'C:/Users/Mekawey/AppData/Local/Temp/opencode')
from study_lib import P, HALAL, SESS, lastn, entry_exit, year_floor, has_event

CFG = dict(mom_lb=5, mom_lo=0.08, mom_hi=0.45, liq_win=20, liq_min=18, mom_min=6,
           liq_top=100, n=5, floor_base=200000, regime_w=10, cost=0.0005, slip=0.0,
           gap_lo=-0.03, gap_hi=0.02, price_min=0.5)

# year floors (median traded value method)
vals2025 = []
for s in HALAL:
    for d, r in P.get(s, {}).items():
        if d.startswith('2025') and r[3] > 0:
            vals2025.append(r[3] * (r[4] or 0))
vals2025.sort()
MED2025 = vals2025[len(vals2025) // 2]
print('MED2025=', round(MED2025))
FLOORS = {y: year_floor(y, MED2025) for y in range(2001, 2027)}
print('FLOORS sample:', {y: round(FLOORS[y]) for y in (2005, 2010, 2015, 2020, 2025)})

def run_era(y0, y1, cfg, uni_all, label):
    variant = int(cfg.get('variant', 4))
    uni = sorted(s for s in uni_all if sum(1 for d in P.get(s, {}) if str(y0) <= d[:4] <= str(y1)) >= 50)
    print('era-universe=', len(uni))
    weeks = []
    d = date(y0, 1, 1)
    sundays = []
    while d <= date(y1, 12, 31):
        if d.weekday() == 6:
            sundays.append(str(d))
        d += timedelta(days=1)
    for sun in sundays:
        prior = sorted(x for x in SESS if x < sun)
        if not prior:
            continue
        sig = prior[-1]
        ee = entry_exit(sun)
        if not ee[0]:
            continue
        ed, xd = ee
        if '2026-09-13' <= sig <= '2026-09-20' or '2026-09-13' <= ed <= '2026-09-20' or '2026-09-13' <= xd <= '2026-09-20':
            weeks.append({'sun': sun, 'skip': 'sep17'})
            continue
        # regime (variant >= 3; v1/v2 run always-invested)
        if variant >= 3 and not regime_on(sig, uni, cfg):
            weeks.append({'sun': sun, 'sig': sig, 'ed': ed, 'xd': xd, 'mode': 'CASH', 'picks': []})
            continue
        floor = FLOORS.get(int(sig[:4]), 200000)
        cands = []
        for s in uni:
            m = P.get(s, {})
            LB = cfg.get('mom_lb', 5)
            mw = lastn(sig, LB + 1)
            mr = [m.get(x) for x in mw]
            if variant >= 4:
                if not all(r and r[3] > 0 and (r[4] or 0) > 0 for r in mr):
                    continue
            else:
                if not all(r and r[3] > 0 for r in mr):
                    continue
            lw = lastn(sig, cfg['liq_win'])
            lr = [m.get(x) for x in lw]
            if variant >= 4:
                pres = [r for r in lr if r and r[3] > 0 and (r[4] or 0) > 0]
                if len(pres) < cfg['liq_min']:
                    continue
            else:
                pres = [r for r in lr if r and r[3] > 0]
                if len(pres) < 10:
                    continue
            lastc = m[mw[-1]][3]
            if lastc < cfg['price_min']:
                continue
            v20 = sum(r[3] * (r[4] or 0) for r in pres) / cfg['liq_win']
            if v20 < floor:
                continue
            mom = m[mw[-1]][3] / m[mw[0]][3] - 1
            if not (cfg['mom_lo'] <= mom <= cfg['mom_hi']):
                continue
            if has_event(s, lw[0], sig):
                continue
            cands.append((s, mom, v20, lastc))
        cands.sort(key=lambda x: -x[2])
        elig = sorted(s for s, mom, v20, lastc in cands)
        picks = sorted(cands[:100], key=lambda x: -x[1])[:cfg['n']]
        wk, tot = [], 0.0
        for s, mom, v20, lastc in picks:
            ro = P.get(s, {}).get(ed)
            rx = P.get(s, {}).get(xd)
            o = ro[0] if ro else 0
            xo = rx[0] if rx else 0
            if not (o > 0 and xo > 0):
                wk.append({'s': s, 'st': 'NO-DATA'}); continue
            if has_event(s, ed, xd):
                wk.append({'s': s, 'st': 'EVENT-SKIP'}); continue
            o2 = o * (1 + cfg['slip'])
            gap = o2 / lastc - 1
            if variant >= 2 and (gap < cfg['gap_lo'] or gap > cfg['gap_hi']):
                wk.append({'s': s, 'st': 'GAP-SKIP'}); continue
            r = xo / o2 - 1 - cfg['cost']
            tot += r * (100000 / cfg['n'])
            wk.append({'s': s, 'st': 'ok', 'r': round(r, 5)})
        weeks.append({'sun': sun, 'sig': sig, 'ed': ed, 'xd': xd, 'mode': 'TRADE', 'picks': wk, 'weekly': round(tot / 100000, 5), 'elig': elig})
    return weeks

def regime_on(sig, uni, cfg):
    # 10 weekly EW CC returns ending with week containing sig
    idx = SESS.index(sig) if sig in SESS else None
    if idx is None:
        return False
    # week starts
    starts = []
    for i, dd in enumerate(SESS[:idx + 1]):
        prev = SESS[i - 1] if i > 0 else None
        dow = dt.date.fromisoformat(dd).weekday()
        pdow = dt.date.fromisoformat(prev).weekday() if prev else 99
        if i == 0 or dow < pdow:
            starts.append(dd)
    if len(starts) < cfg['regime_w'] + 1:
        return False
    rets = []
    for k in range(len(starts) - cfg['regime_w'], len(starts)):
        a, b = starts[k - 1], starts[k]
        rs = []
        for s in uni:
            m = P.get(s, {})
            if a in m and b in m and m[a][3] > 0 and m[b][3] > 0:
                rs.append(m[b][3] / m[a][3] - 1)
        if len(rs) < max(15, 0.4 * len(uni)):
            return False
        rets.append(sum(rs) / len(rs))
    c = 1.0
    for r in rets:
        c *= (1 + r)
    return c > 1

if __name__ == '__main__':
    import time, sys
    y0, y1, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
    if len(sys.argv) > 4:
        import json as _j
        a4 = sys.argv[4]
        if a4.strip().startswith('{'):
            CFG.update(_j.loads(a4))
        elif '=' in a4:
            for kv in a4.split(','):
                k, v = kv.split('=')
                CFG[k.strip()] = float(v) if '.' in v else int(v)
        else:
            CFG['variant'] = int(a4)
    t0 = time.time()
    uni = sorted(HALAL & set(P))
    print('universe=', len(uni))
    w = run_era(y0, y1, CFG, uni, 'era')
    tr = [x for x in w if x.get('mode') == 'TRADE']
    print('era %d-%d weeks=%d traded=%d time=%.1fs' % (y0, y1, len(w), len(tr), time.time() - t0))
    json.dump(w, open(out, 'w'))
