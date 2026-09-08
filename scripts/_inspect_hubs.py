# -*- coding: utf-8 -*-
import json
import re
import sys
import io
import urllib.request
from html import unescape

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
UA = {'User-Agent': 'YakCycles/1'}


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode('utf-8', 'replace')


for slug in ['bibleyskiy-zoopark', 'geografiya-spaseniya', 'dnevnik-istseleniya']:
    data = json.loads(
        get(
            'https://ruscatholic.org/wp-json/wp/v2/pages'
            f'?slug={slug}&_fields=content,link,title'
        )
    )
    html = data[0]['content']['rendered'] if data else ''
    print('====', slug, 'len', len(html))
    hrefs = re.findall(r'href=["\']([^"\']+)["\']', html)
    print('hrefs', len(hrefs))
    for h in hrefs[:40]:
        print(' ', h)
    text = unescape(re.sub(r'<[^>]+>', ' ', html))
    text = re.sub(r'\s+', ' ', text).strip()
    print('sample:', text[:500])
    print()
