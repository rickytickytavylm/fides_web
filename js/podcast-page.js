(function () {
  'use strict';
  var P = window.YakPodcasts;
  var root = document.getElementById('cast-show');
  if (!P || !root) return;

  var V = window.Vera;
  function esc(s) {
    return V ? V.escapeHtml(s) : String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var id = '';
  try { id = new URLSearchParams(location.search).get('id') || ''; } catch (e) {}

  var player = null;
  var index = 0;
  var episodes = [];

  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) return '0:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  function codeOf(ep) {
    var s = Number(ep.season) || 0;
    var n = Number(ep.episode) || 0;
    if (!s && !n) return '';
    return 'S' + String(s).padStart(2, '0') + 'E' + String(n).padStart(2, '0');
  }

  function ruDate(iso) {
    if (!iso) return '';
    if (V && V.formatDate) return V.formatDate(iso);
    return iso;
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
      '<button type="button" id="ytm-prev" aria-label="Предыдущий">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 9.5 12 18 18V6ZM6 6h2.2v12H6V6Z" fill="currentColor"/></svg></button>' +
      '<button type="button" class="ytm-play" id="ytm-play" aria-label="Играть">' +
      '<svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5L8 5.5Z" fill="currentColor"/></svg>' +
      '<svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.4v14H7V5Zm6.6 0H17v14h-3.4V5Z" fill="currentColor"/></svg>' +
      '</button>' +
      '<button type="button" id="ytm-next" aria-label="Следующий">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6v12l8.5-6L6 6Zm9.8 0H18v12h-2.2V6Z" fill="currentColor"/></svg></button>' +
      '</div></div>';
    var audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.setAttribute('playsinline', '');
    audio.playsInline = true;
    audio.style.display = 'none';
    document.body.appendChild(overlay);
    document.body.appendChild(audio);
    player = { overlay: overlay, audio: audio };

    overlay.querySelector('#ytm-close').addEventListener('click', closePlayer);
    overlay.querySelector('#ytm-play').addEventListener('click', function () {
      if (audio.paused) audio.play().catch(function () {});
      else audio.pause();
    });
    overlay.querySelector('#ytm-prev').addEventListener('click', function () {
      openEpisode((index - 1 + episodes.length) % episodes.length);
    });
    overlay.querySelector('#ytm-next').addEventListener('click', function () {
      openEpisode((index + 1) % episodes.length);
    });
    audio.addEventListener('play', function () { overlay.classList.add('is-playing'); });
    audio.addEventListener('pause', function () { overlay.classList.remove('is-playing'); });
    audio.addEventListener('ended', function () {
      if (index < episodes.length - 1) openEpisode(index + 1);
    });
    audio.addEventListener('timeupdate', syncSeek);
    audio.addEventListener('loadedmetadata', syncSeek);

    var bar = overlay.querySelector('#ytm-seek');
    var dragging = false;
    function apply(e) {
      if (!audio.duration) return;
      var rect = bar.getBoundingClientRect();
      var x = Math.min(1, Math.max(0, ((e.clientX || 0) - rect.left) / Math.max(rect.width, 1)));
      audio.currentTime = x * audio.duration;
      syncSeek();
    }
    bar.addEventListener('pointerdown', function (e) {
      dragging = true;
      bar.setPointerCapture(e.pointerId);
      apply(e);
    });
    bar.addEventListener('pointermove', function (e) { if (dragging) apply(e); });
    bar.addEventListener('pointerup', function () { dragging = false; });
    return player;
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
    var ep = episodes[index] || {};
    player.overlay.querySelector('#ytm-dur').textContent = ep.duration || fmt(dur);
  }

  function closePlayer() {
    if (!player) return;
    player.audio.pause();
    player.overlay.hidden = true;
    document.body.classList.remove('audio-player-open');
  }

  function openEpisode(i) {
    if (!episodes.length) return;
    index = ((i % episodes.length) + episodes.length) % episodes.length;
    var ep = episodes[index];
    var show = P.byId(id);
    var p = ensurePlayer();
    p.overlay.style.setProperty('--audio-artwork', 'url("' + (show && show.cover || '') + '")');
    p.overlay.querySelector('#ytm-title').textContent = ep.title || '';
    p.overlay.querySelector('#ytm-artist').textContent =
      [codeOf(ep), show && show.host].filter(Boolean).join(' · ');
    p.overlay.hidden = false;
    document.body.classList.add('audio-player-open');
    markActive();
    p.audio.pause();
    p.audio.src = ep.audioUrl || ep.url || '';
    p.audio.load();
    p.audio.play().catch(function () {});
  }

  function markActive() {
    root.querySelectorAll('.cast-ep-btn').forEach(function (btn) {
      btn.classList.toggle('is-active', Number(btn.getAttribute('data-i')) === index);
    });
  }

  function render() {
    var show = P.byId(id);
    if (!show) {
      root.innerHTML =
        '<p class="archive-empty">Подкаст не найден. <a href="audio.html">Ко всем подкастам</a></p>';
      return;
    }

    document.title = show.title + ' — ЯКатолик';
    var crumb = document.getElementById('cast-crumb');
    if (crumb) crumb.textContent = show.title;

    episodes = P.sortEpisodes(show.episodes || []);
    var hostHtml = show.authorSlug
      ? '<a class="text-link" href="author.html?slug=' + encodeURIComponent(show.authorSlug) + '">' + esc(show.host) + '</a>'
      : esc(show.host);
    var count = P.countOf(show);
    var rows = episodes.length
      ? episodes.map(function (ep, i) {
        var meta = [codeOf(ep), ruDate(ep.date), ep.duration].filter(Boolean).join(' · ');
        return (
          '<button type="button" class="cast-ep-btn" data-i="' + i + '">' +
          '<span class="cast-ep-code">' + esc(codeOf(ep) || (i + 1)) + '</span>' +
          '<span class="cast-ep-meta"><strong>' + esc(ep.title || 'Выпуск') + '</strong>' +
          '<em>' + esc(meta) + '</em></span>' +
          '<span class="ytm-row-go" aria-hidden="true">›</span></button>'
        );
      }).join('')
      : '<p class="archive-empty">Выпуски ещё загружаются на сайт.</p>';

    root.innerHTML =
      '<div class="cast-show-hero">' +
      '<div class="cast-show-art" style="background-image:url(\'' + esc(show.cover) + '\')" role="img" aria-label="Обложка"></div>' +
      '<div class="cast-show-meta">' +
      '<p class="eyebrow">Подкаст</p>' +
      '<h1>' + esc(show.title) + '</h1>' +
      '<p class="cast-show-host">' + hostHtml + ' · ' + esc(P.epLabel(count)) + '</p>' +
      '<p class="cast-show-blurb">' + esc(show.blurb) + '</p>' +
      (episodes.length ? '<button type="button" class="cast-open" id="cast-play">Слушать с первого</button>' : '') +
      '</div></div>' +
      '<div class="cast-ep-list" id="cast-eps">' + rows + '</div>' +
      '<p class="cast-back"><a class="text-link" href="audio.html">← Все подкасты</a></p>';

    var list = document.getElementById('cast-eps');
    if (list) {
      list.addEventListener('click', function (e) {
        var btn = e.target.closest('.cast-ep-btn');
        if (!btn) return;
        openEpisode(Number(btn.getAttribute('data-i')));
      });
    }
    var play = document.getElementById('cast-play');
    if (play) {
      play.addEventListener('click', function () {
        openEpisode(episodes.length ? episodes.length - 1 : 0);
      });
    }
  }

  render();
  if (P.onPack) P.onPack(render);
})();
