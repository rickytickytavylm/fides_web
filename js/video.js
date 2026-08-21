(function () {
  'use strict';

  var catalog = (window.YakVideos && window.YakVideos.items) || [];
  var V = window.Vera;
  var all = catalog.slice();
  var filter = 'all';
  var largeGrid = document.getElementById('video-large');
  var smallGrid = document.getElementById('video-small');
  var longBand = document.getElementById('video-long-band');
  var shortBand = document.getElementById('video-short-band');
  var statusEl = document.getElementById('video-status');
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

  function fidesUrl(url) {
    if (!url) return url;
    var m = String(url).match(/video(\d+)\.mp4/i);
    if (m && window.YakVideos && window.YakVideos.bucket) {
      return window.YakVideos.bucket + 'video' + m[1] + '.mp4';
    }
    return url;
  }

  function cardHtml(v) {
    var size = v.size || (v.type === 'long' ? 'large' : 'small');
    var typeLabel = v.type === 'long' ? 'Фильм' : 'Короткое';
    var playable = Boolean(v.videoUrl);
    var cls = 'video-card video-card--' + size;
    if (v.featured) cls += ' video-card--hero';
    var media = v.thumb
      ? '<img class="video-thumb-img" src="' + esc(v.thumb) + '" alt="" loading="lazy" />'
      : '<span class="video-poster" aria-hidden="true"><b>' +
        esc((v.title || '').split(' ').slice(0, 4).join(' ')) +
        '</b></span>';
    return (
      '<article class="' +
      cls +
      '">' +
      '<button type="button" class="video-open" data-id="' +
      esc(String(v.id)) +
      '" ' +
      (playable ? '' : 'disabled') +
      ' aria-label="Смотреть: ' +
      esc(v.title || '') +
      '">' +
      '<span class="video-thumb">' +
      media +
      '<i class="play" aria-hidden="true">▶</i>' +
      '<b class="duration">' +
      esc(typeLabel) +
      '</b></span></button>' +
      '<p class="story-meta"><span>' +
      esc(v.speaker || typeLabel) +
      '</span></p>' +
      '<h3>' +
      esc(v.title || 'Без названия') +
      '</h3>' +
      (v.description
        ? '<p class="video-card-desc">' + esc(String(v.description).slice(0, 140)) + '</p>'
        : '') +
      '</article>'
    );
  }

  function bindGrid(grid) {
    if (!grid) return;
    grid.querySelectorAll('.video-open').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = all.filter(function (x) {
          return String(x.id) === btn.getAttribute('data-id');
        })[0];
        if (!item || !item.videoUrl || !dialog || !player) return;
        if (dialogTitle) dialogTitle.textContent = item.title || '';
        player.poster = item.thumb || '';
        player.src = item.videoUrl;
        dialog.showModal();
        if (player.play) player.play().catch(function () {});
      });
    });
  }

  function visible() {
    return all.filter(function (v) {
      return filter === 'all' ? true : v.type === filter;
    });
  }

  function render() {
    var items = visible();
    var longs = items.filter(function (v) {
      return v.type === 'long';
    });
    var shorts = items.filter(function (v) {
      return v.type !== 'long';
    });

    if (statusEl) {
      statusEl.textContent = items.length
        ? items.length + ' видео'
        : 'В этой категории пока нет роликов';
    }

    if (longBand) longBand.hidden = !longs.length;
    if (shortBand) shortBand.hidden = !shorts.length;

    if (largeGrid) {
      largeGrid.innerHTML = longs.map(cardHtml).join('');
      bindGrid(largeGrid);
    }
    if (smallGrid) {
      smallGrid.innerHTML = shorts.map(cardHtml).join('');
      bindGrid(smallGrid);
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
    });
  }

  render();

  if (V && V.getVideos) {
    var timed = new Promise(function (_, reject) {
      setTimeout(function () {
        reject(new Error('timeout'));
      }, 4000);
    });
    Promise.race([V.getVideos(), timed])
      .then(function (data) {
        if (!Array.isArray(data)) return;
        var have = {};
        all.forEach(function (v) {
          have[String(v.id)] = true;
        });
        data.forEach(function (raw) {
          var id = String(raw.id);
          if (have[id]) return;
          var type = raw.type === 'long' ? 'long' : 'short';
          all.push({
            id: raw.id,
            title: raw.title,
            description: raw.description,
            speaker: type === 'long' ? 'Фильм' : 'Короткое',
            type: type,
            size: type === 'long' ? 'large' : 'small',
            videoUrl: fidesUrl(raw.videoUrl),
            thumb: raw.thumbnail || null,
          });
          have[id] = true;
        });
        render();
      })
      .catch(function () {});
  }
})();
