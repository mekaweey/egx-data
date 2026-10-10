# -*- coding: utf-8 -*-
"""Daily overlapping-cohort rotation engine (honest: no look-ahead, costs, fillability, regime)."""
import pandas as pd
import numpy as np
import datetime as dt
import os


def run_daily(sym_data, calendar, start_date, cfg):
    """sym_data: {ticker: DataFrame indexed by date}.
    calendar: sorted session dates. Trading starts at first session >= start_date.
    Each session: exit due cohorts at open, form new cohort (1/H of equity) from
    signals on S=prev session closes, hold H sessions, exit at open.
    Returns (daily_df, trades_df)."""
    H = cfg.get("H", 1)
    pos = {d: i for i, d in enumerate(calendar)}
    start_idx = next(i for i, d in enumerate(calendar) if d >= start_date)
    # per-symbol numpy cache
    cache = {}
    for sym, df in sym_data.items():
        cache[sym] = {
            "dates": np.array(df.index.tolist()),
            "open": df["open"].values, "high": df["high"].values,
            "low": df["low"].values, "close": df["close"].values,
            "volume": df["volume"].values, "money": df["money"].values,
            "flag": df["flag"].values.astype(int),
        }
    equity = cfg.get("capital", 100000.0)
    cash = equity
    import random as _rnd
    _rng = _rnd.Random(cfg.get("seed", 0))
    active = []  # list of dicts: picks=[(sym, invested, entry_px, exit_idx)], exit dates per pick
    daily = []
    trades = []
    tbill_d = (1 + cfg.get("tbill_wk", 0.0)) ** (1 / 5) - 1
    PX = cfg.get("price_basis", "open")  # 'open' or 'close'
    PXI = {"open": 0, "high": 1, "low": 2, "close": 3}[PX]
    # trade_mode: 'open_open' (default), 'overnight' (buy close E, sell open E+1),
    # 'intraday' (buy open E, sell close E, immediate round-trip)
    TMODE = cfg.get("trade_mode", "open_open")
    ENTRY_COL = "close" if TMODE == "overnight" else PX
    EXIT_COL = "open" if TMODE in ("open_open", "overnight") else "close"
    # indicator filters (from 06_indicators/daily, aligned by date); e.g.
    # {"CMF_21": (0.0, None), "RSI_14": (None, 70.0), "ATR_PCT_MAX": 0.08, "OBV_RISING": 20}
    INDF = cfg.get("ind_filter") or {}
    indcache = {}
    if INDF:
        import csv as _csv
        need = {"CMF_21", "RSI_14", "ATR_14", "OBV"}
        ibase = r"D:\EGX_DATA\06_indicators\daily"
        for _sym, _df in sym_data.items():
            _p = os.path.join(ibase, f"EGX_{_sym}.csv")
            if not os.path.exists(_p):
                continue
            try:
                with open(_p, encoding="utf-8", errors="replace", newline="") as _fh:
                    _rd = _csv.reader(_fh)
                    _h = [h.strip() for h in (next(_rd, None) or [])]
                    _idx = {n: _h.index(n) for n in need if n in _h}
                    _di = _h.index("date")
                    _dd = {}
                    for _r in _rd:
                        if len(_r) <= max([_di] + list(_idx.values()) or [0]):
                            continue
                        try:
                            _dd[_r[_di][:10]] = {n: (float(_r[_idx[n]]) if _r[_idx[n]].strip() not in ("", "nan") else float("nan")) for n in _idx}
                        except Exception:
                            pass
                if _dd:
                    indcache[_sym] = _dd
            except Exception:
                pass

    for i in range(start_idx, len(calendar)):
        E = calendar[i]
        S = calendar[i - 1]
        # 1) MTM total before actions (value active at latest close <= S... use S closes)
        mtm_active = 0.0
        for coh in active:
            for (sym, invested, epx, x_epx, x_date, delayed) in coh["picks"]:
                c = cache[sym]
                # latest close <= S
                j = int(np.searchsorted(c["dates"], S, side="right")) - 1
                px = c["close"][j] if j >= 0 else epx
                mtm_active += invested * (px / epx) if epx > 0 else 0.0
        total = cash + mtm_active
        # 2) exits due today (exit_idx == i)
        still = []
        for coh in active:
            out_picks = []
            for (sym, invested, epx, x_epx, x_date, delayed) in coh["picks"]:
                if coh["exit_idx"] <= i:
                    # exit at EXIT_COL of E if traded, else next available session (delayed)
                    c = cache[sym]
                    if E in sym_data[sym].index:
                        xo = sym_data[sym].at[E, EXIT_COL]
                        xd = E
                        dl = 0
                    else:
                        fut = c["dates"][c["dates"] > E]
                        if len(fut) == 0:
                            cash += invested  # stuck: return principal (flat)
                            trades.append((coh["entry"], sym, epx, None, None, -cfg["cost_side"], 1, "stuck"))
                            continue
                        xd = fut[0]
                        xo = sym_data[sym].at[xd, EXIT_COL]
                        dl = 1
                    if xo > 0:
                        proceeds = invested * (xo / epx) * (1 - cfg["cost_side"])
                        cash += proceeds
                        full_net = (xo / epx) * (1 - cfg["cost_side"]) * (1 - cfg["cost_side"]) - 1
                        trades.append((coh["entry"], sym, epx, xd, xo, full_net, dl, "ok" if dl == 0 else "delayed"))
                    else:
                        cash += invested
                        trades.append((coh["entry"], sym, epx, None, None, -cfg["cost_side"], 1, "badpx"))
                else:
                    out_picks.append((sym, invested, epx, x_epx, x_date, delayed))
            if out_picks:
                coh["picks"] = out_picks
                still.append(coh)
        active = still
        # 2b) stop-loss check (multi-session holds only; pessimistic: exit at close of first trigger day)
        stop = cfg.get("stop") if TMODE == "open_open" else None
        if stop:
            still2 = []
            for coh in active:
                kept = []
                ei = coh.get("entry_idx", 0)
                for (sym, invested, epx, x_epx, x_date, delayed) in coh["picks"]:
                    hit = None
                    try:
                        df = sym_data[sym]
                        for t in range(max(ei, 0), min(i + 1, len(calendar))):
                            d = calendar[t]
                            if d <= coh["entry"]:
                                if d != coh["entry"]:
                                    continue
                            try:
                                lo = df.at[d, "low"]
                            except KeyError:
                                continue
                            if lo > 0 and lo <= epx * (1 - stop):
                                hit = d
                                break
                    except Exception:
                        hit = None
                    if hit is not None:
                        xc = sym_data[sym].at[hit, "close"]
                        if xc > 0:
                            proceeds = invested * (xc / epx) * (1 - cfg["cost_side"])
                            cash += proceeds
                            trades.append((coh["entry"], sym, epx, hit, xc,
                                           (xc / epx) * (1 - cfg["cost_side"]) * (1 - cfg["cost_side"]) - 1,
                                           0, "stop"))
                            continue
                    kept.append((sym, invested, epx, x_epx, x_date, delayed))
                if kept:
                    coh["picks"] = kept
                    still2.append(coh)
            active = still2
        # recompute total after exits
        mtm_active = 0.0
        for coh in active:
            for (sym, invested, epx, x_epx, x_date, delayed) in coh["picks"]:
                c = cache[sym]
                j = int(np.searchsorted(c["dates"], S, side="right")) - 1
                px = c["close"][j] if j >= 0 else epx
                mtm_active += invested * (px / epx) if epx > 0 else 0.0
        total = cash + mtm_active
        # 3) regime check (weekly breadth)
        mkt_ok = True
        if cfg.get("regime_on"):
            rw = cfg.get("regime_weeks", 10)
            if i - 1 - rw * 5 >= 0:
                r0d = calendar[i - 1 - rw * 5]
                rets = []
                for sym2, df2 in sym_data.items():
                    try:
                        a = df2.at[r0d, "close"]; b = df2.at[S, "close"]
                    except KeyError:
                        continue
                    if a > 0 and b > 0:
                        rets.append(b / a - 1)
                if rets and float(np.mean(rets)) <= cfg.get("regime_min", 0.0):
                    mkt_ok = False
        # 4) form new cohort
        n_new = 0
        if mkt_ok:
            cands = []
            k = cfg["k"]
            for sym, c in cache.items():
                j = int(np.searchsorted(c["dates"], S, side="right")) - 1
                if j < k:
                    continue
                if c["dates"][j] != S:
                    continue  # symbol didn't trade on signal day
                c0 = c["close"][j - k]; c1 = c["close"][j]
                if not (c0 > 0 and c1 > 0):
                    continue
                mom = c1 / c0 - 1
                if cfg.get("pick_mode", "momentum") != "random":
                    if not (cfg["mom_lo"] <= mom <= cfg["mom_hi"]):
                        continue
                # breakout setup: close(S) at/near L-session high (Donchian-style, distinct family)
                if cfg.get("setup") == "breakout":
                    _L = int(cfg.get("brk_L", 20))
                    if j < _L:
                        continue
                    _hh = c["high"][j - _L + 1:j + 1].max()
                    if not (_hh > 0 and c1 >= _hh * cfg.get("brk_tol", 1.0)):
                        continue
                # trend filter: skip stocks in established decline (close < SMA50)
                if cfg.get("trend_n"):
                    _tn = int(cfg.get("trend_n"))
                    if j < _tn:
                        continue
                    _sma = c["close"][j - _tn + 1:j + 1].mean()
                    if not (c1 >= _sma):
                        continue
                # ATR% cap: skip extremely volatile names (steady climbers only)
                if cfg.get("atrcap"):
                    if j < 14:
                        continue
                    _tr = np.maximum(c["high"][j - 13:j + 1] - c["low"][j - 13:j + 1],
                                     np.maximum(abs(c["high"][j - 13:j + 1] - c["close"][j - 14:j]),
                                                abs(c["low"][j - 13:j + 1] - c["close"][j - 14:j])))
                    _atr = _tr.mean()
                    if not (_atr / c1 <= cfg["atrcap"]):
                        continue
                # limit-up setup mode: strong close + volume confirmation (alternative signal)
                day_gain = None
                if cfg.get("setup") == "limit":
                    if j < 1:
                        continue
                    pc = c["close"][j - 1]
                    if not (pc > 0):
                        continue
                    day_gain = c1 / pc - 1
                    if day_gain < cfg.get("lim_thr", 0.08):
                        continue
                    vm = c["volume"][max(0, j - 19):j + 1].mean()
                    if not (c["volume"][j] >= cfg.get("vol_mult", 1.0) * vm and vm > 0):
                        continue
                # reversal setup: yesterday's big losers (short-term reversal sleeve)
                rev_gain = None
                if cfg.get("setup") == "reversal":
                    if j < 1:
                        continue
                    pc = c["close"][j - 1]
                    if not (pc > 0):
                        continue
                    rev_gain = c1 / pc - 1
                    if rev_gain > cfg.get("rev_thr", -0.05):
                        continue
                if c1 < cfg["min_price"]:
                    continue
                liq = c["money"][max(0, j - 19):j + 1].mean()
                if liq < cfg["min_money"]:
                    continue
                if cfg.get("use_flags") and c["flag"][j] == 1:
                    continue
                # indicator filters (values as of signal day S; NaN => skip)
                if INDF:
                    iv = indcache.get(sym, {}).get(S)
                    if iv is None:
                        continue
                    _ok = True
                    for _cn, _bd in INDF.items():
                        if _cn in ("ATR_PCT_MAX", "OBV_RISING"):
                            continue
                        _lo, _hi = _bd
                        _vv = iv.get(_cn, float("nan"))
                        try:
                            _bad = (not (_vv == _vv)) or (_lo is not None and _vv < _lo) or (_hi is not None and _vv > _hi)
                        except Exception:
                            _bad = True
                        if _bad:
                            _ok = False
                            break
                    if _ok and "ATR_PCT_MAX" in INDF:
                        _a = iv.get("ATR_14", float("nan"))
                        try:
                            _ap = _a / c1 if c1 > 0 else float("nan")
                            if not (_ap == _ap) or _ap > INDF["ATR_PCT_MAX"]:
                                _ok = False
                        except Exception:
                            _ok = False
                    if _ok and "OBV_RISING" in INDF:
                        try:
                            _nn = int(INDF["OBV_RISING"])
                            _o0 = iv.get("OBV", float("nan"))
                            _oj = c["dates"][max(0, j - _nn)]
                            _ov = indcache.get(sym, {}).get(_oj, {}).get("OBV", float("nan"))
                            if not (_o0 == _o0 and _ov == _ov and _o0 > _ov):
                                _ok = False
                        except Exception:
                            _ok = False
                    if not _ok:
                        continue
                # entry at E ENTRY_COL (open / close for overnight mode)
                try:
                    e_o = sym_data[sym].at[E, ENTRY_COL]
                    e_v = sym_data[sym].at[E, "volume"]
                    e_f = sym_data[sym].at[E, "flag"]
                except KeyError:
                    continue
                if not (e_o > 0):
                    continue
                # HARD RULE: zero-volume session = no shares changed hands = unfillable. Always skip.
                if not (e_v > 0):
                    if cfg.get("count_rejects") is not None:
                        cfg["count_rejects"]["empty"] += 1
                    continue
                if cfg.get("use_flags") and (e_f == 1 or e_v == 0):
                    continue
                if ENTRY_COL == "open":
                    # gap filter only meaningful for open entries (uses not-yet-known open:
                    # keep only when explicitly enabled via gap_lo/hi narrower than [-1,1])
                    gap = e_o / c1 - 1
                    if not (cfg["gap_lo"] <= gap <= cfg["gap_hi"]):
                        if cfg.get("count_rejects") is not None:
                            cfg["count_rejects"]["gap"] += 1
                        continue
                if cfg.get("setup") == "limit" and day_gain is not None:
                    _rank = day_gain
                elif cfg.get("setup") == "reversal" and rev_gain is not None:
                    _rank = -rev_gain  # most-negative first under reverse sort
                else:
                    _rank = mom
                cands.append((_rank, sym, e_o, e_v, liq))
            cands.sort(reverse=True)
            if cfg.get("pick_mode", "momentum") == "random":
                _rng.shuffle(cands)
            picks = cands[:cfg["N"]]
            # fillability pre-filter
            if cfg.get("max_size_frac") and picks:
                fill = []
                if cfg.get("fill_mode") == "dynamic":
                    # TRUTHFUL compounding version: test the ACTUAL position size
                    # (mirrors real sizing incl. cap_base) vs trailing money, iterated
                    _cap = cfg.get("cap_base", total)
                    _base_share = (min(total, _cap) / H)
                    cands_now = list(picks)
                    for _ in range(3):
                        if not cands_now:
                            break
                        share_now = _base_share / len(cands_now)
                        nxt = []
                        for mom, sym, e_o, e_v, liq in cands_now:
                            base = liq if cfg.get("fill_basis") == "trailing" else e_o * e_v
                            if base > 0 and share_now <= cfg["max_size_frac"] * base:
                                nxt.append((mom, sym, e_o, e_v, liq))
                            elif cfg.get("count_rejects") is not None:
                                cfg["count_rejects"]["fill"] += 1
                        if len(nxt) == len(cands_now):
                            break
                        cands_now = nxt
                    fill = cands_now
                else:
                    # fixed-ticket version (original claim basis)
                    for mom, sym, e_o, e_v, liq in picks:
                        if cfg.get("fill_basis") == "trailing":
                            base = liq
                        else:
                            base = e_o * e_v
                        if base > 0 and cfg["fixed_notional"] <= cfg["max_size_frac"] * base:
                            fill.append((mom, sym, e_o, e_v, liq))
                        elif cfg.get("count_rejects") is not None:
                            cfg["count_rejects"]["fill"] += 1
                picks = fill
            # conviction filter: stand down unless enough executable ideas (chop-bleed control)
            if cfg.get("min_cands") and len(picks) < cfg["min_cands"]:
                if cfg.get("count_rejects") is not None:
                    cfg["count_rejects"]["conviction"] = cfg["count_rejects"].get("conviction", 0) + 1
                picks = []
            if TMODE == "intraday" and picks:
                # immediate round-trip: buy open E, sell close E (no overnight hold)
                for mom, sym, e_o, e_v, liq in picks:
                    try:
                        xc = sym_data[sym].at[E, "close"]
                    except KeyError:
                        continue
                    if not (xc > 0):
                        continue
                    share = total / len(picks)
                    invested = share * (1 - cfg["cost_side"])
                    cash -= share
                    proceeds = invested * (xc / e_o) * (1 - cfg["cost_side"])
                    cash += proceeds
                    trades.append((E, sym, e_o, E, xc,
                                   (xc / e_o) * (1 - cfg["cost_side"]) * (1 - cfg["cost_side"]) - 1,
                                   0, "intraday"))
                    n_new += 1
            if picks and TMODE != "intraday":
                # capped compounding: deployed base never exceeds starting capital,
                # so position sizes stay executable forever (profits pile as cash)
                base = cfg.get("cap_base", total)
                cohort_size = min(total, base) / H
                share = cohort_size / len(picks)
                new_picks = []
                for mom, sym, e_o, e_v, liq in picks:
                    invested = share * (1 - cfg["cost_side"])
                    cash -= share
                    new_picks.append((sym, invested, e_o, None, None, 0))
                    n_new += 1
                if new_picks:
                    active.append({"entry": E, "entry_idx": i, "exit_idx": i + H, "picks": new_picks})
        # 5) cash interest + record
        cash *= (1 + tbill_d)
        mtm_active = 0.0
        for coh in active:
            for (sym, invested, epx, x_epx, x_date, delayed) in coh["picks"]:
                c = cache[sym]
                j = int(np.searchsorted(c["dates"], E, side="right")) - 1
                px = c["close"][j] if j >= 0 else epx
                mtm_active += invested * (px / epx) if epx > 0 else 0.0
        equity = cash + mtm_active
        daily.append((E, equity, n_new, len(active), 1 if not mkt_ok else 0))
    daily_df = pd.DataFrame(daily, columns=["date", "equity", "new", "active", "regime_off"])
    tdf = pd.DataFrame(trades, columns=["entry", "sym", "entry_px", "exit_date", "exit_px", "net", "delayed", "note"])
    return daily_df, tdf


