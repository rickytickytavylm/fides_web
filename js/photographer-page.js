(function () {
  'use strict';
  var PS = window.YakPhotostock;
  var V = window.Vera;
  if (!PS) return;

  function esc(s) {
    return V ? V.escapeHtml(s) : String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var root = document.getElementById('photographer-root');
  var slug = new URLSearchParams(location.search).get('slug') || '';

  function socialLinks(social) {
    social = social || {};
    var items = [
      { key: 'vk', label: 'ВК', href: social.vk },
      { key: 'tg', label: 'ТГ', href: social.tg },
      { key: 'max', label: 'Макс', href: social.max },
      { key: 'pinterest', label: 'Pinterest', href: social.pinterest },
      { key: 'site', label: 'Сайт', href: social.site },
    ].filter(function (x) { return !!x.href; });
    if (!items.length) return '';
    return (
      '<div class="ps-social">' +
      items
        .map(function (x) {
          return (
            '<a href="' +
            esc(x.href) +
            '" target="_blank" rel="noopener noreferrer">' +
            esc(x.label) +
            '</a>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  PS.load().then(function (data) {
    var ph = PS.photographerBySlug(data.photographers, slug);
    if (!ph) {
      root.innerHTML = '<p class="ps-status">Фотограф не найден. <a href="photostock.html">К фотостоку</a></p>';
      return;
    }
    document.title = ph.name + ' — фотограф — ЯКатолик';
    var photos = data.photos.filter(function (p) {
      return p.photographerId === ph.id || p.photographerSlug === ph.slug;
    });
    var ava = ph.photo
      ? '<span class="author-ava" style="background-image:url(\'' + esc(ph.photo) + '\')"></span>'
      : '<span class="author-ava initials">' + esc(PS.initials(ph.name)) + '</span>';

    root.innerHTML =
      '<nav class="breadcrumbs" aria-label="Хлебные крошки">' +
      '<a href="index.html">Главная</a><span>/</span>' +
      '<a href="photostock.html">Фотосток</a><span>/</span><span>' +
      esc(ph.name) +
      '</span></nav>' +
      '<header class="author-head ps-ph-head">' +
      ava +
      '<div><p class="eyebrow">Фотограф</p><h1>' +
      esc(ph.name) +
      '</h1>' +
      '<p class="ps-ph-count">' +
      photos.length +
      ' фото</p>' +
      (ph.bio ? '<p class="ps-ph-bio">' + esc(ph.bio) + '</p>' : '') +
      socialLinks(ph.social) +
      (ph.tagSlug
        ? '<p><a class="ps-tag" href="photostock.html?tag=' +
          encodeURIComponent(ph.tagSlug) +
          '">#' +
          esc(ph.tagSlug) +
          '</a></p>'
        : '') +
      '</div></header>' +
      '<div class="ps-grid-tiles" id="ph-grid">' +
      photos
        .map(function (p) {
          return (
            '<a class="ps-tile" href="photo.html?id=' +
            encodeURIComponent(p.id) +
            '"><img src="' +
            esc(p.thumb || p.url) +
            '" alt="" loading="lazy" /></a>'
          );
        })
        .join('') +
      '</div>';
  });
})();
