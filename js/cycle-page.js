(function () {
  'use strict';
  var root = document.getElementById('cycle-root');
  var C = window.YakCycles;
  var authors = window.YakAuthors || [];
  if (!root || !C) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var id = new URLSearchParams(location.search).get('id') || '';
  var cycle = C.byId(id);
  if (!cycle) {
    root.innerHTML =
      '<nav class="breadcrumbs in-shell"><a href="index.html">Главная</a><span>/</span><a href="authors.html">Авторы</a><span>/</span><span>Цикл</span></nav>' +
      '<header class="page-head in-shell"><div><h1>Цикл не найден</h1></div></header>' +
      '<p><a class="wlink" href="authors.html">← К авторам</a></p>';
    return;
  }

  var author = authors.filter(function (a) {
    return a.slug === cycle.authorSlug;
  })[0];
  document.title = cycle.title + ' — ЯКатолик';

  var items = (cycle.items || [])
    .map(function (it, idx) {
      var href = it.href || 'article.html?id=' + encodeURIComponent(it.slug);
      return (
        '<a class="cycle-item" href="' +
        esc(href) +
        '">' +
        '<span class="cycle-num">' +
        (idx + 1) +
        '</span>' +
        '<span class="cycle-item-body"><strong>' +
        esc(it.title) +
        '</strong></span></a>'
      );
    })
    .join('');

  root.innerHTML =
    '<nav class="breadcrumbs in-shell">' +
    '<a href="index.html">Главная</a><span>/</span>' +
    '<a href="authors.html">Авторы</a><span>/</span>' +
    (author
      ? '<a href="author.html?slug=' +
        encodeURIComponent(author.slug) +
        '">' +
        esc(author.name) +
        '</a><span>/</span>'
      : '') +
    '<span>Цикл</span></nav>' +
    '<header class="page-head in-shell">' +
    '<div>' +
    '<p class="eyebrow">' +
    esc(cycle.subtitle || 'Цикл публикаций') +
    '</p>' +
    '<h1>' +
    esc(cycle.title) +
    '</h1></div>' +
    '<p class="page-desc">' +
    esc(cycle.intro || '') +
    '</p></header>' +
    '<div class="cycle-meta">' +
    (author
      ? '<a class="author-social" href="author.html?slug=' +
        encodeURIComponent(author.slug) +
        '">' +
        esc(author.name) +
        '</a>'
      : '') +
    (cycle.hubUrl
      ? '<a class="author-social" href="' +
        esc(cycle.hubUrl) +
        '" target="_blank" rel="noopener">Страница цикла на Рускатолик</a>'
      : '') +
    '<span class="author-count">' +
    (cycle.items || []).length +
    ' материалов</span></div>' +
    '<section class="cycle-list"><h2>Содержание цикла</h2>' +
    '<div class="cycle-items">' +
    (items || '<p class="archive-empty">Пока нет материалов</p>') +
    '</div></section>';
})();
