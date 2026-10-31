# -*- coding: utf-8 -*-
import requests

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept-Language": "ar,en;q=0.8",
    "Referer": "https://www.mubasher.info/markets/EGX",
}
queries = ["GOUR", "LKGP", "HCFI", "GPIM", "AMII", "AMIA", "EIUD", "Gourmet", "Lakah", "Urban"]
for q in queries:
    print("=" * 40, q)
    try:
        r = requests.get(
            "https://www.mubasher.info/api/1/companySearch",
            params={"query": q},
            headers=HEADERS,
            timeout=30,
        )
        print(r.status_code, r.text[:1200])
    except Exception as e:
        print("ERR", repr(e))
