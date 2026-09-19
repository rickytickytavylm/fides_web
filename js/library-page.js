/**
 * Библиотека: главная, подразделы с фильтрами, карточка произведения.
 */
(function () {
  'use strict';

  var L = window.YAK_LIBRARY;
  if (!L) return;

  function params() {
    try {
      return Object.fromEntries(new URLSearchParams(location.search));
    } catch (e) {
      return {};
    }
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function coverStyle(item) {
    var img = item.cover || (L.covers && L.covers[item.section]);
    if (img) {
      return 'background-image:url(\'' + esc(img) + '\');background-size:cover;background-position:center';
    }
    var tone = item.coverTone || '#5c5346';
    return 'background:linear-gradient(145deg,' + tone + ' 0%,color-mix(in srgb,' + tone + ' 55%,#1a1814) 100%)';
  }

  function flagBadges(item) {
    var flags = item.flags || {};
    var out = [];
    if (item.ageRating === '18+' || flags.lgbt18) {
      out.push('<span class="lib-badge lib-badge-18">18+</span>');
    } else if (item.ageRating && item.ageRating !== '0+') {
      out.push('<span class="lib-badge">' + esc(item.ageRating) + '</span>');
    }
    if (flags.substances) {
      out.push('<span class="lib-badge lib-badge-warn" title="Упоминаются наркотические или психотропные вещества">НС</span>');
    }
    if (flags.foreignAgent) {
      out.push('<span class="lib-badge lib-badge-warn" title="Автор, переводчик или издатель — иноагент">иноагент</span>');
    }
    return out.join('');
  }

  function cardPreview(item) {
    var main = L.displayTitle(item);
    var sub = L.subtitleTitle(item);
    var year = L.yearOf(item.firstPublished);
    var cat = L.categoryLabel(item);
    var href = 'book.html?id=' + encodeURIComponent(item.id);
    return (
      '<article class="lib-card">' +
      '<a class="lib-card-hit" href="' +
      href +
      '">' +
      '<div class="lib-cover" style="' +
      coverStyle(item) +
      '">' +
      '<div class="lib-cover-badges">' +
      flagBadges(item) +
      '</div>' +
      '</div>' +
      '<div class="lib-card-body">' +
      '<p class="lib-card-cat">' +
      esc(cat) +
      (year ? ' · ' + esc(year) : '') +
      '</p>' +
      '<h3 class="lib-card-title">' +
      esc(main) +
      '</h3>' +
      (sub ? '<p class="lib-card-sub">' + esc(sub) + '</p>' : '') +
      '</div></a>' +
      authorLine(item, 'lib-card-author') +
      '</article>'
    );
  }

  function authorHref(item) {
    if (!item || !item.author) return '';
    return 'library.html?author=' + encodeURIComponent(item.author);
  }

  function authorLine(item, cls) {
    var name = item && item.author;
    if (!name) return '<p class="' + cls + '">—</p>';
    return (
      '<p class="' +
      cls +
      '"><a class="lib-author-link" href="' +
      esc(authorHref(item)) +
      '">' +
      esc(name) +
      '</a></p>'
    );
  }

  function sortItems(list, mode) {
    var arr = list.slice();
    if (mode === 'popular') {
      arr.sort(function (a, b) {
        return L.popularityScore(b) - L.popularityScore(a);
      });
    } else if (mode === 'alpha') {
      arr.sort(function (a, b) {
        return L.displayTitle(a).localeCompare(L.displayTitle(b), 'ru');
      });
    } else {
      arr.sort(function (a, b) {
        return String(b.addedAt || '').localeCompare(String(a.addedAt || ''));
      });
    }
    return arr;
  }

  function filterItems(opts) {
    var q = (opts.q || '').trim().toLowerCase();
    return L.ITEMS.filter(function (item) {
      if (opts.sections) {
        if (!opts.sections.length) return false;
        if (opts.sections.indexOf(item.section) === -1) return false;
      }
      if (opts.section && item.section !== opts.section) return false;
      if (opts.category) {
        if (item.category !== opts.category) {
          var rub = L.rubricOf && L.rubricOf(item.category);
          if (!rub || rub.parentId !== opts.category) return false;
        }
      }
      if (opts.docType && item.docType !== opts.docType) return false;
      if (opts.pope && item.pope !== opts.pope) return false;
      if (opts.theme && (item.themes || []).indexOf(opts.theme) === -1) return false;
      if (opts.genre && (item.genre || '') !== opts.genre) return false;
      if (opts.publisher && (item.publisher || '') !== opts.publisher) return false;
      if (opts.author && String(item.author || '').trim().toLowerCase() !== String(opts.author).trim().toLowerCase()) return false;
      if (opts.year) {
        var y = String(item.firstPublished || '').slice(0, 4);
        if (y !== opts.year) return false;
      }
      if (!q) return true;
      var hay = [
        item.titleOriginal,
        item.titleRu,
        item.author,
        item.annotation,
        item.genre,
        item.publisher,
        L.categoryLabel(item)
      ]
        .join(' ')
        .toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  function uniqueField(section, field) {
    var map = {};
    L.ITEMS.forEach(function (item) {
      if (section && item.section !== section) return;
      var v = item[field];
      if (v) map[v] = true;
    });
    return Object.keys(map).sort(function (a, b) {
      return a.localeCompare(b, 'ru');
    });
  }

  function yearsFor(section) {
    var map = {};
    L.ITEMS.forEach(function (item) {
      if (section && item.section !== section) return;
      var y = String(item.firstPublished || '').slice(0, 4);
      if (y && y !== '0400') map[y] = true;
    });
    return Object.keys(map).sort().reverse();
  }

  /* ---------- Hub ---------- */
  function renderHub(root) {
    var p = params();
    var sort = p.sort || 'new';
    var q = p.q || '';
    var scopeChurch = true;
    var scopeBooks = true;
    var scopePeriodicals = true;
    if (p.scope === 'church') { scopeBooks = false; scopePeriodicals = false; }
    else if (p.scope === 'books') { scopeChurch = false; scopePeriodicals = false; }
    else if (p.scope === 'periodicals') { scopeChurch = false; scopeBooks = false; }
    else if (p.scope === 'none') {
      scopeChurch = false;
      scopeBooks = false;
      scopePeriodicals = false;
    }

    var sections = [];
    if (scopeChurch) sections.push('church');
    if (scopeBooks) sections.push('books');
    if (scopePeriodicals) sections.push('periodicals');

    var author = p.author || '';
    var list = sortItems(filterItems({ q: q, sections: sections, author: author }), sort);

    root.innerHTML =
      '<nav class="breadcrumbs in-shell" aria-label="Хлебные крошки">' +
      '<a href="index.html">Главная</a><span>/</span><span>Библиотека</span></nav>' +
      '<header class="page-head in-shell">' +
      '<div><p class="eyebrow">Читать и скачивать</p><h1>Библиотека</h1></div>' +
      '<p class="page-desc">Документы Церкви, авторские произведения и переводы · Превью ведут на карточку произведения</p>' +
      '</header>' +
      '<div class="lib-hub-sections">' +
      '<a class="lib-hub-tile" href="library.html?section=church">' +
      '<span class="lib-hub-kicker">Подраздел</span><strong>Документы Церкви</strong>' +
      '<span>Энциклики, послания, фильтры по Папе, типу и темам</span></a>' +
      '<a class="lib-hub-tile" href="library.html?section=books">' +
      '<span class="lib-hub-kicker">Подраздел</span><strong>Книги</strong>' +
      '<span>Жития, духовность, детская литература и другие издания</span></a>' +
      '<a class="lib-hub-tile" href="library.html?section=periodicals">' +
      '<span class="lib-hub-kicker">Подраздел</span><strong>Периодика</strong>' +
      '<span>Журналы, газеты и бюллетени</span></a>' +
      '</div>' +
      (author
        ? '<p class="lib-author-head in-shell">Все издания автора: <strong>' +
          esc(author) +
          '</strong> · <a class="lib-author-link" href="library.html">Сбросить</a></p>'
        : '') +
      '<form class="lib-toolbar" id="lib-hub-form">' +
      '<input type="search" name="q" value="' +
      esc(q) +
      '" placeholder="Поиск по названию, автору, теме…" autocomplete="off" />' +
      '<div class="lib-scope" role="group" aria-label="Искать в подразделах">' +
      '<label><input type="checkbox" name="sc" value="church"' +
      (scopeChurch ? ' checked' : '') +
      ' /> Документы Церкви</label>' +
      '<label><input type="checkbox" name="sc" value="books"' +
      (scopeBooks ? ' checked' : '') +
      ' /> Книги</label>' +
      '<label><input type="checkbox" name="sc" value="periodicals"' +
      (scopePeriodicals ? ' checked' : '') +
      ' /> Периодика</label>' +
      '</div>' +
      '<div class="tabs" role="tablist">' +
      '<button type="submit" name="sort" value="new" class="' +
      (sort === 'new' ? 'on' : '') +
      '">По новизне</button>' +
      '<button type="submit" name="sort" value="popular" class="' +
      (sort === 'popular' ? 'on' : '') +
      '">По популярности</button>' +
      '</div></form>' +
      '<p class="lib-count">' +
      list.length +
      ' ' +
      plural(list.length, 'произведение', 'произведения', 'произведений') +
      '</p>' +
      '<div class="lib-grid" id="lib-grid">' +
      (list.length ? list.map(cardPreview).join('') : '<p class="archive-empty">Ничего не найдено. Снимите часть фильтров.</p>') +
      '</div>';

    var form = document.getElementById('lib-hub-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        applyHubForm(form, e.submitter && e.submitter.value);
      });
    }
  }

  function applyHubForm(form, sortVal) {
    var fd = new FormData(form);
    var q = String(fd.get('q') || '').trim();
    var boxes = form.querySelectorAll('input[name="sc"]:checked');
    var scopes = [];
    boxes.forEach(function (b) {
      scopes.push(b.value);
    });
    var url = new URL(location.href);
    url.search = '';
    if (q) url.searchParams.set('q', q);
    if (scopes.length === 1) url.searchParams.set('scope', scopes[0]);
    if (scopes.length === 0) url.searchParams.set('scope', 'none');
    url.searchParams.set('sort', sortVal || 'new');
    if (params().author) url.searchParams.set('author', params().author);
    location.href = url.pathname.split('/').pop() + url.search;
  }

  function plural(n, one, few, many) {
    var abs = Math.abs(n) % 100;
    var n1 = abs % 10;
    if (abs > 10 && abs < 20) return many;
    if (n1 > 1 && n1 < 5) return few;
    if (n1 === 1) return one;
    return many;
  }

  /* ---------- Section ---------- */
  function renderSection(root, sectionId) {
    var sec = L.SECTIONS[sectionId];
    if (!sec) {
      root.innerHTML = '<p class="archive-empty">Подраздел не найден. <a href="library.html">К библиотеке</a></p>';
      return;
    }
    var p = params();
    var sort = p.sort || (sectionId === 'church' ? 'chrono' : 'new');
    var state = {
      q: p.q || '',
      category: p.category || '',
      docType: p.docType || '',
      pope: p.pope || '',
      theme: p.theme || '',
      genre: p.genre || '',
      publisher: p.publisher || '',
      author: p.author || '',
      year: p.year || '',
      sort: sort
    };

    var list = filterItems({
      section: sectionId,
      q: state.q,
      category: state.category,
      docType: state.docType,
      pope: state.pope,
      theme: state.theme,
      genre: state.genre,
      publisher: state.publisher,
      author: state.author,
      year: state.year
    });

    if (state.sort === 'chrono') {
      list.sort(function (a, b) {
        return String(b.firstPublished || '').localeCompare(String(a.firstPublished || ''));
      });
    } else {
      list = sortItems(list, state.sort === 'popular' ? 'popular' : 'new');
    }

    var filtersHtml =
      sectionId === 'church'
        ? churchFilters(state, sec)
        : booksFilters(state, sec);

    var currentRub = L.rubricOf ? L.rubricOf(state.category) : null;
    var topCats = L.childRubrics
      ? L.childRubrics(sectionId, '')
      : (sec.categories || []).map(function (c) { return { id: c.id, label: c.label }; });
    var subParent = state.category
      ? (currentRub && currentRub.parentId ? currentRub.parentId : state.category)
      : '';
    var subCats = subParent && L.childRubrics ? L.childRubrics(sectionId, subParent) : [];

    root.innerHTML =
      '<nav class="breadcrumbs in-shell" aria-label="Хлебные крошки">' +
      '<a href="index.html">Главная</a><span>/</span>' +
      '<a href="library.html">Библиотека</a><span>/</span><span>' +
      esc(sec.title) +
      '</span></nav>' +
      '<header class="page-head in-shell">' +
      '<div><p class="eyebrow">Библиотека</p><h1>' +
      esc(sec.title) +
      '</h1></div>' +
      '<p class="page-desc">' +
      esc(sec.desc) +
      '</p></header>' +
      '<div class="lib-cats">' +
      '<a class="' +
      (!state.category ? 'on' : '') +
      '" href="library.html?section=' +
      sectionId +
      '">Все</a>' +
      topCats
        .map(function (c) {
          var on = state.category === c.id || (currentRub && currentRub.parentId === c.id);
          return (
            '<a class="' +
            (on ? 'on' : '') +
            '" href="library.html?section=' +
            sectionId +
            '&category=' +
            encodeURIComponent(c.id) +
            '">' +
            esc(c.label) +
            '</a>'
          );
        })
        .join('') +
      '</div>' +
      (subCats.length
        ? '<div class="lib-cats lib-subcats">' +
          subCats
            .map(function (c) {
              return (
                '<a class="' +
                (state.category === c.id ? 'on' : '') +
                '" href="library.html?section=' +
                sectionId +
                '&category=' +
                encodeURIComponent(c.id) +
                '">' +
                esc(c.label) +
                '</a>'
              );
            })
            .join('') +
          '</div>'
        : '') +
      (state.author
        ? '<p class="lib-author-head">Издания автора: <strong>' +
          esc(state.author) +
          '</strong> · <a class="lib-author-link" href="library.html?author=' +
          encodeURIComponent(state.author) +
          '">во всей библиотеке</a></p>'
        : '') +
      '<form class="lib-filters" id="lib-filters">' +
      filtersHtml +
      '<div class="lib-filters-actions">' +
      '<button type="submit" class="lib-btn">Применить</button>' +
      '<a class="lib-btn ghost" href="library.html?section=' +
      sectionId +
      (state.category ? '&category=' + encodeURIComponent(state.category) : '') +
      '">Сбросить</a>' +
      '</div></form>' +
      '<div class="lib-toolbar tight">' +
      '<p class="lib-count">' +
      list.length +
      ' ' +
      plural(list.length, 'материал', 'материала', 'материалов') +
      '</p>' +
      '<div class="tabs">' +
      sortButtons(sectionId, state) +
      '</div></div>' +
      '<div class="lib-grid">' +
      (list.length ? list.map(cardPreview).join('') : '<p class="archive-empty">По выбранным фильтрам ничего нет.</p>') +
      '</div>';

    var form = document.getElementById('lib-filters');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var url = new URL(location.href);
        var keep = ['section', 'category'];
        var next = new URLSearchParams();
        keep.forEach(function (k) {
          if (url.searchParams.get(k)) next.set(k, url.searchParams.get(k));
        });
        var fd = new FormData(form);
        ['q', 'docType', 'pope', 'theme', 'genre', 'publisher', 'author', 'year'].forEach(function (k) {
          var v = String(fd.get(k) || '').trim();
          if (v) next.set(k, v);
        });
        next.set('sort', state.sort);
        location.href = 'library.html?' + next.toString();
      });
    }
  }

  function sortButtons(sectionId, state) {
    var items =
      sectionId === 'church'
        ? [
            { id: 'chrono', label: 'По дате документа' },
            { id: 'new', label: 'По добавлению' },
            { id: 'popular', label: 'Популярные' }
          ]
        : [
            { id: 'new', label: 'По новизне' },
            { id: 'popular', label: 'Популярные' },
            { id: 'chrono', label: 'По году издания' }
          ];
    return items
      .map(function (it) {
        var sp = new URLSearchParams(location.search);
        sp.set('sort', it.id);
        return (
          '<a class="tab-link' +
          (state.sort === it.id ? ' on' : '') +
          '" href="library.html?' +
          sp.toString() +
          '">' +
          esc(it.label) +
          '</a>'
        );
      })
      .join('');
  }

  function selectHtml(name, label, options, selected, blank) {
    var html =
      '<label class="lib-field"><span>' +
      esc(label) +
      '</span><select name="' +
      esc(name) +
      '"><option value="">' +
      esc(blank || 'Все') +
      '</option>';
    options.forEach(function (opt) {
      var id = typeof opt === 'string' ? opt : opt.id;
      var lab = typeof opt === 'string' ? opt : opt.label;
      html +=
        '<option value="' +
        esc(id) +
        '"' +
        (selected === id ? ' selected' : '') +
        '>' +
        esc(lab) +
        '</option>';
    });
    return html + '</select></label>';
  }

  function churchFilters(state) {
    return (
      '<label class="lib-field grow"><span>Поиск</span>' +
      '<input type="search" name="q" value="' +
      esc(state.q) +
      '" placeholder="Название, Папа, тема…" /></label>' +
      selectHtml('docType', 'Тип документа', L.DOC_TYPES, state.docType) +
      selectHtml('pope', 'Папа / дикастерия', L.POPES, state.pope) +
      selectHtml('year', 'Год публикации', yearsFor('church'), state.year) +
      selectHtml('theme', 'Тема', L.THEMES, state.theme)
    );
  }

  function booksFilters(state) {
    var genres = uniqueField('books', 'genre');
    var publishers = uniqueField('books', 'publisher');
    var authors = uniqueField('books', 'author');
    return (
      '<label class="lib-field grow"><span>Поиск</span>' +
      '<input type="search" name="q" value="' +
      esc(state.q) +
      '" placeholder="Название, автор…" /></label>' +
      selectHtml(
        'author',
        'Автор',
        authors.map(function (a) {
          return { id: a, label: a };
        }),
        state.author
      ) +
      selectHtml(
        'genre',
        'Жанр',
        genres.map(function (g) {
          return { id: g, label: g };
        }),
        state.genre
      ) +
      selectHtml(
        'publisher',
        'Издательство',
        publishers.map(function (g) {
          return { id: g, label: g };
        }),
        state.publisher
      ) +
      selectHtml('year', 'Год', yearsFor('books'), state.year) +
      selectHtml('theme', 'Тема', L.THEMES, state.theme)
    );
  }

  function sanitizeLibHtml(html) {
    var box = document.createElement('div');
    box.innerHTML = String(html || '');
    var allow = {
      P: 1, DIV: 1, H2: 1, H3: 1, H4: 1, UL: 1, OL: 1, LI: 1, BLOCKQUOTE: 1,
      STRONG: 1, EM: 1, B: 1, I: 1, U: 1, BR: 1, A: 1, FIGURE: 1, FIGCAPTION: 1,
      IMG: 1, CITE: 1, SPAN: 1,
    };
    box.querySelectorAll('script,style,iframe,object,embed').forEach(function (n) { n.remove(); });
    box.querySelectorAll('*').forEach(function (n) {
      var st = String(n.getAttribute('style') || '').toLowerCase();
      if (/font-weight\s*:\s*(bold|[7-9]00)/.test(st) && n.tagName !== 'STRONG' && n.tagName !== 'B') {
        var bold = document.createElement('strong');
        bold.innerHTML = n.innerHTML;
        n.innerHTML = '';
        n.appendChild(bold);
      }
      if (/font-style\s*:\s*italic/.test(st) && n.tagName !== 'EM' && n.tagName !== 'I') {
        var em = document.createElement('em');
        em.innerHTML = n.innerHTML;
        n.innerHTML = '';
        n.appendChild(em);
      }
      if (/text-decoration[^;]*underline/.test(st) && n.tagName !== 'U') {
        var u = document.createElement('u');
        u.innerHTML = n.innerHTML;
        n.innerHTML = '';
        n.appendChild(u);
      }
      if (!allow[n.tagName]) {
        var wrap = document.createElement('span');
        wrap.innerHTML = n.innerHTML;
        n.parentNode.replaceChild(wrap, n);
        return;
      }
      [].slice.call(n.attributes).forEach(function (a) {
        var keepClass = a.name === 'class' && /guide-quote|guide-note|rte-figure|rte-caption/.test(n.className);
        if (n.tagName === 'A' && a.name === 'href') return;
        if (n.tagName === 'IMG' && (a.name === 'src' || a.name === 'alt')) return;
        if (keepClass) return;
        n.removeAttribute(a.name);
      });
      if (n.tagName === 'A' && /^\s*javascript:/i.test(n.getAttribute('href') || '')) n.removeAttribute('href');
      if (n.tagName === 'IMG' && !/^(https?:|data:image\/|\/|\.\/|\.\.\/)/i.test(n.getAttribute('src') || '')) n.remove();
    });
    return box.innerHTML;
  }

  function pageTextHtml(item) {
    var html = (item && (item.contentHtml || item.pageText)) || '';
    if (!html || !String(html).replace(/<[^>]+>/g, '').trim()) return '';
    html = sanitizeLibHtml(html);
    return '<div class="lib-page-text"><div class="lib-page-body">' + html + '</div></div>';
  }

  /* ---------- Book card ---------- */
  function renderBook(root) {
    var id = params().id || '';
    var item = L.byId(id);
    if (!item) {
      root.innerHTML =
        '<p class="archive-empty">Произведение не найдено. <a href="library.html">К библиотеке</a></p>';
      return;
    }
    var sec = L.SECTIONS[item.section];
    var main = L.displayTitle(item);
    var sub = L.subtitleTitle(item);
    var metaRows = [
      ['Автор', item.author, item.author ? authorHref(item) : ''],
      ['Первая публикация', L.formatDate(item.firstPublished)],
      ['Дата издания', L.formatDate(item.editionDate)],
      ['Раздел', sec ? sec.title : ''],
      ['Категория', L.categoryLabel(item)],
      ['Жанр', item.genre],
      ['Издательство', item.publisher],
      ['Оригинальный язык', langLabel(item.originalLanguage)],
      ['Перевод', item.translator],
      ['Возраст', item.ageRating]
    ];
    if (item.section === 'church') {
      metaRows.splice(1, 0, ['Тип документа', L.labelOf(L.DOC_TYPES, item.docType)]);
      metaRows.splice(2, 0, ['Папа / дикастерия', L.labelOf(L.POPES, item.pope)]);
    }

    var downloads = (item.downloads || [])
      .map(function (d) {
        return (
          '<button type="button" class="lib-dl" data-format="' +
          esc(d.format) +
          '" data-url="' +
          esc(d.url) +
          '">' +
          '<strong>' +
          esc(d.format) +
          '</strong>' +
          (d.size ? '<span>' + esc(d.size) + '</span>' : '') +
          '</button>'
        );
      })
      .join('');

    var themes = (item.themes || [])
      .map(function (t) {
        return (
          '<a class="lib-tag" href="library.html?section=' +
          encodeURIComponent(item.section) +
          '&theme=' +
          encodeURIComponent(t) +
          '">' +
          esc(L.labelOf(L.THEMES, t)) +
          '</a>'
        );
      })
      .join('');

    var quotes = (item.quotes || [])
      .map(function (q) {
        return '<blockquote class="lib-quote">«' + esc(q) + '»</blockquote>';
      })
      .join('');

    root.innerHTML =
      '<nav class="breadcrumbs in-shell" aria-label="Хлебные крошки">' +
      '<a href="index.html">Главная</a><span>/</span>' +
      '<a href="library.html">Библиотека</a><span>/</span>' +
      '<a href="library.html?section=' +
      encodeURIComponent(item.section) +
      '">' +
      esc(sec ? sec.title : '') +
      '</a><span>/</span><span>' +
      esc(main) +
      '</span></nav>' +
      '<article class="lib-book">' +
      '<div class="lib-book-top">' +
      '<div class="lib-book-cover' + (item.cover ? ' has-photo' : '') + '" style="' +
      coverStyle(item) +
      '">' +
      (item.cover ? '' : '<span>' + esc((main || '?').slice(0, 1)) + '</span>') +
      '<div class="lib-cover-badges">' +
      flagBadges(item) +
      '</div></div>' +
      '<div class="lib-book-main">' +
      '<p class="lib-card-cat">' +
      esc(L.categoryLabel(item)) +
      '</p>' +
      '<h1>' +
      esc(main) +
      '</h1>' +
      (sub ? '<p class="lib-book-alt">' + esc(sub) + '</p>' : '') +
      authorLine(item, 'lib-book-author') +
      '<div class="lib-flag-row">' +
      flagBadges(item) +
      '</div>' +
      (item.annotation
        ? '<div class="lib-annotation">' + (hasMarkup(item.annotation) ? item.annotation : annotationPlain(item.annotation)) + '</div>'
        : '') +
      '<div class="lib-meta">' +
      metaRows
        .filter(function (r) {
          return r[1];
        })
        .map(function (r) {
          var val = r[2]
            ? '<a class="lib-author-link" href="' + esc(r[2]) + '">' + esc(r[1]) + '</a>'
            : esc(r[1]);
          return (
            '<div><span>' +
            esc(r[0]) +
            '</span><strong>' +
            val +
            '</strong></div>'
          );
        })
        .join('') +
      '</div>' +
      (themes ? '<div class="lib-tags">' + themes + '</div>' : '') +
      (downloads || item.buyUrl
        ? '<div class="lib-download-block">' +
          (downloads ? '<h2>Скачать</h2><div class="lib-dl-row">' + downloads + '</div>' : '') +
          (item.buyUrl
            ? '<a class="lib-buy" href="' + esc(item.buyUrl) + '" target="_blank" rel="noopener">Купить бумажную / электронную версию →</a>'
            : '') +
          '</div>'
        : '') +
      '</div></div>' +
      pageTextHtml(item) +
      (quotes ? '<div class="lib-quotes"><h2>Цитаты</h2>' + quotes + '</div>' : '') +
      '<p class="lib-future-note">Читалка на сайте, избранное и связанные статьи — в следующих итерациях.</p>' +
      '</article>' +
      '<div class="lib-donate" id="lib-donate" hidden>' +
      '<div class="lib-donate-card">' +
      '<button type="button" class="lib-donate-close" id="lib-donate-close" aria-label="Закрыть">×</button>' +
      '<p class="eyebrow">Спасибо</p>' +
      '<h3>Скачивание началось</h3>' +
      '<p>Если материал был полезен — можно поддержать проект пожертвованием. Это добровольно.</p>' +
      '<div class="lib-donate-actions">' +
      '<a class="lib-btn" href="chat.html">Написать нам</a>' +
      '<button type="button" class="lib-btn ghost" id="lib-donate-later">Позже</button>' +
      '</div></div></div>';

    document.title = main + ' — Библиотека · ЯКатолик';

    root.querySelectorAll('.lib-dl').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var url = btn.getAttribute('data-url') || '#';
        if (url && url !== '#') {
          var a = document.createElement('a');
          a.href = url;
          a.download = '';
          a.target = '_blank';
          a.rel = 'noopener';
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
        showDonate();
      });
    });
    var close = document.getElementById('lib-donate-close');
    var later = document.getElementById('lib-donate-later');
    if (close) close.addEventListener('click', hideDonate);
    if (later) later.addEventListener('click', hideDonate);
  }

  function showDonate() {
    var el = document.getElementById('lib-donate');
    if (el) el.hidden = false;
  }
  function hideDonate() {
    var el = document.getElementById('lib-donate');
    if (el) el.hidden = true;
  }

  function hasMarkup(s) {
    return /<[a-z][\s\S]*>/i.test(String(s || ''));
  }

  function annotationPlain(text) {
    return String(text || '')
      .split(/\n\n+/)
      .map(function (p) { return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; })
      .join('');
  }

  function langLabel(code) {
    var map = {
      la: 'латынь', it: 'итальянский', es: 'испанский', fr: 'французский',
      ru: 'русский', en: 'английский', de: 'немецкий', pl: 'польский',
      deu: 'немецкий', german: 'немецкий'
    };
    var key = String(code || '').toLowerCase();
    return map[key] || code || '—';
  }

  /* ---------- Boot ---------- */
  function boot() {
    var libRoot = document.getElementById('library-root');
    var bookRoot = document.getElementById('book-root');
    function paint() {
      if (bookRoot) {
        renderBook(bookRoot);
        return;
      }
      if (!libRoot) return;
      var section = params().section;
      if (section && L.SECTIONS[section]) renderSection(libRoot, section);
      else renderHub(libRoot);
    }
    var V = window.Vera;
    if (V && V.getArticle) {
      V.getArticle('yak-library-data')
        .then(function (a) {
          var raw = (a && (a.contentText || a.content || '')) || '';
          var pack = null;
          try { pack = JSON.parse(raw); } catch (e) { pack = null; }
          if (pack && L.mergePack) L.mergePack(pack);
        })
        .catch(function () {})
        .then(paint);
      return;
    }
    paint();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
