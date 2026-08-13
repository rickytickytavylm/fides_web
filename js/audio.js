(function () {
  'use strict';
  var V = window.Vera;
  var CAT = window.YakAudio;
  if (!CAT || !CAT.tracks || !CAT.tracks.length) return;

  var tracks = CAT.tracks;
  var listEl = document.getElementById('audio-list');
  var countEl = document.getElementById('audio-count');
  var stackEl = document.getElementById('audio-stack');
  var player = null;
  var index = 0;
  var urlCache = Object.create(null);

  function esc(s) {
    return V ? V.escapeHtml(s) : String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function publicUrl(key) {
    return CAT.publicBase + String(key || '').split('/').map(encodeURIComponent).join('/');
  }

  function apiBase() {
    return (window.VeraConfig && VeraConfig.ARCHIVE_API_BASE) || '';
  }

  function resolveUrl(track) {
    var key = track.audio_key;
    if (urlCache[key] && urlCache[key].expires > Date.now() + 15000) {
      return Promise.resolve(urlCache[key].url);
    }
    var base = apiBase();
    if (!base) return Promise.resolve(publicUrl(key));
    var url = base.replace(/\/$/, '') + '/api/content/sermons-audio-url?key=' + encodeURIComponent(key);
    return fetch(url, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (data && data.url) {
          urlCache[key] = {
            url: data.url,
            expires: Date.now() + ((Number(data.expires_in) || 3600) * 1000)
          };
          return data.url;
        }
        return publicUrl(key);
      })
      .catch(function () { return publicUrl(key); });
  }

  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) return '0:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  if (countEl) countEl.textContent = tracks.length + ' треков';

  if (stackEl) {
    var seen = {};
    var previews = [];
    tracks.forEach(function (t) {
      if (seen[t.cover] || previews.length >= 4) return;
      seen[t.cover] = 1;
      previews.push(t.cover);
    });
    stackEl.innerHTML = previews.map(function (src) {
      return '<span style="background-image:url(\'' + esc(src) + '\')"></span>';
    }).join('');
  }

  if (listEl) {
    listEl.innerHTML = tracks.map(function (t, i) {
      return (
        '<button type="button" class="ytm-row" data-i="' + i + '">' +
        '<span class="ytm-row-art" style="background-image:url(\'' + esc(t.cover) + '\')"></span>' +
        '<span class="ytm-row-meta"><strong>' + esc(t.title) + '</strong>' +
        '<em>' + esc(t.artist) + ' · ' + esc(t.duration) + '</em></span>' +
        '<span class="ytm-row-go" aria-hidden="true">›</span></button>'
      );
    }).join('');
    listEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.ytm-row');
      if (!btn) return;
      openTrack(Number(btn.getAttribute('data-i')));
    });
  }

  function markActive() {
    if (!listEl) return;
    listEl.querySelectorAll('.ytm-row').forEach(function (row) {
      row.classList.toggle('is-active', Number(row.getAttribute('data-i')) === index);
    });
  }

  function ensurePlayer() {
    if (player) return player;
    var overlay = document.createElement('div');
    overlay.className = 'ytm-now';
    overlay.hidden = true;
    overlay.innerHTML =
      '<button type="button" class="ytm-close" id="ytm-close" aria-label="Закрыть">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5 12 15l6-5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</button>' +
      '<div class="ytm-now-shade"></div>' +
      '<div class="ytm-now-col">' +
      '<h2 id="ytm-title"></h2>' +
      '<p id="ytm-artist"></p>' +
      '<div class="ytm-seek" id="ytm-seek">' +
      '<i id="ytm-fill"></i><b id="ytm-knob"></b></div>' +
      '<div class="ytm-times"><span id="ytm-cur">0:00</span><span id="ytm-dur">0:00</span></div>' +
      '<div class="ytm-ctrls">' +
      '<button type="button" id="ytm-prev" aria-label="Предыдущий">' + iconPrev() + '</button>' +
      '<button type="button" id="ytm-back" aria-label="На 15 секунд назад">' + iconSkip('-') + '</button>' +
      '<button type="button" class="ytm-play" id="ytm-play" aria-label="Играть">' + iconPlay() + iconPause() + '</button>' +
      '<button type="button" id="ytm-fwd" aria-label="На 15 секунд вперёд">' + iconSkip('+') + '</button>' +
      '<button type="button" id="ytm-next" aria-label="Следующий">' + iconNext() + '</button>' +
      '</div></div>';

    var audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.setAttribute('playsinline', '');
    audio.playsInline = true;
    audio.style.display = 'none';

    document.body.appendChild(overlay);
    document.body.appendChild(audio);

    player = { overlay: overlay, audio: audio };
    bindPlayer(player);
    return player;
  }

  function iconPlay() {
    return '<svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5L8 5.5Z" fill="currentColor"/></svg>';
  }
  function iconPause() {
    return '<svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.4v14H7V5Zm6.6 0H17v14h-3.4V5Z" fill="currentColor"/></svg>';
  }
  function iconPrev() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 9.5 12 18 18V6ZM6 6h2.2v12H6V6Z" fill="currentColor"/></svg>';
  }
  function iconNext() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6v12l8.5-6L6 6Zm9.8 0H18v12h-2.2V6Z" fill="currentColor"/></svg>';
  }
  function iconSkip(sign) {
    return '<span>' + sign + '15</span>';
  }

  function bindPlayer(p) {
    var audio = p.audio;
    var overlay = p.overlay;
    overlay.querySelector('#ytm-close').addEventListener('click', closePlayer);
    overlay.querySelector('#ytm-play').addEventListener('click', function () {
      if (audio.paused) audio.play().catch(function () {});
      else audio.pause();
    });
    overlay.querySelector('#ytm-prev').addEventListener('click', function () {
      openTrack((index - 1 + tracks.length) % tracks.length);
    });
    overlay.querySelector('#ytm-next').addEventListener('click', function () {
      openTrack((index + 1) % tracks.length);
    });
    overlay.querySelector('#ytm-back').addEventListener('click', function () {
      audio.currentTime = Math.max(0, (audio.currentTime || 0) - 15);
    });
    overlay.querySelector('#ytm-fwd').addEventListener('click', function () {
      audio.currentTime = Math.min(audio.duration || 0, (audio.currentTime || 0) + 15);
    });

    audio.addEventListener('play', function () { overlay.classList.add('is-playing'); });
    audio.addEventListener('pause', function () { overlay.classList.remove('is-playing'); });
    audio.addEventListener('ended', function () {
      openTrack((index + 1) % tracks.length);
    });
    audio.addEventListener('timeupdate', syncSeek);
    audio.addEventListener('loadedmetadata', syncSeek);
    audio.addEventListener('durationchange', syncSeek);

    bindSeek(overlay.querySelector('#ytm-seek'), audio);
  }

  function syncSeek() {
    if (!player) return;
    var audio = player.audio;
    var dur = audio.duration || 0;
    var cur = audio.currentTime || 0;
    var pct = dur ? (cur / dur) * 100 : 0;
    player.overlay.querySelector('#ytm-fill').style.width = pct + '%';
    player.overlay.querySelector('#ytm-knob').style.left = pct + '%';
    player.overlay.querySelector('#ytm-cur').textContent = fmt(cur);
    player.overlay.querySelector('#ytm-dur').textContent = tracks[index].duration || fmt(dur);
  }

  function bindSeek(bar, audio) {
    var dragging = false;
    function ratio(e) {
      var rect = bar.getBoundingClientRect();
      var x = (e.clientX || 0) - rect.left;
      return Math.min(1, Math.max(0, x / Math.max(rect.width, 1)));
    }
    function apply(e) {
      if (!audio.duration) return;
      audio.currentTime = ratio(e) * audio.duration;
      syncSeek();
    }
    bar.addEventListener('pointerdown', function (e) {
      dragging = true;
      bar.setPointerCapture(e.pointerId);
      apply(e);
    });
    bar.addEventListener('pointermove', function (e) {
      if (dragging) apply(e);
    });
    bar.addEventListener('pointerup', function () { dragging = false; });
    bar.addEventListener('pointercancel', function () { dragging = false; });
  }

  function paintNow(track) {
    var p = ensurePlayer();
    p.overlay.style.setProperty('--audio-artwork', 'url("' + track.cover + '")');
    p.overlay.querySelector('#ytm-title').textContent = track.title;
    p.overlay.querySelector('#ytm-artist').textContent = track.artist;
  }

  function openTrack(i) {
    index = ((i % tracks.length) + tracks.length) % tracks.length;
    var track = tracks[index];
    var p = ensurePlayer();
    paintNow(track);
    p.overlay.hidden = false;
    document.body.classList.add('audio-player-open');
    markActive();

    p.audio.pause();
    p.audio.removeAttribute('src');
    p.audio.load();

    resolveUrl(track).then(function (url) {
      if (tracks[index] !== track) return;
      p.audio.src = url;
      p.audio.load();
      p.audio.play().catch(function () {});
    });
  }

  function closePlayer() {
    if (!player) return;
    player.audio.pause();
    player.overlay.hidden = true;
    document.body.classList.remove('audio-player-open');
  }

  var playParam = '';
  try { playParam = new URLSearchParams(location.search).get('play') || ''; } catch (e) {}
  if (playParam) {
    var found = tracks.findIndex(function (t) {
      return t.title.toLowerCase().indexOf(playParam.toLowerCase()) !== -1;
    });
    if (found >= 0) openTrack(found);
  }
})();
