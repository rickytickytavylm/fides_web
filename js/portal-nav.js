/**
 * Нижняя навигация: Главная · О Церкви · Духовная жизнь · Аудио · Спросить
 * «Главная» вставляется слева, если её ещё нет в разметке страницы.
 */
(function () {
  'use strict';

  var HOME_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M4.5 10.8 12 4.6l7.5 6.2V20a1.4 1.4 0 0 1-1.4 1.4h-4.2v-5.2h-3.8v5.2H5.9A1.4 1.4 0 0 1 4.5 20V10.8Z" ' +
    'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>';

  var tabbar = document.querySelector('.app-tabbar');
  if (tabbar && !tabbar.querySelector('[data-tab="home"]')) {
    var home = document.createElement('a');
    home.className = 'tab-item';
    home.href = 'index.html';
    home.setAttribute('data-tab', 'home');
    home.innerHTML = HOME_SVG + '<span>Главная</span>';
    tabbar.insertBefore(home, tabbar.firstChild);
  }

  var path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var active = null;
  if (path === 'index.html' || path === '' || path === '/') active = 'home';
  else if (path === 'church.html') active = 'church';
  else if (path === 'spiritual-life.html') active = 'spirit';
  else if (path === 'audio.html' || path === 'radio.html' || path === 'podcast.html') active = 'audio';
  else if (path === 'chat.html') active = 'chat';

  if (!active) return;
  document.querySelectorAll('.app-tabbar .tab-item').forEach(function (a) {
    if (a.getAttribute('data-tab') === active) a.classList.add('active');
    else a.classList.remove('active');
  });
})();
