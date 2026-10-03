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

  var DESC_TAGS = { P: 1, BR: 1, STRONG: 1, B: 1, EM: 1, I: 1, U: 1, UL: 1, OL: 1, LI: 1, A: 1 };
  var DESC_DROP = { SCRIPT: 1, STYLE: 1, IFRAME: 1, OBJECT: 1, EMBED: 1, TEMPLATE: 1, SVG: 1 };

  function cleanDesc(html) {
    var tpl = document.createElement('template');
    tpl.innerHTML = String(html || '');
    (function walk(parent) {
      [].slice.call(parent.childNodes).forEach(function (n) {
        if (n.nodeType === 3) return;
        if (n.nodeType !== 1 || DESC_DROP[n.tagName.toUpperCase()]) {
          parent.removeChild(n);
          return;
        }
        walk(n);
        if (!DESC_TAGS[n.tagName]) {
          while (n.firstChild) parent.insertBefore(n.firstChild, n);
          parent.removeChild(n);
          return;
        }
        var href = n.tagName === 'A' ? extHref(n.getAttribute('href')) : '';
        [].slice.call(n.attributes).forEach(function (a) { n.removeAttribute(a.name); });
        if (href) {
          n.setAttribute('href', href);
          n.setAttribute('target', '_blank');
          n.setAttribute('rel', 'noopener');
        }
      });
    })(tpl.content);
    var box = document.createElement('div');
    box.appendChild(tpl.content);
    return box.innerHTML;
  }

  function descBlock(e) {
    var html = e.descHtml ? cleanDesc(e.descHtml) : '';
    if (!html.replace(/<[^>]+>/g, '').trim()) {
      html = String(e.desc || '').split(/\n+/).map(function (p) {
        p = p.trim();
        return p ? '<p>' + esc(p) + '</p>' : '';
      }).join('');
    }
    return html ? '<div class="af-event-lead af-event-desc">' + html + '</div>' : '';
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
      descBlock(e) +
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
