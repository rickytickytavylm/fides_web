(function () {
  'use strict';
  var V = window.Vera;
  if (!V) return;

  var params = new URLSearchParams(location.search);
  var state = {
    category: params.get('category') || '',
    q: params.get('q') || '',
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

  function chipLabel() {
    var found = V.ARCHIVE_CHIPS.filter(function (c) {
      return c.slug === state.category;
    })[0];
    return (found && found.label) || 'Все рубрики';
  }

  function pageHeading() {
    if (state.category === 'columns') return 'Статьи';
    if (state.category === 'polka') return 'Библиотека';
    if (state.category === 'spirituality') return 'Духовность';
    if (state.category === 'news' || state.category === 'church-rus') return 'Новости';
    if (state.category) return chipLabel();
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
    chipsEl.innerHTML = V.ARCHIVE_CHIPS.map(function (c) {
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
          '</time></p>' +
          '<h2><a href="' +
          V.articleHref(hero) +
          '">' +
          V.escapeHtml(hero.title) +
          '</a></h2>' +
          '<p>' +
          V.escapeHtml(hero.excerpt || '') +
          '</p>';
      }
    }

    if (feedEl) {
      var list = hero ? rest : state.items;
      feedEl.innerHTML = list
        .map(function (item) {
          var c = (item.categories && item.categories[0]) || 'Материал';
          return (
            '<article class="feed-item reveal visible"><div>' +
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
            '<p>' +
            V.escapeHtml(String(item.excerpt || '').slice(0, 180)) +
            '</p></div>' +
            '<a class="feed-thumb" href="' +
            V.articleHref(item) +
            '" ' +
            V.coverStyle(item.image) +
            ' aria-label="Открыть"></a></article>'
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
    if (moreBtn) moreBtn.textContent = 'Загрузка…';
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
        if (moreBtn) moreBtn.textContent = 'Ещё материалы ↓';
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
