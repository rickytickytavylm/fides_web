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
      (v.channelId ? channelAvaHtml(v.channelId) : '') +
      '<span>' +
      esc(v.speaker || channelName(v.channelId) || 'Фильм') +
      (v.duration ? ' · ' + fmtDur(v.duration) : '') +
          '</span></p>' +
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
      metaHtml(v) +
      '</button></article>'
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

  function channelOf(id) {
    return channels.filter(function (c) { return c.id === id; })[0] || null;
  }

  function channelName(id) {
    var ch = channelOf(id);
    return ch ? ch.name : '';
  }

  function channelAvaHtml(id) {
    var ch = channelOf(id);
    if (!ch) return '';
    if (ch.logo) {
      return '<span class="yt-ava" style="background-image:url(\'' + esc(ch.logo) + '\')" aria-hidden="true"></span>';
    }
    return '<span class="yt-ava is-empty" aria-hidden="true">' + esc((ch.name || '?').charAt(0)) + '</span>';
  }

  function metaHtml(v) {
    var ava = v.channelId ? channelAvaHtml(v.channelId) : '';
    return (
      '<span class="yt-meta' + (ava ? ' yt-meta--ch' : '') + '">' +
      ava +
      '<span class="yt-meta-text">' +
      '<strong>' +
      esc(v.title || 'Без названия') +
      '</strong>' +
      '<em>' +
      esc(v.speaker || channelName(v.channelId) || 'Видео') +
      '</em></span></span>'
    );
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

  function bindRailHost(host) {
    if (!host) return;
    var rail = host.querySelector('.yt-shorts-rail') || host;
    host.querySelectorAll('[data-rail-prev]').forEach(function (btn) {
      btn.onclick = function () { rail.scrollBy({ left: -280, behavior: 'smooth' }); };
    });
    host.querySelectorAll('[data-rail-next]').forEach(function (btn) {
      btn.onclick = function () { rail.scrollBy({ left: 280, behavior: 'smooth' }); };
    });
  }

  function wrapRail(host, inner) {
    host.classList.remove('yt-shorts-rail');
    host.classList.add('rail-wrap');
    host.innerHTML =
      '<button type="button" class="rail-arrow" data-rail-prev aria-label="Назад">‹</button>' +
      '<div class="yt-shorts-rail">' + inner + '</div>' +
      '<button type="button" class="rail-arrow" data-rail-next aria-label="Вперёд">›</button>';
    bindRailHost(host);
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
    if (waitingPack()) { renderSkeleton(); return; }
    var longs = all.filter(function (v) { return v.type === 'long'; });
    var shorts = all.filter(function (v) { return v.type === 'short'; });
    var partners = channels.filter(function (c) {
      return c.id !== 'ocean-mercy' && (channelCount(c.id) > 0 || (c.links && c.links.length));
    });
    var showLong = filter !== 'short';
    var showShort = filter !== 'long';
    var rest = showLong ? longs : [];

    if (featuredEl) {
      featuredEl.hidden = true;
      featuredEl.innerHTML = '';
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
      if (filter !== 'short') {
        wrapRail(smallGrid, shorts.map(shortCard).join(''));
        bind(smallGrid);
        loopRail(smallGrid.querySelector('.yt-shorts-rail') || smallGrid);
      } else {
        smallGrid.classList.remove('rail-wrap');
        smallGrid.innerHTML = shorts.map(shortCard).join('');
        bind(smallGrid);
      }
    }
    if (partnersBand) partnersBand.hidden = filter === 'short' || !partners.length;
    if (partnersEl) partnersEl.innerHTML = partners.map(partnerCard).join('');
    if (latestBand) latestBand.hidden = true;
  }

  function waitingPack() {
    return !!(window.YakVideos && YakVideos.packState === 'wait');
  }

  function renderSkeleton() {
    var sk = function (n, style) { return new Array(n + 1).join('<div class="sk" aria-hidden="true" style="' + style + '"></div>'); };
    if (partnersBand) partnersBand.hidden = false;
    if (partnersEl) {
      partnersEl.innerHTML = new Array(5).join(
        '<div class="vp-card" aria-hidden="true"><span class="vp-logo sk"></span><span class="vp-copy" style="flex:1">' +
        '<span class="sk sk-line" style="display:block;width:70%;height:15px;margin-top:10px"></span>' +
        '<span class="sk sk-line" style="display:block;width:40%;height:12px;margin-top:9px"></span></span></div>'
      );
    }
    if (featuredEl) {
      featuredEl.hidden = true;
      featuredEl.innerHTML = '';
    }
    if (longBand) longBand.hidden = false;
    if (largeGrid) largeGrid.innerHTML = sk(2, 'aspect-ratio:16/9;border-radius:14px');
    if (shortBand) shortBand.hidden = false;
    if (smallGrid) {
      smallGrid.classList.remove('yt-shorts-rail', 'yt-shorts-grid');
      smallGrid.classList.add('rail-wrap');
      smallGrid.innerHTML = '<div class="yt-shorts-rail">' + sk(4, 'aspect-ratio:9/16;border-radius:14px') + '</div>';
    }
  }

  function clipsLabel(n) {
    var n10 = n % 10;
    var n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return n + ' ролик';
    if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return n + ' ролика';
    return n + ' роликов';
  }

  function authorBioHtml(bio) {
    var s = String(bio || '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<span>\s*(?:&nbsp;|\u00a0)?\s*<\/span>/gi, ' ')
      .replace(/https?:\/\/(?:www\.)?katolik\.live[^\s"'<>]*/gi, 'https://vk.ru/katoliklive')
      .trim();
    if (!s) return '';
    if (V && V.sanitizeRichHtml) return V.sanitizeRichHtml(s);
    return '<p>' + esc(s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()) + '</p>';
  }

  function liveAuthorHtml(slug) {
    var list = window.YakAuthors || [];
    var a = null;
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i].slug === slug) { a = list[i]; break; }
    }
    var name = (a && a.name) || 'Игорь Фофанов';
    var photo = (a && (a.photo || a.image || a.avatar)) || '';
    var bio = (window.YakAuthorFixedBios && YakAuthorFixedBios[slug]) || (a && a.bio) || '';
    var letters = name.split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w.charAt(0); }).join('');
    var ava = photo
      ? '<span class="author-ava" style="background-image:url(\'' + esc(photo) + '\')"></span>'
      : '<span class="author-ava initials">' + esc(letters || 'ИФ') + '</span>';
    var bioHtml = authorBioHtml(bio);
    var href = 'author.html?slug=' + encodeURIComponent(slug || 'igor-fofanov');
    return (
      '<div class="live-author">' +
      '<a class="live-author-person" href="' + href + '">' + ava +
      '<span class="live-author-copy"><small>Автор проекта</small><strong>' + esc(name) + '</strong></span></a>' +
      (bioHtml ? '<div class="live-author-bio">' + bioHtml + '</div>' : '') +
      '</div>'
    );
  }

  /* Кнопка «Прислать ролик»: страница с формой, нужен ключ от редакции. */
  function liveSendHtml(parishId) {
    return (
      '<p class="live-send-row"><a class="btn-primary live-send" href="live-submit.html' +
      (parishId ? '?parish=' + encodeURIComponent(parishId) : '') +
      '">Прислать ролик</a>' +
      '<span class="live-send-note">Видео из жизни вашего прихода — после проверки редакцией оно появится здесь</span></p>'
    );
  }

  function renderParishChannel(ch) {
    var params = new URLSearchParams(location.search);
    var parishId = params.get('parish') || '';
    var cityId = params.get('city') || '';
    var parishes = ch.parishes || [];
    var cities = ch.cities || [];
    var mine = all.filter(function (v) { return v.channelId === ch.id; });
    var parish = parishes.filter(function (p) { return p.id === parishId; })[0] || null;
    var city = cities.filter(function (c) { return c.id === cityId; })[0] || null;
    if (parish && parish.cityId) city = cities.filter(function (c) { return c.id === parish.cityId; })[0] || city;
    var grouped = {};
    cities.forEach(function (c) { grouped[c.id] = true; });

    function folderCard(href, cover, title, meta, cityName) {
      return (
        '<a class="live-folder" data-city="' + esc(cityName || title) + '" href="' + href + '">' +
        '<img src="' + esc(cover) + '" alt="" />' +
        '<span class="live-folder-copy"><strong>' + esc(title) + '</strong>' +
        '<em>' + esc(meta) + '</em></span></a>'
      );
    }
    function channelHref(extra) {
      return 'video-channel.html?id=' + encodeURIComponent(ch.id) + (extra || '');
    }

    document.title = (parish ? parish.name + ' — ' : city ? city.name + ' — ' : '') + ch.name + ' — Видео — Рускатолик';
    var crumbs =
      '<nav class="breadcrumbs in-shell"><a href="index.html">Главная</a><span>/</span><a href="video.html">Видео</a><span>/</span>' +
      (parish || city
        ? '<a href="' + channelHref('') + '">' + esc(ch.name) + '</a><span>/</span>'
        : '<span>' + esc(ch.name) + '</span>') +
      (parish && city
        ? '<a href="' + channelHref('&city=' + encodeURIComponent(city.id)) + '">' + esc(city.name) + '</a><span>/</span><span>' + esc(parish.name) + '</span>'
        : parish
          ? '<span>' + esc(parish.name) + '</span>'
          : city
            ? '<span>' + esc(city.name) + '</span>'
            : '') +
      '</nav>';

    if (!parish && !city) {
      var top = cities.map(function (c) {
        var churches = parishes.filter(function (p) { return p.cityId === c.id; });
        var n = 0;
        churches.forEach(function (p) {
          n += mine.filter(function (v) { return v.parish === p.id; }).length;
        });
        return folderCard(
          channelHref('&city=' + encodeURIComponent(c.id)),
          c.cover,
          c.name,
          churches.length + ' ' + (churches.length === 1 ? 'храм' : churches.length < 5 ? 'храма' : 'храмов') + ' · ' + clipsLabel(n),
          c.name
        );
      }).join('');
      top += parishes.filter(function (p) { return !grouped[p.cityId]; }).map(function (p) {
        var n = mine.filter(function (v) { return v.parish === p.id; }).length;
        var meta = p.city ? p.city + ' · ' + clipsLabel(n) : clipsLabel(n);
        return folderCard(channelHref('&parish=' + encodeURIComponent(p.id)), p.cover, p.name, meta, p.city || p.name);
      }).join('');
      channelRoot.innerHTML =
        crumbs +
        '<section class="live-hero in-shell">' +
        '<img class="live-cover" src="' + esc(ch.cover || ch.logo || '') + '" alt="' + esc(ch.name) + '" />' +
        '<div class="live-hero-copy">' +
        '<p class="eyebrow">Проект</p>' +
        '<h1>' + esc(ch.name) + '</h1>' +
        (ch.bio ? '<p class="live-lead">' + esc(ch.bio) + '</p>' : '') +
        liveAuthorHtml(ch.authorSlug) +
        liveSendHtml('') +
        '<label class="live-city-search"><input type="search" id="live-city-q" placeholder="Найти город" autocomplete="off" enterkeyhint="search" /></label>' +
        '</div></section>' +
        '<section class="video-band"><div class="block-head"><h2>Города</h2><span class="rule"></span></div>' +
        '<p class="live-city-empty" id="live-city-empty" hidden>Такого города нет</p>' +
        '<div class="live-folders">' + top + '</div></section>';
      var cityInput = channelRoot.querySelector('#live-city-q');
      if (cityInput) {
        cityInput.addEventListener('input', function () {
          var q = String(cityInput.value || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, '');
          var shown = 0;
          channelRoot.querySelectorAll('.live-folder').forEach(function (card) {
            var name = String(card.getAttribute('data-city') || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, '');
            var ok = !q || name.indexOf(q) !== -1;
            card.hidden = !ok;
            if (ok) shown += 1;
          });
          var empty = channelRoot.querySelector('#live-city-empty');
          if (empty) empty.hidden = shown > 0;
        });
      }
      return;
    }

    if (!parish && city) {
      var churches = parishes.filter(function (p) { return p.cityId === city.id; });
      channelRoot.innerHTML =
        crumbs +
        '<section class="live-parish in-shell">' +
        '<a class="wlink" href="' + channelHref('') + '">Все города</a>' +
        '<h1 class="live-city-title">' + esc(city.name) + '</h1>' +
        '<div class="live-folders">' +
        churches.map(function (p) {
          var n = mine.filter(function (v) { return v.parish === p.id; }).length;
          return folderCard(channelHref('&parish=' + encodeURIComponent(p.id)), p.cover, p.name, clipsLabel(n));
        }).join('') +
        '</div></section>';
      return;
    }

    var clips = mine.filter(function (v) { return v.parish === parish.id; });
    var back = city
      ? '<a class="wlink" href="' + channelHref('&city=' + encodeURIComponent(city.id)) + '">Храмы: ' + esc(city.name) + '</a>'
      : '<a class="wlink" href="' + channelHref('') + '">Все приходы</a>';
    channelRoot.innerHTML =
      crumbs +
      '<section class="live-parish in-shell">' +
      back +
      '<div class="live-parish-head">' +
      '<img src="' + esc(parish.cover) + '" alt="" />' +
      '<div>' + (parish.city ? '<p class="eyebrow">' + esc(parish.city) + '</p>' : '') + '<h1>' + esc(parish.name) + '</h1>' +
      '<p class="live-lead">' + esc(clipsLabel(clips.length)) + '</p>' + liveSendHtml(parish.id) + '</div></div>' +
      '<div class="yt-film-grid live-films ' + (clips.length === 1 ? 'cols-1' : clips.length === 2 ? 'cols-2' : 'cols-3') + '">' +
      clips.map(filmCard).join('') +
      '</div></section>';
    bind(channelRoot);
  }

  function renderChannel() {
    if (!channelRoot) return;
    if (waitingPack()) {
      channelRoot.innerHTML = window.Vera && Vera.skeleton ? Vera.skeleton('cards', 'Загружаем канал') : '';
      return;
    }
    var id = new URLSearchParams(location.search).get('id') || '';
    var ch = channels.filter(function (c) { return c.id === id; })[0];
    if (ch && ch.layout === 'parishes') {
      renderParishChannel(ch);
      return;
    }
    if (!ch) {
      channelRoot.innerHTML =
        '<nav class="breadcrumbs in-shell"><a href="video.html">Видео</a><span>/</span><span>Не найден</span></nav>' +
        '<header class="page-head in-shell"><div><h1>Канал не найден</h1></div></header>' +
        '<p class="in-shell"><a class="wlink" href="video.html">К списку партнёров</a></p>';
      return;
    }
    document.title = ch.name + ' — Видео — Рускатолик';
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
        '<div class="rail-wrap"><button type="button" class="rail-arrow" data-rail-prev="ch-shorts" aria-label="Назад">‹</button>' +
        '<div class="yt-shorts-rail" id="ch-shorts">' +
        shorts.map(shortCard).join('') +
        '</div><button type="button" class="rail-arrow" data-rail-next="ch-shorts" aria-label="Вперёд">›</button></div></section>';
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
      (ch.description || ch.bio ? '<p class="author-bio">' + esc(ch.description || ch.bio) + '</p>' : '') +
      (links ? '<div class="author-socials">' + links + '</div>' : '') +
      '<p><a class="wlink" href="video.html#video-partners-band">К списку партнёров</a></p>' +
      '</div></section>' +
      sections;
    bind(channelRoot);
    bindRailHost(channelRoot);
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

  function refresh() {
    all = ((window.YakVideos && YakVideos.items) || []).slice();
    channels = (window.YakVideos && YakVideos.channels) || channels;
    if (channelRoot) renderChannel();
    else renderHome();
  }

  if (window.YakVideos && YakVideos.onPack) YakVideos.onPack(refresh);
  if (window.YakAuthorsOnPack) YakAuthorsOnPack(function () { if (channelRoot) renderChannel(); });
  refresh();
})();
