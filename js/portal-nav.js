/**
 * Нижняя навигация: Главная · О Церкви · Духовная жизнь · Аудио · Видео · Спросить
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

  var APP_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<rect x="7" y="2.8" width="10" height="18.4" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.7"/>' +
    '<path d="M10 18.6h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>' +
    '</svg>';

  function ensureAppBtn() {
    var wrap = document.querySelector('.masthead .wrap');
    if (!wrap || wrap.querySelector('.app-btn')) return;
    var cal = wrap.querySelector('.cal-btn');
    var tools = wrap.querySelector('.header-tools') || wrap.querySelector('.masthead-tools');
    if (!tools) {
      tools = document.createElement('div');
      tools.className = 'header-tools';
      if (cal) {
        cal.parentNode.insertBefore(tools, cal);
        tools.appendChild(cal);
      } else {
        wrap.appendChild(tools);
      }
    }
    tools.classList.add('header-tools');
    var btn = document.createElement('a');
    btn.className = 'app-btn';
    btn.href = 'page.html#app';
    btn.setAttribute('aria-label', 'Приложение');
    btn.title = 'Приложение';
    btn.innerHTML = APP_SVG + '<span>Приложение</span>';
    tools.insertBefore(btn, tools.firstChild);
  }
  ensureAppBtn();

  var path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var active = null;
  if (path === 'index.html' || path === '' || path === '/') active = 'home';
  else if (path === 'church.html') active = 'church';
  else if (path === 'spiritual-life.html') active = 'spirit';
  else if (path === 'audio.html' || path === 'radio.html' || path === 'podcast.html') active = 'audio';
  else if (path === 'video.html') active = 'video';
  else if (path === 'chat.html') active = 'chat';

  if (!active) return;
  document.querySelectorAll('.app-tabbar .tab-item').forEach(function (a) {
    if (a.getAttribute('data-tab') === active) a.classList.add('active');
    else a.classList.remove('active');
  });
})();
