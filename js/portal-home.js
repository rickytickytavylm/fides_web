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
    { id: 'vat', label: 'Святой Престол', q: 'Папа Ватикан Апостольский Престол' },
    { id: 'world', label: 'Мир', slug: 'news' },
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

  function newsCard(it, i) {
    return (
      '<a class="ncard" href="' + V.articleHref(it) + '">' +
      '<div class="thumb" style="background-image:' + bg(it.image, i) + '"></div>' +
      '<div><div class="rub">' + esc(cat(it)) + '</div>' +
      '<h4>' + esc(it.title) + '</h4>' +
      '<div class="date">' + esc(V.formatDate(it.date)) + '</div></div></a>'
    );
  }

  function loadNews(id) {
    var tab = tabById(id);
    renderTabs(id);
    if (!newsEl) return;
    if (newsCache[id]) { newsEl.innerHTML = newsCache[id].map(newsCard).join(''); return; }
    newsEl.innerHTML = '<p class="ps-status">Загрузка…</p>';
    var opts = { limit: 4, page: 1 };
    if (tab.slug) opts.category = tab.slug;
    if (tab.q) opts.q = tab.q;
    V.getArticles(opts)
      .then(function (pack) {
        var items = (pack.items || []).slice(0, 4);
        newsCache[id] = items;
        newsEl.innerHTML = items.length ? items.map(newsCard).join('') : '<p class="ps-status">Пока пусто</p>';
      })
      .catch(function () { newsEl.innerHTML = '<p class="ps-status">Не удалось загрузить</p>'; });
  }

  /* ---------- Fresh articles ---------- */
  var freshEl = document.getElementById('fresh');
  function loadFresh() {
    if (!freshEl) return;
    V.getArticles({ category: 'columns', limit: 4, page: 1 })
      .then(function (pack) {
        var items = (pack.items || []).slice(0, 4);
        freshEl.innerHTML = items.map(function (it, i) {
          return (
            '<a class="art" href="' + V.articleHref(it) + '">' +
            '<div class="ph" style="background-image:' + bg(it.image, i) + '"></div>' +
            '<div class="in"><div class="rub">' + esc(cat(it)) + '</div>' +
            '<h4>' + esc(it.title) + '</h4>' +
            '<p>' + esc(String(it.excerpt || '').slice(0, 120)) + '</p></div></a>'
          );
        }).join('');
      })
      .catch(function () { freshEl.innerHTML = '<p class="ps-status">Не удалось загрузить статьи</p>'; });
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
})();
