(function () {
  'use strict';

  var catalog = (window.YakVideos && window.YakVideos.items) || [];
  var channels = (window.YakVideos && window.YakVideos.channels) || [];
  var V = window.Vera;
  var all = catalog.slice();
  var filter = 'all';
  var featuredEl = document.getElementById('video-featured');
  var largeGrid = document.getElementById('video-large');
  var longBand = document.getElementById('video-long-band');
  var smallGrid = document.getElementById('video-small');
  var partnersEl = document.getElementById('video-partners');
  var latestEl = document.getElementById('video-latest');
  var shortBand = document.getElementById('video-short-band');
  var partnersBand = document.getElementById('video-partners-band');
  var latestBand = document.getElementById('video-latest-band');
  var dialog = document.getElementById('video-dialog');
  var player = document.getElementById('video-player');
  var embedEl = document.getElementById('video-embed');
  var dialogTitle = document.getElementById('video-dialog-title');
  var channelRoot = document.getElementById('video-channel-root');

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
      esc(v.speaker || channelName(v.channelId) || 'Фильм') +
      (v.duration ? ' · ' + fmtDur(v.duration) : '') +
      '</p>' +
      '<button type="button" class="yt-watch yt-open" data-id="' +
      esc(String(v.id)) +
      '">Смотреть</button>' +
      '</div></article>'
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
      esc(v.speaker || channelName(v.channelId) || 'Видео') +
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

  function playlistCard(c) {
    return (
      '<a class="yt-card vp-cycle" href="' +
      esc(c.href) +
      '" target="_blank" rel="noopener">' +
      thumbHtml({ thumb: c.thumb || '' }, 'yt-thumb--wide') +
      '<span class="yt-meta">' +
      '<strong>' +
      esc(c.title || 'Цикл') +
      '</strong>' +
      '<em>Плейлист · на площадке партнёра</em></span></a>'
    );
  }

  function channelName(id) {
    var ch = channels.filter(function (c) { return c.id === id; })[0];
    return ch ? ch.name : '';
  }

  function channelCount(id) {
    var videos = all.filter(function (v) { return v.channelId === id; }).length;
    var ch = channels.filter(function (c) { return c.id === id; })[0];
    var playlists = (ch && ch.cycles ? ch.cycles.length : 0);
    return videos + playlists;
  }

  function partnerCard(ch) {
    var n = channelCount(ch.id);
    return (
      '<a class="vp-card" href="video-channel.html?id=' + encodeURIComponent(ch.id) + '">' +
      (ch.logo
        ? '<span class="vp-logo" style="background-image:url(\'' + esc(ch.logo) + '\')"></span>'
        : '<span class="vp-logo is-empty">' + esc((ch.name || '?').charAt(0)) + '</span>') +
      '<span class="vp-copy">' +
      '<strong>' + esc(ch.name) + '</strong>' +
      '<small>' + n + ' ' + (n === 1 ? 'материал' : n < 5 ? 'материала' : 'материалов') + '</small>' +
      '</span></a>'
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

  function clearPlayer() {
    if (player) {
      player.pause();
      player.removeAttribute('src');
      player.removeAttribute('poster');
      player.load();
      player.hidden = true;
    }
    if (embedEl) {
      embedEl.removeAttribute('src');
      embedEl.hidden = true;
    }
  }

  function openItem(id) {
    var item = all.filter(function (x) {
      return String(x.id) === String(id);
    })[0];
    if (!item) return;

    /* Только внешняя ссылка (VK и т.п.) — открываем у партнёра */
    if (!item.videoUrl && !item.embedUrl && item.externalUrl) {
      window.open(item.externalUrl, '_blank', 'noopener');
      return;
    }
    if (!dialog) {
      if (item.externalUrl) window.open(item.externalUrl, '_blank', 'noopener');
      return;
    }

    if (dialogTitle) dialogTitle.textContent = item.title || '';
    dialog.classList.toggle('is-short', item.type === 'short');
    clearPlayer();

    if (item.embedUrl && embedEl) {
      embedEl.hidden = false;
      if (player) player.hidden = true;
      embedEl.src = item.embedUrl;
      dialog.showModal();
      return;
    }

    if (item.videoUrl && player) {
      player.hidden = false;
      if (embedEl) embedEl.hidden = true;
      player.poster = item.thumb || '';
      player.src = item.videoUrl;
      dialog.showModal();
      if (player.play) player.play().catch(function () {});
      return;
    }

    if (item.externalUrl) window.open(item.externalUrl, '_blank', 'noopener');
  }

  function loopRail(el) {
    if (!el || el._looped) return;
    el._looped = true;
    el.addEventListener('scroll', function () {
      if (el.scrollWidth - el.scrollLeft - el.clientWidth < 80) {
        el.scrollLeft = 8;
      }
    });
  }

  function renderHome() {
    var longs = all.filter(function (v) { return v.type === 'long'; });
    var shorts = all.filter(function (v) { return v.type === 'short'; });
    var partners = channels.filter(function (c) {
      return c.id !== 'ocean-mercy' && (channelCount(c.id) > 0 || (c.links && c.links.length));
    });
    var showLong = filter !== 'short';
    var showShort = filter !== 'long';
    var feature = showLong && longs[0] ? longs[0] : null;
    var rest = showLong ? longs.slice(feature ? 1 : 0) : [];

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
      if (filter !== 'short') loopRail(smallGrid);
    }
    if (partnersBand) partnersBand.hidden = filter === 'short' || !partners.length;
    if (partnersEl) partnersEl.innerHTML = partners.map(partnerCard).join('');
    if (latestBand) latestBand.hidden = true;
  }

  function renderChannel() {
    if (!channelRoot) return;
    var id = new URLSearchParams(location.search).get('id') || '';
    var ch = channels.filter(function (c) { return c.id === id; })[0];
    if (!ch) {
      channelRoot.innerHTML =
        '<nav class="breadcrumbs in-shell"><a href="video.html">Видео</a><span>/</span><span>Не найден</span></nav>' +
        '<header class="page-head in-shell"><div><h1>Канал не найден</h1></div></header>' +
        '<p class="in-shell"><a class="wlink" href="video.html">К списку партнёров</a></p>';
      return;
    }
    document.title = ch.name + ' — Видео — ЯКатолик';
    var mine = all.filter(function (v) { return v.channelId === ch.id; });
    var shorts = mine.filter(function (v) { return v.type === 'short'; });
    var cycles = {};
    mine.filter(function (v) { return v.cycle; }).forEach(function (v) {
      if (!cycles[v.cycle]) cycles[v.cycle] = [];
      cycles[v.cycle].push(v);
    });
    var films = mine.filter(function (v) { return v.type !== 'short' && !v.cycle; });
    var playlists = ch.cycles || [];
    var links = (ch.links || []).map(function (l) {
      return '<a class="author-social" href="' + esc(l.href) + '" target="_blank" rel="noopener">' + esc(l.label) + '</a>';
    }).join('');
    var cycleKeys = Object.keys(cycles);
    var sections = '';

    if (shorts.length) {
      sections +=
        '<section class="video-band"><div class="block-head"><h2>Shorts</h2><span class="rule"></span></div>' +
        '<div class="yt-shorts-rail" id="ch-shorts">' +
        shorts.map(shortCard).join('') +
        '</div></section>';
    }

    if (playlists.length || cycleKeys.length) {
      sections += '<section class="video-band"><div class="block-head"><h2>Циклы</h2><span class="rule"></span></div>';
      if (playlists.length) {
        sections += '<div class="yt-film-grid">' + playlists.map(playlistCard).join('') + '</div>';
      }
      cycleKeys.forEach(function (name) {
        sections +=
          '<div class="block-head" style="margin-top:18px"><h3 style="margin:0;font-size:18px">' +
          esc(name) +
          '</h3><span class="rule"></span></div>' +
          '<div class="yt-film-grid">' +
          cycles[name].map(filmCard).join('') +
          '</div>';
      });
      sections += '</section>';
    }

    if (films.length) {
      sections +=
        '<section class="video-band"><div class="block-head"><h2>Видео</h2><span class="rule"></span></div>' +
        '<div class="yt-film-grid">' +
        films.map(filmCard).join('') +
        '</div></section>';
    }

    channelRoot.innerHTML =
      '<nav class="breadcrumbs in-shell"><a href="index.html">Главная</a><span>/</span><a href="video.html">Видео</a><span>/</span><span>' +
      esc(ch.name) +
      '</span></nav>' +
      '<section class="author-head">' +
      (ch.logo
        ? '<span class="author-ava" style="background-image:url(\'' + esc(ch.logo) + '\')"></span>'
        : '<span class="author-ava initials">' + esc((ch.name || '?').charAt(0)) + '</span>') +
      '<div class="author-head-body">' +
      '<p class="eyebrow">Канал партнёра</p>' +
      '<h1>' +
      esc(ch.name) +
      '</h1>' +
      (ch.bio ? '<p class="author-bio">' + esc(ch.bio) + '</p>' : '') +
      (links ? '<div class="author-socials">' + links + '</div>' : '') +
      '<p><a class="wlink" href="video.html#video-partners-band">К списку партнёров</a></p>' +
      '</div></section>' +
      sections;
    bind(channelRoot);
  }

  if (dialog) {
    dialog.addEventListener('close', function () {
      clearPlayer();
      dialog.classList.remove('is-short');
    });
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
      renderHome();
    });
  }

  if (channelRoot) renderChannel();
  else renderHome();
})();
