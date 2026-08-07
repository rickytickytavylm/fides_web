/** День Церкви — литургическая карточка дня + лента из 7 дат */
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
    return Number(p[2]) + ' ' + months[Number(p[1]) - 1] + ' ' + p[0];
  }
  function categoryClass(cat) {
    if (cat === 'торжество') return 'solemn';
    if (cat === 'праздник') return 'feast';
    if (cat === 'воскресный' || cat === 'воскресенье') return 'sun';
    return 'feria';
  }
  function categoryLabel(cat) {
    if (cat === 'воскресенье') return 'воскресный';
    return cat || 'будний';
  }
  function wdShort(d) {
    return C.weekdayShort ? C.weekdayShort(d.weekday) : String(d.weekday || '').slice(0, 2).toLowerCase();
  }
  function block(label, bodyHtml) {
    if (!bodyHtml) return '';
    return (
      '<div class="cal-block">' +
      '<h3>' + esc(label) + '</h3>' +
      '<div class="cal-block-body">' + bodyHtml + '</div></div>'
    );
  }
  function saintHtml(saint) {
    if (!saint || !saint.name) return '';
    if (saint.href) {
      return '<a class="cal-saint-link" href="' + esc(saint.href) + '">' + esc(saint.name) + '</a>';
    }
    return '<p>' + esc(saint.name) + '</p>';
  }

  var today = C.todayIso();
  var selected = C.byDate(today) ? today : (C.DAYS[0] && C.DAYS[0].date);

  function weekStrip() {
    var week = C.weekFrom(selected);
    if (!week.some(function (d) { return d.date === selected; })) {
      week = C.weekFrom(today);
    }
    return week.slice(0, 7);
  }

  function render() {
    var day = C.byDate(selected) || C.DAYS[0];
    var week = weekStrip();
    var isToday = day.date === today;
    var dayEvents = C.eventsOn(day.date);
    var L = day.liturgical || {};
    var cat = categoryLabel(L.category || L.rank);

    root.innerHTML =
      '<nav class="breadcrumbs in-shell"><a href="index.html">Главная</a><span>/</span><span>День Церкви</span></nav>' +

      '<header class="cal-hero">' +
      '<div class="cal-hero-top">' +
      '<p class="eyebrow">День Церкви</p>' +
      '<p class="cal-hero-date">' +
      (isToday ? 'Сегодня · ' : '') +
      esc(day.weekday) + ' · ' + esc(fmtLong(day.date)) +
      '</p></div>' +
      '<div class="cal-hero-main">' +
      '<span class="cal-rank cal-rank-' + esc(categoryClass(cat)) + '">' + esc(cat) + '</span>' +
      '<h1>' + esc(L.title || '') + '</h1>' +
      (L.color ? '<p class="cal-hero-meta">Литургический цвет: <b>' + esc(L.color) + '</b></p>' : '') +
      '</div>' +
      '<div class="cal-hero-fields">' +
      block('Святой дня', saintHtml(L.saint)) +
      block('Чтение дня', L.reading ? '<p>' + esc(L.reading) + '</p>' : '') +
      block('Молитва дня', L.prayer ? '<p>' + esc(L.prayer) + '</p>' : '') +
      block('Цитата дня', L.quote ? '<p class="cal-quote">' + esc(L.quote) + '</p>' : '') +
      '</div></header>' +

      '<section class="cal-week-wrap">' +
      '<h2 class="cal-week-title">Ближайшие дни</h2>' +
      '<div class="cal-week" role="tablist" aria-label="Семь дней">' +
      week.map(function (d) {
        var hot = d.liturgical && (d.liturgical.category === 'торжество' || d.liturgical.category === 'праздник');
        var hasEv = C.eventsOn(d.date).length > 0;
        return (
          '<button type="button" class="cal-week-day' +
          (d.date === selected ? ' on' : '') +
          (d.date === today ? ' is-today' : '') +
          '" data-date="' + esc(d.date) + '" aria-pressed="' + (d.date === selected ? 'true' : 'false') + '">' +
          '<span class="w">' + esc(wdShort(d)) + '</span>' +
          '<span class="n">' + fmtDay(d.date) + '</span>' +
          '<span class="dot' + (hot ? ' hot' : '') + (hasEv && !hot ? ' event' : '') + '"></span>' +
          '</button>'
        );
      }).join('') +
      '</div></section>' +

      (dayEvents.length
        ? '<aside class="cal-afisha-hint">' +
          '<div><p><strong>На этот день в афише</strong></p>' +
          '<ul class="cal-afisha-list">' +
          dayEvents.map(function (e) {
            return '<li>' + esc(e.title) + (e.time ? ' · ' + esc(e.time) : '') + '</li>';
          }).join('') +
          '</ul></div>' +
          '<a class="wlink" href="events.html?date=' + encodeURIComponent(day.date) + '">Открыть афишу →</a></aside>'
        : '') +

      '<p class="cal-footnote">Это литургический «День Церкви», а не афиша мероприятий. Концерты, престольные праздники и встречи — в разделе <a href="events.html">Афиша</a>.</p>';

    root.querySelectorAll('.cal-week-day').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selected = btn.getAttribute('data-date');
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  render();
})();
