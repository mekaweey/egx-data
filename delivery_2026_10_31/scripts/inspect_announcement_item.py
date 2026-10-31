# -*- coding: utf-8 -*-
import requests
from bs4 import BeautifulSoup

u = "https://www.mubasher.info/news/eg/now/announcements"
r = requests.get(
    u,
    headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "ar,en;q=0.8",
    },
    timeout=40,
)
s = BeautifulSoup(r.text, "html.parser")
items = s.select("div.mi-news-results--media-block__item")
print("items", len(items))
for i, item in enumerate(items[:3]):
    print("=" * 60, i)
    print(item.prettify()[:4000])
