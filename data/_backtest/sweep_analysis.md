configs: 486
2024_ret: min=-58.1 median=17.2 max=147.4
2025_ret: min=100.4 median=217.7 max=534.0

TOP 5 by TEST sum (reference only — picking by test = overfit):
  cfg=[10, 0.08, 0.45, 3, 200000.0, True] test=608.4 (24:145.72 25:462.66) train=225.0 win=66.7
  cfg=[10, 0.05, 0.45, 3, 200000.0, True] test=608.4 (24:145.72 25:462.66) train=220.4 win=66.7
  cfg=[10, 0.08, 0.45, 3, 200000.0, False] test=592.2 (24:129.5 25:462.66) train=281.0 win=61.6
  cfg=[10, 0.08, 0.45, 3, 100000.0, True] test=586.6 (24:123.96 25:462.66) train=269.8 win=68.1
  cfg=[10, 0.05, 0.45, 3, 100000.0, True] test=586.6 (24:123.96 25:462.66) train=259.4 win=68.1

TOP 5 train win-rate (train_ret>100):
  cfg=[10, 0.12, 0.3, 8, 100000.0, True] train_win=70.0 train_ret=166.4 dd=24.7 | 24:34.21 25:168.73
  cfg=[10, 0.12, 0.3, 8, 200000.0, True] train_win=70.0 train_ret=151.5 dd=24.7 | 24:26.58 25:174.35
  cfg=[10, 0.08, 0.7, 3, 100000.0, True] train_win=69.4 train_ret=472.9 dd=26.3 | 24:21.92 25:341.59
  cfg=[10, 0.05, 0.7, 3, 100000.0, True] train_win=69.4 train_ret=456.9 dd=26.3 | 24:21.92 25:341.59
  cfg=[10, 0.08, 0.7, 3, 200000.0, True] train_win=69.4 train_ret=433.5 dd=26.3 | 24:11.0 25:341.59

WINNER (train score): cfg=[5, 0.05, 0.7, 3, 100000.0, False]
  train: ret=531.3 win=55.9 dd=17.5 n=102
  2022: ret=108.57 win=54.9 pnl=108571.9 dd=17.49 n=51
  2023: ret=202.66 win=56.9 pnl=202661.9 dd=11.81 n=51
  2024: ret=19.06 win=41.5 pnl=19060.4 dd=47.41 n=53
  2025: ret=305.89 win=59.6 pnl=305889.8 dd=24.41 n=52
