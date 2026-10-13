"""B4.5 edge-vs-luck + B4.3 splits + B4.4 clusters + B4.7/8. Seeds fixed."""
import json, math, random
import pickle
P = pickle.load(open('C:/Users/Mekawey/AppData/Local/Temp/opencode/study_panel.pkl', 'rb'))

MOD = json.load(open('C:/Users/Mekawey/AppData/Local/Temp/opencode/study_modern.json', encoding='utf-8'))
TRS = [x for x in MOD if x.get('mode') == 'TRADE']
RETS = [x['weekly'] for x in TRS]
print('== B4.5a placebo (seed 42, 2000 runs, 5 random from weekly elig) ==')
random.seed(42)
means, wins = [], []
for run in range(2000):
    wr = []
    for x in TRS:
        elig = x.get('elig', [])
        if len(elig) < 5:
            continue
        picks = random.sample(elig, 5)
        rs = []
        lastc = {}
        for s in picks:
            ro = P.get(s, {}).get(x['ed'])
            rx = P.get(s, {}).get(x['xd'])
            if ro and rx and ro[0] > 0 and rx[0] > 0:
                rs.append(rx[0] / ro[0] - 1 - 0.0005)
        if rs:
            wr.append(sum(rs) / len(rs) * (len(rs) / 5))
    if wr:
        means.append(sum(wr) / len(wr))
        wins.append(sum(1 for v in wr if v > 0) / len(wr))
means.sort()
wins.sort()
obs_m = sum(RETS) / len(RETS)
obs_w = sum(1 for v in RETS if v > 0) / len(RETS)
p_m = sum(1 for v in means if v >= obs_m) / len(means)
p_w = sum(1 for v in wins if v >= obs_w) / len(wins)
print('obs mean=%.5f win=%.3f | placebo mean_med=%.5f win_med=%.3f | p_mean=%.4f p_win=%.4f' % (
    obs_m, obs_w, means[len(means) // 2], wins[len(wins) // 2], p_m, p_w))
json.dump({'means': means, 'wins': wins}, open('C:/Users/Mekawey/AppData/Local/Temp/opencode/placebo.json', 'w'))
