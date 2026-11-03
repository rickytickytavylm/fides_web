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
  var filter = 'all';
  var last = { q: '', items: [], books: [], authors: [], events: [], total: 0 };

  var SUGGESTS = [
    'Папа',
    'Месса',
    'исповедь',
    'Лаудато',
    'приход',
    'пост',
    'святые',
    'календарь'
  ];

  var PLACES = [
    { href: 'articles.html', kicker: 'Читать', title: 'Статьи', desc: 'Колонки, темы, вопрос — ответ' },
    { href: 'archive.html?category=news', kicker: 'Сейчас', title: 'Новости', desc: 'Россия, мир, Святой Престол' },
    { href: 'library.html', kicker: 'Книги', title: 'Библиотека', desc: 'Документы Церкви и издания' },
    { href: 'authors.html', kicker: 'Люди', title: 'Авторы', desc: 'Кто пишет на портале' },
    { href: 'events.html', kicker: 'Когда', title: 'Афиша', desc: 'Встречи и богослужения' },
    { href: 'video.html', kicker: 'Смотреть', title: 'Видео', desc: 'Каналы и записи' }
  ];

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

  function excerptOf(item) {
    var raw = (item && item.excerpt) || '';
    var text = V.stripTags ? V.stripTags(raw) : String(raw).replace(/<[^>]+>/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    if (text.length > 168) text = text.slice(0, 165).replace(/\s+\S*$/, '') + '…';
    return text;
  }

  function rubricOf(item) {
    var sec = V.sectionOf ? V.sectionOf(item) : { label: 'Материал' };
    return (V.categoryLine && V.categoryLine(item, sec.label || 'Материал')) || sec.label;
  }

  function authorLine(item) {
    if (window.YakAuthorLink && YakAuthorLink.displayName) {
      return YakAuthorLink.displayName(item) || '';
    }
    var a = (item && item.author ? String(item.author) : '').trim();
    var low = a.toLowerCase();
    if (!a || low === 'ruscatholic' || low === 'admin' || low === 'супер-админ' || low === 'редакция') return '';
    return a;
  }

  function materialRow(item) {
    var href = V.articleHref(item);
    var cover = V.coverStyle ? V.coverStyle(item.image) : '';
    var who = authorLine(item);
    var excerpt = excerptOf(item);
    return (
      '<article class="feed-item">' +
      '<a class="feed-thumb" href="' + href + '" ' + cover + ' aria-label="Открыть"></a>' +
      '<div class="feed-body">' +
      '<p class="story-meta"><span>' + V.escapeHtml(rubricOf(item)) + '</span><time>' +
      V.escapeHtml(V.formatDate(item.date)) +
      '</time></p>' +
      '<h3><a href="' + href + '">' + V.escapeHtml(item.title || '') + '</a></h3>' +
      (who ? '<p class="feed-author">' + V.escapeHtml(who) + '</p>' : '') +
      (excerpt ? '<p class="search-excerpt">' + V.escapeHtml(excerpt) + '</p>' : '') +
      '</div></article>'
    );
  }

  function leadRow(item) {
    var href = V.articleHref(item);
    var cover = V.coverStyle ? V.coverStyle(item.image) : '';
    var who = authorLine(item);
    var excerpt = excerptOf(item);
    return (
      '<article class="lead-item">' +
      '<a class="card-image" href="' + href + '" ' + cover + ' aria-label="Открыть"></a>' +
      '<div class="lead-copy">' +
      '<p class="story-meta"><span>' + V.escapeHtml(rubricOf(item)) + '</span><time>' +
      V.escapeHtml(V.formatDate(item.date)) +
      '</time></p>' +
      '<h2><a href="' + href + '">' + V.escapeHtml(item.title || '') + '</a></h2>' +
      (who ? '<p class="feed-author">' + V.escapeHtml(who) + '</p>' : '') +
      (excerpt ? '<p>' + V.escapeHtml(excerpt) + '</p>' : '') +
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
    filter = 'all';
    if (hint) hint.textContent = 'Статьи, новости, библиотека, авторы и афиша';
    if (countEl) countEl.textContent = '';
    box.innerHTML =
      '<div class="search-idle">' +
      '<section class="search-suggest">' +
      '<h2>Можно начать с этого</h2>' +
      '<div class="chips">' +
      SUGGESTS.map(function (q) {
        return '<button type="button" class="chip" data-q="' + V.escapeHtml(q) + '">' + V.escapeHtml(q) + '</button>';
      }).join('') +
      '</div></section>' +
      '<section class="search-places">' +
      '<h2>Или откройте раздел</h2>' +
      '<div class="search-place-grid">' +
      PLACES.map(function (p) {
        return (
          '<a class="search-place" href="' + p.href + '">' +
          '<span class="lib-hub-kicker">' + V.escapeHtml(p.kicker) + '</span>' +
          '<strong>' + V.escapeHtml(p.title) + '</strong>' +
          '<span>' + V.escapeHtml(p.desc) + '</span></a>'
        );
      }).join('') +
      '</div></section></div>';
  }

  function filterBar(pack) {
    var tabs = [{ id: 'all', label: 'Все', n: pack.total }];
    if (pack.items.length) tabs.push({ id: 'materials', label: 'Материалы', n: pack.items.length });
    if (pack.books.length) tabs.push({ id: 'books', label: 'Библиотека', n: pack.books.length });
    if (pack.authors.length) tabs.push({ id: 'authors', label: 'Авторы', n: pack.authors.length });
    if (pack.events.length) tabs.push({ id: 'events', label: 'Афиша', n: pack.events.length });
    if (tabs.length < 3) return '';
    return (
      '<div class="chips search-filters" role="tablist">' +
      tabs.map(function (t) {
        return (
          '<button type="button" class="chip' + (filter === t.id ? ' active' : '') +
          '" data-filter="' + t.id + '">' + V.escapeHtml(t.label) + '</button>'
        );
      }).join('') +
      '</div>'
    );
  }

  function visibleCount(pack) {
    if (filter === 'materials') return pack.apiTotal || pack.items.length;
    if (filter === 'books') return pack.books.length;
    if (filter === 'authors') return pack.authors.length;
    if (filter === 'events') return pack.events.length;
    return pack.total;
  }

  function paintResults() {
    var pack = last;
    var q = pack.q;
    var L = window.YAK_LIBRARY;
    var A = window.YakAfisha;
    var showMat = filter === 'all' || filter === 'materials';
    var showBooks = filter === 'all' || filter === 'books';
    var showAuthors = filter === 'all' || filter === 'authors';
    var showEvents = filter === 'all' || filter === 'events';
    var n = visibleCount(pack);

    if (hint) hint.textContent = 'По всему порталу';
    if (countEl) {
      countEl.textContent = n ? n.toLocaleString('ru-RU') + ' совпадений' : '';
    }

    if (!pack.total) {
      box.innerHTML =
        '<p class="archive-empty">Ничего не найдено. Попробуйте короче или без кавычек.</p>';
      return;
    }

    var items = pack.items;
    var lead = '';
    var rest = items;
    if (showMat && items.length && filter !== 'books' && filter !== 'authors' && filter !== 'events') {
      lead = leadRow(items[0]);
      rest = items.slice(1);
    }

    box.innerHTML =
      filterBar(pack) +
      (showMat ? lead : '') +
      (showMat ? group(lead ? 'Ещё материалы' : 'Материалы', rest.map(materialRow).join('')) : '') +
      (showBooks ? group('Библиотека', pack.books.map(function (it) { return bookRow(it, L); }).join(''), 'search-side') : '') +
      (showAuthors ? group('Авторы', pack.authors.map(authorRow).join(''), 'search-side') : '') +
      (showEvents ? group('Афиша', pack.events.map(function (e) { return eventRow(e, A); }).join(''), 'search-side') : '');
  }

  function remember(q, pack) {
    var items = (pack.items || []).slice();
    items.sort(function (a, b) {
      return titleRank(a.title, q) - titleRank(b.title, q);
    });
    var qn = norm(q);
    last = {
      q: q,
      items: items,
      books: localBooks(qn),
      authors: localAuthors(qn),
      events: localEvents(qn),
      apiTotal: Number(pack.total) || items.length,
      total: 0
    };
    last.total = last.apiTotal + last.books.length + last.authors.length + last.events.length;
  }

  function paintWait() {
    box.innerHTML = V.skeletonRows ? V.skeletonRows(4, 88) : '<p class="search-idle">Ищем…</p>';
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
        remember(q, pack || { items: [], total: 0 });
        if (filter !== 'all' && visibleCount(last) === 0) filter = 'all';
        paintResults();
      })
      .catch(function () {
        if (my !== seq) return;
        remember(q, { items: [], total: 0 });
        if (last.total) {
          paintResults();
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

  box.addEventListener('click', function (e) {
    var chip = e.target.closest('[data-q]');
    if (chip) {
      e.preventDefault();
      var q = chip.getAttribute('data-q') || '';
      if (input) input.value = q;
      run(q, false);
      return;
    }
    var tab = e.target.closest('[data-filter]');
    if (tab) {
      e.preventDefault();
      filter = tab.getAttribute('data-filter') || 'all';
      paintResults();
    }
  });

  run(start, false);

  function refreshLocal() {
    if (input && cleanQuery(input.value).length >= 2) run(input.value, true);
  }
  if (window.YakAuthorsOnPack) window.YakAuthorsOnPack(refreshLocal);
  if (window.YAK_LIBRARY && YAK_LIBRARY.onPack) YAK_LIBRARY.onPack(refreshLocal);
  if (window.YakAfisha && YakAfisha.onPack) YakAfisha.onPack(refreshLocal);
})();
