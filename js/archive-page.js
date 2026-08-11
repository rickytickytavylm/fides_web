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
    { slug: 'saints', label: 'Святые' },
    { slug: 'bible', label: 'Библеистика' },
    { slug: 'liturgy', label: 'Литургика' },
    { slug: 'puteshestviya', label: 'Путешествия' },
  ];
  // Новости по ТЗ: digest→Новости, church-rus→Россия, pope+santa-sede→Святой Престол.
  // Анонсы / пастырство и пр. не переносим на витрину.
  var NEWS_CHIPS = [
    { slug: 'news', label: 'Все' },
    { slug: 'church-rus', label: 'Россия' },
    { slug: 'sng', label: 'КЦ в мире' },
    { slug: 'santa-sede', label: 'Святой Престол' },
  ];
  var VOICES_CHIPS = [
    { slug: 'interview', label: 'Интервью' },
    { slug: 'svidetelstva', label: 'Свидетельства' },
    { slug: 'propovedi', label: 'Проповеди' },
  ];

  var ARTICLE_SLUGS = ARTICLE_CHIPS.map(function (c) { return c.slug; });
  var VOICES_SLUGS = VOICES_CHIPS.map(function (c) { return c.slug; });
  var LABELS = {};
  ARTICLE_CHIPS.concat(NEWS_CHIPS).concat(VOICES_CHIPS).forEach(function (c) { LABELS[c.slug] = c.label; });
  (V.ARCHIVE_CHIPS || []).forEach(function (c) { if (!LABELS[c.slug]) LABELS[c.slug] = c.label; });
  LABELS.polka = 'Книжная полка';
  LABELS.pope = 'Святой Престол';

  function sectionOf(slug) {
    if (slug === 'polka') return 'library';
    if (slug === 'pope') return 'news';
    if (ARTICLE_SLUGS.indexOf(slug) !== -1) return 'articles';
    if (VOICES_SLUGS.indexOf(slug) !== -1) return 'voices';
    return 'news';
  }

  function itemHref(item) {
    return V.articleHref(item);
  }

  function itemRubric(item) {
    return (item.categories && item.categories[0]) || 'Материал';
  }

  // Авторы привязаны через WP-теги → YakAuthors.recent; API author почти всегда «ruscatholic».
  function authorLabel(item) {
    if (window.YakAuthorLink && YakAuthorLink.displayName) {
      return YakAuthorLink.displayName(item) || '';
    }
    var a = (item && item.author ? String(item.author) : '').trim();
    if (!a) return '';
    var low = a.toLowerCase();
    if (low === 'ruscatholic' || low === 'admin' || low === 'редакция') return '';
    return a;
  }

  function authorMini(item) {
    if (window.YakAuthorLink && YakAuthorLink.cardHtml) {
      return YakAuthorLink.cardHtml(item, { className: 'card-author card-author--feed', link: true });
    }
    var name = authorLabel(item);
    return name ? '<p class="feed-author">' + V.escapeHtml(name) + '</p>' : '';
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
    limit: 12,
    lastPageCount: 0,
  };

  // WP pages — только черновики админки, не портал
  if (state.category === 'pages') {
    location.replace('articles.html');
    return;
  }

  // Книжная полка архива → полноценный раздел «Библиотека»
  if (state.section === 'library' || state.category === 'polka') {
    location.replace('library.html');
    return;
  }
  // Старый слаг «Папа» → единая рубрика новостей «Святой Престол»
  if (state.category === 'pope') {
    location.replace('archive.html?category=santa-sede' + (state.q ? '&q=' + encodeURIComponent(state.q) : ''));
    return;
  }

  var chipsEl = document.getElementById('archive-chips');
  var feedEl = document.getElementById('feed');
  var leadEl = document.getElementById('lead-item');
  var countEl = document.getElementById('rubric-count');
  var moreBtn = document.getElementById('load-more');
  var searchInput = document.getElementById('archive-search');
  var rubricEl = document.getElementById('page-rubric');

  function sectionChips() {
    if (state.section === 'articles') return ARTICLE_CHIPS;
    if (state.section === 'voices') return VOICES_CHIPS;
    if (state.section === 'library') return [{ slug: 'polka', label: 'Все' }];
    return NEWS_CHIPS;
  }

  function chipLabel() {
    return LABELS[state.category] || 'Все рубрики';
  }

  function pageHeading() {
    if (state.section === 'articles') return 'Статьи';
    if (state.section === 'voices') return 'Голоса';
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
          ? 'Свежие статьи и колонки для спокойного чтения'
          : title === 'Голоса'
            ? 'Интервью, свидетельства и проповеди'
            : title === 'Библиотека'
              ? 'Книжная полка и материалы для углублённого чтения'
              : 'Актуальные материалы: поиск по теме, рубрики и спокойное чтение';
    }
    if (searchInput) {
      searchInput.placeholder =
        state.section === 'articles'
          ? 'Поиск по статьям…'
          : state.section === 'voices'
            ? 'Поиск по голосам…'
            : 'Поиск по новостям…';
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
      '<div class="card-image sk"></div>' +
      '<div class="lead-copy">' +
      '<div class="sk sk-line" style="width:36%;height:12px;margin:0 0 12px"></div>' +
      '<div class="sk sk-line" style="width:92%;height:26px;margin-bottom:8px"></div>' +
      '<div class="sk sk-line" style="width:70%;height:26px"></div></div>';
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
        var cat = itemRubric(hero);
        var heroAuthor = authorMini(hero);
        var heroHref = itemHref(hero);
        leadEl.innerHTML =
          '<a class="card-image" href="' +
          heroHref +
          '" ' +
          V.coverStyle(hero.image) +
          ' aria-label="Открыть"></a>' +
          '<div class="lead-copy">' +
          (heroAuthor || '') +
          '<p class="story-meta"><span>' +
          V.escapeHtml(cat) +
          '</span><time>' +
          V.escapeHtml(V.formatDate(hero.date)) +
          '</time></p>' +
          '<h2><a href="' +
          heroHref +
          '">' +
          V.escapeHtml(hero.title) +
          '</a></h2>' +
          /* Лид под заголовком на мобе ломает вёрстку — только десктоп */
          (hero.excerpt && !window.matchMedia('(max-width: 880px)').matches
            ? '<p class="lead-excerpt">' +
              V.escapeHtml(String(hero.excerpt).replace(/\s+/g, ' ').trim().slice(0, 180)) +
              '</p>'
            : '') +
          '</div>';
      }
    }

    if (feedEl) {
      var list = hero ? rest : state.items;
      feedEl.innerHTML = list
        .map(function (item) {
          var c = itemRubric(item);
          var au = authorMini(item);
          var href = itemHref(item);
          return (
            '<article class="feed-item reveal visible">' +
            '<a class="feed-thumb" href="' +
            href +
            '" ' +
            V.coverStyle(item.image) +
            ' aria-label="Открыть"></a>' +
            '<div class="feed-body">' +
            (au || '') +
            '<p class="story-meta"><span>' +
            V.escapeHtml(c) +
            '</span><time>' +
            V.escapeHtml(V.formatDate(item.date)) +
            '</time></p>' +
            '<h3><a href="' +
            href +
            '">' +
            V.escapeHtml(item.title) +
            '</a></h3>' +
            '</div></article>'
          );
        })
        .join('');
    }

    if (moreBtn) {
      var hasMore =
        state.total > 0
          ? state.items.length < state.total
          : state.lastPageCount >= state.limit;
      moreBtn.hidden = !hasMore || !state.items.length;
      moreBtn.disabled = state.loading;
    }
  }

  function load(replace) {
    if (state.loading) return;
    state.loading = true;
    if (replace && !state.items.length) skeletonFeed(5);
    if (moreBtn) {
      moreBtn.hidden = false;
      moreBtn.disabled = true;
      moreBtn.textContent = 'Загрузка…';
    }
    // Статические WP pages на портал не выводим — только в черновиках админки.
    if (state.category === 'pages') {
      location.replace('articles.html');
      return;
    }

    V.getArticles({
      category: state.category,
      q: state.q,
      page: state.page,
      limit: state.limit,
    })
      .then(function (pack) {
        var batch = pack.items || [];
        state.total = Number(pack.total) || 0;
        state.lastPageCount = batch.length;
        state.items = replace ? batch : state.items.concat(batch);
        render();
        if (!replace && batch.length && feedEl) {
          var firstNew = feedEl.querySelector('.feed-item:nth-last-child(' + Math.min(batch.length, 5) + ')');
          if (firstNew && firstNew.scrollIntoView) {
            try { firstNew.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
          }
        }
      })
      .catch(function (e) {
        console.error(e);
        if (replace && leadEl) leadEl.innerHTML = '<p class="archive-empty">Не удалось загрузить архив</p>';
        if (!replace && moreBtn) moreBtn.textContent = 'Повторить';
      })
      .then(function () {
        state.loading = false;
        if (moreBtn) {
          moreBtn.disabled = false;
          if (moreBtn.textContent !== 'Повторить') moreBtn.textContent = 'Загрузить ещё';
          var hasMore =
            state.total > 0
              ? state.items.length < state.total
              : state.lastPageCount >= state.limit;
          moreBtn.hidden = !hasMore || !state.items.length;
        }
      });
  }

  if (moreBtn) {
    moreBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (state.loading) return;
      if (moreBtn.textContent === 'Повторить') {
        load(false);
        return;
      }
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
