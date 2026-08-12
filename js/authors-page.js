(function () {
  'use strict';
  var V = window.Vera;
  var authors = window.YakAuthors || [];
  if (!authors.length) return;

  function esc(s) {
    return V ? V.escapeHtml(s) : String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function strip(html) {
    if (V && V.stripTags) return V.stripTags(html).slice(0, 160);
    return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
  }

  function initials(name) {
    return String(name || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function (w) { return w.charAt(0); })
      .join('')
      .toUpperCase();
  }

  function ruMaterials(n) {
    n = Math.abs(Number(n) || 0) % 100;
    var n1 = n % 10;
    if (n > 10 && n < 20) return 'материалов';
    if (n1 === 1) return 'материал';
    if (n1 >= 2 && n1 <= 4) return 'материала';
    return 'материалов';
  }

  function avatar(a) {
    if (a.photo) {
      return '<span class="author-ava" style="background-image:url(\'' + esc(a.photo) + '\')"></span>';
    }
    return '<span class="author-ava initials">' + esc(initials(a.name)) + '</span>';
  }

  /* slug статьи → авторы[] (соавторство: несколько тегов на одну публикацию) */
  var articleAuthorIndex = null;
  function pushAuthor(map, slug, a) {
    if (!slug || !a) return;
    var key = String(slug);
    if (!map[key]) map[key] = [];
    var exists = map[key].some(function (x) { return x.slug === a.slug; });
    if (!exists) map[key].push(a);
  }

  function buildArticleAuthorIndex() {
    if (articleAuthorIndex) return articleAuthorIndex;
    articleAuthorIndex = Object.create(null);
    authors.forEach(function (a) {
      (a.recent || []).forEach(function (p) {
        if (p && p.slug) pushAuthor(articleAuthorIndex, p.slug, a);
      });
    });
    try {
      var cycles = (window.YakCycles && (YakCycles.CYCLES || YakCycles.cycles)) || [];
      cycles.forEach(function (c) {
        var a = authors.filter(function (x) { return x.slug === c.authorSlug; })[0];
        if (!a) return;
        (c.articles || c.slugs || []).forEach(function (item) {
          var slug = typeof item === 'string' ? item : (item && item.slug);
          pushAuthor(articleAuthorIndex, slug, a);
        });
      });
    } catch (e) {}
    return articleAuthorIndex;
  }

  function findAllAuthorsByArticle(item) {
    if (!item) return [];
    var slug = item.slug || item.id;
    if (!slug) return [];
    return (buildArticleAuthorIndex()[String(slug)] || []).slice();
  }

  function findAuthorByArticle(item) {
    var list = findAllAuthorsByArticle(item);
    return list[0] || null;
  }

  function authorAva(a, noPhoto) {
    if (noPhoto || !a.photo) {
      return '<span class="author-ava initials">' + esc(initials(a.name)) + '</span>';
    }
    return avatar(a);
  }

  function oneAuthorRow(a, opts) {
    opts = opts || {};
    var cls = opts.className || 'card-author';
    var ava = authorAva(a, opts.noPhoto);
    if (opts.link) {
      return (
        '<a class="' + cls + '" href="author.html?slug=' + encodeURIComponent(a.slug) + '">' +
        ava +
        '<span class="card-author-name">' + esc(a.name) + '</span></a>'
      );
    }
    return (
      '<span class="' + cls + '">' +
      ava +
      '<span class="card-author-name">' + esc(a.name) + '</span></span>'
    );
  }

  /** Один или несколько авторов столбиком; имя справа от аватара */
  function cardAuthorHtml(item, opts) {
    opts = opts || {};
    var list = findAllAuthorsByArticle(item);
    if (!list.length) return '';
    var rowOpts = {
      className: opts.className || 'card-author',
      link: !!opts.link,
      noPhoto: opts.noPhoto !== false, /* на карточках ленты — инициалы, без фото */
    };
    if (list.length === 1) return oneAuthorRow(list[0], rowOpts);
    return (
      '<span class="card-authors">' +
      list.map(function (a) { return oneAuthorRow(a, rowOpts); }).join('') +
      '</span>'
    );
  }

  function authorDisplayName(item) {
    var list = findAllAuthorsByArticle(item);
    if (list.length) return list.map(function (a) { return a.name; }).join(', ');
    var raw = item && item.author ? String(item.author).trim() : '';
    if (!raw) return '';
    var low = raw.toLowerCase();
    if (low === 'ruscatholic' || low === 'admin' || low === 'редакция') return '';
    return raw;
  }

  window.YakAuthorLink = {
    findByArticle: findAuthorByArticle,
    findAllByArticle: findAllAuthorsByArticle,
    cardHtml: cardAuthorHtml,
    displayName: authorDisplayName,
    avatar: avatar,
    authorAva: authorAva,
  };

  /* ---------- Catalog ---------- */
  var grid = document.getElementById('authors-grid');
  if (grid) {
    var qEl = document.getElementById('authors-q');
    var sortEl = document.getElementById('authors-sort');
    var sort = 'recent';

    function sortedFiltered() {
      var q = (qEl && qEl.value ? qEl.value : '').trim().toLowerCase();
      var list = authors.filter(function (a) {
        if (!q) return true;
        return (a.name || '').toLowerCase().indexOf(q) !== -1;
      });
      list = list.slice();
      if (sort === 'alpha') {
        list.sort(function (a, b) { return a.name.localeCompare(b.name, 'ru'); });
      } else if (sort === 'count') {
        list.sort(function (a, b) { return (b.count || 0) - (a.count || 0); });
      } else {
        list.sort(function (a, b) { return String(b.latestDate || '').localeCompare(String(a.latestDate || '')); });
      }
      return list;
    }

    function render() {
      var list = sortedFiltered();
      if (!list.length) {
        grid.innerHTML = '<p class="archive-empty">Никого не найдено</p>';
        return;
      }
      grid.innerHTML = list.map(function (a) {
        return (
          '<a class="author-card" href="author.html?slug=' + encodeURIComponent(a.slug) + '">' +
          avatar(a) +
          '<span class="author-card-body">' +
          '<strong>' + esc(a.name) + '</strong>' +
          (a.role ? '<span class="author-role">' + esc(a.role) + '</span>' : '') +
          '<span class="author-count">' + esc(String(a.count || 0)) + ' материалов</span>' +
          '</span></a>'
        );
      }).join('');
    }

    if (qEl) qEl.addEventListener('input', render);
    if (sortEl) {
      sortEl.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-sort]');
        if (!btn) return;
        sort = btn.getAttribute('data-sort');
        Array.prototype.forEach.call(sortEl.querySelectorAll('button'), function (b) {
          b.classList.toggle('on', b === btn);
        });
        render();
      });
    }
    render();
  }

  /* ---------- Author profile ---------- */
  var root = document.getElementById('author-root');
  if (root) {
    var slug = new URLSearchParams(location.search).get('slug') || '';
    var a = authors.filter(function (x) { return x.slug === slug; })[0];
    if (!a) {
      root.innerHTML =
        '<nav class="breadcrumbs in-shell"><a href="index.html">Главная</a><span>/</span><a href="authors.html">Авторы</a><span>/</span><span>Не найден</span></nav>' +
        '<header class="page-head in-shell"><div><h1>Автор не найден</h1></div></header>' +
        '<p><a class="wlink" href="authors.html">← К каталогу</a></p>';
      return;
    }
    document.title = a.name + ' — ЯКатолик';
    var socials = (a.socials || []).map(function (s) {
      return '<a class="author-social" href="' + esc(s.href) + '" target="_blank" rel="noopener">' + esc(s.label) + '</a>';
    }).join('');
    function pubCoverTone(slug) {
      var tones = ['#5c5346', '#6b2d3c', '#2f5d8c', '#3d6b4f', '#8a5a2b', '#4a3f6b'];
      var h = 0;
      String(slug || '').split('').forEach(function (ch) { h = (h + ch.charCodeAt(0)) % tones.length; });
      return tones[h];
    }

    var feed = (a.recent || []).map(function (p) {
      var href = 'article.html?id=' + encodeURIComponent(p.slug);
      var tone = pubCoverTone(p.slug);
      return (
        '<a class="author-pub" href="' + href + '" data-slug="' + esc(p.slug) + '">' +
        '<span class="author-pub-cover" style="background:linear-gradient(155deg,' + tone + ',#1c1a18)" aria-hidden="true"></span>' +
        '<span class="author-pub-body">' +
        '<time>' + esc(V ? V.formatDate(p.date) : p.date) + '</time>' +
        '<strong>' + esc(strip(p.title)) + '</strong>' +
        '<span>' + esc(strip(p.excerpt)) + '</span></span></a>'
      );
    }).join('');

    var cycles = (window.YakCycles && window.YakCycles.forAuthor)
      ? window.YakCycles.forAuthor(a.slug)
      : [];
    var cyclesHtml = cycles.length
      ? '<section class="author-cycles"><h2>Циклы публикаций</h2>' +
        '<div class="cycle-cards">' +
        cycles.map(function (c) {
          return (
            '<a class="cycle-card" href="cycle.html?id=' + encodeURIComponent(c.id) + '">' +
            '<span class="cycle-card-kicker">' + esc(c.subtitle || 'Цикл') + '</span>' +
            '<strong>' + esc(c.title) + '</strong>' +
            '<span class="cycle-card-meta">' + esc(String((c.items || []).length)) + ' материалов</span>' +
            '<span class="cycle-card-intro">' + esc(c.intro || '') + '</span></a>'
          );
        }).join('') +
        '</div></section>'
      : '';

    root.innerHTML =
      '<nav class="breadcrumbs in-shell">' +
      '<a href="index.html">Главная</a><span>/</span><a href="authors.html">Авторы</a><span>/</span><span>' + esc(a.name) + '</span></nav>' +
      '<section class="author-head">' +
      avatar(a) +
      '<div class="author-head-body">' +
      '<p class="eyebrow">' + esc(a.role || 'Автор') + '</p>' +
      '<h1>' + esc(a.name) + '</h1>' +
      '<p class="author-bio">' + esc(a.bio || '') + '</p>' +
      (socials ? '<div class="author-socials">' + socials + '</div>' : '') +
      '<div class="author-stats"><span><b>' + esc(String(a.count || 0)) + '</b> ' +
      esc(ruMaterials(a.count || 0)) +
      '</span></div>' +
      '</div></section>' +
      cyclesHtml +
      '<section class="guide-feed"><h2>Свежие публикации</h2>' +
      ((a.count || 0) > (a.recent || []).length
        ? '<p class="author-feed-note">Показаны последние ' +
          esc(String((a.recent || []).length)) +
          ' из ' +
          esc(String(a.count || 0)) +
          '</p>'
        : '') +
      '<div class="author-pubs">' + (feed || '<p class="archive-empty">Пока нет материалов</p>') + '</div></section>';

    /* Обложки из нашего архива */
    if (V && V.getArticle && a.recent && a.recent.length) {
      a.recent.forEach(function (p) {
        V.getArticle(p.slug).then(function (art) {
          var img = (art && (art.image || art.cover || art.thumbnail)) || '';
          if (!img) return;
          var card = root.querySelector('.author-pub[data-slug="' + p.slug + '"] .author-pub-cover');
          if (!card) return;
          card.style.backgroundImage = 'url("' + String(img).replace(/"/g, '') + '")';
          card.style.backgroundSize = 'cover';
          card.style.backgroundPosition = 'center 22%';
          card.classList.add('has-photo');
        }).catch(function () {});
      });
    }
  }

  /* ---------- Home block helper ---------- */
  window.renderHomeAuthors = function (el, limit) {
    if (!el) return;
    var list = authors.slice().sort(function (a, b) {
      return String(b.latestDate || '').localeCompare(String(a.latestDate || ''));
    }).slice(0, limit || 6);
    el.innerHTML = list.map(function (a) {
      return (
        '<a class="author-row" href="author.html?slug=' + encodeURIComponent(a.slug) + '">' +
        avatar(a) +
        '<span class="author-row-text">' +
        '<strong>' + esc(a.name) + '</strong>' +
        (a.role ? '<em class="author-row-role">' + esc(a.role) + '</em>' : '') +
        '<small>' + esc(String(a.count || 0)) + ' публикаций</small>' +
        '</span></a>'
      );
    }).join('');
  };
})();
