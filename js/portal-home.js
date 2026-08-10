(function () {
  'use strict';
  var V = window.Vera;
  if (!V) return;

  var GRADS = [
    '135deg,#553922,#8a6a3a',
    '135deg,#2f4a6b,#4A7FC9',
    '135deg,#6b5320,#C9A227',
    '135deg,#57663f,#7A8B5A',
    '135deg,#553922,#7F5D36',
    '135deg,#7A8B5A,#57663f',
  ];
  function grad(i) { return 'linear-gradient(' + GRADS[i % GRADS.length] + ')'; }
  function bg(img, i) {
    if (img) return "url('" + String(img).replace(/'/g, '%27') + "')";
    return grad(i);
  }
  function cat(item) { return (item.categories && item.categories[0]) || 'Материал'; }
  var esc = V.escapeHtml;

  function isCompactHome() {
    try { return window.matchMedia('(max-width: 880px)').matches; }
    catch (e) { return false; }
  }

  function skNcardRow() {
    return (
      '<article class="ncard"><div class="thumb sk"></div><div class="ncard-body">' +
      '<div class="sk sk-line" style="width:40%;height:10px;margin-bottom:8px"></div>' +
      '<div class="sk sk-line" style="width:90%;height:16px"></div></div></article>'
    );
  }

  function skNcards() {
    if (isCompactHome()) {
      return '<div class="news-list">' + skNcardRow() + skNcardRow() + skNcardRow() + skNcardRow() + '</div>';
    }
    return (
      '<div class="news-pack">' +
      '<article class="ncard ncard--lead"><div class="thumb sk"></div><div class="ncard-body">' +
      '<div class="sk sk-line" style="width:28%;height:10px;margin-bottom:12px"></div>' +
      '<div class="sk sk-line" style="width:92%;height:22px;margin-bottom:8px"></div>' +
      '<div class="sk sk-line" style="width:70%;height:22px"></div></div></article>' +
      '<div class="news-side">' + skNcardRow() + skNcardRow() + skNcardRow() + '</div></div>'
    );
  }
  function skArts(n) {
    var s = '';
    for (var i = 0; i < n; i++) {
      s += '<div class="art"><div class="ph sk"></div><div class="in">' +
        '<div class="sk sk-line" style="width:35%;height:10px;margin-bottom:9px"></div>' +
        '<div class="sk sk-line" style="width:95%;height:16px;margin-bottom:7px"></div>' +
        '<div class="sk sk-line" style="width:80%;height:12px"></div></div></div>';
    }
    return s;
  }

  /* ---------- Hero slider ---------- */
  var heroEl = document.getElementById('hero');
  var dotsEl = document.getElementById('dots');
  var sideEl = document.getElementById('hero-side');
  var slideTimer = null;

  function preload(url) {
    if (!url) return;
    var img = new Image();
    try { img.decoding = 'async'; } catch (e) {}
    img.src = url;
  }

  function buildHero(items) {
    if (!heroEl) return;
    var slides = items.slice(0, 3);
    var minis = items.slice(3, 7);

    // Предзагружаем картинки героя, чтобы не подвисали/не мигали при переходах
    slides.forEach(function (it) { preload(it.image); });

    var slidesHtml = slides.map(function (it, i) {
      return (
        '<a class="hero-slide' + (i === 0 ? ' active' : '') + '" href="' + V.articleHref(it) + '" ' +
        'style="background-image:' + bg(it.image, i) + '">' +
        '<div class="hero-cap"><span class="rub">' + esc(cat(it)) + '</span>' +
        '<h3>' + esc(it.title) + '</h3></div></a>'
      );
    }).join('');
    heroEl.insertAdjacentHTML('afterbegin', slidesHtml);

    if (sideEl) {
      sideEl.innerHTML = minis.map(function (it, i) {
        preload(it.image);
        return (
          '<a class="mini" href="' + V.articleHref(it) + '">' +
          '<div class="thumb" style="background-image:' + bg(it.image, i + 3) + '"></div>' +
          '<div><div class="rub">' + esc(cat(it)) + '</div>' +
          '<h4>' + esc(it.title) + '</h4></div></a>'
        );
      }).join('');
    }

    initSlider();
  }

  function initSlider() {
    var slides = [].slice.call(heroEl.querySelectorAll('.hero-slide'));
    if (slides.length < 2) { if (dotsEl) dotsEl.innerHTML = ''; return; }
    if (dotsEl) dotsEl.innerHTML = '';
    var idx = 0;

    if (dotsEl) {
      slides.forEach(function (_, i) {
        var b = document.createElement('button');
        b.type = 'button';
        if (i === 0) b.className = 'on';
        b.setAttribute('aria-label', 'Слайд ' + (i + 1));
        b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); go(i); reset(); });
        dotsEl.appendChild(b);
      });
    }

    function go(n) {
      n = (n + slides.length) % slides.length;
      slides[idx].classList.remove('active');
      if (dotsEl && dotsEl.children[idx]) dotsEl.children[idx].classList.remove('on');
      idx = n;
      slides[idx].classList.add('active');
      if (dotsEl && dotsEl.children[idx]) dotsEl.children[idx].classList.add('on');
    }

    var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    function reset() {
      if (slideTimer) clearInterval(slideTimer);
      if (!reduce) slideTimer = setInterval(function () { go(idx + 1); }, 5000);
    }

    // Свайп-переключение на самом герое
    var startX = null, startY = null, swiping = false;
    heroEl.addEventListener('touchstart', function (e) {
      var t = e.touches[0];
      startX = t.clientX; startY = t.clientY; swiping = false;
    }, { passive: true });
    heroEl.addEventListener('touchmove', function (e) {
      if (startX == null) return;
      var t = e.touches[0];
      if (Math.abs(t.clientX - startX) > 10 && Math.abs(t.clientX - startX) > Math.abs(t.clientY - startY)) {
        swiping = true;
      }
    }, { passive: true });
    heroEl.addEventListener('touchend', function (e) {
      if (startX == null) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - startX, dy = t.clientY - startY;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
        go(idx + (dx < 0 ? 1 : -1));
        reset();
      }
      startX = startY = null;
    }, { passive: true });
    // Если был свайп — не даём ссылке открыться
    heroEl.addEventListener('click', function (e) {
      if (swiping) { e.preventDefault(); e.stopPropagation(); swiping = false; }
    }, true);

    reset();
  }

  /* ---------- News tabs ---------- */
  var NEWS_TABS = [
    { id: 'ru', label: 'Россия', slug: 'church-rus' },
    { id: 'vat', label: 'Святой Престол', slug: 'santa-sede' },
    { id: 'world', label: 'Новости', slug: 'news' },
  ];
  var tabsEl = document.getElementById('news-tabs');
  var newsEl = document.getElementById('news');
  var newsCache = {};

  function tabById(id) {
    for (var i = 0; i < NEWS_TABS.length; i++) if (NEWS_TABS[i].id === id) return NEWS_TABS[i];
    return NEWS_TABS[0];
  }

  function renderTabs(active) {
    if (!tabsEl) return;
    tabsEl.innerHTML = NEWS_TABS.map(function (t) {
      return '<button' + (t.id === active ? ' class="on"' : '') + ' data-id="' + t.id + '">' + esc(t.label) + '</button>';
    }).join('');
    tabsEl.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { loadNews(b.getAttribute('data-id')); });
    });
  }

  function newsCard(it, i, lead) {
    var excerpt = lead
      ? '<p class="ncard-excerpt">' + esc(String(it.excerpt || '').replace(/\s+/g, ' ').trim().slice(0, 160)) + '</p>'
      : '';
    return (
      '<a class="ncard' + (lead ? ' ncard--lead' : '') + '" href="' + V.articleHref(it) + '">' +
      '<div class="thumb" style="background-image:' + bg(it.image, i) + '" role="img" aria-label=""></div>' +
      '<div class="ncard-body"><div class="rub">' + esc(cat(it)) + '</div>' +
      '<h4>' + esc(it.title) + '</h4>' +
      excerpt +
      '<div class="date">' + esc(V.formatDate(it.date)) + '</div></div></a>'
    );
  }

  /* Коллажи/плохой cover — не ставим в lead-пакет новостей */
  var WEAK_NEWS_LEAD = {
    'nadezda-francisk': 1,
    '41900': 1,
  };

  function isWeakNewsLead(it) {
    if (!it) return true;
    if (WEAK_NEWS_LEAD[String(it.slug || '')] || WEAK_NEWS_LEAD[String(it.id || '')]) return true;
    if (!it.image) return true;
    return false;
  }

  function pickNewsPack(items) {
    var list = (items || []).slice();
    if (!list.length) return { lead: null, rest: [] };
    var leadIdx = 0;
    for (var i = 0; i < list.length; i++) {
      if (!isWeakNewsLead(list[i])) { leadIdx = i; break; }
    }
    var lead = list[leadIdx];
    var rest = list.filter(function (_it, i) { return i !== leadIdx; }).slice(0, 5);
    return { lead: lead, rest: rest };
  }

  function renderNewsList(items) {
    var list = (items || []).slice(0, 4);
    if (!list.length) return '<p class="ps-status">Пока пусто</p>';
    return (
      '<div class="news-list">' +
      list.map(function (it, i) { return newsCard(it, i, false); }).join('') +
      '</div>'
    );
  }

  function renderNewsPack(items) {
    /* На мобе — только ровный список, без доминантного lead */
    if (isCompactHome()) return renderNewsList(items);
    var pack = pickNewsPack(items);
    if (!pack.lead) return '<p class="ps-status">Пока пусто</p>';
    return (
      '<div class="news-pack">' +
      newsCard(pack.lead, 0, true) +
      '<div class="news-side">' +
      pack.rest.map(function (it, i) { return newsCard(it, i + 1, false); }).join('') +
      '</div></div>'
    );
  }

  function loadNews(id) {
    var tab = tabById(id);
    renderTabs(id);
    if (!newsEl) return;
    if (newsCache[id]) { newsEl.innerHTML = renderNewsPack(newsCache[id]); return; }
    newsEl.innerHTML = skNcards();
    var opts = { limit: 12, page: 1 };
    if (tab.slug) opts.category = tab.slug;
    if (tab.q) opts.q = tab.q;
    V.getArticles(opts)
      .then(function (pack) {
        var items = pack.items || [];
        newsCache[id] = items;
        newsEl.innerHTML = renderNewsPack(items);
      })
      .catch(function () { newsEl.innerHTML = '<p class="ps-status">Не удалось загрузить</p>'; });
  }

  /* ---------- Fresh articles ---------- */
  function artCard(it, i) {
    return (
      '<a class="art" href="' + V.articleHref(it) + '">' +
      '<div class="ph" style="background-image:' + bg(it.image, i) + '"></div>' +
      '<div class="in"><div class="rub">' + esc(cat(it)) + '</div>' +
      '<h4>' + esc(it.title) + '</h4>' +
      '<p>' + esc(String(it.excerpt || '').slice(0, 120)) + '</p></div></a>'
    );
  }

  function renderFreshHome(items) {
    if (!items.length) return '<p class="ps-status">Пока пусто</p>';
    if (isCompactHome()) return renderNewsList(items);
    var lead = items[0];
    var rest = items.slice(1, 7);
    return (
      '<div class="fresh-home">' +
      newsCard(lead, 0, true) +
      '<div class="fresh-home-row">' +
      rest.map(function (it, i) {
        return (
          '<a class="art art--tile" href="' + V.articleHref(it) + '">' +
          '<div class="ph" style="background-image:' + bg(it.image, i + 1) + '"></div>' +
          '<div class="in"><div class="rub">' + esc(cat(it)) + '</div>' +
          '<h4>' + esc(it.title) + '</h4>' +
          '<div class="date">' + esc(V.formatDate(it.date)) + '</div></div></a>'
        );
      }).join('') +
      '</div></div>'
    );
  }

  function skFreshHome() {
    if (isCompactHome()) return skNcards();
    return (
      '<div class="fresh-home">' +
      '<article class="ncard ncard--lead"><div class="thumb sk"></div><div class="ncard-body">' +
      '<div class="sk sk-line" style="width:28%;height:10px;margin-bottom:12px"></div>' +
      '<div class="sk sk-line" style="width:88%;height:22px"></div></div></article>' +
      '<div class="fresh-home-row">' + skArts(3) + '</div></div>'
    );
  }

  var freshEl = document.getElementById('fresh');
  function loadFresh() {
    if (!freshEl) return;
    freshEl.innerHTML = skFreshHome();
    V.getArticles({ category: 'columns', limit: 7, page: 1 })
      .then(function (pack) {
        freshEl.innerHTML = renderFreshHome((pack.items || []).slice(0, 7));
      })
      .catch(function () { freshEl.innerHTML = '<p class="ps-status">Не удалось загрузить статьи</p>'; });
  }

  /* ---------- Голоса: Интервью / Свидетельства ---------- */
  var VOICES_TABS = [
    { id: 'interview', label: 'Интервью', slug: 'interview' },
    { id: 'svidetelstva', label: 'Свидетельства', slug: 'svidetelstva' },
    { id: 'propovedi', label: 'Проповеди', slug: 'propovedi' },
  ];
  var voicesTabsEl = document.getElementById('voices-tabs');
  var voicesEl = document.getElementById('voices');
  var voicesCache = {};

  function renderVoicesTabs(active) {
    if (!voicesTabsEl) return;
    voicesTabsEl.innerHTML = VOICES_TABS.map(function (t) {
      return '<button' + (t.id === active ? ' class="on"' : '') + ' data-id="' + t.id + '">' + esc(t.label) + '</button>';
    }).join('');
    voicesTabsEl.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { loadVoices(b.getAttribute('data-id')); });
    });
  }

  function loadVoices(id) {
    var tab = VOICES_TABS.filter(function (t) { return t.id === id; })[0] || VOICES_TABS[0];
    renderVoicesTabs(tab.id);
    if (!voicesEl) return;
    if (voicesCache[tab.id]) { voicesEl.innerHTML = renderNewsPack(voicesCache[tab.id]); return; }
    voicesEl.innerHTML = skNcards();
    V.getArticles({ category: tab.slug, limit: 12, page: 1 })
      .then(function (pack) {
        var items = pack.items || [];
        voicesCache[tab.id] = items;
        voicesEl.innerHTML = renderNewsPack(items);
      })
      .catch(function () { voicesEl.innerHTML = '<p class="ps-status">Не удалось загрузить</p>'; });
  }

  /* ---------- Home: Афиша + Библиотека ---------- */
  function shortDay(iso) {
    if (!iso) return '';
    var p = String(iso).slice(0, 10).split('-');
    var months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    return Number(p[2]) + ' ' + (months[Number(p[1]) - 1] || '');
  }

  function renderHomeEvents() {
    var el = document.getElementById('home-events');
    if (!el || !window.YakCalendar) return;
    var list = (YakCalendar.upcomingEvents() || []).slice(0, 3);
    if (!list.length) {
      el.innerHTML = '<p class="home-panel-empty">Скоро появятся события</p>';
      return;
    }
    el.innerHTML = list.map(function (e) {
      var meta = [e.city || e.place, e.time].filter(Boolean).join(' · ');
      return (
        '<a class="home-event" href="' + esc(e.href || 'events.html') + '">' +
        '<span class="home-event-date"><b>' + esc(shortDay(e.date)) + '</b></span>' +
        '<span class="home-event-body"><strong>' + esc(e.title) + '</strong>' +
        (meta ? '<small>' + esc(meta) + '</small>' : '') +
        '</span></a>'
      );
    }).join('');
  }

  function renderHomeLibrary() {
    var el = document.getElementById('home-library');
    var L = window.YAK_LIBRARY;
    if (!el || !L) return;
    var items = (L.ITEMS || []).slice().sort(function (a, b) {
      return L.popularityScore(b) - L.popularityScore(a);
    }).slice(0, 4);
    if (!items.length) {
      el.innerHTML = '<p class="home-panel-empty">Раздел скоро откроется</p>';
      return;
    }
    el.innerHTML = items.map(function (it) {
      var title = L.displayTitle(it);
      var tone = it.coverTone || '#5c5346';
      return (
        '<a class="home-lib-card" href="book.html?id=' + encodeURIComponent(it.id) + '" title="' + esc(title) + '">' +
        '<span class="home-lib-cover" style="background:linear-gradient(160deg,' + esc(tone) + ',#1a1816)">' +
        '<em>' + esc(String(title).slice(0, 28)) + '</em></span>' +
        '<span class="home-lib-meta"><strong>' + esc(title) + '</strong>' +
        '<small>' + esc(it.author || L.categoryLabel(it)) + '</small></span></a>'
      );
    }).join('');
  }

  function renderAsideDay() {
    var dateEl = document.getElementById('aside-day-date');
    var saintEl = document.getElementById('aside-day-saint');
    var readEl = document.getElementById('aside-day-read');
    if (!dateEl || !window.YakCalendar) return;
    var iso = YakCalendar.todayIso();
    var day = YakCalendar.byDate(iso) || (YakCalendar.DAYS && YakCalendar.DAYS[0]);
    if (!day) {
      dateEl.textContent = iso;
      if (saintEl) saintEl.textContent = 'Откройте календарь';
      return;
    }
    var L = day.liturgical || {};
    dateEl.textContent = (day.weekday || '') + (day.label ? ' · ' + day.label : '');
    if (saintEl) saintEl.textContent = L.saint || L.title || day.title || 'День Церкви';
    if (readEl) {
      var reading = L.reading || L.gospel || L.readings || '';
      readEl.textContent = reading
        ? String(reading).slice(0, 140)
        : (L.category ? String(L.category) : '');
    }
  }

  function renderHomePhotos() {
    var el = document.getElementById('home-photos');
    if (!el) return;
    V.getArticles({ limit: 8, page: 1 })
      .then(function (pack) {
        var items = (pack.items || []).filter(function (it) { return !!it.image; }).slice(0, 4);
        if (!items.length) {
          el.innerHTML = '<p class="home-panel-empty">Скоро появятся фото</p>';
          return;
        }
        el.innerHTML = items.map(function (it, i) {
          return (
            '<a class="home-photo-tile" href="photostock.html" style="background-image:' +
            bg(it.image, i) + '" aria-label="' + esc(it.title || 'Фото') + '"></a>'
          );
        }).join('');
      })
      .catch(function () {
        el.innerHTML = '<p class="home-panel-empty">Фотосток откроется позже</p>';
      });
  }

  /* ---------- Boot ---------- */
  V.getArticles({ limit: 12, page: 1 })
    .then(function (pack) { buildHero(pack.items || []); })
    .catch(function () {
      if (heroEl) heroEl.insertAdjacentHTML('afterbegin',
        '<div class="hero-cap"><h3 style="color:#fff">Не удалось загрузить архив</h3></div>');
    });

  loadNews('ru');
  loadFresh();
  if (voicesEl) loadVoices('interview');
  if (typeof window.renderHomeAuthors === 'function') {
    window.renderHomeAuthors(document.getElementById('authors-home'), 6);
  }
  renderAsideDay();
  renderHomeEvents();
  renderHomeLibrary();
  renderHomePhotos();
})();
