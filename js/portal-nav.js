/**
 * Подсветка активного пункта нижней навигации.
 * Таббар: О Церкви · Духовная жизнь · Библиотека · Карта · Спросить
 * Главная — по логотипу; Новости/Статьи/Голоса — с заголовков на главной.
 */
(function () {
  'use strict';
  var path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var params = {};
  try {
    params = Object.fromEntries(new URLSearchParams(location.search));
  } catch (e) {}

  var active = null;
  if (path === 'church.html') active = 'church';
  else if (path === 'spiritual-life.html') active = 'spirit';
  else if (path === 'library.html' || path === 'book.html') active = 'library';
  else if (path === 'map.html') active = 'map';
  else if (path === 'chat.html') active = 'chat';
  else if (path === 'calendar.html') active = null;
  else if (path === 'authors.html' || path === 'author.html' || path === 'cycle.html') active = null;

  if (!active) return;
  document.querySelectorAll('.app-tabbar .tab-item').forEach(function (a) {
    if (a.getAttribute('data-tab') === active) a.classList.add('active');
    else a.classList.remove('active');
  });
})();
