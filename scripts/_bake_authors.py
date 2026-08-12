# -*- coding: utf-8 -*-
"""Собирает каталог авторов из тегов Рускатолик (WP tags).

Пилоты с известными фото/ролями сохраняются; остальные — без фото (инициалы на сайте).
"""
import json
import re
import sys
import io
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import unquote, quote

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'js' / 'authors-data.js'
UA = {'User-Agent': 'YakAuthorsBake/1'}

# Кураторские карточки: фото, роль, био. slug — наш; tagSlug — на WP.
CURATED = {
    138: {
        'slug': 'sergey-sabsay',
        'name': 'Сергей Сабсай',
        'role': 'публицист',
        'bio': 'Автор материалов о вере, культуре и католической жизни.',
        'photo': 'assets/authors/sergey-sabsay.webp',
    },
    219: {
        'slug': 'andzhelo-loreti',
        'name': 'Анджело Лорети',
        'role': 'священник',
        'bio': 'Священник, автор проповедей и материалов для духовного роста.',
        'photo': 'assets/authors/andzhelo-loreti.webp',
    },
    133: {
        'slug': 'nikolai-chirkov',
        'name': 'Николай Чирков',
        'role': 'автор',
        'bio': 'Автор материалов архива Рускатолик.',
        'photo': 'assets/authors/nikolai-chirkov.webp',
    },
    113: {
        'slug': 'anastasiya-bozio',
        'name': 'Анастасия Бозио',
        'role': 'редактор / автор',
        'bio': 'Редактор и автор. Тег на Рускатолик: anastasiya-orlova.',
        'photo': 'assets/authors/anastasiya-bozio.webp',
    },
}

# Теги-темы / рубрики / не-люди (по id или slug)
DENY_IDS = {
    158,  # Год посвященной Богу жизни
    43,   # Покровские ворота
    170,  # Юбилейный Год Милосердия
    155,  # Размышления на каждый день
    153,  # Русские католики
    163,  # Геноцид армян
    222,  # Забота об общем доме
    12,   # Искусство Добра (проект, не автор)
}
DENY_SLUG = re.compile(
    r'(anno-della|pokrovka|yubileyn|verbum|ruscatholic|genocide|ecology|vatican|radio|tv-|канал)',
    re.I,
)
DENY_NAME = re.compile(
    r'(год |ворота|размышлен|русские католики|геноцид|забота об|ватикан|радио|т/?в\b|канал|новост|рубрик)',
    re.I,
)
MIN_COUNT = 3
RECENT_PER = 12


def fetch_json(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode('utf-8'))


def fetch_all_tags():
    tags = []
    page = 1
    while page <= 30:
        url = (
            'https://ruscatholic.org/wp-json/wp/v2/tags'
            f'?per_page=100&page={page}&orderby=count&order=desc'
        )
        try:
            batch = fetch_json(url)
        except Exception as e:
            print('tags stop page', page, e)
            break
        if not batch:
            break
        tags.extend(batch)
        page += 1
    return tags


def looks_like_person(name):
    parts = [p for p in re.split(r'\s+', name.strip()) if p]
    if len(parts) < 2 or len(parts) > 4:
        return False
    # Имя + Фамилия: обе части с заглавной буквы, без «цифровых» тем
    for p in parts:
        if not re.match(r'^[A-ZА-ЯЁІЇЄ][\wА-Яа-яЁёІіЇїЄє’\'\-\.]*$', p):
            return False
    return True


def slugify_from_wp(tag):
    raw = unquote(tag.get('slug') or '')
    # кириллический slug → транслит простой: используем id-safe ascii если нужно
    if re.search(r'[^\x00-\x7F]', raw) or not raw:
        # fallback: из name
        name = tag.get('name') or ('author-' + str(tag.get('id')))
        # keep curated slug if any
        return re.sub(r'[^a-z0-9\-]+', '-', name.lower()).strip('-') or ('author-' + str(tag['id']))
    return raw


def translit_slug(name, tag_id):
    table = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        'і': 'i', 'ї': 'yi', 'є': 'ye',
    }
    out = []
    for ch in name.lower():
        if ch in table:
            out.append(table[ch])
        elif ch.isascii() and (ch.isalnum() or ch == '-'):
            out.append(ch)
        elif ch in " '’.":
            out.append('-')
        else:
            out.append('-')
    slug = re.sub(r'-+', '-', ''.join(out)).strip('-')
    return slug or ('author-' + str(tag_id))


