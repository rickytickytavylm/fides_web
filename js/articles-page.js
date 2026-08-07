/**
 * Хаб раздела «Статьи»: рубрикатор, темы, вопрос-ответ, идеи.
 */
(function () {
  'use strict';

  var V = window.Vera;
  var root = document.getElementById('articles-root');
  if (!root || !V) return;

  function esc(s) {
    return V.escapeHtml ? V.escapeHtml(s) : String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function hrefFor(item) {
    if (item.href) return item.href;
    if (item.q) return 'archive.html?q=' + encodeURIComponent(item.q);
    return 'archive.html?category=' + encodeURIComponent(item.slug || 'columns');
  }

  var RUBRICS = [
    { slug: 'spirituality', title: 'Духовность', tone: 'a', image: 'assets/cards/articles-spirituality.webp' },
    { slug: 'obraz-zhizni', title: 'Образ жизни', tone: 'b', image: 'assets/cards/articles-lifestyle.webp' },
    { slug: 'kultura', title: 'Культура', tone: 'c', image: 'assets/cards/articles-culture.webp' },
    { slug: 'history', title: 'История', tone: 'd', image: 'assets/cards/articles-history.webp' },
    { slug: 'biografii', title: 'Биографии', tone: 'a', image: 'assets/cards/articles-biographies.webp' },
    { slug: 'saints', title: 'Святые', tone: 'b', image: 'assets/cards/articles-saints.webp' },
    { slug: 'bible', title: 'Библеистика', tone: 'c', image: 'assets/cards/articles-biblical-studies.webp' },
    { slug: 'liturgy', title: 'Литургика', tone: 'd', image: 'assets/cards/articles-liturgy.webp' },
    { slug: 'puteshestviya', title: 'Путешествия', tone: 'e', wide: true, image: 'assets/cards/articles-travel.webp' },
  ];

  // Темы: где тега ещё нет — временный поиск q (см. HANDOFF §6)
  var TOPICS = [
    { title: 'Искусственный интеллект', q: 'искусственный интеллект' },
    { title: 'Теология тела', slug: 'theology-of-the-body' },
    { title: 'Мифы и правда о Католической Церкви', slug: 'pravda' },
    { title: 'Забота об общем доме', q: 'Laudato' },
    { title: 'Экуменический диалог', q: 'экуменический' },
  ];

  var QA = [
    { title: 'Вопросы священнику', slug: 'ask-priest', tone: 'a', image: 'assets/cards/articles-ask-priest.webp' },
    { title: 'Вопросы психологу', slug: 'psiholog', tone: 'b', image: 'assets/cards/articles-ask-psychologist.webp' },
  ];

  var IDEAS = [
    { title: 'Это интересно', slug: 'eto-interesno', tone: 'c', image: 'assets/cards/articles-interesting.webp' },
    { title: 'Кино со смыслом', slug: 'kino-so-smyislom', tone: 'd', image: 'assets/cards/articles-meaningful-cinema.webp' },
    { title: 'Католическая кухня', slug: 'cook', tone: 'e', image: 'assets/cards/articles-catholic-kitchen.webp' },
  ];

  var VOICES = [
    { title: 'Интервью', slug: 'interview', image: 'assets/cards/articles-interviews.webp' },
    { title: 'Свидетельства', slug: 'svidetelstva', image: 'assets/cards/articles-testimonies.webp' },
    { title: 'Проповеди', slug: 'propovedi', image: 'assets/cards/articles-sermons.webp' },
  ];

  function toneClass(item, i) {
    var classes = item.wide
      ? 'route-card wide tone-' + (item.tone || 'wide')
      : 'route-card tone-' + (item.tone || 'abcd'[i % 4]);
    return classes + (item.image ? ' has-image' : '');
  }

  function cardGrid(items, kicker) {
    var html = '<div class="route-grid">';
    items.forEach(function (item, i) {
      var imageStyle = item.image
        ? ' style="--card-image:url(\'' + esc(item.image) + '\')"'
        : '';
      html +=
        '<a class="' + toneClass(item, i) + '"' + imageStyle + ' href="' + esc(hrefFor(item)) + '">' +
        '<span class="route-kicker">' + esc(kicker || 'Открыть') + '</span>' +
        '<strong>' + esc(item.title) + '</strong>' +
        (item.note ? '<span class="route-sub">' + esc(item.note) + '</span>' : '') +
        '</a>';
    });
    return html + '</div>';
  }

  function linkList(items) {
    var html = '<ul class="articles-link-list">';
    items.forEach(function (item) {
      html +=
        '<li><a href="' + esc(hrefFor(item)) + '">' +
        '<strong>' + esc(item.title) + '</strong>' +
        (item.note ? '<span>' + esc(item.note) + '</span>' : '') +
        '</a></li>';
    });
    return html + '</ul>';
  }

  function section(title, desc, inner) {
    return (
      '<section class="articles-block">' +
      '<div class="block-head"><span class="kicker"></span><h2>' + esc(title) + '</h2><span class="rule"></span></div>' +
      (desc ? '<p class="articles-block-desc">' + esc(desc) + '</p>' : '') +
      inner +
      '</section>'
    );
  }

  var FRESH_TONES = [
    'linear-gradient(145deg,#3d4f6b,#6b86b0)',
    'linear-gradient(145deg,#5a3d2b,#a67c52)',
    'linear-gradient(145deg,#3f5240,#7a8f6a)',
    'linear-gradient(145deg,#5c3a45,#b06a7a)',
    'linear-gradient(145deg,#2f4558,#5d7a8c)',
    'linear-gradient(145deg,#4a3b28,#c9a227)',
  ];

  function freshCoverAttr(it, i) {
    var img = it.image || it.cover || it.thumbnail || '';
    if (img && V.coverStyle) {
      var styled = V.coverStyle(img);
      if (styled) return styled;
    }
    return 'style="background-image:' + FRESH_TONES[i % FRESH_TONES.length] + '"';
  }

  function renderFresh(items) {
    if (!items.length) return '<p class="archive-empty">Пока нет материалов</p>';
    return (
      '<div class="art-grid">' +
      items.map(function (it, i) {
        var rub = (it.categories && it.categories[0]) || 'Статья';
        return (
          '<a class="art" href="' + V.articleHref(it) + '">' +
          '<div class="ph" ' + freshCoverAttr(it, i) + '></div>' +
          '<div class="in"><div class="rub">' + esc(rub) + '</div>' +
          '<h4>' + esc(it.title) + '</h4></div></a>'
        );
      }).join('') +
      '</div>'
    );
  }

  document.title = 'Статьи — ЯКатолик';
  root.innerHTML =
    '<nav class="breadcrumbs in-shell" aria-label="Хлебные крошки">' +
    '<a href="index.html">Главная</a><span>/</span><span>Статьи</span></nav>' +
    '<header class="page-head in-shell"><div>' +
    '<p class="eyebrow">Читать</p><h1>Статьи</h1></div>' +
    '<p class="page-desc">Рубрики, темы, вопрос-ответ и подборки — не только общий поиск по каталогу.</p>' +
    '</header>' +
    '<div class="articles-toolbar">' +
    '<a class="btn-primary" href="archive.html?category=columns">Все статьи</a>' +
    '<a class="btn-ghost" href="archive.html?category=pages">Страницы</a>' +
    '<a class="btn-ghost" href="archive.html?category=interview">Голоса</a>' +
    '</div>' +
    section(
      'Страницы',
      'Материалы без рубрик и тегов: хабы циклов, биографии, опорные тексты (~191).',
      cardGrid(
        [
          {
            title: 'Все страницы',
            href: 'archive.html?category=pages',
            tone: 'a',
            note: 'Без категорий · из архива Рускатолик',
            image: 'assets/cards/articles-biographies.webp',
          },
        ],
        'Фильтр'
      )
    ) +
    section('Рубрики', 'Основные подразделы публикаций.', cardGrid(RUBRICS, 'Рубрика')) +
    section('Темы', 'Специальные подборки. Часть тегов Анастасия добавит на Рускатолике — до этого работает поиск.', linkList(TOPICS)) +
    section('Вопрос — ответ', '', cardGrid(QA, 'Раздел')) +
    section('Идеи', 'Лёгкие и прикладные материалы.', cardGrid(IDEAS, 'Подборка')) +
    section('Голоса', 'Интервью, свидетельства и проповеди.', cardGrid(VOICES, 'Голоса')) +
    '<section class="articles-block" id="articles-fresh-wrap">' +
    '<div class="block-head"><span class="kicker"></span><h2>Свежее</h2><span class="rule"></span></div>' +
    '<div id="articles-fresh"><div class="spinner" aria-label="Загрузка"></div></div>' +
    '<p class="articles-more"><a class="wlink" href="archive.html?category=columns">Весь каталог →</a></p>' +
    '</section>';

  V.getArticles({ category: 'columns', limit: 6, page: 1 })
    .then(function (pack) {
      var el = document.getElementById('articles-fresh');
      if (el) el.innerHTML = renderFresh((pack.items || []).slice(0, 6));
    })
    .catch(function () {
      var el = document.getElementById('articles-fresh');
      if (el) el.innerHTML = '<p class="archive-empty">Не удалось загрузить</p>';
    });
})();
