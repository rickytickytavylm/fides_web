(function () {
  'use strict';
  var PS = window.YakPhotostock;
  var V = window.Vera;
  if (!PS) return;

  function esc(s) {
    return V ? V.escapeHtml(s) : String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var params = new URLSearchParams(location.search);
  var modeTag = params.get('tag') || '';
  var modeQ = params.get('q') || '';
  var pageSize = 20;
  var shown = 0;
  var filtered = [];
  var data = null;

  var input = document.getElementById('ps-input');
  var tagsEl = document.getElementById('ps-popular');
  var grid = document.getElementById('ps-grid');
  var moreBtn = document.getElementById('ps-more');
  var statusEl = document.getElementById('ps-status');
  var asideEl = document.getElementById('ps-photographers');
  var titleEl = document.getElementById('ps-heading');

  function avatarHtml(name, photo) {
    if (photo) {
      return '<span class="author-ava" style="background-image:url(\'' + esc(photo) + '\')"></span>';
    }
    return '<span class="author-ava initials">' + esc(PS.initials(name)) + '</span>';
  }

  function paintTags(popular) {
    if (!tagsEl) return;
    if (!popular.length) {
      tagsEl.innerHTML = '';
      return;
    }
    tagsEl.innerHTML =
      '<span class="ps-popular-label">Популярные теги:</span> ' +
      popular
        .map(function (t) {
          return (
            '<a class="ps-tag" href="photostock.html?tag=' +
            encodeURIComponent(t.tag) +
            '">#' +
            esc(t.tag) +
            '</a>'
          );
        })
        .join(' ');
  }

  function paintAside() {
    if (!asideEl || !data) return;
    var list = PS.recentPhotographers(data, 6);
    asideEl.innerHTML =
      '<h3>Фотографы</h3>' +
      (list.length
        ? '<div class="ps-ph-list">' +
          list
            .map(function (p) {
              return (
                '<a class="ps-ph-row" href="photographer.html?slug=' +
                encodeURIComponent(p.slug) +
                '">' +
                avatarHtml(p.name, p.photo) +
                '<span><strong>' +
                esc(p.name) +
                '</strong><small>' +
                esc(String(p.count)) +
                ' фото</small></span></a>'
              );
            })
            .join('') +
          '</div>'
        : '<p class="ps-status" style="padding:8px 0;text-align:left">Пока нет фотографов</p>');
  }

  function applyFilter() {
    var q = input ? input.value.trim() : modeQ;
    if (modeTag) {
      filtered = PS.byTag(data.photos, modeTag);
      if (titleEl) titleEl.textContent = '#' + modeTag;
    } else if (q) {
      filtered = PS.searchPhotos(data.photos, q);
      if (titleEl) titleEl.textContent = 'Фотосток';
    } else {
      filtered = data.photos.slice();
      if (titleEl) titleEl.textContent = 'Фотосток';
    }
    shown = 0;
    if (grid) grid.innerHTML = '';
    paintMore();
  }

  function paintMore() {
    if (!grid) return;
    var next = filtered.slice(shown, shown + pageSize);
    if (!shown && !next.length) {
      if (statusEl) statusEl.textContent = 'Ничего не найдено';
      if (moreBtn) moreBtn.style.display = 'none';
      return;
    }
    if (statusEl) statusEl.textContent = '';
    next.forEach(function (p) {
      var a = document.createElement('a');
      a.className = 'ps-tile';
      a.href = 'photo.html?id=' + encodeURIComponent(p.id);
      a.innerHTML = '<img src="' + esc(p.thumb || p.url) + '" alt="" loading="lazy" />';
      grid.appendChild(a);
    });
    shown += next.length;
    if (moreBtn) {
      moreBtn.style.display = shown < filtered.length ? 'inline-block' : 'none';
    }
  }

  function boot(pack) {
    data = pack;
    paintTags(PS.popularTags(data.photos, 10));
    paintAside();
    if (input) {
      if (modeQ) input.value = modeQ;
      else if (!modeTag) input.value = '';
      input.placeholder = 'введите ваш запрос';
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          modeTag = '';
          var q = input.value.trim();
          history.replaceState(null, '', q ? 'photostock.html?q=' + encodeURIComponent(q) : 'photostock.html');
          applyFilter();
        }
      });
    }
    if (moreBtn) moreBtn.onclick = function () { paintMore(); };
    applyFilter();
  }

  PS.load().then(boot).catch(function () {
    if (statusEl) statusEl.textContent = 'Не удалось загрузить фотосток';
  });
})();
