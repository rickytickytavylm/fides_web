# -*- coding: utf-8 -*-
"""Тянет хабы циклов с Рускатолик и печатает slug'и статей из контента."""
import json
import re
import sys
import io
import urllib.request
from html import unescape

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
UA = {'User-Agent': 'YakCycles/1'}

HUBS = [
    ('messori', 'messori'),
    ('iannaccone', 'iannaccone'),
    ('guareski', 'guareski-main'),
    ('sgorlon', 'sgorlon'),
    ('gatti', 'ilia-e-alberto'),
    ('pisateli-dlia-detej', 'pisateli-dlia-detej'),
    ('gastronomiya', 'gastronomiya'),
    ('vatikanskiy-garazh', 'vatikanskiy-garazh'),
    ('predateli', 'predateli'),
    ('post-s-biblejskimi-zhenshhinami', 'post-s-biblejskimi-zhenshhinami'),
    ('bibleyskiy-zoopark', 'bibleyskiy-zoopark'),
    ('geografiya-spaseniya', 'geografiya-spaseniya'),
    ('dnevnik-istseleniya', 'dnevnik-istseleniya'),
]


def fetch(url):
    last = None
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read().decode('utf-8', errors='replace')
        except Exception as e:
            last = e
            print('retry', attempt + 1, url, e)
    raise last


def page_by_slug(slug):
    url = (
        'https://ruscatholic.org/wp-json/wp/v2/pages'
        f'?slug={slug}&_fields=id,slug,title,link,content'
    )
    try:
        data = json.loads(fetch(url))
    except Exception as e:
        print('FAIL page', slug, e)
        return None
    return data[0] if data else None


def extract_slugs(html, hub_slug):
    # ссылки вида https://ruscatholic.org/foo/ или /foo/
    hrefs = re.findall(r'href=["\'](?:https?://ruscatholic\.org)?/([a-z0-9\-]+)/["\']', html, re.I)
    skip = {
        hub_slug, 'tag', 'category', 'author', 'wp-content', 'wp-admin', 'feed',
        'page', 'about', 'contacts', 'donate', 'privacy',
    }
    out = []
    seen = set()
    for s in hrefs:
        s = s.lower()
        if s in skip or s in seen:
            continue
        if len(s) < 3:
            continue
        seen.add(s)
        out.append(s)
    return out


def main():
    result = {}
    for cid, slug in HUBS:
        page = page_by_slug(slug)
        if not page:
            print('MISSING', cid, slug)
            continue
        title = unescape(re.sub(r'<[^>]+>', '', page.get('title', {}).get('rendered', '')))
        html = page.get('content', {}).get('rendered', '')
        slugs = extract_slugs(html, slug)
        result[cid] = {
            'hubSlug': slug,
            'title': title,
            'link': page.get('link'),
            'slugs': slugs,
        }
        print(f'\n## {cid} | {title}')
        print('hub', page.get('link'), 'items', len(slugs))
        for s in slugs:
            print(' -', s)
    Path = __import__('pathlib').Path
    out = Path(__file__).resolve().parents[1] / 'scripts' / '_cycle_hubs_dump.json'
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print('\nwrote', out)


if __name__ == '__main__':
    main()
