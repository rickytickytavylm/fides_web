(function () {
  'use strict';
  var PS = window.YakPhotostock;
  var V = window.Vera;
  if (!PS) return;

  function esc(s) {
    return V ? V.escapeHtml(s) : String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function goPhotoBack(e) {
    if (e) e.preventDefault();
    var ref = document.referrer || '';
    var sameOrigin = false;
    try {
      sameOrigin = !!(ref && new URL(ref).origin === location.origin);
    } catch (err) {}
    /* Android WebView / deep-link: history.back часто некуда — падаем на фотосток */
    if (sameOrigin && window.history.length > 1) {
      var left = false;
      var failSafe = setTimeout(function () {
        if (!left) location.href = 'photostock.html';
      }, 400);
      window.addEventListener(
        'pagehide',
        function () {
          left = true;
          clearTimeout(failSafe);
        },
        { once: true }
      );
      history.back();
      return;
    }
    location.href = 'photostock.html';
  }

  function bindBack(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('click', goPhotoBack);
  }

  var root = document.getElementById('photo-root');
  var id = new URLSearchParams(location.search).get('id') || '';

  function shareMenu(url, title) {
    var u = encodeURIComponent(url);
    var t = encodeURIComponent(title || 'Фото — ЯКатолик');
    return (
      '<div class="ps-share">' +
      '<button type="button" class="btn-primary" id="share-btn">Поделиться</button>' +
      '<div class="ps-share-pop" id="share-pop" hidden>' +
      '<button type="button" class="ps-share-scrim" id="share-scrim" aria-label="Закрыть"></button>' +
      '<div class="ps-share-sheet" role="dialog" aria-label="Поделиться">' +
      '<p>Куда отправить</p>' +
      '<a target="_blank" rel="noopener" href="https://vk.com/share.php?url=' + u + '&title=' + t + '">ВКонтакте</a>' +
      '<a target="_blank" rel="noopener" href="https://t.me/share/url?url=' + u + '&text=' + t + '">Telegram</a>' +
      '<a target="_blank" rel="noopener" href="https://max.ru/share?url=' + u + '">MAX</a>' +
      '<button type="button" class="ps-share-copy" id="share-copy">Скопировать ссылку</button>' +
      '</div></div></div>'
    );
  }

  bindBack('ps-back-mast');

  PS.load().then(function (data) {
    var photo = PS.photoById(data.photos, id);
    if (!photo) {
      root.innerHTML =
        '<p class="ps-back-row"><button type="button" class="ps-back" id="ps-back">← Назад</button></p>' +
        '<p class="ps-status">Фото не найдено. <a href="photostock.html">К фотостоку</a></p>';
      bindBack('ps-back');
      return;
    }
    var ph =
      PS.photographerBySlug(data.photographers, photo.photographerSlug) ||
      data.photographers.filter(function (p) { return p.id === photo.photographerId; })[0];
    var name = (ph && ph.name) || photo.photographerName || 'Фотограф';
    var slug = (ph && ph.slug) || photo.photographerSlug || '';
    var pageUrl = location.href;
    document.title = name + ' — фото — ЯКатолик';

    root.innerHTML =
      '<p class="ps-back-row">' +
      '<button type="button" class="ps-back" id="ps-back">← Назад</button>' +
      '<a class="ps-back-link" href="photostock.html">Все фото</a></p>' +
      '<nav class="breadcrumbs" aria-label="Хлебные крошки">' +
      '<a href="index.html">Главная</a><span>/</span>' +
      '<a href="photostock.html">Фотосток</a><span>/</span><span>Фото</span></nav>' +
      '<div class="ps-card-layout">' +
      '<figure class="ps-card-figure"><img src="' + esc(photo.url) + '" alt="" /></figure>' +
      '<aside class="ps-card-meta">' +
      '<p class="eyebrow">Фотограф</p>' +
      '<h1><a href="photographer.html?slug=' + encodeURIComponent(slug) + '">' + esc(name) + '</a></h1>' +
      '<div class="ps-card-tags">' +
      (photo.tags || [])
        .map(function (t) {
          return (
            '<a class="ps-tag" href="photostock.html?tag=' +
            encodeURIComponent(t) +
            '">#' +
            esc(t) +
            '</a>'
          );
        })
        .join(' ') +
      '</div>' +
      '<div class="ps-card-actions">' +
      '<a class="btn-primary" download href="' + esc(photo.url) + '">Скачать</a>' +
      '<p class="ps-license">Лицензия: ' +
      esc(photo.license || 'Creative Commons') +
      '. Используйте с указанием автора, если того требует лицензия.</p>' +
      shareMenu(pageUrl, name) +
      '</div>' +
      '</aside></div>';

    bindBack('ps-back');

    var btn = document.getElementById('share-btn');
    var pop = document.getElementById('share-pop');
    var scrim = document.getElementById('share-scrim');
    var copyBtn = document.getElementById('share-copy');
    function closeShare() { if (pop) pop.hidden = true; }
    function openShare() {
      if (navigator.share) {
        navigator.share({ title: name, url: pageUrl }).catch(function () {
          if (pop) pop.hidden = false;
        });
        return;
      }
      if (pop) pop.hidden = false;
    }
    if (btn) btn.onclick = openShare;
    if (scrim) scrim.onclick = closeShare;
    if (copyBtn) {
      copyBtn.onclick = function () {
        var done = function () { copyBtn.textContent = 'Скопировано'; };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(pageUrl).then(done).catch(function () {
            window.prompt('Ссылка', pageUrl);
          });
        } else window.prompt('Ссылка', pageUrl);
      };
    }
  });
})();
