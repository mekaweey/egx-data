# -*- coding: utf-8 -*-
"""TV auth variants: (A) sessionid as token, (B) cookies only. No secrets printed."""
import json, os, random, string, time
import websocket

SID = os.environ.get("TVSID", "")
SIGN = os.environ.get("TVSIGN", "")

def gen(n=12):
    return "".join(random.choice(string.ascii_letters) for _ in range(n))

def send(ws, m, p):
    msg = json.dumps({"m": m, "p": p}, separators=(",", ":"))
    ws.send("~m~%d~m~%s" % (len(msg), msg))

def attempt(name, token, use_cookies):
    try:
        hdr = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
               "Origin": "https://www.tradingview.com"}
        if use_cookies:
            hdr["Cookie"] = "sessionid=" + SID + "; sessionid_sign=" + SIGN
        ws = websocket.create_connection(
            "wss://data.tradingview.com/socket.io/websocket?from=chart%2F&date=2026_10_09-12_00",
            timeout=20, header=hdr)
        cs = "cs_" + gen()
        if token is not None:
            send(ws, "set_auth_token", [token])
        send(ws, "chart_create_session", [cs, ""])
        send(ws, "resolve_symbol", [cs, "symbol_1", '={"symbol":"EGX:COMI","adjustment":"splits"}'])
        send(ws, "create_series", [cs, "s1", "s_1", "symbol_1", "1D", 5])
        t0 = time.time()
        n = 0
        ok = False
        detail = ""
        while time.time() - t0 < 20 and n < 60:
            try:
                m = ws.recv()
            except Exception:
                break
            n += 1
            for chunk in m.split("~m~"):
                if not chunk or chunk[0].isdigit():
                    continue
                try:
                    o = json.loads(chunk)
                except Exception:
                    continue
                if o.get("m") in ("timescale_update", "series_completed", "symbol_resolved"):
                    ok = True
                    detail = o.get("m")
                elif o.get("m") == "protocol_error":
                    detail = "protocol_error"
        ws.close()
        print(name + ": " + ("WORKS " + detail if ok else "FAILED " + detail), flush=True)
    except Exception as e:
        print(name + ": CONN-FAIL", flush=True)

attempt("A-token-is-sessionid", SID, True)
attempt("B-cookies-only", None, True)
