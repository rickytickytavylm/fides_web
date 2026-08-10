(function () {
  'use strict';
  var PS = window.YakPhotostock;
  var V = window.Vera;
  if (!PS) return;

  function esc(s) {
    return V ? V.escapeHtml(s) : String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var root = document.getElementById('photo-root');
  var id = new URLSearchParams(location.search).get('id') || '';

  function shareMenu(url, title) {
    var u = encodeURIComponent(url);
    var t = encodeURIComponent(title || 'Фото — ЯКатолик');
    return (
      '<div class="ps-share">' +
      '<button type="button" class="btn-primary" id="share-btn">Поделиться</button>' +
      '<div class="ps-share-menu" id="share-menu" hidden>' +
      '<a target="_blank" rel="noopener" href="https://vk.com/share.php?url=' + u + '&title=' + t + '">ВК</a>' +
      '<a target="_blank" rel="noopener" href="https://t.me/share/url?url=' + u + '&text=' + t + '">ТГ</a>' +
      '<a target="_blank" rel="noopener" href="https://max.ru/share?url=' + u + '">Макс</a>' +
      '</div></div>'
    );
  }

  PS.load().then(function (data) {
    var photo = PS.photoById(data.photos, id);
    if (!photo) {
      root.innerHTML = '<p class="ps-status">Фото не найдено. <a href="photostock.html">К фотостоку</a></p>';
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
      '<p><a class="wlink" href="photostock.html">← Все фото</a></p>' +
      '</aside></div>';

    var btn = document.getElementById('share-btn');
    var menu = document.getElementById('share-menu');
    if (btn && menu) {
      btn.onclick = function () {
        menu.hidden = !menu.hidden;
      };
    }
  });
})();
