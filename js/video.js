(function () {
  'use strict';
  var V = window.Vera;
  if (!V) return;

  var SHORT_THUMBS = {
    1: 'thumbs/shot1.jpg',
    2: 'thumbs/shot2.jpg',
    3: 'thumbs/shot3.jpg',
    4: 'thumbs/shot4.jpg',
    5: 'thumbs/shot5.jpg',
    6: 'thumbs/shot6.jpg',
    7: 'thumbs/shot7.jpg',
    8: 'thumbs/shot8.jpg',
    9: 'thumbs/shot9.jpg',
  };

  var LONG_THUMBS = {
    10: 'https://storage.yandexcloud.net/fidesetratio/ocean-mercy/01-svyatost.jpg',
    11: 'https://storage.yandexcloud.net/fidesetratio/ocean-mercy/02-bog-molchit.jpg',
    12: 'https://storage.yandexcloud.net/fidesetratio/ocean-mercy/03-tsarskoe-ditya.jpg',
    13: 'https://storage.yandexcloud.net/fidesetratio/ocean-mercy/04-v-diapazone.jpg',
    14: 'https://storage.yandexcloud.net/fidesetratio/ocean-mercy/05-vsem-serdcem.jpg',
  };

  var LONG_URLS = {
    10: 'https://storage.yandexcloud.net/fidesetratio/ocean-mercy/01-svyatost.mp4',
    11: 'https://storage.yandexcloud.net/fidesetratio/ocean-mercy/02-bog-molchit.mp4',
    12: 'https://storage.yandexcloud.net/fidesetratio/ocean-mercy/03-tsarskoe-ditya.mp4',
    13: 'https://storage.yandexcloud.net/fidesetratio/ocean-mercy/04-v-diapazone.mp4',
    14: 'https://storage.yandexcloud.net/fidesetratio/ocean-mercy/05-vsem-serdcem.mp4',
  };

  var all = [];
  var filter = 'all';
  var grid = document.getElementById('video-grid');
  var statusEl = document.getElementById('video-status');
  var dialog = document.getElementById('video-dialog');
  var player = document.getElementById('video-player');
  var dialogTitle = document.getElementById('video-dialog-title');

  function normalize(v) {
    var id = Number(v.id);
    return {
      id: v.id,
      title: v.title,
      description: v.description,
      type: v.type,
      videoUrl: v.videoUrl || LONG_URLS[id] || null,
      thumb: v.thumbnail || SHORT_THUMBS[id] || LONG_THUMBS[id] || null,
    };
  }

  function render() {
    var items = all.filter(function (v) {
      return filter === 'all' ? true : v.type === filter;
    });
    if (statusEl) {
      statusEl.textContent = items.length
        ? items.length + ' видео'
        : 'В этой категории пока нет роликов';
    }
    if (!grid) return;
    grid.innerHTML = items
      .map(function (v) {
        var typeLabel = v.type === 'long' ? 'Длинное' : 'Short';
        var playable = Boolean(v.videoUrl);
        var media = '';
        if (v.thumb) {
          media =
            '<img class="video-thumb-img" src="' +
            V.escapeHtml(v.thumb) +
            '" alt="" loading="lazy" />';
        } else if (v.videoUrl) {
          media =
            '<video class="video-thumb-img" src="' +
            V.escapeHtml(v.videoUrl) +
            '#t=0.3" muted playsinline preload="metadata"></video>';
        }
        return (
          '<article class="video-card">' +
          '<button type="button" class="video-open" data-id="' +
          v.id +
          '" ' +
          (playable ? '' : 'disabled') +
          ' aria-label="Смотреть">' +
          '<span class="video-thumb">' +
          media +
          '<i class="play" aria-hidden="true">▶</i>' +
          '<b class="duration">' +
          V.escapeHtml(typeLabel) +
          '</b></span></button>' +
          '<p class="story-meta"><span>' +
          V.escapeHtml(typeLabel) +
          '</span></p>' +
          '<h3>' +
          V.escapeHtml(v.title || 'Без названия') +
          '</h3>' +
          (v.description
            ? '<p class="video-card-desc">' +
              V.escapeHtml(String(v.description).slice(0, 120)) +
              '</p>'
            : '') +
          '</article>'
        );
      })
      .join('');

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

  V.getVideos()
    .then(function (data) {
      all = (Array.isArray(data) ? data : [])
        .map(normalize)
        .filter(function (v) {
          return v.videoUrl || v.thumb;
        });
      render();
    })
    .catch(function (e) {
      console.error(e);
      if (statusEl) statusEl.textContent = 'Не удалось загрузить видео';
    });
})();
