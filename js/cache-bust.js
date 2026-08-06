/**
 * Сброс кэша: регистрирует network-only SW и перезагружает страницу,
 * если build.json на сервере новее, чем зашитый BUILD в HTML.
 */
(function () {
  'use strict';
  var EMBEDDED = (window.YAK_BUILD || '').toString();
  var KEY = 'yak_build_id';

  function registerSw() {
    if (!('serviceWorker' in navigator)) return Promise.resolve();
    return navigator.serviceWorker
      .register('./sw.js?b=' + encodeURIComponent(EMBEDDED), { scope: './' })
      .then(function (reg) {
        if (reg.update) reg.update();
        return reg;
      })
      .catch(function () {});
  }

  function nukeCaches() {
    if (!window.caches || !caches.keys) return Promise.resolve();
    return caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return caches.delete(k); }));
    }).catch(function () {});
  }

  function checkBuild() {
    if (!EMBEDDED) return Promise.resolve();
    var url = 'build.json?b=' + Date.now();
    return fetch(url, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data.id) return;
        var remote = String(data.id);
        try { localStorage.setItem(KEY, remote); } catch (e) {}
        if (remote !== EMBEDDED) {
          var flag = 'yak_reloaded_' + remote;
          try {
            if (sessionStorage.getItem(flag)) return;
            sessionStorage.setItem(flag, '1');
          } catch (e) {}
          return nukeCaches().then(function () {
            var u = new URL(location.href);
            u.searchParams.set('_b', remote);
            location.replace(u.toString());
          });
        }
      })
      .catch(function () {});
  }

  registerSw().then(checkBuild);
})();