def year_stats_daily(daily_df, capital):
    out = {}
    df = daily_df.copy()
    df["year"] = df["date"].str[:4]
    # weekly win: week-ending Thursday? Use Sunday-start weeks like engine
    import datetime as dtm
    df["wk"] = df["date"].apply(lambda d: (dtm.date(*map(int, d.split("-"))) - dtm.timedelta(days=1)).isocalendar()[:2])
    for y, g in df.groupby("year"):
        eq = capital
        peak = capital
        maxdd = 0.0
        for r in g["equity"].values:
            pass
        # rebased: chain daily returns within year (divide by PREVIOUS equity)
        lv = g["equity"].to_numpy(dtype=float, copy=True)
        rets = np.empty_like(lv)
        rets[0] = 0.0
        prev = lv[0]
        for i in range(1, len(lv)):
            rets[i] = (lv[i] - prev) / prev if prev != 0 else 0.0
            prev = lv[i]
        for r in rets:
            eq *= (1 + r)
            peak = max(peak, eq)
            dd = (peak - eq) / peak if peak > 0 else 0.0
            maxdd = max(maxdd, dd)
        pnl = eq - capital
        # weekly wins within year
        wret = g.groupby("wk")["equity"].apply(lambda x: x.iloc[-1] / x.iloc[0] - 1) if len(g) else []
        wret = wret[wret.index.get_level_values(0) != 0] if len(g) else wret
        win = float((wret > 0).mean()) if len(wret) else float("nan")
        out[y] = {"days": len(g), "pnl": round(pnl, 1), "ret_pct": round(pnl / capital * 100, 2),
                  "win_rate": round(win * 100, 1) if len(wret) else None,
                  "maxdd_pct": round(maxdd * 100, 2), "eq_end": round(eq, 1)}
    return out
