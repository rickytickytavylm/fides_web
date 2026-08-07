/** Афиша — календарь событий / мероприятий */
(function () {
  'use strict';
  var C = window.YakCalendar;
  var root = document.getElementById('events-root');
  if (!C || !root) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmtLong(iso) {
    var p = String(iso).split('-');
    var months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    var days = ['вс','пн','вт','ср','чт','пт','сб'];
    var dt = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return days[dt.getDay()] + ', ' + Number(p[2]) + ' ' + months[Number(p[1]) - 1];
  }
  function kindLabel(k) {
    if (k === 'concert') return 'Концерт';
    if (k === 'mass') return 'Месса';
    if (k === 'pilgrimage') return 'Паломничество';
    if (k === 'feast-note') return 'Праздник';
    return 'Событие';
  }

  var params = new URLSearchParams(location.search);
  var filter = params.get('scope') || 'ru';
  var focusDate = params.get('date') || '';

  function list() {
    var items = C.upcomingEvents(C.todayIso());
    if (filter === 'ru') items = items.filter(function (e) { return e.scope === 'ru'; });
    if (filter === 'world') items = items.filter(function (e) { return e.scope === 'world'; });
    return items;
  }

  function render() {
    var items = list();
    var groups = {};
    items.forEach(function (e) {
      if (!groups[e.date]) groups[e.date] = [];
      groups[e.date].push(e);
    });
    var dates = Object.keys(groups).sort();

    root.innerHTML =
      '<nav class="breadcrumbs in-shell"><a href="index.html">Главная</a><span>/</span><span>Афиша</span></nav>' +
      '<header class="page-head in-shell">' +
      '<div><p class="eyebrow">События</p><h1>Афиша</h1></div>' +
      '<p class="page-desc">Концерты, престольные праздники, паломничества и встречи. Литургический день смотрите в <a href="calendar.html">Дне Церкви</a>.</p>' +
      '</header>' +
      '<div class="cal-filters" role="tablist">' +
      '<button type="button" data-f="ru"' + (filter === 'ru' ? ' class="on"' : '') + '>Россия</button>' +
      '<button type="button" data-f="all"' + (filter === 'all' ? ' class="on"' : '') + '>Все</button>' +
      '<button type="button" data-f="world"' + (filter === 'world' ? ' class="on"' : '') + '>Мир</button>' +
      '</div>' +
      (dates.length
        ? dates.map(function (d) {
            return (
              '<section class="afisha-day' + (d === focusDate ? ' is-focus' : '') + '">' +
              '<h2>' + esc(fmtLong(d)) + '</h2>' +
              '<div class="cal-cards">' +
              groups[d].map(cardHtml).join('') +
              '</div></section>'
            );
          }).join('')
        : '<p class="archive-empty">Пока нет событий в выбранном фильтре.</p>') +
      '<p class="cal-footnote">Анонсы по открытым источникам Архиепархии и афише. Уточняйте время на местах. Добавлять события можно в <code>js/calendar-data.js</code> → EVENTS.</p>';

    root.querySelectorAll('.cal-filters button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        filter = btn.getAttribute('data-f');
        render();
      });
    });
  }

  function cardHtml(e) {
    var external = /^https?:\/\//.test(e.href || '');
    return (
      '<a class="cal-card" href="' + esc(e.href || '#') + '"' +
      (external ? ' target="_blank" rel="noopener"' : '') + '>' +
      '<div class="cal-card-top">' +
      '<span class="cal-chip">' + esc(kindLabel(e.kind)) + '</span>' +
      (e.scope === 'ru' ? '<span class="cal-chip ghost">Россия</span>' : '<span class="cal-chip ghost">Мир</span>') +
      (e.time ? '<span class="cal-time">' + esc(e.time) + '</span>' : '') +
      '</div>' +
      '<strong>' + esc(e.title) + '</strong>' +
      (e.place ? '<span class="cal-place">' + esc(e.place) + '</span>' : '') +
      (e.desc ? '<p>' + esc(e.desc) + '</p>' : '') +
      '</a>'
    );
  }

  render();
})();
