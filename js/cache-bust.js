/**
 * Снос SW/Cache API + сверка с build.json.
 * Старый HTML на телефоне иначе месяцами тянет прошлые ?v= скрипты.
 */
(function () {
  'use strict';
  var EMBEDDED = (window.YAK_BUILD || '').toString();
  var KEY = 'yak_build_id';

  function nukeSw() {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.getRegistrations) {
      return Promise.resolve();
    }
    return navigator.serviceWorker.getRegistrations().then(function (regs) {
      return Promise.all(regs.map(function (reg) { return reg.unregister(); }));
    }).catch(function () {});
  }

  function nukeCaches() {
    if (!window.caches || !caches.keys) return Promise.resolve();
    return caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return caches.delete(k); }));
    }).catch(function () {});
  }

  function stampBuild(id) {
    if (!id || document.getElementById('yak-build-stamp')) return;
    var host =
      document.querySelector('.portal-footer .wrap') ||
      document.querySelector('.site-footer') ||
      document.querySelector('.side-user') ||
      null;
    if (!host) return;
    var el = document.createElement('p');
    el.id = 'yak-build-stamp';
    el.textContent = 'Сборка ' + id;
    el.className = 'build-stamp';
    host.appendChild(el);
  }

  function stampWhenReady(id) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { stampBuild(id); }, { once: true });
      return;
    }
    stampBuild(id);
  }

  function buildUrl() {
    try {
      return new URL('build.json', document.baseURI || location.href).href;
    } catch (e) {
      return 'build.json';
    }
  }

  function checkRemote() {
    return fetch(buildUrl() + (buildUrl().indexOf('?') === -1 ? '?' : '&') + 't=' + Date.now(), {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var remote = j && j.id ? String(j.id) : '';
        if (!remote || remote === EMBEDDED) return;
        var flag = 'yak_reloaded_' + remote;
        try {
          if (sessionStorage.getItem(flag)) return;
          sessionStorage.setItem(flag, '1');
        } catch (e) {}
        var u;
        try {
          u = new URL(location.href);
          u.searchParams.set('v', remote);
          location.replace(u.toString());
        } catch (err) {
          location.replace(location.pathname + '?v=' + encodeURIComponent(remote) + location.hash);
        }
      })
      .catch(function () {});
  }

  var LEGAL =
    'Информационный проект Централизованной религиозной организации Римско-католическая Архиепархия Божией Матери в Москве. ОГРН 1027739747705, ИНН 7708015053. Адрес: 123557, город Москва, ул. Малая Грузинская, д. 27/13, стр.2';

  var FOOTER_LINKS = [
    ['page.html', 'О проекте'],
    ['archive.html?category=news', 'Новости'],
    ['articles.html', 'Статьи'],
    ['events.html', 'Афиша'],
    ['library.html', 'Библиотека'],
    ['photostock.html', 'Фото'],
    ['audio.html', 'Аудио'],
    ['video.html', 'Видео'],
  ];

  function paintFooter() {
    var hosts = document.querySelectorAll('.portal-footer, .site-footer');
    if (!hosts.length) return;
    var links = FOOTER_LINKS.map(function (l) {
      return '<a href="' + l[0] + '">' + l[1] + '</a>';
    }).join('');
    var html =
      '<div class="wrap footer-row">' +
      '<a class="logo" href="index.html">' +
      '<span class="mark"><img src="yakatolik-logo.svg" alt="ЯКатолик" width="30" height="30" /></span>' +
      '<span class="wm">ЯКатолик</span></a>' +
      '<nav class="footer-links footer-links--row" aria-label="Разделы">' + links + '</nav></div>' +
      '<p class="footer-tagline footer-legal">' + LEGAL + '</p>';
    hosts.forEach(function (el) {
      el.className = 'portal-footer';
      el.innerHTML = html;
    });
  }

  function isInternalHref(href) {
    if (!href) return true;
    if (href.charAt(0) === '#' || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0 || href.indexOf('javascript:') === 0) return true;
    try {
      var u = new URL(href, location.href);
      return u.origin === location.origin;
    } catch (e) {
      return true;
    }
  }

  function applyLinkTargets(root) {
    (root || document).querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (isInternalHref(href)) {
        a.removeAttribute('target');
      } else {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  function bootChrome() {
    paintFooter();
    stampBuild(EMBEDDED);
    applyLinkTargets(document);
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (isInternalHref(href)) a.removeAttribute('target');
      else {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
    }, true);
  }

  var seen = '';
  try { seen = localStorage.getItem(KEY) || ''; } catch (e) {}
  var firstOfBuild = !seen || seen !== EMBEDDED;
  (firstOfBuild ? Promise.all([nukeSw(), nukeCaches()]) : Promise.resolve()).then(function () {
    stampWhenReady(EMBEDDED);
    try { if (EMBEDDED) localStorage.setItem(KEY, EMBEDDED); } catch (e) {}
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootChrome, { once: true });
    } else {
      bootChrome();
    }
    return checkRemote();
  });
})();
