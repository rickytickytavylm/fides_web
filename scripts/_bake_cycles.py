# -*- coding: utf-8 -*-
"""Собирает js/cycles-data.js из хабов Рускатолик."""
import json
import re
import sys
import io
import urllib.request
from html import unescape
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'js' / 'cycles-data.js'
AUTHORS = ROOT / 'js' / 'authors-data.js'
UA = {'User-Agent': 'YakCyclesBake/1'}

# id → hub page slug, authors, subtitle
HUBS = [
    {
        'id': 'messori',
        'hub': 'messori',
        'authorSlugs': ['andzhelo-loreti'],
        'subtitle': 'Авторский цикл Анджело Лорети',
        # доп. статьи цикла, которых нет в TOC хаба, но они в серии
        'extraSlugs': ['zavoevanie-ameriki', 'delo-galileja'],
    },
    {
        'id': 'iannaccone',
        'hub': 'iannaccone',
        'authorSlugs': ['andzhelo-loreti'],
        'subtitle': 'Авторский цикл Анджело Лорети',
    },
    {
        'id': 'guareski',
        'hub': 'guareski-main',
        'authorSlugs': ['andzhelo-loreti'],
        'subtitle': 'Авторский цикл Анджело Лорети',
    },
    {
        'id': 'sgorlon',
        'hub': 'sgorlon',
        'authorSlugs': ['andzhelo-loreti'],
        'subtitle': 'Авторский цикл Анджело Лорети',
    },
    {
        'id': 'gatti',
        'hub': 'ilia-e-alberto',
        'authorSlugs': ['andzhelo-loreti'],
        'subtitle': 'Авторский цикл Анджело Лорети',
    },
    {
        'id': 'pisateli-dlia-detej',
        'hub': 'pisateli-dlia-detej',
        'authorSlugs': ['andzhelo-loreti'],
        'subtitle': 'Авторский цикл Анджело Лорети',
    },
    {
        'id': 'gastronomiya',
        'hub': 'gastronomiya',
        'authorSlugs': ['vitaliy-zadvornyiy'],
        'subtitle': 'Авторский цикл Виталия Задворного',
    },
    {
        'id': 'vatikanskiy-garazh',
        'hub': 'vatikanskiy-garazh',
        'authorSlugs': ['vitaliy-zadvornyiy'],
        'subtitle': 'Авторский цикл Виталия Задворного',
    },
    {
        'id': 'predateli',
        'hub': 'predateli',
        'authorSlugs': ['nikolai-chirkov', 'anastasiya-bozio'],
        'subtitle': 'Великий пост',
    },
    {
        'id': 'post-s-biblejskimi-zhenshhinami',
        'hub': 'post-s-biblejskimi-zhenshhinami',
        'authorSlugs': ['anna-goldina'],
        'subtitle': 'Авторский цикл Анны Гольдиной',
    },
    {
        'id': 'bibleyskiy-zoopark',
        'hub': 'bibleyskiy-zoopark',
        'authorSlugs': ['anna-goldina'],
        'subtitle': 'Авторский цикл Анны Гольдиной',
    },
    {
        'id': 'geografiya-spaseniya',
        'hub': 'geografiya-spaseniya',
        'authorSlugs': ['anna-goldina'],
        'subtitle': 'Авторский цикл Анны Гольдиной',
    },
    {
        'id': 'dnevnik-istseleniya',
        'hub': 'dnevnik-istseleniya',
        'authorSlugs': ['veronika-bikbulatova'],
        'subtitle': 'Авторский цикл Вероники Бикбулатовой',
    },
]


def fetch(url):
    last = None
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read().decode('utf-8', 'replace')
        except Exception as e:
            last = e
    raise last


def page_by_slug(slug):
    url = (
        'https://ruscatholic.org/wp-json/wp/v2/pages'
        f'?slug={slug}&_fields=id,slug,title,link,content'
    )
    data = json.loads(fetch(url))
    return data[0] if data else None


def post_title(slug):
    url = (
        'https://ruscatholic.org/wp-json/wp/v2/posts'
        f'?slug={slug}&_fields=title'
    )
    try:
        data = json.loads(fetch(url))
    except Exception:
        return ''
    if not data:
        return ''
    return clean_text(data[0].get('title', {}).get('rendered', ''))


def clean_text(s):
    s = unescape(re.sub(r'<[^>]+>', ' ', s or ''))
    s = (
        s.replace('&#8217;', '’')
        .replace('&#8211;', '–')
        .replace('&#8212;', '—')
        .replace('&#171;', '«')
        .replace('&#187;', '»')
        .replace('&nbsp;', ' ')
        .replace('&amp;', '&')
    )
    return re.sub(r'\s+', ' ', s).strip()


