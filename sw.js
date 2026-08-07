/* ЯКатолик SW:
   - HTML/CSS/JS (same-origin) — network-only (никогда не залипает старое)
   - картинки (любой origin) — cache-first, чтобы не подвисали при переходах */
var BUILD = '202608071004';
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
        // старые версии чистим, актуальный img-кеш оставляем
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

  // Картинки — cache-first (мгновенно при возврате на страницу)
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

  // Всё остальное — только same-origin, без кеша
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
