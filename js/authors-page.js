(function () {
  'use strict';
  var V = window.Vera;
  function authors() {
    return window.YakAuthors || [];
  }
  if (!authors().length) return;

  function esc(s) {
    return V ? V.escapeHtml(s) : String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatBio(bio) {
    if (!bio) return '';
    bio = String(bio)
      .replace(/архива\s+Рускатолик/gi, 'ЯКатолик')
      .replace(/\s*Тег на Рускатолик:[^.]*\.?/gi, '')
      .replace(/портал[а]?\s+«?Рускатолик»?/gi, 'портал ЯКатолик');
    if (V && V.sanitizeRichHtml) return V.sanitizeRichHtml(bio);
    if (/<[a-z][\s\S]*>/i.test(bio)) return String(bio);
    return '<p>' + esc(bio).replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
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

  function ruPlural(n, one, few, many) {
    n = Math.abs(Number(n) || 0) % 100;
    var n1 = n % 10;
    if (n > 10 && n < 20) return many;
    if (n1 === 1) return one;
    if (n1 >= 2 && n1 <= 4) return few;
    return many;
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
    authors().forEach(function (a) {
      (a.recent || []).forEach(function (p) {
        if (p && p.slug) pushAuthor(articleAuthorIndex, p.slug, a);
      });
    });
    try {
      var cycles = (window.YakCycles && (YakCycles.ALL || YakCycles.CYCLES || YakCycles.cycles)) || [];
      cycles.forEach(function (c) {
        var slugs = (c.authorSlugs && c.authorSlugs.length)
          ? c.authorSlugs
          : (c.authorSlug ? [c.authorSlug] : []);
        var pubs = c.items || c.articles || c.slugs || [];
        slugs.forEach(function (authorSlug) {
          var a = authors().filter(function (x) { return x.slug === authorSlug; })[0];
          if (!a) return;
          pubs.forEach(function (item) {
            var slug = typeof item === 'string' ? item : (item && item.slug);
            pushAuthor(articleAuthorIndex, slug, a);
          });
        });
      });
    } catch (e) {}
    return articleAuthorIndex;
  }

  function findAllAuthorsByArticle(item) {
    if (!item) return [];
    if (item.kind === 'desk' && (item.authorSlugs || item.authorSlug != null)) {
      var chosen = item.authorSlugs || (item.authorSlug ? [item.authorSlug] : []);
      return chosen.map(function (s) {
        return authors().filter(function (x) { return x.slug === s; })[0];
      }).filter(Boolean);
    }
    var slug = item.slug || item.id;
    var list = slug ? (buildArticleAuthorIndex()[String(slug)] || []).slice() : [];
    var extra = item.authorSlugs || (item.authorSlug ? [item.authorSlug] : []);
    extra.forEach(function (s) {
      var a = authors().filter(function (x) { return x.slug === s; })[0];
      if (a && !list.some(function (x) { return x.slug === a.slug; })) list.push(a);
    });
    if (!list.length && item.author) {
      var name = String(item.author).trim().toLowerCase();
      if (name && name !== 'ruscatholic' && name !== 'admin' && name !== 'редакция') {
        authors().forEach(function (a) {
          if (a && String(a.name || '').trim().toLowerCase() === name && !list.some(function (x) { return x.slug === a.slug; })) {
            list.push(a);
          }
        });
      }
    }
    return list;
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
      var list = authors().filter(function (a) {
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
    if (window.YakAuthorsOnPack) window.YakAuthorsOnPack(render);
  }

  /* ---------- Author profile ---------- */
  var root = document.getElementById('author-root');
  var coverCache = window.YakPubCovers || (window.YakPubCovers = {});

  function dropMissingPub(el, slug) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
    if (slug && window.YakHiddenPubs && window.YakHiddenPubs.indexOf(String(slug)) === -1) {
      window.YakHiddenPubs.push(String(slug));
    }
  }

  function hydratePubCovers(box) {
    if (!box || !V || !V.getArticle) return;
    var pending = [].slice.call(box.querySelectorAll('.author-pub[data-slug]'));
    var i = 0;
    function worker() {
      if (i >= pending.length) return;
      var el = pending[i++];
      var slug = el.getAttribute('data-slug');
      var cover = el.querySelector('.author-pub-cover');
      V.getArticle(slug).then(function (art) {
        var hidden = !art || (!art.slug && !art.id && !art.title);
        var cats = (art && (art.categorySlugs || art.rubrics)) || [];
        if (hidden || cats.indexOf('hidden') !== -1) {
          dropMissingPub(el, slug);
          return;
        }
        var img = art && (art.image || art.cover);
        if (img && cover) {
          coverCache[slug] = img;
          cover.style.backgroundImage = "url('" + String(img).replace(/'/g, '%27') + "')";
        }
      }).catch(function (err) {
        var msg = String((err && err.message) || err || '').toLowerCase();
        if (/404|not found|не найден/.test(msg)) dropMissingPub(el, slug);
      }).then(worker);
    }
    worker();
    worker();
    worker();
    worker();
  }

  if (root) {
    var slug = new URLSearchParams(location.search).get('slug') || '';
    var castsBound = false;

    function paintAuthorProfile() {
      var a = authors().filter(function (x) { return x.slug === slug; })[0];
      if (!a) {
        root.innerHTML =
          '<nav class="breadcrumbs in-shell"><a href="index.html">Главная</a><span>/</span><a href="authors.html">Авторы</a><span>/</span><span>Не найден</span></nav>' +
          '<header class="page-head in-shell"><div><h1>Автор не найден</h1></div></header>' +
          '<p><a class="wlink" href="authors.html">← К каталогу</a></p>';
        return;
      }
      document.title = a.name + ' — ЯКатолик';
      root.classList.add('author-page');
      root.style.removeProperty('--author-ink');
      root.style.removeProperty('--author-wash');
      var hiddenPubs = window.YakHiddenPubs || [];
      function isPodcastLeftover(p) {
        return /^Рускатолик\s+Podcast/i.test((p && p.title) || '');
      }
      function hasOwnPodcast() {
        return !!(window.YakPodcasts && YakPodcasts.forAuthor && YakPodcasts.forAuthor(a.slug).length);
      }
      var pubs = (a.recent || []).filter(function (p) {
        if (!p || !p.slug) return false;
        if (hiddenPubs.indexOf(String(p.slug)) !== -1) return false;
        if (hasOwnPodcast() && isPodcastLeftover(p)) return false;
        return true;
      });
      var socials = (a.socials || []).filter(function (s) {
        var href = String((s && s.href) || '').toLowerCase();
        if (!href) return false;
        return !/ruscatholic\.org|xn--80aqecdrlilg/.test(href);
      }).map(function (s) {
        return '<a class="author-social" href="' + esc(s.href) + '" target="_blank" rel="noopener">' + esc(s.label) + '</a>';
      }).join('');

      var feed = pubs.map(function (p) {
        var href = 'article.html?id=' + encodeURIComponent(p.slug);
        var img = p.image || p.cover || coverCache[p.slug] || '';
        var coverStyle = img
          ? ' style="background-image:url(\'' + String(img).replace(/'/g, '%27') + '\')"'
          : '';
        return (
          '<a class="author-pub" href="' + href + '" data-slug="' + esc(p.slug) + '">' +
          '<span class="author-pub-cover"' + coverStyle + '></span>' +
          '<span class="author-pub-body">' +
          '<time>' + esc(V ? V.formatDate(p.date) : p.date) + '</time>' +
          '<strong>' + esc(strip(p.title)) + '</strong>' +
          (p.excerpt ? '<span>' + esc(strip(p.excerpt)) + '</span>' : '') +
          '</span></a>'
        );
      }).join('');

      var cycles = (window.YakCycles && window.YakCycles.forAuthor)
        ? window.YakCycles.forAuthor(a.slug)
        : [];
      var pubCount = pubs.length || a.count || 0;
      var cycleCount = cycles.length;
      function castsHtmlOf() {
        var casts = (window.YakPodcasts && YakPodcasts.forAuthor)
          ? YakPodcasts.forAuthor(a.slug)
          : [];
        if (!casts.length) return '';
        return '<h2>Подкасты</h2><div class="cycle-cards">' +
          casts.map(function (show) {
            var n = window.YakPodcasts.countOf ? YakPodcasts.countOf(show) : (show.episodes || []).length;
            return (
              '<a class="cycle-card" href="podcast.html?id=' + encodeURIComponent(show.id) + '">' +
              '<span class="cycle-card-kicker">Подкаст</span>' +
              '<strong>' + esc(show.title) + '</strong>' +
              '<span class="cycle-card-meta">' + esc(window.YakPodcasts.epLabel(n)) + '</span>' +
              '<span class="cycle-card-intro">' + esc(show.blurb || '') + '</span></a>'
            );
          }).join('') +
          '</div>';
      }
      var castsHtml = '<section class="author-cycles" id="author-casts">' + castsHtmlOf() + '</section>';
      var cyclesHtml = cycles.length
        ? '<section class="author-cycles" id="author-cycles"><h2>Циклы</h2>' +
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
        '<section class="author-hero">' +
        '<div class="author-hero-card">' +
        avatar(a) +
        '<div class="author-head-body">' +
        '<p class="eyebrow">' + esc(a.role || 'Автор') + '</p>' +
        '<h1>' + esc(a.name) + '</h1>' +
        (a.bio ? '<div class="author-bio">' + formatBio(a.bio) + '</div>' : '') +
        (socials ? '<div class="author-socials">' + socials + '</div>' : '') +
        '<div class="author-stats">' +
        '<span><b>' + esc(String(pubCount)) + '</b> ' +
        esc(ruPlural(pubCount, 'публикация', 'публикации', 'публикаций')) +
        '</span>' +
        '<span' + (cycleCount ? '' : ' class="is-zero"') + '>' +
        (cycleCount
          ? '<a href="#author-cycles"><b>' + esc(String(cycleCount)) + '</b> ' +
            esc(ruPlural(cycleCount, 'цикл', 'цикла', 'циклов')) +
            '</a>'
          : '<b>0</b> циклов') +
        '</span></div>' +
        '</div></div></section>' +
        castsHtml +
        cyclesHtml +
        '<section class="guide-feed"><h2>Публикации</h2>' +
        '<div class="author-pubs">' + (feed || '<p class="archive-empty">Пока нет материалов</p>') + '</div></section>';

      function paintCasts() {
        var box = document.getElementById('author-casts');
        if (!box) return;
        var html = castsHtmlOf();
        box.innerHTML = html;
        box.hidden = !html;
      }
      paintCasts();
      if (!castsBound && window.YakPodcasts && YakPodcasts.onPack) {
        castsBound = true;
        YakPodcasts.onPack(paintCasts);
      }
      hydratePubCovers(root.querySelector('.author-pubs'));
    }

    paintAuthorProfile();
    if (window.YakAuthorsOnPack) window.YakAuthorsOnPack(paintAuthorProfile);
  }

  /* ---------- Home block helper ---------- */
  window.renderHomeAuthors = function (el, limit) {
    if (!el) return;
    var list = authors().slice().sort(function (a, b) {
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
  if (window.YakAuthorsOnPack) {
    window.YakAuthorsOnPack(function () {
      window.renderHomeAuthors(document.getElementById('authors-home'), 6);
      window.renderHomeAuthors(document.getElementById('authors-home-mobile'), 5);
    });
  }
})();