def extract_slugs(html, hub_slug):
    hrefs = re.findall(r'href=["\']([^"\']+)["\']', html or '', re.I)
    out = []
    seen = set()
    skip = {
        hub_slug, 'tag', 'category', 'author', 'wp-content', 'wp-admin', 'feed',
        'page', 'about', 'contacts', 'donate', 'privacy', 'uploads',
    }
    for href in hrefs:
        # /slug/ or punycode domain /slug/
        m = re.search(r'(?:^https?://[^/]+)?/([a-z0-9\-]+)/?(?:[?#].*)?$', href, re.I)
        if not m:
            # cyrillic domain path
            m = re.search(r'https?://[^/]+/([a-z0-9\-]+)/?(?:[?#].*)?$', href, re.I)
        if not m:
            continue
        s = m.group(1).lower()
        if s in skip or s in seen:
            continue
        if s.startswith('wp-') or len(s) < 3:
            continue
        if re.search(r'\.(jpg|jpeg|png|gif|webp|pdf)$', s):
            continue
        seen.add(s)
        out.append(s)
    return out


def load_author_titles():
    text = AUTHORS.read_text(encoding='utf-8')
    m = re.search(r'global\.YakAuthors = (\[[\s\S]*?\]);', text)
    titles = {}
    if not m:
        return titles
    for a in json.loads(m.group(1)):
        for p in a.get('recent') or []:
            if p.get('slug') and p.get('title'):
                titles[p['slug']] = clean_text(p['title'])
    return titles


def main():
    titles = load_author_titles()
    cycles = []
    for hub in HUBS:
        page = page_by_slug(hub['hub'])
        if not page:
            print('MISSING hub', hub['id'], hub['hub'])
            continue
        html = page.get('content', {}).get('rendered', '')
        slugs = extract_slugs(html, hub['hub'])
        for extra in hub.get('extraSlugs') or []:
            if extra not in slugs:
                slugs.append(extra)
        items = []
        for slug in slugs:
            title = titles.get(slug) or post_title(slug) or slug
            if slug not in titles:
                titles[slug] = title
            items.append({'slug': slug, 'title': title})
        cycle = {
            'id': hub['id'],
            'authorSlug': hub['authorSlugs'][0],
            'authorSlugs': hub['authorSlugs'],
            'title': clean_text(page.get('title', {}).get('rendered', '')),
            'subtitle': hub['subtitle'],
            'hubUrl': page.get('link') or ('https://ruscatholic.org/' + hub['hub'] + '/'),
            'intro': '',
            'items': items,
        }
        # короткое intro из начала текста хаба
        text = clean_text(html)
        if text:
            cycle['intro'] = text[:280] + ('…' if len(text) > 280 else '')
        cycles.append(cycle)
        print(
            f"{cycle['id']:32s} authors={','.join(hub['authorSlugs'])} items={len(items)}"
        )

    js = """/**
 * Циклы публикаций — собраны с хабов Рускатолик.
 * authorSlug — основной автор; authorSlugs — все (соавторство).
 */
(function (global) {
  'use strict';

  var CYCLES = %s;

  function byId(id) {
    for (var i = 0; i < CYCLES.length; i++) if (CYCLES[i].id === id) return CYCLES[i];
    return null;
  }

  function authorList(c) {
    if (c.authorSlugs && c.authorSlugs.length) return c.authorSlugs;
    return c.authorSlug ? [c.authorSlug] : [];
  }

  function forAuthor(authorSlug) {
    return CYCLES.filter(function (c) {
      return authorList(c).indexOf(authorSlug) !== -1;
    });
  }

  function byArticleSlug(slug) {
    if (!slug) return null;
    for (var i = 0; i < CYCLES.length; i++) {
      var c = CYCLES[i];
      var items = c.items || [];
      for (var j = 0; j < items.length; j++) {
        if (items[j].slug === slug) return c;
      }
    }
    return null;
  }

  global.YakCycles = {
    ALL: CYCLES,
    byId: byId,
    forAuthor: forAuthor,
    byArticleSlug: byArticleSlug
  };
})(typeof window !== 'undefined' ? window : this);
""" % json.dumps(cycles, ensure_ascii=False, indent=2)

    OUT.write_text(js, encoding='utf-8')
    print('wrote', OUT, 'cycles', len(cycles), 'items', sum(len(c['items']) for c in cycles))


if __name__ == '__main__':
    main()
