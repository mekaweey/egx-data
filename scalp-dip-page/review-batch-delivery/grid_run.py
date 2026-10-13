import json, subprocess, sys
BASE = dict(mom_lb=5, mom_lo=0.08, mom_hi=0.45, liq_win=20, liq_min=18, mom_min=6,
            liq_top=100, n=5, floor_base=200000, regime_w=10, cost=0.0005, slip=0.0,
            gap_lo=-0.03, gap_hi=0.02, price_min=0.5)
jobs = []
for v in (3, 4, 6, 7, 8):
    c = dict(BASE, mom_lb=v)
    jobs.append(('lb%d' % v, c))
for v in (5, 6, 10, 12):
    c = dict(BASE, mom_lo=v / 100)
    jobs.append(('lo%d' % v, c))
for v in (35, 40, 50, 55, 60):
    c = dict(BASE, mom_hi=v / 100)
    jobs.append(('hi%d' % v, c))
for v in (3, 4, 6):
    c = dict(BASE, n=v)
    jobs.append(('n%d' % v, c))
for v in (6, 8, 12, 14):
    c = dict(BASE, regime_w=v)
    jobs.append(('rg%d' % v, c))
chunk = sys.argv[1]
out = {}
my = [j for j in jobs if j[0][0:2] in chunk.split(',')]
print('CHUNK %s jobs=%d' % (chunk, len(my)), flush=True)
for name, cfg in my:
    p = subprocess.run(['python3', 'C:/Users/Mekawey/AppData/Local/Temp/opencode/study_run.py',
                        '2021', '2026', 'C:/Users/Mekawey/AppData/Local/Temp/opencode/grid_%s.json' % name,
                        json.dumps(cfg)], capture_output=True, text=True, timeout=900)
    tail = (p.stdout or '').strip().splitlines()
    print(name, tail[-1] if tail else 'NO-OUT', flush=True)
    try:
        w = json.load(open('C:/Users/Mekawey/AppData/Local/Temp/opencode/grid_%s.json' % name, encoding='utf-8'))
        tr = [x['weekly'] for x in w if x.get('mode') == 'TRADE']
        out[name] = {'n': len(tr), 'win': round(sum(1 for v in tr if v > 0) / len(tr), 3) if tr else 0,
                     'mean': round(sum(tr) / len(tr), 5) if tr else 0}
    except Exception as e:
        out[name] = {'error': str(e)[:100]}
json.dump(out, open('C:/Users/Mekawey/AppData/Local/Temp/opencode/grid_%s.json' % chunk.replace(',', '_'), 'w'))
print('GRIDDONE', json.dumps(out))
