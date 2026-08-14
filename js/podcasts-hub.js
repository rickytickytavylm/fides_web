(function () {
  'use strict';
  var P = window.YakPodcasts;
  if (!P || !P.shows || !P.shows.length) return;

  var V = window.Vera;
  function esc(s) {
    return V ? V.escapeHtml(s) : String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function href(id) {
    return 'podcast.html?id=' + encodeURIComponent(id);
  }

  var rail = document.getElementById('cast-rail');
  if (rail) {
    rail.innerHTML = P.shows.map(function (show) {
      return (
        '<a class="cast-tile" href="' + href(show.id) + '">' +
        '<span class="cast-tile-art" style="background-image:url(\'' + esc(show.cover) + '\')"></span>' +
        '<strong>' + esc(show.title) + '</strong>' +
        '<em>' + esc(P.epLabel(show.episodes)) + '</em></a>'
      );
    }).join('');
  }

  var latest = document.getElementById('cast-latest');
  if (latest) {
    latest.innerHTML = P.latestShows(4).map(function (show) {
      var ep = show.latest || {};
      return (
        '<a class="cast-ep" href="' + href(show.id) + '">' +
        '<span class="cast-ep-art" style="background-image:url(\'' + esc(show.cover) + '\')"></span>' +
        '<span class="cast-ep-body">' +
        '<small>' + esc(show.title) + '</small>' +
        '<strong>' + esc(ep.title || show.title) + '</strong>' +
        '<em>' + esc(ep.date || '') + '</em></span></a>'
      );
    }).join('');
  }

  var list = document.getElementById('cast-list');
  if (list) {
    list.innerHTML = P.shows.map(function (show) {
      return (
        '<article class="cast-row">' +
        '<a class="cast-row-main" href="' + href(show.id) + '">' +
        '<span class="cast-row-art" style="background-image:url(\'' + esc(show.cover) + '\')"></span>' +
        '<span class="cast-row-meta"><strong>' + esc(show.title) + '</strong>' +
        '<em>' + esc(show.blurb) + '</em>' +
        '<small>' + esc(P.epLabel(show.episodes)) + '</small></span></a>' +
        '<a class="cast-listen" href="' + href(show.id) + '">Слушать</a></article>'
      );
    }).join('');
  }
})();
