(function () {
  'use strict';
  var V = window.Vera;
  if (!V) return;

  var state = { category: '', q: '', loading: false };
  var chipsEl = document.getElementById('archive-chips');
  var heroEl = document.getElementById('archive-hero');
  var listEl = document.getElementById('archive-list');
  var statusEl = document.getElementById('archive-status');
  var searchInput = document.getElementById('archive-search');

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
        renderChips();
        load();
      });
    });
  }

  function placeholderCover() {
    return 'background.webp';
  }

  function render(pack) {
    var items = pack.items || [];
    var hero = items[0];
    var rest = items.slice(1, 6);

    if (statusEl) {
      var total = pack.total ? pack.total.toLocaleString('ru-RU') : '—';
      statusEl.textContent = total + ' материалов · архив Рускатолик';
    }

    if (heroEl) {
      if (!hero) {
        heroEl.innerHTML = '<p class="archive-empty">Ничего не найдено</p>';
      } else {
        var cat = (hero.categories && hero.categories[0]) || 'Рускатолик';
        var img = hero.image || placeholderCover();
        heroEl.innerHTML =
          '<a class="lead-story reveal visible" href="' +
          V.articleHref(hero) +
          '">' +
          '<span class="story-image" ' +
          V.coverStyle(img) +
          ' aria-hidden="true"></span>' +
          '<div class="story-meta"><span>' +
          V.escapeHtml(cat) +
          '</span><time>' +
          V.escapeHtml(V.formatDate(hero.date)) +
          '</time></div>' +
          '<h3>' +
          V.escapeHtml(hero.title) +
          '</h3>' +
          '<p>' +
          V.escapeHtml(hero.excerpt || '') +
          '</p></a>';
      }
    }

    if (listEl) {
      listEl.innerHTML = rest
        .map(function (item) {
          var c = (item.categories && item.categories[0]) || 'Материал';
          var i = item.image || placeholderCover();
          return (
            '<article class="compact-story reveal visible"><div>' +
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
            V.escapeHtml(String(item.excerpt || '').slice(0, 160)) +
            '</p></div>' +
            '<a class="story-thumb" href="' +
            V.articleHref(item) +
            '" ' +
            V.coverStyle(i) +
            ' aria-label="Открыть"></a></article>'
          );
        })
        .join('');
    }
  }

  function load() {
    if (state.loading) return;
    state.loading = true;
    if (statusEl) statusEl.textContent = 'Загрузка архива…';
    V.getArticles({
      category: state.category,
      q: state.q,
      page: 1,
      limit: 6,
    })
      .then(render)
      .catch(function (e) {
        console.error(e);
        if (statusEl) statusEl.textContent = 'Не удалось загрузить архив. Проверьте соединение.';
        if (heroEl) heroEl.innerHTML = '';
        if (listEl) listEl.innerHTML = '';
      })
      .then(function () {
        state.loading = false;
      });
  }

  if (searchInput) {
    var t;
    searchInput.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        state.q = searchInput.value.trim();
        load();
      }, 380);
    });
  }

  renderChips();
  load();

  V.getStats()
    .then(function (s) {
      var el = document.getElementById('stats-line');
      if (el && s && s.articles) {
        el.textContent =
          Number(s.articles).toLocaleString('ru-RU') +
          ' материалов · ' +
          (s.categories || 47) +
          ' рубрик';
      }
    })
    .catch(function () {});
})();
