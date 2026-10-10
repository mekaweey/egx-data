# -*- coding: utf-8 -*-
"""tv_fetch2: TradingView chart-history fetcher (cookie auth via env TVSID/TVSIGN).
API: fetch_bars(symbol, res='1D', count=300000, adjustment='splits', timeout=120)
Returns (bars {ts: [o,h,l,c,v]}, meta dict). No secrets printed or stored."""
import json, os, random, string, time
import websocket

WS_URL = "wss://data.tradingview.com/socket.io/websocket?from=chart%2F&date=2026_10_09-12_00"

def _gen(n=12):
    return "".join(random.choice(string.ascii_letters) for _ in range(n))

def _is_bars(v):
    if not (isinstance(v, list) and v):
        return False
    e0 = v[0]
    if isinstance(e0, dict):
        e0 = e0.get("v")
    return (isinstance(e0, (list, tuple)) and len(e0) >= 6)

def _norm_bar(b):
    if isinstance(b, dict):
        b = b.get("v", [])
    return b

def _extract_bars(payload):
    """timescale_update payload keys the series by name (e.g. 's1'), whose value
    is a dict like {'s': [[ts,o,h,l,c,v],...], ...}. Collect every bars list."""
    out = []
    if not isinstance(payload, dict):
        return out
    for v in payload.values():
        if _is_bars(v):
            out.extend(_norm_bar(b) for b in v)
        elif isinstance(v, dict):
            for v2 in v.values():
                if _is_bars(v2):
                    try:
                        e0 = _norm_bar(v2[0])
                        int(e0[0])
                        out.extend(_norm_bar(b) for b in v2)
                    except Exception:
                        pass
    return out

def _send(ws, m, p):
    msg = json.dumps({"m": m, "p": p}, separators=(",", ":"))
    ws.send("~m~%d~m~%s" % (len(msg), msg))

def _new_ws():
    sid = os.environ.get("TVSID", "")
    sign = os.environ.get("TVSIGN", "")
    hdr = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
           "Origin": "https://www.tradingview.com"}
    if sid and sign:
        hdr["Cookie"] = "sessionid=" + sid + "; sessionid_sign=" + sign
    return websocket.create_connection(WS_URL, timeout=30, header=hdr)

def fetch_bars(symbol, res="1D", count=300000, adjustment="splits", timeout=180, max_rounds=400):
    t_end = time.time() + timeout
    ws = _new_ws()
    cs = "cs_" + _gen()
    sid1 = "s_1"
    bars = {}
    resolved = False
    series_err = None
    pending_more = False
    before_n = 0
    before_old = None
    idle_rounds = 0
    done = False
    # NOTE: JSON resolve params (adjustment) are rejected by the server; use the
    # plain symbol string (server default adjustment = splits). Dividends-adjusted
    # series are rebuilt offline from splits + the derived dividend calendar.
    _ = adjustment
    try:
        _send(ws, "chart_create_session", [cs, ""])
        _send(ws, "resolve_symbol", [cs, "symbol_1", symbol])
        _send(ws, "create_series", [cs, "s1", "s_1", "symbol_1", res, min(count, 10000)])
        while time.time() < t_end and not done:
            try:
                m = ws.recv()
            except Exception:
                break
            for chunk in m.split("~m~"):
                try:
                    if not chunk:
                        continue
                    if chunk.startswith("~h~"):
                        try:
                            ws.send(chunk)
                        except Exception:
                            pass
                        continue
                    if chunk[0].isdigit():
                        continue
                    try:
                        o = json.loads(chunk)
                    except Exception:
                        continue
                    mm = o.get("m") if isinstance(o, dict) else None
                    p = (o.get("p") or []) if isinstance(o, dict) else []
                    if not isinstance(p, list):
                        continue
                    if mm == "symbol_resolved":
                        resolved = True
                    elif mm == "series_error":
                        series_err = str(p)[:160]
                    elif mm == "timescale_update" and len(p) > 1 and isinstance(p[1], dict):
                        for b in _extract_bars(p[1]):
                            try:
                                ts = int(b[0])
                                # some series (indices/FX) carry no volume -> pad 0.0
                                vals = [float(b[i]) if i < len(b) and b[i] is not None else 0.0 for i in range(1, 6)]
                                bars[ts] = [vals[0], vals[1], vals[2], vals[3], vals[4] if len(vals) > 4 else 0.0]
                            except Exception:
                                pass
                    elif mm == "series_completed":
                        if len(bars) >= count:
                            done = True
                            break
                        if pending_more:
                            # did the page grow history?
                            if len(bars) == before_n and (not bars or before_old == min(bars)):
                                idle_rounds += 1
                            else:
                                idle_rounds = 0
                            pending_more = False
                            if idle_rounds >= 2 or not bars:
                                done = True
                                break
                        before_n = len(bars)
                        before_old = min(bars) if bars else None
                        _send(ws, "request_more_data", [cs, "s1", 10000])
                        pending_more = True
                except Exception:
                    continue
    finally:
        try:
            ws.close()
        except Exception:
            pass
    meta = {"resolved": resolved, "error": series_err, "n": len(bars)}
    return bars, meta
