(function () {
  'use strict';
  var API = window.VeraTemples;
  var C = window.VeraConfig || {};
  if (!API || typeof L === 'undefined') return;

  var MOSCOW = [55.7558, 37.6173];
  var listEl = document.getElementById('map-list');
  var statusEl = document.getElementById('map-status');
  var searchEl = document.getElementById('map-search');
  var searchMobile = document.getElementById('map-search-mobile');
  var modeBadge = document.getElementById('map-mode');
  var sheetEl = document.getElementById('map-sheet');
  var sheetBody = document.getElementById('map-sheet-body');
  var sheetBackdrop = document.getElementById('map-sheet-backdrop');

  var temples = [];
  var markersById = {};
  var selectedId = null;
  var searchTimer = null;
  var layerGroup = null;
  var isMobile = function () {
    return window.matchMedia('(max-width: 880px)').matches;
  };

  var map = L.map('map-canvas', {
    zoomControl: false,
    attributionControl: false,
    tapTolerance: 18,
  }).setView(MOSCOW, isMobile() ? 12 : 11);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '',
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
    modeBadge.hidden = true;
  }

  function searchQuery() {
    var a = (searchEl && searchEl.value) || '';
    var b = (searchMobile && searchMobile.value) || '';
    return (a || b).trim().toLowerCase();
  }

  function syncSearchInputs(from) {
    var val = from.value;
    if (searchEl && searchEl !== from) searchEl.value = val;
    if (searchMobile && searchMobile !== from) searchMobile.value = val;
  }

  function filtered() {
    var q = searchQuery();
    if (!q) return temples;
    return temples.filter(function (t) {
      return (t.name + ' ' + t.city + ' ' + t.address + ' ' + t.diocese).toLowerCase().indexOf(q) !== -1;
    });
  }

  function kindLabel(k) {
    if (k === 'cathedral') return 'Собор';
    if (k === 'chapel') return 'Часовня';
    return 'Приход';
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderList() {
    if (!listEl) return;
    var items = filtered();
    if (!items.length) {
      listEl.innerHTML = '<p class="map-empty">В этой области нет храмов</p>';
      return;
    }
    listEl.innerHTML = items
      .map(function (t) {
        var photo = t.imageUrls && t.imageUrls[0];
        return (
          '<button type="button" class="map-item' +
          (photo ? ' has-photo' : '') +
          (t.id === selectedId ? ' on' : '') +
          '" data-id="' +
          esc(t.id) +
          '">' +
          (photo
            ? '<span class="map-item-cover" style="background-image:url(\'' + esc(photo) + '\')"></span>'
            : '') +
          '<span class="map-item-body">' +
          '<span class="kind">' +
          esc(kindLabel(t.kind)) +
          '</span>' +
          '<strong>' +
          esc(t.name) +
          '</strong>' +
          '<small>' +
          esc(t.city || t.address) +
          '</small></span></button>'
        );
      })
      .join('');
    listEl.querySelectorAll('.map-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectTemple(btn.getAttribute('data-id'), true);
      });
    });
  }

  function cardHtml(t) {
    var photo = t.imageUrls && t.imageUrls[0];
    var actions = [];
    actions.push(
      '<a class="map-cta primary" target="_blank" rel="noopener" href="https://yandex.ru/maps/?rtext=~' +
        t.latitude +
        ',' +
        t.longitude +
        '">Маршрут</a>'
    );
    if (t.phone) {
      actions.push('<a class="map-cta" href="tel:' + esc(t.phone) + '">Позвонить</a>');
    }
    if (t.website) {
      actions.push(
        '<a class="map-cta" href="' + esc(t.website) + '" target="_blank" rel="noopener">Сайт</a>'
      );
    }

    return (
      '<div class="map-sheet-media">' +
      '<button type="button" class="map-sheet-close" id="map-sheet-close" aria-label="Закрыть">×</button>' +
      (photo
        ? '<div class="map-sheet-hero has-photo"><img src="' +
          esc(photo) +
          '" alt="" loading="eager" decoding="async" /></div>'
        : '<div class="map-sheet-hero map-sheet-hero-empty" aria-hidden="true"></div>') +
      '</div>' +
      '<div class="map-sheet-content">' +
      '<p class="kind">' +
      esc(kindLabel(t.kind)) +
      (t.city ? ' · ' + esc(t.city) : '') +
      '</p>' +
      '<h3 id="map-sheet-title">' +
      esc(t.name) +
      '</h3>' +
      (t.diocese ? '<p class="diocese">' + esc(t.diocese) + '</p>' : '') +
      (t.address ? '<p class="addr">' + esc(t.address) + '</p>' : '') +
      (t.hours ? '<p class="hours"><span>Часы</span> ' + esc(t.hours) + '</p>' : '') +
      (t.description ? '<p class="desc">' + esc(t.description) + '</p>' : '') +
      '<div class="map-cta-row">' +
      actions.join('') +
      '</div></div>'
    );
  }

  function flyToTemple(t, fly) {
    var zoom = Math.max(map.getZoom(), isMobile() ? 15 : 14);
    var latlng = L.latLng(t.latitude, t.longitude);
    if (!isMobile()) {
      if (fly) map.flyTo(latlng, zoom, { duration: 0.55 });
      else map.panTo(latlng);
      return;
    }
    // На мобиле поднимаем пин выше bottom sheet (~42% экрана)
    var offsetY = Math.round(window.innerHeight * 0.18);
    var target = map.project(latlng, zoom).add([0, offsetY]);
    var shifted = map.unproject(target, zoom);
    if (fly !== false) map.flyTo(shifted, zoom, { duration: 0.55 });
    else map.setView(shifted, zoom, { animate: true });
  }

  function openSheet(t) {
    if (!sheetEl || !sheetBody || !t) return;
    sheetBody.innerHTML = cardHtml(t);
    sheetEl.hidden = false;
    requestAnimationFrame(function () {
      sheetEl.classList.add('is-open');
    });
    document.body.classList.add('map-sheet-open');
    var close = document.getElementById('map-sheet-close');
    if (close) {
      close.addEventListener('click', function () {
        selectTemple(null);
      });
    }
  }

  function closeSheet() {
    if (!sheetEl) return;
    sheetEl.classList.remove('is-open');
    document.body.classList.remove('map-sheet-open');
    setTimeout(function () {
      if (!sheetEl.classList.contains('is-open')) {
        sheetEl.hidden = true;
        if (sheetBody) sheetBody.innerHTML = '';
      }
    }, 280);
  }

  function paintMarkers(list) {
    layerGroup.clearLayers();
    markersById = {};
    list.forEach(function (t) {
      var m = L.marker([t.latitude, t.longitude], { icon: markerIcon(t.id === selectedId) });
      m.on('click', function () {
        selectTemple(t.id, false);
      });
      m.addTo(layerGroup);
      markersById[t.id] = m;
    });
  }

  function selectTemple(id, fly) {
    selectedId = id;
    var t = temples.find(function (x) {
      return x.id === id;
    }) || null;

    Object.keys(markersById).forEach(function (k) {
      markersById[k].setIcon(markerIcon(k === id));
    });
    renderList();

    if (!t) {
      closeSheet();
      return;
    }

    openSheet(t);
    flyToTemple(t, fly || isMobile());
  }

  var abortCtrl = null;
  function loadViewport() {
    if (abortCtrl) abortCtrl.abort();
    abortCtrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    setStatus('Загрузка…');
    if (listEl && !temples.length) {
      listEl.innerHTML =
        '<div class="loading-row"><span class="spinner" role="status" aria-label="Загрузка"></span></div>';
    }
    API.search(bboxOfMap(), { signal: abortCtrl && abortCtrl.signal })
      .then(function (pack) {
        temples = pack.temples || [];
        updateModeBadge(pack);
        if (pack.fallback || pack.source === 'demo') {
          setStatus('Показаны примеры приходов', 'warn');
        } else {
          setStatus('', 'ok');
        }
        paintMarkers(filtered());
        renderList();
        if (selectedId && !temples.find(function (t) {
          return t.id === selectedId;
        })) {
          selectTemple(null);
        } else if (selectedId) {
          var cur = temples.find(function (t) {
            return t.id === selectedId;
          });
          if (cur) openSheet(cur);
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

  function onSearchInput(e) {
    syncSearchInputs(e.target);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      paintMarkers(filtered());
      renderList();
    }, 160);
  }
  if (searchEl) searchEl.addEventListener('input', onSearchInput);
  if (searchMobile) searchMobile.addEventListener('input', onSearchInput);

  function locate() {
    if (!navigator.geolocation) {
      setStatus('Геолокация недоступна', 'warn');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 13, { duration: 0.8 });
      },
      function () {
        setStatus('Геолокация недоступна', 'warn');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function russia() {
    map.flyTo([55.0, 55.0], 4, { duration: 1 });
  }

  var locateBtn = document.getElementById('map-locate');
  var russiaBtn = document.getElementById('map-russia');
  var locateMobile = document.getElementById('map-locate-mobile');
  var russiaMobile = document.getElementById('map-russia-mobile');
  if (locateBtn) locateBtn.addEventListener('click', locate);
  if (russiaBtn) russiaBtn.addEventListener('click', russia);
  if (locateMobile) locateMobile.addEventListener('click', locate);
  if (russiaMobile) russiaMobile.addEventListener('click', russia);

  if (sheetBackdrop) {
    sheetBackdrop.addEventListener('click', function () {
      selectTemple(null);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && selectedId) selectTemple(null);
  });

  window.addEventListener('resize', function () {
    map.invalidateSize();
  });

  // После layout — корректный размер карты на мобиле
  setTimeout(function () {
    map.invalidateSize();
  }, 80);

  loadViewport();
})();
