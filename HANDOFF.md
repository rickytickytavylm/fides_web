# ЯКатолик — интеграция бэкенда (портал)

Статический фронтенд портала. Карта храмов, архив и чат подключаются к API через единый конфиг.

**Карта храмов (контракт и стек):** [`docs/MAPS.md`](docs/MAPS.md)

---

## 1. Конфигурация

Файл: [`js/config.js`](js/config.js)

| Параметр | Назначение |
|----------|------------|
| `TEMPLES_API_BASE` | Базовый URL API карты храмов |
| `ARCHIVE_API_BASE` | Базовый URL архива и чата |
| `TEMPLES_MODE` | `auto` \| `live` \| `demo` |

Пример:

```js
TEMPLES_API_BASE: 'https://api.example.com'
```

Без правки репозитория:

- `map.html?api=https://api.example.com`
- `map.html?api=https://api.example.com&mode=live`
- `window.VeraConfigOverride = { TEMPLES_API_BASE: 'https://…' }`

| Режим | Поведение |
|-------|-----------|
| `auto` | Запрос к API; при недоступности — демо-набор точек |
| `live` | Только API |
| `demo` | Только демо-набор (офлайн-демонстрация UI) |

---

## 2. API карты храмов

Формат совместим с клиентским приложением (`/api/temples/search`).

### `GET /api/temples/search?bbox=lonMin,latMin,lonMax,latMax`

Пример: `GET /api/temples/search?bbox=37.4,55.6,37.8,55.9`

Ответ `200`:

```json
{
  "features": [
    {
      "geometry": { "coordinates": [37.6289, 55.7609] },
      "properties": {
        "CompanyMetaData": {
          "id": "cathmos-st-louis",
          "name": "Храм св. Людовика",
          "address": "ул. Малая Лубянка, 12",
          "City": "Москва",
          "Diocese": "Архиепархия Божией Матери",
          "Kind": "parish",
          "Phones": [{ "formatted": "+7 …" }],
          "Hours": { "text": "Мессы: вс 10:00" },
          "url": "https://…",
          "email": "…",
          "Photos": ["https://…/photo.jpg"],
          "Tags": ["приход"],
          "description": "…"
        }
      }
    }
  ],
  "source": "db"
}
```

Требования:

- `coordinates` — `[longitude, latitude]` (порядок GeoJSON);
- `Kind` — `parish` \| `cathedral` \| `chapel` (допустима произвольная строка);
- пустая область — `{ "features": [] }` (не HTTP 404);
- CORS: разрешён origin продакшен-сайта.

### `GET /api/temples/stats` (опционально)

```json
{ "count": 198, "source": "db" }
```

---

## 3. Пример сервера (FastAPI)

```python
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # в проде — конкретный origin сайта
    allow_methods=["GET"],
    allow_headers=["*"],
)

TEMPLES = []  # загрузка из вашей БД / существующего сервиса

@app.get("/api/temples/search")
def search(bbox: str = Query(...)):
    lon_min, lat_min, lon_max, lat_max = map(float, bbox.split(","))
    features = []
    for t in TEMPLES:
        lon, lat = t["lon"], t["lat"]
        if lon_min <= lon <= lon_max and lat_min <= lat <= lat_max:
            features.append({
                "geometry": {"coordinates": [lon, lat]},
                "properties": {
                    "CompanyMetaData": {
                        "id": t["id"],
                        "name": t["name"],
                        "address": t.get("address", ""),
                        "City": t.get("city", ""),
                        "Diocese": t.get("diocese", ""),
                        "Kind": t.get("kind", "parish"),
                        "Phones": [{"formatted": t["phone"]}] if t.get("phone") else [],
                        "Hours": {"text": t["hours"]} if t.get("hours") else None,
                        "url": t.get("website"),
                        "Photos": t.get("photos") or [],
                        "Tags": t.get("tags") or [],
                        "description": t.get("description", ""),
                    }
                },
            })
    return {"features": features, "source": "api"}

@app.get("/api/temples/stats")
def stats():
    return {"count": len(TEMPLES), "source": "api"}
```

Проверка: `map.html?api=http://127.0.0.1:8000&mode=live`

---

## 4. Структура фронтенда

| Путь | Назначение |
|------|------------|
| `index.html`, `portal.css` | Главная, единая тема портала |
| `map.html`, `js/map-page.js` | Карта (Leaflet, тёмные тайлы) |
| `js/config.js` | Точка смены API |
| `js/temples-api.js` | Клиент карты + fallback |
| `js/api.js` | Архив, чат |
| `articles.html`, `js/articles-page.js` | Хаб «Статьи» (рубрики / темы / QA / идеи) |
| `archive.html`, `article.html` | Лента архива и карточка публикации |
| `chat.html` | Диалог «Спросите о вере» |
| `docs/MAPS.md` | Спецификация карты |

Карта не требует ключа Яндекс.Карт для отображения тайлов (Carto Dark Matter / OSM).  
Кнопка маршрута открывает Яндекс.Карты во внешнем окне.

---

## 5. Зона ответственности бэкенда

1. Реализовать endpoints из §2 (или адаптер над существующим diocese-API).
2. Указать `TEMPLES_API_BASE` в `js/config.js`.
3. Настроить CORS и HTTPS на проде.
4. (Опционально) заменить слой Leaflet на Яндекс.Карты JS API — данные уже изолированы в `VeraTemples.search()`.

Архив и чат используют `ARCHIVE_API_BASE`; при миграции на собственный бэкенд достаточно сменить значение в конфиге.

---

## 6a. Статические «Страницы» (WP `pages`, ~191)

Это **не** раздел «О Церкви». Отдельный тип без категорий/тегов: хабы циклов (`messori`, `iannaccone`), биографии, опорные тексты. В БД уже залиты (`pages: 191`, mode `archive`).

- API: `GET /api/archive/ruscatholic/pages`, `GET /api/archive/ruscatholic/pages/:id`
- Фронт: фильтр **Статьи → Страницы** (`archive.html?category=pages`); просмотр `static.html` / `article.html`
- Инлайн-ссылки: `sanitizeInlineHtml` оставляет безопасные `<a>`; пример статьи — `kleveta`

## 6. Правила рубрик архива (парсинг + фронт)

Нужно на стороне парсера / индекса (фронт уже делает мягкий алиас в `js/api.js`):

1. **Папа → Святой Престол.** Все материалы категории `pope` («Папа Римский») должны попадать в ленту `santa-sede` («Святой Престол»). На портале отдельного чипа «Папа» больше нет.
2. **Проповеди.** Фильтр `category=propovedi` на API сейчас даёт 0; у записей есть `categorySlugs: ["pastirstvo","propovedi"]`. Нужна фильтрация по любому слагу в массиве. До фикса фронт берёт `pastirstvo` и оставляет только `propovedi`.
3. **Новые теги для хаба «Статьи»** (когда появятся на Рускатолике — заменить временный `q=` на `category=` в `js/articles-page.js`):
   - Искусственный интеллект
   - Забота об общем доме
   - Экуменический диалог (`echumenical` / аналог)
