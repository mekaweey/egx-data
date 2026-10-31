# -*- coding: utf-8 -*-
import requests

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept-Language": "ar,en;q=0.8",
    "Referer": "https://www.mubasher.info/markets/EGX",
}
for q in ["AIH", "AMII", "EIUD", "GOUR", "LKGP"]:
    print("=" * 40, q)
    for endpoint in [
        "https://www.mubasher.info/api/1/companySearch",
        "https://www.mubasher.info/api/1/search",
    ]:
        try:
            r = requests.get(endpoint, params={"query": q}, headers=HEADERS, timeout=30)
            print(endpoint, r.status_code, len(r.text), r.text[:500])
        except Exception as e:
            print(endpoint, "ERR", repr(e))
