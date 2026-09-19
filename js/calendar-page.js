/** День Церкви — карточка текущего дня с сервера. */
(function () {
  'use strict';
  var C = window.YakCalendar;
  var root = document.getElementById('calendar-root');
  if (!C || !root) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmtLong(iso) {
    var p = String(iso).split('-');
    var months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    return Number(p[2]) + ' ' + months[Number(p[1]) - 1] + ' ' + p[0];
  }
  function categoryClass(cat) {
    if (cat === 'торжество') return 'solemn';
    if (cat === 'праздник') return 'feast';
    if (cat === 'память') return 'mem';
    if (cat === 'воскресный' || cat === 'воскресенье') return 'sun';
    return 'feria';
  }
  function categoryLabel(cat) {
    if (cat === 'воскресенье') return 'воскресный';
    return cat || 'будний';
  }
  function block(label, bodyHtml) {
    if (!bodyHtml) return '';
    return (
      '<div class="cal-block">' +
      '<h3>' + esc(label) + '</h3>' +
      '<div class="cal-block-body">' + bodyHtml + '</div></div>'
    );
  }
  function allowSaint(html) {
    var box = document.createElement('div');
    box.innerHTML = html || '';
    box.querySelectorAll('script,style,iframe,img,object').forEach(function (n) { n.remove(); });
    box.querySelectorAll('*').forEach(function (n) {
      var tag = n.tagName.toLowerCase();
      if (['p', 'a', 'strong', 'em', 'b', 'i', 'br', 'span'].indexOf(tag) === -1) {
        var t = document.createElement('span');
        t.innerHTML = n.innerHTML;
        n.parentNode.replaceChild(t, n);
        return;
      }
      [].forEach.call(n.attributes, function (a) {
        if (a.name !== 'href' && a.name !== 'target' && a.name !== 'rel') n.removeAttribute(a.name);
      });
      if (tag === 'a') {
        var href = n.getAttribute('href') || '';
        if (!/^https?:|^\/|^mailto:|#/i.test(href)) n.removeAttribute('href');
        else {
          n.setAttribute('rel', 'noopener');
          if (/^https?:/i.test(href)) n.setAttribute('target', '_blank');
        }
      }
    });
    return box.innerHTML;
  }
  function saintHtml(saint) {
    if (!saint) return '';
    if (saint.html) return allowSaint(saint.html);
    if (saint.name && saint.href) {
      return '<a class="cal-saint-link" href="' + esc(saint.href) + '">' + esc(saint.name) + '</a>';
    }
    if (saint.name) return '<p>' + esc(saint.name) + '</p>';
    return '';
  }

  function render() {
    var today = C.todayIso();
    var day = (C.dayFor && C.dayFor(today)) || C.byDate(today) || stubLocal(today);
    var dayEvents = C.eventsOn(day.date);
    var L = day.liturgical || {};
    var cat = categoryLabel(L.category || L.rank);
    var hasBody = !!(L.title || (L.saint && (L.saint.name || L.saint.html)) || L.reading || L.prayer || L.quote);

    root.innerHTML =
      '<nav class="breadcrumbs in-shell"><a href="index.html">Главная</a><span>/</span><span>День Церкви</span></nav>' +

      '<header class="cal-hero">' +
      '<div class="cal-hero-top">' +
      '<p class="eyebrow">День Церкви</p>' +
      '<p class="cal-hero-date">Сегодня · ' +
      esc(day.weekday || '') + ' · ' + esc(fmtLong(day.date)) +
      '</p></div>' +
      '<div class="cal-hero-main">' +
      '<span class="cal-rank cal-rank-' + esc(categoryClass(cat)) + '">' + esc(cat) + '</span>' +
      '<h1>' + (esc(L.title || '') || 'День Церкви') + '</h1>' +
      (L.color ? '<p class="cal-hero-meta">Литургический цвет: <b>' + esc(L.color) + '</b></p>' : '') +
      '</div>' +
      '<div class="cal-hero-fields">' +
      block('Святой дня', saintHtml(L.saint)) +
      block('Чтение дня', L.reading ? '<p>' + esc(L.reading) + '</p>' : '') +
      block('Молитва дня', L.prayer ? '<p>' + esc(L.prayer) + '</p>' : '') +
      block('Цитата дня', L.quote ? '<p class="cal-quote">' + esc(L.quote) + '</p>' : '') +
      (!hasBody ? '<p class="cal-empty">Редакция ещё не заполнила карточку на сегодня.</p>' : '') +
      '</div></header>' +

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
  }

  function stubLocal(iso) {
    return { date: iso, weekday: '', liturgical: {} };
  }

  render();
  if (C.onPack) C.onPack(render);
})();
