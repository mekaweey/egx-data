# -*- coding: utf-8 -*-
import re
import requests
from bs4 import BeautifulSoup

u = "https://www.mubasher.info/markets/EGX/stocks/COMI"
r = requests.get(
    u,
    headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "ar,en;q=0.8",
    },
    timeout=40,
)
print(r.status_code, len(r.text))
s = BeautifulSoup(r.text, "html.parser")
txt = s.get_text(" ", strip=True)
print(txt[:1500])
for m in re.finditer("القطاع", txt):
    print("---")
    print(txt[max(0, m.start() - 150) : m.start() + 250])
