(function () {
  'use strict';
  var V = window.Vera;
  var BASE = 'https://storage.yandexcloud.net/fidesetratio/crupa/';

  var FILES = [
    ['Проповедь в I Воскресенье Адвента 30.11.2025.mp3', '26:43'],
    ['Проповедь в II Воскресенье Адвента 07.12.2025.mp3', '24:45'],
    ['Проповедь в XIX Рядовое Воскресенье 10.08.2025.mp3', '32:54'],
    ['Проповедь в XVIII Рядовое Воскресенье 03.08.2025.mp3', '28:11'],
    ['Проповедь в XX Рядовое Воскресенье 17.08.2025.mp3', '28:47'],
    ['Проповедь в XXI Рядовое Воскресенье 24.08.2025.mp3', '35:55'],
    ['Проповедь в XXVII Рядовое Воскресенье 05.10.2025.mp3', '35:29'],
    ['Проповедь в XXVIII Рядовое Воскресенье 12.10.2025.mp3', '21:33'],
    ['Проповедь в XXX Рядовое Воскресенье 26.10.2025.mp3', '26:08'],
    ['Проповедь в XXXIII Рядовое Воскресенье 16.11.2025.mp3', '22:01'],
    ['Проповедь в День освящения храма 19.10.2025.mp3', '31:14'],
    ['Проповедь в Праздник Освящения Латеранской Базилики 09.11.2025.mp3', '17:32'],
    ['Проповедь в Праздник Преображения Господня 06.08.2025.mp3', '19:11'],
    ['Проповедь в Торжество Всех Святых 01.11.2025.mp3', '23:30'],
    ['Проповедь в Торжество Непорочного Зачатия Пресвятой Девы Марии.mp3', '31:20'],
    ['Проповедь в Торжество Св.Доминика 08.08.2025.mp3', '35:01'],
    ['Проповедь на Поминовение Всех Усопших Верных 02.11.2025.mp3', '34:28'],
  ];

  function titleOf(file) {
    return file.replace(/\.mp3$/i, '').replace(/\s+\d{2}\.\d{2}\.\d{4}$/, '').trim();
  }

  var list = document.getElementById('audio-list');
  var bar = document.getElementById('audio-bar');
  var now = document.getElementById('audio-now');
  var el = document.getElementById('audio-el');

  if (!list) return;

  list.innerHTML = FILES.map(function (pair, i) {
    var file = pair[0];
    var dur = pair[1];
    return (
      '<button type="button" class="audio-row" data-i="' +
      i +
      '">' +
      '<span class="audio-index">' +
      String(i + 1).padStart(2, '0') +
      '</span>' +
      '<span class="audio-meta"><strong>' +
      (V ? V.escapeHtml(titleOf(file)) : titleOf(file)) +
      '</strong><em>о. Павел Крупа · ' +
      dur +
      '</em></span>' +
      '<span class="audio-play">▶</span></button>'
    );
  }).join('');

  list.addEventListener('click', function (e) {
    var btn = e.target.closest('.audio-row');
    if (!btn || !el) return;
    var i = Number(btn.getAttribute('data-i'));
    var file = FILES[i][0];
    var url = BASE + encodeURIComponent(file);
    el.src = url;
    if (now) now.textContent = titleOf(file);
    if (bar) bar.hidden = false;
    list.querySelectorAll('.audio-row').forEach(function (r) {
      r.classList.toggle('active', r === btn);
    });
    el.play().catch(function () {});
  });
})();
