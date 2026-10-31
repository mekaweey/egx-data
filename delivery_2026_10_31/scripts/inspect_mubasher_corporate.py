# -*- coding: utf-8 -*-
import re
import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept-Language": "ar,en;q=0.8",
}
urls = [
    "https://www.mubasher.info/countries/eg/corporate-action",
    "https://www.mubasher.info/countries/eg/ipos/capital-increase",
    "https://www.mubasher.info/markets/EGX/stocks/COMI/corporate-action",
    "https://www.mubasher.info/markets/EGX/stocks/COMI/ipos",
    "https://www.mubasher.info/markets/EGX/stocks/COMI/insider-trades",
]
for u in urls:
    print("=" * 100)
    print(u)
    try:
        r = requests.get(u, headers=HEADERS, timeout=40)
        print("status", r.status_code, "len", len(r.text))
        s = BeautifulSoup(r.text, "html.parser")
        for t in s.find_all("table")[:3]:
            rows = t.find_all("tr")
            print("table rows", len(rows))
            for tr in rows[:5]:
                cells = [c.get_text(" ", strip=True) for c in tr.find_all(["th", "td"])]
                print(cells)
        # print JSON-ish data attributes and pagination
        m = re.search(r"numPages\s*=\s*(\d+)", r.text)
        print("numPages", m.group(1) if m else None)
        print("has next", "التالي" in r.text)
    except Exception as e:
        print("ERROR", repr(e))
