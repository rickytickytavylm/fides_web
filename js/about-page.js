(function () {
  'use strict';
  var root = document.getElementById('about-root');
  var A = window.YakAbout;
  if (!root || !A) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function render() {
    var d = A.get();
    var donate = d.donate || {};
    var app = d.app || {};
    var cover = d.cover
      ? '<figure class="static-photo"><img src="' + esc(d.cover) + '" alt="" /></figure>'
      : '<figure class="static-photo"><div class="hero-photo img-people-3"></div></figure>';

    root.innerHTML =
      '<nav class="breadcrumbs" aria-label="Хлебные крошки"><a href="index.html">Главная</a><span>/</span><a href="page.html">О проекте</a></nav>' +
      '<header class="static-head">' +
      '<p class="eyebrow">' + esc(d.eyebrow || 'О проекте') + '</p>' +
      '<h1>' + (d.titleHtml || '') + '</h1></header>' +
      cover +
      '<div class="article-body static-body">' + (d.descriptionHtml || '') +
      (d.principlesTitle ? '<h2>' + esc(d.principlesTitle) + '</h2>' : '') +
      '</div>' +
      '<section class="principles">' +
      (d.principles || []).map(function (p, i) {
        if (!p || (!p.title && !p.text)) return '';
        return (
          '<article class="principle">' +
          '<span>0' + (i + 1) + '</span>' +
          '<h3>' + esc(p.title) + '</h3>' +
          '<p>' + esc(p.text) + '</p></article>'
        );
      }).join('') +
      '</section>' +
      '<section class="support-block">' +
      '<div class="support-inner">' +
      '<p class="eyebrow">' + esc(donate.eyebrow || 'Поддержите нас') + '</p>' +
      '<h2>' + (donate.titleHtml || '') + '</h2>' +
      '<p class="support-text">' + esc(donate.text || '') + '</p>' +
      '<div class="amount-row">' +
      '<button class="amount" type="button">300 ₽</button>' +
      '<button class="amount active" type="button">1 000 ₽</button>' +
      '<button class="amount" type="button">3 000 ₽</button>' +
      '<button class="amount" type="button">Другая сумма</button></div>' +
      '<a class="solid-button" href="' + esc(donate.mailto || 'mailto:red@yacatholic.ru') + '">Поддержать проект <span>→</span></a>' +
      '<p class="note">Разовое пожертвование или ежемесячная подписка. Отменить можно в любой момент.</p>' +
      '</div></section>' +
      '<section class="app-download" id="app">' +
      '<p class="eyebrow">' + esc(app.eyebrow || 'Приложение') + '</p>' +
      '<h2>' + esc(app.title || '') + '</h2>' +
      '<div class="app-download-body">' + (app.html || '') + '</div>' +
      (app.photo ? '<div class="app-download-photo"><img src="' + esc(app.photo) + '" alt="" /></div>' : '') +
      '</section>' +
      '<section class="section partners">' +
      '<div class="section-top"><p class="eyebrow">Партнёры</p><h2>' + esc(d.partnersTitle || 'С кем мы работаем') + '</h2></div>' +
      '<div class="partner-grid">' +
      (d.partners || []).map(function (p) {
        if (!p || !p.name) return '';
        var inner = esc(p.name);
        if (p.href) {
          return '<a class="partner" href="' + esc(p.href) + '" target="_blank" rel="noopener">' + inner + '</a>';
        }
        return '<div class="partner">' + inner + '</div>';
      }).join('') +
      '</div></section>' +
      '<section class="section contacts-section">' +
      '<div class="section-top"><p class="eyebrow">Контакты</p><h2>Написать редакции</h2></div>' +
      '<div class="contact-grid contact-grid--three">' +
      (d.contacts || []).map(function (c) {
        if (!c || !c.label) return '';
        var val = c.href
          ? '<a href="' + esc(c.href) + '">' + esc(c.value || c.href) + '</a>'
          : '<span>' + esc(c.value || '') + '</span>';
        return '<div class="contact"><p class="eyebrow">' + esc(c.label) + '</p>' + val + '</div>';
      }).join('') +
      '</div></section>';

    root.querySelectorAll('.amount').forEach(function (btn) {
      btn.addEventListener('click', function () {
        root.querySelectorAll('.amount').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
    });
  }

  render();
  if (A.onPack) A.onPack(render);
})();
