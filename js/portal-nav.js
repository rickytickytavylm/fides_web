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
    '<path d="M4.5 6.2c2.2-.8 4.4-.5 7.5 1.4 3.1-1.9 5.3-2.2 7.5-1.4v12.2c-2.2-.7-4.4-.4-7.5 1.4-3.1-1.8-5.3-2.1-7.5-1.4V6.2Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>' +
    '<path d="M12 7.6v12.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>' +
    '</svg>';

  function bindAppBtn(btn) {
    btn.addEventListener('click', function (e) {
      var onAbout = /(^|\/)page\.html$/i.test(location.pathname);
      if (!onAbout) return;
      e.preventDefault();
      if (location.hash) history.replaceState(null, '', 'page.html');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function ensureAppBtn() {
    var wrap = document.querySelector('.masthead .wrap');
    if (!wrap) return;
    var existing = wrap.querySelector('.app-btn');
    if (existing) {
      bindAppBtn(existing);
      return;
    }
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
    btn.href = 'page.html';
    btn.setAttribute('aria-label', 'О проекте');
    btn.title = 'О проекте';
    btn.innerHTML = APP_SVG + '<span>О проекте</span>';
    bindAppBtn(btn);
    tools.insertBefore(btn, tools.firstChild);
  }
  ensureAppBtn();

  var path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var active = null;
  if (path === 'index.html' || path === '' || path === '/') active = 'home';
  else if (path === 'church.html') active = 'church';
  else if (path === 'spiritual-life.html') active = 'spirit';
  else if (path === 'audio.html' || path === 'radio.html' || path === 'podcast.html' || path === 'compendium.html') active = 'audio';
  else if (path === 'video.html') active = 'video';
  else if (path === 'chat.html') active = 'chat';

  if (!active) return;
  document.querySelectorAll('.app-tabbar .tab-item').forEach(function (a) {
    if (a.getAttribute('data-tab') === active) a.classList.add('active');
    else a.classList.remove('active');
  });
})();
