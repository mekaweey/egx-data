# -*- coding: utf-8 -*-
import re
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
print("title", s.title.get_text(strip=True) if s.title else None)
text = s.get_text(" ", strip=True)
print(text[:2000])
print("news links", len(s.select('a[href*="/news/"]')))
for a in s.select('a[href*="/news/"]')[:20]:
    print(repr(a.get_text(" ", strip=True))[:120], "->", a["href"])
print("classes with article")
classes = {}
for tag in s.find_all(True):
    for c in tag.get("class", []):
        if "article" in c.lower() or "news" in c.lower() or "list" in c.lower():
            classes[c] = classes.get(c, 0) + 1
for k, v in sorted(classes.items(), key=lambda x: -x[1])[:30]:
    print(k, v)
