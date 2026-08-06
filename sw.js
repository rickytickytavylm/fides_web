/* ЯКатолик — network-only SW: не кеширует HTML/CSS/JS, чистит старые caches */
var BUILD = '202608061445';

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return caches.delete(k); }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  // Только same-origin
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
