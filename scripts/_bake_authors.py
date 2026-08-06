import json, urllib.request, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

authors = [
    {'slug': 'sergey-sabsay', 'name': 'Сергей Сабсай', 'role': 'публицист', 'tagId': 138,
     'bio': 'Автор материалов о вере, культуре и католической жизни.',
     'tagUrl': 'https://ruscatholic.org/tag/sergey-sabsay/'},
    {'slug': 'andzhelo-loreti', 'name': 'Анджело Лорети', 'role': 'священник', 'tagId': 219,
     'bio': 'Священник, автор проповедей и материалов для духовного роста.',
     'tagUrl': 'https://ruscatholic.org/tag/%d0%b0%d0%bd%d0%b4%d0%b6%d0%b5%d0%bb%d0%be-%d0%bb%d0%be%d1%80%d0%b5%d1%82%d0%b8/'},
    {'slug': 'nikolai-chirkov', 'name': 'Николай Чирков', 'role': 'автор', 'tagId': 133,
     'bio': 'Автор материалов архива Рускатолик.',
     'tagUrl': 'https://ruscatholic.org/tag/nikolai-chirkov/'},
    {'slug': 'anastasiya-bozio', 'name': 'Анастасия Бозио', 'role': 'редактор / автор', 'tagId': 113,
     'bio': 'Редактор и автор. Тег на Рускатолик: anastasiya-orlova.',
     'tagUrl': 'https://ruscatholic.org/tag/anastasiya-orlova/'},
]

out = []
for a in authors:
    url = f"https://ruscatholic.org/wp-json/wp/v2/posts?tags={a['tagId']}&per_page=12&_fields=id,slug,title,date,excerpt,jetpack_featured_media_url"
    # _fields might strip featured; use full
    url = f"https://ruscatholic.org/wp-json/wp/v2/posts?tags={a['tagId']}&per_page=12"
    posts = json.loads(urllib.request.urlopen(url, timeout=30).read().decode('utf-8'))
    recent = []
    for p in posts:
        title = p.get('title', {}).get('rendered', '')
        excerpt = p.get('excerpt', {}).get('rendered', '')
        recent.append({
            'slug': p.get('slug'),
            'title': title.replace('&#8217;', '’').replace('&#171;', '«').replace('&#187;', '»'),
            'date': (p.get('date') or '')[:10],
            'excerpt': excerpt,
        })
    # tag count
    tag = json.loads(urllib.request.urlopen(
        f"https://ruscatholic.org/wp-json/wp/v2/tags/{a['tagId']}", timeout=20
    ).read().decode('utf-8'))
    out.append({
        'slug': a['slug'],
        'name': a['name'],
        'role': a['role'],
        'tagId': a['tagId'],
        'count': tag.get('count', len(recent)),
        'bio': a['bio'],
        'photo': '',
        'socials': [{'label': 'Архив на Рускатолик', 'href': a['tagUrl']}],
        'recent': recent,
        'latestDate': recent[0]['date'] if recent else '',
    })
    print(a['name'], 'count', tag.get('count'), 'baked', len(recent))

js = """/** Пилотный список авторов. recent[] запечён из WP API Рускатолик. */
(function (global) {
  'use strict';
  global.YakAuthors = %s;
})(typeof window !== 'undefined' ? window : this);
""" % json.dumps(out, ensure_ascii=False, indent=2)

path = r'js\authors-data.js'
with open(path, 'w', encoding='utf-8') as f:
    f.write(js)
print('wrote', path)
