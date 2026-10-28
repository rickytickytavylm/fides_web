(function () {
  'use strict';
  var root = document.getElementById('about-root');
  var A = window.YakAbout;
  if (!root || !A) return;
  var painted = false;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function personCard(p) {
    if (!p || (!p.title && !p.text && !p.photo)) return '';
    return (
      '<article class="principle principle--person">' +
      (p.photo ? '<img class="principle-photo" src="' + esc(p.photo) + '" alt="" />' : '') +
      '<div>' +
      (p.title ? '<h3>' + esc(p.title) + '</h3>' : '') +
      (p.text ? '<p>' + esc(p.text) + '</p>' : '') +
      '</div></article>'
    );
  }

  function scrollApp() {
    if (location.hash !== '#app') return;
    var el = document.getElementById('app');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function artPhoto(desk, mobile, className) {
    desk = desk || '';
    mobile = mobile || '';
    /* Встроенный кадр сайта не перекрывает обложку, которую редакция поставила в админке. */
    if (/^assets\//.test(mobile) && desk && !/^assets\//.test(desk)) mobile = '';
    if (!desk && !mobile) return '';
    var inner;
    if (mobile && desk && mobile !== desk) {
      inner = '<picture><source media="(max-width: 880px)" srcset="' + esc(mobile) + '" /><img src="' + esc(desk) + '" alt="" /></picture>';
    } else {
      inner = '<img src="' + esc(desk || mobile) + '" alt="" />';
    }
    return '<figure class="' + className + '">' + inner + '</figure>';
  }

  function render() {
    var d = A.get();
    var donate = d.donate || {};
    var app = d.app || {};
    var qrs = donate.qrs || [];
    var links = app.links || [];
    var authors = app.authors || [];
    var cover = artPhoto(d.cover, d.coverMobile, 'static-photo');

    function qrImg(q) {
      if (!q || !q.image) return '';
      return '<figure class="support-qr"><img src="' + esc(q.image) + '" alt="" /></figure>';
    }
    function pickQr(re) {
      return (qrs || []).filter(function (q) {
        return q && q.image && re.test(String(q.label || ''));
      })[0] || null;
    }
    var portalQr = pickQr(/портал/i);
    var appQr = pickQr(/приложен/i);
    var supportText = donate.textHtml || '';
    var portalCard = (supportText || portalQr)
      ? '<aside class="about-support">' +
        '<h2>' + esc(donate.eyebrow || 'Поддержите нас') + '</h2>' +
        supportText +
        qrImg(portalQr) +
        '</aside>'
      : '';
    var appAuthorsHtml = authors.length
      ? '<div class="app-authors"><h3>Авторы приложения</h3><section class="principles">' +
        authors.map(personCard).join('') + '</section></div>'
      : '';
    var appQrHtml = appQr
      ? '<aside class="about-support about-support--app">' +
        '<h3>' + esc(appQr.label || 'Поддержать приложение') + '</h3>' +
        '<p>Ваши пожертвования пойдут на оплату технических расходов и развитие новых сервисов.</p>' +
        qrImg(appQr) +
        '</aside>'
      : '';

    root.innerHTML =
      '<nav class="breadcrumbs" aria-label="Хлебные крошки"><a href="index.html">Главная</a><span>/</span><a href="page.html">О проекте</a></nav>' +
      '<header class="static-head">' +
      '<p class="eyebrow">' + esc(d.eyebrow || 'О проекте') + '</p>' +
      '<h1>' + (d.titleHtml || '') + '</h1></header>' +
      cover +
      '<div class="about-intro">' +
      '<div class="article-body static-body">' + (d.descriptionHtml || '') + '</div>' +
      portalCard +
      '</div>' +
      (d.principlesTitle ? '<h2 class="about-team-title">' + esc(d.principlesTitle) + '</h2>' : '') +
      '<section class="principles">' +
      (d.principles || []).map(personCard).join('') +
      '</section>' +
      '<section class="app-download app-download--wide" id="app">' +
      '<p class="eyebrow">' + esc(app.eyebrow || 'Приложение') + '</p>' +
      '<h2>' + esc(app.title || '') + '</h2>' +
      (app.subtitle ? '<p class="app-subtitle">' + esc(app.subtitle) + '</p>' : '') +
      (app.photo ? '<div class="app-download-photo"><img src="' + esc(app.photo) + '" alt="" /></div>' : '') +
      (links.length
        ? '<div class="app-link-row">' + links.map(function (l) {
          if (!l || !l.href) return '';
          return '<a class="app-store-btn" href="' + esc(l.href) + '">' + esc(l.label || l.href) + '</a>';
        }).join('') + '</div>'
        : '') +
      '<div class="app-download-body">' + (app.html || '') + '</div>' +
      ((appAuthorsHtml || appQrHtml) ? '<div class="app-support-row">' + appAuthorsHtml + appQrHtml + '</div>' : '') +
      '</section>' +
      '<section class="section partners">' +
      '<div class="section-top"><p class="eyebrow">Партнёры</p><h2>' + esc(d.partnersTitle || 'С кем мы работаем') + '</h2></div>' +
      '<div class="partner-grid">' +
      (d.partners || []).map(function (p) {
        if (!p || !p.name) return '';
        var inner = esc(p.name);
        if (p.href) {
          return '<a class="partner" href="' + esc(p.href) + '">' + inner + '</a>';
        }
        return '<div class="partner">' + inner + '</div>';
      }).join('') +
      '</div></section>' +
      '<section class="section contacts-section">' +
      '<div class="section-top"><p class="eyebrow">Контакты</p><h2>' + esc(d.contactsTitle || 'Написать редакции') + '</h2></div>' +
      '<div class="partner-grid contact-grid--partners">' +
      (d.contacts || []).map(function (c) {
        if (!c || !c.label) return '';
        var val = c.textHtml
          ? c.textHtml
          : (c.href
            ? '<a href="' + esc(c.href) + '">' + esc(c.value || c.href) + '</a>'
            : '<span>' + esc(c.value || '') + '</span>');
        var social = /соцсет/i.test(c.label || '');
        return '<div class="partner contact' + (social ? ' contact--social' : '') + '"><p class="eyebrow">' + esc(c.label) + '</p><div class="contact-value">' + val + '</div></div>';
      }).join('') +
      '</div></section>';

    painted = true;
    if (location.hash === '#app') setTimeout(scrollApp, 40);
  }

  if (A.onPack) A.onPack(function () {
    render();
    setTimeout(scrollApp, 40);
  });
  window.addEventListener('hashchange', scrollApp);
})();
