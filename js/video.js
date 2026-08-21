(function () {
  'use strict';

  var catalog = (window.YakVideos && window.YakVideos.items) || [];
  var V = window.Vera;
  var all = catalog.slice();
  var filter = 'all';
  var featuredEl = document.getElementById('video-featured');
  var largeGrid = document.getElementById('video-large');
  var smallGrid = document.getElementById('video-small');
  var longBand = document.getElementById('video-long-band');
  var shortBand = document.getElementById('video-short-band');
  var dialog = document.getElementById('video-dialog');
  var player = document.getElementById('video-player');
  var dialogTitle = document.getElementById('video-dialog-title');

  function esc(s) {
    if (V && V.escapeHtml) return V.escapeHtml(s);
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function fmtDur(sec) {
    sec = Math.max(0, Math.round(Number(sec) || 0));
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    if (m >= 60) {
      var h = Math.floor(m / 60);
      return h + ':' + pad(m % 60) + ':' + pad(s);
    }
    return m + ':' + pad(s);
  }

  function thumbHtml(v, extraClass) {
    return (
      '<span class="yt-thumb' +
      (extraClass ? ' ' + extraClass : '') +
      '">' +
      (v.thumb
        ? '<img src="' + esc(v.thumb) + '" alt="" loading="lazy" />'
        : '<span class="yt-thumb-empty"></span>') +
      '<i class="yt-play" aria-hidden="true"></i>' +
      (v.duration ? '<b class="yt-time">' + esc(fmtDur(v.duration)) + '</b>' : '') +
      '</span>'
    );
  }

  function filmCard(v) {
    return (
      '<article class="yt-card">' +
      '<button type="button" class="yt-open" data-id="' +
      esc(String(v.id)) +
      '" aria-label="Смотреть: ' +
      esc(v.title || '') +
      '">' +
      thumbHtml(v, 'yt-thumb--wide') +
      '<span class="yt-meta">' +
      '<strong>' +
      esc(v.title || 'Без названия') +
      '</strong>' +
      '<em>' +
      esc(v.speaker || 'Фильм') +
      '</em></span></button></article>'
    );
  }

  function shortCard(v) {
    return (
      '<article class="yt-short">' +
      '<button type="button" class="yt-open" data-id="' +
      esc(String(v.id)) +
      '" aria-label="Смотреть: ' +
      esc(v.title || '') +
      '">' +
      thumbHtml(v, 'yt-thumb--portrait') +
      '<span class="yt-meta">' +
      '<strong>' +
      esc(v.title || 'Без названия') +
      '</strong>' +
      (v.speaker ? '<em>' + esc(v.speaker) + '</em>' : '') +
      '</span></button></article>'
    );
  }

  function featuredHtml(v) {
    return (
      '<article class="yt-featured">' +
      '<button type="button" class="yt-open yt-featured-media" data-id="' +
      esc(String(v.id)) +
      '" aria-label="Смотреть: ' +
      esc(v.title || '') +
      '">' +
      thumbHtml(v, 'yt-thumb--wide') +
      '</button>' +
      '<div class="yt-featured-copy">' +
      '<p class="eyebrow">Фильм</p>' +
      '<h2>' +
      esc(v.title || '') +
      '</h2>' +
      (v.description ? '<p>' + esc(v.description) + '</p>' : '') +
      '<p class="yt-featured-by">' +
      esc(v.speaker || 'Фильм') +
      (v.duration ? ' · ' + fmtDur(v.duration) : '') +
      '</p>' +
      '<button type="button" class="yt-watch yt-open" data-id="' +
      esc(String(v.id)) +
      '">Смотреть</button>' +
      '</div></article>'
    );
  }

  function bind(root) {
    if (!root) return;
    root.querySelectorAll('.yt-open').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openItem(btn.getAttribute('data-id'));
      });
    });
  }

  function openItem(id) {
    var item = all.filter(function (x) {
      return String(x.id) === String(id);
    })[0];
    if (!item || !item.videoUrl || !dialog || !player) return;
    if (dialogTitle) dialogTitle.textContent = item.title || '';
    dialog.classList.toggle('is-short', item.type === 'short');
    player.poster = item.thumb || '';
    player.src = item.videoUrl;
    dialog.showModal();
    if (player.play) player.play().catch(function () {});
  }

  function render() {
    var longs = all.filter(function (v) {
      return v.type === 'long';
    });
    var shorts = all.filter(function (v) {
      return v.type !== 'long';
    });
    var showLong = filter !== 'short';
    var showShort = filter !== 'long';
    var feature = showLong && longs[0] ? longs[0] : null;
    var rest = showLong ? longs.slice(feature ? 1 : 0) : [];
    if (filter === 'long') rest = longs.slice(1);

    if (featuredEl) {
      featuredEl.hidden = !feature;
      featuredEl.innerHTML = feature ? featuredHtml(feature) : '';
      bind(featuredEl);
    }
    if (longBand) longBand.hidden = !rest.length;
    if (largeGrid) {
      largeGrid.innerHTML = rest.map(filmCard).join('');
      bind(largeGrid);
    }
    if (shortBand) shortBand.hidden = !showShort || !shorts.length;
    if (smallGrid) {
      smallGrid.classList.toggle('yt-shorts-grid', filter === 'short');
      smallGrid.classList.toggle('yt-shorts-rail', filter !== 'short');
      smallGrid.innerHTML = shorts.map(shortCard).join('');
      bind(smallGrid);
    }
  }

  var tabs = document.getElementById('video-tabs');
  if (tabs) {
    tabs.addEventListener('click', function (e) {
      var btn = e.target.closest('.chip');
      if (!btn) return;
      filter = btn.getAttribute('data-type') || 'all';
      tabs.querySelectorAll('.chip').forEach(function (c) {
        c.classList.toggle('active', c === btn);
      });
      render();
    });
  }

  if (dialog) {
    dialog.addEventListener('close', function () {
      if (!player) return;
      player.pause();
      player.removeAttribute('src');
      player.removeAttribute('poster');
      player.load();
      dialog.classList.remove('is-short');
    });
  }

  render();
})();
