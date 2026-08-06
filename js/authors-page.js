(function () {
  'use strict';
  var V = window.Vera;
  var authors = window.YakAuthors || [];
  if (!authors.length) return;

  function esc(s) {
    return V ? V.escapeHtml(s) : String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function strip(html) {
    if (V && V.stripTags) return V.stripTags(html).slice(0, 160);
    return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
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

  function avatar(a) {
    if (a.photo) {
      return '<span class="author-ava" style="background-image:url(\'' + esc(a.photo) + '\')"></span>';
    }
    return '<span class="author-ava initials">' + esc(initials(a.name)) + '</span>';
  }

  /* ---------- Catalog ---------- */
  var grid = document.getElementById('authors-grid');
  if (grid) {
    var qEl = document.getElementById('authors-q');
    var sortEl = document.getElementById('authors-sort');
    var sort = 'recent';

    function sortedFiltered() {
      var q = (qEl && qEl.value ? qEl.value : '').trim().toLowerCase();
      var list = authors.filter(function (a) {
        if (!q) return true;
        return (a.name || '').toLowerCase().indexOf(q) !== -1;
      });
      list = list.slice();
      if (sort === 'alpha') {
        list.sort(function (a, b) { return a.name.localeCompare(b.name, 'ru'); });
      } else if (sort === 'count') {
        list.sort(function (a, b) { return (b.count || 0) - (a.count || 0); });
      } else {
        list.sort(function (a, b) { return String(b.latestDate || '').localeCompare(String(a.latestDate || '')); });
      }
      return list;
    }

    function render() {
      var list = sortedFiltered();
      if (!list.length) {
        grid.innerHTML = '<p class="archive-empty">Никого не найдено</p>';
        return;
      }
      grid.innerHTML = list.map(function (a) {
        return (
          '<a class="author-card" href="author.html?slug=' + encodeURIComponent(a.slug) + '">' +
          avatar(a) +
          '<span class="author-card-body">' +
          '<strong>' + esc(a.name) + '</strong>' +
          '<span class="author-role">' + esc(a.role || '') + '</span>' +
          '<span class="author-count">' + esc(String(a.count || 0)) + ' материалов</span>' +
          '</span></a>'
        );
      }).join('');
    }

    if (qEl) qEl.addEventListener('input', render);
    if (sortEl) {
      sortEl.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-sort]');
        if (!btn) return;
        sort = btn.getAttribute('data-sort');
        Array.prototype.forEach.call(sortEl.querySelectorAll('button'), function (b) {
          b.classList.toggle('on', b === btn);
        });
        render();
      });
    }
    render();
  }

  /* ---------- Author profile ---------- */
  var root = document.getElementById('author-root');
  if (root) {
    var slug = new URLSearchParams(location.search).get('slug') || '';
    var a = authors.filter(function (x) { return x.slug === slug; })[0];
    if (!a) {
      root.innerHTML =
        '<nav class="breadcrumbs in-shell"><a href="index.html">Главная</a><span>/</span><a href="authors.html">Авторы</a><span>/</span><span>Не найден</span></nav>' +
        '<header class="page-head in-shell"><div><h1>Автор не найден</h1></div></header>' +
        '<p><a class="wlink" href="authors.html">← К каталогу</a></p>';
      return;
    }
    document.title = a.name + ' — ЯКатолик';
    var socials = (a.socials || []).map(function (s) {
      return '<a class="author-social" href="' + esc(s.href) + '" target="_blank" rel="noopener">' + esc(s.label) + '</a>';
    }).join('');
    var feed = (a.recent || []).map(function (p) {
      var href = 'article.html?id=' + encodeURIComponent(p.slug);
      return (
        '<a class="author-pub" href="' + href + '">' +
        '<time>' + esc(V ? V.formatDate(p.date) : p.date) + '</time>' +
        '<strong>' + esc(strip(p.title)) + '</strong>' +
        '<span>' + esc(strip(p.excerpt)) + '</span></a>'
      );
    }).join('');

    root.innerHTML =
      '<nav class="breadcrumbs in-shell">' +
      '<a href="index.html">Главная</a><span>/</span><a href="authors.html">Авторы</a><span>/</span><span>' + esc(a.name) + '</span></nav>' +
      '<section class="author-head">' +
      avatar(a) +
      '<div class="author-head-body">' +
      '<p class="eyebrow">' + esc(a.role || 'Автор') + '</p>' +
      '<h1>' + esc(a.name) + '</h1>' +
      '<p class="author-bio">' + esc(a.bio || '') + '</p>' +
      (socials ? '<div class="author-socials">' + socials + '</div>' : '') +
      '<div class="author-stats"><span><b>' + esc(String(a.count || 0)) + '</b> статей</span>' +
      '<span><b>' + esc(String((a.recent || []).length)) + '</b> в ленте</span></div>' +
      '</div></section>' +
      '<section class="guide-feed"><h2>Все публикации автора</h2>' +
      '<div class="author-pubs">' + (feed || '<p class="archive-empty">Пока нет материалов</p>') + '</div></section>';
  }

  /* ---------- Home block helper ---------- */
  window.renderHomeAuthors = function (el, limit) {
    if (!el) return;
    var list = authors.slice().sort(function (a, b) {
      return String(b.latestDate || '').localeCompare(String(a.latestDate || ''));
    }).slice(0, limit || 5);
    el.innerHTML = list.map(function (a) {
      return (
        '<a class="author-row" href="author.html?slug=' + encodeURIComponent(a.slug) + '">' +
        avatar(a) +
        '<span><strong>' + esc(a.name) + '</strong>' +
        '<small>' + esc(String(a.count || 0)) + ' публикаций</small></span></a>'
      );
    }).join('');
  };
})();
