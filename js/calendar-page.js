(function () {
  'use strict';
  var C = window.YakCalendar;
  var root = document.getElementById('calendar-root');
  if (!C || !root) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtDay(iso) {
    var p = iso.split('-');
    return Number(p[2]);
  }

  function fmtLong(iso) {
    var p = iso.split('-');
    var months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    return Number(p[2]) + ' ' + months[Number(p[1]) - 1] + ' ' + p[0];
  }

  var today = C.todayIso();
  var selected = C.byDate(today) ? today : (C.DAYS[0] && C.DAYS[0].date);
  var filter = 'all'; // all | ru | liturgy

  function kindLabel(k) {
    if (k === 'feast') return 'Праздник';
    if (k === 'event') return 'Событие';
    if (k === 'liturgy') return 'Литургия';
    return 'День';
  }

  function scopeLabel(s) {
    if (s === 'ru') return 'Россия';
    if (s === 'world') return 'Мир';
    return '';
  }

  function dayEvents(day) {
    var list = (day.events || []).slice();
    if (filter === 'ru') list = list.filter(function (e) { return e.scope === 'ru'; });
    if (filter === 'liturgy') list = list.filter(function (e) { return e.kind === 'feast' || e.kind === 'liturgy'; });
    return list;
  }

  function render() {
    var day = C.byDate(selected) || C.DAYS[0];
    var week = C.DAYS.slice(0, 9);
    var events = dayEvents(day);
    var isToday = day.date === today;

    root.innerHTML =
      '<nav class="breadcrumbs in-shell"><a href="index.html">Главная</a><span>/</span><span>Календарь</span></nav>' +
      '<header class="cal-hero">' +
      '<div class="cal-hero-top">' +
      '<p class="eyebrow">' + (isToday ? 'Сегодня' : esc(day.weekday)) + '</p>' +
      '<p class="cal-hero-date">' + esc(fmtLong(day.date)) + '</p>' +
      '</div>' +
      '<div class="cal-hero-main">' +
      '<span class="cal-rank cal-rank-' + esc(rankClass(day.liturgical.rank)) + '">' + esc(day.liturgical.rank) + '</span>' +
      '<h1>' + esc(day.liturgical.title) + '</h1>' +
      '<p class="cal-hero-meta">Литургический цвет: <b>' + esc(day.liturgical.color) + '</b></p>' +
      (day.liturgical.note ? '<p class="cal-hero-note">' + esc(day.liturgical.note) + '</p>' : '') +
      '</div></header>' +

      '<div class="cal-week" role="tablist" aria-label="Дни недели">' +
      week.map(function (d) {
        return (
          '<button type="button" class="cal-week-day' +
          (d.date === selected ? ' on' : '') +
          (d.date === today ? ' is-today' : '') +
          '" data-date="' + esc(d.date) + '">' +
          '<span class="w">' + esc(d.weekday.slice(0, 2)) + '</span>' +
          '<span class="n">' + fmtDay(d.date) + '</span>' +
          '<span class="dot' + (d.liturgical.rank === 'торжество' || d.liturgical.rank === 'праздник' ? ' hot' : '') + '"></span>' +
          '</button>'
        );
      }).join('') +
      '</div>' +

      '<div class="cal-filters" role="tablist">' +
      '<button type="button" data-f="all"' + (filter === 'all' ? ' class="on"' : '') + '>Всё</button>' +
      '<button type="button" data-f="liturgy"' + (filter === 'liturgy' ? ' class="on"' : '') + '>Литургия</button>' +
      '<button type="button" data-f="ru"' + (filter === 'ru' ? ' class="on"' : '') + '>Россия</button>' +
      '</div>' +

      '<section class="cal-feed">' +
      '<h2>На этот день</h2>' +
      (events.length
        ? '<div class="cal-cards">' + events.map(cardHtml).join('') + '</div>'
        : '<p class="archive-empty">На этот день пока нет отдельных событий в ленте — смотрите литургическое название выше.</p>') +
      '</section>' +

      '<section class="cal-upcoming">' +
      '<h2>Ближайшая неделя</h2>' +
      '<div class="cal-agenda">' + agendaHtml() + '</div>' +
      '<p class="cal-footnote">Литургические дни — по общему римскому календарю. События РФ — по открытым анонсам Архиепархии и афише; уточняйте на местах.</p>' +
      '</section>';

    root.querySelectorAll('.cal-week-day').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selected = btn.getAttribute('data-date');
        render();
      });
    });
    root.querySelectorAll('.cal-filters button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        filter = btn.getAttribute('data-f');
        render();
      });
    });
  }

  function rankClass(r) {
    if (r === 'торжество') return 'solemn';
    if (r === 'праздник') return 'feast';
    if (r === 'память') return 'mem';
    if (r === 'воскресенье') return 'sun';
    return 'feria';
  }

  function cardHtml(e) {
    var external = /^https?:\/\//.test(e.href || '');
    return (
      '<a class="cal-card kind-' + esc(e.kind) + '" href="' + esc(e.href || '#') + '"' +
      (external ? ' target="_blank" rel="noopener"' : '') + '>' +
      '<div class="cal-card-top">' +
      '<span class="cal-chip">' + esc(kindLabel(e.kind)) + '</span>' +
      (e.scope ? '<span class="cal-chip ghost">' + esc(scopeLabel(e.scope)) + '</span>' : '') +
      (e.time ? '<span class="cal-time">' + esc(e.time) + '</span>' : '') +
      '</div>' +
      '<strong>' + esc(e.title) + '</strong>' +
      (e.place ? '<span class="cal-place">' + esc(e.place) + '</span>' : '') +
      (e.desc ? '<p>' + esc(e.desc) + '</p>' : '') +
      '</a>'
    );
  }

  function agendaHtml() {
    var start = C.byDate(today) ? today : C.DAYS[0].date;
    var week = C.weekFrom(start);
    return week.map(function (d) {
      var mark = d.liturgical.rank === 'торжество' || d.liturgical.rank === 'праздник';
      var ru = (d.events || []).filter(function (e) { return e.scope === 'ru'; }).length;
      return (
        '<button type="button" class="cal-agenda-row" data-date="' + esc(d.date) + '">' +
        '<span class="cal-agenda-date"><b>' + fmtDay(d.date) + '</b><small>' + esc(d.weekday.slice(0, 2)) + '</small></span>' +
        '<span class="cal-agenda-body">' +
        '<strong>' + esc(d.liturgical.title) + '</strong>' +
        '<small>' + esc(d.liturgical.rank) +
        (ru ? ' · ' + ru + ' событ. в РФ' : '') +
        '</small></span>' +
        (mark ? '<span class="cal-agenda-mark"></span>' : '') +
        '</button>'
      );
    }).join('');
  }

  // re-bind agenda after render via delegation once
  root.addEventListener('click', function (e) {
    var row = e.target.closest('.cal-agenda-row');
    if (!row) return;
    selected = row.getAttribute('data-date');
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  render();
})();
