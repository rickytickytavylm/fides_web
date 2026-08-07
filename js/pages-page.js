(function () {
  'use strict';
  var V = window.Vera;
  if (!V) return;

  var grid = document.getElementById('pages-grid');
  var qEl = document.getElementById('pages-q');
  var countEl = document.getElementById('pages-count');
  var moreBtn = document.getElementById('pages-more');
  if (!grid) return;

  var state = {
    q: '',
    page: 1,
    limit: 60,
    total: 0,
    items: [],
    loading: false,
  };

  function setCount() {
    if (!countEl) return;
    var n = state.total;
    countEl.textContent = n
      ? n + ' ' + (n === 1 ? 'страница' : n < 5 ? 'страницы' : 'страниц')
      : '';
  }

  function card(item) {
    var href = V.pageHref(item);
    var excerpt = item.excerpt ? String(item.excerpt).replace(/\s+/g, ' ').trim().slice(0, 160) : '';
    return (
      '<article class="feed-item pages-item">' +
      '<div class="feed-body">' +
      '<p class="story-meta"><span>Страница</span>' +
      (item.date ? '<time>' + V.escapeHtml(V.formatDate(item.date)) + '</time>' : '') +
      '</p>' +
      '<h3><a href="' +
      href +
      '">' +
      V.escapeHtml(item.title || item.slug || 'Без названия') +
      '</a></h3>' +
      (excerpt ? '<p class="pages-excerpt">' + V.escapeHtml(excerpt) + '</p>' : '') +
      '</div></article>'
    );
  }

  function render(append) {
    if (!append) grid.innerHTML = '';
    if (!state.items.length && !state.loading) {
      grid.innerHTML = '<p class="archive-empty">Страницы не найдены.</p>';
      if (moreBtn) moreBtn.hidden = true;
      return;
    }
    var html = state.items.map(card).join('');
    if (append) grid.insertAdjacentHTML('beforeend', html);
    else grid.innerHTML = html;
    if (moreBtn) {
      moreBtn.hidden = state.items.length >= state.total;
      moreBtn.disabled = false;
      moreBtn.textContent = 'Загрузить ещё';
    }
  }

  function load(append) {
    if (state.loading) return;
    state.loading = true;
    if (!append) {
      grid.innerHTML =
        '<div class="loading-row"><span class="spinner" role="status" aria-label="Загрузка"></span></div>';
    } else if (moreBtn) {
      moreBtn.disabled = true;
      moreBtn.textContent = 'Загрузка…';
    }
    V.getPages({ page: state.page, limit: state.limit, q: state.q })
      .then(function (pack) {
        state.total = Number(pack.total) || 0;
        var batch = pack.items || [];
        if (append) state.items = state.items.concat(batch);
        else state.items = batch;
        setCount();
        render(false);
        state.loading = false;
      })
      .catch(function (e) {
        console.error(e);
        state.loading = false;
        if (!append) {
          grid.innerHTML =
            '<p class="archive-empty">Не удалось загрузить страницы. Проверьте API архива.</p>';
        }
        if (moreBtn) {
          moreBtn.disabled = false;
          moreBtn.textContent = 'Загрузить ещё';
        }
      });
  }

  var timer = null;
  if (qEl) {
    qEl.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        state.q = String(qEl.value || '').trim();
        state.page = 1;
        load(false);
      }, 280);
    });
  }

  if (moreBtn) {
    moreBtn.addEventListener('click', function () {
      state.page += 1;
      // подгружаем следующую страницу и пересобираем список
      state.loading = true;
      moreBtn.disabled = true;
      moreBtn.textContent = 'Загрузка…';
      V.getPages({ page: state.page, limit: state.limit, q: state.q })
        .then(function (pack) {
          state.total = Number(pack.total) || state.total;
          state.items = state.items.concat(pack.items || []);
          setCount();
          render(false);
          state.loading = false;
        })
        .catch(function (e) {
          console.error(e);
          state.page -= 1;
          state.loading = false;
          moreBtn.disabled = false;
          moreBtn.textContent = 'Загрузить ещё';
        });
    });
  }

  load(false);
})();
