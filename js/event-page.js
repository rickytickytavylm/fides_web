/** Страница одного события афиши */
(function () {
  'use strict';
  var A = window.YakAfisha;
  var root = document.getElementById('event-root');
  if (!A || !root) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fmtLong(iso) {
    if (!iso) return '';
    var p = String(iso).split('-');
    var months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return Number(p[2]) + ' ' + months[Number(p[1]) - 1] + ' ' + p[0];
  }

  function dateLine(e) {
    var start = fmtLong(e.date);
    var end = e.endDate && e.endDate !== e.date ? fmtLong(e.endDate) : '';
    var day = end ? start + ' — ' + end : start;
    return e.time ? day + ', ' + e.time : day;
  }

  function extHref(url) {
    url = String(url || '').trim();
    if (!url || url === '#' || url.indexOf('map.html') === 0) return '';
    if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) return '';
    return url;
  }

  function paint() {
    var id = new URLSearchParams(location.search).get('id') || '';
    var e = A.byId(id);
    if (!e) {
      root.innerHTML =
        '<nav class="breadcrumbs in-shell"><a href="index.html">Главная</a><span>/</span><a href="events.html">Афиша</a><span>/</span><span>Не найдено</span></nav>' +
        '<header class="page-head in-shell"><div><h1>Событие не найдено</h1></div></header>' +
        '<p><a class="wlink" href="events.html">← К афише</a></p>';
      return;
    }

    var orgName = A.organizerName(e);
    var org = A.organizerById(e.organizerId);
    var cover = A.eventCover(e);
    var tone = e.coverTone || (org && org.coverTone) || '#5c5346';
    var more = extHref(e.href);
    var coverStyle = cover
      ? 'background-image:url(\'' + esc(cover) + '\')'
      : 'background:linear-gradient(155deg,' + esc(tone) + ',#1a1816)';

    document.title = e.title + ' — Афиша · ЯКатолик';

    var facts = [
      ['Когда', dateLine(e)],
      ['Город', e.city],
      ['Адрес', e.place],
      ['Организатор', orgName],
      ['Стоимость', A.costLabel(e.cost)],
      ['Регистрация', A.regLabel(e.registration)]
    ].filter(function (row) { return row[1]; });

    root.innerHTML =
      '<nav class="breadcrumbs in-shell">' +
      '<a href="index.html">Главная</a><span>/</span>' +
      '<a href="events.html">Афиша</a><span>/</span><span>' + esc(e.title) + '</span></nav>' +
      '<article class="af-event">' +
      '<div class="af-event-top">' +
      '<div class="af-event-cover' + (cover ? ' has-photo' : '') + '" style="' + coverStyle + '"></div>' +
      '<div class="af-event-main">' +
      '<p class="lib-card-cat">' + esc(A.categoryLabel(e.category)) + '</p>' +
      '<h1>' + esc(e.title) + '</h1>' +
      '<div class="af-event-chips">' +
      '<span class="cal-chip">' + esc(A.costLabel(e.cost)) + '</span>' +
      '<span class="cal-chip ghost">' + esc(A.regLabel(e.registration)) + '</span>' +
      '</div>' +
      (e.desc ? '<p class="af-event-lead">' + esc(e.desc) + '</p>' : '') +
      '<div class="lib-meta">' +
      facts.map(function (row) {
        var val = row[0] === 'Организатор' && org
          ? '<a class="lib-author-link" href="organizer.html?id=' + encodeURIComponent(org.id) + '">' + esc(row[1]) + '</a>'
          : esc(row[1]);
        return '<div><span>' + esc(row[0]) + '</span><strong>' + val + '</strong></div>';
      }).join('') +
      '</div>' +
      (more
        ? '<a class="af-event-out" href="' + esc(more) + '" target="_blank" rel="noopener">Подробности — на сайте организатора</a>'
        : '') +
      '</div></div>' +
      '<p class="cal-footnote">Время и детали уточняйте у организаторов · <a href="events.html">К афише</a></p>' +
      '</article>';
  }

  paint();
  if (A.onPack) A.onPack(paint);
})();
