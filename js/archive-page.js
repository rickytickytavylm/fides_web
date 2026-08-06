(function () {
  'use strict';
  var V = window.Vera;
  if (!V) return;

  // Рубрики раздела «Статьи» (реальные слаги бэкенда)
  var ARTICLE_CHIPS = [
    { slug: 'columns', label: 'Все' },
    { slug: 'spirituality', label: 'Духовность' },
    { slug: 'obraz-zhizni', label: 'Образ жизни' },
    { slug: 'kultura', label: 'Культура' },
    { slug: 'history', label: 'История' },
    { slug: 'biografii', label: 'Биографии' },
    { slug: 'bible', label: 'Библеистика' },
    { slug: 'liturgy', label: 'Литургика' },
    { slug: 'puteshestviya', label: 'Путешествия' },
  ];
  // Рубрики раздела «Новости»
  var NEWS_CHIPS = [
    { slug: 'news', label: 'Все' },
    { slug: 'church-rus', label: 'КЦ в России' },
    { slug: 'sng', label: 'КЦ в мире' },
    { slug: 'pope', label: 'Папа Римский' },
    { slug: 'santa-sede', label: 'Святой Престол' },
    { slug: 'saints', label: 'Святые' },
    { slug: 'announcement', label: 'Анонсы' },
  ];

  var ARTICLE_SLUGS = ARTICLE_CHIPS.map(function (c) { return c.slug; });
  var LABELS = {};
  ARTICLE_CHIPS.concat(NEWS_CHIPS).forEach(function (c) { LABELS[c.slug] = c.label; });
  (V.ARCHIVE_CHIPS || []).forEach(function (c) { if (!LABELS[c.slug]) LABELS[c.slug] = c.label; });
  LABELS.polka = 'Книжная полка';

  function sectionOf(slug) {
    if (slug === 'polka') return 'library';
    if (ARTICLE_SLUGS.indexOf(slug) !== -1) return 'articles';
    return 'news';
  }

  // Настоящие авторы Рускатолика зашиты в теги; поле author у большинства — служебное «ruscatholic».
  // Показываем только осмысленное имя.
  function authorLabel(item) {
    var a = (item && item.author ? String(item.author) : '').trim();
    if (!a) return '';
    var low = a.toLowerCase();
    if (low === 'ruscatholic' || low === 'admin' || low === 'редакция') return '';
    return a;
  }

  var params = new URLSearchParams(location.search);
  var state = {
    category: params.get('category') || '',
    q: params.get('q') || '',
    section: sectionOf(params.get('category') || ''),
    page: 1,
    total: 0,
    loading: false,
    items: [],
  };

  var chipsEl = document.getElementById('archive-chips');
  var feedEl = document.getElementById('feed');
  var leadEl = document.getElementById('lead-item');
  var countEl = document.getElementById('rubric-count');
  var moreBtn = document.getElementById('load-more');
  var searchInput = document.getElementById('archive-search');
  var rubricEl = document.getElementById('page-rubric');

  function sectionChips() {
    if (state.section === 'articles') return ARTICLE_CHIPS;
    if (state.section === 'library') return [{ slug: 'polka', label: 'Все' }];
    return NEWS_CHIPS;
  }

  function chipLabel() {
    return LABELS[state.category] || 'Все рубрики';
  }

  function pageHeading() {
    if (state.section === 'articles') return 'Статьи';
    if (state.section === 'library') return 'Библиотека';
    return 'Новости';
  }

  function syncPageChrome() {
    var title = pageHeading();
    var h1 = document.getElementById('page-title');
    var crumb = document.getElementById('crumb-current');
    var desc = document.getElementById('page-desc');
    if (h1) h1.textContent = title;
    if (crumb) crumb.textContent = title;
    document.title = title + ' — ЯКатолик';
    if (desc) {
      desc.textContent =
        title === 'Статьи'
          ? 'Свежие статьи и колонки для спокойного чтения.'
          : title === 'Библиотека'
            ? 'Книжная полка и материалы для углублённого чтения.'
            : 'Актуальные материалы: поиск по теме, рубрики и спокойное чтение.';
    }
  }

  function updateRubricLabel() {
    syncPageChrome();
    if (!rubricEl) return;
    if (state.q) {
      rubricEl.textContent = 'Поиск: «' + state.q + '»';
      return;
    }
    rubricEl.textContent = state.category ? chipLabel() : 'Все рубрики';
  }

  function renderChips() {
    if (!chipsEl) return;
    chipsEl.innerHTML = sectionChips().map(function (c) {
      return (
        '<button type="button" class="chip' +
        (c.slug === state.category ? ' active' : '') +
        '" data-slug="' +
        V.escapeHtml(c.slug) +
        '">' +
        V.escapeHtml(c.label) +
        '</button>'
      );
    }).join('');
    chipsEl.querySelectorAll('.chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.category = btn.getAttribute('data-slug') || '';
        state.section = sectionOf(state.category);
        state.page = 1;
        state.items = [];
        history.replaceState(
          {},
          '',
          'archive.html?category=' +
            encodeURIComponent(state.category) +
            (state.q ? '&q=' + encodeURIComponent(state.q) : '')
        );
        renderChips();
        updateRubricLabel();
        load(true);
      });
    });
  }

  function skeletonFeed(n) {
    var lead =
      '<div class="lead-skeleton">' +
      '<div class="card-image sk"></div>' +
      '<div class="sk sk-line" style="width:32%;height:12px;margin:14px 0 10px"></div>' +
      '<div class="sk sk-line" style="width:80%;height:26px;margin-bottom:6px"></div></div>';
    var rows = '';
    for (var i = 0; i < (n || 5); i++) {
      rows +=
        '<article class="feed-item">' +
        '<span class="feed-thumb sk"></span>' +
        '<div class="feed-body">' +
        '<div class="sk sk-line" style="width:32%;height:11px;margin-bottom:10px"></div>' +
        '<div class="sk sk-line" style="width:92%;height:18px;margin-bottom:8px"></div>' +
        '<div class="sk sk-line" style="width:60%;height:18px"></div></div></article>';
    }
    if (leadEl) leadEl.innerHTML = lead;
    if (feedEl) feedEl.innerHTML = rows;
  }

  function render() {
    var hero = state.items[0];
    var rest = state.items.slice(1);
    if (countEl) {
      countEl.textContent = state.total
        ? state.total.toLocaleString('ru-RU') + ' публикаций'
        : '';
    }

    if (leadEl) {
      if (!hero) {
        leadEl.innerHTML = '<p class="archive-empty">Ничего не найдено</p>';
      } else {
        var cat = (hero.categories && hero.categories[0]) || 'Материал';
        var heroAuthor = authorLabel(hero);
        leadEl.innerHTML =
          '<a class="card-image" href="' +
          V.articleHref(hero) +
          '" ' +
          V.coverStyle(hero.image) +
          ' aria-label="Открыть"></a>' +
          '<p class="story-meta"><span>' +
          V.escapeHtml(cat) +
          '</span><time>' +
          V.escapeHtml(V.formatDate(hero.date)) +
          '</time>' +
          (heroAuthor ? '<span class="byline-chip">' + V.escapeHtml(heroAuthor) + '</span>' : '') +
          '</p>' +
          '<h2><a href="' +
          V.articleHref(hero) +
          '">' +
          V.escapeHtml(hero.title) +
          '</a></h2>';
      }
    }

    if (feedEl) {
      var list = hero ? rest : state.items;
      feedEl.innerHTML = list
        .map(function (item) {
          var c = (item.categories && item.categories[0]) || 'Материал';
          var au = authorLabel(item);
          return (
            '<article class="feed-item reveal visible">' +
            '<a class="feed-thumb" href="' +
            V.articleHref(item) +
            '" ' +
            V.coverStyle(item.image) +
            ' aria-label="Открыть"></a>' +
            '<div class="feed-body">' +
            '<p class="story-meta"><span>' +
            V.escapeHtml(c) +
            '</span><time>' +
            V.escapeHtml(V.formatDate(item.date)) +
            '</time></p>' +
            '<h3><a href="' +
            V.articleHref(item) +
            '">' +
            V.escapeHtml(item.title) +
            '</a></h3>' +
            (au ? '<p class="feed-author">' + V.escapeHtml(au) + '</p>' : '') +
            '</div></article>'
          );
        })
        .join('');
    }

    if (moreBtn) {
      moreBtn.hidden = state.items.length >= state.total;
      moreBtn.disabled = state.loading;
    }
  }

  function load(replace) {
    if (state.loading) return;
    state.loading = true;
    if (replace && !state.items.length) skeletonFeed(5);
    if (moreBtn) {
      if (replace) moreBtn.hidden = true;
      moreBtn.textContent = 'Загрузка…';
    }
    V.getArticles({
      category: state.category,
      q: state.q,
      page: state.page,
      limit: 20,
    })
      .then(function (pack) {
        state.total = pack.total || 0;
        state.items = replace
          ? pack.items || []
          : state.items.concat(pack.items || []);
        render();
      })
      .catch(function (e) {
        console.error(e);
        if (leadEl) leadEl.innerHTML = '<p class="archive-empty">Не удалось загрузить архив</p>';
      })
      .then(function () {
        state.loading = false;
        if (moreBtn) moreBtn.textContent = 'Загрузить ещё';
      });
  }

  if (moreBtn) {
    moreBtn.addEventListener('click', function () {
      state.page += 1;
      load(false);
    });
  }

  if (searchInput) {
    searchInput.value = state.q;
    var t;
    searchInput.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        state.q = searchInput.value.trim();
        state.page = 1;
        state.items = [];
        updateRubricLabel();
        load(true);
      }, 380);
    });
  }

  updateRubricLabel();
  renderChips();
  load(true);
})();
