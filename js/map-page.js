(function () {
  'use strict';
  var API = window.VeraTemples;
  var C = window.VeraConfig || {};
  if (!API || typeof L === 'undefined') return;

  var MOSCOW = [55.7558, 37.6173];
  var listEl = document.getElementById('map-list');
  var detailEl = document.getElementById('map-detail');
  var statusEl = document.getElementById('map-status');
  var countEl = document.getElementById('map-count');
  var searchEl = document.getElementById('map-search');
  var modeBadge = document.getElementById('map-mode');

  var temples = [];
  var markersById = {};
  var selectedId = null;
  var searchTimer = null;
  var layerGroup = null;

  var map = L.map('map-canvas', {
    zoomControl: false,
    attributionControl: true,
  }).setView(MOSCOW, 11);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // Тёмные тайлы под портал (Carto Dark Matter — без ключа)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap &copy; CARTO',
  }).addTo(map);

  layerGroup = L.layerGroup().addTo(map);

  function markerIcon(active) {
    return L.divIcon({
      className: 'temple-marker' + (active ? ' is-active' : ''),
      html: '<span class="pin"></span>',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
  }

  function bboxOfMap() {
    var b = map.getBounds();
    return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
  }

  function setStatus(text, kind) {
    if (!statusEl) return;
    statusEl.textContent = text || '';
    statusEl.dataset.kind = kind || '';
  }

  function updateModeBadge(pack) {
    if (!modeBadge) return;
    if (pack.demo || pack.fallback || pack.source === 'demo') {
      modeBadge.textContent = 'демо';
      modeBadge.className = 'chip v2';
      modeBadge.title = 'Показывает демо-точки. Подключите Python → TEMPLES_API_BASE в js/config.js';
    } else {
      modeBadge.textContent = 'live';
      modeBadge.className = 'chip v1';
      modeBadge.title = 'Данные с ' + (C.TEMPLES_API_BASE || '');
    }
  }

  function filtered() {
    var q = (searchEl && searchEl.value || '').trim().toLowerCase();
    if (!q) return temples;
    return temples.filter(function (t) {
      return (t.name + ' ' + t.city + ' ' + t.address + ' ' + t.diocese).toLowerCase().indexOf(q) !== -1;
    });
  }

  function renderList() {
    if (!listEl) return;
    var items = filtered();
    if (!items.length) {
      listEl.innerHTML = '<p class="map-empty">В этой области нет храмов</p>';
      return;
    }
    listEl.innerHTML = items.map(function (t) {
      return (
        '<button type="button" class="map-item' + (t.id === selectedId ? ' on' : '') + '" data-id="' + esc(t.id) + '">' +
        '<span class="kind">' + esc(kindLabel(t.kind)) + '</span>' +
        '<strong>' + esc(t.name) + '</strong>' +
        '<small>' + esc(t.city || t.address) + '</small></button>'
      );
    }).join('');
    listEl.querySelectorAll('.map-item').forEach(function (btn) {
      btn.addEventListener('click', function () { selectTemple(btn.getAttribute('data-id'), true); });
    });
  }

  function kindLabel(k) {
    if (k === 'cathedral') return 'Собор';
    if (k === 'chapel') return 'Часовня';
    return 'Приход';
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderDetail(t) {
    if (!detailEl) return;
    if (!t) {
      detailEl.hidden = true;
      detailEl.innerHTML = '';
      return;
    }
    detailEl.hidden = false;
    var links = [];
    if (t.website) links.push('<a href="' + esc(t.website) + '" target="_blank" rel="noopener">Сайт</a>');
    if (t.phone) links.push('<a href="tel:' + esc(t.phone) + '">' + esc(t.phone) + '</a>');
    detailEl.innerHTML =
      '<button type="button" class="map-detail-close" id="map-detail-close" aria-label="Закрыть">×</button>' +
      '<span class="kind">' + esc(kindLabel(t.kind)) + '</span>' +
      '<h3>' + esc(t.name) + '</h3>' +
      (t.diocese ? '<p class="diocese">' + esc(t.diocese) + '</p>' : '') +
      (t.address ? '<p class="addr">' + esc(t.address) + (t.city ? ', ' + esc(t.city) : '') + '</p>' : '') +
      (t.hours ? '<p class="hours">' + esc(t.hours) + '</p>' : '') +
      (t.description ? '<p class="desc">' + esc(t.description) + '</p>' : '') +
      (links.length ? '<div class="links">' + links.join('') + '</div>' : '') +
      '<a class="map-route" target="_blank" rel="noopener" href="https://yandex.ru/maps/?rtext=~' +
        t.latitude + ',' + t.longitude + '">Маршрут в Яндекс.Картах →</a>';
    var close = document.getElementById('map-detail-close');
    if (close) close.addEventListener('click', function () { selectTemple(null); });
  }

  function paintMarkers(list) {
    layerGroup.clearLayers();
    markersById = {};
    list.forEach(function (t) {
      var m = L.marker([t.latitude, t.longitude], { icon: markerIcon(t.id === selectedId) });
      m.on('click', function () { selectTemple(t.id, false); });
      m.addTo(layerGroup);
      markersById[t.id] = m;
    });
  }

  function selectTemple(id, fly) {
    selectedId = id;
    var t = temples.find(function (x) { return x.id === id; }) || null;
    Object.keys(markersById).forEach(function (k) {
      markersById[k].setIcon(markerIcon(k === id));
    });
    renderList();
    renderDetail(t);
    if (t && fly) map.flyTo([t.latitude, t.longitude], Math.max(map.getZoom(), 14), { duration: 0.7 });
  }

  var abortCtrl = null;
  function loadViewport() {
    if (abortCtrl) abortCtrl.abort();
    abortCtrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    setStatus('Загрузка…');
    API.search(bboxOfMap(), { signal: abortCtrl && abortCtrl.signal })
      .then(function (pack) {
        temples = pack.temples || [];
        updateModeBadge(pack);
        if (countEl) countEl.textContent = temples.length + ' на карте';
        if (pack.fallback) {
          setStatus('API недоступен — показано демо. Подключите Python (см. HANDOFF.md)', 'warn');
        } else if (pack.source === 'demo') {
          setStatus('Демо-режим. В js/config.js укажите TEMPLES_API_BASE', 'warn');
        } else {
          setStatus('Источник: ' + pack.source, 'ok');
        }
        paintMarkers(filtered());
        renderList();
        if (selectedId && !temples.find(function (t) { return t.id === selectedId; })) {
          selectTemple(null);
        } else if (selectedId) {
          renderDetail(temples.find(function (t) { return t.id === selectedId; }));
        }
      })
      .catch(function () {
        setStatus('Ошибка загрузки', 'err');
      });
  }

  var moveTimer = null;
  map.on('moveend', function () {
    clearTimeout(moveTimer);
    moveTimer = setTimeout(loadViewport, 280);
  });

  if (searchEl) {
    searchEl.addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        paintMarkers(filtered());
        renderList();
      }, 160);
    });
  }

  var locateBtn = document.getElementById('map-locate');
  if (locateBtn && navigator.geolocation) {
    locateBtn.addEventListener('click', function () {
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          map.flyTo([pos.coords.latitude, pos.coords.longitude], 13, { duration: 0.8 });
        },
        function () { setStatus('Геолокация недоступна', 'warn'); },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }

  var russiaBtn = document.getElementById('map-russia');
  if (russiaBtn) {
    russiaBtn.addEventListener('click', function () {
      map.flyTo([55.0, 55.0], 4, { duration: 1 });
    });
  }

  API.stats().then(function (s) {
    var el = document.getElementById('map-stats');
    if (el && s && s.count != null) {
      el.textContent = Number(s.count).toLocaleString('ru-RU') + ' в базе · ' + (s.source || '');
    }
  });

  loadViewport();
})();
