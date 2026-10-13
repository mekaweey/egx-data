import os, glob, pandas as pd, numpy as np
import sys
sys.stdout.reconfigure(encoding='utf-8')

tv_dir = r'D:\TradingView data'
files = glob.glob(os.path.join(tv_dir, 'EGX_DLY_*, 1.csv'))

results = []
for f in files[:80]: # sample 80 active symbols
    try:
        d = pd.read_csv(f)
        d['dt'] = pd.to_datetime(d['time'], unit='s')
        d['date'] = d['dt'].dt.date
        
        for dt_date, grp in d.groupby('date'):
            if len(grp) < 30:
                continue
            grp = grp.sort_values('time').reset_index(drop=True)
            d_open = grp.iloc[0]['open']
            d_close = grp.iloc[-1]['close']
            
            # 5-min ORB (Opening Range Breakout)
            first_5 = grp.iloc[:min(5, len(grp))]
            h_5 = first_5['high'].max()
            l_5 = first_5['low'].min()
            
            if len(grp) > 10:
                p_10 = grp.iloc[10]['close']
                is_orb_break = p_10 > h_5
                results.append({
                    'date': dt_date,
                    'open': d_open,
                    'close': d_close,
                    'p_10': p_10,
                    'is_orb_break': is_orb_break,
                    'day_ret_from_p10': (d_close - p_10) / p_10,
                    'day_ret_from_open': (d_close - d_open) / d_open
                })
    except Exception as e:
        pass

rdf = pd.DataFrame(results)
print("=" * 80)
print(f"Total intraday sessions analyzed: {len(rdf):,}")
orb_true = rdf[rdf['is_orb_break']]
orb_false = rdf[~rdf['is_orb_break']]

win_true = (orb_true['day_ret_from_p10'] > 0).mean() * 100
ret_true = orb_true['day_ret_from_p10'].mean() * 100

win_false = (orb_false['day_ret_from_p10'] > 0).mean() * 100
ret_false = orb_false['day_ret_from_p10'].mean() * 100

print(f"5-min ORB Breakout (Price @ 10:10 > 5-min High): N={len(orb_true):<6} | Win%={win_true:5.1f}% | Avg Day Ret={ret_true:+6.2f}%")
print(f"No ORB Breakout                                : N={len(orb_false):<6} | Win%={win_false:5.1f}% | Avg Day Ret={ret_false:+6.2f}%")
print("=" * 80)
