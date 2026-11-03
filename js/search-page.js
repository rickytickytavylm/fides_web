/**
 * Общий поиск портала: материалы + библиотека + авторы + афиша.
 * Материалы — без фильтра рубрики, иначе точное название в чужом разделе даёт 0.
 */
(function () {
  'use strict';
  var V = window.Vera;
  var root = document.getElementById('search-root');
  if (!V || !root) return;

  var input = document.getElementById('site-search');
  var hint = document.getElementById('search-hint');
  var countEl = document.getElementById('search-count');
  var box = document.getElementById('search-results');
  var timer = null;
  var seq = 0;

  function cleanQuery(raw) {
    return String(raw || '')
      .replace(/[«»„“”"'`]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/ё/g, 'е');
  }

  function hasQ(hay, qn) {
    return hay && qn && norm(hay).indexOf(qn) !== -1;
  }

  function titleRank(title, q) {
    var t = norm(title);
    var n = norm(q);
    if (!t || !n) return 9;
    if (t === n) return 0;
    if (t.indexOf(n) === 0) return 1;
    if (t.indexOf(n) !== -1) return 2;
    return 5;
  }

  function writeUrl(q) {
    var next = q ? 'search.html?q=' + encodeURIComponent(q) : 'search.html';
    if (location.pathname.split('/').pop() + (location.search || '') !== next) {
      history.replaceState({}, '', next);
    }
  }

  function initials(name) {
    return String(name || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function (w) { return w.charAt(0); })
      .join('')
      .toUpperCase();
  }

  function materialRow(item) {
    var href = V.articleHref(item);
    var sec = V.sectionOf ? V.sectionOf(item) : { label: 'Материал' };
    var rub = (V.categoryLine && V.categoryLine(item, sec.label || 'Материал')) || sec.label;
    var cover = V.coverStyle ? V.coverStyle(item.image) : '';
    return (
      '<article class="feed-item">' +
      '<a class="feed-thumb" href="' + href + '" ' + cover + '></a>' +
      '<div class="feed-body">' +
      '<p class="kicker"><span>' + V.escapeHtml(rub) + '</span><time>' +
      V.escapeHtml(V.formatDate(item.date)) +
      '</time></p>' +
      '<h3><a href="' + href + '">' + V.escapeHtml(item.title || '') + '</a></h3>' +
      '</div></article>'
    );
  }

  function bookRow(item, L) {
    var title = L.displayTitle(item);
    var sub = item.author || L.categoryLabel(item) || '';
    return (
      '<a class="search-mini" href="book.html?id=' + encodeURIComponent(item.id) + '">' +
      '<span><strong>' + V.escapeHtml(title) + '</strong>' +
      (sub ? '<small>' + V.escapeHtml(sub) + '</small>' : '') +
      '</span></a>'
    );
  }

  function authorRow(a) {
    var ava = a.photo
      ? '<span class="author-ava" style="background-image:url(\'' + V.escapeHtml(a.photo) + '\')"></span>'
      : '<span class="author-ava initials">' + V.escapeHtml(initials(a.name)) + '</span>';
    return (
      '<a class="search-mini" href="author.html?slug=' + encodeURIComponent(a.slug) + '">' +
      ava +
      '<span><strong>' + V.escapeHtml(a.name || '') + '</strong>' +
      (a.role ? '<small>' + V.escapeHtml(a.role) + '</small>' : '') +
      '</span></a>'
    );
  }

  function eventRow(e, A) {
    var href = A.eventPageHref ? A.eventPageHref(e) : 'events.html';
    var where = (A.organizerName && A.organizerName(e)) || e.city || e.venue || '';
    return (
      '<a class="search-mini" href="' + href + '">' +
      '<span><strong>' + V.escapeHtml(e.title || '') + '</strong>' +
      '<small>' + V.escapeHtml((e.date || '') + (where ? ' · ' + where : '')) + '</small>' +
      '</span></a>'
    );
  }

  function group(title, inner, extraClass) {
    if (!inner) return '';
    return (
      '<section class="search-group">' +
      '<h2>' + V.escapeHtml(title) + '</h2>' +
      '<div class="' + (extraClass || 'search-hits') + '">' + inner + '</div>' +
      '</section>'
    );
  }

  function localBooks(qn) {
    var L = window.YAK_LIBRARY;
    if (!L || !L.ITEMS || !qn) return [];
    return L.ITEMS.filter(function (it) {
      return (
        hasQ(L.displayTitle(it), qn) ||
        hasQ(it.titleOriginal, qn) ||
        hasQ(it.titleRu, qn) ||
        hasQ(it.author, qn) ||
        hasQ(it.annotation, qn)
      );
    }).slice(0, 8);
  }

  function localAuthors(qn) {
    var list = window.YakAuthors || [];
    if (!qn) return [];
    return list.filter(function (a) {
      return hasQ(a.name, qn) || hasQ(a.role, qn);
    }).slice(0, 8);
  }

  function localEvents(qn) {
    var A = window.YakAfisha;
    if (!A || !qn) return [];
    var list = A.publishedEvents ? A.publishedEvents() : (A.EVENTS || []);
    return list.filter(function (e) {
      var org = A.organizerName ? A.organizerName(e) : '';
      return hasQ(e.title, qn) || hasQ(e.city, qn) || hasQ(e.venue, qn) || hasQ(org, qn);
    }).slice(0, 6);
  }

  function paintIdle() {
    if (hint) hint.textContent = 'Ищет по статьям, новостям, библиотеке, авторам и афише';
    if (countEl) countEl.textContent = '';
    box.innerHTML =
      '<p class="search-idle">Напишите название или тему. Не нужно знать раздел — поиск общий.</p>';
  }

  function paint(q, pack) {
    var items = (pack.items || []).slice();
    items.sort(function (a, b) {
      return titleRank(a.title, q) - titleRank(b.title, q);
    });
    var qn = norm(q);
    var books = localBooks(qn);
    var authors = localAuthors(qn);
    var events = localEvents(qn);
    var L = window.YAK_LIBRARY;
    var A = window.YakAfisha;
    var total = (Number(pack.total) || items.length) + books.length + authors.length + events.length;

    if (hint) hint.textContent = 'По всему порталу, без привязки к разделу';
    if (countEl) {
      countEl.textContent = total
        ? total.toLocaleString('ru-RU') + ' совпадений'
        : '';
    }

    if (!total) {
      box.innerHTML =
        '<p class="archive-empty">Ничего не найдено. Попробуйте короче или без кавычек.</p>';
      return;
    }

    box.innerHTML =
      group('Материалы', items.map(materialRow).join('')) +
      group('Библиотека', books.map(function (it) { return bookRow(it, L); }).join(''), 'search-side') +
      group('Авторы', authors.map(authorRow).join(''), 'search-side') +
      group('Афиша', events.map(function (e) { return eventRow(e, A); }).join(''), 'search-side');
  }

  function paintWait() {
    box.innerHTML =
      (V.skeletonRows ? V.skeletonRows(4, 88) : '<p class="search-idle">Ищем…</p>');
  }

  function run(raw, fromType) {
    var q = cleanQuery(raw);
    writeUrl(q);
    document.title = (q ? q + ' — ' : '') + 'Поиск — Рускатолик';
    if (!q) {
      paintIdle();
      return;
    }
    if (q.length < 2) {
      if (hint) hint.textContent = 'Ещё буква или две';
      if (countEl) countEl.textContent = '';
      box.innerHTML = '';
      return;
    }
    var my = ++seq;
    if (!fromType) paintWait();
    V.getArticles({ q: q, page: 1, limit: 30 })
      .then(function (pack) {
        if (my !== seq) return;
        paint(q, pack || { items: [], total: 0 });
      })
      .catch(function () {
        if (my !== seq) return;
        var qn = norm(q);
        var local = localBooks(qn).length + localAuthors(qn).length + localEvents(qn).length;
        if (local) {
          paint(q, { items: [], total: 0 });
          return;
        }
        box.innerHTML = '<p class="archive-empty">Не удалось загрузить. Обновите страницу.</p>';
      });
  }

  var start = cleanQuery(new URLSearchParams(location.search).get('q') || '');
  if (input) {
    input.value = start;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        run(input.value, true);
      }, 320);
    });
    var form = document.getElementById('site-search-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        clearTimeout(timer);
        run(input.value, false);
      });
    }
    if (!start) {
      try { input.focus(); } catch (e) {}
    }
  }

  run(start, false);

  function refreshLocal() {
    if (input && cleanQuery(input.value).length >= 2) run(input.value, true);
  }
  if (window.YakAuthorsOnPack) window.YakAuthorsOnPack(refreshLocal);
  if (window.YAK_LIBRARY && YAK_LIBRARY.onPack) YAK_LIBRARY.onPack(refreshLocal);
  if (window.YakAfisha && YakAfisha.onPack) YakAfisha.onPack(refreshLocal);
})();
