/** Афиша — лента месяца, фильтры, сетка, партнёры */
(function () {
  'use strict';
  var A = window.YakAfisha;
  var root = document.getElementById('events-root');
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

  function addDays(iso, n) {
    var p = String(iso).split('-').map(Number);
    var d = new Date(p[0], p[1] - 1, p[2] + n);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function startOfWeek(iso) {
    var p = String(iso).split('-').map(Number);
    var d = new Date(p[0], p[1] - 1, p[2]);
    var day = d.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  var today = A.todayIso();
  var now = new Date();
  var viewYear = now.getFullYear();
  var viewMonth = now.getMonth();

  var params = new URLSearchParams(location.search);
  var state = {
    selectedDate: params.get('date') || '',
    categories: [],
    when: { from: '', to: '', today: false, tomorrow: false, week: false },
    where: '',
    cost: [],
    reg: [],
    organizer: params.get('org') || '',
    filtersOpen: false
  };

  if (params.get('cat')) {
    state.categories = params.get('cat').split(',').filter(Boolean);
  }

  function toggleIn(arr, id) {
    var i = arr.indexOf(id);
    if (i >= 0) arr.splice(i, 1);
    else arr.push(id);
  }

  function filtered() {
    var list = A.upcomingEvents(today);
    var from = state.when.from;
    var to = state.when.to;

    if (state.when.today) {
      from = today; to = today;
    } else if (state.when.tomorrow) {
      from = addDays(today, 1); to = from;
    } else if (state.when.week) {
      from = startOfWeek(today);
      to = addDays(from, 6);
    }

    if (state.selectedDate) {
      list = list.filter(function (e) {
        var end = A.eventEnd(e);
        return e.date <= state.selectedDate && end >= state.selectedDate;
      });
    } else if (from || to) {
      list = list.filter(function (e) {
        var end = A.eventEnd(e);
        if (from && end < from) return false;
        if (to && e.date > to) return false;
        return true;
      });
    }

    if (state.categories.length) {
      list = list.filter(function (e) { return state.categories.indexOf(e.category) !== -1; });
    }
    if (state.cost.length) {
      list = list.filter(function (e) { return state.cost.indexOf(e.cost) !== -1; });
    }
    if (state.reg.length) {
      list = list.filter(function (e) { return state.reg.indexOf(e.registration) !== -1; });
    }
    if (state.organizer) {
      list = list.filter(function (e) { return e.organizerId === state.organizer; });
    }
    if (state.where.trim()) {
      var q = state.where.trim().toLowerCase();
      list = list.filter(function (e) {
        return [e.city, e.venue, e.place, e.title].join(' ').toLowerCase().indexOf(q) !== -1;
      });
    }
    return list;
  }

  function eventHref(e) {
    var href = e && e.href ? String(e.href) : '';
    if (!href || href === '#' || href === 'map.html' || href.indexOf('map.html') === 0) {
      return e && e.date
        ? 'events.html?date=' + encodeURIComponent(String(e.date).slice(0, 10))
        : 'events.html';
    }
    return href;
  }

  function cardHtml(e) {
    var org = A.organizerById(e.organizerId);
    var tone = e.coverTone || (org && org.coverTone) || '#5c5346';
    var href = eventHref(e);
    var external = /^https?:\/\//.test(href);
    var placeLine = [e.venue, e.city].filter(Boolean).join(' · ');
    return (
      '<a class="af-card" href="' + esc(href) + '"' +
      (external ? ' target="_blank" rel="noopener"' : '') + '>' +
      '<span class="af-card-cover" style="background:linear-gradient(155deg,' + esc(tone) + ',#1a1816)">' +
      '<span class="af-card-date"><b>' + esc(fmtLong(e.date)) + '</b>' +
      (e.time ? '<small>' + esc(e.time) + '</small>' : '') + '</span></span>' +
      '<span class="af-card-body">' +
      '<span class="af-card-chips">' +
      '<span class="cal-chip">' + esc(A.categoryLabel(e.category)) + '</span>' +
      '<span class="cal-chip ghost">' + esc(A.costLabel(e.cost)) + '</span>' +
      '</span>' +
      '<strong>' + esc(e.title) + '</strong>' +
      (placeLine ? '<span class="cal-place">' + esc(placeLine) + '</span>' : '') +
      (org ? '<span class="af-card-org">' + esc(org.short || org.name) + '</span>' : '') +
      '</span></a>'
    );
  }

  function filtersHtml() {
    return (
      '<aside class="af-filters" id="af-filters">' +
      '<div class="af-filters-head">' +
      '<h2>Рубрикатор</h2>' +
      '<button type="button" class="af-filters-close" id="af-filters-close" aria-label="Закрыть">×</button>' +
      '</div>' +

      '<fieldset class="af-field">' +
      '<legend>Когда</legend>' +
      '<label class="af-check"><input type="checkbox" data-when="today"' + (state.when.today ? ' checked' : '') + '> Сегодня</label>' +
      '<label class="af-check"><input type="checkbox" data-when="tomorrow"' + (state.when.tomorrow ? ' checked' : '') + '> Завтра</label>' +
      '<label class="af-check"><input type="checkbox" data-when="week"' + (state.when.week ? ' checked' : '') + '> На этой неделе</label>' +
      '<div class="af-range">' +
      '<label>С <input type="date" id="af-from" value="' + esc(state.when.from) + '"></label>' +
      '<label>По <input type="date" id="af-to" value="' + esc(state.when.to) + '"></label>' +
      '</div></fieldset>' +

      '<fieldset class="af-field">' +
      '<legend>Где</legend>' +
      '<input type="search" id="af-where" placeholder="Город или площадка" value="' + esc(state.where) + '">' +
      '</fieldset>' +

      '<fieldset class="af-field">' +
      '<legend>Что</legend>' +
      A.CATEGORIES.map(function (c) {
        return '<label class="af-check"><input type="checkbox" data-cat="' + esc(c.id) + '"' +
          (state.categories.indexOf(c.id) !== -1 ? ' checked' : '') + '> ' + esc(c.label) + '</label>';
      }).join('') +
      '</fieldset>' +

      '<fieldset class="af-field">' +
      '<legend>Стоимость</legend>' +
      A.COST.map(function (c) {
        return '<label class="af-check"><input type="checkbox" data-cost="' + esc(c.id) + '"' +
          (state.cost.indexOf(c.id) !== -1 ? ' checked' : '') + '> ' + esc(c.label) + '</label>';
      }).join('') +
      '</fieldset>' +

      '<fieldset class="af-field">' +
      '<legend>Регистрация</legend>' +
      A.REG.map(function (c) {
        return '<label class="af-check"><input type="checkbox" data-reg="' + esc(c.id) + '"' +
          (state.reg.indexOf(c.id) !== -1 ? ' checked' : '') + '> ' + esc(c.label) + '</label>';
      }).join('') +
      '</fieldset>' +

      '<button type="button" class="af-reset" id="af-reset">Сбросить фильтры</button>' +
      '</aside>'
    );
  }

  function partnersHtml() {
    return (
      '<section class="af-partners">' +
      '<h2 class="af-section-title">Подборки партнёров</h2>' +
      A.PARTNER_IDS.map(function (id) {
        var org = A.organizerById(id);
        if (!org) return '';
        var items = A.byOrganizer(id, 8);
        return (
          '<div class="af-partner-block">' +
          '<div class="af-partner-head">' +
          '<a class="af-partner-title" href="organizer.html?id=' + encodeURIComponent(org.id) + '">' +
          esc(org.partnerTitle || org.name) + ' <span aria-hidden="true">→</span></a>' +
          '</div>' +
          (items.length
            ? '<div class="af-partner-rail">' + items.map(cardHtml).join('') + '</div>'
            : '<p class="archive-empty">Скоро появятся анонсы</p>') +
          '</div>'
        );
      }).join('') +
      '<div class="af-org-cards">' +
      '<h2 class="af-section-title">Организаторы</h2>' +
      '<div class="af-org-grid">' +
      A.ORGANIZERS.map(function (o) {
        return (
          '<a class="af-org-card" href="organizer.html?id=' + encodeURIComponent(o.id) + '">' +
          '<span class="af-org-mark" style="background:linear-gradient(145deg,' + esc(o.coverTone || '#5c5346') + ',#1a1816)"></span>' +
          '<strong>' + esc(o.name) + '</strong>' +
          '<span>' + esc(o.blurb) + '</span>' +
          '<em>Карточка и контакты →</em></a>'
        );
      }).join('') +
      '</div></div></section>'
    );
  }

  function render() {
    var keepWhere = document.activeElement && document.activeElement.id === 'af-where'
      ? document.activeElement.selectionStart
      : null;
    var days = A.monthDays(viewYear, viewMonth);
    var monthName = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'][viewMonth];
    var items = filtered();
    var orgFilter = state.organizer ? A.organizerById(state.organizer) : null;

    root.innerHTML =
      '<nav class="breadcrumbs in-shell"><a href="index.html">Главная</a><span>/</span><span>Афиша</span></nav>' +
      '<header class="page-head in-shell">' +
      '<div><p class="eyebrow">События</p><h1>Афиша</h1></div>' +
      '<p class="page-desc">Концерты, встречи, лекции, паломничества и реколлекции. Литургический день — в <a href="calendar.html">Дне Церкви</a>. Анонсы снимаются на следующий день после события.</p>' +
      '</header>' +

      '<section class="af-month">' +
      '<div class="af-month-bar">' +
      '<button type="button" class="af-month-nav" id="af-prev" aria-label="Предыдущий месяц">‹</button>' +
      '<h2>' + esc(monthName) + ' ' + viewYear + '</h2>' +
      '<button type="button" class="af-month-nav" id="af-next" aria-label="Следующий месяц">›</button>' +
      '</div>' +
      '<div class="af-month-strip" role="listbox" aria-label="Дни месяца">' +
      days.map(function (d) {
        return (
          '<button type="button" class="af-day' +
          (d.date === state.selectedDate ? ' on' : '') +
          (d.date === today ? ' is-today' : '') +
          (d.hasEvents ? ' has-events' : '') +
          '" data-date="' + esc(d.date) + '" role="option" aria-selected="' + (d.date === state.selectedDate) + '">' +
          '<span class="w">' + esc(d.weekday) + '</span>' +
          '<span class="n">' + d.day + '</span>' +
          '</button>'
        );
      }).join('') +
      '</div>' +
      (state.selectedDate
        ? '<p class="af-day-caption">События на <b>' + esc(fmtLong(state.selectedDate)) + '</b> · <button type="button" id="af-clear-day" class="af-text-btn">Все дни</button></p>'
        : '') +
      '</section>' +

      '<div class="af-cats" role="group" aria-label="Категории">' +
      A.CATEGORIES.map(function (c) {
        return (
          '<button type="button" class="af-cat' + (state.categories.indexOf(c.id) !== -1 ? ' on' : '') +
          '" data-cat="' + esc(c.id) + '">' + esc(c.label) + '</button>'
        );
      }).join('') +
      '</div>' +

      '<div class="af-toolbar">' +
      '<button type="button" class="af-filter-toggle" id="af-filter-toggle">Фильтры</button>' +
      '<p class="af-count">' + items.length + ' ' + (items.length === 1 ? 'событие' : 'событий') +
      (orgFilter ? ' · ' + esc(orgFilter.short || orgFilter.name) : '') + '</p>' +
      '</div>' +

      '<div class="af-layout' + (state.filtersOpen ? ' filters-open' : '') + '">' +
      '<div class="af-filters-backdrop" id="af-filters-backdrop" hidden></div>' +
      filtersHtml() +
      '<div class="af-main">' +
      (items.length
        ? '<div class="af-grid">' + items.map(cardHtml).join('') + '</div>'
        : '<p class="archive-empty">Нет событий по выбранным фильтрам.</p>') +
      '</div></div>' +

      partnersHtml() +
      '<p class="cal-footnote">Пилотные анонсы. Данные — в <code>js/events-data.js</code>. Уточняйте время у организаторов.</p>';

    bind();
    scrollSelectedDay();
    if (keepWhere != null) {
      var whereEl = document.getElementById('af-where');
      if (whereEl) {
        whereEl.focus();
        try { whereEl.setSelectionRange(keepWhere, keepWhere); } catch (e) {}
      }
    }
  }

  function scrollSelectedDay() {
    if (!state.selectedDate) return;
    var el = root.querySelector('.af-day.on');
    if (el && el.scrollIntoView) el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }

  function bindFilters() {
    root.querySelectorAll('[data-when]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var key = inp.getAttribute('data-when');
        state.when.today = false;
        state.when.tomorrow = false;
        state.when.week = false;
        if (inp.checked) state.when[key] = true;
        state.selectedDate = '';
        render();
      });
    });
    var from = document.getElementById('af-from');
    var to = document.getElementById('af-to');
    if (from) from.addEventListener('change', function () {
      state.when.from = from.value;
      state.when.today = state.when.tomorrow = state.when.week = false;
      state.selectedDate = '';
      render();
    });
    if (to) to.addEventListener('change', function () {
      state.when.to = to.value;
      state.when.today = state.when.tomorrow = state.when.week = false;
      state.selectedDate = '';
      render();
    });
    var where = document.getElementById('af-where');
    if (where) {
      where.addEventListener('input', function () {
        state.where = where.value;
        clearTimeout(where._t);
        where._t = setTimeout(render, 180);
      });
    }
    root.querySelectorAll('[data-cat]').forEach(function (inp) {
      if (inp.tagName !== 'INPUT') return;
      inp.addEventListener('change', function () {
        toggleIn(state.categories, inp.getAttribute('data-cat'));
        render();
      });
    });
    root.querySelectorAll('[data-cost]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        toggleIn(state.cost, inp.getAttribute('data-cost'));
        render();
      });
    });
    root.querySelectorAll('[data-reg]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        toggleIn(state.reg, inp.getAttribute('data-reg'));
        render();
      });
    });
    var reset = document.getElementById('af-reset');
    if (reset) reset.addEventListener('click', function () {
      state = {
        selectedDate: '', categories: [], when: { from: '', to: '', today: false, tomorrow: false, week: false },
        where: '', cost: [], reg: [], organizer: '', filtersOpen: state.filtersOpen
      };
      render();
    });
  }

  function setFiltersOpen(on) {
    state.filtersOpen = !!on;
    var layout = root.querySelector('.af-layout');
    var backdrop = document.getElementById('af-filters-backdrop');
    if (layout) layout.classList.toggle('filters-open', state.filtersOpen);
    if (backdrop) backdrop.hidden = !state.filtersOpen;
    document.body.classList.toggle('af-filters-open', state.filtersOpen);
  }

  function bind() {
    document.getElementById('af-prev').addEventListener('click', function () {
      viewMonth -= 1;
      if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
      render();
    });
    document.getElementById('af-next').addEventListener('click', function () {
      viewMonth += 1;
      if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
      render();
    });
    root.querySelectorAll('.af-day').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var d = btn.getAttribute('data-date');
        state.selectedDate = state.selectedDate === d ? '' : d;
        state.when.today = state.when.tomorrow = state.when.week = false;
        render();
      });
    });
    var clearDay = document.getElementById('af-clear-day');
    if (clearDay) clearDay.addEventListener('click', function () {
      state.selectedDate = '';
      render();
    });
    root.querySelectorAll('.af-cat').forEach(function (btn) {
      btn.addEventListener('click', function () {
        toggleIn(state.categories, btn.getAttribute('data-cat'));
        render();
      });
    });
    var toggle = document.getElementById('af-filter-toggle');
    if (toggle) toggle.addEventListener('click', function () { setFiltersOpen(!state.filtersOpen); });
    var close = document.getElementById('af-filters-close');
    if (close) close.addEventListener('click', function () { setFiltersOpen(false); });
    var backdrop = document.getElementById('af-filters-backdrop');
    if (backdrop) {
      backdrop.hidden = !state.filtersOpen;
      backdrop.addEventListener('click', function () { setFiltersOpen(false); });
    }
    bindFilters();
  }

  render();
})();
