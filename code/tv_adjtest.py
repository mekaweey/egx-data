# -*- coding: utf-8 -*-
"""Resolve variants with adjustment keys."""
import json, os, random, string, time
import websocket

def gen(n=8):
    return "".join(random.choice(string.ascii_letters) for _ in range(n))

def send(ws, m, p):
    msg = json.dumps({"m": m, "p": p}, separators=(",", ":"))
    ws.send("~m~%d~m~%s" % (len(msg), msg))

def attempt(adj):
    try:
        hdr = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
               "Origin": "https://www.tradingview.com",
               "Cookie": "sessionid=" + os.environ.get("TVSID", "") + "; sessionid_sign=" + os.environ.get("TVSIGN", "")}
        ws = websocket.create_connection(
            "wss://data.tradingview.com/socket.io/websocket?from=chart%2F&date=2026_10_09-12_00",
            timeout=20, header=hdr)
        cs = "cs_" + gen()
        param = {"symbol": "EGX:COMI", "adjustment": adj}
        send(ws, "chart_create_session", [cs, ""])
        send(ws, "resolve_symbol", [cs, "symbol_1", json.dumps(param, separators=(",", ":"))])
        send(ws, "create_series", [cs, "s1", "s_1", "symbol_1", "1D", 5])
        t0 = time.time()
        n = 0
        res = "TIMEOUT"
        got_data = False
        while time.time() - t0 < 18 and n < 40:
            try:
                m = ws.recv()
            except Exception:
                break
            n += 1
            for chunk in m.split("~m~"):
                if not chunk or chunk.startswith("~h~") or chunk[0].isdigit():
                    continue
                try:
                    o = json.loads(chunk)
                except Exception:
                    continue
                if o.get("m") == "symbol_resolved":
                    res = "RESOLVED"
                elif o.get("m") == "series_error":
                    res = "SERIES-ERR " + str(o.get("p"))[:80]
                elif o.get("m") == "timescale_update":
                    got_data = True
        ws.close()
        print(adj + " -> " + res + (" +DATA" if got_data else ""), flush=True)
    except Exception:
        print(adj + " CONN-FAIL", flush=True)

for a in ["none", "raw", "all", "dividends"]:
    attempt(a)
