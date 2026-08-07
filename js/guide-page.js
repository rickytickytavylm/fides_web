(function () {
  'use strict';
  var V = window.Vera;
  var G = window.YakGuides;
  if (!G) return;

  var root = document.getElementById('guide-root');
  if (!root) return;

  var sectionKey = root.getAttribute('data-section') || 'church';
  var file = sectionKey === 'spirit' ? 'spiritual-life.html' : 'church.html';
  var tree = G[sectionKey];
  if (!tree) return;

  var params = new URLSearchParams(location.search);
  var path = params.get('path') || '';

  function esc(s) {
    return V ? V.escapeHtml(s) : String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function hrefFor(card) {
    if (card.href) return card.href;
    return file + '?path=' + encodeURIComponent(card.id);
  }

  function toneClass(card, i) {
    var classes;
    if (card.wide || card.tone === 'wide') classes = 'route-card wide tone-wide';
    else {
      var t = card.tone || ('abcd'[i % 4]);
      classes = 'route-card tone-' + t;
    }
    return classes + (card.image ? ' has-image' : '');
  }

  function renderCards(cards, opts) {
    opts = opts || {};
    var html = '<div class="route-grid">';
    cards.forEach(function (c, i) {
      var imageStyle = c.image
        ? ' style="--card-image:url(\'' + esc(c.image) + '\')"'
        : '';
      html +=
        '<a class="' + toneClass(c, i) + '"' + imageStyle + ' href="' + esc(hrefFor(c)) + '">' +
        '<span class="route-kicker">' + esc(opts.kicker || 'Открыть') + '</span>' +
        '<strong>' + esc(c.title) + '</strong>' +
        (c.sub ? '<span class="route-sub">' + esc(c.sub) + '</span>' : '') +
        '</a>';
    });
    if (opts.extra) {
      var extraImg = opts.extra.image
        ? ' style="--card-image:url(\'' + esc(opts.extra.image) + '\')"'
        : '';
      var extraClass = 'route-card wide tone-accent' + (opts.extra.image ? ' has-image' : '');
      html +=
        '<a class="' + extraClass + '"' + extraImg + ' href="' + esc(opts.extra.href) + '">' +
        '<span class="route-kicker">Дальше</span>' +
        '<strong>' + esc(opts.extra.title) + '</strong></a>';
    }
    html += '</div>';
    return html;
  }

  function crumbs(parts) {
    var html = '<nav class="breadcrumbs in-shell" aria-label="Хлебные крошки">';
    parts.forEach(function (p, i) {
      if (i) html += '<span>/</span>';
      if (p.href && i < parts.length - 1) html += '<a href="' + esc(p.href) + '">' + esc(p.label) + '</a>';
      else html += '<span>' + esc(p.label) + '</span>';
    });
    return html + '</nav>';
  }

  function head(title, desc) {
    return (
      '<header class="page-head in-shell"><div>' +
      '<p class="eyebrow">' + esc(tree.title) + '</p>' +
      '<h1>' + esc(title) + '</h1></div>' +
      (desc ? '<p class="page-desc">' + esc(desc) + '</p>' : '') +
      '</header>'
    );
  }

  function siblingBlock(node) {
    if (!node.siblingsOf || !tree.nodes[node.siblingsOf]) return '';
    var parent = tree.nodes[node.siblingsOf];
    var cards = (parent.cards || []).filter(function (c) {
      return c.id !== path;
    });
    var extra = tree.moreCard || null;
    var html = '<section class="guide-more"><h2>Ещё в этом маршруте</h2>';
    html += renderCards(cards, { kicker: 'Маршрут', extra: extra });
    return html + '</section>';
  }

  function alsoBlock(node) {
    if (!node.also || !node.also.length) return '';
    var html = '<div class="guide-also"><h3>Полезные ссылки</h3><ul>';
    node.also.forEach(function (a) {
      html += '<li><a href="' + esc(a.href) + '">' + esc(a.title) + '</a></li>';
    });
    return html + '</ul></div>';
  }

  function bodyBlock(node) {
    var html = '<article class="guide-body">';
    if (node.lead) html += '<p class="guide-lead">' + esc(node.lead) + '</p>';
    (node.body || []).forEach(function (block) {
      if (!block) return;
      if (block.h2) html += '<h2>' + esc(block.h2) + '</h2>';
      if (block.p) html += '<p>' + esc(block.p) + '</p>';
      if (block.note) html += '<p class="guide-note">' + esc(block.note) + '</p>';
      if (block.ul && block.ul.length) {
        html += '<ul>';
        block.ul.forEach(function (li) { html += '<li>' + esc(li) + '</li>'; });
        html += '</ul>';
      }
      if (block.ol && block.ol.length) {
        html += '<ol>';
        block.ol.forEach(function (li) { html += '<li>' + esc(li) + '</li>'; });
        html += '</ol>';
      }
    });
    if (!node.lead && !(node.body && node.body.length)) {
      html += '<p>Материал готовится.</p>';
    }
    return html + '</article>';
  }

  function feedBlock(node) {
    if (!node.feedCategory || !V) return '';
    var boxId = 'guide-feed';
    setTimeout(function () {
      var el = document.getElementById(boxId);
      if (!el) return;
      el.innerHTML = '<div class="spinner" aria-label="Загрузка"></div>';
      V.getArticles({ category: node.feedCategory, limit: 6 })
        .then(function (pack) {
          var items = pack.items || [];
          if (!items.length) {
            el.innerHTML = '<p class="archive-empty">Пока нет материалов</p>';
            return;
          }
          el.innerHTML = items.map(function (it) {
            return (
              '<a class="art" href="' + V.articleHref(it) + '">' +
              '<div class="ph" ' + V.coverStyle(it.image) + '></div>' +
              '<div class="in"><div class="rub">' + esc((it.categories && it.categories[0]) || '') + '</div>' +
              '<h4>' + esc(it.title) + '</h4></div></a>'
            );
          }).join('');
        })
        .catch(function () {
          el.innerHTML = '<p class="archive-empty">Не удалось загрузить</p>';
        });
    }, 0);
    return (
      '<section class="guide-feed"><h2>' + esc(node.feedLabel || 'Материалы') + '</h2>' +
      '<div class="art-grid" id="' + boxId + '"></div></section>'
    );
  }

  function renderHub() {
    document.title = tree.title + ' — ЯКатолик';
    root.innerHTML =
      crumbs([{ label: 'Главная', href: 'index.html' }, { label: tree.title }]) +
      head(tree.title, tree.desc) +
      renderCards(tree.cards, { kicker: 'Маршрут' });
  }

  function renderNavigator(node) {
    document.title = node.title + ' — ЯКатолик';
    var html =
      crumbs([
        { label: 'Главная', href: 'index.html' },
        { label: tree.title, href: file },
        { label: node.title },
      ]) +
      head(node.title, node.desc) +
      '<div class="nav-groups">';
    (node.groups || []).forEach(function (g) {
      html += '<section class="nav-group"><h2>' + esc(g.title) + '</h2><ul class="nav-list">';
      (g.items || []).forEach(function (it) {
        if (typeof it === 'string') {
          html += '<li><span>' + esc(it) + '</span></li>';
        } else {
          html += '<li><a href="' + esc(it.href) + '">' + esc(it.title) + '</a></li>';
        }
      });
      html += '</ul></section>';
    });
    html += '</div>';
    root.innerHTML = html;
  }

  function renderNode(node) {
    if (node.type === 'cards') {
      document.title = node.title + ' — ЯКатолик';
      root.innerHTML =
        crumbs([
          { label: 'Главная', href: 'index.html' },
          { label: tree.title, href: file },
          { label: node.title },
        ]) +
        head(node.title, node.desc) +
        renderCards(node.cards, { kicker: 'Тема' });
      return;
    }

    if (node.type === 'navigator') {
      renderNavigator(node);
      return;
    }

    if (node.type === 'category') {
      location.replace('archive.html?category=' + encodeURIComponent(node.slug));
      return;
    }

    if (node.type === 'external' && node.href) {
      location.replace(node.href);
      return;
    }

    if (node.type === 'prayers') {
      document.title = node.title + ' — ЯКатолик';
      var html =
        crumbs([
          { label: 'Главная', href: 'index.html' },
          { label: tree.title, href: file },
          { label: tree.nodes[node.siblingsOf].title, href: file + '?path=' + node.siblingsOf },
          { label: node.title },
        ]) +
        head(node.title, 'Нажмите на название — текст откроется.') +
        '<div class="prayer-list">';
      (node.prayers || []).forEach(function (p, i) {
        html +=
          '<details class="prayer-item"' + (i === 0 ? ' open' : '') + '>' +
          '<summary>' + esc(p.title) + '</summary>' +
          '<p class="prayer-text">' + esc(p.text) + '</p></details>';
      });
      html += '</div>' + siblingBlock(node) + feedBlock(node);
      root.innerHTML = html;
      return;
    }

    // page
    document.title = node.title + ' — ЯКатолик';
    var parent = node.siblingsOf && tree.nodes[node.siblingsOf];
    root.innerHTML =
      crumbs([
        { label: 'Главная', href: 'index.html' },
        { label: tree.title, href: file },
        parent
          ? { label: parent.title, href: file + '?path=' + node.siblingsOf }
          : null,
        { label: node.title },
      ].filter(Boolean)) +
      head(node.title, '') +
      bodyBlock(node) +
      alsoBlock(node) +
      siblingBlock(node) +
      feedBlock(node);
  }

  if (!path) {
    renderHub();
    return;
  }

  // hub-level card may be external
  var hubCard = (tree.cards || []).filter(function (c) { return c.id === path; })[0];
  if (hubCard && hubCard.href && !tree.nodes[path]) {
    location.replace(hubCard.href);
    return;
  }

  var node = tree.nodes[path];
  if (!node) {
    root.innerHTML =
      crumbs([{ label: 'Главная', href: 'index.html' }, { label: tree.title, href: file }]) +
      head('Страница не найдена', 'Проверьте ссылку или вернитесь в раздел.') +
      '<p><a class="wlink" href="' + file + '">← Назад к разделу</a></p>';
    return;
  }
  renderNode(node);
})();
