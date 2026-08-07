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
    return (
      '<a class="lib-card" href="book.html?id=' +
      encodeURIComponent(item.id) +
      '">' +
      '<div class="lib-cover" style="' +
      coverStyle(item) +
      '">' +
      '<span class="lib-cover-mark">' +
      esc((main || '?').slice(0, 1)) +
      '</span>' +
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
      '<p class="lib-card-author">' +
      esc(item.author || '—') +
      '</p>' +
      '</div></a>'
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
      if (opts.category && item.category !== opts.category) return false;
      if (opts.docType && item.docType !== opts.docType) return false;
      if (opts.pope && item.pope !== opts.pope) return false;
      if (opts.theme && (item.themes || []).indexOf(opts.theme) === -1) return false;
      if (opts.genre && (item.genre || '') !== opts.genre) return false;
      if (opts.publisher && (item.publisher || '') !== opts.publisher) return false;
      if (opts.author && (item.author || '') !== opts.author) return false;
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
    if (p.scope === 'church') scopeBooks = false;
    else if (p.scope === 'books') scopeChurch = false;
    else if (p.scope === 'none') {
      scopeChurch = false;
      scopeBooks = false;
    }

    var sections = [];
    if (scopeChurch) sections.push('church');
    if (scopeBooks) sections.push('books');

    var list = sortItems(filterItems({ q: q, sections: sections }), sort);

    root.innerHTML =
      '<nav class="breadcrumbs in-shell" aria-label="Хлебные крошки">' +
      '<a href="index.html">Главная</a><span>/</span><span>Библиотека</span></nav>' +
      '<header class="page-head in-shell">' +
      '<div><p class="eyebrow">Читать и скачивать</p><h1>Библиотека</h1></div>' +
      '<p class="page-desc">Документы Церкви, авторские произведения и переводы. Превью ведут на карточку произведения.</p>' +
      '</header>' +
      '<div class="lib-hub-sections">' +
      '<a class="lib-hub-tile" href="library.html?section=church">' +
      '<span class="lib-hub-kicker">Подраздел</span><strong>Документы Церкви</strong>' +
      '<span>Энциклики, послания, фильтры по Папе, типу и темам</span></a>' +
      '<a class="lib-hub-tile" href="library.html?section=books">' +
      '<span class="lib-hub-kicker">Подраздел</span><strong>Книги</strong>' +
      '<span>Жития, духовность, детская литература и другие издания</span></a>' +
      '</div>' +
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
      sec.categories
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
      '</div>' +
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
      ['Автор', item.author],
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
      '<div class="lib-book-cover" style="' +
      coverStyle(item) +
      '">' +
      '<span>' +
      esc((main || '?').slice(0, 1)) +
      '</span>' +
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
      '<p class="lib-book-author">' +
      esc(item.author || '') +
      '</p>' +
      '<div class="lib-flag-row">' +
      flagBadges(item) +
      '</div>' +
      '<p class="lib-annotation">' +
      esc(item.annotation || '') +
      '</p>' +
      '<div class="lib-meta">' +
      metaRows
        .filter(function (r) {
          return r[1];
        })
        .map(function (r) {
          return (
            '<div><span>' +
            esc(r[0]) +
            '</span><strong>' +
            esc(r[1]) +
            '</strong></div>'
          );
        })
        .join('') +
      '</div>' +
      (themes ? '<div class="lib-tags">' + themes + '</div>' : '') +
      '<div class="lib-download-block">' +
      '<h2>Скачать</h2>' +
      '<div class="lib-dl-row">' +
      (downloads || '<p class="archive-empty">Файлы скоро появятся.</p>') +
      '</div>' +
      (item.buyUrl
        ? '<a class="lib-buy" href="' +
          esc(item.buyUrl) +
          '" target="_blank" rel="noopener">Купить бумажную / электронную версию →</a>'
        : '') +
      '</div>' +
      (quotes ? '<div class="lib-quotes"><h2>Цитаты</h2>' + quotes + '</div>' : '') +
      '<p class="lib-future-note">Читалка на сайте, избранное и связанные статьи — в следующих итерациях.</p>' +
      '</div></article>' +
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

  function langLabel(code) {
    var map = { la: 'латынь', it: 'итальянский', es: 'испанский', fr: 'французский', ru: 'русский', en: 'английский' };
    return map[code] || code || '—';
  }

  /* ---------- Boot ---------- */
  function boot() {
    var libRoot = document.getElementById('library-root');
    var bookRoot = document.getElementById('book-root');
    if (bookRoot) {
      renderBook(bookRoot);
      return;
    }
    if (!libRoot) return;
    var section = params().section;
    if (section === 'church' || section === 'books') renderSection(libRoot, section);
    else renderHub(libRoot);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
