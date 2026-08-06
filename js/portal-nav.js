/**
 * Подсветка активного пункта нижней навигации.
 * Состав таббара (ЯКатолик): Главная · Новости · Статьи · Карта · Спросить
 */
(function () {
  'use strict';
  var path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var params = {};
  try {
    params = Object.fromEntries(new URLSearchParams(location.search));
  } catch (e) {}

  var active = null;
  if (path === 'index.html' || path === '') active = 'home';
  else if (path === 'map.html') active = 'map';
  else if (path === 'chat.html') active = 'chat';
  else if (path === 'archive.html' || path === 'article.html' || path === 'category.html') {
    if (params.category === 'news' || params.category === 'church-rus') active = 'news';
    else if (params.category === 'polka') active = 'library';
    else active = 'articles';
  }

  if (!active) return;
  document.querySelectorAll('.app-tabbar .tab-item').forEach(function (a) {
    if (a.getAttribute('data-tab') === active) a.classList.add('active');
    else a.classList.remove('active');
  });
})();
