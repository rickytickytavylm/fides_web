/* Kill-switch: unregister leftover SW and wipe caches. Do not serve pages. */
var BUILD = '202608131321';

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) { return caches.delete(k); }));
      })
      .then(function () {
        return self.registration.unregister();
      })
      .then(function () {
        return self.clients.matchAll({ type: 'window' });
      })
      .then(function (clients) {
        clients.forEach(function (client) {
          if (client.url) client.navigate(client.url);
        });
      })
  );
});

self.addEventListener('fetch', function () {
  /* pass through — no cache */
});
