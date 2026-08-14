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
  var show = P.byId(id);

  if (!show) {
    root.innerHTML =
      '<p class="archive-empty">Подкаст не найден. <a href="audio.html">Ко всем подкастам</a></p>';
    return;
  }

  document.title = show.title + ' — ЯКатолик';
  var crumb = document.getElementById('cast-crumb');
  if (crumb) crumb.textContent = show.title;

  root.innerHTML =
    '<div class="cast-show-hero">' +
    '<div class="cast-show-art" style="background-image:url(\'' + esc(show.cover) + '\')" role="img" aria-label="Обложка"></div>' +
    '<div class="cast-show-meta">' +
    '<p class="eyebrow">Подкаст</p>' +
    '<h1>' + esc(show.title) + '</h1>' +
    '<p class="cast-show-host">' + esc(show.host) + ' · ' + esc(P.epLabel(show.episodes)) + '</p>' +
    '<p class="cast-show-blurb">' + esc(show.blurb) + '</p>' +
    '<button type="button" class="cast-open" id="cast-open">Открыть подкаст</button>' +
    '</div></div>' +
    '<p class="cast-back"><a class="text-link" href="audio.html">← Все подкасты</a></p>';

  var btn = document.getElementById('cast-open');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var sheet = document.getElementById('cast-soon');
    if (sheet) {
      sheet.hidden = false;
      return;
    }
    sheet = document.createElement('div');
    sheet.id = 'cast-soon';
    sheet.className = 'cast-soon';
    sheet.innerHTML =
      '<div class="cast-soon-card">' +
      '<p class="eyebrow">Плеер</p>' +
      '<h2>' + esc(show.title) + '</h2>' +
      '<p>Появится позже в плеере</p>' +
      '<button type="button" class="cast-soon-close" id="cast-soon-close">Понятно</button>' +
      '</div>';
    document.body.appendChild(sheet);
    document.getElementById('cast-soon-close').addEventListener('click', function () {
      sheet.hidden = true;
    });
    sheet.addEventListener('click', function (e) {
      if (e.target === sheet) sheet.hidden = true;
    });
  });
})();
