# -*- coding: utf-8 -*-
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
s = BeautifulSoup(r.text, "html.parser")
terms = ["الإجراءات", "زيادة رأس المال", "الاكتتابات", "التعاملات الداخلية", "إعلانات الأرباح", "القطاع"]
for a in s.find_all("a", href=True):
    text = a.get_text(" ", strip=True)
    if any(t in text for t in terms):
        print(repr(text), "->", a["href"])
