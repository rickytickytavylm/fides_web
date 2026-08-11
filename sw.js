/* РЇРљР°С‚РѕР»РёРє SW:
   - HTML/CSS/JS (same-origin) вЂ” network-only (РЅРёРєРѕРіРґР° РЅРµ Р·Р°Р»РёРїР°РµС‚ СЃС‚Р°СЂРѕРµ)
   - РєР°СЂС‚РёРЅРєРё (Р»СЋР±РѕР№ origin) вЂ” cache-first, С‡С‚РѕР±С‹ РЅРµ РїРѕРґРІРёСЃР°Р»Рё РїСЂРё РїРµСЂРµС…РѕРґР°С… */
var BUILD = '202608111610';
var IMG_CACHE = 'yak-img-v1';

function isImage(req, url) {
  if (req.destination === 'image') return true;
  return /\.(png|jpe?g|webp|gif|svg|avif)(\?|$)/i.test(url.pathname);
}

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        // СЃС‚Р°СЂС‹Рµ РІРµСЂСЃРёРё С‡РёСЃС‚РёРј, Р°РєС‚СѓР°Р»СЊРЅС‹Р№ img-РєРµС€ РѕСЃС‚Р°РІР»СЏРµРј
        if (k === IMG_CACHE) return Promise.resolve();
        return caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);

  // РљР°СЂС‚РёРЅРєРё вЂ” cache-first (РјРіРЅРѕРІРµРЅРЅРѕ РїСЂРё РІРѕР·РІСЂР°С‚Рµ РЅР° СЃС‚СЂР°РЅРёС†Сѓ)
  if (isImage(req, url)) {
    event.respondWith(
      caches.open(IMG_CACHE).then(function (cache) {
        return cache.match(req).then(function (hit) {
          if (hit) return hit;
          return fetch(req).then(function (res) {
            if (res && (res.ok || res.type === 'opaque')) {
              cache.put(req, res.clone());
            }
            return res;
          }).catch(function () { return hit; });
        });
      })
    );
    return;
  }

  // Р’СЃС‘ РѕСЃС‚Р°Р»СЊРЅРѕРµ вЂ” С‚РѕР»СЊРєРѕ same-origin, Р±РµР· РєРµС€Р°
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req, { cache: 'no-store' }).catch(function () {
      return fetch(req);
    })
  );
});

self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'GET_BUILD') {
    event.source && event.source.postMessage({ type: 'BUILD', id: BUILD });
  }
});
