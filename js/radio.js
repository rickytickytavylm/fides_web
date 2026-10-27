(function () {
  'use strict';
  var audio = document.getElementById('radio-el');
  var btn = document.getElementById('radio-play');
  var stage = document.querySelector('.radio-stage');
  if (!audio || !btn || !stage) return;

  function sync() {
    stage.classList.toggle('is-on', !audio.paused);
    btn.setAttribute('aria-label', audio.paused ? 'Слушать эфир' : 'Пауза');
  }

  btn.addEventListener('click', function () {
    if (audio.paused) audio.play().catch(function () {});
    else audio.pause();
  });
  audio.addEventListener('play', sync);
  audio.addEventListener('pause', sync);
})();
