# -*- coding: utf-8 -*-
"""TV auth test with full cookies from env (no secrets printed, no secrets stored)."""
import json, os, random, string, time
import websocket

SID = os.environ.get("TVSID", "")
SIGN = os.environ.get("TVSIGN", "")
if not SID or not SIGN:
    print("MISSING-ENV")
    raise SystemExit(1)

def gen(n=12):
    return "".join(random.choice(string.ascii_letters) for _ in range(n))

def send(ws, m, p):
    msg = json.dumps({"m": m, "p": p}, separators=(",", ":"))
    ws.send("~m~%d~m~%s" % (len(msg), msg))

ws = websocket.create_connection(
    "wss://data.tradingview.com/socket.io/websocket?from=chart%2F&date=2026_10_09-12_00",
    timeout=20,
    header={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Origin": "https://www.tradingview.com",
            "Cookie": "sessionid=" + SID + "; sessionid_sign=" + SIGN})
cs = "cs_" + gen()
send(ws, "set_auth_token", ["unauthorized_user_id"])
send(ws, "chart_create_session", [cs, ""])
send(ws, "resolve_symbol", [cs, "symbol_1", '={"symbol":"EGX:COMI","adjustment":"splits"}'])
send(ws, "create_series", [cs, "s1", "s_1", "symbol_1", "1D", 5])
t0 = time.time()
n = 0
ok = False
last = ""
while time.time() - t0 < 25 and n < 60:
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
        if o.get("m") in ("timescale_update", "series_completed", "symbol_resolved", "series_loading"):
            ok = True
            last = o.get("m") + " " + str(o.get("p"))[:120]
        elif o.get("m") == "protocol_error":
            print("PROTOCOL-ERROR (no secret shown)", flush=True)
ws.close()
print(("AUTH-WORKS :: " + last) if ok else "AUTH-FAILED", flush=True)
