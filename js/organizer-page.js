/** Карточка организатора афиши */
(function () {
  'use strict';
  var A = window.YakAfisha;
  var root = document.getElementById('organizer-root');
  if (!A || !root) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmtLong(iso) {
    var p = String(iso).split('-');
    var months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    return Number(p[2]) + ' ' + months[Number(p[1]) - 1];
  }

  var id = new URLSearchParams(location.search).get('id') || '';
  var org = A.organizerById(id);
  if (!org) {
    root.innerHTML =
      '<nav class="breadcrumbs in-shell"><a href="index.html">Главная</a><span>/</span><a href="events.html">Афиша</a><span>/</span><span>Не найден</span></nav>' +
      '<header class="page-head in-shell"><div><h1>Организатор не найден</h1></div></header>' +
      '<p><a class="wlink" href="events.html">← К афише</a></p>';
    return;
  }

  document.title = org.name + ' — Афиша — ЯКатолик';
  var events = A.byOrganizer(org.id, 24);

  root.innerHTML =
    '<nav class="breadcrumbs in-shell">' +
    '<a href="index.html">Главная</a><span>/</span><a href="events.html">Афиша</a><span>/</span><span>' + esc(org.short || org.name) + '</span></nav>' +
    '<section class="af-org-profile">' +
    '<span class="af-org-hero" style="background:linear-gradient(145deg,' + esc(org.coverTone || '#5c5346') + ',#1a1816)"></span>' +
    '<div class="af-org-profile-body">' +
    '<p class="eyebrow">Организатор</p>' +
    '<h1>' + esc(org.name) + '</h1>' +
    (org.city ? '<p class="af-org-city">' + esc(org.city) + (org.address ? ' · ' + esc(org.address) : '') + '</p>' : '') +
    '<p class="af-org-blurb">' + esc(org.blurb) + '</p>' +
    '<div class="af-org-contacts">' +
    (org.website ? '<a class="author-social" href="' + esc(org.website) + '" target="_blank" rel="noopener">Сайт</a>' : '') +
    (org.email ? '<a class="author-social" href="mailto:' + esc(org.email) + '">' + esc(org.email) + '</a>' : '') +
    (org.phone ? '<a class="author-social" href="tel:' + esc(org.phone) + '">' + esc(org.phone) + '</a>' : '') +
    (org.socials || []).map(function (s) {
      return '<a class="author-social" href="' + esc(s.href) + '" target="_blank" rel="noopener">' + esc(s.label) + '</a>';
    }).join('') +
    '</div>' +
    '<a class="wlink" href="events.html?org=' + encodeURIComponent(org.id) + '">Все анонсы в афише →</a>' +
    '</div></section>' +
    '<section class="af-org-events">' +
    '<h2 class="af-section-title">Ближайшие мероприятия</h2>' +
    (events.length
      ? '<div class="af-grid">' + events.map(function (e) {
          var external = /^https?:\/\//.test(e.href || '');
          return (
            '<a class="af-card" href="' + esc(e.href || 'events.html') + '"' +
            (external ? ' target="_blank" rel="noopener"' : '') + '>' +
            '<span class="af-card-cover" style="background:linear-gradient(155deg,' + esc(e.coverTone || org.coverTone || '#5c5346') + ',#1a1816)">' +
            '<span class="af-card-date"><b>' + esc(fmtLong(e.date)) + '</b>' +
            (e.time ? '<small>' + esc(e.time) + '</small>' : '') + '</span></span>' +
            '<span class="af-card-body">' +
            '<span class="af-card-chips"><span class="cal-chip">' + esc(A.categoryLabel(e.category)) + '</span></span>' +
            '<strong>' + esc(e.title) + '</strong>' +
            '<span class="cal-place">' + esc([e.venue, e.city].filter(Boolean).join(' · ')) + '</span>' +
            '</span></a>'
          );
        }).join('') + '</div>'
      : '<p class="archive-empty">Пока нет опубликованных анонсов</p>') +
    '</section>';
})();
