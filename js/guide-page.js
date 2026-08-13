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

  function isHiddenHref(href) {
    var h = String(href || '').split('?')[0].toLowerCase();
    return h === 'map.html' || /(?:^|\/)map\.html$/.test(h);
  }

  function visibleList(list) {
    return (list || []).filter(function (item) {
      if (!item || typeof item === 'string') return true;
      return !isHiddenHref(item.href);
    });
  }

  function toneClass(card, i) {
    var classes;
    if (card.wide || card.tone === 'wide') classes = 'route-card wide tone-wide';
    else if (card.tone === 'accent') classes = 'route-card tone-accent';
    else {
      var t = card.tone || ('abcd'[i % 4]);
      classes = 'route-card tone-' + t;
    }
    return classes + (card.image ? ' has-image' : '');
  }

  function renderStepList(cards, opts) {
    opts = opts || {};
    var html = '<ol class="guide-steps guide-steps--route">';
    visibleList(cards).forEach(function (c, i) {
      html +=
        '<li><a class="guide-step-row" href="' + esc(hrefFor(c)) + '">' +
        '<span class="guide-step-n">' + (i + 1) + '</span>' +
        '<span class="guide-step-body"><strong>' + esc(c.title) + '</strong>' +
        (c.sub ? '<em>' + esc(c.sub) + '</em>' : '') +
        '</span></a></li>';
    });
    html += '</ol>';
    if (opts.extra && !isHiddenHref(opts.extra.href)) {
      html +=
        '<p class="articles-more"><a class="wlink" href="' + esc(opts.extra.href) + '">' +
        esc(opts.extra.title || 'Дальше') + ' →</a></p>';
    }
    return html;
  }

  function renderCards(cards, opts) {
    opts = opts || {};
    cards = visibleList(cards);
    if (opts.numbered) return renderStepList(cards, opts);

    var hasWide = cards.some(function (c) {
      return !!(c.wide || c.tone === 'wide');
    });
    // Духовная жизнь: сетка 2 колонки (2×2 / 2×4), без «последней» на всю ширину
    var gridClass =
      opts.grid ||
      (sectionKey === 'spirit'
        ? 'route-grid route-grid--2'
        : hasWide
          ? 'route-grid route-grid--hub'
          : 'route-grid route-grid--3');
    var html = '<div class="' + gridClass + '">';
    cards.forEach(function (c, i) {
      var imageStyle = c.image
        ? ' style="--card-image:url(\'' + esc(c.image) + '\')"'
        : '';
      var kicker = opts.kicker || 'Открыть';
      html +=
        '<a class="' + toneClass(c, i) + '"' + imageStyle + ' href="' + esc(hrefFor(c)) + '">' +
        '<span class="route-kicker">' + esc(kicker) + '</span>' +
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
        '<span class="route-kicker">' + esc(opts.extra.kicker || 'Дальше') + '</span>' +
        '<strong>' + esc(opts.extra.title) + '</strong>' +
        (opts.extra.sub ? '<span class="route-sub">' + esc(opts.extra.sub) + '</span>' : '') +
        '</a>';
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

  function routeCards(node) {
    if (!node || !node.siblingsOf || !tree.nodes[node.siblingsOf]) return null;
    return tree.nodes[node.siblingsOf].cards || [];
  }

  function cardIndex(cards) {
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].id === path) return i;
    }
    return -1;
  }

  function stepNav(node) {
    var cards = routeCards(node);
    if (!cards || !cards.length) return '';
    var idx = cardIndex(cards);
    if (idx < 0) return '';
    var prev = idx > 0 ? cards[idx - 1] : null;
    var next = idx < cards.length - 1 ? cards[idx + 1] : null;
    var parentHref = file + '?path=' + encodeURIComponent(node.siblingsOf);
    var html = '<nav class="guide-stepnav" aria-label="Навигация по шагам">';
    html +=
      '<div class="guide-stepnav-meta">' +
      '<span class="guide-stepnav-pill"><b>' +
      (idx + 1) +
      '</b> / ' +
      cards.length +
      '</span>' +
      '<a href="' +
      esc(parentHref) +
      '">Все шаги</a></div>';
    html += '<div class="guide-stepnav-actions">';
    if (prev) {
      html +=
        '<a class="btn-ghost guide-stepnav-prev" href="' +
        esc(hrefFor(prev)) +
        '"><span>Назад</span><strong>' +
        esc(prev.title) +
        '</strong></a>';
    } else {
      html +=
        '<a class="btn-ghost guide-stepnav-prev" href="' +
        esc(parentHref) +
        '"><span>Назад</span><strong>К списку шагов</strong></a>';
    }
    if (next) {
      html +=
        '<a class="btn-primary guide-stepnav-next" href="' +
        esc(hrefFor(next)) +
        '"><span>Следующий шаг</span><strong>' +
        esc(next.title) +
        '</strong></a>';
    } else if (tree.moreCard) {
      html +=
        '<a class="btn-primary guide-stepnav-next" href="' +
        esc(tree.moreCard.href) +
        '"><span>Дальше</span><strong>' +
        esc(tree.moreCard.title) +
        '</strong></a>';
    } else {
      html +=
        '<a class="btn-primary guide-stepnav-next" href="' +
        esc(file) +
        '"><span>Готово</span><strong>К разделу</strong></a>';
    }
    html += '</div></nav>';
    return html;
  }

  function siblingBlock(node) {
    var cards = routeCards(node);
    if (!cards || !cards.length) return '';
    var html =
      '<section class="guide-more">' +
      '<h2>Все шаги маршрута</h2>' +
      '<ol class="guide-steps">';
    cards.forEach(function (c, i) {
      var current = c.id === path;
      var n = String(i + 1);
      var sub = current ? 'Сейчас читаете' : (c.sub || '');
      var inner =
        '<span class="guide-step-n" aria-hidden="true">' +
        n +
        '</span><span class="guide-step-body"><strong>' +
        esc(c.title) +
        '</strong>' +
        (sub ? '<em>' + esc(sub) + '</em>' : '') +
        '</span>';
      html += '<li class="' + (current ? 'is-current' : '') + '">';
      if (current) {
        html += '<div class="guide-step-row">' + inner + '</div>';
      } else {
        html += '<a class="guide-step-row" href="' + esc(hrefFor(c)) + '">' + inner + '</a>';
      }
      html += '</li>';
    });
    html += '</ol></section>';
    return html;
  }

  function alsoBlock(node) {
    var links = visibleList(node.also);
    if (!links.length) return '';
    var html = '<div class="guide-also"><h3>Полезные ссылки</h3><ul>';
    links.forEach(function (a) {
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
      '<div class="art-grid" id="' + boxId + '"></div>' +
      (node.feedCategory
        ? '<p class="articles-more"><a class="wlink" href="archive.html?category=' +
          encodeURIComponent(node.feedCategory) +
          '">Все материалы →</a></p>'
        : '') +
      '</section>'
    );
  }

  function renderHub() {
    document.title = tree.title + ' — ЯКатолик';
    var intro = tree.intro
      ? '<p class="guide-hub-intro">' + esc(tree.intro) + '</p>'
      : '';
    root.innerHTML =
      crumbs([{ label: 'Главная', href: 'index.html' }, { label: tree.title }]) +
      head(tree.title, tree.desc) +
      intro +
      renderCards(tree.cards, {
        kicker: 'Маршрут',
        grid: sectionKey === 'spirit' ? 'route-grid route-grid--2' : undefined,
      });
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
      visibleList(g.items).forEach(function (it) {
        if (typeof it === 'string') {
          html += '<li><span class="nav-muted">' + esc(it) + '</span></li>';
        } else {
          html +=
            '<li><a href="' +
            esc(it.href) +
            '"><strong>' +
            esc(it.title) +
            '</strong>' +
            (it.note ? '<span>' + esc(it.note) + '</span>' : '') +
            '</a></li>';
        }
      });
      html += '</ul></section>';
    });
    html += '</div>';
    root.innerHTML = html;
  }

  function renderArticleLike(node) {
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
      head(node.title, node.pageDesc || '') +
      bodyBlock(node) +
      alsoBlock(node) +
      stepNav(node) +
      siblingBlock(node) +
      feedBlock(node);
  }

  function renderNode(node) {
    if (node.type === 'cards') {
      document.title = node.title + ' — ЯКатолик';
      var tip = node.tip
        ? '<p class="guide-route-tip">' + esc(node.tip) + '</p>'
        : '';
      root.innerHTML =
        crumbs([
          { label: 'Главная', href: 'index.html' },
          { label: tree.title, href: file },
          { label: node.title },
        ]) +
        head(node.title, node.desc) +
        tip +
        renderCards(node.cards, {
          numbered: !!node.numbered,
          kicker: node.cardKicker || 'Тема',
          extra: node.showMore === false ? null : (tree.moreCard || null),
        });
      return;
    }

    if (node.type === 'navigator') {
      renderNavigator(node);
      return;
    }

    if (node.type === 'category') {
      // Не уводим внезапно в архив: показываем введение + ленту + ссылку дальше.
      renderArticleLike({
        title: node.title,
        lead: node.lead || 'Подборка материалов из архива.',
        body: node.body || null,
        siblingsOf: node.siblingsOf,
        also: node.also || [
          {
            title: 'Открыть весь раздел в архиве',
            href: 'archive.html?category=' + encodeURIComponent(node.slug),
          },
        ],
        feedCategory: node.slug,
        feedLabel: node.feedLabel || node.title,
      });
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
      html += '</div>' + stepNav(node) + siblingBlock(node) + feedBlock(node);
      root.innerHTML = html;
      return;
    }

    renderArticleLike(node);
  }

  if (!path) {
    renderHub();
    return;
  }

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