def clean_html_title(s):
    s = s or ''
    return (
        s.replace('&#8217;', '’')
        .replace('&#8211;', '–')
        .replace('&#8212;', '—')
        .replace('&#171;', '«')
        .replace('&#187;', '»')
        .replace('&nbsp;', ' ')
        .replace('&amp;', '&')
    )


def tag_archive_url(tag):
    slug = unquote(tag.get('slug') or '')
    if not slug:
        return 'https://ruscatholic.org/'
    # WP принимает percent-encoded slug
    return 'https://ruscatholic.org/tag/' + quote(slug, safe='') + '/'


def bake_one(tag):
    tid = tag['id']
    curated = CURATED.get(tid, {})
    name = curated.get('name') or tag.get('name') or 'Автор'
    slug = curated.get('slug')
    if not slug:
        wp_slug = unquote(tag.get('slug') or '')
        if wp_slug and not re.search(r'[^\x00-\x7F]', wp_slug):
            slug = wp_slug
        else:
            slug = translit_slug(name, tid)

    url = (
        'https://ruscatholic.org/wp-json/wp/v2/posts'
        f'?tags={tid}&per_page={RECENT_PER}'
        '&_fields=slug,title,date,excerpt'
    )
    posts = []
    for attempt in range(3):
        try:
            posts = fetch_json(url)
            break
        except Exception as e:
            print('posts fail', name, 'try', attempt + 1, e)

    recent = []
    for p in posts:
        recent.append({
            'slug': p.get('slug'),
            'title': clean_html_title(p.get('title', {}).get('rendered', '')),
            'date': (p.get('date') or '')[:10],
            'excerpt': p.get('excerpt', {}).get('rendered', ''),
        })

    return {
        'slug': slug,
        'name': name,
        'role': curated.get('role') or 'автор',
        'tagId': tid,
        'count': tag.get('count', len(recent)),
        'bio': curated.get('bio') or ('Автор материалов архива Рускатолик.'),
        'photo': curated.get('photo') or '',
        'socials': [{'label': 'Архив на Рускатолик', 'href': tag_archive_url(tag)}],
        'recent': recent,
        'latestDate': recent[0]['date'] if recent else '',
    }


def main():
    tags = fetch_all_tags()
    print('tags total', len(tags))

    chosen = []
    for t in tags:
        tid = t.get('id')
        name = (t.get('name') or '').strip()
        slug = unquote(t.get('slug') or '')
        count = t.get('count') or 0
        if tid in DENY_IDS:
            continue
        if DENY_SLUG.search(slug) or DENY_NAME.search(name):
            continue
        if count < MIN_COUNT:
            continue
        # curated всегда берём
        if tid in CURATED or looks_like_person(name):
            chosen.append(t)

    # уникальность по id, сортировка по count desc
    seen = set()
    uniq = []
    for t in sorted(chosen, key=lambda x: -(x.get('count') or 0)):
        if t['id'] in seen:
            continue
        seen.add(t['id'])
        uniq.append(t)

    print('authors chosen', len(uniq))
    out = []
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(bake_one, t): t for t in uniq}
        for fut in as_completed(futures):
            row = fut.result()
            out.append(row)
            print(
                f"{row['name']:28s}  tag={row['tagId']:4d}  count={row['count']:4d}  "
                f"baked={len(row['recent']):2d}  photo={'yes' if row['photo'] else 'no'}",
                flush=True,
            )

    # стабильный порядок: с фото / по count
    out.sort(key=lambda a: (0 if a.get('photo') else 1, -(a.get('count') or 0), a.get('name') or ''))

    js = (
        '/** Каталог авторов из тегов Рускатолик. recent[] запечён из WP API. */\n'
        '(function (global) {\n'
        "  'use strict';\n"
        '  global.YakAuthors = %s;\n'
        "})(typeof window !== 'undefined' ? window : this);\n"
    ) % json.dumps(out, ensure_ascii=False, indent=2)

    OUT.write_text(js, encoding='utf-8')
    print('wrote', OUT, 'authors', len(out))


if __name__ == '__main__':
    main()
