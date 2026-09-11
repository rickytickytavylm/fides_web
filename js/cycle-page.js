(function () {
  'use strict';
  var root = document.getElementById('cycle-root');
  if (!root) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function genitiveFirst(w) {
    if (/ий$/i.test(w)) return w.replace(/ий$/i, 'ия');
    if (/[аео]й$/i.test(w)) return w.replace(/й$/i, 'я');
    if (/а$/i.test(w)) return /[гкхжшщч]$/i.test(w.slice(0, -1)) ? w.slice(0, -1) + 'и' : w.slice(0, -1) + 'ы';
    if (/я$/i.test(w)) return w.slice(0, -1) + 'и';
    if (/ь$/i.test(w)) return w.slice(0, -1) + 'я';
    if (/[бвгджзклмнпрстфхцчшщ]$/i.test(w)) return w + 'а';
    return w;
  }

  function genitiveLast(w) {
    if (/ский$|цкий$/i.test(w)) return w.replace(/ий$/i, 'ого');
    if (/ой$|ый$|ий$/i.test(w)) return w.replace(/(ой|ый|ий)$/i, 'ого');
    if (/ова$|ева$|ина$|ына$/i.test(w)) return w.slice(0, -1) + 'ой';
    if (/ая$/i.test(w)) return w.replace(/ая$/i, 'ой');
    if (/[ое]в$|[иы]н$/i.test(w)) return w + 'а';
    return w;
  }

  function genitiveName(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '';
    if (parts.length === 1) return genitiveLast(parts[0]);
    return parts.map(function (w, i) {
      return i === parts.length - 1 ? genitiveLast(w) : genitiveFirst(w);
    }).join(' ');
  }

  function cycleKicker(cycle, author) {
    var sub = String(cycle.subtitle || '');
    if (author && author.name && (!sub || /^Авторский цикл /i.test(sub))) {
      return 'Авторский цикл ' + genitiveName(author.name);
    }
    return sub || 'Цикл публикаций';
  }

  function paint() {
    var C = window.YakCycles;
    var authors = window.YakAuthors || [];
    if (!C) {
      root.innerHTML = '<p class="archive-empty">Циклы не загрузились.</p>';
      return;
    }
    var id = new URLSearchParams(location.search).get('id') || '';
    var cycle = C.byId(id);
    if (!cycle || (cycle.status && cycle.status !== 'published')) {
      root.innerHTML =
        '<nav class="breadcrumbs in-shell"><a href="index.html">Главная</a><span>/</span><a href="authors.html">Авторы</a><span>/</span><span>Цикл</span></nav>' +
        '<header class="page-head in-shell"><div><h1>Цикл не найден</h1></div></header>' +
        '<p><a class="wlink" href="authors.html">← К авторам</a></p>';
      return;
    }

    if (C.hydrate && cycle.hubSlug && !(cycle.items || []).length && !cycle._hydrated) {
      C.hydrate(cycle).then(paint);
    }

    var author = authors.filter(function (a) {
      return a.slug === cycle.authorSlug;
    })[0];
    document.title = cycle.title + ' — ЯКатолик';

    var items = (cycle.items || [])
      .slice()
      .sort(function (a, b) { return (Number(a.order) || 0) - (Number(b.order) || 0); })
      .map(function (it, idx) {
        var href = it.href || 'article.html?id=' + encodeURIComponent(it.slug);
        return (
          '<a class="cycle-item" href="' +
          esc(href) +
          '">' +
          '<span class="cycle-num">' +
          (it.order || idx + 1) +
          '</span>' +
          '<span class="cycle-item-body"><strong>' +
          esc(it.title) +
          '</strong></span></a>'
        );
      })
      .join('');

    var cover = cycle.cover || cycle.image || '';
    var intro = cycle.introHtml
      ? '<div class="cycle-intro">' + cycle.introHtml + '</div>'
      : (cycle.intro ? '<div class="cycle-intro"><p>' + esc(cycle.intro) + '</p></div>' : '');

    root.innerHTML =
      '<div class="cycle-page">' +
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
      '<header class="cycle-head">' +
      '<p class="eyebrow">' +
      esc(cycleKicker(cycle, author)) +
      '</p>' +
      '<h1>' +
      esc(cycle.title) +
      '</h1>' +
      (author
        ? '<p class="cycle-byline"><a href="author.html?slug=' +
          encodeURIComponent(author.slug) +
          '">' +
          esc(author.name) +
          '</a></p>'
        : '') +
      '</header>' +
      intro +
      (cover
        ? '<figure class="article-hero cycle-hero"><div class="hero-photo" style="--img:url(\'' +
          esc(cover).replace(/'/g, '%27') +
          '\')"></div></figure>'
        : '') +
      '<div class="cycle-meta">' +
      (cycle.hubSlug
        ? '<a class="author-social" href="article.html?id=' +
          encodeURIComponent(cycle.hubSlug) +
          '">Страница цикла</a>'
        : '') +
      '<span class="author-count">' +
      (cycle.items || []).length +
      ' материалов</span></div>' +
      '<section class="cycle-list"><h2>Содержание цикла</h2>' +
      '<div class="cycle-items">' +
      (items || (cycle.hubSlug && !cycle._hydratedDone
        ? '<p class="archive-empty">Загружаем содержание цикла…</p>'
        : '<p class="archive-empty">Пока нет материалов в карточке цикла.' +
        (cycle.id
          ? ' Полный список — на <a href="article.html?id=' + esc(cycle.id) + '">странице цикла</a>.'
          : '') +
        '</p>')) +
      '</div></section></div>';
  }

  paint();
  if (window.YakCycles && YakCycles.ready) YakCycles.ready.then(paint);
})();
