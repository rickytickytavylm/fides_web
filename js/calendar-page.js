/** День Церкви — только литургический день */
(function () {
  'use strict';
  var C = window.YakCalendar;
  var root = document.getElementById('calendar-root');
  if (!C || !root) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmtDay(iso) { return Number(String(iso).split('-')[2]); }
  function fmtLong(iso) {
    var p = String(iso).split('-');
    var months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    return Number(p[2]) + ' ' + months[Number(p[1]) - 1];
  }
  function rankClass(r) {
    if (r === 'торжество') return 'solemn';
    if (r === 'праздник') return 'feast';
    if (r === 'память') return 'mem';
    if (r === 'воскресенье') return 'sun';
    return 'feria';
  }

  var today = C.todayIso();
  var selected = C.byDate(today) ? today : (C.DAYS[0] && C.DAYS[0].date);

  function render() {
    var day = C.byDate(selected) || C.DAYS[0];
    var week = C.DAYS;
    var isToday = day.date === today;
    var dayEvents = C.eventsOn(day.date);
    var L = day.liturgical;

    root.innerHTML =
      '<nav class="breadcrumbs in-shell"><a href="index.html">Главная</a><span>/</span><span>День Церкви</span></nav>' +
      '<header class="cal-hero">' +
      '<div class="cal-hero-top">' +
      '<p class="eyebrow">День Церкви</p>' +
      '<p class="cal-hero-date">' + (isToday ? 'Сегодня · ' : '') + esc(day.weekday) + ', ' + esc(fmtLong(day.date)) + '</p>' +
      '</div>' +
      '<div class="cal-hero-main">' +
      '<span class="cal-rank cal-rank-' + esc(rankClass(L.rank)) + '">' + esc(L.rank) + '</span>' +
      '<h1>' + esc(L.title) + '</h1>' +
      '<p class="cal-hero-meta">Литургический цвет: <b>' + esc(L.color) + '</b></p>' +
      (L.note ? '<p class="cal-hero-note">' + esc(L.note) + '</p>' : '') +
      '</div></header>' +

      '<div class="cal-week" role="tablist" aria-label="Дни">' +
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

      (dayEvents.length
        ? '<aside class="cal-afisha-hint">' +
          '<p><strong>На этот день в афише:</strong> ' + dayEvents.length + ' ' +
          (dayEvents.length === 1 ? 'событие' : 'события') +
          '</p><a class="wlink" href="events.html?date=' + encodeURIComponent(day.date) + '">Открыть афишу →</a></aside>'
        : '') +

      '<section class="cal-upcoming">' +
      '<h2>Ближайшие дни</h2>' +
      '<div class="cal-agenda">' +
      C.weekFrom(selected).map(function (d) {
        var mark = d.liturgical.rank === 'торжество' || d.liturgical.rank === 'праздник';
        return (
          '<button type="button" class="cal-agenda-row" data-date="' + esc(d.date) + '">' +
          '<span class="cal-agenda-date"><b>' + fmtDay(d.date) + '</b><small>' + esc(d.weekday.slice(0, 2)) + '</small></span>' +
          '<span class="cal-agenda-body">' +
          '<strong>' + esc(d.liturgical.title) + '</strong>' +
          '<small>' + esc(d.liturgical.rank) + ' · ' + esc(d.liturgical.color) + '</small></span>' +
          (mark ? '<span class="cal-agenda-mark"></span>' : '') +
          '</button>'
        );
      }).join('') +
      '</div>' +
      '<p class="cal-footnote">Это литургический «День Церкви», а не афиша мероприятий. Концерты, престольные праздники и встречи — в разделе <a href="events.html">Афиша</a>.</p>' +
      '</section>';

    root.querySelectorAll('.cal-week-day, .cal-agenda-row').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selected = btn.getAttribute('data-date');
        render();
        if (btn.classList.contains('cal-agenda-row')) window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  render();
})();
