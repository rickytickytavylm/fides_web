(function () {
  'use strict';
  var C = window.YakCompendium;
  var body = document.getElementById('comp-body');
  var input = document.getElementById('comp-q');
  if (!C || !body) return;

  var byNum = {};
  var order = [];
  C.items.forEach(function (it) {
    byNum[it.n] = it;
    order.push(it.n);
  });

  var COVERS = {
    faith: 'assets/cards/articles-spirituality.webp',
    sacraments: 'assets/cards/articles-liturgy.webp',
    life: 'assets/cards/articles-lifestyle.webp',
    prayer: 'assets/cards/church-deepen-pray.webp'
  };
  var state = { part: null, q: '' };
  var player = null;
  var current = 0;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function ruCount(n) {
    var n10 = n % 10;
    var n100 = n % 100;
    var word = 'вопросов';
    if (n10 === 1 && n100 !== 11) word = 'вопрос';
    else if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) word = 'вопроса';
    return n + ' ' + word;
  }

  function partById(id) {
    var i;
    for (i = 0; i < C.parts.length; i++) if (C.parts[i].id === id) return C.parts[i];
    return null;
  }

  function shelfItems(shelf) {
    var out = [];
    var n;
    for (n = shelf.from; n <= shelf.to; n++) if (byNum[n]) out.push(byNum[n]);
    return out;
  }

  function partCount(part) {
    var n = 0;
    part.shelves.forEach(function (shelf) { n += shelfItems(shelf).length; });
    return n;
  }

  function spanLabel(items) {
    if (!items.length) return '';
    var a = items[0].n;
    var b = items[items.length - 1].n;
    return a === b ? String(a) : a + '–' + b;
  }

  function row(it) {
    return (
      '<button type="button" class="comp-q" data-n="' + it.n + '">' +
      '<b>' + it.n + '</b><span>' + esc(it.t) + '</span></button>'
    );
  }

  function matches(it, words) {
    var hay = (it.n + ' ' + it.t).toLowerCase();
    var i;
    for (i = 0; i < words.length; i++) if (hay.indexOf(words[i]) === -1) return false;
    return true;
  }

  function render() {
    var words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length) {
      var found = C.items.filter(function (it) { return matches(it, words); });
      body.innerHTML =
        '<p class="comp-note">' + (found.length ? 'Нашли ' + ruCount(found.length) : 'Ничего не нашлось') + '</p>' +
        '<div class="comp-list">' + found.map(row).join('') + '</div>';
      mark();
      return;
    }
    var part = partById(state.part);
    if (!part) {
      body.innerHTML =
        '<div class="comp-gates">' +
        C.parts.map(function (p) {
          var from = p.shelves[0].from;
          var to = p.shelves[p.shelves.length - 1].to;
          return (
            '<button type="button" class="comp-gate" data-part="' + esc(p.id) + '" style="background-image:url(\'' +
            esc(COVERS[p.id]) + '\')">' +
            '<span><small>' + from + '–' + to + '</small><strong>' + esc(p.title) + '</strong><em>' +
            esc(ruCount(partCount(p))) + '</em></span></button>'
          );
        }).join('') +
        '</div>';
      return;
    }
    body.innerHTML =
      '<button type="button" class="comp-back" id="comp-back">← Все части</button>' +
      '<h2 class="comp-part-title">' + esc(part.title) + '</h2>' +
      part.shelves.map(function (shelf) {
        var items = shelfItems(shelf);
        if (!items.length) return '';
        return (
          '<section class="comp-shelf">' +
          '<header><h3>' + esc(shelf.title) + '</h3><span>' + esc(spanLabel(items)) + '</span></header>' +
          '<div class="comp-list">' + items.map(row).join('') + '</div></section>'
        );
      }).join('');
    mark();
  }

  function mark() {
    body.querySelectorAll('.comp-q').forEach(function (btn) {
      btn.classList.toggle('is-on', Number(btn.getAttribute('data-n')) === current && !!(player && !player.overlay.hidden));
    });
  }

  function showPart(id, push) {
    state.part = id;
    state.q = '';
    if (input) input.value = '';
    if (push) history.pushState({ part: id }, '', '#' + id);
    render();
    window.scrollTo(0, 0);
  }

  function showGates(push) {
    state.part = null;
    state.q = '';
    if (input) input.value = '';
    if (push) history.pushState({ part: null }, '', location.pathname);
    render();
    window.scrollTo(0, 0);
  }

  body.addEventListener('click', function (e) {
    var gate = e.target.closest('[data-part]');
    if (gate) {
      showPart(gate.getAttribute('data-part'), true);
      return;
    }
    if (e.target.closest('#comp-back')) {
      showGates(true);
      return;
    }
    var q = e.target.closest('.comp-q');
    if (q) play(Number(q.getAttribute('data-n')));
  });

  if (input) {
    input.addEventListener('input', function () {
      state.q = input.value.trim();
      render();
    });
  }

  window.addEventListener('popstate', function () {
    var id = (location.hash || '').replace('#', '');
    state.part = partById(id) ? id : null;
    state.q = '';
    if (input) input.value = '';
    render();
  });

  function indexOf(n) {
    return order.indexOf(n);
  }

  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) return '0:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
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

  function ensurePlayer() {
    if (player) return player;
    var overlay = document.createElement('div');
    overlay.className = 'ytm-now ytm-now--face';
    overlay.hidden = true;
    overlay.innerHTML =
      '<button type="button" class="ytm-close" aria-label="Закрыть">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5 12 15l6-5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '<div class="ytm-now-shade"></div><div class="ytm-now-col">' +
      '<h2 id="comp-title"></h2><p id="comp-artist"></p>' +
      '<div class="ytm-seek" id="comp-seek"><i id="comp-fill"></i><b id="comp-knob"></b></div>' +
      '<div class="ytm-times"><span id="comp-cur">0:00</span><span id="comp-dur">0:00</span></div>' +
      '<div class="ytm-ctrls">' +
      '<button type="button" id="comp-prev" aria-label="Предыдущий">' + iconPrev() + '</button>' +
      '<button type="button" id="comp-back" aria-label="На 15 секунд назад"><span>−15</span></button>' +
      '<button type="button" class="ytm-play" id="comp-play" aria-label="Играть">' + iconPlay() + iconPause() + '</button>' +
      '<button type="button" id="comp-fwd" aria-label="На 15 секунд вперёд"><span>+15</span></button>' +
      '<button type="button" id="comp-next" aria-label="Следующий">' + iconNext() + '</button>' +
      '</div></div>';
    var audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.setAttribute('playsinline', '');
    audio.playsInline = true;
    audio.style.display = 'none';
    document.body.appendChild(overlay);
    document.body.appendChild(audio);
    player = { overlay: overlay, audio: audio };
    overlay.querySelector('.ytm-close').addEventListener('click', closePlayer);
    overlay.querySelector('#comp-play').addEventListener('click', function () {
      if (audio.paused) audio.play().catch(function () {});
      else audio.pause();
    });
    overlay.querySelector('#comp-prev').addEventListener('click', function () { step(-1); });
    overlay.querySelector('#comp-next').addEventListener('click', function () { step(1); });
    overlay.querySelector('#comp-back').addEventListener('click', function () {
      audio.currentTime = Math.max(0, (audio.currentTime || 0) - 15);
    });
    overlay.querySelector('#comp-fwd').addEventListener('click', function () {
      var dur = audio.duration || 0;
      audio.currentTime = Math.min(dur || 1e9, (audio.currentTime || 0) + 15);
    });
    audio.addEventListener('play', function () { overlay.classList.add('is-playing'); });
    audio.addEventListener('pause', function () { overlay.classList.remove('is-playing'); });
    audio.addEventListener('ended', function () { step(1); });
    audio.addEventListener('timeupdate', sync);
    audio.addEventListener('loadedmetadata', sync);
    var bar = overlay.querySelector('#comp-seek');
    var dragging = false;
    function ratio(e) {
      var rect = bar.getBoundingClientRect();
      return Math.min(1, Math.max(0, ((e.clientX || 0) - rect.left) / Math.max(rect.width, 1)));
    }
    bar.addEventListener('pointerdown', function (e) {
      dragging = true;
      if (bar.setPointerCapture) bar.setPointerCapture(e.pointerId);
      if (audio.duration) audio.currentTime = ratio(e) * audio.duration;
    });
    bar.addEventListener('pointermove', function (e) {
      if (dragging && audio.duration) audio.currentTime = ratio(e) * audio.duration;
    });
    bar.addEventListener('pointerup', function () { dragging = false; });
    bar.addEventListener('pointercancel', function () { dragging = false; });
    return player;
  }

  function sync() {
    if (!player) return;
    var audio = player.audio;
    var dur = audio.duration || 0;
    var cur = audio.currentTime || 0;
    var pct = dur ? (cur / dur) * 100 : 0;
    player.overlay.querySelector('#comp-fill').style.width = pct + '%';
    player.overlay.querySelector('#comp-knob').style.left = pct + '%';
    player.overlay.querySelector('#comp-cur').textContent = fmt(cur);
    player.overlay.querySelector('#comp-dur').textContent = fmt(dur);
  }

  function step(dir) {
    var i = indexOf(current);
    var next = i + dir;
    if (next < 0 || next >= order.length) return;
    play(order[next]);
  }

  function play(n) {
    var it = byNum[n];
    if (!it) return;
    current = n;
    var p = ensurePlayer();
    p.overlay.querySelector('#comp-title').textContent = it.n + '. ' + it.t;
    p.overlay.querySelector('#comp-artist').textContent = C.artist;
    p.overlay.hidden = false;
    document.body.classList.add('comp-open');
    p.audio.pause();
    p.audio.src = C.base + encodeURIComponent(it.f);
    p.audio.load();
    p.audio.play().catch(function () {});
    mark();
  }

  function closePlayer() {
    if (!player) return;
    player.audio.pause();
    player.overlay.hidden = true;
    document.body.classList.remove('comp-open');
    mark();
  }

  var start = (location.hash || '').replace('#', '');
  if (partById(start)) state.part = start;
  render();
})();
